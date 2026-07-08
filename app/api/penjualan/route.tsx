// app/api/penjualan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// ============================================
// HELPER: Update Laporan Bulanan
// ============================================
async function updateLaporanBulanan(tanggal: Date) {
  try {
    const year = tanggal.getFullYear();
    const month = tanggal.getMonth() + 1;
    const bulanStr = `${year}-${String(month).padStart(2, '0')}`;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    console.log(`📊 Updating laporan untuk ${bulanStr}`);

    // Ambil semua penjualan di bulan tersebut
    const penjualans = await prisma.penjualan.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        produk: {
          select: {
            id: true,
            nama: true,
            hpp: true,
            hargaJual: true,
          },
        },
      },
    });

    let totalPenjualanQty = 0;
    let totalHPP = 0;
    let totalHargaJual = 0;
    let totalProfit = 0;

    for (const p of penjualans) {
      const qty = Number(p.qty);
      totalPenjualanQty += qty;
      totalHPP += Number(p.hpp) * qty;
      totalHargaJual += Number(p.hargaJual) * qty;
      totalProfit += Number(p.profit);
    }

    // Ambil total pembelian bahan baku
    const pembelianBahan = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(total), 0) as total
      FROM "PembelianBahanBaku"
      WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${startDate}::timestamp)
    `;

    const totalPembelianBahan = Number(pembelianBahan[0]?.total) || 0;

    // Ambil total pembelian reguler
    const pembelianReguler = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(total), 0) as total
      FROM "Pembelian"
      WHERE DATE_TRUNC('month', "tanggal") = DATE_TRUNC('month', ${startDate}::timestamp)
    `;

    const totalPembelianReguler = Number(pembelianReguler[0]?.total) || 0;

    // Ambil total gaji
    const gajiData = await prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(gaji), 0) as total
      FROM "Penggajian"
      WHERE DATE_TRUNC('month', "tanggal_penggajian") = DATE_TRUNC('month', ${startDate}::timestamp)
    `;

    const totalGaji = Number(gajiData[0]?.total) || 0;

    // ✅ OVERHEAD: Ambil dari tabel LaporanBulanan yang sudah ada (tidak dihitung ulang)
    // Atau dari Asset jika belum ada
    const existingLaporan = await prisma.laporanBulanan.findFirst({
      where: {
        bulan: {
          equals: new Date(year, month - 1, 1),
        },
      },
    });

    // Jika laporan sudah ada, gunakan overhead yang sudah disimpan
    // Jika belum, ambil dari Asset (total perMonth / 12)
    let overhead = 0;
    
    if (existingLaporan) {
      overhead = existingLaporan.overhead;
    } else {
      // Ambil dari Asset hanya jika belum ada laporan
      const overheadData = await prisma.$queryRaw<{ total: number }[]>`
        SELECT COALESCE(SUM("perMonth"), 0) as total
        FROM "Asset"
        WHERE status != 'Rusak'
      `;
      overhead = Number(overheadData[0]?.total) || 0;
    }

    // Hitung
    const totalCost = totalPembelianBahan + totalPembelianReguler;
    const costPerPortion = totalPenjualanQty > 0 ? Math.round(totalCost / totalPenjualanQty) : 0;
    const labaKotor = totalHargaJual - totalCost;
    const profit = totalHargaJual - totalCost - totalGaji - overhead;

    const bulanDate = new Date(year, month - 1, 1);
    
    // ✅ Update/ Create tanpa mengubah overhead
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
          qtyProduksi: totalPenjualanQty,
          costPerPortion: costPerPortion,
          jumlahCost: totalCost,
          gaji: totalGaji,
          labaKotor: labaKotor,
          profit: profit,
          // ❌ overhead TIDAK diupdate
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.laporanBulanan.create({
        data: {
          bulan: bulanDate,
          qtyProduksi: totalPenjualanQty,
          costPerPortion: costPerPortion,
          jumlahCost: totalCost,
          overhead: overhead, // Pakai dari Asset
          gaji: totalGaji,
          labaKotor: labaKotor,
          profit: profit,
        },
      });
    }

    console.log(`✅ Laporan ${bulanStr} updated (overhead tetap: ${overhead})`);
  } catch (error) {
    console.error('❌ Error updating laporan bulanan:', error);
    throw error;
  }
}

// ============================================
// HELPER: Cek Stok Bahan Baku dari Resep
// ============================================
async function checkBahanBakuStok(produkId: string, qtyProduk: number) {
  // Ambil resep produk
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
// HELPER: Kurangi Stok Bahan Baku
// ============================================
async function reduceBahanBakuStok(produkId: string, qtyProduk: number) {
  const resep = await prisma.produkBahanBaku.findMany({
    where: { produkId },
    include: {
      bahanBaku: true,
    },
  });

  const updates = [];

  for (const item of resep) {
    const totalBahanDikurangi = item.qty * qtyProduk;
    const stokSaatIni = Number(item.bahanBaku.stok);
    const stokBaru = stokSaatIni - totalBahanDikurangi;

    updates.push(
      prisma.bahanBaku.update({
        where: { id: item.bahanBakuId },
        data: { stok: stokBaru },
      })
    );
  }

  await Promise.all(updates);

  return {
    updated: resep.length,
    details: resep.map(item => ({
      nama: item.bahanBaku.nama,
      satuan: item.bahanBaku.satuan,
      dikurangi: item.qty * qtyProduk,
    })),
  };
}

// ============================================
// HELPER: Restore Stok Bahan Baku (Saat Delete)
// ============================================
async function restoreBahanBakuStok(produkId: string, qtyProduk: number) {
  const resep = await prisma.produkBahanBaku.findMany({
    where: { produkId },
    include: {
      bahanBaku: true,
    },
  });

  const updates = [];

  for (const item of resep) {
    const totalBahanDikembalikan = item.qty * qtyProduk;
    const stokSaatIni = Number(item.bahanBaku.stok);
    const stokBaru = stokSaatIni + totalBahanDikembalikan;

    updates.push(
      prisma.bahanBaku.update({
        where: { id: item.bahanBakuId },
        data: { stok: stokBaru },
      })
    );
  }

  await Promise.all(updates);

  return {
    restored: resep.length,
    details: resep.map(item => ({
      nama: item.bahanBaku.nama,
      satuan: item.bahanBaku.satuan,
      dikembalikan: item.qty * qtyProduk,
    })),
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

    // Validasi
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

    // CEK PRODUK
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

    // ✅ CEK STOK PRODUK (barang jadi)
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

    // ✅ CEK STOK BAHAN BAKU (dari resep)
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

    // Gunakan harga dari produk jika tidak diisi
    const hargaJualFinal = hargaJual || produk.hargaJual;
    const hppFinal = hpp || produk.hpp;
    const profitFinal = profit || ((hargaJualFinal - hppFinal) * qtyNum);

    const tanggalObj = new Date(tanggal);

    // ✅ TRANSACTION: Create penjualan, update stok produk, update stok bahan baku
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create penjualan
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

      // 2. ✅ Kurangi stok produk (barang jadi)
      const stokProdukBaru = stokProdukSaatIni - qtyNum;
      await tx.produk.update({
        where: { id: produkId },
        data: { stok: stokProdukBaru },
      });

      // 3. ✅ Kurangi stok bahan baku (via resep)
      const bahanBakuUpdates = [];
      for (const item of produk.bahanBaku) {
        const totalBahanDikurangi = item.qty * qtyNum;
        const stokSaatIni = Number(item.bahanBaku.stok);
        const stokBaru = stokSaatIni - totalBahanDikurangi;

        bahanBakuUpdates.push(
          tx.bahanBaku.update({
            where: { id: item.bahanBakuId },
            data: { stok: stokBaru },
          })
        );
      }
      await Promise.all(bahanBakuUpdates);

      return penjualan;
    });

    // ✅ Update Laporan Bulanan (di luar transaction)
    await updateLaporanBulanan(tanggalObj);

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: result,
      message: `Penjualan berhasil! Stok produk tersisa: ${stokProdukSaatIni - qtyNum}`,
      metadata: {
        stokProdukSebelum: stokProdukSaatIni,
        stokProdukSesudah: stokProdukSaatIni - qtyNum,
        qtyTerjual: qtyNum,
        bahanBaku: produk.bahanBaku.map(item => ({
          nama: item.bahanBaku.nama,
          dikurangi: item.qty * qtyNum,
        })),
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

    // Cari penjualan yang akan dihapus
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

    // ✅ TRANSACTION: Delete penjualan, restore stok produk, restore stok bahan baku
    await prisma.$transaction(async (tx) => {
      // 1. Delete penjualan
      await tx.penjualan.delete({
        where: { id },
      });

      // 2. ✅ Restore stok produk
      const stokProdukSaatIni = Number(produk.stok);
      const stokProdukBaru = stokProdukSaatIni + qtyNum;

      await tx.produk.update({
        where: { id: produk.id },
        data: { stok: stokProdukBaru },
      });

      // 3. ✅ Restore stok bahan baku
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

    // ✅ Update Laporan Bulanan
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