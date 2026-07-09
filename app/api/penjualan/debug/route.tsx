// app/api/penjualan/debug/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bulan = searchParams.get('bulan') || '2026-07'; // Default: Juli 2026
    const [year, month] = bulan.split('-').map(Number);
    
    // ========== 1. Buat range tanggal ==========
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // ========== 2. Coba dengan 2 metode ==========
    
    // Method 1: Menggunakan findMany dengan gte/lte
    const penjualanMethod1 = await prisma.penjualan.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        produk: {
          select: {
            nama: true,
            sku: true,
          },
        },
      },
      orderBy: { tanggal: 'asc' },
    });

    // Method 2: Menggunakan DATE_TRUNC (PostgreSQL)
    const penjualanMethod2 = await prisma.$queryRaw<any[]>`
      SELECT 
        p.*,
        pr.nama as produk_nama,
        pr.sku as produk_sku
      FROM "Penjualan" p
      LEFT JOIN "Produk" pr ON p."produkId" = pr.id
      WHERE DATE_TRUNC('month', p."tanggal") = DATE_TRUNC('month', ${startDate}::timestamp)
      ORDER BY p."tanggal" ASC
    `;

    // ========== 3. Hitung total ==========
    let totalQtyMethod1 = 0;
    let totalRevenueMethod1 = 0;
    let totalHPPMethod1 = 0;

    for (const p of penjualanMethod1) {
      const qty = Number(p.qty);
      totalQtyMethod1 += qty;
      totalRevenueMethod1 += Number(p.hargaJual) * qty;
      totalHPPMethod1 += Number(p.hpp) * qty;
    }

    let totalQtyMethod2 = 0;
    let totalRevenueMethod2 = 0;
    let totalHPPMethod2 = 0;

    for (const p of penjualanMethod2) {
      const qty = Number(p.qty);
      totalQtyMethod2 += qty;
      totalRevenueMethod2 += Number(p.hargaJual) * qty;
      totalHPPMethod2 += Number(p.hpp) * qty;
    }

    // ========== 4. Ambil semua data penjualan (tanpa filter) ==========
    const semuaPenjualan = await prisma.penjualan.findMany({
      include: {
        produk: {
          select: {
            nama: true,
            sku: true,
          },
        },
      },
      orderBy: { tanggal: 'asc' },
    });

    // ========== 5. Format response ==========
    return NextResponse.json({
      status: '✅ Berhasil!',
      debug: {
        bulan,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        timezone: {
          startDateLocal: startDate.toString(),
          endDateLocal: endDate.toString(),
        },
      },
      method1: {
        name: 'findMany dengan gte/lte',
        count: penjualanMethod1.length,
        totalQty: totalQtyMethod1,
        totalRevenue: totalRevenueMethod1,
        totalHPP: totalHPPMethod1,
        data: penjualanMethod1.map(p => ({
          id: p.id,
          tanggal: p.tanggal,
          tanggalLocal: new Date(p.tanggal).toLocaleString('id-ID'),
          produk: p.produk?.nama || 'Unknown',
          qty: p.qty,
          hargaJual: p.hargaJual,
          hpp: p.hpp,
          profit: p.profit,
        })),
      },
      method2: {
        name: 'DATE_TRUNC (PostgreSQL)',
        count: penjualanMethod2.length,
        totalQty: totalQtyMethod2,
        totalRevenue: totalRevenueMethod2,
        totalHPP: totalHPPMethod2,
        data: penjualanMethod2.map((p: any) => ({
          id: p.id,
          tanggal: p.tanggal,
          tanggalLocal: new Date(p.tanggal).toLocaleString('id-ID'),
          produk: p.produk_nama || 'Unknown',
          qty: p.qty,
          hargaJual: p.hargaJual,
          hpp: p.hpp,
          profit: p.profit,
        })),
      },
      semuaPenjualan: {
        count: semuaPenjualan.length,
        data: semuaPenjualan.map(p => ({
          id: p.id,
          tanggal: p.tanggal,
          tanggalLocal: new Date(p.tanggal).toLocaleString('id-ID'),
          produk: p.produk?.nama || 'Unknown',
          qty: p.qty,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error debug penjualan:', error);
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}