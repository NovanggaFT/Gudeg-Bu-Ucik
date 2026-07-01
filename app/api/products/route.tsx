// app/api/products/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Ambil semua produk aktif
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        masterData: {
          orderBy: { tanggalBerlaku: 'desc' },
          take: 1,
        },
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
    const {
      name,
      description,
      sku,
      hppPerPorsi,
      hargaJualPerPorsi,
      targetHarian,
      stokAwal,
      thresholdBelanja,
    } = body;

    if (!name || !sku) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Nama dan SKU wajib diisi',
      }, { status: 400 });
    }

    // Cek SKU duplicate
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'SKU sudah digunakan',
      }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        sku,
        hppPerPorsi: hppPerPorsi || 13000,
        hargaJualPerPorsi: hargaJualPerPorsi || 15000,
        labaPerPorsi: (hargaJualPerPorsi || 15000) - (hppPerPorsi || 13000),
        targetHarian: targetHarian || 200,
        stokAwal: stokAwal || 500,
        thresholdBelanja: thresholdBelanja || 200,
        isActive: true,
      },
    });

    // Buat master data awal
    await prisma.masterData.create({
      data: {
        productId: product.id,
        tanggalBerlaku: new Date(),
        hppPerPorsi: product.hppPerPorsi,
        hargaJualPerPorsi: product.hargaJualPerPorsi,
        labaPerPorsi: product.labaPerPorsi,
        targetHarian: product.targetHarian,
        stokAwal: product.stokAwal,
        thresholdBelanja: product.thresholdBelanja,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: product,
      message: `Product ${product.name} berhasil dibuat`,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}