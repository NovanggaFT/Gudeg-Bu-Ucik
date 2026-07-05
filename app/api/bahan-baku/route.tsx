// app/api/bahan-baku/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Ambil semua bahan baku
export async function GET() {
  try {
    const bahanBaku = await prisma.bahanBaku.findMany({
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: bahanBaku,
      count: bahanBaku.length,
    });
  } catch (error: any) {
    console.error('Error fetching bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// POST: Tambah bahan baku baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, satuan, harga, stokMinimal } = body;

    if (!nama || !satuan || !harga) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Nama, satuan, dan harga wajib diisi',
      }, { status: 400 });
    }

    // Cek duplikat
    const existing = await prisma.bahanBaku.findUnique({
      where: { nama },
    });

    if (existing) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `Bahan baku "${nama}" sudah ada`,
      }, { status: 400 });
    }

    const bahanBaku = await prisma.bahanBaku.create({
      data: {
        nama,
        satuan,
        harga: Number(harga),
        stok: 0,
        stokMinimal: Number(stokMinimal) || 0,
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: bahanBaku,
      message: `Bahan baku "${nama}" berhasil ditambahkan`,
    });
  } catch (error: any) {
    console.error('Error creating bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// PUT: Update bahan baku
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, satuan, harga, stokMinimal } = body;

    if (!id) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID wajib diisi',
      }, { status: 400 });
    }

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
      message: `Bahan baku "${nama}" berhasil diupdate`,
    });
  } catch (error: any) {
    console.error('Error updating bahan baku:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE: Hapus bahan baku
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID wajib diisi',
      }, { status: 400 });
    }

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