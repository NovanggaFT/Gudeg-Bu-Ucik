// prisma/generate-csv.ts

import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const KARYAWAN = [
  { nama: 'Lis', posisi: 'Kitchen', gaji: 100000 },
  { nama: 'Suyati', posisi: 'Kitchen', gaji: 100000 },
  { nama: 'Sum', posisi: 'Kitchen', gaji: 100000 },
  { nama: 'Wiwik', posisi: 'Seller', gaji: 50000 },
  { nama: 'Aziz', posisi: 'Seller', gaji: 50000 },
];

// ✅ DAFTAR LIBUR (tanggal saja)
const LIBUR: string[] = [];

// 1 Maret - 15 Maret 2025
for (let d = 1; d <= 15; d++) {
  LIBUR.push(`2025-03-${String(d).padStart(2, '0')}`);
}

// 19 Maret 2025 (diperbaiki)
LIBUR.push(`2025-03-19`);

// 1 April - 3 April 2025
for (let d = 1; d <= 3; d++) {
  LIBUR.push(`2025-04-${String(d).padStart(2, '0')}`);
}

// 19 April - 22 April 2025
for (let d = 19; d <= 22; d++) {
  LIBUR.push(`2025-04-${String(d).padStart(2, '0')}`);
}

// 19 Oktober - 22 Oktober 2025
for (let d = 19; d <= 22; d++) {
  LIBUR.push(`2025-10-${String(d).padStart(2, '0')}`);
}

console.log(`📅 Total hari libur: ${LIBUR.length} hari`);
console.log('📅 Daftar libur:', LIBUR.sort());

function isLibur(dateStr: string): boolean {
  return LIBUR.includes(dateStr);
}

function generateCSV() {
  const rows = ['nama,posisi,gaji,tanggal_penggajian'];
  
  // Menggunakan GMT+7 (WIB)
  const startDate = new Date('2025-01-01T00:00:00+07:00');
  const endDate = new Date('2026-01-01T00:00:00+07:00');
  let currentDate = new Date(startDate);
  let totalHariKerja = 0;

  while (currentDate < endDate) {
    // Format tanggal dengan GMT+7
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    // Cek apakah hari libur (tanpa skip Minggu)
    if (!isLibur(dateStr)) {
      for (const k of KARYAWAN) {
        rows.push(`${k.nama},${k.posisi},${k.gaji},${dateStr}`);
      }
      totalHariKerja++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const csvPath = path.join(process.cwd(), 'prisma', 'penggajian_data.csv');
  fs.writeFileSync(csvPath, rows.join('\n'));
  
  console.log(`✅ CSV generated: ${csvPath}`);
  console.log(`📊 Total rows: ${rows.length - 1}`);
  console.log(`📊 Total hari kerja: ${totalHariKerja} hari`);
  console.log(`📊 Total karyawan: ${KARYAWAN.length} orang`);
  console.log(`📊 Total records: ${totalHariKerja * KARYAWAN.length}`);
}

generateCSV();