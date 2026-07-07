// app/api/products/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await prisma.produk.findMany({
      include: {
        bahanBaku: {
          include: {
            bahanBaku: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    // Hitung ulang HPP dari resep untuk validasi
    const produkWithHPP = data.map(produk => {
      let calculatedHPP = 0;
      for (const item of produk.bahanBaku) {
        calculatedHPP += Math.round(item.qty * item.bahanBaku.harga);
      }
      
      return {
        ...produk,
        calculatedHPP,
        hppDiff: calculatedHPP - produk.hpp,
      };
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: produkWithHPP,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}