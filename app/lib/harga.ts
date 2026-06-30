// app/lib/harga.ts

import { getMasterByDate } from "./master";

export async function getHPPByDate(tanggal: Date) {
  const master = await getMasterByDate(tanggal);
  return master?.hppPerPorsi || 13000; // default
}

export async function getHargaJualByDate(tanggal: Date) {
  const master = await getMasterByDate(tanggal);
  return master?.hargaJualPerPorsi || 15000; // default
}