// app/api/penjualan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';
import { getMasterByDate } from '@/app/lib/master';

// GET: Ambil data penjualan berdasarkan master aktif
export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Ambil master yang aktif hari ini
    const master = await getMasterByDate(today);
    if (!master) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tidak ada master yang aktif',
      }, { status: 404 });
    }

    // 2. Ambil semua realisasi dari master ini
    const salesData = await prisma.dataPenjualan.findUnique({
      where: { id: master.id },
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

    // 3. Transform data
    const transformedData = {
      ...salesData,
      realisasi: salesData.realisasi.map((r: any) => ({
        ...r,
        hariNama: new Date(r.tanggal).toLocaleDateString('id-ID', { 
          weekday: 'long' 
        }),
      })),
    };

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: transformedData,
      activeMaster: {
        id: master.id,
        tanggalBerlaku: master.tanggalBerlaku,
        hppPerPorsi: master.hppPerPorsi,
        hargaJualPerPorsi: master.hargaJualPerPorsi,
      },
    });
  } catch (error: any) {
    console.error('Error fetching sales data:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}