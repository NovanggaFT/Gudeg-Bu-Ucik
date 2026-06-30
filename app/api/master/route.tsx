// app/api/master/route.ts

import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Ambil semua master
export async function GET() {
  try {
    const masters = await prisma.dataPenjualan.findMany({
      orderBy: { tanggalBerlaku: 'desc' },
      include: {
        realisasi: { take: 3 },
        riwayatBelanja: { take: 3 },
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: masters,
      count: masters.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// POST: Tambah master baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      hppPerPorsi, 
      hargaJualPerPorsi, 
      targetHarian, 
      thresholdBelanja,
      stokAwal,
      tanggalBerlaku,
    } = body;

    if (!hppPerPorsi || !hargaJualPerPorsi) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'HPP dan Harga Jual wajib diisi',
      }, { status: 400 });
    }

    if (hargaJualPerPorsi <= hppPerPorsi) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Harga jual harus lebih besar dari HPP',
      }, { status: 400 });
    }

    const lastMaster = await prisma.dataPenjualan.findFirst({
      orderBy: { tanggalBerlaku: 'desc' },
    });

    const master = await prisma.dataPenjualan.create({
      data: {
        hppPerPorsi,
        hargaJualPerPorsi,
        labaPerPorsi: hargaJualPerPorsi - hppPerPorsi,
        targetHarian: targetHarian || 200,
        thresholdBelanja: thresholdBelanja || 200,
        stokAwal: stokAwal || lastMaster?.stokAwal || 500,
        tanggalBerlaku: tanggalBerlaku ? new Date(tanggalBerlaku) : new Date(),
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: master,
      message: `Master baru berhasil dibuat`,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}

// PUT: Update master (buat baru dengan tanggalBerlaku baru)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id,
      hppPerPorsi, 
      hargaJualPerPorsi, 
      targetHarian, 
      thresholdBelanja,
      stokAwal,
      tanggalBerlaku,
    } = body;

    // Cek master yang akan diedit
    const existingMaster = await prisma.dataPenjualan.findUnique({
      where: { id },
    });

    if (!existingMaster) {
      return NextResponse.json({
        status: '❌ GAGAL',
        error: 'Master tidak ditemukan',
      }, { status: 404 });
    }

    // ✅ Buat master BARU (bukan update)
    const newMaster = await prisma.dataPenjualan.create({
      data: {
        hppPerPorsi: hppPerPorsi || existingMaster.hppPerPorsi,
        hargaJualPerPorsi: hargaJualPerPorsi || existingMaster.hargaJualPerPorsi,
        labaPerPorsi: (hargaJualPerPorsi || existingMaster.hargaJualPerPorsi) - (hppPerPorsi || existingMaster.hppPerPorsi),
        targetHarian: targetHarian || existingMaster.targetHarian,
        thresholdBelanja: thresholdBelanja || existingMaster.thresholdBelanja,
        stokAwal: stokAwal || existingMaster.stokAwal,
        tanggalBerlaku: tanggalBerlaku ? new Date(tanggalBerlaku) : new Date(),
      },
    });

    return NextResponse.json({
      status: '✅ Berhasil!',
      data: newMaster,
      message: `Master berhasil di-update (versi baru)`,
      oldVersion: existingMaster,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: '❌ GAGAL',
      error: error.message,
    }, { status: 500 });
  }
}