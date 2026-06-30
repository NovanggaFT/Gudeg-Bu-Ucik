// prisma/seed.ts

import { PrismaClient, StatusStok } from '@prisma/client';
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
  const targetHarian = 200;
  const thresholdBelanja = 200;
  const stokAwal = 500;

  // ========================================
  // 1. BUAT MASTER (Berlaku dari 1 Juni 2026)
  // ========================================
  const master = await prisma.dataPenjualan.create({
    data: {
      hppPerPorsi,
      hargaJualPerPorsi,
      labaPerPorsi: hargaJualPerPorsi - hppPerPorsi,
      targetHarian,
      stokAwal,
      thresholdBelanja,
      tanggalBerlaku: new Date('2026-06-01'),
    },
  });

  console.log(`✅ Master dibuat dengan tanggalBerlaku: 2026-06-01`);

  // ========================================
  // 2. BUAT REALISASI HARIAN (17-23 Juni 2026)
  // ========================================
  // ✅ PAKAI ENUM StatusStok
  const realisasiData = [
    // Hari 1 - Senin (17 Juni 2026)
    {
      tanggal: new Date('2026-06-17'),
      terjual: 200,
      sisa: 300,
      stokAwal: 500,
      status: StatusStok.aman,
      perluBelanja: false,
    },
    // Hari 2 - Selasa (18 Juni 2026)
    {
      tanggal: new Date('2026-06-18'),
      terjual: 130,
      sisa: 170,
      stokAwal: 300,
      status: StatusStok.waspada,
      perluBelanja: false,
    },
    // Hari 3 - Rabu (19 Juni 2026)
    {
      tanggal: new Date('2026-06-19'),
      terjual: 130,
      sisa: 40,
      stokAwal: 170,
      status: StatusStok.waspada,
      perluBelanja: true,
    },
    // Hari 4 - Kamis (20 Juni 2026) - Ada Belanja
    {
      tanggal: new Date('2026-06-20'),
      terjual: 200,
      sisa: 140,
      stokAwal: 340,
      status: StatusStok.waspada,
      perluBelanja: false,
    },
    // Hari 5 - Jumat (21 Juni 2026)
    {
      tanggal: new Date('2026-06-21'),
      terjual: 140,
      sisa: 0,
      stokAwal: 140,
      status: StatusStok.habis,
      perluBelanja: true,
    },
    // Hari 6 - Sabtu (22 Juni 2026)
    {
      tanggal: new Date('2026-06-22'),
      terjual: 0,
      sisa: 0,
      stokAwal: 0,
      status: StatusStok.habis,
      perluBelanja: true,
    },
    // Hari 7 - Minggu (23 Juni 2026)
    {
      tanggal: new Date('2026-06-23'),
      terjual: 0,
      sisa: 0,
      stokAwal: 0,
      status: StatusStok.habis,
      perluBelanja: true,
    },
  ];

  for (const data of realisasiData) {
    await prisma.realisasiHarian.create({
      data: {
        ...data,
        dataPenjualanId: master.id,
      },
    });
  }

  console.log(`📊 ${realisasiData.length} hari realisasi dibuat (17-23 Juni 2026)`);

  // ========================================
  // 3. BUAT RIWAYAT BELANJA
  // ========================================
  await prisma.riwayatBelanja.create({
    data: {
      tanggal: new Date('2026-06-20'),
      jumlah: 300,
      total: null,
      jumlahSystem: null,
      totalSystem: 300 * hppPerPorsi,
      hppPerPorsi: hppPerPorsi,
      keterangan: 'Belanja stok karena sisa 40',
      dataPenjualanId: master.id,
    },
  });

  console.log(`🛒 1 riwayat belanja dibuat (20 Juni 2026)`);

  // ========================================
  // 4. TAMBAHKAN MASTER KEDUA (untuk testing tanggalBerlaku)
  // ========================================
  const master2 = await prisma.dataPenjualan.create({
    data: {
      hppPerPorsi: 14000,
      hargaJualPerPorsi: 17000,
      labaPerPorsi: 3000,
      targetHarian: 250,
      stokAwal: 600,
      thresholdBelanja: 150,
      tanggalBerlaku: new Date('2026-07-01'),
    },
  });

  console.log(`✅ Master kedua dibuat dengan tanggalBerlaku: 2026-07-01`);

  // ========================================
  // 5. TAMBAHKAN REALISASI UNTUK MASTER KEDUA
  // ========================================
  await prisma.realisasiHarian.create({
    data: {
      tanggal: new Date('2026-07-03'),
      terjual: 180,
      sisa: 420,
      stokAwal: 600,
      status: StatusStok.aman,
      perluBelanja: false,
      dataPenjualanId: master2.id,
    },
  });

  console.log(`📊 1 realisasi untuk master2 (3 Juli 2026)`);

  // ========================================
  // 6. TAMBAHKAN BELANJA UNTUK MASTER KEDUA
  // ========================================
  await prisma.riwayatBelanja.create({
    data: {
      tanggal: new Date('2026-07-03'),
      jumlah: 50,
      total: null,
      jumlahSystem: null,
      totalSystem: 50 * 14000,
      hppPerPorsi: 14000,
      keterangan: 'Belanja stok tambahan',
      dataPenjualanId: master2.id,
    },
  });

  console.log(`🛒 1 belanja untuk master2 (3 Juli 2026)`);

  // ========================================
  // RINGKASAN
  // ========================================
  console.log('\n✅ Seed data berhasil!');
  console.log(`📊 Total master: 2`);
  console.log(`📈 Total realisasi: ${realisasiData.length + 1} hari`);
  console.log(`🛒 Total belanja: 2 transaksi`);
  console.log(`\n📌 Master 1 (aktif sampai 30 Juni 2026):`);
  console.log(`   - Berlaku: 2026-06-01`);
  console.log(`   - HPP: Rp${hppPerPorsi}`);
  console.log(`   - Target: ${targetHarian}`);
  console.log(`📌 Master 2 (aktif mulai 1 Juli 2026):`);
  console.log(`   - Berlaku: 2026-07-01`);
  console.log(`   - HPP: Rp14000`);
  console.log(`   - Target: 250`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });