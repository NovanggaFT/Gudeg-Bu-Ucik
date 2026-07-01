// app/api/pembelian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

function calculateBelanja(data: {
  jumlah?: number;
  total?: number;
  hppPerPorsi: number;
}) {
  const { jumlah, total, hppPerPorsi } = data;

  if (!jumlah && !total) {
    throw new Error('Isi salah satu: Jumlah atau Total');
  }

  if (jumlah && !total) {
    return {
      jumlah,
      total: null,
      jumlahSystem: null,
      totalSystem: jumlah * hppPerPorsi,
    };
  }

  if (total && !jumlah) {
    return {
      jumlah: null,
      total,
      jumlahSystem: Math.floor(total / hppPerPorsi),
      totalSystem: null,
    };
  }

  if (jumlah && total) {
    return {
      jumlah,
      total,
      jumlahSystem: null,
      totalSystem: null,
    };
  }

  return null;
}

// GET: Ambil semua data pembelian
export async function GET() {
  try {
    const pembelian = await prisma.riwayatBelanja.findMany({
      orderBy: { tanggal: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            hppPerPorsi: true,
            hargaJualPerPorsi: true,
          },
        },
        masterData: {
          select: {
            id: true,
            tanggalBerlaku: true,
            hppPerPorsi: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: pembelian,
      count: pembelian.length,
    });
  } catch (error: any) {
    console.error('Error fetching pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// POST: Tambah pembelian baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, jumlah, total, keterangan, productId } = body;

    if (!productId) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'productId wajib diisi',
      }, { status: 400 });
    }

    if (!tanggal) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal wajib diisi',
      }, { status: 400 });
    }

    // Cek product
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Produk tidak ditemukan atau tidak aktif',
      }, { status: 404 });
    }

    // Ambil master yang berlaku untuk tanggal ini
    const tanggalObj = new Date(tanggal);
    tanggalObj.setHours(0, 0, 0, 0);

    const master = await prisma.masterData.findFirst({
      where: {
        productId: productId,
        tanggalBerlaku: { lte: tanggalObj },
      },
      orderBy: { tanggalBerlaku: 'desc' },
    });

    if (!master) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `Tidak ada master yang berlaku untuk tanggal ${tanggal}`,
      }, { status: 404 });
    }

    // Hitung otomatis pakai hpp dari master
    const result = calculateBelanja({
      jumlah: jumlah || undefined,
      total: total || undefined,
      hppPerPorsi: master.hppPerPorsi,
    });

    if (!result) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Isi salah satu: Jumlah atau Total',
      }, { status: 400 });
    }

    // Simpan pembelian
    const pembelian = await prisma.riwayatBelanja.create({
      data: {
        tanggal: tanggalObj,
        productId: productId,
        masterDataId: master.id,
        jumlah: result.jumlah,
        total: result.total,
        jumlahSystem: result.jumlahSystem,
        totalSystem: result.totalSystem,
        hppPerPorsi: master.hppPerPorsi,
        keterangan: keterangan || null,
      },
      include: {
        product: {
          select: {
            name: true,
            sku: true,
          },
        },
      },
    });

    // Update stok di realisasi harian (jika ada)
    const realisasiHariIni = await prisma.realisasiHarian.findUnique({
      where: {
        productId_tanggal: {
          productId: productId,
          tanggal: tanggalObj,
        },
      },
    });

    if (realisasiHariIni) {
      // Hitung ulang total belanja di hari ini
      const startOfDay = new Date(tanggalObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(tanggalObj);
      endOfDay.setHours(23, 59, 59, 999);

      const allBelanja = await prisma.riwayatBelanja.findMany({
        where: {
          productId: productId,
          tanggal: { gte: startOfDay, lte: endOfDay },
        },
      });

      let totalBelanjaEfektif = 0;
      for (const b of allBelanja) {
        totalBelanjaEfektif += (b.jumlah || b.jumlahSystem || 0);
      }

      // Cari hari sebelumnya
      const hariSebelumnya = await prisma.realisasiHarian.findFirst({
        where: {
          productId: productId,
          tanggal: { lt: tanggalObj },
        },
        orderBy: { tanggal: 'desc' },
      });

      const stokSebelumnya = hariSebelumnya?.sisa || 0;
      const stokAwalBaru = stokSebelumnya + totalBelanjaEfektif;
      const sisaBaru = stokAwalBaru - realisasiHariIni.terjual;

      await prisma.realisasiHarian.update({
        where: {
          id: realisasiHariIni.id,
        },
        data: {
          stokAwal: stokAwalBaru,
          sisa: sisaBaru,
          status: sisaBaru === 0 ? 'habis' 
            : sisaBaru < master.targetHarian ? 'waspada' 
            : 'aman',
          perluBelanja: sisaBaru < master.thresholdBelanja,
        },
      });
    }

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: pembelian,
      message: `Pembelian untuk ${pembelian.product.name} berhasil ditambahkan`,
    });
  } catch (error: any) {
    console.error('Error creating pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}