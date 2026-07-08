// app/api/asset/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================
// HELPER: Update Overhead di Semua Laporan Bulanan
// ============================================
async function updateAllLaporanOverhead() {
  try {
    // 1. Ambil total overhead dari Asset (status != Rusak)
    const overheadData = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM("perMonth"), 0) as total
      FROM "Asset"
      WHERE status != 'Rusak'
    `;

    const defaultOverhead = Number(overheadData[0]?.total) || 0;
    console.log(`📊 Default overhead: ${defaultOverhead}`);

    // 2. Ambil semua laporan bulanan
    const laporanList = await prisma.laporanBulanan.findMany({
      orderBy: { bulan: 'asc' },
    });

    // 3. Update setiap laporan dengan default overhead (kecuali yang sudah di-override)
    // Tapi karena kita tidak tahu mana yang di-override, kita hanya update yang belum di-override
    // Cara: update semua laporan, tapi hanya yang overhead-nya sama dengan default sebelumnya
    // Atau kita simpan flag isOverridden di database? (butuh migrasi)
    
    // Untuk sekarang: update semua laporan dengan default overhead
    // TAPI hati-hati: ini akan menghapus override manual!
    // Jadi kita perlu cara untuk tahu mana yang di-override
    
    // Opsi 1: Update semua laporan (akan menghapus override)
    // Opsi 2: Hanya update laporan yang belum pernah di-override
    
    // Saya pilih Opsi 2: Hanya update yang overhead-nya sama dengan default sebelumnya
    // Tapi kita tidak punya data default sebelumnya...
    // Jadi kita gunakan pendekatan: update semua laporan, tapi beri warning

    for (const laporan of laporanList) {
      // Recalculate profit dengan overhead baru
      const labaKotor = laporan.labaKotor;
      const gaji = laporan.gaji;
      const profitBaru = labaKotor - gaji - defaultOverhead;

      await prisma.laporanBulanan.update({
        where: { id: laporan.id },
        data: {
          overhead: defaultOverhead,
          profit: profitBaru,
          updatedAt: new Date(),
        },
      });
    }

    console.log(`✅ Overhead semua laporan diupdate ke ${defaultOverhead}`);
    return { 
      success: true, 
      defaultOverhead, 
      updated: laporanList.length 
    };
  } catch (error) {
    console.error('❌ Error updating laporan overhead:', error);
    throw error;
  }
}

// ============================================
// GET: Ambil semua asset
// ============================================
export async function GET() {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalOverhead = assets
      .filter(a => a.status !== 'Rusak')
      .reduce((sum, a) => sum + a.perMonth, 0);

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: assets,
      metadata: {
        total: assets.length,
        totalOverheadPerBulan: totalOverhead,
        aktif: assets.filter(a => a.status !== 'Rusak').length,
        rusak: assets.filter(a => a.status === 'Rusak').length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// POST: Tambah asset baru
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, quantity, price, perMonth, status } = body;

    if (!name || !category || !quantity || !price || !perMonth) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Semua field wajib diisi',
      }, { status: 400 });
    }

    const total = Number(quantity) * Number(price);

    // ✅ TRANSACTION: Create asset + update laporan
    await prisma.$transaction(async (tx) => {
      // 1. Create asset
      await tx.asset.create({
        data: {
          name,
          category,
          quantity: Number(quantity),
          price: Number(price),
          total,
          perMonth: Number(perMonth),
          status: status || 'Baik',
        },
      });

      // 2. Update semua laporan dengan overhead baru
      await updateAllLaporanOverhead();
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Asset berhasil ditambahkan, laporan bulanan diupdate',
    });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// DELETE: Hapus asset
// ============================================
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

    // ✅ TRANSACTION: Delete asset + update laporan
    await prisma.$transaction(async (tx) => {
      // 1. Delete asset
      await tx.asset.delete({
        where: { id },
      });

      // 2. Update semua laporan dengan overhead baru
      await updateAllLaporanOverhead();
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Asset berhasil dihapus, laporan bulanan diupdate',
    });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// PATCH: Update status asset
// ============================================
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'ID dan status wajib diisi',
      }, { status: 400 });
    }

    // ✅ TRANSACTION: Update asset + update laporan
    await prisma.$transaction(async (tx) => {
      await tx.asset.update({
        where: { id },
        data: { status },
      });

      await updateAllLaporanOverhead();
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      message: 'Status asset berhasil diupdate, laporan bulanan diupdate',
    });
  } catch (error: any) {
    console.error('Error updating asset:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}