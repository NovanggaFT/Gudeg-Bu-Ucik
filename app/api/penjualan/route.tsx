// app/api/penjualan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ========================================
// GET: Ambil data penjualan
// ========================================
export async function GET() {
  try {
    const salesData = await prisma.dataPenjualan.findFirst({
      include: {
        realisasi: {
          orderBy: { tanggal: 'asc' },
        },
        riwayatBelanja: {
          orderBy: { tanggal: 'asc' },
        },
      },
    });

    if (!salesData) {
      return NextResponse.json({
        status: '❌ Data tidak ditemukan',
      }, { status: 404 });
    }

    // Transform data untuk frontend
    const transformedData = {
      ...salesData,
      realisasi: salesData.realisasi.map((r) => ({
        ...r,
        hariNama: new Date(r.tanggal).toLocaleDateString('id-ID', { 
          weekday: 'long' 
        }),
      })),
    };

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: transformedData,
    });
  } catch (error: any) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ========================================
// POST: Tambah/update penjualan
// ========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, terjual } = body;

    // Validasi
    if (!tanggal) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal wajib diisi',
      }, { status: 400 });
    }

    if (terjual === undefined || terjual === null || terjual < 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Jumlah terjual harus lebih dari 0',
      }, { status: 400 });
    }

    // Ambil data master
    const master = await prisma.dataPenjualan.findFirst();
    if (!master) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Data master tidak ditemukan',
      }, { status: 404 });
    }

    // Parse tanggal
    const tanggalObj = new Date(tanggal);
    tanggalObj.setHours(0, 0, 0, 0);

    // Cari hari sebelumnya untuk stok awal
    const hariSebelumnya = await prisma.realisasiHarian.findFirst({
      where: {
        tanggal: { lt: tanggalObj },
        dataPenjualanId: master.id,
      },
      orderBy: { tanggal: 'desc' },
    });

    const stokSebelumnya = hariSebelumnya?.sisa || 0;

    // Cari total belanja di hari ini
    const startOfDay = new Date(tanggalObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tanggalObj);
    endOfDay.setHours(23, 59, 59, 999);

    const allBelanja = await prisma.riwayatBelanja.findMany({
      where: {
        tanggal: { gte: startOfDay, lte: endOfDay },
        dataPenjualanId: master.id,
      },
    });

    let totalBelanjaEfektif = 0;
    for (const b of allBelanja) {
      totalBelanjaEfektif += (b.jumlah || b.jumlahSystem || 0);
    }

    const stokAwal = stokSebelumnya + totalBelanjaEfektif;
    const sisa = Math.max(0, stokAwal - terjual);

    // Tentukan status
    let status: 'aman' | 'waspada' | 'habis' = 'habis';
    if (sisa === 0) {
      status = 'habis';
    } else if (sisa < master.targetHarian) {
      status = 'waspada';
    } else {
      status = 'aman';
    }

    const perluBelanja = sisa < master.thresholdBelanja;

    // Upsert realisasi harian
    const realisasi = await prisma.realisasiHarian.upsert({
      where: {
        tanggal_dataPenjualanId: {
          tanggal: tanggalObj,
          dataPenjualanId: master.id,
        },
      },
      update: {
        terjual,
        sisa,
        stokAwal,
        status,
        perluBelanja,
      },
      create: {
        tanggal: tanggalObj,
        terjual,
        sisa,
        stokAwal,
        status,
        perluBelanja,
        dataPenjualanId: master.id,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: realisasi,
      message: `Penjualan tanggal ${tanggal} berhasil disimpan`,
    });
  } catch (error: any) {
    console.error('Error creating/updating penjualan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}