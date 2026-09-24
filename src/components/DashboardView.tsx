import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TablePagination } from './TablePagination';
import { CsvExportMenu } from './CsvExportMenu';
import { exportToCsv } from '../utils/csvExporter';
import {
  Fuel,
  CreditCard,
  Calendar,
  Truck,
  AlertTriangle,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Container,
  Layers,
  Search,
  Eye,
  FileText
} from 'lucide-react';
import { FuelEntry } from '../types';

interface DashboardViewProps {
  onOpenFuelEntry: () => void;
  onNavigateToAnomalies: () => void;
  onNavigateToPumpCredit: () => void;
  onNavigateToTanker: () => void;
  onSelectVehicleForEntry?: (vehicleId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenFuelEntry,
  onNavigateToAnomalies,
  onNavigateToPumpCredit,
  onNavigateToTanker,
  onSelectVehicleForEntry
}) => {
  const {
    language,
    currentTenant,
    currentUser,
    kpis,
    companies,
    categories,
    vehicles,
    fuelEntries,
    pumps,
    tankers
  } = useApp();

  const isViewer = currentUser?.role === 'client_viewer';

  // Filters State
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPump, setFilterPump] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedEntrySlip, setSelectedEntrySlip] = useState<FuelEntry | null>(null);

  const t = {
    kpiTodayLiters: "Today's Fuel Consumed",
    kpiTodayCost: "Today's Total Cost",
    kpiPumpDue: 'Total Pump Outstanding',
    kpiMonthFuel: 'This Month Fuel Usage',
    kpiActiveFleet: 'Active Fleet & Bowzer Stock',
    litersLabel: 'Liters',
    activeVehiclesLabel: 'Active Vehicles',
    todayLabel: 'Today',
    thisMonthLabel: 'This Month',
    totalDueLabel: 'Total Outstanding',
    totalCostLabel: 'Total',
    bowzerStockLabel: 'Bowzer Stock',
    anomaliesBannerTitle: 'Fuel Anomaly & Theft Warnings!',
    anomaliesBannerDesc: 'vehicles have recorded suspicious low mileage below standard benchmark.',
    viewAnomaliesBtn: 'Inspect Anomalies',
    quickFilters: 'Interactive Filters',
    allCompanies: 'All Companies',
    allCategories: 'All Categories',
    allPumps: 'All Sources / Pumps',
    internalBowzerOption: 'Internal Diesel Bowzer (Tanker)',
    searchPlaceholder: 'Search vehicle number or slip...',
    recentEntries: 'Recent Fuel Consumption Ledger',
    companyDistribution: 'Fuel Expense by Company',
    categoryBreakdown: 'Category Consumption Breakdown',
    bowzerStatus: 'Internal Bowzer Inventory Status',
    date: 'Date',
    vehicle: 'Vehicle & Driver',
    company: 'Company',
    source: 'Pump / Source',
    distance: 'Run Distance',
    liters: 'Liters',
    amount: 'Cost (BDT)',
    mileage: 'Mileage (Actual vs Target)',
    status: 'Status',
    slip: 'Slip',
    receipt: 'Receipt',
    newEntryCta: 'New Fuel Entry',
    viewLedger: 'View Ledger',
    customerFleet: 'Customer Fleet',
    stockLevel: 'Stock Level',
    available: 'Available',
    noBowzer: 'No bowzer found',
    manageBowzer: 'Manage Bowzer Stock Ledger',
    companyFilter: 'Company Filter',
    categoryFilter: 'Category Filter',
    sourceFilter: 'Fuel Source / Pump',
    noEntriesFound: 'No fuel entries found.',
    dieselBowzer: 'Diesel Bowzer',
    anomalyBadge: 'Anomaly',
    normalBadge: 'Normal',
    viewSlipTitle: 'View Fuel Slip',
    slipModalTitle: 'Fuel Slip',
    slipModalDate: 'Date',
    slipModalLiters: 'Liters',
    slipModalTotal: 'Total',
    slipModalNotes: 'Notes',
    closeBtn: 'Close'
  };

  // Filtered entries with ID deduplication
  const filteredEntries = useMemo(() => {
    const seenIds = new Set<string>();
    return fuelEntries.filter(entry => {
      if (!entry || !entry.id) return false;
      if (seenIds.has(entry.id)) return false;
      seenIds.add(entry.id);

      if (filterCompany !== 'all' && entry.company_id !== filterCompany) return false;
      
      const vehicle = vehicles.find(v => v.id === entry.vehicle_id);
      if (filterCategory !== 'all' && vehicle?.category_id !== filterCategory) return false;

      if (filterPump !== 'all') {
        if (filterPump === 'tanker' && entry.source_type !== 'tanker') return false;
        if (filterPump !== 'tanker' && entry.pump_id !== filterPump) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const vNum = vehicle?.vehicle_number.toLowerCase() || '';
        const slip = entry.slip_no.toLowerCase();
        const driver = vehicle?.driver_name.toLowerCase() || '';
        if (!vNum.includes(term) && !slip.includes(term) && !driver.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [fuelEntries, filterCompany, filterCategory, filterPump, searchTerm, vehicles]);

  // Pagination (Max 10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCompany, filterCategory, filterPump, searchTerm]);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage]);

  const handleExportCurrentViewCsv = () => {
    const headers = ['Date', 'Slip No', 'Vehicle Number', 'Driver', 'Company', 'Source', 'Distance/Hrs', 'Fuel Liters', 'Total Cost', 'Mileage', 'Benchmark', 'Status'];
    const rows = paginatedEntries.map(entry => {
      const vehicle = vehicles.find(v => v.id === entry.vehicle_id);
      const company = companies.find(c => c.id === entry.company_id);
      const pump = pumps.find(p => p.id === entry.pump_id);
      const isLph = vehicle?.category_id === 'cat_excavator' || vehicle?.category_id === 'cat_crane' || vehicle?.category_id === 'cat_generator';
      return [
        entry.entry_date,
        entry.slip_no,
        vehicle?.vehicle_number || '',
        vehicle?.driver_name || '',
        company?.name || '',
        entry.source_type === 'tanker' ? 'Internal Bowzer' : (pump?.name || 'Pump'),
        `${entry.distance_traveled} ${isLph ? 'Hrs' : 'KM'}`,
        entry.fuel_liters,
        entry.total_amount,
        entry.calculated_mileage,
        `${entry.benchmark_mileage} ${isLph ? 'L/Hr' : 'KM/L'}`,
        entry.is_anomaly ? `Anomaly (${entry.anomaly_diff_percent}%)` : 'Normal'
      ];
    });
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Fuel_Ledger_Page_${currentPage}_(${paginatedEntries.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportAllCsv = () => {
    const headers = ['Date', 'Slip No', 'Vehicle Number', 'Driver', 'Company', 'Source', 'Distance/Hrs', 'Fuel Liters', 'Total Cost', 'Mileage', 'Benchmark', 'Status'];
    const rows = filteredEntries.map(entry => {
      const vehicle = vehicles.find(v => v.id === entry.vehicle_id);
      const company = companies.find(c => c.id === entry.company_id);
      const pump = pumps.find(p => p.id === entry.pump_id);
      const isLph = vehicle?.category_id === 'cat_excavator' || vehicle?.category_id === 'cat_crane' || vehicle?.category_id === 'cat_generator';
      return [
        entry.entry_date,
        entry.slip_no,
        vehicle?.vehicle_number || '',
        vehicle?.driver_name || '',
        company?.name || '',
        entry.source_type === 'tanker' ? 'Internal Bowzer' : (pump?.name || 'Pump'),
        `${entry.distance_traveled} ${isLph ? 'Hrs' : 'KM'}`,
        entry.fuel_liters,
        entry.total_amount,
        entry.calculated_mileage,
        `${entry.benchmark_mileage} ${isLph ? 'L/Hr' : 'KM/L'}`,
        entry.is_anomaly ? `Anomaly (${entry.anomaly_diff_percent}%)` : 'Normal'
      ];
    });
    const dateStr = new Date().toISOString().split('T')[0];
    const isFiltered = filteredEntries.length !== fuelEntries.length;
    const filterTag = isFiltered ? `Filtered_${filteredEntries.length}_of_${fuelEntries.length}` : `All_${filteredEntries.length}`;
    exportToCsv(`Fuel_Ledger_${filterTag}_records_${currentTenant.code}_${dateStr}`, headers, rows);
  };

  // Company distribution statistics
  const companyStats = useMemo(() => {
    const stats: { [compId: string]: { name: string; liters: number; cost: number } } = {};
    companies.forEach(c => {
      stats[c.id] = { name: c.code || c.name, liters: 0, cost: 0 };
    });

    fuelEntries.forEach(e => {
      if (stats[e.company_id]) {
        stats[e.company_id].liters += e.fuel_liters;
        stats[e.company_id].cost += e.total_amount;
      }
    });

    const totalCost = Object.values(stats).reduce((acc, s) => acc + s.cost, 0) || 1;
    return Object.entries(stats).map(([id, val]) => ({
      id,
      name: val.name,
      liters: Math.round(val.liters),
      cost: Math.round(val.cost),
      percent: Math.min(100, Math.round((val.cost / totalCost) * 100))
    }));
  }, [companies, fuelEntries]);

  // Bowzer inventory summary
  const primaryTanker = tankers[0];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Fleet Fuel Overview Dashboard
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {currentTenant.name} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={onOpenFuelEntry}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all self-start sm:self-auto"
          >
            <Fuel className="w-4 h-4" />
            <span>{t.newEntryCta}</span>
          </button>
        )}
      </div>

      {/* Step 5.1: Top 4 KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Today's Fuel Consumed & Cost */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200/90 dark:border-blue-900/60 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.kpiTodayLiters}
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500 dark:bg-amber-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 ring-4 ring-amber-500/10 dark:ring-amber-400/20">
              <Fuel className="w-5 h-5 text-white dark:text-slate-950" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {kpis.todayFuelLiters.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.litersLabel}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-blue-950 text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between">
            <span>{t.totalCostLabel}: <strong className="font-mono text-slate-800 dark:text-amber-300">BDT {kpis.todayFuelCost.toLocaleString()}</strong></span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{t.todayLabel}</span>
          </div>
        </div>

        {/* KPI 2: Total Pump Outstanding (Due) */}
        <div 
          onClick={onNavigateToPumpCredit}
          className="p-4 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200/90 dark:border-blue-900/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {t.kpiPumpDue}
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-600 dark:bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-600/20 ring-4 ring-rose-500/10 dark:ring-rose-400/20 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
              BDT {kpis.totalPumpOutstanding.toLocaleString()}
            </span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-blue-950 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{`Across ${pumps.length} pumps`}</span>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">{t.viewLedger} &rarr;</span>
          </div>
        </div>

        {/* KPI 3: This Month Fuel Usage */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200/90 dark:border-blue-900/60 shadow-2xs hover:shadow-xs transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.kpiMonthFuel}
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-600/20 ring-4 ring-sky-500/10 dark:ring-sky-400/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {kpis.monthFuelLiters.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.litersLabel}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-blue-950 text-xs font-semibold text-sky-700 dark:text-sky-400 flex items-center justify-between">
            <span>{t.totalCostLabel}: <strong className="font-mono text-slate-800 dark:text-sky-300">BDT {kpis.monthFuelCost.toLocaleString()}</strong></span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{t.thisMonthLabel}</span>
          </div>
        </div>

        {/* KPI 4: Active Fleet & Bowzer Stock */}
        <div 
          onClick={onNavigateToTanker}
          className="p-4 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200/90 dark:border-blue-900/60 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {t.kpiActiveFleet}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 ring-4 ring-emerald-500/10 dark:ring-emerald-400/20 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {kpis.activeVehiclesCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t.activeVehiclesLabel}</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-blue-950 text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
            <span>{t.bowzerStockLabel}: <strong className="font-mono text-slate-800 dark:text-emerald-300">{primaryTanker?.current_stock_liters?.toLocaleString() || 0} L</strong></span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
          </div>
        </div>
      </div>

      {/* Step 5.3: Abnormal Consumption Alert (Anomalies Banner) */}
      {kpis.anomalyCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black flex items-center gap-2">
                <span>{t.anomaliesBannerTitle}</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-red-600 text-[10px] font-extrabold uppercase">
                  {kpis.anomalyCount} Flagged
                </span>
              </h3>
              <p className="text-xs text-rose-100 mt-0.5">
                {kpis.anomalyCount} {t.anomaliesBannerDesc}
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToAnomalies}
            className="px-4 py-2 rounded-xl bg-white text-red-600 font-bold text-xs hover:bg-rose-50 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            {t.viewAnomaliesBtn} &rarr;
          </button>
        </div>
      )}

      {/* Analytical Section: Company Fuel Breakdown & Bowzer Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Expense Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200/90 dark:border-blue-900/60 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400 border border-amber-500/20 dark:border-amber-400/30">
                <Building className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                {t.companyDistribution}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">{t.customerFleet}</span>
          </div>

          <div className="space-y-3.5">
            {companyStats.map(stat => (
              <div key={stat.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{stat.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">{stat.liters} L</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-amber-300">BDT {stat.cost.toLocaleString()}</span>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px] w-8 text-right font-semibold">{stat.percent}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-blue-950/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${stat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bowzer / Internal Stock Widget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200/90 dark:border-blue-900/60 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:bg-sky-400/20 dark:text-sky-300 border border-sky-500/20 dark:border-sky-400/30">
                  <Container className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  {t.bowzerStatus}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-[10px] font-bold border border-sky-200 dark:border-sky-800">
                Diesel
              </span>
            </div>

            {primaryTanker ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5">
                    {primaryTanker.tanker_name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{primaryTanker.location}</div>
                </div>

                {/* Fuel Tank Visual Gauge */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-blue-950/40 border border-slate-200 dark:border-blue-900/60 text-center">
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {primaryTanker.current_stock_liters.toLocaleString()} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ {primaryTanker.capacity_liters.toLocaleString()} L</span>
                  </div>
                  <div className="mt-2.5 w-full h-3 bg-slate-200 dark:bg-blue-900/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (primaryTanker.current_stock_liters / primaryTanker.capacity_liters) < 0.25
                          ? 'bg-red-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.round((primaryTanker.current_stock_liters / primaryTanker.capacity_liters) * 100)}%`
                      }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    <span>{t.stockLevel}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {Math.round((primaryTanker.current_stock_liters / primaryTanker.capacity_liters) * 100)}% {t.available}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">{t.noBowzer}</div>
            )}
          </div>

          <button
            onClick={onNavigateToTanker}
            className="w-full mt-4 py-2 px-3 rounded-xl border border-slate-200 dark:border-blue-900/60 hover:bg-slate-50 dark:hover:bg-blue-950/40 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors text-center"
          >
            {t.manageBowzer} &rarr;
          </button>
        </div>
      </div>

      {/* Step 5.2: Interactive Filters & Data Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200/90 dark:border-blue-900/60 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/20 dark:text-amber-400 border border-amber-500/20 dark:border-amber-400/30">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t.recentEntries} ({filteredEntries.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Search */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Header CSV Export Menu */}
            <CsvExportMenu
              onExportCurrentPage={handleExportCurrentViewCsv}
              onExportAll={handleExportAllCsv}
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(filteredEntries.length / pageSize))}
              currentPageCount={paginatedEntries.length}
              totalFilteredCount={filteredEntries.length}
              totalUnfilteredCount={fuelEntries.length}
              startItem={filteredEntries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              endItem={Math.min(currentPage * pageSize, filteredEntries.length)}
              entityName="entries"
              buttonVariant="header"
              dropDirection="down"
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#121f3f] border border-slate-200 dark:border-blue-900/60 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 mb-1">
              {t.companyFilter}
            </label>
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/80 bg-white dark:bg-[#182952] text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">{t.allCompanies}</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 mb-1">
              {t.categoryFilter}
            </label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/80 bg-white dark:bg-[#182952] text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">{t.allCategories}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 mb-1">
              {t.sourceFilter}
            </label>
            <select
              value={filterPump}
              onChange={e => setFilterPump(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/80 bg-white dark:bg-[#182952] text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="all">{t.allPumps}</option>
              <option value="tanker">{t.internalBowzerOption}</option>
              {pumps.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Entries Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-blue-900/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#182952] text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-blue-900/60">
              <tr>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.date} & {t.slip}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.vehicle}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.company}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.source}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.distance}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.liters}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.amount}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.mileage}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.status}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3 text-center">{t.receipt}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-blue-900/40">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    {t.noEntriesFound}
                  </td>
                </tr>
              ) : (
                paginatedEntries.map((entry, idx) => {
                  const vehicle = vehicles.find(v => v.id === entry.vehicle_id);
                  const company = companies.find(c => c.id === entry.company_id);
                  const pump = pumps.find(p => p.id === entry.pump_id);
                  const isLph = vehicle?.category_id === 'cat_excavator' || vehicle?.category_id === 'cat_crane' || vehicle?.category_id === 'cat_generator';

                  return (
                    <tr
                      key={entry.id ? `${entry.id}_${idx}` : `dash_entry_${idx}`}
                      className={`hover:bg-slate-50/80 dark:hover:bg-blue-950/40 transition-colors ${
                        entry.is_anomaly ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                      }`}
                    >
                      {/* Date & Slip */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{entry.entry_date}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{entry.slip_no}</div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3">
                        <div className="font-bold text-slate-900 dark:text-white whitespace-nowrap">{vehicle?.vehicle_number}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{vehicle?.driver_name}</div>
                      </td>

                      {/* Company */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-amber-300">{company?.code || company?.name}</span>
                      </td>

                      {/* Source */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        {entry.source_type === 'tanker' ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-semibold text-[10px] border border-blue-200 dark:border-blue-800">
                            {t.dieselBowzer}
                          </span>
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px] block" title={pump?.name}>
                            {pump?.name || 'Pump'}
                          </span>
                        )}
                      </td>

                      {/* Distance */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {entry.distance_traveled.toLocaleString()} {isLph ? 'Hrs' : 'KM'}
                      </td>

                      {/* Liters */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                        {entry.fuel_liters} L
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap font-mono font-bold text-amber-800 dark:text-amber-300">
                        BDT {entry.total_amount.toLocaleString()}
                      </td>

                      {/* Calculated Mileage vs Benchmark */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap font-mono">
                        <div className="font-extrabold">
                          <span className={entry.is_anomaly ? 'text-red-600 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}>
                            {entry.calculated_mileage}
                          </span>{' '}
                          <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                            / {entry.benchmark_mileage} {isLph ? 'L/Hr' : 'KM/L'}
                          </span>
                        </div>
                      </td>

                      {/* Status / Anomaly */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        {entry.is_anomaly ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 font-bold text-[10px] border border-red-200 dark:border-red-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>{t.anomalyBadge} ({entry.anomaly_diff_percent}%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-medium text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{t.normalBadge}</span>
                          </span>
                        )}
                      </td>

                      {/* Slip Receipt Preview Button */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 text-center">
                        {entry.receipt_image_url ? (
                          <button
                            onClick={() => setSelectedEntrySlip(entry)}
                            className="p-1 rounded-md text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-blue-900/40"
                            title={t.viewSlipTitle}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Export Controls */}
        <div className="mt-4">
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredEntries.length}
            totalUnfilteredItems={fuelEntries.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onExportCurrentPageCsv={handleExportCurrentViewCsv}
            onExportAllCsv={handleExportAllCsv}
            itemName="entries"
          />
        </div>
      </div>

      {/* Slip Receipt Modal Preview */}
      {selectedEntrySlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="font-bold text-slate-900 text-sm">
                {t.slipModalTitle}: {selectedEntrySlip.slip_no}
              </div>
              <button
                onClick={() => setSelectedEntrySlip(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 rounded-xl overflow-hidden border border-slate-200 max-h-80 bg-slate-100 flex items-center justify-center">
              <img
                src={selectedEntrySlip.receipt_image_url}
                alt="Fuel Slip"
                className="max-h-80 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div><strong>{t.slipModalDate}:</strong> {selectedEntrySlip.entry_date}</div>
              <div><strong>{t.slipModalLiters}:</strong> {selectedEntrySlip.fuel_liters} L • <strong>{t.slipModalTotal}:</strong> BDT {selectedEntrySlip.total_amount.toLocaleString()}</div>
              {selectedEntrySlip.notes && <div><strong>{t.slipModalNotes}:</strong> {selectedEntrySlip.notes}</div>}
            </div>

            <button
              onClick={() => setSelectedEntrySlip(null)}
              className="mt-4 w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              {t.closeBtn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
