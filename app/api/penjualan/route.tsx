// app/api/sales/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

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
      // Tambahkan field komputasi jika perlu
      realisasi: salesData.realisasi.map((item) => ({
        ...item,
        // Nama hari dari tanggal
        hariNama: new Date(item.tanggal).toLocaleDateString('id-ID', { 
          weekday: 'long' 
        }),
      })),
      riwayatBelanja: salesData.riwayatBelanja.map((item) => ({
        ...item,
        // Total belanja yang efektif (prioritas manual)
        totalEfektif: item.jumlah || item.jumlahSystem || 0,
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