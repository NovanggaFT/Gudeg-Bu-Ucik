// app/api/pembelian/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID wajib diisi',
      }, { status: 400 });
    }

    // Ambil data pembelian sebelum dihapus
    const pembelian = await prisma.pembelian.findUnique({
      where: { id },
    });

    if (!pembelian) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Data pembelian tidak ditemukan',
      }, { status: 404 });
    }

    // ✅ HAPUS LOGIKA ROLLBACK STOK (karena tidak ada relasi)
    // Stok bahan baku diupdate melalui pembelianBahanBaku terpisah
    // Jika perlu rollback, harus di tabel PembelianBahanBaku

    // Hapus data pembelian
    await prisma.pembelian.delete({
      where: { id },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Data pembelian berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}