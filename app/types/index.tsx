/**
 * ========================================
 * TYPE DEFINITIONS
 * ========================================
 */

/**
 * Data realisasi harian dengan tanggal
 */
export interface RealisasiHarianItem {
  tanggal: string;
  hari: number;           // ← TAMBAHKAN KEMBALI
  terjual: number;
  sisa: number;
  status: 'habis' | 'sisa banyak' | 'sisa sedikit' | 'belum terjadi';
  perluBelanja: boolean;
  stokAwal: number;
  belanja: number;        // ← TAMBAHKAN INI
}

/**
 * Data belanja (restock)
 */
export interface BelanjaItem {
  tanggal: string;
  jumlah: number;
  keterangan: string;
}

/**
 * Data penjualan utama
 */
export interface SalesData {
  hppPerPorsi: number;
  hargaJualPerPorsi: number;
  labaPerPorsi: number;
  targetHarian: number;
  stokAwal: number;
  thresholdBelanja: number;
  realisasiHarian: RealisasiHarianItem[];
  riwayatBelanja: BelanjaItem[];
}

/**
 * Metrik Dashboard
 */
export interface Metrics {
  totalTerjual: number;
  totalSisa: number;
  sisaBahanBaku: number;
  nilaiAset: number;
  penjualanHariIni: number;
  nilaiPenjualanHariIni: number;
  totalProfit: number;
  persentaseEfisiensi: number;
  totalPendapatan: number;
  totalHPP: number;
  totalPotensiHilang: number;
  totalModalTerbuang: number;
  stokSaatIni: number;
  perluBelanja: boolean;
  totalBelanja: number;
}

/**
 * Return type untuk hook useSalesData
 */
export interface UseSalesDataReturn {
  metrics: Metrics;
  salesData: SalesData;
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  isBelanjaOpen: boolean;
  setIsBelanjaOpen: (open: boolean) => void;
  updateTodaySales: (value: number) => void;
  tambahBelanja: (jumlah: number, keterangan: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Props untuk komponen DashboardGrid
 */
export interface DashboardGridProps {
  metrics: Metrics;
  onOpenForm: () => void;
  onOpenBelanja: () => void;
}

/**
 * Props untuk komponen SalesTable
 */
export interface SalesTableProps {
  salesData: SalesData;  // ← UBAH jadi SalesData, bukan typeof
}

/**
 * Props untuk komponen SalesForm
 */
export interface SalesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
  targetHarian: number;
  hariKe: number;
  tanggal: string;
}

/**
 * Props untuk komponen BelanjaForm
 */
export interface BelanjaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jumlah: number, keterangan: string) => void;
  stokSaatIni: number;
}

/**
 * Props untuk komponen Button
 */
export interface ButtonProps {
  onClick: () => void;
  isOpen: boolean;
  children?: React.ReactNode;
}