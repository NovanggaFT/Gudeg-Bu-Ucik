// app/page.tsx

'use client';

import { useState, useMemo } from 'react';
import { useSalesData } from '@/app/hooks/useSalesData';
import DashboardGrid from '@/app/components/dashboard/DashboardGrid';
import SalesTable from '@/app/components/dashboard/SalesTable';
import SalesForm from '@/app/components/form/SalesForm';
import BelanjaForm from '@/app/components/form/BelanjaForm';
import Button from '@/app/components/ui/Button';

export default function Home() {
  const { 
    metrics, 
    salesData, 
    isFormOpen, 
    setIsFormOpen,
    isBelanjaOpen,
    setIsBelanjaOpen,
    updateTodaySales,
    tambahBelanja,
    isLoading,
    error
  } = useSalesData();
  
  const [showTable, setShowTable] = useState<boolean>(false);

  const hariKe = useMemo<number>(() => {
    return salesData?.realisasiHarian?.length ?? 0;
  }, [salesData]);
  
  const tanggalHariIni = useMemo<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }, []);

  const dashboardConfig = {
    title: 'DASHBOARD',
    subtitle: 'manajemen penjualan & stok',
    footer: 'data statis · periode mingguan'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
          <p className="text-red-600 font-semibold">Terjadi Kesalahan</p>
          <p className="text-red-500 text-sm mt-2">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Header - Lebih terlihat */}
      <header className="pt-12 pb-4 text-center border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-700 tracking-wide">
          {dashboardConfig.title}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {dashboardConfig.subtitle}
        </p>
        {/* Alert - Lebih subtle */}
        {metrics.perluBelanja && (
          <div className="mt-3 px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg inline-block">
            ⚠️ Stok menipis ({metrics.stokSaatIni} porsi tersisa)
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          
          <DashboardGrid 
            metrics={metrics} 
            onOpenForm={() => setIsFormOpen(true)}
            onOpenBelanja={() => setIsBelanjaOpen(true)}
          />
          
          <div className="flex justify-center mt-6">
            <Button 
              onClick={() => setShowTable(!showTable)} 
              isOpen={showTable}
            />
          </div>
          
          <div 
            className={`
              transition-all duration-500 overflow-hidden
              ${showTable ? 'max-h-[600px] opacity-100 mt-8' : 'max-h-0 opacity-0'}
            `}
            aria-hidden={!showTable}
          >
            <SalesTable salesData={salesData} />
          </div>
          
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-gray-300">
        {dashboardConfig.footer}
      </footer>
      
      <SalesForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={updateTodaySales}
        targetHarian={salesData.targetHarian}
        hariKe={hariKe}
        tanggal={tanggalHariIni}
      />
      
      <BelanjaForm
        isOpen={isBelanjaOpen}
        onClose={() => setIsBelanjaOpen(false)}
        onSubmit={tambahBelanja}
        stokSaatIni={metrics.stokSaatIni}
      />
      
    </main>
  );
}