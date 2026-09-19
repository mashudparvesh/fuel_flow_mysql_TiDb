import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { downloadElementAsA4Pdf, generateCleanPumpStatementPdf } from '../utils/pdfGenerator';
import { TablePagination } from './TablePagination';
import { CsvExportMenu } from './CsvExportMenu';
import { exportToCsv } from '../utils/csvExporter';
import {
  CreditCard,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle2,
  FileText,
  Building,
  TrendingDown,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Printer,
  Search,
  Trash2,
  Filter,
  AlertCircle,
  ExternalLink,
  Fuel,
  LayoutGrid,
  Table as TableIcon,
  X,
  Phone,
  MapPin,
  Clock,
  Check,
  Loader2
} from 'lucide-react';
import { PumpPayment, FuelPump, FuelEntry } from '../types';

export const PumpCreditView: React.FC = () => {
  const {
    language,
    currentTenant,
    currentUser,
    activeAuthRole,
    saasOwner,
    activeModerator,
    pumps,
    payments,
    fuelEntries,
    addPumpPayment,
    deletePumpPayment
  } = useApp();

  const isViewer = currentUser?.role === 'client_viewer';

  const statementRef = useRef<HTMLDivElement>(null);
  const [isDownloadingStatementPdf, setIsDownloadingStatementPdf] = useState(false);

  const [selectedPumpFilter, setSelectedPumpFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  // Statement & Reconciliation Modal State
  const [statementPumpId, setStatementPumpId] = useState<string | null>(null);
  const [statementDateFrom, setStatementDateFrom] = useState<string>('');
  const [statementDateTo, setStatementDateTo] = useState<string>('');

  // Form State for Payment
  const [payPumpId, setPayPumpId] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'cheque' | 'cash' | 'mfs'>('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Downloading User Metadata for "Prepared By" Signatures & Audit Footprint
  const downloadingUser = useMemo(() => {
    if (activeAuthRole === 'saas_owner') {
      return {
        name: saasOwner?.name || 'Md. Mashud (Platform Owner)',
        roleTitle: 'SaaS Platform Owner & Chief Admin',
        roleTitleBn: 'SaaS Platform Owner & Chief Admin',
        email: saasOwner?.email || 'mashudrus@gmail.com',
        phone: saasOwner?.phone || '+880 1700-000000',
        username: saasOwner?.username || 'mashudalone'
      };
    }
    if (activeAuthRole === 'saas_moderator' && activeModerator) {
      return {
        name: activeModerator.name,
        roleTitle: 'SaaS Operations Moderator',
        roleTitleBn: 'SaaS Operations Moderator',
        email: activeModerator.email,
        phone: activeModerator.phone,
        username: activeModerator.username
      };
    }
    return {
      name: currentUser?.name || 'Authorized Accounts In-charge',
      roleTitle: currentUser?.role_title_bn ? `${currentUser.role_title_bn} (${currentUser.role})` : (currentUser?.role || 'Fleet Operator'),
      roleTitleBn: currentUser?.role_title_bn || 'Fleet In-charge',
      email: currentUser?.email || 'accounts@fuelnest.xyz',
      phone: currentUser?.phone || '',
      username: currentUser?.username || currentUser?.id || 'EMP-001'
    };
  }, [activeAuthRole, saasOwner, activeModerator, currentUser]);

  // Keep payPumpId in sync with available pumps
  useEffect(() => {
    if (!payPumpId && pumps.length > 0) {
      setPayPumpId(pumps[0].id);
    }
  }, [pumps, payPumpId]);

  const t = {
    title: 'Fuel Pump Credit, Due & Ledger Balance',
    subtitle: 'Complete breakdown of fuel purchased from each pump, outstanding due, advance payments, and reconciliation statements',
    recordPaymentBtn: '+ Record Payment',
    exportCsvBtn: 'Download Ledger CSV',
    printBtn: 'Print',
    totalCreditLimit: 'Total Credit Limit',
    totalOutstanding: 'Total Outstanding Due',
    totalAdvance: 'Total Advance Paid',
    totalFuelTaken: 'Total Fuel Purchased',
    totalPaidAmount: 'Total Payments Settled',
    availableCredit: 'Available Credit Room',
    usedPercent: '% Used',
    creditLimitLabel: 'Credit Limit',
    openingDueLabel: 'Opening Due',
    currentDueLabel: 'Current Status',
    payNowBtn: 'Record Payment',
    statementBtn: 'Reconciliation Statement',
    pumpSummaryTitle: 'Master Fuel Pump Balance & Status Summary',
    pumpSummaryDesc: 'Fuel intake cost, settlements, and net outstanding due or advance per pump station',
    tableView: 'Table View',
    cardsView: 'Cards View',
    pumpNameCol: 'Pump Station & Location',
    creditLimitCol: 'Credit Limit',
    openingCol: 'Opening Due',
    fuelIntakeCol: 'Fuel Purchased',
    paidCol: 'Total Paid',
    statusCol: 'Current Status',
    availableCol: 'Available Room',
    actionsCol: 'Actions',
    combinedLedger: 'Pump Credit & Charge Ledger (Running Balance)',
    transactionsCount: 'transactions',
    combinedLedgerDesc: 'Detailed financial ledger tracking fuel charges (Debit), settlements (Credit) and running due balance',
    pumpFilterLabel: 'Select Pump:',
    allPumps: 'All Fuel Pumps',
    dateFilter: 'Date Range',
    from: 'From',
    to: 'To',
    searchPlaceholder: 'Search by slip, cheque, vehicle...',
    allTime: 'All Time',
    today: 'Today',
    last7Days: 'Last 7 Days',
    thisMonth: 'This Month',
    date: 'Date',
    pump: 'Pump Station',
    type: 'Type',
    descriptionAndRef: 'Description & Voucher / Slip',
    debitAmount: 'Charge (+)',
    creditAmount: 'Paid (-)',
    runningBalance: 'Running Balance',
    noTransactions: 'No transactions found matching the filter criteria.',
    fuelChargeType: 'Fuel Charge (+)',
    paymentSettleType: 'Settlement (-)',
    dueStatus: 'Due Owed',
    advanceStatus: 'Advance Paid',
    settledStatus: 'Fully Settled (Nil)',
    statementModalTitle: 'Fuel Pump Billing & Payment Reconciliation Statement',
    statementModalSubtitle: 'Official statement sheet for bill verification, settlement negotiation, and accounts signing',
    filterPeriod: 'Statement Period:',
    downloadCsvStatement: 'Download CSV / Excel',
    printStatementBtn: 'Print Statement / PDF',
    summaryBoxTitle: 'Financial Summary',
    fuelHistoryTitle: 'Itemized Refueling Slips',
    paymentHistoryTitle: 'Payment Settlement History',
    vehicleNo: 'Vehicle No',
    driver: 'Driver',
    fuelType: 'Fuel Type',
    liters: 'Liters',
    rate: 'Rate (৳)',
    total: 'Total (৳)',
    refNo: 'Cheque / Ref No',
    method: 'Method',
    recordedBy: 'Recorded By',
    preparedBy: 'Prepared By (Fleet Supervisor)',
    verifiedBy: 'Verified By (Accounts Officer)',
    pumpAuthority: 'Fuel Pump Authority / Seal',
    netPayable: 'Net Outstanding Due:',
    netAdvance: 'Advance Credit Balance:',
    paymentModalTitle: 'Record Pump Settlement Payment',
    paymentModalSubtitle: 'Pump balance will automatically update upon saving this payment.',
    selectPumpLabel: 'Select Fuel Pump Station *',
    duePrefix: 'Status:',
    payDateLabel: 'Payment Date *',
    payAmountLabel: 'Payment Amount (BDT) *',
    payMethodLabel: 'Payment Method *',
    methodBank: 'Bank Transfer',
    methodCheque: 'Cheque',
    methodCash: 'Cash',
    methodMfs: 'MFS (bKash / Nagad)',
    refLabel: 'Cheque No / Transaction ID *',
    notesLabel: 'Notes / Remarks',
    cancelBtn: 'Cancel',
    submitPaymentBtn: 'Save Payment',
    deleteConfirmTitle: 'Confirm Payment Deletion',
    deleteConfirmDesc: 'Are you sure you want to delete this payment record? The pump outstanding due will be restored.',
    confirmDeleteBtn: 'Yes, Delete Payment'
  };

  // -------------------------------------------------------------
  // Calculate Complete Per-Pump Intelligence & Accounting Summary
  // -------------------------------------------------------------
  const pumpStatsList = useMemo(() => {
    return pumps.map(pump => {
      const pEntries = fuelEntries.filter(
        e => e.source_type === 'pump' && e.pump_id === pump.id
      );
      const pPayments = payments.filter(p => p.pump_id === pump.id);

      const totalFuelLiters = Math.round(
        pEntries.reduce((sum, e) => sum + (e.fuel_liters || 0), 0) * 10
      ) / 10;
      const totalFuelCost = Math.round(
        pEntries.reduce((sum, e) => sum + (e.total_amount || 0), 0)
      );
      const totalPaid = Math.round(
        pPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
      );
      const openingDue = Math.round(pump.opening_balance || 0);

      // Total Debit = Opening Due + All Fuel Charges
      const totalDebit = openingDue + totalFuelCost;
      // Net Balance = Total Debit - Total Payments
      const netBalance = totalDebit - totalPaid;

      const dueAmount = netBalance > 0 ? netBalance : 0;
      const advanceAmount = netBalance < 0 ? Math.abs(netBalance) : 0;
      const isSettled = netBalance === 0;

      const creditLimit = pump.credit_limit || 0;
      const availableCredit = Math.max(0, creditLimit - dueAmount);
      const usagePercent = Math.min(
        100,
        Math.round((dueAmount / (creditLimit || 1)) * 100)
      );

      // Latest dates
      const lastFuelDate =
        pEntries.length > 0
          ? pEntries.slice().sort((a, b) => b.entry_date.localeCompare(a.entry_date))[0]
              .entry_date
          : null;
      const lastPayDate =
        pPayments.length > 0
          ? pPayments
              .slice()
              .sort((a, b) => b.payment_date.localeCompare(a.payment_date))[0]
              .payment_date
          : null;

      return {
        pump,
        totalFuelLiters,
        totalFuelCost,
        fuelEntriesCount: pEntries.length,
        totalPaid,
        paymentsCount: pPayments.length,
        openingDue,
        totalDebit,
        netBalance,
        dueAmount,
        advanceAmount,
        isSettled,
        creditLimit,
        availableCredit,
        usagePercent,
        lastFuelDate,
        lastPayDate,
        entries: pEntries,
        payments: pPayments
      };
    });
  }, [pumps, fuelEntries, payments]);

  // Aggregate Totals across all pumps
  const aggregateTotals = useMemo(() => {
    let totalDue = 0;
    let totalAdvance = 0;
    let totalFuelVal = 0;
    let totalFuelLiters = 0;
    let totalPaidVal = 0;
    let totalCreditLimit = 0;

    pumpStatsList.forEach(item => {
      totalDue += item.dueAmount;
      totalAdvance += item.advanceAmount;
      totalFuelVal += item.totalFuelCost;
      totalFuelLiters += item.totalFuelLiters;
      totalPaidVal += item.totalPaid;
      totalCreditLimit += item.creditLimit;
    });

    const totalAvailable = Math.max(0, totalCreditLimit - totalDue);

    return {
      totalDue,
      totalAdvance,
      totalFuelVal,
      totalFuelLiters: Math.round(totalFuelLiters * 10) / 10,
      totalPaidVal,
      totalCreditLimit,
      totalAvailable
    };
  }, [pumpStatsList]);

  // -------------------------------------------------------------
  // Chronological Running Balance Ledger Construction
  // -------------------------------------------------------------
  const transactionsWithRunningBalance = useMemo(() => {
    interface TxItem {
      id: string;
      date: string;
      timestamp: number;
      pump_id: string;
      type: 'charge' | 'payment';
      amount: number;
      description: string;
      ref: string;
      rawNotes?: string;
    }

    const allTx: TxItem[] = [];

    // Fuel Entry charges (matching both 'pump' source type or assigned pump_id)
    fuelEntries.forEach(entry => {
      if (entry.pump_id && (entry.source_type === 'pump' || !entry.source_type)) {
        const rawTime = new Date(entry.entry_date).getTime();
        allTx.push({
          id: entry.id,
          date: entry.entry_date,
          timestamp: isNaN(rawTime) ? 0 : rawTime,
          pump_id: entry.pump_id,
          type: 'charge',
          amount: entry.total_amount || 0,
          description: `Fuel Intake (${entry.fuel_liters || 0}L) • Slip: ${entry.slip_no || 'N/A'}`,
          ref: entry.slip_no || 'N/A',
          rawNotes: entry.notes
        });
      }
    });

    // Payments
    payments.forEach(pay => {
      const rawTime = new Date(pay.payment_date).getTime();
      allTx.push({
        id: pay.id,
        date: pay.payment_date,
        timestamp: isNaN(rawTime) ? 0 : rawTime,
        pump_id: pay.pump_id,
        type: 'payment',
        amount: pay.amount || 0,
        description: `Settlement (${(pay.payment_method || 'TRANSFER').toUpperCase()}) • Ref: ${pay.transaction_ref || 'TRX'}`,
        ref: pay.transaction_ref || 'TRX',
        rawNotes: pay.notes
      });
    });

    // Sort chronologically (oldest first) to compute running balances per pump
    allTx.sort((a, b) => a.timestamp - b.timestamp);

    // Track running balance per pump starting with opening balance
    const pumpRunningMap: { [pumpId: string]: number } = {};
    pumps.forEach(p => {
      pumpRunningMap[p.id] = p.opening_balance || 0;
    });

    const enriched = allTx.map(tx => {
      const prevBal = pumpRunningMap[tx.pump_id] ?? 0;
      let newBal = prevBal;
      if (tx.type === 'charge') {
        newBal = prevBal + tx.amount;
      } else {
        newBal = prevBal - tx.amount;
      }
      pumpRunningMap[tx.pump_id] = newBal;

      return {
        ...tx,
        runningBalance: newBal
      };
    });

    // Now reverse to show latest first
    enriched.reverse();

    // Apply filters
    return enriched.filter(tx => {
      if (selectedPumpFilter !== 'all' && tx.pump_id !== selectedPumpFilter) return false;
      const txDay = String(tx.date || '').split('T')[0].split(' ')[0];
      if (dateFrom && txDay < dateFrom) return false;
      if (dateTo && txDay > dateTo) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const pump = pumps.find(p => p.id === tx.pump_id);
        const match =
          tx.ref.toLowerCase().includes(q) ||
          tx.description.toLowerCase().includes(q) ||
          (pump && pump.name.toLowerCase().includes(q)) ||
          (tx.rawNotes && tx.rawNotes.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [fuelEntries, payments, pumps, selectedPumpFilter, dateFrom, dateTo, searchTerm]);

  // Aggregate stats for filtered transactions
  const totalFilteredCharges = useMemo(() => {
    return transactionsWithRunningBalance
      .filter(tx => tx.type === 'charge')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactionsWithRunningBalance]);

  const totalFilteredPayments = useMemo(() => {
    return transactionsWithRunningBalance
      .filter(tx => tx.type === 'payment')
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactionsWithRunningBalance]);

  // -------------------------------------------------------------
  // Pagination & CSV Export for Pump Stations List (Max 10 per page)
  // -------------------------------------------------------------
  const [currentPumpPage, setCurrentPumpPage] = useState(1);
  const pumpPageSize = 10;

  const paginatedPumpStats = useMemo(() => {
    const start = (currentPumpPage - 1) * pumpPageSize;
    return pumpStatsList.slice(start, start + pumpPageSize);
  }, [pumpStatsList, currentPumpPage]);

  const handleExportPumpStatsCurrentCsv = () => {
    const headers = [
      'Pump Station',
      'Location',
      'Phone',
      'Credit Limit',
      'Opening Due',
      'Fuel Cost',
      'Fuel Liters',
      'Total Paid',
      'Due Amount',
      'Advance Amount',
      'Available Limit'
    ];
    const rows = paginatedPumpStats.map(item => [
      item.pump.name,
      item.pump.location,
      item.pump.phone,
      item.creditLimit,
      item.openingDue,
      item.totalFuelCost,
      item.totalFuelLiters,
      item.totalPaid,
      item.dueAmount,
      item.advanceAmount,
      item.availableCredit
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Pump_Stations_Page_${currentPumpPage}_(${paginatedPumpStats.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportPumpStatsAllCsv = () => {
    const headers = [
      'Pump Station',
      'Location',
      'Phone',
      'Credit Limit',
      'Opening Due',
      'Fuel Cost',
      'Fuel Liters',
      'Total Paid',
      'Due Amount',
      'Advance Amount',
      'Available Limit'
    ];
    const rows = pumpStatsList.map(item => [
      item.pump.name,
      item.pump.location,
      item.pump.phone,
      item.creditLimit,
      item.openingDue,
      item.totalFuelCost,
      item.totalFuelLiters,
      item.totalPaid,
      item.dueAmount,
      item.advanceAmount,
      item.availableCredit
    ]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Pump_Stations_All_(${pumpStatsList.length}_records)_${currentTenant?.code || 'fleet'}_${dateStr}`, headers, rows);
  };

  // -------------------------------------------------------------
  // Pagination & CSV Export for Transactions Ledger (Max 10 per page)
  // -------------------------------------------------------------
  const [currentTxPage, setCurrentTxPage] = useState(1);
  const txPageSize = 10;

  useEffect(() => {
    setCurrentTxPage(1);
  }, [selectedPumpFilter, dateFrom, dateTo, searchTerm]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentTxPage - 1) * txPageSize;
    return transactionsWithRunningBalance.slice(start, start + txPageSize);
  }, [transactionsWithRunningBalance, currentTxPage]);

  const totalUnfilteredTransactionsCount = useMemo(() => {
    const pumpEntries = fuelEntries.filter(e => e.source_type === 'pump');
    return pumpEntries.length + payments.length;
  }, [fuelEntries, payments]);

  const handleExportTxCurrentCsv = () => {
    const headers = [
      'Date',
      'Pump Station',
      'Type',
      'Description',
      'Voucher / Ref',
      'Charge (+ BDT)',
      'Paid (- BDT)',
      'Running Balance (BDT)'
    ];
    const rows = paginatedTransactions.map(tx => {
      const pump = pumps.find(p => p.id === tx.pump_id);
      return [
        tx.date,
        pump?.name || '',
        tx.type === 'charge' ? 'Fuel Charge (+)' : 'Payment Settled (-)',
        tx.description,
        tx.ref,
        tx.type === 'charge' ? tx.amount : 0,
        tx.type === 'payment' ? tx.amount : 0,
        tx.runningBalance
      ];
    });
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Pump_Ledger_Page_${currentTxPage}_(${paginatedTransactions.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportTxAllCsv = () => {
    const headers = [
      'Date',
      'Pump Station',
      'Type',
      'Description',
      'Voucher / Ref',
      'Charge (+ BDT)',
      'Paid (- BDT)',
      'Running Balance (BDT)'
    ];
    const rows = transactionsWithRunningBalance.map(tx => {
      const pump = pumps.find(p => p.id === tx.pump_id);
      return [
        tx.date,
        pump?.name || '',
        tx.type === 'charge' ? 'Fuel Charge (+)' : 'Payment Settled (-)',
        tx.description,
        tx.ref,
        tx.type === 'charge' ? tx.amount : 0,
        tx.type === 'payment' ? tx.amount : 0,
        tx.runningBalance
      ];
    });
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Pump_Ledger_All_(${transactionsWithRunningBalance.length}_records)_${currentTenant?.code || 'fleet'}_${dateStr}`, headers, rows);
  };

  // -------------------------------------------------------------
  // Handlers & Statement Generation
  // -------------------------------------------------------------
  const handleOpenPayment = (pumpIdPre?: string) => {
    setFormError('');
    setPayPumpId(pumpIdPre || pumps[0]?.id || '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayAmount('');
    setPayMethod('bank_transfer');
    setPayRef(`TRX-${Math.floor(100000 + Math.random() * 900000)}`);
    setPayNotes('');
    setShowPaymentModal(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount);
    if (!payPumpId) {
      setFormError('Please select a pump');
      return;
    }
    if (!amountNum || amountNum <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }
    if (!payRef.trim()) {
      setFormError('Please enter a cheque or reference number');
      return;
    }

    addPumpPayment({
      pump_id: payPumpId,
      payment_date: payDate,
      amount: amountNum,
      payment_method: payMethod,
      transaction_ref: payRef.trim(),
      notes: payNotes.trim()
    });

    setShowPaymentModal(false);
  };

  const handleDeletePayment = (paymentId: string) => {
    deletePumpPayment(paymentId);
    setPaymentToDelete(null);
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

  // Open Statement Modal for a pump
  const handleOpenStatement = (pumpId: string) => {
    setStatementPumpId(pumpId);
    setStatementDateFrom('');
    setStatementDateTo('');
  };

  // Current Statement Target Pump Data
  const currentStatementData = useMemo(() => {
    if (!statementPumpId) return null;
    const stat = pumpStatsList.find(s => s.pump.id === statementPumpId);
    if (!stat) return null;

    const filteredEntries = stat.entries.filter(e => {
      if (statementDateFrom && e.entry_date < statementDateFrom) return false;
      if (statementDateTo && e.entry_date > statementDateTo) return false;
      return true;
    });

    const filteredPayments = stat.payments.filter(p => {
      if (statementDateFrom && p.payment_date < statementDateFrom) return false;
      if (statementDateTo && p.payment_date > statementDateTo) return false;
      return true;
    });

    const totalLiters = Math.round(
      filteredEntries.reduce((sum, e) => sum + (e.fuel_liters || 0), 0) * 10
    ) / 10;
    const totalCharges = Math.round(
      filteredEntries.reduce((sum, e) => sum + (e.total_amount || 0), 0)
    );
    const totalPaid = Math.round(
      filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    );
    const openingBalance = stat.openingDue;

    const netPeriodBalance = (openingBalance + totalCharges) - totalPaid;

    return {
      pump: stat.pump,
      openingBalance,
      filteredEntries,
      filteredPayments,
      totalLiters,
      totalCharges,
      totalPaid,
      netPeriodBalance,
      dueAmount: netPeriodBalance > 0 ? netPeriodBalance : 0,
      advanceAmount: netPeriodBalance < 0 ? Math.abs(netPeriodBalance) : 0,
      isSettled: netPeriodBalance === 0
    };
  }, [statementPumpId, pumpStatsList, statementDateFrom, statementDateTo]);

  // Export Pump Statement as CSV
  const handleExportPumpStatementCSV = () => {
    if (!currentStatementData) return;
    const { pump, openingBalance, filteredEntries, filteredPayments, totalCharges, totalPaid, dueAmount, advanceAmount } = currentStatementData;

    const lines: string[] = [
      `"FUEL FLOW - FUEL PUMP BILLING & RECONCILIATION STATEMENT"`,
      `"Pump Station:","${pump.name}"`,
      `"Location:","${pump.location}"`,
      `"Contact:","${pump.contact_person} (${pump.phone})"`,
      `"Statement Date:","${new Date().toISOString().split('T')[0]}"`,
      `"Period:","${statementDateFrom || 'All Time'} to ${statementDateTo || 'Latest'}"`,
      `""`,
      `"FINANCIAL SUMMARY"`,
      `"Opening Due Balance:","BDT ${openingBalance.toLocaleString()}"`,
      `"Total Fuel Intake (Charges):","BDT ${totalCharges.toLocaleString()}"`,
      `"Total Settlements Paid:","BDT ${totalPaid.toLocaleString()}"`,
      dueAmount > 0
        ? `"NET OUTSTANDING DUE PAYABLE:","BDT ${dueAmount.toLocaleString()}"`
        : `"NET ADVANCE CREDIT BALANCE:","BDT ${advanceAmount.toLocaleString()}"`,
      `""`,
      `"ITEMIZED FUEL REFUELING SLIPS"`,
      `"Date","Slip No","Vehicle ID","Fuel Liters","Unit Price (BDT)","Total Amount (BDT)","Notes"`
    ];

    filteredEntries.forEach(entry => {
      lines.push(
        `"${entry.entry_date}","${entry.slip_no}","${entry.vehicle_id}","${entry.fuel_liters}","${entry.unit_price}","${entry.total_amount}","${(entry.notes || '').replace(/"/g, '""')}"`
      );
    });

    lines.push(`""`);
    lines.push(`"PAYMENT SETTLEMENT HISTORY"`);
    lines.push(`"Date","Ref / Cheque No","Method","Amount (BDT)","Notes"`);

    filteredPayments.forEach(pay => {
      lines.push(
        `"${pay.payment_date}","${pay.transaction_ref}","${pay.payment_method.toUpperCase()}","${pay.amount}","${(pay.notes || '').replace(/"/g, '""')}"`
      );
    });

    const csvContent = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FuelPump_Statement_${pump.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Combined Ledger as CSV
  const handleExportCSV = () => {
    const headers = [
      'Date',
      'Pump Station',
      'Type',
      'Description',
      'Voucher / Ref',
      'Charge (+ BDT)',
      'Paid (- BDT)',
      'Running Balance (BDT)'
    ];
    const rows = transactionsWithRunningBalance.map(tx => {
      const pump = pumps.find(p => p.id === tx.pump_id);
      return [
        `"${tx.date}"`,
        `"${pump?.name || ''}"`,
        `"${tx.type === 'charge' ? 'Fuel Charge (+)' : 'Payment Settled (-)'}"`,
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${tx.ref}"`,
        tx.type === 'charge' ? tx.amount : 0,
        tx.type === 'payment' ? tx.amount : 0,
        tx.runningBalance
      ].join(',');
    });

    const csvData = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filterPumpName =
      selectedPumpFilter === 'all'
        ? 'All_Pumps'
        : pumps.find(p => p.id === selectedPumpFilter)?.name.replace(/\s+/g, '_') || 'Pump';
    a.download = `FuelNest_Pump_Ledger_${filterPumpName}_${dateFrom || 'start'}_to_${dateTo || 'end'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------
          Header Section
          ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t.title}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-500 dark:text-amber-300 font-mono font-bold text-xs">
              {pumps.length} Pumps
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-300 font-medium mt-0.5">
            {t.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CsvExportMenu
            onExportCurrentPage={handleExportTxCurrentCsv}
            onExportAll={handleExportTxAllCsv}
            currentPage={currentTxPage}
            totalPages={Math.max(1, Math.ceil(transactionsWithRunningBalance.length / txPageSize))}
            currentPageCount={paginatedTransactions.length}
            totalFilteredCount={transactionsWithRunningBalance.length}
            startItem={transactionsWithRunningBalance.length === 0 ? 0 : (currentTxPage - 1) * txPageSize + 1}
            endItem={Math.min(currentTxPage * txPageSize, transactionsWithRunningBalance.length)}
            entityName="transactions"
            buttonLabel={t.exportCsvBtn}
            buttonVariant="header"
            dropDirection="down"
          />
          {!isViewer && (
            <button
              onClick={() => handleOpenPayment()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.recordPaymentBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------
          Top Aggregate Statistics Cards (Ultra Contrast in Dark Mode)
          ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Outstanding Due */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1a36] border border-red-200 dark:border-red-900/50 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block mb-1">
            {t.totalOutstanding}
          </span>
          <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 font-mono">
            ৳{aggregateTotals.totalDue.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">
            {language === 'bn' ? 'সকল পাম্পের মোট বর্তমান বকেয়া' : 'Total current due to pumps'}
          </p>
        </div>

        {/* Total Advance Paid */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1a36] border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
            {t.totalAdvance}
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ৳{aggregateTotals.totalAdvance.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">
            {language === 'bn' ? 'পাম্পে অগ্রিম জমা থাকা টাকা' : 'Prepaid / Advance deposit'}
          </p>
        </div>

        {/* Total Fuel Intake */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
            {t.totalFuelTaken}
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            ৳{aggregateTotals.totalFuelVal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">
            {aggregateTotals.totalFuelLiters.toLocaleString()} {language === 'bn' ? 'লিটার মোট উত্তোলন' : 'Liters taken'}
          </p>
        </div>

        {/* Total Paid Settlements */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
            {t.totalPaidAmount}
          </span>
          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            ৳{aggregateTotals.totalPaidVal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1">
            {payments.length} {language === 'bn' ? 'টি পেমেন্ট ভাউচার' : 'Settlements'}
          </p>
        </div>

        {/* Credit Limit & Remaining */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300 block mb-1">
            {t.totalCreditLimit}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white font-mono">
            ৳{aggregateTotals.totalCreditLimit.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            {t.availableCredit}: ৳{aggregateTotals.totalAvailable.toLocaleString()}
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------------
          MASTER FUEL PUMP SUMMARY & STATUS (Table & Cards View)
          Shows: Fuel Intake, Total Due, Advance, Limits, and Statements
          ------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-blue-900/50 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                {t.pumpSummaryTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              {t.pumpSummaryDesc}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#091226] border border-slate-200 dark:border-blue-900/60">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>{t.tableView}</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'cards'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t.cardsView}</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABLE VIEW */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-blue-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#132247] text-slate-700 dark:text-amber-300 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-blue-900/60">
                <tr>
                  <th className="py-3 px-3.5">{t.pumpNameCol}</th>
                  <th className="py-3 px-3 text-right">{t.creditLimitCol}</th>
                  <th className="py-3 px-3 text-right">{t.openingCol}</th>
                  <th className="py-3 px-3 text-right">{t.fuelIntakeCol}</th>
                  <th className="py-3 px-3 text-right">{t.paidCol}</th>
                  <th className="py-3 px-3 text-center">{t.statusCol}</th>
                  <th className="py-3 px-3 text-right">{t.availableCol}</th>
                  <th className="py-3 px-3.5 text-center">{t.actionsCol}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-blue-900/40">
                {pumpStatsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Building className="w-8 h-8 text-amber-500 opacity-60" />
                        <p className="font-bold text-sm">
                          {language === 'bn' ? 'কোন ফুয়েল পাম্প স্টেশন পাওয়া যায়নি' : 'No fuel pump stations found'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {language === 'bn' ? 'মাস্টার ডাটা থেকে নতুন পাম্প যুক্ত করুন।' : 'Add a new pump station from Master Data view.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPumpStats.map(item => {
                    const { pump, totalFuelLiters, totalFuelCost, fuelEntriesCount, totalPaid, openingDue, dueAmount, advanceAmount, isSettled, creditLimit, availableCredit, usagePercent } = item;

                    return (
                      <tr
                        key={pump.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-[#142247] transition-colors"
                      >
                      {/* Pump Info */}
                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {pump.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-300 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-500" />
                            {pump.location}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {pump.phone}
                          </span>
                        </div>
                      </td>

                      {/* Credit Limit */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        ৳{creditLimit.toLocaleString()}
                      </td>

                      {/* Opening Due */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        ৳{openingDue.toLocaleString()}
                      </td>

                      {/* Total Fuel Consumed */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-black text-amber-700 dark:text-amber-300">
                          ৳{totalFuelCost.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-300 font-mono">
                          {totalFuelLiters.toLocaleString()} L ({fuelEntriesCount} {language === 'bn' ? 'বার' : 'slips'})
                        </div>
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono font-black text-blue-700 dark:text-blue-300">
                          ৳{totalPaid.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-300 font-mono">
                          {item.paymentsCount} {language === 'bn' ? 'টি পেমেন্ট' : 'payments'}
                        </div>
                      </td>

                      {/* Current Status (Due in Red, Advance in Green, Settled in Blue) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {dueAmount > 0 ? (
                          <span className="inline-flex flex-col items-center px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-300 font-bold">
                            <span className="font-mono font-black text-xs">
                              ৳{dueAmount.toLocaleString()}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold">
                              {t.dueStatus} ({usagePercent}%)
                            </span>
                          </span>
                        ) : advanceAmount > 0 ? (
                          <span className="inline-flex flex-col items-center px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-bold">
                            <span className="font-mono font-black text-xs">
                              ৳{advanceAmount.toLocaleString()}
                            </span>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold">
                              {t.advanceStatus}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                            <Check className="w-3 h-3" />
                            <span>{t.settledStatus}</span>
                          </span>
                        )}
                      </td>

                      {/* Available Limit */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        ৳{availableCredit.toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Reconciliation Statement Button */}
                          <button
                            onClick={() => handleOpenStatement(pump.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#142247] hover:bg-slate-100 dark:hover:bg-[#1c3063] text-slate-800 dark:text-amber-300 border border-slate-300 dark:border-amber-400/40 text-[11px] font-bold shadow-2xs transition-all"
                            title={language === 'bn' ? 'পেমেন্ট রিকনসিলিয়েশন স্টেটমেন্ট ভাউচার খুলুন' : 'Open Reconciliation Statement'}
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-500" />
                            <span>{language === 'bn' ? 'স্টেটমেন্ট' : 'Statement'}</span>
                          </button>

                          {/* Quick Pay Button */}
                          {!isViewer && (
                            <button
                              onClick={() => handleOpenPayment(pump.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-xs transition-all"
                              title={language === 'bn' ? 'পাম্পের বকেয়া পরিশোধ রেকর্ড করুন' : 'Record Payment'}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{language === 'bn' ? 'পেমেন্ট দিন' : 'Pay'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        ) : (
          /* CARDS VIEW */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paginatedPumpStats.map(item => {
              const { pump, totalFuelLiters, totalFuelCost, fuelEntriesCount, totalPaid, openingDue, dueAmount, advanceAmount, creditLimit, availableCredit, usagePercent } = item;

              return (
                <div
                  key={pump.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#091226] border border-slate-200 dark:border-blue-900/60 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-base">
                          {pump.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          {pump.location}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white dark:bg-[#142247] text-slate-800 dark:text-amber-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-blue-900/60">
                        {usagePercent}{t.usedPercent}
                      </span>
                    </div>

                    <div className="my-3 p-3 rounded-xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-300 font-medium">
                          {t.creditLimitLabel}:
                        </span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          ৳{creditLimit.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-300 font-medium">
                          {t.openingDueLabel}:
                        </span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          ৳{openingDue.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-300 font-medium">
                          {language === 'bn' ? 'ফুয়েল উত্তোলন (খরচ):' : 'Fuel Purchased:'}
                        </span>
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                          ৳{totalFuelCost.toLocaleString()} ({totalFuelLiters} L)
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-300 font-medium">
                          {language === 'bn' ? 'মোট পরিশোধিত:' : 'Total Paid:'}
                        </span>
                        <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                          ৳{totalPaid.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-blue-900/50">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {dueAmount > 0
                            ? (language === 'bn' ? 'বর্তমান বকেয়া (Due):' : 'Outstanding Due:')
                            : advanceAmount > 0
                            ? (language === 'bn' ? 'অগ্রিম জমা (Advance):' : 'Advance Paid:')
                            : (language === 'bn' ? 'বর্তমান স্থিতি:' : 'Status:')}
                        </span>
                        <span
                          className={`font-mono font-black text-sm ${
                            dueAmount > 0
                              ? 'text-red-600 dark:text-red-400'
                              : advanceAmount > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          ৳{(dueAmount > 0 ? dueAmount : advanceAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-[#060b18] rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercent > 80 ? 'bg-red-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>

                  <div className={`mt-4 grid ${isViewer ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                    <button
                      onClick={() => handleOpenStatement(pump.id)}
                      className="py-2 px-3 rounded-xl bg-white dark:bg-[#142247] hover:bg-slate-100 dark:hover:bg-[#1c3063] text-slate-800 dark:text-amber-300 font-bold text-xs border border-slate-200 dark:border-blue-900/60 shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'bn' ? 'স্টেটমেন্ট' : 'Statement'}</span>
                    </button>
                    {!isViewer && (
                      <button
                        onClick={() => handleOpenPayment(pump.id)}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'পেমেন্ট দিন' : 'Pay Now'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination & CSV Export for Pump Stations */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-blue-900/40">
          <TablePagination
            currentPage={currentPumpPage}
            totalItems={pumpStatsList.length}
            totalUnfilteredItems={pumps.length}
            pageSize={pumpPageSize}
            onPageChange={setCurrentPumpPage}
            onExportCurrentPageCsv={handleExportPumpStatsCurrentCsv}
            onExportAllCsv={handleExportPumpStatsAllCsv}
            itemName="pumps"
          />
        </div>
      </div>

      {/* -------------------------------------------------------------
          TRANSACTION RUNNING BALANCE LEDGER
          Chronological entries & payment history with live filters
          ------------------------------------------------------------- */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-blue-900/50 pb-3">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-amber-300">
              {t.combinedLedger} ({transactionsWithRunningBalance.length} {t.transactionsCount})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
              {t.combinedLedgerDesc}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-slate-400 dark:text-slate-300 block text-[10px] uppercase font-bold">
                {language === 'bn' ? 'ফিল্টারকৃত ফুয়েল চার্জ' : 'Filtered Charges'}
              </span>
              <span className="font-mono font-extrabold text-amber-700 dark:text-amber-400">
                +৳{totalFilteredCharges.toLocaleString()}
              </span>
            </div>
            <div className="text-right pl-3 border-l border-slate-200 dark:border-blue-900/60">
              <span className="text-slate-400 dark:text-slate-300 block text-[10px] uppercase font-bold">
                {language === 'bn' ? 'ফিল্টারকৃত পরিশোধ' : 'Filtered Payments'}
              </span>
              <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                -৳{totalFilteredPayments.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-50 dark:bg-[#091226] p-3 rounded-xl border border-slate-200 dark:border-blue-900/60">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-700 dark:text-slate-200">{t.pumpFilterLabel}</span>
            <select
              value={selectedPumpFilter}
              onChange={e => setSelectedPumpFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] font-semibold text-slate-800 dark:text-white"
            >
              <option value="all">{t.allPumps}</option>
              {pumps.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-blue-900 mx-1 hidden sm:block" />

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-slate-300 font-medium">{t.from}:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] text-xs"
            />
            <span className="text-slate-500 dark:text-slate-300 font-medium">{t.to}:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] text-xs"
            />
          </div>

          {/* Presets */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDatePreset('all')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                !dateFrom && !dateTo
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900 text-slate-600 dark:text-slate-200'
              }`}
            >
              {t.allTime}
            </button>
            <button
              onClick={() => handleDatePreset('today')}
              className="px-2 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#142247]"
            >
              {t.today}
            </button>
            <button
              onClick={() => handleDatePreset('7days')}
              className="px-2 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#142247]"
            >
              {t.last7Days}
            </button>
            <button
              onClick={() => handleDatePreset('month')}
              className="px-2 py-1 rounded-md text-[11px] font-bold bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#142247]"
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
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] focus:ring-1 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-blue-900/60">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#132247] text-slate-700 dark:text-amber-300 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-blue-900/60">
              <tr>
                <th className="py-2.5 px-3.5">{t.date}</th>
                <th className="py-2.5 px-3.5">{t.pump}</th>
                <th className="py-2.5 px-3.5">{t.type}</th>
                <th className="py-2.5 px-3.5">{t.descriptionAndRef}</th>
                <th className="py-2.5 px-3.5 text-right">{t.debitAmount}</th>
                <th className="py-2.5 px-3.5 text-right">{t.creditAmount}</th>
                <th className="py-2.5 px-3.5 text-right">{t.runningBalance}</th>
                <th className="py-2.5 px-3.5 text-center">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-blue-900/40">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-300 font-medium">
                    {t.noTransactions}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map(tx => {
                  const pump = pumps.find(p => p.id === tx.pump_id);

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#142247] transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {pump?.name}
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {tx.type === 'charge' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold text-[10px] border border-amber-200 dark:border-amber-800/60">
                            <ArrowUpRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>{t.fuelChargeType}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800/60">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{t.paymentSettleType}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-200">
                        <div className="font-semibold">{tx.description}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {tx.ref}
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        {tx.type === 'charge' ? `৳${tx.amount.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        {tx.type === 'payment' ? `৳${tx.amount.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap bg-slate-50/50 dark:bg-[#091226]/50">
                        ৳{tx.runningBalance.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        {tx.type === 'payment' ? (
                          !isViewer ? (
                            <button
                              onClick={() => setPaymentToDelete(tx.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-mono">
                              Paid
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[10px] font-mono">
                            Fuel
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & CSV Export for Transactions Ledger */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-blue-900/40">
          <TablePagination
            currentPage={currentTxPage}
            totalItems={transactionsWithRunningBalance.length}
            totalUnfilteredItems={totalUnfilteredTransactionsCount}
            pageSize={txPageSize}
            onPageChange={setCurrentTxPage}
            onExportCurrentPageCsv={handleExportTxCurrentCsv}
            onExportAllCsv={handleExportTxAllCsv}
            itemName="transactions"
          />
        </div>
      </div>

      {/* -------------------------------------------------------------
          MODAL: Official Fuel Pump Statement & Payment Reconciliation
          Includes download as CSV and printable sheet with signatures!
          ------------------------------------------------------------- */}
      {currentStatementData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:p-0 print:static print:bg-white print:overflow-visible">
          <div className="bg-white dark:bg-[#0a1228] rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-blue-900 max-h-[92vh] flex flex-col justify-between print:max-w-none print:max-h-none print:p-0 print:border-none print:shadow-none print:bg-white">
            {/* Modal Top Bar (hidden during print) */}
            <div className="print:hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-blue-900/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-slate-950 shadow-xs">
                    <FileText className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                      {t.statementModalTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {currentStatementData.pump.name} • {currentStatementData.pump.location}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Direct Vector A4 PDF Download Button */}
                  <button
                    onClick={async () => {
                      if (!currentStatementData) return;
                      setIsDownloadingStatementPdf(true);
                      const pumpSlug = currentStatementData.pump.name.replace(/\s+/g, '_');
                      const dateSlug = `${statementDateFrom || 'all'}_to_${statementDateTo || 'cur'}`;
                      const filename = `Pump_Statement_${pumpSlug}_${dateSlug}_A4.pdf`;

                      try {
                        const result = await generateCleanPumpStatementPdf({
                          filename,
                          statementRef: `REC-${currentStatementData.pump.id.slice(-4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                          generatedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                          dateRange: `${statementDateFrom || 'All Previous'} to ${statementDateTo || 'Present'}`,
                          tenantInfo: {
                            name: currentTenant.name,
                            code: currentTenant.code,
                            address: currentTenant.address,
                            phone: currentTenant.phone,
                            contactPerson: currentTenant.contact_person
                          },
                          pumpInfo: {
                            name: currentStatementData.pump.name,
                            location: currentStatementData.pump.location,
                            contactPerson: currentStatementData.pump.contact_person,
                            phone: currentStatementData.pump.phone
                          },
                          financialSummary: {
                            openingBalance: currentStatementData.openingBalance,
                            totalCharges: currentStatementData.totalCharges,
                            totalPaid: currentStatementData.totalPaid,
                            totalLiters: currentStatementData.totalLiters,
                            dueAmount: currentStatementData.dueAmount,
                            advanceAmount: currentStatementData.advanceAmount
                          },
                          fuelEntries: currentStatementData.filteredEntries.map(e => ({
                            entryDate: e.entry_date,
                            slipNo: e.slip_no,
                            vehicleId: e.vehicle_id,
                            fuelLiters: e.fuel_liters,
                            unitPrice: e.unit_price,
                            totalAmount: e.total_amount
                          })),
                          payments: currentStatementData.filteredPayments.map(p => ({
                            paymentDate: p.payment_date,
                            transactionRef: p.transaction_ref,
                            paymentMethod: p.payment_method,
                            amount: p.amount,
                            notes: p.notes
                          })),
                          preparedBy: {
                            name: downloadingUser.name,
                            roleTitle: downloadingUser.roleTitle,
                            username: downloadingUser.username,
                            email: downloadingUser.email
                          }
                        });

                        if (!result.success) {
                          alert(`Failed to generate PDF: ${result.error}`);
                        }
                      } catch (err: any) {
                        console.error('PDF error:', err);
                        alert(`PDF error: ${err.message}`);
                      } finally {
                        setIsDownloadingStatementPdf(false);
                      }
                    }}
                    disabled={isDownloadingStatementPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-black shadow-xs cursor-pointer"
                    title="Download high-quality vector A4 PDF document with Times New Roman and Company Letterhead"
                  >
                    {isDownloadingStatementPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download A4 PDF</span>
                  </button>

                  <button
                    onClick={handleExportPumpStatementCSV}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#142247] hover:bg-slate-100 dark:hover:bg-[#1c3063] text-slate-800 dark:text-amber-300 border border-slate-300 dark:border-blue-900 text-xs font-bold shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">{t.downloadCsvStatement}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t.printStatementBtn}</span>
                  </button>

                  <button
                    onClick={() => setStatementPumpId(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-blue-900/40"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Statement Filters */}
              <div className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs bg-slate-50 dark:bg-[#070e1e] px-4 rounded-xl my-4 border border-slate-200 dark:border-blue-900/60">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{t.filterPeriod}</span>
                  <input
                    type="date"
                    value={statementDateFrom}
                    onChange={e => setStatementDateFrom(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] text-xs"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={statementDateTo}
                    onChange={e => setStatementDateTo(e.target.value)}
                    className="px-2 py-1 rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] text-xs"
                  />
                </div>

                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-300">
                  {language === 'bn' ? 'তারিখ:' : 'Generated:'} {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Scrollable Printable Statement Body - Formatted for A4 and Times New Roman */}
            <div
              ref={statementRef}
              id="printable-pump-statement-area"
              className="a4-document-container overflow-y-auto space-y-5 pr-1 my-2 p-6 bg-white text-slate-900 rounded-xl border border-slate-300 print:overflow-visible print:border-none print:p-0 print:my-0 print:shadow-none"
              style={{
                fontFamily: '"Times New Roman", Times, "Tiro Bangla", serif',
                backgroundColor: '#ffffff',
                color: '#000000'
              }}
            >
              {/* PRINTABLE HEADER WITH COMPANY LETTERHEAD */}
              <div className="border-b-4 border-double border-slate-900 pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-tight text-black">
                      {currentTenant.name}
                    </h2>
                    <p className="text-xs text-slate-800">{currentTenant.address}</p>
                    <p className="text-xs text-slate-700">
                      Phone: {currentTenant.phone} &nbsp;|&nbsp; Reg Code: {currentTenant.code} &nbsp;|&nbsp; In-charge: {currentTenant.contact_person}
                    </p>
                  </div>
                  <div className="sm:text-right text-xs bg-slate-50 border border-slate-300 p-2.5 rounded-lg">
                    <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white font-bold uppercase text-[10px] mb-1">
                      PUMP CREDIT AUDIT STATEMENT
                    </span>
                    <div className="text-slate-800 font-semibold text-[11px]">
                      Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Layout: A4 • Font: Times New Roman
                    </div>
                  </div>
                </div>
              </div>

              {/* Station & Customer Details Banner */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      {language === 'bn' ? 'গ্রাহক প্রতিষ্ঠান (Company):' : 'Client Organization:'}
                    </span>
                    <h4 className="font-bold text-black text-sm">
                      {currentTenant.name}
                    </h4>
                    <p className="text-slate-700 text-xs">{currentTenant.address}</p>
                    <p className="font-mono text-slate-600 text-xs">{currentTenant.phone}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      {language === 'bn' ? 'ফুয়েল পাম্প স্টেশন (Fuel Station):' : 'Fuel Pump Station:'}
                    </span>
                    <h4 className="font-bold text-black text-sm">
                      {currentStatementData.pump.name}
                    </h4>
                    <p className="text-slate-700 text-xs">{currentStatementData.pump.location}</p>
                    <p className="font-mono text-slate-600 text-xs">
                      Contact: {currentStatementData.pump.contact_person} ({currentStatementData.pump.phone})
                    </p>
                  </div>
                </div>
              </div>

                {/* Financial Reconciliation Highlight */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#091226] border border-slate-200 dark:border-blue-950">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      {t.openingDueLabel}
                    </span>
                    <div className="text-base font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                      ৳{currentStatementData.openingBalance.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#091226] border border-slate-200 dark:border-blue-950">
                    <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                      (+) {language === 'bn' ? 'মোট ফুয়েল গ্রহণ' : 'Fuel Purchased'}
                    </span>
                    <div className="text-base font-black font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                      ৳{currentStatementData.totalCharges.toLocaleString()}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {currentStatementData.totalLiters} Liters
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#091226] border border-slate-200 dark:border-blue-950">
                    <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                      (-) {language === 'bn' ? 'মোট পরিশোধিত' : 'Total Paid'}
                    </span>
                    <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                      ৳{currentStatementData.totalPaid.toLocaleString()}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {currentStatementData.filteredPayments.length} settlements
                    </span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border ${
                      currentStatementData.dueAmount > 0
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60'
                        : currentStatementData.advanceAmount > 0
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider block">
                      {currentStatementData.dueAmount > 0
                        ? t.netPayable
                        : currentStatementData.advanceAmount > 0
                        ? t.netAdvance
                        : (language === 'bn' ? 'বর্তমান ব্যালেন্স:' : 'Balance:')}
                    </span>
                    <div
                      className={`text-lg font-black font-mono mt-0.5 ${
                        currentStatementData.dueAmount > 0
                          ? 'text-red-600 dark:text-red-400'
                          : currentStatementData.advanceAmount > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      ৳{(currentStatementData.dueAmount > 0
                        ? currentStatementData.dueAmount
                        : currentStatementData.advanceAmount
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>

              {/* Table 1: Itemized Fuel Intake */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-amber-300">
                    {t.fuelHistoryTitle} ({currentStatementData.filteredEntries.length} {language === 'bn' ? 'টি স্লিপ' : 'slips'})
                  </h4>
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                    Total: ৳{currentStatementData.totalCharges.toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-blue-900/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#132247] text-slate-700 dark:text-amber-300 font-bold uppercase text-[9px] tracking-wider">
                      <tr>
                        <th className="py-2 px-3">{t.date}</th>
                        <th className="py-2 px-3">{language === 'bn' ? 'স্লিপ নং' : 'Slip No'}</th>
                        <th className="py-2 px-3">{t.vehicleNo}</th>
                        <th className="py-2 px-3 text-right">{t.liters}</th>
                        <th className="py-2 px-3 text-right">{t.rate}</th>
                        <th className="py-2 px-3 text-right">{t.total}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-blue-900/40">
                      {currentStatementData.filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400 font-medium">
                            {language === 'bn' ? 'এই সময়সীমার মধ্যে কোনো ফুয়েল গ্রহণের রেকর্ড নেই।' : 'No fuel intake records found in this date range.'}
                          </td>
                        </tr>
                      ) : (
                        currentStatementData.filteredEntries.map(entry => (
                          <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-[#142247]">
                            <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {entry.entry_date}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                              {entry.slip_no}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                              {entry.vehicle_id}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              {entry.fuel_liters} L
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              ৳{entry.unit_price}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                              ৳{entry.total_amount.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 2: Payment Settlement History */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-emerald-300">
                    {t.paymentHistoryTitle} ({currentStatementData.filteredPayments.length} {language === 'bn' ? 'টি পরিশোধ' : 'payments'})
                  </h4>
                  <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Total: ৳{currentStatementData.totalPaid.toLocaleString()}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-blue-900/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#132247] text-slate-700 dark:text-emerald-300 font-bold uppercase text-[9px] tracking-wider">
                      <tr>
                        <th className="py-2 px-3">{t.date}</th>
                        <th className="py-2 px-3">{t.refNo}</th>
                        <th className="py-2 px-3">{t.method}</th>
                        <th className="py-2 px-3 text-right">{t.total}</th>
                        <th className="py-2 px-3">{language === 'bn' ? 'বিবরণ / নোট' : 'Remarks'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-blue-900/40">
                      {currentStatementData.filteredPayments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400 font-medium">
                            {language === 'bn' ? 'কোনো পেমেন্ট পরিশোধের রেকর্ড নেই।' : 'No payment settlement records found.'}
                          </td>
                        </tr>
                      ) : (
                        currentStatementData.filteredPayments.map(pay => (
                          <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-[#142247]">
                            <td className="py-2 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {pay.payment_date}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                              {pay.transaction_ref}
                            </td>
                            <td className="py-2 px-3 font-semibold uppercase text-[10px] text-blue-700 dark:text-blue-300 whitespace-nowrap">
                              {pay.payment_method}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                              ৳{pay.amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                              {pay.notes || '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Official Signatures Box with Prepared By Details */}
              <div className="pt-8 pb-2 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs border-t-2 border-slate-900 mt-6">
                <div className="p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-left">
                  <div className="text-[10px] uppercase font-bold text-slate-600 pb-1 border-b border-dashed border-slate-400 mb-1.5">
                    {t.preparedBy} (প্রস্তুতকারী)
                  </div>
                  <div className="font-bold text-black text-xs">{downloadingUser.name}</div>
                  <div className="text-[11px] text-slate-800">{downloadingUser.roleTitle}</div>
                  <div className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                    <div><span className="font-semibold">User:</span> {downloadingUser.username}</div>
                    {downloadingUser.email && <div><span className="font-semibold">Email:</span> {downloadingUser.email}</div>}
                    <div><span className="font-semibold">Generated:</span> {new Date().toLocaleString()}</div>
                  </div>
                </div>

                <div className="p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-center flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-600 pb-1 border-b border-dashed border-slate-400 mb-1.5">
                    {t.verifiedBy} (যাচাইকারী)
                  </div>
                  <div className="h-8"></div>
                  <div className="text-[10px] text-slate-500 border-t border-slate-300 pt-1">Accounts & Audit Officer</div>
                </div>

                <div className="p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-center flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-600 pb-1 border-b border-dashed border-slate-400 mb-1.5">
                    {t.pumpAuthority} (পাম্প প্রতিনিধি)
                  </div>
                  <div className="h-8"></div>
                  <div className="text-[10px] text-slate-500 border-t border-slate-300 pt-1">Station Manager Seal & Signature</div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Bar (hidden during print) */}
            <div className="pt-3 border-t border-slate-200 dark:border-blue-900/60 flex items-center justify-between gap-2 print:hidden">
              <button
                onClick={() => setStatementPumpId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-blue-900 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-blue-900/40"
              >
                {t.cancelBtn}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const pid = currentStatementData.pump.id;
                    setStatementPumpId(null);
                    handleOpenPayment(pid);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{language === 'bn' ? 'পাম্পে পেমেন্ট দিন' : 'Pay Pump Now'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: Record Pump Payment
          ------------------------------------------------------------- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0a1228] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-blue-900">
            <h3 className="font-black text-slate-900 dark:text-white text-base mb-1">
              {t.paymentModalTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mb-4">
              {t.paymentModalSubtitle}
            </p>

            {formError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {t.selectPumpLabel}
                </label>
                <select
                  value={payPumpId}
                  onChange={e => setPayPumpId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] font-semibold text-slate-800 dark:text-white"
                >
                  {pumpStatsList.map(item => (
                    <option key={item.pump.id} value={item.pump.id}>
                      {item.pump.name} (
                      {item.dueAmount > 0
                        ? `বকেয়া: ৳${item.dueAmount.toLocaleString()}`
                        : item.advanceAmount > 0
                        ? `অগ্রিম: ৳${item.advanceAmount.toLocaleString()}`
                        : 'পরিশোধিত'}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {t.payDateLabel}
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] font-mono text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {t.payAmountLabel}
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    placeholder="50000"
                    min="1"
                    step="any"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {t.payMethodLabel}
                  </label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] text-slate-900 dark:text-white"
                  >
                    <option value="bank_transfer">{t.methodBank}</option>
                    <option value="cheque">{t.methodCheque}</option>
                    <option value="cash">{t.methodCash}</option>
                    <option value="mfs">{t.methodMfs}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {t.refLabel}
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    placeholder="CHQ-981249"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {t.notesLabel}
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  placeholder="e.g. রূপালী ব্যাংক চেকের মাধ্যমে সেপ্টেম্বর মাসের বিল পরিশোধ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#0f1a36] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-blue-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-blue-900/40"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md"
                >
                  {t.submitPaymentBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          DELETE PAYMENT CONFIRMATION MODAL
          ------------------------------------------------------------- */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0a1228] rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-blue-900 text-xs">
            <h3 className="font-black text-slate-900 dark:text-white text-sm mb-2">
              {t.deleteConfirmTitle}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              {t.deleteConfirmDesc}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPaymentToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-blue-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-blue-900/40"
              >
                {t.cancelBtn}
              </button>
              <button
                onClick={() => handleDeletePayment(paymentToDelete)}
                className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md"
              >
                {t.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
