// app/lib/stok.ts

import { getMasterByDate } from "./master";
import { prisma } from "./prisma";

export async function getStokAwal(tanggal: Date, dataPenjualanId: string) {
  // 1. Cari realisasi H-1
  const hariSebelumnya = await prisma.realisasiHarian.findFirst({
    where: {
      tanggal: { lt: tanggal },
      dataPenjualanId,
    },
    orderBy: { tanggal: 'desc' },
  });

  // 2. Kalau ada, pakai sisa H-1
  if (hariSebelumnya) {
    return hariSebelumnya.sisa;
  }

  // 3. Kalau tidak ada, cari master terakhir
  const master = await getMasterByDate(tanggal);
  return master?.stokAwal || 0;
}