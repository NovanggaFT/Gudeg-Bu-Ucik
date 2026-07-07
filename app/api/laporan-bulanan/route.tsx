// app/api/laporan-bulanan/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await prisma.laporanBulanan.findMany({
      orderBy: { bulan: 'asc' },
    });

    // Format data untuk response
    const formattedData = data.map(item => ({
      id: item.id,
      bulan: item.bulan.toLocaleDateString('id-ID', { 
        month: 'long', 
        year: 'numeric' 
      }),
      bulanKey: item.bulan.toISOString().substring(0, 7),
      qtyProduksi: item.qtyProduksi,
      costPerPortion: item.costPerPortion,
      jumlahCost: item.jumlahCost,
      overhead: item.overhead,
      gaji: item.gaji,
      labaKotor: item.labaKotor,
      profit: item.profit,
    }));

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: formattedData,
    });
  } catch (error: any) {
    console.error('Error fetching laporan bulanan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { bulan } = await request.json();
    
    if (!bulan) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Parameter bulan wajib diisi',
      }, { status: 400 });
    }

    // Parse bulan
    const [year, month] = bulan.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    console.log(`📊 Updating laporan untuk ${bulan}`);

    // Ambil semua pembelian bahan baku di bulan tersebut
    const pembelianBahan = await prisma.$queryRaw`
      SELECT 
        pbb.*,
        bb.nama as bahan_nama,
        bb.satuan as bahan_satuan
      FROM "PembelianBahanBaku" pbb
      LEFT JOIN "BahanBaku" bb ON pbb."bahanBakuId" = bb.id
      WHERE pbb."tanggal" >= ${startDate} 
        AND pbb."tanggal" <= ${endDate}
    `;

    // Ambil semua pembelian reguler di bulan tersebut
    const pembelianReguler = await prisma.$queryRaw`
      SELECT * FROM "Pembelian" 
      WHERE "tanggal" >= ${startDate} 
        AND "tanggal" <= ${endDate}
    `;

    // Hitung total biaya
    let totalCost = 0;
    let totalQty = 0;

    for (const item of pembelianBahan) {
      totalCost += Number(item.total);
      totalQty += Number(item.qty);
    }

    for (const item of pembelianReguler) {
      totalCost += Number(item.total);
      totalQty += Number(item.qty);
    }

    // Cek apakah laporan sudah ada
    const existingLaporan = await prisma.$queryRaw`
      SELECT * FROM "LaporanBulanan" 
      WHERE DATE_TRUNC('month', "bulan") = DATE_TRUNC('month', ${startDate}::timestamp)
    `;

    if (existingLaporan && existingLaporan.length > 0) {
      // Update laporan yang ada
      await prisma.$executeRaw`
        UPDATE "LaporanBulanan" 
        SET 
          "qtyProduksi" = ${Math.round(totalQty)},
          "jumlahCost" = ${Math.round(totalCost)},
          "updatedAt" = NOW()
        WHERE DATE_TRUNC('month', "bulan") = DATE_TRUNC('month', ${startDate}::timestamp)
      `;
      
      console.log(`✅ Laporan ${bulan} diupdate`);
    } else {
      // Buat laporan baru
      const costPerPortion = totalQty > 0 ? Math.round(totalCost / totalQty) : 0;
      
      await prisma.$executeRaw`
        INSERT INTO "LaporanBulanan" (
          id, "bulan", "qtyProduksi", "costPerPortion", "jumlahCost", 
          overhead, gaji, "labaKotor", profit, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${startDate}::timestamp,
          ${Math.round(totalQty)},
          ${costPerPortion},
          ${Math.round(totalCost)},
          0,
          0,
          0,
          0,
          NOW(),
          NOW()
        )
      `;
      
      console.log(`✅ Laporan ${bulan} dibuat`);
    }

    // Ambil data laporan terbaru
    const laporan = await prisma.$queryRaw`
      SELECT * FROM "LaporanBulanan" 
      WHERE DATE_TRUNC('month', "bulan") = DATE_TRUNC('month', ${startDate}::timestamp)
    `;

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: laporan,
      metadata: {
        bulan,
        totalCost,
        totalQty,
        fromBahanBaku: pembelianBahan.length,
        fromReguler: pembelianReguler.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error updating laporan bulanan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}