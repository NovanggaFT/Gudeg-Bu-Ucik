// app/api/penjualan/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// ============================================
// HELPER: Update Laporan Bulanan (sama seperti di atas)
// ============================================
async function updateLaporanBulanan(tanggal: Date) {
  // ... (sama seperti di atas)
}

// ============================================
// DELETE
// ============================================
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

    const penjualan = await prisma.penjualan.findUnique({
      where: { id },
      include: {
        produk: {
          include: {
            bahanBaku: {
              include: {
                bahanBaku: true,
              },
            },
          },
        },
      },
    });

    if (!penjualan) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Data penjualan tidak ditemukan',
      }, { status: 404 });
    }

    const tanggalObj = penjualan.tanggal;
    const qtyNum = Number(penjualan.qty);
    const produk = penjualan.produk;

    // ✅ TRANSACTION
    await prisma.$transaction(async (tx) => {
      // 1. Delete penjualan
      await tx.penjualan.delete({
        where: { id },
      });

      // 2. Restore stok produk
      const stokProdukSaatIni = Number(produk.stok);
      const stokProdukBaru = stokProdukSaatIni + qtyNum;

      await tx.produk.update({
        where: { id: produk.id },
        data: { stok: stokProdukBaru },
      });

      // 3. Restore stok bahan baku
      const bahanBakuUpdates = [];
      for (const item of produk.bahanBaku) {
        const totalBahanDikembalikan = item.qty * qtyNum;
        const stokSaatIni = Number(item.bahanBaku.stok);
        const stokBaru = stokSaatIni + totalBahanDikembalikan;

        bahanBakuUpdates.push(
          tx.bahanBaku.update({
            where: { id: item.bahanBakuId },
            data: { stok: stokBaru },
          })
        );
      }
      await Promise.all(bahanBakuUpdates);
    });

    await updateLaporanBulanan(tanggalObj);

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Data berhasil dihapus, stok produk & bahan baku dikembalikan',
    });
  } catch (error: any) {
    console.error('Error deleting penjualan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}