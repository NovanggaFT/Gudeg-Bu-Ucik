// app/api/laporan-bulanan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await prisma.laporanBulanan.findMany({
      orderBy: { bulan: 'asc' },
    });

    // Format data untuk response
    const formattedData = data.map(item => ({
      id: item.id,
      bulan: item.bulan.toLocaleDateString('id-ID', { 
        month: 'long', 
        year: 'numeric' 
      }),
      bulanKey: item.bulan.toISOString().substring(0, 7),
      qtyProduksi: item.qtyProduksi,
      costPerPortion: item.costPerPortion,
      jumlahCost: item.jumlahCost,
      overhead: item.overhead,
      gaji: item.gaji,
      labaKotor: item.labaKotor,
      profit: item.profit,
    }));

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: formattedData,
    });
  } catch (error: any) {
    console.error('Error fetching laporan bulanan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}