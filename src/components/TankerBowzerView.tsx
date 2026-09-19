import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TablePagination } from './TablePagination';
import { CsvExportMenu } from './CsvExportMenu';
import { exportToCsv } from '../utils/csvExporter';
import {
  Container,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Droplets,
  Calendar,
  Truck,
  CheckCircle2,
  FileText,
  Download,
  Printer,
  Sliders,
  AlertTriangle,
  Search,
  Filter,
  Trash2,
  Edit2,
  Fuel
} from 'lucide-react';
import { TankerLog, TankerInventory } from '../types';

export const TankerBowzerView: React.FC = () => {
  const {
    language,
    currentTenant,
    currentUser,
    tankers,
    tankerLogs,
    vehicles,
    fuelTypes,
    addTanker,
    updateTanker,
    deleteTanker,
    addTankerStockIn,
    addTankerDispenseOrAdjustment
  } = useApp();

  const isViewer = currentUser?.role === 'client_viewer';

  const [selectedTankerId, setSelectedTankerId] = useState<string>(tankers[0]?.id || '');
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showAddBowzerModal, setShowAddBowzerModal] = useState(false);
  const [tankerToDelete, setTankerToDelete] = useState<string | null>(null);

  // Filters
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Stock In Form State
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [logLiters, setLogLiters] = useState('');
  const [logRate, setLogRate] = useState('108.0');
  const [logSupplier, setLogSupplier] = useState('Padma Oil Depot, Baghabari');
  const [logInvoice, setLogInvoice] = useState('');
  const [logNotes, setLogNotes] = useState('');

  // Dispense / Adjustment Form State
  const [adjType, setAdjType] = useState<'dispense_out' | 'dip_adjustment'>('dispense_out');
  const [adjDate, setAdjDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [adjLiters, setAdjLiters] = useState('');
  const [adjTarget, setAdjTarget] = useState('');
  const [adjNotes, setAdjNotes] = useState('');

  // Add Bowzer Form State
  const [bowzerName, setBowzerName] = useState('');
  const [bowzerLocation, setBowzerLocation] = useState('');
  const [bowzerCapacity, setBowzerCapacity] = useState('15000');
  const [bowzerCurrentStock, setBowzerCurrentStock] = useState('5000');
  const [bowzerThreshold, setBowzerThreshold] = useState('3000');
  const [bowzerFuelTypeId, setBowzerFuelTypeId] = useState(fuelTypes[0]?.id || 'fuel_diesel');

  // Keep selected tanker synced
  useEffect(() => {
    if (!selectedTankerId && tankers.length > 0) {
      setSelectedTankerId(tankers[0].id);
    } else if (tankers.length > 0 && !tankers.find(t => t.id === selectedTankerId)) {
      setSelectedTankerId(tankers[0].id);
    }
  }, [tankers, selectedTankerId]);

  const currentTanker: TankerInventory | undefined = tankers.find(t => t.id === selectedTankerId) || tankers[0];

  const t = {
    title: 'Internal Diesel Bowzer / Tanker Stock Management',
    subtitle: 'Bulk depot stock-in, fleet dispensing stock-out, dip rod calibration and real-time inventory ledger',
    stockInBtn: 'Bulk Fuel Stock-In',
    adjBtn: 'Direct Dispense / Dip Adjustment',
    newBowzerBtn: '+ Register New Bowzer',
    exportCsvBtn: 'Export CSV / Excel',
    printBtn: 'Print Stock Report',
    currentStock: 'Current Fuel Stock',
    tankerCapacity: 'Total Capacity',
    stockRatio: 'Stock Level %',
    fuelTypeLabel: 'Fuel Type: Diesel',
    litersUnit: 'Liters',
    capacityFullLabel: 'Capacity Full',
    tankLevelIndicator: 'Tank Level Visualizer',
    emptyLabel: 'Empty (0 L)',
    halfFullLabel: 'Half Full',
    fullLabel: 'Full',
    stockHistory: 'Bowzer Stock Movement Ledger',
    recordsCount: 'records',
    inflowOutflow: 'Inflow & Outflow',
    noMovementLogs: 'No stock movements logged for this bowzer.',
    bulkStockInBadge: 'Bulk Stock-In (IN)',
    dispenseBadge: 'Dispensed (DISPENSE)',
    dipAdjBadge: 'Dip Adjustment (ADJ)',
    date: 'Date',
    type: 'Movement Type',
    liters: 'Volume (Liters)',
    balanceAfter: 'Balance After',
    details: 'Vehicle / Supplier Details',
    ref: 'Reference / Notes',
    filterAll: 'All Movements',
    filterStockIn: 'Stock In Only',
    filterDispense: 'Dispense Only',
    filterAdj: 'Dip Adjustment Only',
    searchPlaceholder: 'Search chalan, vehicle or notes...',
    allTime: 'All Time',
    today: 'Today',
    last7Days: 'Last 7 Days',
    thisMonth: 'This Month',
    warningLowStock: 'Warning: Bowzer fuel stock is below alert threshold! Please procure bulk diesel.',
    modalTitle: 'Bulk Diesel Stock-In (Depot Purchase)',
    modalSubtitle: 'Enter fuel quantity received from refinery or depot tank lorry.',
    dateLabel: 'Date *',
    litersInputLabel: 'Diesel Volume (Liters) *',
    rateInputLabel: 'Rate Per Liter (BDT) *',
    invoiceLabel: 'Challan / Invoice No *',
    supplierLabel: 'Supplier / Depot Source',
    notesLabel: 'Notes / Remarks',
    cancelBtn: 'Cancel',
    saveStockInBtn: 'Save Stock In',
    adjModalTitle: 'Bowzer Dispense or Dip Calibration Adjustment',
    adjModalSubtitle: 'Record dispensing to unassigned site equipment or physical dip rod audit variance.',
    adjTypeLabel: 'Operation Type *',
    typeDispenseOut: 'Direct Dispense (Stock Out)',
    typeDipAdj: 'Dip Rod Calibration / Variance (Dip Adjustment)',
    adjTargetLabel: 'Recipient / Reason *',
    adjTargetPlaceholder: 'e.g. Camp Generator #1 or Temperature loss audit',
    adjLitersLabel: 'Diesel Volume (Liters) *',
    saveAdjBtn: 'Save Record',
    bowzerModalTitle: 'Register New Bowzer / Mobile Tanker',
    bowzerModalSubtitle: 'Configure internal storage or mobile fueling unit.',
    bowzerNameLabel: 'Bowzer Name / Identification *',
    bowzerNamePlaceholder: 'e.g. Internal Diesel Bowzer #02',
    bowzerLocationLabel: 'Location / Yard *',
    bowzerLocationPlaceholder: 'e.g. Rooppur West Camp Yard',
    bowzerCapLabel: 'Total Capacity (Liters) *',
    bowzerStockLabel: 'Initial Stock (Liters) *',
    bowzerThresholdLabel: 'Min Alert Threshold (Liters) *',
    saveBowzerBtn: 'Save Bowzer',
    deleteBowzerConfirm: 'Are you sure you want to delete this bowzer?',
    deleteBtn: 'Delete'
  };

  // Quick Date Presets
  const handleDatePreset = (preset: 'all' | 'today' | '7days' | 'month') => {
    const today = new Date().toISOString().split('T')[0];
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'today') {
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(today);
    } else if (preset === 'month') {
      const d = new Date();
      d.setDate(1);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(today);
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (!currentTanker) return [];
    return tankerLogs.filter(l => {
      if (l.tanker_id !== currentTanker.id) return false;
      if (logTypeFilter !== 'all' && l.log_type !== logTypeFilter) return false;
      if (dateFrom && l.date < dateFrom) return false;
      if (dateTo && l.date > dateTo) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          l.source_or_vehicle.toLowerCase().includes(q) ||
          (l.notes && l.notes.toLowerCase().includes(q)) ||
          l.date.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [tankerLogs, currentTanker, logTypeFilter, dateFrom, dateTo, searchTerm]);

  // Aggregate stats
  const totalStockInLiters = useMemo(() => {
    return filteredLogs
      .filter(l => l.log_type === 'stock_in')
      .reduce((acc, l) => acc + l.liters, 0);
  }, [filteredLogs]);

  const totalDispensedLiters = useMemo(() => {
    return filteredLogs
      .filter(l => l.log_type === 'dispense_out')
      .reduce((acc, l) => acc + l.liters, 0);
  }, [filteredLogs]);

  // -------------------------------------------------------------
  // Pagination & CSV Export (Max 10 per page)
  // -------------------------------------------------------------
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTankerId, logTypeFilter, searchTerm, dateFrom, dateTo]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage]);

  const handleExportCurrentViewCsv = () => {
    const headers = ['Date', 'Bowzer', 'Movement Type', 'Liters (L)', 'Previous Stock', 'New Balance After', 'Recipient / Supplier', 'Challan / Notes'];
    const rows = paginatedLogs.map(l => [
      l.date,
      currentTanker?.tanker_name || '',
      l.log_type.toUpperCase(),
      l.liters,
      l.previous_stock,
      l.new_stock,
      l.source_or_vehicle,
      l.notes || ''
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Bowzer_Stock_${currentTanker?.tanker_name || 'Tanker'}_Page_${currentPage}_(${paginatedLogs.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportAllCsv = () => {
    const headers = ['Date', 'Bowzer', 'Movement Type', 'Liters (L)', 'Previous Stock', 'New Balance After', 'Recipient / Supplier', 'Challan / Notes'];
    const rows = filteredLogs.map(l => [
      l.date,
      currentTanker?.tanker_name || '',
      l.log_type.toUpperCase(),
      l.liters,
      l.previous_stock,
      l.new_stock,
      l.source_or_vehicle,
      l.notes || ''
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    const totalBowzerLogs = tankerLogs.filter(l => l.tanker_id === currentTanker?.id).length;
    const isFiltered = filteredLogs.length !== totalBowzerLogs;
    const filterTag = isFiltered ? `Filtered_${filteredLogs.length}_of_${totalBowzerLogs}` : `All_${filteredLogs.length}`;
    exportToCsv(`Bowzer_Stock_${currentTanker?.tanker_name || 'Tanker'}_${filterTag}_records_${dateStr}`, headers, rows);
  };

  // Handle Save Stock In
  const handleSaveStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTanker || !logLiters) return;

    const liters = parseFloat(logLiters) || 0;
    const rate = parseFloat(logRate) || 108;
    const fullNotes = `${logInvoice ? `Challan: ${logInvoice}. ` : ''}${logNotes}`.trim();

    addTankerStockIn(currentTanker.id, liters, rate, logSupplier, fullNotes);

    setLogLiters('');
    setLogInvoice('');
    setLogNotes('');
    setShowStockInModal(false);
  };

  // Handle Save Dispense / Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTanker || !adjLiters) return;

    const liters = parseFloat(adjLiters) || 0;
    addTankerDispenseOrAdjustment(
      currentTanker.id,
      liters,
      adjType,
      adjTarget.trim() || (adjType === 'dispense_out' ? 'Site Generator / Equipment' : 'Dip Calibration'),
      adjNotes.trim()
    );

    setAdjLiters('');
    setAdjTarget('');
    setAdjNotes('');
    setShowAdjustmentModal(false);
  };

  // Handle Save New Bowzer
  const handleSaveNewBowzer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bowzerName.trim()) return;

    addTanker({
      tanker_name: bowzerName.trim(),
      location: bowzerLocation.trim() || 'Central Yard',
      capacity_liters: parseFloat(bowzerCapacity) || 15000,
      current_stock_liters: parseFloat(bowzerCurrentStock) || 0,
      fuel_type_id: bowzerFuelTypeId,
      min_alert_threshold: parseFloat(bowzerThreshold) || 3000,
      last_restocked_at: new Date().toISOString().split('T')[0]
    });

    setBowzerName('');
    setBowzerLocation('');
    setShowAddBowzerModal(false);
  };

  // CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    const headers = ['Date', 'Bowzer', 'Movement Type', 'Liters (L)', 'Previous Stock', 'New Balance After', 'Recipient / Supplier', 'Challan / Notes'];
    const rows = filteredLogs.map(l => {
      return [
        `"${l.date}"`,
        `"${currentTanker?.tanker_name || ''}"`,
        `"${l.log_type.toUpperCase()}"`,
        l.liters,
        l.previous_stock,
        l.new_stock,
        `"${l.source_or_vehicle.replace(/"/g, '""')}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvData = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FuelFlow_Bowzer_Stock_${currentTanker?.tanker_name.replace(/\s+/g, '_')}_${dateFrom || 'all'}_to_${dateTo || 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const percent = currentTanker && currentTanker.capacity_liters > 0
    ? Math.round((currentTanker.current_stock_liters / currentTanker.capacity_liters) * 100)
    : 0;

  const isLowStock = currentTanker && currentTanker.current_stock_liters <= currentTanker.min_alert_threshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.title}
          </h2>
          <p className="text-xs text-slate-500 font-medium">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CsvExportMenu
            onExportCurrentPage={handleExportCurrentViewCsv}
            onExportAll={handleExportAllCsv}
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredLogs.length / pageSize))}
            currentPageCount={paginatedLogs.length}
            totalFilteredCount={filteredLogs.length}
            totalUnfilteredCount={tankerLogs.filter(l => l.tanker_id === currentTanker?.id).length}
            startItem={filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            endItem={Math.min(currentPage * pageSize, filteredLogs.length)}
            entityName="movements"
            buttonLabel={t.exportCsvBtn}
            buttonVariant="header"
            dropDirection="down"
          />
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-2xs transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.printBtn}</span>
          </button>
          {!isViewer && (
            <>
              <button
                onClick={() => setShowAddBowzerModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.newBowzerBtn}</span>
              </button>
              <button
                onClick={() => setShowAdjustmentModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{t.adjBtn}</span>
              </button>
              <button
                onClick={() => setShowStockInModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t.stockInBtn}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bowzers Selector Tab / Pills */}
      {tankers.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 shrink-0">Select Bowzer:</span>
          {tankers.map(tanker => {
            const isSelected = tanker.id === currentTanker?.id;
            return (
              <button
                key={tanker.id}
                onClick={() => setSelectedTankerId(tanker.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Container className="w-3.5 h-3.5" />
                <span>{tanker.tanker_name}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                  isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tanker.current_stock_liters}L
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Low Stock Warning Banner */}
      {isLowStock && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1 font-semibold">{t.warningLowStock}</div>
          {!isViewer && (
            <button
              onClick={() => setShowStockInModal(true)}
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
            >
              Stock In Now
            </button>
          )}
        </div>
      )}

      {/* Tanker Status Visualizer & Primary Metric Cards */}
      {currentTanker ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Visual Tank Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  {currentTanker.location}
                </span>
                <h3 className="font-black text-slate-900 text-base">{currentTanker.tanker_name}</h3>
                <span className="text-xs text-blue-600 font-bold">{t.fuelTypeLabel}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {percent}%
                </span>
                <span className="text-[10px] text-slate-400 block">{t.capacityFullLabel}</span>
              </div>
            </div>

            {/* Visual Tank Gauge Container */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>{t.tankLevelIndicator}</span>
                <span className="font-mono text-slate-800">
                  {currentTanker.current_stock_liters.toLocaleString()} / {currentTanker.capacity_liters.toLocaleString()} L
                </span>
              </div>

              <div className="relative h-10 w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 p-1">
                <div
                  className={`h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2 text-white font-mono font-bold text-xs ${
                    percent < 20
                      ? 'bg-red-500'
                      : percent < 40
                      ? 'bg-amber-500'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${Math.max(8, Math.min(100, percent))}%` }}
                >
                  <Droplets className="w-3.5 h-3.5 opacity-80 mr-1" />
                  {percent}%
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1">
                <span>{t.emptyLabel}</span>
                <span>{t.halfFullLabel} ({Math.round(currentTanker.capacity_liters / 2).toLocaleString()} L)</span>
                <span>{t.fullLabel} ({currentTanker.capacity_liters.toLocaleString()} L)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500">Alert Threshold:</span>
              <span className="font-mono font-bold text-slate-800">{currentTanker.min_alert_threshold.toLocaleString()} L</span>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {t.currentStock}
                </span>
                <div className="text-2xl font-black text-blue-600 font-mono">
                  {currentTanker.current_stock_liters.toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Current fuel in bowzer ready for dispensing</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Remaining Ullage / Capacity
                </span>
                <div className="text-2xl font-black text-slate-800 font-mono">
                  {Math.max(0, currentTanker.capacity_liters - currentTanker.current_stock_liters).toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Available capacity for bulk depot stock-in</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Filtered Movements
                </span>
                <div className="text-xs space-y-1 mt-1 font-mono">
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Stock In:</span>
                    <span>+{totalStockInLiters.toLocaleString()} L</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Dispensed:</span>
                    <span>-{totalDispensedLiters.toLocaleString()} L</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Total throughput across selected date range</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Bowzer Stock Movement Ledger Section */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              {t.stockHistory} ({filteredLogs.length} {t.recordsCount})
            </h3>
            <p className="text-xs text-slate-500">
              {t.inflowOutflow}
            </p>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700">Type:</span>
            <select
              value={logTypeFilter}
              onChange={e => setLogTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
            >
              <option value="all">{t.filterAll}</option>
              <option value="stock_in">{t.filterStockIn}</option>
              <option value="dispense_out">{t.filterDispense}</option>
              <option value="dip_adjustment">{t.filterAdj}</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs"
            />
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs"
            />
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDatePreset('all')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                !dateFrom && !dateTo ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {t.allTime}
            </button>
            <button
              onClick={() => handleDatePreset('today')}
              className="px-2 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {t.today}
            </button>
            <button
              onClick={() => handleDatePreset('7days')}
              className="px-2 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {t.last7Days}
            </button>
            <button
              onClick={() => handleDatePreset('month')}
              className="px-2 py-1 rounded-md text-[11px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {t.thisMonth}
            </button>
          </div>

          <div className="flex-1 min-w-[180px]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3.5">{t.date}</th>
                <th className="py-2.5 px-3.5">{t.type}</th>
                <th className="py-2.5 px-3.5 text-right">{t.liters}</th>
                <th className="py-2.5 px-3.5 text-right">{t.balanceAfter}</th>
                <th className="py-2.5 px-3.5">{t.details}</th>
                <th className="py-2.5 px-3.5">{t.ref}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t.noMovementLogs}
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-slate-700 whitespace-nowrap">
                        {log.date}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {log.log_type === 'stock_in' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-700" />
                            <span>{t.bulkStockInBadge}</span>
                          </span>
                        ) : log.log_type === 'dip_adjustment' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold text-[10px]">
                            <Sliders className="w-3 h-3 text-purple-700" />
                            <span>{t.dipAdjBadge}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                            <ArrowUpRight className="w-3 h-3 text-amber-700" />
                            <span>{t.dispenseBadge}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-extrabold whitespace-nowrap">
                        <span className={log.log_type === 'stock_in' ? 'text-emerald-700' : 'text-amber-700'}>
                          {log.log_type === 'stock_in' ? '+' : '-'}{log.liters.toLocaleString()} L
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap bg-slate-50/50">
                        {log.new_stock.toLocaleString()} L
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-800 font-medium">
                        {log.source_or_vehicle}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-500 font-mono text-[11px]">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & CSV Export */}
        <div className="pt-2 border-t border-slate-100">
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredLogs.length}
            totalUnfilteredItems={tankerLogs.filter(l => l.tanker_id === currentTanker?.id).length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onExportCurrentPageCsv={handleExportCurrentViewCsv}
            onExportAllCsv={handleExportAllCsv}
            itemName="movements"
          />
        </div>
      </div>

      {/* MODAL: Bulk Stock-In */}
      {showStockInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-sm mb-1">
              {t.modalTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t.modalSubtitle}
            </p>

            <form onSubmit={handleSaveStockIn} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.dateLabel}</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={e => setLogDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.litersInputLabel}</label>
                  <input
                    type="number"
                    value={logLiters}
                    onChange={e => setLogLiters(e.target.value)}
                    placeholder="9000"
                    min="1"
                    step="any"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.rateInputLabel}</label>
                  <input
                    type="number"
                    value={logRate}
                    onChange={e => setLogRate(e.target.value)}
                    placeholder="108.0"
                    step="0.1"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.invoiceLabel}</label>
                  <input
                    type="text"
                    value={logInvoice}
                    onChange={e => setLogInvoice(e.target.value)}
                    placeholder="CH-98129"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.supplierLabel}</label>
                <input
                  type="text"
                  value={logSupplier}
                  onChange={e => setLogSupplier(e.target.value)}
                  placeholder="Meghna Petroleum Bulk Depot"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.notesLabel}</label>
                <input
                  type="text"
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  placeholder="Lorry No: Dhaka Metro-Dha 14-2211"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStockInModal(false)}
                  className="w-1/2 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  {t.saveStockInBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Dispense / Dip Adjustment */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-sm mb-1">
              {t.adjModalTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t.adjModalSubtitle}
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.adjTypeLabel}</label>
                <select
                  value={adjType}
                  onChange={e => setAdjType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800"
                >
                  <option value="dispense_out">{t.typeDispenseOut}</option>
                  <option value="dip_adjustment">{t.typeDipAdj}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.dateLabel}</label>
                  <input
                    type="date"
                    value={adjDate}
                    onChange={e => setAdjDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.adjLitersLabel}</label>
                  <input
                    type="number"
                    value={adjLiters}
                    onChange={e => setAdjLiters(e.target.value)}
                    placeholder="250"
                    step="any"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.adjTargetLabel}</label>
                <input
                  type="text"
                  value={adjTarget}
                  onChange={e => setAdjTarget(e.target.value)}
                  placeholder={t.adjTargetPlaceholder}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.notesLabel}</label>
                <input
                  type="text"
                  value={adjNotes}
                  onChange={e => setAdjNotes(e.target.value)}
                  placeholder="e.g. Rooppur Reactor Project Base Generator Duty"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="w-1/2 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md"
                >
                  {t.saveAdjBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register New Bowzer */}
      {showAddBowzerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-sm mb-1">
              {t.bowzerModalTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t.bowzerModalSubtitle}
            </p>

            <form onSubmit={handleSaveNewBowzer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.bowzerNameLabel}</label>
                <input
                  type="text"
                  value={bowzerName}
                  onChange={e => setBowzerName(e.target.value)}
                  placeholder={t.bowzerNamePlaceholder}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.bowzerLocationLabel}</label>
                <input
                  type="text"
                  value={bowzerLocation}
                  onChange={e => setBowzerLocation(e.target.value)}
                  placeholder={t.bowzerLocationPlaceholder}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.bowzerCapLabel}</label>
                  <input
                    type="number"
                    value={bowzerCapacity}
                    onChange={e => setBowzerCapacity(e.target.value)}
                    placeholder="15000"
                    min="1"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.bowzerStockLabel}</label>
                  <input
                    type="number"
                    value={bowzerCurrentStock}
                    onChange={e => setBowzerCurrentStock(e.target.value)}
                    placeholder="5000"
                    min="0"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.bowzerThresholdLabel}</label>
                <input
                  type="number"
                  value={bowzerThreshold}
                  onChange={e => setBowzerThreshold(e.target.value)}
                  placeholder="3000"
                  min="1"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBowzerModal(false)}
                  className="w-1/2 py-2 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-100"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold shadow-md"
                >
                  {t.saveBowzerBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
