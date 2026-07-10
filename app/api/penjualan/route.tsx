// app/api/penjualan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================
// HELPER: Update Laporan Bulanan
// ============================================
async function updateLaporanBulanan(tanggal: Date) {
  try {
    const year = tanggal.getUTCFullYear();
    const month = tanggal.getUTCMonth() + 1;
    const bulanStr = `${year}-${String(month).padStart(2, '0')}`;
    const bulanDate = new Date(Date.UTC(year, month - 1, 1));
    
    console.log(`📊 Updating laporan untuk ${bulanStr}`);

    // ========== 1. Ambil data penjualan ==========
    const penjualans = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Penjualan"
      WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${bulanDate}::timestamp)
    `;

    let totalQty = 0;
    let totalRevenue = 0;

    for (const p of penjualans) {
      const qty = Number(p.qty);
      totalQty += qty;
      totalRevenue += Number(p.hargaJual) * qty;
    }

    // ========== 2. Ambil cost dari pembelian ==========
    const pembelianBahan = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(total), 0) as total
      FROM "PembelianBahanBaku"
      WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${bulanDate}::timestamp)
    `;

    const totalPembelianBahan = Number(pembelianBahan[0]?.total) || 0;

    const pembelianReguler = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(total), 0) as total
      FROM "Pembelian"
      WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${bulanDate}::timestamp)
    `;

    const totalPembelianReguler = Number(pembelianReguler[0]?.total) || 0;

    // ========== 3. Ambil gaji ==========
    const gajiData = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(gaji), 0) as total
      FROM "Penggajian"
      WHERE DATE_TRUNC('month', "tanggal_penggajian") = DATE_TRUNC('month', ${bulanDate}::timestamp)
    `;

    const totalGaji = Number(gajiData[0]?.total) || 0;

    // ========== 4. Ambil overhead ==========
    const existingLaporan = await prisma.laporanBulanan.findFirst({
      where: {
        bulan: {
          equals: bulanDate,
        },
      },
    });

    let overhead = 0;
    
    if (existingLaporan) {
      overhead = existingLaporan.overhead;
    } else {
      const overheadData = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM("perMonth"), 0) as total
        FROM "Asset"
        WHERE status != 'Rusak'
      `;
      overhead = Number(overheadData[0]?.total) || 0;
    }

    // ========== 5. HITUNG ==========
    const labaKotor = totalRevenue; // ✅ Laba Kotor = Total Pendapatan
    const totalCostProduksi = totalPembelianBahan + totalPembelianReguler;
    const profit = totalRevenue - totalCostProduksi - overhead - totalGaji;
    const costPerPortion = totalQty > 0 ? Math.round(totalCostProduksi / totalQty) : 0;

    // ========== 6. Save ==========
    const existing = await prisma.laporanBulanan.findFirst({
      where: {
        bulan: {
          equals: bulanDate,
        },
      },
    });

    if (existing) {
      await prisma.laporanBulanan.update({
        where: { id: existing.id },
        data: {
          qtyProduksi: totalQty,
          costPerPortion: costPerPortion,
          jumlahCost: totalCostProduksi,
          gaji: totalGaji,
          labaKotor: labaKotor,
          profit: profit,
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.laporanBulanan.create({
        data: {
          bulan: bulanDate,
          qtyProduksi: totalQty,
          costPerPortion: costPerPortion,
          jumlahCost: totalCostProduksi,
          overhead: overhead,
          gaji: totalGaji,
          labaKotor: labaKotor,
          profit: profit,
        },
      });
    }

    console.log(`✅ Laporan ${bulanStr} selesai`);
    return { success: true, totalQty, totalRevenue, labaKotor, profit };
  } catch (error) {
    console.error('❌ Error updating laporan bulanan:', error);
    throw error;
  }
}

// ============================================
// HELPER: Cek Stok Bahan Baku dari Resep
// ============================================
async function checkBahanBakuStok(produkId: string, qtyProduk: number) {
  const resep = await prisma.produkBahanBaku.findMany({
    where: { produkId },
    include: {
      bahanBaku: true,
    },
  });

  if (resep.length === 0) {
    return {
      cukup: true,
      details: [],
      message: 'Produk tidak memiliki resep',
    };
  }

  const insufficient: any[] = [];

  for (const item of resep) {
    const totalBahanDibutuhkan = item.qty * qtyProduk;
    const stokTersedia = Number(item.bahanBaku.stok);

    if (stokTersedia < totalBahanDibutuhkan) {
      insufficient.push({
        bahanBakuId: item.bahanBaku.id,
        nama: item.bahanBaku.nama,
        satuan: item.bahanBaku.satuan,
        stokTersedia,
        dibutuhkan: totalBahanDibutuhkan,
        kekurangan: totalBahanDibutuhkan - stokTersedia,
      });
    }
  }

  return {
    cukup: insufficient.length === 0,
    details: insufficient,
    message: insufficient.length === 0
      ? '✅ Semua bahan baku cukup'
      : `❌ ${insufficient.length} bahan baku tidak cukup`,
  };
}

// ============================================
// GET: Ambil semua data penjualan
// ============================================
export async function GET() {
  try {
    const penjualan = await prisma.penjualan.findMany({
      orderBy: { tanggal: 'desc' },
      include: {
        produk: {
          select: {
            id: true,
            nama: true,
            sku: true,
            hpp: true,
            hargaJual: true,
            stok: true,
          },
        },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: penjualan,
      count: penjualan.length,
    });
  } catch (error: any) {
    console.error('Error fetching penjualan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// ============================================
// POST: Tambah penjualan baru
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, produkId, qty, hargaJual, hpp, profit } = body;

    console.log('📝 Creating penjualan:', { tanggal, produkId, qty });

    if (!tanggal || !produkId || !qty) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal, produk, dan qty wajib diisi',
      }, { status: 400 });
    }

    const qtyNum = Number(qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Qty harus lebih dari 0',
      }, { status: 400 });
    }

    const produk = await prisma.produk.findUnique({
      where: { id: produkId },
      include: {
        bahanBaku: {
          include: {
            bahanBaku: true,
          },
        },
      },
    });

    if (!produk) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Produk tidak ditemukan',
      }, { status: 404 });
    }

    const stokProdukSaatIni = Number(produk.stok);
    if (stokProdukSaatIni < qtyNum) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: `Stok produk tidak mencukupi! Stok tersisa: ${stokProdukSaatIni}`,
        data: {
          stokTersedia: stokProdukSaatIni,
          qtyDiminta: qtyNum,
          kekurangan: qtyNum - stokProdukSaatIni,
        },
      }, { status: 400 });
    }

    const cekBahanBaku = await checkBahanBakuStok(produkId, qtyNum);
    if (!cekBahanBaku.cukup) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Stok bahan baku tidak mencukupi!',
        data: {
          insufficient: cekBahanBaku.details,
        },
      }, { status: 400 });
    }

    const hargaJualFinal = hargaJual || produk.hargaJual;
    const hppFinal = hpp || produk.hpp;
    const profitFinal = profit || ((hargaJualFinal - hppFinal) * qtyNum);

    const tanggalObj = new Date(tanggal);

    const result = await prisma.$transaction(async (tx) => {
      const penjualan = await tx.penjualan.create({
        data: {
          tanggal: tanggalObj,
          produkId: produkId,
          qty: qtyNum,
          hargaJual: Number(hargaJualFinal),
          hpp: Number(hppFinal),
          profit: Number(profitFinal),
        },
        include: {
          produk: {
            select: {
              id: true,
              nama: true,
              sku: true,
            },
          },
        },
      });

      // Kurangi stok produk
      await tx.produk.update({
        where: { id: produkId },
        data: { stok: stokProdukSaatIni - qtyNum },
      });

      // Kurangi stok bahan baku
      const bahanBakuUpdates = [];
      for (const item of produk.bahanBaku) {
        const totalBahanDikurangi = item.qty * qtyNum;
        bahanBakuUpdates.push(
          tx.bahanBaku.update({
            where: { id: item.bahanBakuId },
            data: { stok: { decrement: totalBahanDikurangi } },
          })
        );
      }
      await Promise.all(bahanBakuUpdates);

      return penjualan;
    });

    await updateLaporanBulanan(tanggalObj);

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: result,
      message: `Penjualan berhasil! Stok produk tersisa: ${stokProdukSaatIni - qtyNum}`,
      metadata: {
        stokProdukSebelum: stokProdukSaatIni,
        stokProdukSesudah: stokProdukSaatIni - qtyNum,
        qtyTerjual: qtyNum,
      },
    });
  } catch (error: any) {
    console.error('Error creating penjualan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message || 'Terjadi kesalahan saat menyimpan data',
    }, { status: 500 });
  }
}

// ============================================
// DELETE: Hapus penjualan (restore stok)
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

    await prisma.$transaction(async (tx) => {
      await tx.penjualan.delete({
        where: { id },
      });

      // Restore stok produk
      await tx.produk.update({
        where: { id: produk.id },
        data: { stok: { increment: qtyNum } },
      });

      // Restore stok bahan baku
      const bahanBakuUpdates = [];
      for (const item of produk.bahanBaku) {
        const totalBahanDikembalikan = item.qty * qtyNum;
        bahanBakuUpdates.push(
          tx.bahanBaku.update({
            where: { id: item.bahanBakuId },
            data: { stok: { increment: totalBahanDikembalikan } },
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