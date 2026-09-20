import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TablePagination } from './TablePagination';
import { CsvExportMenu } from './CsvExportMenu';
import { exportToCsv } from '../utils/csvExporter';
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  Truck,
  TrendingDown,
  DollarSign,
  Droplets,
  Calendar,
  CheckCircle,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';
import { FuelEntry } from '../types';

export const AnomaliesView: React.FC = () => {
  const {
    language,
    currentUser,
    fuelEntries,
    vehicles,
    companies,
    pumps,
    categories
  } = useApp();

  const isViewer = currentUser?.role === 'client_viewer';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [selectedAnomaly, setSelectedAnomaly] = useState<FuelEntry | null>(null);
  const [auditSuccessMsg, setAuditSuccessMsg] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const t = {
    title: 'Fuel Anomaly & Theft Investigation Center',
    subtitle: 'Automated detection of suspicious fuel drains and below-benchmark efficiency violations',
    totalAnomalies: 'Total Flagged Entries',
    estLostLiters: 'Estimated Excess Liters',
    estFinancialLoss: 'Estimated Financial Loss (BDT)',
    alertDesc: 'Automatically triggered when vehicle mileage falls >20% below standard benchmark or equipment consumes >25% higher LPH.',
    recordsCount: 'records',
    belowStandardDesc: 'Mileage below approved operational threshold',
    theftRiskDesc: 'Excess consumption or suspected drain/leakage',
    financialLossDesc: 'Total financial loss incurred from inefficiency',
    algorithmRulesLabel: 'System Algorithm Rules:',
    searchPlaceholder: 'Search vehicle number or slip no...',
    companyLabel: 'Company:',
    allCompanies: 'All Companies',
    tableDate: 'Date & Slip',
    tableVehicle: 'Vehicle & Driver',
    tableCompany: 'Company',
    tableActualVsBenchmark: 'Actual vs Target Benchmark',
    tableDeviation: 'Deviation %',
    tableLostFuel: 'Estimated Excess (L)',
    tableSource: 'Source',
    tableAuditNote: 'Audit Action',
    noAnomaliesFound: 'No anomaly records detected. Fleet fuel consumption is strictly within benchmarks.',
    targetPrefix: 'Target:',
    worseSuffix: 'worse',
    lossSuffix: 'loss',
    bowzerLabel: 'Diesel Bowzer',
    pumpLabel: 'Fuel Pump',
    auditBtn: 'Audit Review',
    modalTitle: 'Fuel Anomaly Audit & Investigation',
    slipNoLabel: 'Slip No:',
    dateLabel: 'Date:',
    totalFuelLabel: 'Total Fuel:',
    distanceLabel: 'Distance / Hours:',
    actualMileageLabel: 'Actual Mileage:',
    standardPrefix: 'Standard:',
    deviationRateLabel: 'Deviation Rate:',
    auditNotesLabel: 'Investigation Status & Audit Notes',
    auditPlaceholder: 'Instructed workshop mechanics to inspect vehicle fuel line seals and fuel gauge calibration.',
    closeBtn: 'Close',
    fileReportBtn: 'File Audit Report',
    auditSuccessNotice: 'Audit report and findings saved successfully.'
  };

  // Anomalous entries list
  const anomalies = useMemo(() => {
    return fuelEntries.filter(e => e.is_anomaly);
  }, [fuelEntries]);

  // Calculations for total lost fuel and loss in BDT
  const summary = useMemo(() => {
    let excessLiters = 0;
    let financialLoss = 0;

    anomalies.forEach(e => {
      const vehicle = vehicles.find(v => v.id === e.vehicle_id);
      const cat = categories.find(c => c.id === vehicle?.category_id);
      const isLph = cat?.metric_type === 'lph';

      if (isLph) {
        // Expected liters = distance (hours) * benchmark
        const expectedLiters = e.distance_traveled * e.benchmark_mileage;
        const diff = Math.max(0, e.fuel_liters - expectedLiters);
        excessLiters += diff;
        financialLoss += diff * (e.total_amount / (e.fuel_liters || 1));
      } else {
        // KMPL: Expected liters for distance = distance / benchmark
        const expectedLiters = e.distance_traveled / (e.benchmark_mileage || 1);
        const diff = Math.max(0, e.fuel_liters - expectedLiters);
        excessLiters += diff;
        financialLoss += diff * (e.total_amount / (e.fuel_liters || 1));
      }
    });

    return {
      count: anomalies.length,
      excessLiters: Math.round(excessLiters),
      financialLoss: Math.round(financialLoss)
    };
  }, [anomalies, vehicles, categories]);

  // Filtered anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(e => {
      if (filterCompany !== 'all' && e.company_id !== filterCompany) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const veh = vehicles.find(v => v.id === e.vehicle_id);
        const vNum = veh?.vehicle_number.toLowerCase() || '';
        const driver = veh?.driver_name.toLowerCase() || '';
        const slip = e.slip_no.toLowerCase();
        if (!vNum.includes(term) && !driver.includes(term) && !slip.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [anomalies, filterCompany, searchTerm, vehicles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCompany]);

  const paginatedAnomalies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAnomalies.slice(start, start + pageSize);
  }, [filteredAnomalies, currentPage, pageSize]);

  // CSV Exporters
  const formatAnomalyRow = (entry: FuelEntry) => {
    const vehicle = vehicles.find(v => v.id === entry.vehicle_id);
    const company = companies.find(c => c.id === entry.company_id);
    const pump = pumps.find(p => p.id === entry.pump_id);
    const cat = categories.find(c => c.id === vehicle?.category_id);
    const isLph = cat?.metric_type === 'lph';

    let expectedLiters = isLph
      ? entry.distance_traveled * entry.benchmark_mileage
      : entry.distance_traveled / (entry.benchmark_mileage || 1);
    const lostLiters = Math.max(0, Math.round(entry.fuel_liters - expectedLiters));
    const lossBdt = Math.round(lostLiters * (entry.total_amount / (entry.fuel_liters || 1)));

    return [
      entry.entry_date,
      entry.slip_no,
      vehicle?.vehicle_number || '',
      vehicle?.driver_name || '',
      company?.name || '',
      entry.calculated_mileage,
      entry.benchmark_mileage,
      `${entry.anomaly_diff_percent}%`,
      lostLiters,
      lossBdt,
      entry.source_type === 'tanker' ? 'Diesel Bowzer' : pump?.name || 'Fuel Pump'
    ];
  };

  const csvHeaders = [
    'Date',
    'Slip No',
    'Vehicle Number',
    'Driver',
    'Company',
    'Actual Mileage',
    'Benchmark Mileage',
    'Deviation',
    'Estimated Excess Liters',
    'Estimated Loss (BDT)',
    'Fuel Source'
  ];

  const handleExportCurrentCsv = () => {
    const rows = paginatedAnomalies.map(formatAnomalyRow);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Fuel_Anomalies_Page_${currentPage}_(${paginatedAnomalies.length}_records)_${dateStr}`, csvHeaders, rows);
  };

  const handleExportAllCsv = () => {
    const rows = filteredAnomalies.map(formatAnomalyRow);
    const dateStr = new Date().toISOString().split('T')[0];
    const isFiltered = filteredAnomalies.length !== anomalies.length;
    const filterTag = isFiltered ? `Filtered_${filteredAnomalies.length}_of_${anomalies.length}` : `All_${filteredAnomalies.length}`;
    exportToCsv(`Fuel_Anomalies_${filterTag}_records_${dateStr}`, csvHeaders, rows);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-red-600" />
          <span>{t.title}</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium">{t.subtitle}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-red-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-500">
              {t.totalAnomalies}
            </span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">
            {summary.count} {t.recordsCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{t.belowStandardDesc}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t.estLostLiters}
            </span>
            <Droplets className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {summary.excessLiters.toLocaleString()} Liters
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{t.theftRiskDesc}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {t.estFinancialLoss}
            </span>
            <DollarSign className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">
            BDT {summary.financialLoss.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{t.financialLossDesc}</p>
        </div>
      </div>

      {auditSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{auditSuccessMsg}</span>
          </div>
          <button
            onClick={() => setAuditSuccessMsg(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* System Warning Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">{t.algorithmRulesLabel}</span> {t.alertDesc}
        </div>
      </div>

      {/* Filter and Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-slate-500 font-bold">{t.companyLabel}</span>
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium"
            >
              <option value="all">{t.allCompanies}</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <CsvExportMenu
              onExportCurrentPage={handleExportCurrentCsv}
              onExportAll={handleExportAllCsv}
              currentPage={currentPage}
              totalPages={Math.max(1, Math.ceil(filteredAnomalies.length / pageSize))}
              currentPageCount={paginatedAnomalies.length}
              totalFilteredCount={filteredAnomalies.length}
              totalUnfilteredCount={anomalies.length}
              startItem={filteredAnomalies.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              endItem={Math.min(currentPage * pageSize, filteredAnomalies.length)}
              entityName="anomalies"
              buttonVariant="header"
              dropDirection="down"
            />
          </div>
        </div>

        {/* Anomalies Table */}
        <div className="overflow-x-auto rounded-xl border border-red-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-red-50 text-red-900 font-bold uppercase text-[10px] tracking-wider border-b border-red-200">
              <tr>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.tableDate}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.tableVehicle}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.tableCompany}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.tableActualVsBenchmark}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.tableDeviation}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.tableLostFuel}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.tableSource}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3 text-right">{t.tableAuditNote}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedAnomalies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {t.noAnomaliesFound}
                  </td>
                </tr>
              ) : (
                paginatedAnomalies.map(entry => {
                  const vehicle = vehicles.find(v => v.id === entry.vehicle_id);
                  const company = companies.find(c => c.id === entry.company_id);
                  const pump = pumps.find(p => p.id === entry.pump_id);
                  const cat = categories.find(c => c.id === vehicle?.category_id);
                  const isLph = cat?.metric_type === 'lph';

                  // Calculate excess liters for this entry
                  let expectedLiters = isLph
                    ? entry.distance_traveled * entry.benchmark_mileage
                    : entry.distance_traveled / (entry.benchmark_mileage || 1);
                  const lostLiters = Math.max(0, Math.round(entry.fuel_liters - expectedLiters));
                  const lossBdt = Math.round(lostLiters * (entry.total_amount / (entry.fuel_liters || 1)));

                  return (
                    <tr key={entry.id} className="hover:bg-red-50/60 transition-colors">
                      {/* Date & Slip */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{entry.entry_date}</div>
                        <div className="text-[10px] font-mono text-slate-400">{entry.slip_no}</div>
                      </td>

                      {/* Vehicle */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3">
                        <div className="font-bold text-slate-900 whitespace-nowrap">{vehicle?.vehicle_number}</div>
                        <div className="text-[11px] text-slate-500 whitespace-nowrap">{vehicle?.driver_name} ({vehicle?.driver_phone})</div>
                      </td>

                      {/* Company */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{company?.code || company?.name}</span>
                      </td>

                      {/* Actual vs Benchmark */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap font-mono">
                        <div className="text-red-600 font-black">
                          {entry.calculated_mileage}{' '}
                          <span className="text-[10px] font-normal text-slate-500">
                            ({t.targetPrefix} {entry.benchmark_mileage} {isLph ? 'L/Hr' : 'KM/L'})
                          </span>
                        </div>
                      </td>

                      {/* Deviation */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-mono font-bold text-[10px] border border-red-200">
                          {entry.anomaly_diff_percent}% {t.worseSuffix}
                        </span>
                      </td>

                      {/* Lost Fuel */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap font-mono">
                        <span className="font-bold text-red-600">~{lostLiters} L</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">BDT {lossBdt.toLocaleString()} {t.lossSuffix}</span>
                      </td>

                      {/* Source */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap text-slate-600">
                        {entry.source_type === 'tanker' ? t.bowzerLabel : pump?.name || t.pumpLabel}
                      </td>

                      {/* Audit */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedAnomaly(entry)}
                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
                        >
                          {t.auditBtn}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredAnomalies.length}
            totalUnfilteredItems={anomalies.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onExportCurrentPageCsv={handleExportCurrentCsv}
            onExportAllCsv={handleExportAllCsv}
            itemName="flagged anomalies"
          />
        </div>
      </div>

      {/* MODAL: Audit Review */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-black text-slate-900 text-sm">{t.modalTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-2 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1">
                <div><strong>{t.slipNoLabel}</strong> {selectedAnomaly.slip_no}</div>
                <div><strong>{t.dateLabel}</strong> {selectedAnomaly.entry_date}</div>
                <div><strong>{t.totalFuelLabel}</strong> {selectedAnomaly.fuel_liters} Liters (BDT {selectedAnomaly.total_amount.toLocaleString()})</div>
                <div><strong>{t.distanceLabel}</strong> {selectedAnomaly.distance_traveled} KM / Hours</div>
                <div><strong>{t.actualMileageLabel}</strong> {selectedAnomaly.calculated_mileage} ({t.standardPrefix} {selectedAnomaly.benchmark_mileage})</div>
                <div><strong>{t.deviationRateLabel}</strong> {selectedAnomaly.anomaly_diff_percent}%</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.auditNotesLabel}</label>
                <textarea
                  rows={3}
                  defaultValue={t.auditPlaceholder}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedAnomaly(null)}
                className={`${isViewer ? 'w-full' : 'w-1/2'} py-2 rounded-xl border border-slate-300 font-bold text-xs`}
              >
                {t.closeBtn}
              </button>
              {!isViewer && (
                <button
                  onClick={() => {
                    setAuditSuccessMsg(t.auditSuccessNotice);
                    setSelectedAnomaly(null);
                  }}
                  className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
                >
                  {t.fileReportBtn}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
