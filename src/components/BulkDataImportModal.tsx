import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Truck,
  Building2,
  Users2,
  Fuel,
  Tags,
  Layers,
  Container,
  FileText,
  Loader2,
  Info,
  ShieldCheck,
  Check,
  RotateCcw,
  ChevronDown
} from 'lucide-react';

export type BulkEntityType =
  | 'vehicles'
  | 'companies'
  | 'vendors'
  | 'pumps'
  | 'fuel_types'
  | 'categories'
  | 'tankers';

interface EntityDefinition {
  id: BulkEntityType;
  titleEn: string;
  titleBn: string;
  icon: React.ComponentType<{ className?: string }>;
  sampleFileName: string;
  fieldsDescription: string;
  sampleData: Record<string, any>[];
}

const ENTITY_DEFINITIONS: Record<BulkEntityType, EntityDefinition> = {
  vehicles: {
    id: 'vehicles',
    titleEn: 'Vehicles',
    titleBn: 'যানবাহন তালিকা',
    icon: Truck,
    sampleFileName: 'Vehicle_List_Template',
    fieldsDescription: 'plate_number, model, category, company, vendor, driver_name, driver_phone, fuel_type, fuel_tank_capacity, initial_odometer, status',
    sampleData: [
      {
        plate_number: 'Dhaka Metro-Ta-11-2045',
        model: 'Hino 500 Heavy Truck',
        category: 'Heavy Truck',
        company: 'Main Office Logistics',
        vendor: 'Navana Motors',
        driver_name: 'Rafiqul Islam',
        driver_phone: '+8801711223344',
        fuel_type: 'Diesel',
        fuel_tank_capacity: 350,
        initial_odometer: 45200,
        status: 'active'
      },
      {
        plate_number: 'Dhaka Metro-Ga-33-8890',
        model: 'Toyota Hilux 4x4 Double Cabin',
        category: 'Pickup / 4x4',
        company: 'Civil Construction Wing',
        vendor: 'Uttara Motors',
        driver_name: 'Abul Kalam',
        driver_phone: '+8801822334455',
        fuel_type: 'Diesel',
        fuel_tank_capacity: 80,
        initial_odometer: 28900,
        status: 'active'
      },
      {
        plate_number: 'Chatto Metro-Kha-12-3456',
        model: 'Nissan Urvan Microbus',
        category: 'Passenger Van',
        company: 'Headquarters Admin',
        vendor: 'Pacific Motors',
        driver_name: 'Kamrul Hasan',
        driver_phone: '+8801933445566',
        fuel_type: 'Octane',
        fuel_tank_capacity: 65,
        initial_odometer: 61450,
        status: 'active'
      }
    ]
  },
  companies: {
    id: 'companies',
    titleEn: 'Companies / Concerns',
    titleBn: 'সিস্টার কনসার্ন / কোম্পানি',
    icon: Building2,
    sampleFileName: 'Company_Concern_Template',
    fieldsDescription: 'name, code, contact_person, phone, email, address, status',
    sampleData: [
      {
        name: 'Bashundhara Logistics & Transport Ltd',
        code: 'BLTL',
        contact_person: 'Md. Tariqul Islam',
        phone: '+8801715001122',
        email: 'tariqul@bashundhara.com',
        address: 'Baridhara Diplomatic Zone, Dhaka',
        status: 'active'
      },
      {
        name: 'Meghna Shipping & Haulage Division',
        code: 'MSHD',
        contact_person: 'Kazi Mahbub Alam',
        phone: '+8801819334455',
        email: 'logistics@meghnagroup.biz',
        address: 'Meghna Ghat, Sonargaon, Narayanganj',
        status: 'active'
      }
    ]
  },
  vendors: {
    id: 'vendors',
    titleEn: 'Vendors / Suppliers',
    titleBn: 'ভেন্ডর ও সরবরাহকারী',
    icon: Users2,
    sampleFileName: 'Vendor_Supplier_Template',
    fieldsDescription: 'name, contact_person, phone, type, address, status',
    sampleData: [
      {
        name: 'Meghna Petroleum Authorized Depot',
        contact_person: 'Haji Shamsuddin',
        phone: '+8801712889900',
        type: 'fuel',
        address: 'Fatullah Fuel Depot, Narayanganj',
        status: 'active'
      },
      {
        name: 'Navana Automotive Spare Parts & Workshop',
        contact_person: 'Engr. Masud Rana',
        phone: '+8801911445566',
        type: 'maintenance',
        address: 'Tejgaon Industrial Area, Dhaka',
        status: 'active'
      }
    ]
  },
  pumps: {
    id: 'pumps',
    titleEn: 'Fuel Pumps',
    titleBn: 'ফুয়েল পাম্প স্টেশন',
    icon: Fuel,
    sampleFileName: 'Fuel_Pump_Template',
    fieldsDescription: 'name, location, contact_number, fuel_types, payment_terms, current_balance',
    sampleData: [
      {
        name: 'Padma Filling Station & Express Refuel',
        location: 'Kanchpur Bridge Roundabout, Dhaka-Sylhet Highway',
        contact_number: '+8801711998877',
        fuel_types: 'Diesel, Octane, Petrol',
        payment_terms: 'Monthly Credit',
        current_balance: 0
      },
      {
        name: 'Jamuna Oil Service Station',
        location: 'Mirpur-10 Circle, Dhaka-1216',
        contact_number: '+8801819223344',
        fuel_types: 'Diesel, Octane',
        payment_terms: 'Cash / Card',
        current_balance: 0
      }
    ]
  },
  fuel_types: {
    id: 'fuel_types',
    titleEn: 'Fuel Types & Pricing',
    titleBn: 'জ্বালানি ধরন ও লিটার মূল্য',
    icon: Tags,
    sampleFileName: 'Fuel_Types_Pricing_Template',
    fieldsDescription: 'name, code, unit, current_price, status',
    sampleData: [
      {
        name: 'Diesel (ডিজেল)',
        code: 'DSL',
        unit: 'Liter',
        current_price: 105.00,
        status: 'active'
      },
      {
        name: 'Octane (অকটেন)',
        code: 'OCT',
        unit: 'Liter',
        current_price: 125.00,
        status: 'active'
      },
      {
        name: 'Petrol (পেট্রোল)',
        code: 'PET',
        unit: 'Liter',
        current_price: 121.00,
        status: 'active'
      }
    ]
  },
  categories: {
    id: 'categories',
    titleEn: 'Vehicle Categories',
    titleBn: 'যানবাহনের ক্যাটাগরি',
    icon: Layers,
    sampleFileName: 'Vehicle_Categories_Template',
    fieldsDescription: 'name, name_bn, description',
    sampleData: [
      {
        name: 'Heavy Truck (10 Wheeler)',
        name_bn: 'ভারী ট্রাক (১০ চাকা)',
        description: 'Long haul logistics and bulk cargo transportation'
      },
      {
        name: 'Medium Hauler (6 Wheeler)',
        name_bn: 'মাঝারি ট্রাক (৬ চাকা)',
        description: 'Regional distribution and intra-district transit'
      },
      {
        name: 'Pickup & Double Cabin',
        name_bn: 'পিকআপ ও ডাবল কেবিন',
        description: 'Site operations, inspections, and express logistics'
      }
    ]
  },
  tankers: {
    id: 'tankers',
    titleEn: 'Fuel Tankers / Bowzers',
    titleBn: 'ফুয়েল বাউজার / ট্যাংকার',
    icon: Container,
    sampleFileName: 'Fuel_Tankers_Bowzers_Template',
    fieldsDescription: 'tanker_number, capacity_liters, current_fuel_liters, fuel_type, assigned_driver, driver_phone',
    sampleData: [
      {
        tanker_number: 'TNK-9001 (Site Mobile Bowzer)',
        capacity_liters: 9000,
        current_fuel_liters: 6500,
        fuel_type: 'Diesel',
        assigned_driver: 'Zahidul Haque',
        driver_phone: '+8801712334455'
      },
      {
        tanker_number: 'TNK-4500 (Express Mini Bowzer)',
        capacity_liters: 4500,
        current_fuel_liters: 3800,
        fuel_type: 'Diesel',
        assigned_driver: 'Nurul Islam',
        driver_phone: '+8801823445566'
      }
    ]
  }
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultEntity?: BulkEntityType;
}

export const BulkDataImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultEntity = 'vehicles'
}) => {
  const { currentTenant, bulkImportData } = useApp();
  const [selectedEntity, setSelectedEntity] = useState<BulkEntityType>(defaultEntity);
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importReport, setImportReport] = useState<{
    entityTitle: string;
    total: number;
    newCount: number;
    updatedCount: number;
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentDef = ENTITY_DEFINITIONS[selectedEntity];

  // Download Sample Excel (.xlsx)
  const handleDownloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(currentDef.sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, currentDef.titleEn.slice(0, 31));
    XLSX.writeFile(wb, `${currentDef.sampleFileName}_${currentTenant.code || 'Sample'}.xlsx`);
  };

  // Download Sample CSV (.csv)
  const handleDownloadSampleCsv = () => {
    const ws = XLSX.utils.json_to_sheet(currentDef.sampleData);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentDef.sampleFileName}_${currentTenant.code || 'Sample'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle File Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setFeedback({
            type: 'error',
            message: 'No data rows detected in uploaded file. Please verify worksheet content.'
          });
          setParsedRows([]);
          setDetectedColumns([]);
        } else {
          // Normalize column headers to lowercase trimmed and apply smart aliases
          const normalizedRows = rawJson.map(row => {
            const cleanRow: Record<string, any> = {};
            Object.entries(row).forEach(([key, val]) => {
              const cleanKey = key.trim().toLowerCase().replace(/[\s\-_.]+/g, '_');
              cleanRow[cleanKey] = typeof val === 'string' ? val.trim() : val;
            });

            // Standardize vehicle identification
            const rawVehNum = cleanRow.vehicle_number || cleanRow.plate_number || cleanRow.vehicle_no || cleanRow.plate_no || cleanRow.registration_number || cleanRow.reg_no || cleanRow.car_number;
            if (rawVehNum) {
              cleanRow.vehicle_number = rawVehNum;
              cleanRow.plate_number = rawVehNum;
            }

            // Standardize tanker identification
            const rawTankNum = cleanRow.tanker_name || cleanRow.tanker_number || cleanRow.tanker_no || cleanRow.bowzer_number;
            if (rawTankNum) {
              cleanRow.tanker_name = rawTankNum;
              cleanRow.tanker_number = rawTankNum;
            }

            // Standardize phone / contact
            const rawPhone = cleanRow.phone || cleanRow.contact_number || cleanRow.mobile || cleanRow.cell || cleanRow.driver_phone;
            if (rawPhone) {
              cleanRow.phone = cleanRow.phone || rawPhone;
              cleanRow.contact_number = cleanRow.contact_number || rawPhone;
            }

            return cleanRow;
          });

          setParsedRows(normalizedRows);
          setDetectedColumns(Object.keys(rawJson[0]));
          setFeedback({
            type: 'success',
            message: `Loaded ${normalizedRows.length} records from "${file.name}". Review preview below and click Confirm Import.`
          });
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Failed to parse file: ${err.message || 'Invalid format'}`
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    setIsUploading(true);
    setFeedback(null);

    try {
      const res = await bulkImportData(selectedEntity, parsedRows);
      if (res.success) {
        const newlyAdded = res.new_count !== undefined ? res.new_count : res.count;
        const updatedExisting = res.updated_count !== undefined ? res.updated_count : 0;

        setImportReport({
          entityTitle: `${currentDef.titleEn} (${currentDef.titleBn})`,
          total: res.count,
          newCount: newlyAdded,
          updatedCount: updatedExisting,
          message: res.message
        });

        setFeedback({
          type: 'success',
          message: `Bulk import completed! ${res.count} records registered (${newlyAdded} new, ${updatedExisting} updated). Double-entry protection prevented any duplicate items.`
        });
        setParsedRows([]);
        setDetectedColumns([]);
        setFileName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Import failed.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Unexpected error occurred.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEntitySwitch = (type: BulkEntityType) => {
    setSelectedEntity(type);
    setParsedRows([]);
    setDetectedColumns([]);
    setFileName('');
    setFeedback(null);
    setImportReport(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Bulk Data Import & Registration Engine</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Excel / CSV
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                এক্সেলে বা সিএসভিতে একসঙ্গে যানবাহনের তথ্য, ভেন্ডর, পাম্প, ট্যাংকার ইত্যাদি সরাসরি আপলোড ও যুক্ত করুন।
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entity Selector Dropdown Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1">
            <label htmlFor="bulk-entity-select" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>ইমপোর্টের ধরন নির্বাচন করুন (Select Import Category):</span>
            </label>

            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-600 dark:text-amber-400">
                <currentDef.icon className="w-4 h-4 shrink-0" />
              </div>
              <select
                id="bulk-entity-select"
                value={selectedEntity}
                onChange={(e) => handleEntitySwitch(e.target.value as BulkEntityType)}
                className="w-full pl-10 pr-10 py-2.5 text-xs font-bold rounded-xl border-2 border-amber-500/40 hover:border-amber-500 focus:border-amber-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs appearance-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer transition-all"
              >
                {Object.values(ENTITY_DEFINITIONS).map((def) => (
                  <option key={def.id} value={def.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1.5 font-semibold">
                    {def.titleEn} — {def.titleBn}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Current Selection Pill Badge */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Selected:</span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-2 text-xs">
              <currentDef.icon className="w-3.5 h-3.5 shrink-0" />
              <span>{currentDef.titleEn}</span>
              <span className="text-[11px] opacity-75">({currentDef.titleBn})</span>
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* Guidelines & Sample Downloads Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Info className="w-4 h-4 shrink-0" />
                <span>Format Guidelines for {currentDef.titleEn} ({currentDef.titleBn})</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Download the verified template below to see the required column headers and sample data format before uploading.
              </p>
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-700 dark:text-slate-300">Expected Columns: </span>
                {currentDef.fieldsDescription}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadSampleExcel}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Sample Excel (.xlsx)</span>
              </button>
              <button
                onClick={handleDownloadSampleCsv}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Sample CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all hover:bg-amber-500/5 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {fileName ? (
                <span className="text-amber-600 dark:text-amber-400 font-mono">{fileName}</span>
              ) : (
                `Click to choose or drag & drop your completed ${currentDef.titleEn} file`
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
            </p>
            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] font-semibold text-blue-600 dark:text-blue-400 w-fit mx-auto mt-3.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Double-Entry Protection Active: Duplicate items will automatically merge/update without creating double entries.</span>
            </div>
          </div>

          {/* Import Complete Notification & Double-Entry Protection Breakdown */}
          {importReport && (
            <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl shadow-emerald-500/10 animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                      Import Complete & Verified
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-wider border border-blue-500/30">
                      Double-Entry Protected
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {importReport.entityTitle} - বাল্ক ইমপোর্ট সফলভাবে সম্পন্ন হয়েছে!
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    সবগুলো রেকর্ড সফলভাবে প্রসেস করা হয়েছে। ডাবল এন্ট্রি রোধ ব্যবস্থা কার্যকর থাকায় কোনো ডুপ্লিকেট এন্ট্রি তৈরি হয়নি।
                  </p>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Processed (সর্বমোট)</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{importReport.total}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Records in sheet</p>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    New Entries (নতুন যুক্ত)
                  </p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{importReport.newCount}</p>
                  <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Fresh records added</p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Updated / Merged (আপডেট করা)
                  </p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{importReport.updatedCount}</p>
                  <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">Matched existing (No duplicates)</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setImportReport(null);
                    setFeedback(null);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Upload Another File</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportReport(null);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Done & View List (তালিকা দেখুন)</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback banner */}
          {feedback && !importReport && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Live Data Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Parsed Records Preview ({parsedRows.length} Items Detected)</span>
                </h3>
                <button
                  onClick={() => {
                    setParsedRows([]);
                    setDetectedColumns([]);
                    setFileName('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-red-500 hover:text-red-600 font-bold"
                >
                  Clear Selection
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950">
                <div className="max-h-64 overflow-auto scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-3 border-b border-slate-200 dark:border-slate-700 w-12 text-center">#</th>
                        {detectedColumns.map((col, idx) => (
                          <th key={idx} className="p-3 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                      {parsedRows.slice(0, 50).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-2.5 text-center text-slate-400 font-mono text-[11px]">{rIdx + 1}</td>
                          {detectedColumns.map((col, cIdx) => {
                            const val = row[col.trim().toLowerCase().replace(/\s+/g, '_')] ?? row[col] ?? '';
                            return (
                              <td key={cIdx} className="p-2.5 whitespace-nowrap max-w-xs truncate">
                                {String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 50 && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
                    Showing first 50 of {parsedRows.length} total records
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Target Subscriber: <strong className="text-slate-800 dark:text-white">{currentTenant.name}</strong> ({currentTenant.code})
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200/50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={parsedRows.length === 0 || isUploading || isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing {parsedRows.length} Items...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Import & Register All ({parsedRows.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
