// app/api/laporan-bulanan/update/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { bulan } = await request.json();
    
    console.log('📊 Update Laporan Bulanan - Payload:', { bulan });

    if (!bulan) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Parameter bulan wajib diisi',
      }, { status: 400 });
    }

    // Parse bulan (format: YYYY-MM)
    const [year, month] = bulan.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    console.log(`📊 Updating laporan untuk ${bulan} (${startDate} - ${endDate})`);

    // 1. Ambil data Penjualan di bulan tersebut
    const penjualan = await prisma.$queryRaw`
      SELECT 
        p.*,
        pr.nama as produk_nama,
        pr.hpp as produk_hpp,
        pr."hargaJual" as produk_hargaJual
      FROM "Penjualan" p
      LEFT JOIN "Produk" pr ON p."produkId" = pr.id
      WHERE p."tanggal" >= ${startDate} 
        AND p."tanggal" <= ${endDate}
    `;

    // 2. Hitung total dari Penjualan
    let totalQtyProduksi = 0;
    let totalLabaKotor = 0;
    let totalProfit = 0;
    let totalCost = 0;

    for (const item of penjualan as any[]) {
      const qty = Number(item.qty);
      const hargaJual = Number(item.hargaJual);
      const hpp = Number(item.hpp);
      
      totalQtyProduksi += qty;
      totalLabaKotor += qty * hargaJual;
      totalProfit += Number(item.profit) || 0;
      totalCost += qty * hpp;
    }

    console.log(`📊 Hasil dari Penjualan:`);
    console.log(`   - Qty Produksi: ${totalQtyProduksi}`);
    console.log(`   - Laba Kotor: ${totalLabaKotor}`);
    console.log(`   - Profit: ${totalProfit}`);
    console.log(`   - Cost: ${totalCost}`);

    // 3. Ambil data Pembelian di bulan tersebut (untuk cost tambahan)
    const pembelian = await prisma.$queryRaw`
      SELECT * FROM "Pembelian" 
      WHERE "tanggal" >= ${startDate} 
        AND "tanggal" <= ${endDate}
    `;

    const pembelianBahan = await prisma.$queryRaw`
      SELECT pbb.*, bb.nama as bahan_nama
      FROM "PembelianBahanBaku" pbb
      LEFT JOIN "BahanBaku" bb ON pbb."bahanBakuId" = bb.id
      WHERE pbb."tanggal" >= ${startDate} 
        AND pbb."tanggal" <= ${endDate}
    `;

    // 4. Hitung total cost dari pembelian
    let totalPembelianCost = 0;
    for (const item of pembelian as any[]) {
      totalPembelianCost += Number(item.total);
    }
    for (const item of pembelianBahan as any[]) {
      totalPembelianCost += Number(item.total);
    }

    // 5. Total cost = cost produksi + cost pembelian
    const totalJumlahCost = totalCost + totalPembelianCost;

    console.log(`📊 Total Cost: ${totalJumlahCost} (produksi: ${totalCost} + pembelian: ${totalPembelianCost})`);

    // 6. Cek apakah laporan sudah ada
    const existingLaporan = await prisma.$queryRaw`
      SELECT * FROM "LaporanBulanan" 
      WHERE DATE_TRUNC('month', "bulan") = DATE_TRUNC('month', ${startDate}::timestamp)
    `;

    const costPerPortion = totalQtyProduksi > 0 ? Math.round(totalJumlahCost / totalQtyProduksi) : 0;

    if (existingLaporan && (existingLaporan as any[]).length > 0) {
      // Update laporan yang ada
      await prisma.$executeRaw`
        UPDATE "LaporanBulanan" 
        SET 
          "qtyProduksi" = ${Math.round(totalQtyProduksi)},
          "costPerPortion" = ${costPerPortion},
          "jumlahCost" = ${Math.round(totalJumlahCost)},
          "labaKotor" = ${Math.round(totalLabaKotor)},
          "profit" = ${Math.round(totalProfit)},
          "updatedAt" = NOW()
        WHERE DATE_TRUNC('month', "bulan") = DATE_TRUNC('month', ${startDate}::timestamp)
      `;
      
      console.log(`✅ Laporan ${bulan} diupdate`);
    } else {
      // Buat laporan baru
      await prisma.$executeRaw`
        INSERT INTO "LaporanBulanan" (
          id, "bulan", "qtyProduksi", "costPerPortion", "jumlahCost", 
          overhead, gaji, "labaKotor", profit, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${startDate}::timestamp,
          ${Math.round(totalQtyProduksi)},
          ${costPerPortion},
          ${Math.round(totalJumlahCost)},
          0,
          0,
          ${Math.round(totalLabaKotor)},
          ${Math.round(totalProfit)},
          NOW(),
          NOW()
        )
      `;
      
      console.log(`✅ Laporan ${bulan} dibuat`);
    }

    // Ambil data laporan terbaru
    const laporan = await prisma.$queryRaw`
      SELECT 
        id,
        TO_CHAR("bulan", 'Month YYYY') as bulan,
        TO_CHAR("bulan", 'YYYY-MM') as bulanKey,
        "qtyProduksi",
        "costPerPortion",
        "jumlahCost",
        overhead,
        gaji,
        "labaKotor",
        profit
      FROM "LaporanBulanan" 
      WHERE DATE_TRUNC('month', "bulan") = DATE_TRUNC('month', ${startDate}::timestamp)
    `;

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: laporan,
      metadata: {
        bulan,
        totalQtyProduksi,
        totalLabaKotor,
        totalProfit,
        totalJumlahCost,
        fromPenjualan: (penjualan as any[]).length,
        fromPembelian: (pembelian as any[]).length,
        fromPembelianBahan: (pembelianBahan as any[]).length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error updating laporan bulanan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}