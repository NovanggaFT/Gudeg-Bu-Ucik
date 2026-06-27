// app/api/pembelian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

function calculateBelanja(data: {
  jumlah?: number
  total?: number
  hppPerPorsi: number
}) {
  const { jumlah, total, hppPerPorsi } = data
  
  // Validasi: minimal salah satu diisi
  if (!jumlah && !total) {
    throw new Error('Isi salah satu: Jumlah atau Total')
  }
  
  // Skenario 1: User isi jumlah saja
  if (jumlah && !total) {
    return {
      jumlah,
      total: null,
      jumlahSystem: null,
      totalSystem: jumlah * hppPerPorsi,
    }
  }
  
  // Skenario 2: User isi total saja
  if (total && !jumlah) {
    return {
      jumlah: null,
      total,
      jumlahSystem: Math.floor(total / hppPerPorsi),
      totalSystem: null,
    }
  }
  
  // Skenario 3: User isi keduanya
  if (jumlah && total) {
    return {
      jumlah,
      total,
      jumlahSystem: null,
      totalSystem: null,
    }
  }
  
  return null
}

// GET: Ambil semua data pembelian
export async function GET() {
  try {
    const pembelian = await prisma.riwayatBelanja.findMany({
      orderBy: { tanggal: 'asc' },
      include: {
        dataPenjualan: {
          select: {
            hppPerPorsi: true,
            hargaJualPerPorsi: true,
          }
        }
      }
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
    const { tanggal, jumlah, total, keterangan } = body;

    // Validasi tanggal
    if (!tanggal) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal wajib diisi',
      }, { status: 400 });
    }

    // Ambil data master untuk hppPerPorsi
    const master = await prisma.dataPenjualan.findFirst();
    if (!master) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Data master tidak ditemukan',
      }, { status: 404 });
    }

    // Hitung otomatis
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

    // Simpan ke database
    const pembelian = await prisma.riwayatBelanja.create({
      data: {
        tanggal: new Date(tanggal),
        jumlah: result.jumlah,
        total: result.total,
        jumlahSystem: result.jumlahSystem,
        totalSystem: result.totalSystem,
        hppPerPorsi: master.hppPerPorsi,
        keterangan: keterangan || null,
        dataPenjualanId: master.id,
      },
    });

    // ✅ UPDATE STOK AWAL DI REALISASI HARIAN
    // Ambil realisasi hari ini
    const startOfDay = new Date(tanggal);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tanggal);
    endOfDay.setHours(23, 59, 59, 999);

    const realisasiHariIni = await prisma.realisasiHarian.findUnique({
      where: {
        tanggal_dataPenjualanId: {
          tanggal: startOfDay,
          dataPenjualanId: master.id,
        },
      },
    });

    if (realisasiHariIni) {
      // Hitung total belanja di hari ini (termasuk yang baru)
      const totalBelanjaHariIni = await prisma.riwayatBelanja.aggregate({
        where: {
          tanggal: { gte: startOfDay, lte: endOfDay },
          dataPenjualanId: master.id,
        },
        _sum: {
          // Prioritas: jumlah manual, lalu jumlahSystem
          // Kita hitung manual di aplikasi
        }
      });

      // Hitung ulang stokAwal dan sisa
      // Cari hari sebelumnya
      const hariSebelumnya = await prisma.realisasiHarian.findFirst({
        where: {
          tanggal: { lt: startOfDay },
          dataPenjualanId: master.id,
        },
        orderBy: { tanggal: 'desc' },
      });

      const stokSebelumnya = hariSebelumnya?.sisa || 0;
      
      // Hitung total belanja hari ini (dari semua transaksi)
      const allBelanja = await prisma.riwayatBelanja.findMany({
        where: {
          tanggal: { gte: startOfDay, lte: endOfDay },
          dataPenjualanId: master.id,
        },
      });

      let totalBelanjaEfektif = 0;
      for (const b of allBelanja) {
        // Prioritas: jumlah manual > jumlahSystem
        totalBelanjaEfektif += (b.jumlah || b.jumlahSystem || 0);
      }

      const stokAwalBaru = stokSebelumnya + totalBelanjaEfektif;
      const sisaBaru = stokAwalBaru - realisasiHariIni.terjual;

      // Update realisasi
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
      message: 'Pembelian berhasil ditambahkan',
    });
  } catch (error: any) {
    console.error('Error creating pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}