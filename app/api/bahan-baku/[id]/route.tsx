// app/api/bahan-baku/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// GET: Ambil detail bahan baku
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bahanBaku = await prisma.bahanBaku.findUnique({
      where: { id },
    });

    if (!bahanBaku) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Bahan baku tidak ditemukan',
      }, { status: 404 });
    }

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: bahanBaku,
    });
  } catch (error: any) {
    console.error('Error fetching bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// PUT: Update bahan baku via ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, satuan, harga, stokMinimal } = body;

    const bahanBaku = await prisma.bahanBaku.update({
      where: { id },
      data: {
        nama,
        satuan,
        harga: Number(harga),
        stokMinimal: Number(stokMinimal) || 0,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: bahanBaku,
    });
  } catch (error: any) {
    console.error('Error updating bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE: Hapus bahan baku via ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.bahanBaku.delete({
      where: { id },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Bahan baku berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}