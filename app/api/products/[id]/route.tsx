// app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET: Detail produk + bahan baku (untuk view resep)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.produk.findUnique({
      where: { id },
      include: {
        bahanBaku: {
          include: {
            bahanBaku: {
              select: {
                id: true,
                nama: true,
                satuan: true,
                harga: true,
                stok: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Produk tidak ditemukan',
      }, { status: 404 });
    }

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: product,
    });
  } catch (error: any) {
    console.error('Error fetching product detail:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// PUT: Update produk
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, sku, hpp, hargaJual, targetStok, isActive } = body;

    const product = await prisma.produk.update({
      where: { id },
      data: {
        nama,
        sku,
        hpp: Number(hpp),
        hargaJual: Number(hargaJual),
        targetStok: Number(targetStok) || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: product,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE: Hapus produk
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.produk.delete({
      where: { id },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Produk berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}