// app/lib/master.ts

import { prisma } from './prisma';

export async function getMasterByDate(tanggal: Date) {
  const master = await prisma.dataPenjualan.findFirst({
    where: {
      tanggalBerlaku: { lte: tanggal },
    },
    orderBy: { tanggalBerlaku: 'desc' },
  });
  
  return master;
}

export async function getMasterTerbaru() {
  const master = await prisma.dataPenjualan.findFirst({
    orderBy: { tanggalBerlaku: 'desc' },
  });
  
  return master;
}

export async function getAllMasters() {
  const masters = await prisma.dataPenjualan.findMany({
    orderBy: { tanggalBerlaku: 'desc' },
  });
  
  return masters;
}