// app/api/pembelian/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('📡 GET /api/pembelian');

    // Coba ambil dari PembelianBahanBaku
    let pembelianBahan = [];
    try {
      pembelianBahan = await prisma.pembelianBahanBaku.findMany({
        include: {
          bahanBaku: true,
        },
        orderBy: { tanggal: 'desc' },
      });
      console.log(`✅ PembelianBahanBaku: ${pembelianBahan.length} data`);
    } catch (err) {
      console.error('❌ Error PembelianBahanBaku:', err);
    }

    // Coba ambil dari Pembelian
    let pembelian = [];
    try {
      pembelian = await prisma.pembelian.findMany({
        orderBy: { tanggal: 'desc' },
      });
      console.log(`✅ Pembelian: ${pembelian.length} data`);
    } catch (err) {
      console.error('❌ Error Pembelian:', err);
      // Jika error, coba pakai raw query
      console.log('🔧 Coba pakai raw query...');
      pembelian = await prisma.$queryRaw`
        SELECT * FROM "Pembelian" ORDER BY "tanggal" DESC
      `;
      console.log(`✅ Pembelian (raw): ${pembelian.length} data`);
    }

    // Format data
    const allData = [];

    // Data dari PembelianBahanBaku
    for (const item of pembelianBahan) {
      allData.push({
        id: item.id,
        tanggal: item.tanggal,
        nama: item.bahanBaku?.nama || 'Unknown',
        detail: `Pembelian ${item.bahanBaku?.nama || 'Unknown'}`,
        qty: item.qty,
        harga: item.harga,
        total: item.total,
        source: 'bahan_baku',
        satuan: item.bahanBaku?.satuan || '-',
      });
    }

    // Data dari Pembelian
    for (const item of pembelian) {
      allData.push({
        id: item.id,
        tanggal: item.tanggal,
        nama: item.nama,
        detail: item.detail || null,
        qty: item.qty,
        harga: item.harga,
        total: item.total,
        source: 'reguler',
        satuan: '-',
      });
    }

    // Sort by tanggal
    allData.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    console.log(`✅ Total data: ${allData.length}`);

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: allData,
      metadata: {
        total: allData.length,
        fromBahanBaku: pembelianBahan.length,
        fromReguler: pembelian.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

// app/api/pembelian/route.ts (lanjutan)

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tanggal, nama, detail, qty, harga, total, bahanBakuId, isBahanBaku } = body;

    console.log('📝 POST /api/pembelian - Payload:', { tanggal, nama, qty, harga, total, bahanBakuId, isBahanBaku });

    // Validasi
    if (!tanggal || !nama || !qty || !harga) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Tanggal, nama, qty, dan harga wajib diisi',
      }, { status: 400 });
    }

    const qtyNum = Number(qty);
    const hargaNum = Number(harga);
    const totalNum = Number(total);

    if (isNaN(qtyNum) || qtyNum <= 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Qty harus lebih dari 0',
      }, { status: 400 });
    }

    if (isNaN(hargaNum) || hargaNum <= 0) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Harga harus lebih dari 0',
      }, { status: 400 });
    }

    // Jika pembelian bahan baku (dari dropdown)
    if (isBahanBaku && bahanBakuId) {
      try {
        // 1. Insert ke PembelianBahanBaku
        const result = await prisma.$executeRaw`
          INSERT INTO "PembelianBahanBaku" (
            id, "tanggal", "bahanBakuId", qty, harga, total, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text, 
            ${new Date(tanggal)}::timestamp,
            ${bahanBakuId},
            ${qtyNum},
            ${hargaNum},
            ${totalNum},
            NOW(),
            NOW()
          )
        `;

        console.log('✅ PembelianBahanBaku created');

        // 2. Update stok bahan baku
        const bahanBaku = await prisma.$queryRaw`
          SELECT * FROM "BahanBaku" WHERE id = ${bahanBakuId}
        `;

        if (bahanBaku && bahanBaku.length > 0) {
          const item = bahanBaku[0];
          const totalStokLama = Number(item.stok);
          const totalHargaLama = totalStokLama * Number(item.harga);
          const totalStokBaru = totalStokLama + qtyNum;
          const totalHargaBaru = totalHargaLama + totalNum;
          const hargaRataRataBaru = totalStokBaru > 0 ? Math.round(totalHargaBaru / totalStokBaru) : 0;

          await prisma.$executeRaw`
            UPDATE "BahanBaku" 
            SET stok = ${totalStokBaru}, harga = ${hargaRataRataBaru}
            WHERE id = ${bahanBakuId}
          `;

          console.log('✅ Stok updated');
        }

        return NextResponse.json({
          status: '✅ Berhasil!',
          message: 'Pembelian bahan baku berhasil, stok diupdate',
        });
      } catch (error: any) {
        console.error('❌ Error processing bahan baku:', error);
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Gagal memproses pembelian bahan baku',
          detail: error.message,
        }, { status: 500 });
      }
    } 
    // Pembelian reguler (input manual)
    else {
      try {
        // Insert ke Pembelian
        await prisma.$executeRaw`
          INSERT INTO "Pembelian" (
            id, tanggal, nama, detail, qty, harga, total, "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text,
            ${new Date(tanggal)}::timestamp,
            ${nama},
            ${detail || null},
            ${qtyNum},
            ${hargaNum},
            ${totalNum},
            NOW(),
            NOW()
          )
        `;

        console.log('✅ Pembelian created');

        return NextResponse.json({
          status: '✅ Berhasil!',
          message: 'Pembelian berhasil ditambahkan',
        });
      } catch (error: any) {
        console.error('❌ Error creating regular purchase:', error);
        return NextResponse.json({
          status: '❌ GAGAL',
          error: 'Gagal menyimpan pembelian reguler',
          detail: error.message,
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    console.error('❌ Error creating pembelian:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message || 'Terjadi kesalahan saat menyimpan data',
    }, { status: 500 });
  }
}