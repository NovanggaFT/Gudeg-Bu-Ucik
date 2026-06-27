// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Hapus data lama
  await prisma.riwayatBelanja.deleteMany();
  await prisma.realisasiHarian.deleteMany();
  await prisma.dataPenjualan.deleteMany();

  console.log('🗑️ Data lama berhasil dihapus');

  const hppPerPorsi = 13000;
  const hargaJualPerPorsi = 15000;

  // 1. Buat Data Penjualan Master
  const master = await prisma.dataPenjualan.create({
    data: {
      hppPerPorsi,
      hargaJualPerPorsi,
      labaPerPorsi: hargaJualPerPorsi - hppPerPorsi,
      targetHarian: 200,
      stokAwal: 500,
      thresholdBelanja: 200,
      realisasi: {
        create: [
          // Hari 1 - Senin (17 Juni 2026)
          {
            tanggal: new Date('2026-06-17'),
            terjual: 200,
            sisa: 300,
            stokAwal: 500,
            status: 'aman',
            perluBelanja: false,
          },
          // Hari 2 - Selasa (18 Juni 2026)
          {
            tanggal: new Date('2026-06-18'),
            terjual: 130,
            sisa: 170,
            stokAwal: 300,
            status: 'waspada',
            perluBelanja: false,
          },
          // Hari 3 - Rabu (19 Juni 2026)
          {
            tanggal: new Date('2026-06-19'),
            terjual: 130,
            sisa: 40,
            stokAwal: 170,
            status: 'waspada',
            perluBelanja: true,
          },
          // Hari 4 - Kamis (20 Juni 2026) - Ada Belanja
          {
            tanggal: new Date('2026-06-20'),
            terjual: 200,
            sisa: 140,
            stokAwal: 340,
            status: 'waspada',
            perluBelanja: false,
          },
          // Hari 5 - Jumat (21 Juni 2026)
          {
            tanggal: new Date('2026-06-21'),
            terjual: 140,
            sisa: 0,
            stokAwal: 140,
            status: 'habis',
            perluBelanja: true,
          },
          // Hari 6 - Sabtu (22 Juni 2026)
          {
            tanggal: new Date('2026-06-22'),
            terjual: 0,
            sisa: 0,
            stokAwal: 0,
            status: 'habis',
            perluBelanja: true,
          },
          // Hari 7 - Minggu (23 Juni 2026)
          {
            tanggal: new Date('2026-06-23'),
            terjual: 0,
            sisa: 0,
            stokAwal: 0,
            status: 'habis',
            perluBelanja: true,
          },
        ],
      },
      riwayatBelanja: {
        create: [
          {
            tanggal: new Date('2026-06-20'),
            jumlah: 300,
            total: null,
            jumlahSystem: null,
            totalSystem: 300 * hppPerPorsi,
            hppPerPorsi: hppPerPorsi,
            keterangan: 'Belanja stok karena sisa 40',
          },
        ],
      },
    },
  });

  // ✅ Ambil ulang data lengkap dengan relasi
  const result = await prisma.dataPenjualan.findUnique({
    where: { id: master.id },
    include: {
      realisasi: {
        orderBy: { tanggal: 'asc' },
      },
      riwayatBelanja: {
        orderBy: { tanggal: 'asc' },
      },
    },
  });

  console.log('✅ Seed data berhasil!');
  console.log(`📊 Data Penjualan ID: ${result?.id}`);
  console.log(`📈 Total realisasi: ${result?.realisasi.length || 0} hari`);
  console.log(`🛒 Total belanja: ${result?.riwayatBelanja.length || 0} transaksi`);
  console.log(`💰 HPP per porsi: ${hppPerPorsi}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });