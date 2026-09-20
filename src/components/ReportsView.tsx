import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateCleanVectorPdf, downloadElementAsA4Pdf, PdfReportData } from '../utils/pdfGenerator';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  Building,
  Truck,
  CreditCard,
  Layers,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Search,
  Clock,
  Fuel,
  TrendingDown,
  TrendingUp,
  Loader2,
  FileCheck,
  UserCheck,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    language,
    currentTenant,
    currentUser,
    activeAuthRole,
    saasOwner,
    activeModerator,
    fuelEntries,
    companies,
    vehicles,
    pumps,
    tankers,
    categories,
    payments
  } = useApp();

  const a4ReportRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfStatusMessage, setPdfStatusMessage] = useState('');
  const [pdfOrientation, setPdfOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const [reportType, setReportType] = useState<
    'vehicle_performance' | 'company_monthly' | 'days_wise' | 'pump_reconciliation' | 'raw_ledger'
  >('vehicle_performance');

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1); // First of current month
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [filterSource, setFilterSource] = useState<'all' | 'pump' | 'tanker'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const t = {
    title: 'Reporting & Export Center',
    subtitle: 'Vehicle-wise, customer company-wise, daily days-wise and pump ledger export & audit',
    reportTypeVehicle: '1. Vehicle Mileage & Consumption (Vehicle-wise)',
    reportTypeCompany: '2. Customer Company Statement (Company-wise)',
    reportTypeDays: '3. Daily Fuel Usage Audit (Days-wise / Daily)',
    reportTypePump: '4. Pump Reconciliation & Settlement (Pump Credit)',
    reportTypeRaw: '5. Detailed Fuel Slip Transaction Ledger (Raw Slips)',
    filterDateFrom: 'From Date',
    filterDateTo: 'To Date',
    companyFilter: 'Customer Company:',
    vehicleFilter: 'Select Vehicle:',
    sourceFilter: 'Fuel Source:',
    allCompanies: 'All Companies',
    allVehicles: 'All Vehicles',
    allSources: 'All Sources (Pump & Bowzer)',
    pumpSourceOnly: 'Fuel Pump Only',
    tankerSourceOnly: 'Internal Bowzer Only',
    printBtn: 'Print Preview',
    csvBtn: 'Export CSV / Excel',
    pdfDownloadBtn: 'Download A4 PDF',
    pdfGenerating: 'Generating PDF...',
    pdfLandscape: 'A4 Landscape',
    pdfPortrait: 'A4 Portrait',
    fontNotice: 'A4 Layout • Times New Roman Font',
    preparedByTitle: 'Prepared By',
    verifiedByTitle: 'Verified By',
    approvedByTitle: 'Approved By',
    totalLiters: 'Total Liters',
    totalCost: 'Total Cost (BDT)',
    entryCount: 'Total Entries',
    countSuffix: 'entries',
    filterRangePrefix: 'Filter Range:',
    toText: 'to',
    reportSubHeader: 'Fleet Fuel Management & Consumption Audit Report',
    generatedDatePrefix: 'Generated Date:',
    grandTotal: 'Grand Total:',
    quickPresets: 'Quick Presets:',
    today: 'Today',
    yesterday: 'Yesterday',
    last7Days: 'Last 7 Days',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    allTime: 'All Time',
    searchPlaceholder: 'Search vehicle reg, slip, driver...',
    // Report 1: Vehicle performance columns
    thVehicleNumber: 'Vehicle Reg No',
    thDriver: 'Driver',
    thCompany: 'Company',
    thCategory: 'Category',
    thTargetBenchmark: 'Benchmark',
    thActualMileage: 'Actual Mileage',
    thTotalDistance: 'Total Distance / Hrs',
    thTotalLiters: 'Total Liters (L)',
    thTotalAmount: 'Total Amount (BDT)',
    thTotalCost: 'Total Cost (BDT)',
    thAnomalies: 'Anomalies',
    anomalyCountSuffix: 'times',
    // Report 2: Company monthly columns
    thCode: 'Code',
    thActiveVehicles: 'Vehicles',
    thTotalTrips: 'Total Trips',
    // Report 3: Days-wise columns
    thDate: 'Date',
    thDayName: 'Day',
    thVehiclesCount: 'Vehicles',
    thPumpLiters: 'From Pump (L)',
    thBowzerLiters: 'From Bowzer (L)',
    // Report 4: Pump columns
    thPumpStation: 'Pump Station',
    thLocation: 'Location',
    thCreditLimit: 'Credit Limit',
    thTotalFuelReceived: 'Total Fuel Taken',
    thFuelChargedDue: 'Fuel Charged (+)',
    thPaidAmount: 'Settled Amount (-)',
    thOutstandingBalance: 'Current Due',
    // Report 5: Raw ledger columns
    thDateSlip: 'Date & Slip',
    thVehicle: 'Vehicle',
    thSource: 'Source',
    thDistance: 'Distance',
    thLiters: 'Liters',
    thMileage: 'Mileage',
    bowzerSource: 'Diesel Bowzer',
    pumpSource: 'Fuel Pump',
    yesText: 'Yes',
    noText: 'No',
    noDataFound: 'No fuel records found matching the filter criteria.'
  };

  // Quick Date Preset Handlers
  const handleDatePreset = (preset: 'today' | 'yesterday' | '7days' | 'month' | 'last_month' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'today') {
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setDateFrom(yStr);
      setDateTo(yStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(todayStr);
    } else if (preset === 'month') {
      const d = new Date();
      d.setDate(1);
      setDateFrom(d.toISOString().split('T')[0]);
      setDateTo(todayStr);
    } else if (preset === 'last_month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      setDateFrom(start.toISOString().split('T')[0]);
      setDateTo(end.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    }
  };

  // Vehicles filtered by selected company
  const availableVehiclesForFilter = useMemo(() => {
    if (filterCompany === 'all') return vehicles;
    return vehicles.filter(v => v.company_id === filterCompany);
  }, [vehicles, filterCompany]);

  // Base filtered entries by date range, company, vehicle, source, search
  const scopedEntries = useMemo(() => {
    return fuelEntries.filter(e => {
      if (dateFrom && e.entry_date < dateFrom) return false;
      if (dateTo && e.entry_date > dateTo) return false;
      if (filterCompany !== 'all' && e.company_id !== filterCompany) return false;
      if (filterVehicle !== 'all' && e.vehicle_id !== filterVehicle) return false;
      if (filterSource !== 'all' && e.source_type !== filterSource) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const veh = vehicles.find(v => v.id === e.vehicle_id);
        const comp = companies.find(c => c.id === e.company_id);
        const match =
          e.slip_no.toLowerCase().includes(q) ||
          (veh && veh.vehicle_number.toLowerCase().includes(q)) ||
          (veh && veh.driver_name.toLowerCase().includes(q)) ||
          (comp && comp.name.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [fuelEntries, dateFrom, dateTo, filterCompany, filterVehicle, filterSource, searchTerm, vehicles, companies]);

  // 1. Vehicle-wise aggregation
  const vehicleReportData = useMemo(() => {
    const listVehicles = filterVehicle !== 'all'
      ? vehicles.filter(v => v.id === filterVehicle)
      : availableVehiclesForFilter;

    return listVehicles.map(veh => {
      const entries = scopedEntries.filter(e => e.vehicle_id === veh.id);
      const cat = categories.find(c => c.id === veh.category_id);
      const comp = companies.find(c => c.id === veh.company_id);
      const isLph = cat?.metric_type === 'lph';

      const totalLiters = entries.reduce((acc, e) => acc + e.fuel_liters, 0);
      const totalCost = entries.reduce((acc, e) => acc + e.total_amount, 0);
      const totalDistance = entries.reduce((acc, e) => acc + e.distance_traveled, 0);
      const anomalies = entries.filter(e => e.is_anomaly).length;

      let avgMileage = 0;
      if (totalLiters > 0 && totalDistance > 0) {
        avgMileage = isLph
          ? parseFloat((totalLiters / totalDistance).toFixed(2))
          : parseFloat((totalDistance / totalLiters).toFixed(2));
      }

      return {
        id: veh.id,
        vehicleNumber: veh.vehicle_number,
        driver: veh.driver_name,
        company: comp?.name || '—',
        companyCode: comp?.code || '',
        category: cat?.name || '—',
        metric: isLph ? 'L/Hr' : 'KM/L',
        isLph,
        benchmark: veh.expected_benchmark,
        actualAvgMileage: avgMileage,
        totalDistance,
        totalLiters,
        totalCost,
        entriesCount: entries.length,
        anomalies
      };
    }).filter(row => filterVehicle !== 'all' || row.entriesCount > 0);
  }, [vehicles, availableVehiclesForFilter, scopedEntries, categories, companies, filterVehicle]);

  // 2. Company-wise aggregation
  const companyReportData = useMemo(() => {
    const map: {
      [compId: string]: {
        company: string;
        code: string;
        liters: number;
        cost: number;
        entries: number;
        vehiclesCount: Set<string>;
      };
    } = {};

    companies.forEach(c => {
      map[c.id] = {
        company: c.name,
        code: c.code || c.name,
        liters: 0,
        cost: 0,
        entries: 0,
        vehiclesCount: new Set()
      };
    });

    scopedEntries.forEach(e => {
      if (map[e.company_id]) {
        map[e.company_id].liters += e.fuel_liters;
        map[e.company_id].cost += e.total_amount;
        map[e.company_id].entries += 1;
        map[e.company_id].vehiclesCount.add(e.vehicle_id);
      }
    });

    return Object.values(map).filter(row => filterCompany === 'all' || row.entries > 0);
  }, [companies, scopedEntries, filterCompany]);

  // 3. Days-wise / Daily aggregation
  const daysWiseReportData = useMemo(() => {
    const dayMap: {
      [date: string]: {
        date: string;
        entriesCount: number;
        vehiclesSet: Set<string>;
        pumpLiters: number;
        bowzerLiters: number;
        totalLiters: number;
        totalCost: number;
        anomalies: number;
      };
    } = {};

    scopedEntries.forEach(e => {
      if (!dayMap[e.entry_date]) {
        dayMap[e.entry_date] = {
          date: e.entry_date,
          entriesCount: 0,
          vehiclesSet: new Set(),
          pumpLiters: 0,
          bowzerLiters: 0,
          totalLiters: 0,
          totalCost: 0,
          anomalies: 0
        };
      }

      const rec = dayMap[e.entry_date];
      rec.entriesCount += 1;
      rec.vehiclesSet.add(e.vehicle_id);
      rec.totalLiters += e.fuel_liters;
      rec.totalCost += e.total_amount;
      if (e.source_type === 'pump') {
        rec.pumpLiters += e.fuel_liters;
      } else {
        rec.bowzerLiters += e.fuel_liters;
      }
      if (e.is_anomaly) {
        rec.anomalies += 1;
      }
    });

    const daysList = Object.values(dayMap);
    // Sort descending by date
    daysList.sort((a, b) => b.date.localeCompare(a.date));
    return daysList;
  }, [scopedEntries]);

  // 4. Pump reconciliation
  const pumpReconciliationData = useMemo(() => {
    return pumps.map(pump => {
      const pumpEntries = scopedEntries.filter(e => e.source_type === 'pump' && e.pump_id === pump.id);
      const pumpPayments = payments.filter(p => {
        if (p.pump_id !== pump.id) return false;
        if (dateFrom && p.payment_date < dateFrom) return false;
        if (dateTo && p.payment_date > dateTo) return false;
        return true;
      });

      const totalFuelCharged = pumpEntries.reduce((acc, e) => acc + e.total_amount, 0);
      const totalLitersTaken = pumpEntries.reduce((acc, e) => acc + e.fuel_liters, 0);
      const totalPaid = pumpPayments.reduce((acc, p) => acc + p.amount, 0);

      return {
        id: pump.id,
        pumpName: pump.name,
        location: pump.location,
        creditLimit: pump.credit_limit,
        totalLitersTaken,
        totalFuelCharged,
        totalPaid,
        currentOutstanding: pump.current_balance
      };
    });
  }, [pumps, scopedEntries, payments, dateFrom, dateTo]);

  // Overall KPIs
  const totalLiters = useMemo(() => {
    return scopedEntries.reduce((acc, e) => acc + e.fuel_liters, 0);
  }, [scopedEntries]);

  const totalCost = useMemo(() => {
    return scopedEntries.reduce((acc, e) => acc + e.total_amount, 0);
  }, [scopedEntries]);

  const totalEntriesCount = scopedEntries.length;

  // CSV Export Trigger with UTF-8 BOM
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'vehicle_performance') {
      headers = [
        'Vehicle Number',
        'Driver Name',
        'Customer Company',
        'Category',
        'Metric',
        'Target Benchmark',
        'Actual Avg Mileage',
        'Total Distance/Hrs',
        'Total Liters (L)',
        'Total Amount (BDT)',
        'Anomalies Count',
        'Total Slips'
      ];
      rows = vehicleReportData.map(row => [
        `"${row.vehicleNumber}"`,
        `"${row.driver}"`,
        `"${row.company}"`,
        `"${row.category}"`,
        `"${row.metric}"`,
        row.benchmark.toString(),
        row.actualAvgMileage.toString(),
        row.totalDistance.toString(),
        row.totalLiters.toString(),
        row.totalCost.toString(),
        row.anomalies.toString(),
        row.entriesCount.toString()
      ]);
    } else if (reportType === 'company_monthly') {
      headers = ['Customer Company', 'Company Code', 'Active Vehicles Count', 'Total Slips/Trips', 'Total Liters (L)', 'Total Expense (BDT)'];
      rows = companyReportData.map(row => [
        `"${row.company}"`,
        `"${row.code}"`,
        row.vehiclesCount.size.toString(),
        row.entries.toString(),
        row.liters.toString(),
        row.cost.toString()
      ]);
    } else if (reportType === 'days_wise') {
      headers = ['Date', 'Vehicles Refueled', 'Total Slips', 'Pump Liters (L)', 'Bowzer Liters (L)', 'Total Liters (L)', 'Total Expense (BDT)', 'Anomalies'];
      rows = daysWiseReportData.map(row => [
        `"${row.date}"`,
        row.vehiclesSet.size.toString(),
        row.entriesCount.toString(),
        row.pumpLiters.toString(),
        row.bowzerLiters.toString(),
        row.totalLiters.toString(),
        row.totalCost.toString(),
        row.anomalies.toString()
      ]);
    } else if (reportType === 'pump_reconciliation') {
      headers = ['Pump Station', 'Location', 'Credit Limit (BDT)', 'Fuel Liters Taken (L)', 'Fuel Charged (BDT)', 'Settled Amount (BDT)', 'Current Outstanding (BDT)'];
      rows = pumpReconciliationData.map(row => [
        `"${row.pumpName}"`,
        `"${row.location}"`,
        row.creditLimit.toString(),
        row.totalLitersTaken.toString(),
        row.totalFuelCharged.toString(),
        row.totalPaid.toString(),
        row.currentOutstanding.toString()
      ]);
    } else {
      headers = ['Date', 'Slip No', 'Vehicle Number', 'Driver', 'Company', 'Source', 'Distance/Hrs', 'Liters (L)', 'Amount (BDT)', 'Mileage', 'Benchmark', 'Anomaly'];
      rows = scopedEntries.map(e => {
        const veh = vehicles.find(v => v.id === e.vehicle_id);
        const comp = companies.find(c => c.id === e.company_id);
        return [
          `"${e.entry_date}"`,
          `"${e.slip_no}"`,
          `"${veh?.vehicle_number || ''}"`,
          `"${veh?.driver_name || ''}"`,
          `"${comp?.name || ''}"`,
          `"${e.source_type.toUpperCase()}"`,
          e.distance_traveled.toString(),
          e.fuel_liters.toString(),
          e.total_amount.toString(),
          e.calculated_mileage.toString(),
          e.benchmark_mileage.toString(),
          e.is_anomaly ? 'YES' : 'NO'
        ];
      });
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FuelNest_${reportType}_(${rows.length}_records)_${dateFrom || 'all'}_to_${dateTo || 'present'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Downloading User Metadata for "Prepared By" Signatures & Audit Footprint
  const downloadingUser = useMemo(() => {
    if (activeAuthRole === 'saas_owner') {
      return {
        name: saasOwner?.name || 'Md. Mashud (Platform Owner)',
        roleTitle: 'SaaS Platform Owner & Chief Admin',
        roleTitleBn: 'SaaS Platform Owner & Chief Admin',
        email: saasOwner?.email || 'mashudrus@gmail.com',
        phone: saasOwner?.phone || '+880 1700-000000',
        username: saasOwner?.username || 'mashudalone',
        designation: 'Platform Owner'
      };
    }
    if (activeAuthRole === 'saas_moderator' && activeModerator) {
      return {
        name: activeModerator.name,
        roleTitle: 'SaaS Operations Moderator',
        roleTitleBn: 'SaaS Operations Moderator',
        email: activeModerator.email,
        phone: activeModerator.phone,
        username: activeModerator.username,
        designation: 'Operations Moderator'
      };
    }
    return {
      name: currentUser?.name || 'Authorized Fleet In-charge',
      roleTitle: currentUser?.role_title_bn ? `${currentUser.role_title_bn} (${currentUser.role})` : (currentUser?.role || 'Fleet Operator'),
      roleTitleBn: currentUser?.role_title_bn || 'Fleet In-charge',
      email: currentUser?.email || 'operator@fuelnest.xyz',
      phone: currentUser?.phone || '',
      username: currentUser?.username || currentUser?.id || 'EMP-001',
      designation: currentUser?.role_title_bn || 'Fleet In-charge'
    };
  }, [activeAuthRole, saasOwner, activeModerator, currentUser]);

  // Selected Target Customer Company Details
  const selectedTargetCompany = useMemo(() => {
    if (filterCompany === 'all') return null;
    return companies.find(c => c.id === filterCompany) || null;
  }, [filterCompany, companies]);

  // Complete Company Letterhead Information
  const letterheadInfo = useMemo(() => {
    return {
      tenantName: currentTenant?.name || 'Padma Multipurpose Fleet Services Ltd',
      tenantCode: currentTenant?.code || 'PMFS',
      tenantAddress: currentTenant?.address || 'Plot 14, Commercial Area, Ishwardi, Pabna',
      tenantPhone: currentTenant?.phone || '+880 1711-892341',
      tenantEmail: currentTenant?.email || 'admin@padmafleet.com',
      tenantContactPerson: currentTenant?.contact_person || 'M. A. Rahman',
      clientCompany: selectedTargetCompany ? {
        name: selectedTargetCompany.name,
        code: selectedTargetCompany.code,
        address: selectedTargetCompany.address,
        phone: selectedTargetCompany.phone,
        email: selectedTargetCompany.email,
        contactPerson: selectedTargetCompany.contact_person
      } : null
    };
  }, [currentTenant, selectedTargetCompany]);

  // PDF Download Handler with A4 Dimension and Times New Roman (ISSUE 4 Fix)
  const handleDownloadPDF = async (forcedOrientation?: 'landscape' | 'portrait') => {
    const chosenOrientation = forcedOrientation || pdfOrientation;
    setIsDownloadingPdf(true);
    setPdfStatusMessage('Generating Times New Roman A4 PDF document...');

    const targetCompanySlug = selectedTargetCompany ? `_${selectedTargetCompany.code}` : '';
    const dateRangeSlug = `${dateFrom || 'start'}_to_${dateTo || 'end'}`;
    const filename = `FuelNest_${reportType}${targetCompanySlug}_${dateRangeSlug}_A4.pdf`;

    let reportTitle = t.reportTypeVehicle;
    let tableHeaders: string[] = [];
    let tableRows: (string | number)[][] = [];

    if (reportType === 'vehicle_performance') {
      reportTitle = 'Vehicle Fuel & Mileage Performance Audit Report';
      tableHeaders = ['Vehicle No', 'Driver', 'Company', 'Category', 'Benchmark', 'Actual Avg', 'Distance/Hrs', 'Liters (L)', 'Cost (BDT)', 'Anomalies'];
      tableRows = vehicleReportData.map(r => [
        r.vehicleNumber,
        r.driver,
        r.company,
        r.category,
        `${r.benchmark} ${r.metric}`,
        `${r.actualAvgMileage} ${r.metric}`,
        r.totalDistance,
        r.totalLiters,
        r.totalCost,
        r.anomalies
      ]);
    } else if (reportType === 'company_monthly') {
      reportTitle = 'Company Wise Monthly Fuel Reconciliation Statement';
      tableHeaders = ['Company Name', 'Code', 'Vehicles Active', 'Total Slips', 'Fuel Liters (L)', 'Total Expense (BDT)'];
      tableRows = companyReportData.map(r => [
        r.company,
        r.code,
        r.vehiclesCount.size,
        r.entries,
        r.liters,
        r.cost
      ]);
    } else if (reportType === 'days_wise') {
      reportTitle = 'Daily Fuel Dispensation & Distribution Report';
      tableHeaders = ['Date', 'Vehicles', 'Slips', 'Pump (L)', 'Bowzer (L)', 'Total (L)', 'Expense (BDT)', 'Anomalies'];
      tableRows = daysWiseReportData.map(r => [
        r.date,
        r.vehiclesSet.size,
        r.entriesCount,
        r.pumpLiters,
        r.bowzerLiters,
        r.totalLiters,
        r.totalCost,
        r.anomalies
      ]);
    } else if (reportType === 'pump_reconciliation') {
      reportTitle = 'Pump Station Credit & Settlement Reconciliation Audit';
      tableHeaders = ['Pump Station', 'Location', 'Credit Limit (BDT)', 'Fuel Taken (L)', 'Charged (BDT)', 'Paid (BDT)', 'Outstanding (BDT)'];
      tableRows = pumpReconciliationData.map(r => [
        r.pumpName,
        r.location,
        r.creditLimit,
        r.totalLitersTaken,
        r.totalFuelCharged,
        r.totalPaid,
        r.currentOutstanding
      ]);
    } else {
      reportTitle = 'Detailed Raw Fuel Slip Audit Ledger';
      tableHeaders = ['Date', 'Slip No', 'Vehicle', 'Driver', 'Source', 'Km/Hrs', 'Liters (L)', 'Amount (BDT)', 'Mileage', 'Anomaly'];
      tableRows = scopedEntries.map(e => {
        const veh = vehicles.find(v => v.id === e.vehicle_id);
        return [
          e.entry_date,
          e.slip_no,
          veh?.vehicle_number || '-',
          veh?.driver_name || '-',
          e.source_type.toUpperCase(),
          e.distance_traveled,
          e.fuel_liters,
          e.total_amount,
          `${e.calculated_mileage} (${e.benchmark_mileage})`,
          e.is_anomaly ? 'FLAGGED' : 'NORMAL'
        ];
      });
    }

    const vectorData: PdfReportData = {
      filename,
      orientation: chosenOrientation,
      title: reportTitle,
      subtitle: `${letterheadInfo.tenantName} - Enterprise Fleet Logistics & Fuel Operations`,
      documentRef: `${letterheadInfo.tenantCode}/AUD/${reportType.slice(0, 4).toUpperCase()}/${dateFrom?.replace(/-/g, '') || 'ALL'}`,
      dateRange: `${dateFrom || 'Inception'} to ${dateTo || 'Current'}`,
      generatedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      tenantInfo: {
        name: letterheadInfo.tenantName,
        code: letterheadInfo.tenantCode,
        address: letterheadInfo.tenantAddress,
        phone: letterheadInfo.tenantPhone,
        email: letterheadInfo.tenantEmail,
        contactPerson: letterheadInfo.tenantContactPerson
      },
      clientInfo: selectedTargetCompany ? {
        name: selectedTargetCompany.name,
        code: selectedTargetCompany.code,
        address: selectedTargetCompany.address,
        phone: selectedTargetCompany.phone
      } : null,
      kpis: {
        totalLiters: Math.round(totalLiters).toLocaleString(),
        totalCost: Math.round(totalCost).toLocaleString(),
        totalEntries: totalEntriesCount,
        anomaliesCount: scopedEntries.filter(e => e.is_anomaly).length
      },
      tableHeaders,
      tableRows,
      preparedBy: {
        name: downloadingUser.name,
        roleTitle: downloadingUser.roleTitle,
        phone: downloadingUser.phone,
        email: downloadingUser.email
      }
    };

    try {
      // Primary: Pure vector PDF with standard Hex styling (100% immune to Tailwind oklch)
      const result = await generateCleanVectorPdf(vectorData, (status) => setPdfStatusMessage(status));

      if (!result.success && a4ReportRef.current) {
        // Fallback: Sanitized DOM capture
        const fallbackResult = await downloadElementAsA4Pdf(a4ReportRef.current, {
          filename,
          orientation: chosenOrientation,
          scale: 2,
          onProgress: (status) => setPdfStatusMessage(status)
        });
        if (!fallbackResult.success) {
          alert(`Failed to generate PDF: ${fallbackResult.error}`);
        }
      }
    } catch (err: any) {
      console.error('PDF error:', err);
      alert(`PDF download error: ${err.message}`);
    } finally {
      setIsDownloadingPdf(false);
      setPdfStatusMessage('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => `BDT ${Math.round(val).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Header & Export Toolbar (ISSUE 5 Fix) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.title}
          </h2>
          <p className="text-xs text-slate-500 font-medium">{t.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* A4 Orientation Picker */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 text-xs shadow-2xs">
            <button
              onClick={() => setPdfOrientation('landscape')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                pdfOrientation === 'landscape'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="A4 Landscape (Recommended for wide audit tables)"
            >
              A4 Landscape
            </button>
            <button
              onClick={() => setPdfOrientation('portrait')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                pdfOrientation === 'portrait'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="A4 Portrait"
            >
              A4 Portrait
            </button>
          </div>

          {/* Direct A4 PDF Download Button */}
          <button
            onClick={() => handleDownloadPDF()}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            title="Download true A4 PDF document with Times New Roman and Company Letterhead"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.pdfGenerating}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t.pdfDownloadBtn}</span>
              </>
            )}
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs shadow-2xs transition-all"
            title="Export raw data to Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{t.csvBtn}</span>
          </button>

          {/* Quick Print Preview Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all"
            title="Print Preview via browser dialog"
          >
            <Printer className="w-4 h-4" />
            <span>{t.printBtn}</span>
          </button>
        </div>
      </div>

      {/* Generating Progress Alert Bar */}
      {isDownloadingPdf && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold animate-pulse print:hidden">
          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
          <span>{pdfStatusMessage || t.pdfGenerating}</span>
        </div>
      )}

      {/* Report Type Selector Tabs (ISSUE 5 Fix) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 print:hidden">
        <button
          onClick={() => setReportType('vehicle_performance')}
          className={`p-3 rounded-xl text-left border transition-all ${
            reportType === 'vehicle_performance'
              ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Truck className={`w-4 h-4 mb-1.5 ${reportType === 'vehicle_performance' ? 'text-white' : 'text-amber-500'}`} />
          <span className="font-bold text-xs block">{t.reportTypeVehicle}</span>
        </button>

        <button
          onClick={() => setReportType('company_monthly')}
          className={`p-3 rounded-xl text-left border transition-all ${
            reportType === 'company_monthly'
              ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building className={`w-4 h-4 mb-1.5 ${reportType === 'company_monthly' ? 'text-white' : 'text-blue-500'}`} />
          <span className="font-bold text-xs block">{t.reportTypeCompany}</span>
        </button>

        <button
          onClick={() => setReportType('days_wise')}
          className={`p-3 rounded-xl text-left border transition-all ${
            reportType === 'days_wise'
              ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Calendar className={`w-4 h-4 mb-1.5 ${reportType === 'days_wise' ? 'text-white' : 'text-purple-500'}`} />
          <span className="font-bold text-xs block">{t.reportTypeDays}</span>
        </button>

        <button
          onClick={() => setReportType('pump_reconciliation')}
          className={`p-3 rounded-xl text-left border transition-all ${
            reportType === 'pump_reconciliation'
              ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CreditCard className={`w-4 h-4 mb-1.5 ${reportType === 'pump_reconciliation' ? 'text-white' : 'text-emerald-500'}`} />
          <span className="font-bold text-xs block">{t.reportTypePump}</span>
        </button>

        <button
          onClick={() => setReportType('raw_ledger')}
          className={`p-3 rounded-xl text-left border transition-all ${
            reportType === 'raw_ledger'
              ? 'bg-amber-500 border-amber-600 text-white shadow-sm'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Layers className={`w-4 h-4 mb-1.5 ${reportType === 'raw_ledger' ? 'text-white' : 'text-slate-500'}`} />
          <span className="font-bold text-xs block">{t.reportTypeRaw}</span>
        </button>
      </div>

      {/* Comprehensive Filter Toolbar (ISSUE 5 Fix) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>Filter & Audit Parameters</span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="text-slate-400 font-bold mr-1 hidden sm:inline">{t.quickPresets}</span>
            <button
              onClick={() => handleDatePreset('today')}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              {t.today}
            </button>
            <button
              onClick={() => handleDatePreset('yesterday')}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              {t.yesterday}
            </button>
            <button
              onClick={() => handleDatePreset('7days')}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              {t.last7Days}
            </button>
            <button
              onClick={() => handleDatePreset('month')}
              className="px-2 py-1 rounded-md bg-amber-100 text-amber-900 font-bold"
            >
              {t.thisMonth}
            </button>
            <button
              onClick={() => handleDatePreset('last_month')}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              {t.lastMonth}
            </button>
            <button
              onClick={() => handleDatePreset('all')}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
            >
              {t.allTime}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Company filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">{t.companyFilter}</label>
            <select
              value={filterCompany}
              onChange={e => {
                setFilterCompany(e.target.value);
                setFilterVehicle('all');
              }}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">{t.allCompanies}</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.code ? `(${c.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">{t.vehicleFilter}</label>
            <select
              value={filterVehicle}
              onChange={e => setFilterVehicle(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">{t.allVehicles}</option>
              {availableVehiclesForFilter.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_number} ({v.driver_name})
                </option>
              ))}
            </select>
          </div>

          {/* Date range From */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">{t.filterDateFrom}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-mono"
            />
          </div>

          {/* Date range To */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">{t.filterDateTo}</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-mono"
            />
          </div>

          {/* Fuel Source filter */}
          <div>
            <label className="block text-slate-500 font-bold mb-1">{t.sourceFilter}</label>
            <select
              value={filterSource}
              onChange={e => setFilterSource(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="all">{t.allSources}</option>
              <option value="pump">{t.pumpSourceOnly}</option>
              <option value="tanker">{t.tankerSourceOnly}</option>
            </select>
          </div>
        </div>

        {/* Text Search */}
        <div className="relative pt-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Printable Report Section Container - Formatted specifically for A4 with Times New Roman */}
      <div
        ref={a4ReportRef}
        id="printable-report-area"
        className="a4-document-container p-6 sm:p-10 bg-white dark:bg-[#0f1a36] text-slate-900 dark:text-slate-100 rounded-2xl border border-slate-300 dark:border-blue-900/60 shadow-sm space-y-6"
        style={{
          fontFamily: '"Times New Roman", Times, "Tiro Bangla", serif',
        }}
      >
        {/* =========================================================================
            1. COMPANY OFFICIAL LETTERHEAD (Uses complete company details)
            ========================================================================= */}
        <div className="border-b-4 border-double border-slate-900 dark:border-amber-400/80 pb-5">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            {/* Primary Issuer / Fleet Operator Company Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-lg bg-slate-900 dark:bg-amber-400 text-amber-400 dark:text-slate-950 flex items-center justify-center font-serif font-black text-lg shadow-sm">
                  {letterheadInfo.tenantCode.slice(0, 2)}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-slate-900 dark:text-amber-300 leading-tight">
                    {letterheadInfo.tenantName}
                  </h1>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                    Enterprise Fleet Logistics & Fuel Operations
                  </span>
                </div>
              </div>

              <div className="text-xs text-slate-800 dark:text-slate-200 space-y-0.5 mt-2 pl-1 border-l-2 border-amber-500">
                <p>
                  <span className="font-bold text-slate-900 dark:text-amber-300">Corporate Office:</span> {letterheadInfo.tenantAddress}
                </p>
                <p>
                  <span className="font-bold text-slate-900 dark:text-amber-300">Helpline / Phone:</span> {letterheadInfo.tenantPhone} &nbsp;|&nbsp;{' '}
                  <span className="font-bold text-slate-900 dark:text-amber-300">Email:</span> {letterheadInfo.tenantEmail}
                </p>
                <p>
                  <span className="font-bold text-slate-900 dark:text-amber-300">System Ref / Tenant Code:</span> {letterheadInfo.tenantCode} &nbsp;|&nbsp;{' '}
                  <span className="font-bold text-slate-900 dark:text-amber-300">Fleet In-charge:</span> {letterheadInfo.tenantContactPerson}
                </p>
              </div>
            </div>

            {/* Document Metadata Box */}
            <div className="sm:text-right text-xs bg-slate-50 dark:bg-[#121f3f] border border-slate-300 dark:border-blue-900/60 p-3 rounded-xl min-w-[240px]">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 font-bold uppercase text-[11px] mb-2 tracking-wide">
                {reportType === 'vehicle_performance' && t.reportTypeVehicle}
                {reportType === 'company_monthly' && t.reportTypeCompany}
                {reportType === 'days_wise' && t.reportTypeDays}
                {reportType === 'pump_reconciliation' && t.reportTypePump}
                {reportType === 'raw_ledger' && t.reportTypeRaw}
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 space-y-0.5 text-[11px]">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Document Ref:</span>{' '}
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {letterheadInfo.tenantCode}/AUD/{reportType.slice(0, 4).toUpperCase()}/{dateFrom?.replace(/-/g, '') || 'ALL'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">{t.filterRangePrefix}</span>{' '}
                  <span className="text-slate-800 dark:text-slate-200">{dateFrom || 'Inception'} {t.toText} {dateTo || 'Current'}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">{t.generatedDatePrefix}</span>{' '}
                  <span className="text-slate-800 dark:text-slate-200">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-blue-900/40 mt-1">
                  Format: A4 ({pdfOrientation}) • Font: Times New Roman
                </div>
              </div>
            </div>
          </div>

          {/* Specific Client Company Details (If a client company is selected) */}
          {letterheadInfo.clientCompany && (
            <div className="mt-4 p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs">
              <div className="font-bold uppercase tracking-wider text-amber-950 dark:text-amber-300 text-[11px] mb-1">
                Client / Customer Company Information:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-slate-900 dark:text-slate-100">
                <div>
                  <span className="font-bold">Company Name:</span> {letterheadInfo.clientCompany.name} ({letterheadInfo.clientCompany.code})
                </div>
                <div>
                  <span className="font-bold">Contact Person:</span> {letterheadInfo.clientCompany.contactPerson || 'N/A'}
                </div>
                <div>
                  <span className="font-bold">Phone / Mobile:</span> {letterheadInfo.clientCompany.phone || 'N/A'}
                </div>
                <div className="sm:col-span-2">
                  <span className="font-bold">Registered Address:</span> {letterheadInfo.clientCompany.address || 'N/A'}
                </div>
                <div>
                  <span className="font-bold">Official Email:</span> {letterheadInfo.clientCompany.email || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Top Summary Stat Pills in Times New Roman */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#121f3f] p-4 rounded-xl border border-slate-300 dark:border-blue-900/60">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">{t.totalLiters}</span>
            <span className="font-bold text-slate-900 dark:text-white text-lg">{totalLiters.toLocaleString()} L</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">{t.totalCost}</span>
            <span className="font-bold text-slate-900 dark:text-amber-300 text-lg">{formatCurrency(totalCost)}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">{t.entryCount}</span>
            <span className="font-bold text-slate-900 dark:text-white text-lg">{totalEntriesCount} {t.countSuffix}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">Anomaly Flags</span>
            <span className="font-bold text-red-700 dark:text-red-400 text-lg">
              {scopedEntries.filter(e => e.is_anomaly).length} {scopedEntries.filter(e => e.is_anomaly).length === 1 ? 'time' : 'times'}
            </span>
          </div>
        </div>

        {/* REPORT 1: Vehicle-wise Performance Report */}
        {reportType === 'vehicle_performance' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">{t.thVehicleNumber}</th>
                  <th className="py-2.5 px-3">{t.thDriver}</th>
                  <th className="py-2.5 px-3">{t.thCompany}</th>
                  <th className="py-2.5 px-3">{t.thCategory}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTargetBenchmark}</th>
                  <th className="py-2.5 px-3 text-right">{t.thActualMileage}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalDistance}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalLiters}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalAmount}</th>
                  <th className="py-2.5 px-3 text-center">{t.thAnomalies}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vehicleReportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      {t.noDataFound}
                    </td>
                  </tr>
                ) : (
                  vehicleReportData.map(veh => {
                    const isGood = veh.isLph
                      ? veh.actualAvgMileage <= veh.benchmark
                      : veh.actualAvgMileage >= veh.benchmark;

                    return (
                      <tr key={veh.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                          {veh.vehicleNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {veh.driver}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {veh.company}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {veh.category}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                          {veh.benchmark} {veh.metric}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md ${
                            isGood ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                          }`}>
                            {veh.actualAvgMileage} {veh.metric}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800 whitespace-nowrap">
                          {veh.totalDistance.toLocaleString()} {veh.isLph ? 'Hrs' : 'KM'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {veh.totalLiters.toLocaleString()} L
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-amber-800 whitespace-nowrap">
                          {formatCurrency(veh.totalCost)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {veh.anomalies > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                              {veh.anomalies} {t.anomalyCountSuffix}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px]">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {vehicleReportData.length > 0 && (
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={7} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      {t.grandTotal}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black">
                      {totalLiters.toLocaleString()} L
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-amber-900">
                      {formatCurrency(totalCost)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {scopedEntries.filter(e => e.is_anomaly).length}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* REPORT 2: Company-wise Consumption Statement */}
        {reportType === 'company_monthly' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">{t.thCompany}</th>
                  <th className="py-2.5 px-3">{t.thCode}</th>
                  <th className="py-2.5 px-3 text-right">{t.thActiveVehicles}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalTrips}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalLiters}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalCost}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {companyReportData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {t.noDataFound}
                    </td>
                  </tr>
                ) : (
                  companyReportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                        {row.company}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {row.code}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {row.vehiclesCount.size}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {row.entries}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {row.liters.toLocaleString()} L
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-amber-800">
                        {formatCurrency(row.cost)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {companyReportData.length > 0 && (
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      {t.grandTotal}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black">
                      {totalLiters.toLocaleString()} L
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-amber-900">
                      {formatCurrency(totalCost)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* REPORT 3: Days-wise / Daily Fuel Usage Report */}
        {reportType === 'days_wise' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">{t.thDate}</th>
                  <th className="py-2.5 px-3 text-right">{t.thVehiclesCount}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalTrips}</th>
                  <th className="py-2.5 px-3 text-right">{t.thPumpLiters}</th>
                  <th className="py-2.5 px-3 text-right">{t.thBowzerLiters}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalLiters}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalCost}</th>
                  <th className="py-2.5 px-3 text-center">{t.thAnomalies}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {daysWiseReportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {t.noDataFound}
                    </td>
                  </tr>
                ) : (
                  daysWiseReportData.map(day => (
                    <tr key={day.date} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {day.date}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {day.vehiclesSet.size}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {day.entriesCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-medium">
                        {day.pumpLiters.toLocaleString()} L
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-purple-700 font-medium">
                        {day.bowzerLiters.toLocaleString()} L
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {day.totalLiters.toLocaleString()} L
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-amber-800">
                        {formatCurrency(day.totalCost)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {day.anomalies > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                            {day.anomalies} {t.anomalyCountSuffix}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {daysWiseReportData.length > 0 && (
                <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={5} className="py-2.5 px-3 text-right uppercase text-[11px]">
                      {t.grandTotal}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black">
                      {totalLiters.toLocaleString()} L
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-amber-900">
                      {formatCurrency(totalCost)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {scopedEntries.filter(e => e.is_anomaly).length}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* REPORT 4: Pump Reconciliation Report */}
        {reportType === 'pump_reconciliation' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">{t.thPumpStation}</th>
                  <th className="py-2.5 px-3">{t.thLocation}</th>
                  <th className="py-2.5 px-3 text-right">{t.thCreditLimit}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalFuelReceived}</th>
                  <th className="py-2.5 px-3 text-right">{t.thFuelChargedDue}</th>
                  <th className="py-2.5 px-3 text-right">{t.thPaidAmount}</th>
                  <th className="py-2.5 px-3 text-right">{t.thOutstandingBalance}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pumpReconciliationData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      {t.noDataFound}
                    </td>
                  </tr>
                ) : (
                  pumpReconciliationData.map(pump => (
                    <tr key={pump.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-extrabold text-slate-900 whitespace-nowrap">
                        {pump.pumpName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {pump.location}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        BDT {pump.creditLimit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {pump.totalLitersTaken.toLocaleString()} L
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800">
                        +BDT {pump.totalFuelCharged.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                        -BDT {pump.totalPaid.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-red-600 bg-red-50/50">
                        BDT {pump.currentOutstanding.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 5: Detailed Raw Transaction Slips */}
        {reportType === 'raw_ledger' && (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">{t.thDateSlip}</th>
                  <th className="py-2.5 px-3">{t.thVehicle}</th>
                  <th className="py-2.5 px-3">{t.thCompany}</th>
                  <th className="py-2.5 px-3">{t.thSource}</th>
                  <th className="py-2.5 px-3 text-right">{t.thDistance}</th>
                  <th className="py-2.5 px-3 text-right">{t.thLiters}</th>
                  <th className="py-2.5 px-3 text-right">{t.thTotalAmount}</th>
                  <th className="py-2.5 px-3 text-right">{t.thMileage}</th>
                  <th className="py-2.5 px-3 text-center">{t.thAnomalies}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {scopedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      {t.noDataFound}
                    </td>
                  </tr>
                ) : (
                  scopedEntries.map(e => {
                    const veh = vehicles.find(v => v.id === e.vehicle_id);
                    const comp = companies.find(c => c.id === e.company_id);

                    return (
                      <tr key={e.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900">{e.entry_date}</div>
                          <div className="text-[10px] font-mono text-slate-400">{e.slip_no}</div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {veh?.vehicle_number}
                          <span className="block text-[10px] text-slate-400 font-normal">{veh?.driver_name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {comp?.name}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            e.source_type === 'pump' ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                          }`}>
                            {e.source_type === 'pump' ? t.pumpSource : t.bowzerSource}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                          {e.distance_traveled.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {e.fuel_liters.toLocaleString()} L
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-amber-800">
                          {formatCurrency(e.total_amount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {e.calculated_mileage}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {e.is_anomaly ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                              Anomaly
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[10px]">Normal</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* =========================================================================
            3. OFFICIAL 3-PARTY AUDIT SIGNATURES (With Prepared By User Information)
            ========================================================================= */}
        <div className="pt-10 mt-8 border-t-2 border-slate-900 dark:border-amber-400/80 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          {/* 1. Prepared By - Filled with the actual downloading user's details */}
          <div className="p-3 bg-slate-50 dark:bg-[#121f3f] border border-slate-300 dark:border-blue-900/60 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pb-1 border-b border-dashed border-slate-400 dark:border-blue-900/80 mb-2">
                {t.preparedByTitle}
              </div>
              <div className="font-bold text-sm text-slate-900 dark:text-amber-300">
                {downloadingUser.name}
              </div>
              <div className="text-xs text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                {downloadingUser.roleTitle}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                <div><span className="font-bold">Email:</span> {downloadingUser.email || 'N/A'}</div>
                {downloadingUser.phone && <div><span className="font-bold">Phone:</span> {downloadingUser.phone}</div>}
                <div><span className="font-bold">User / ID:</span> {downloadingUser.username}</div>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-300 dark:border-blue-900/60 text-[10px] text-slate-500 dark:text-slate-400">
              <div><span className="font-bold">Date & Time:</span> {new Date().toLocaleString()}</div>
              <div className="italic text-emerald-800 dark:text-emerald-400 font-semibold mt-0.5">✓ Electronically Authenticated</div>
            </div>
          </div>

          {/* 2. Verified By - Fleet Accounts / Auditor */}
          <div className="p-3 bg-slate-50 dark:bg-[#121f3f] border border-slate-300 dark:border-blue-900/60 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pb-1 border-b border-dashed border-slate-400 dark:border-blue-900/80 mb-2">
                {t.verifiedByTitle}
              </div>
              <div className="h-10 border-b border-dashed border-slate-400 dark:border-blue-900/80 mb-2"></div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                Fleet Auditor / Senior Accountant
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Accounts & Fuel Audit Verification
              </div>
            </div>
            <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400">
              Signature & Official Stamp
            </div>
          </div>

          {/* 3. Approved By - Executive Authority */}
          <div className="p-3 bg-slate-50 dark:bg-[#121f3f] border border-slate-300 dark:border-blue-900/60 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 pb-1 border-b border-dashed border-slate-400 dark:border-blue-900/80 mb-2">
                {t.approvedByTitle}
              </div>
              <div className="h-10 border-b border-dashed border-slate-400 dark:border-blue-900/80 mb-2"></div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                Managing Director / Fleet Head
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Executive Approval & Release
              </div>
            </div>
            <div className="pt-2 text-[10px] text-slate-500 dark:text-slate-400">
              Executive Seal & Date
            </div>
          </div>
        </div>

        {/* Formal A4 Document Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 gap-2">
          <div>
            Official Audit Statement • {letterheadInfo.tenantName} • Layout: A4 Standard (210×297mm) • Font: Times New Roman
          </div>
          <div>
            Prepared by: <span className="font-bold text-slate-800 dark:text-slate-200">{downloadingUser.name}</span> on {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};
