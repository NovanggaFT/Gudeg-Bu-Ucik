// app/api/products/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Ambil semua produk (untuk dropdown & management)
export async function GET() {
  try {
    const products = await prisma.produk.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' },
      select: {
        id: true,
        nama: true,
        sku: true,
        hpp: true,
        hargaJual: true,
        stok: true,
        targetStok: true,
        isActive: true,
        // ✅ JANGAN include bahanBaku di sini (biar ringan)
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: products,
      count: products.length,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// POST: Tambah produk baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, sku, hpp, hargaJual, targetStok } = body;

    if (!nama || !sku || !hpp || !hargaJual) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Nama, SKU, HPP, dan Harga Jual wajib diisi',
      }, { status: 400 });
    }

    const product = await prisma.produk.create({
      data: {
        nama,
        sku,
        hpp: Number(hpp),
        hargaJual: Number(hargaJual),
        targetStok: Number(targetStok) || 0,
        stok: 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: product,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}