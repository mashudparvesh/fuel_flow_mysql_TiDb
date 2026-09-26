import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  CheckCircle2,
  Truck,
  Fuel,
  CreditCard,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Zap,
  ChevronRight,
  ExternalLink,
  Crown
} from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<string>('getting_started');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'getting_started',
      icon: Zap,
      title: '1. Getting Started & Setup',
      badge: 'Basics'
    },
    {
      id: 'vehicles_equipment',
      icon: Truck,
      title: '2. Vehicles & Heavy Machinery',
      badge: 'Fleet'
    },
    {
      id: 'fuel_entry',
      icon: Fuel,
      title: '3. Fuel Slip & Meter Logging',
      badge: 'Operations'
    },
    {
      id: 'pumps_ledger',
      icon: CreditCard,
      title: '4. Highway Pump Credit Ledger',
      badge: 'Finance'
    },
    {
      id: 'bowzer_tanker',
      icon: ShieldCheck,
      title: '5. Mobile Bowzers & Dip Stick Audit',
      badge: 'Depot'
    },
    {
      id: 'anomaly_alerts',
      icon: AlertTriangle,
      title: '6. Theft & Anomaly AI Detection',
      badge: 'Intelligence'
    },
    {
      id: 'bulk_import',
      icon: FileSpreadsheet,
      title: '7. Excel & CSV Bulk Data Ingestion',
      badge: 'Data'
    },
    {
      id: 'pdf_reports',
      icon: Printer,
      title: '8. PDF Reports & Official A4 Print',
      badge: 'Audit'
    },
    {
      id: 'subscriptions',
      icon: Crown,
      title: '9. Subscriptions & Renewal Plans',
      badge: 'Commercial'
    }
  ];

  const filteredSections = searchQuery.trim()
    ? sections.filter(sec => sec.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-5xl h-[90vh] bg-white dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                FuelNest Master Operations Manual
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official step-by-step documentation for heavy fleet fuel management & intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Documentation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout: Sidebar + Main Viewer */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-72 sm:w-80 border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/30 shrink-0 flex flex-col gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              {filteredSections.map(sec => {
                const Icon = sec.icon;
                const isSelected = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveTab(sec.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-500'}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                        isSelected
                          ? 'bg-slate-950 text-amber-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {sec.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200 leading-relaxed text-sm">
            {activeTab === 'getting_started' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    1. Getting Started & Initial Workspace Setup
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    First login sequence, credentials security, and workspace branding
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                  <strong>Pro Tip:</strong> After subscribing, your workspace Super Admin username and initial temporary password are sent to your registered company email.
                </div>

                <ol className="space-y-3 list-decimal list-inside text-xs sm:text-sm">
                  <li className="pl-1">
                    <strong>Navigate to Sign In:</strong> Click the <span className="font-bold text-amber-600 dark:text-amber-400">Sign In</span> button on the top navigation bar.
                  </li>
                  <li className="pl-1">
                    <strong>Select Your Organization:</strong> Choose your tenant company name from the workspace selector dropdown.
                  </li>
                  <li className="pl-1">
                    <strong>Input Credentials:</strong> Enter your issued username and temporary password.
                  </li>
                  <li className="pl-1">
                    <strong>Mandatory Password Reset:</strong> Upon initial sign-in, you will be prompted to replace the temporary password with your private credentials.
                  </li>
                  <li className="pl-1">
                    <strong>Upload Company Logo:</strong> Click your organization name in the top header to upload your official company logo. This will automatically stamp all generated A4 reports and fuel vouchers with your corporate letterhead.
                  </li>
                </ol>
              </div>
            )}

            {activeTab === 'vehicles_equipment' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    2. Vehicles & Heavy Equipment Management
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Dual metric tracking: KMPL (Kilometers/Liter) & LPH (Liters/Hour)
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  FuelNest provides specialized dual-metric calculation suited for mixed logistical fleets:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-amber-500 mb-1">Kilometers Per Liter (KMPL)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Standard for highway transport: Dump trucks, prime movers, pickups, and trailers. Consumption is measured against odometer distance deltas.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-emerald-500 mb-1">Liters Per Hour (LPH)</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tailored for stationary & heavy earthmoving machinery: Excavators, cranes, generators, and piling rigs. Consumption is measured against hour-meter increments.
                    </p>
                  </div>
                </div>

                <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm pt-2">
                  <li>Open the <span className="font-bold text-amber-500">Vehicles</span> view from the primary sidebar.</li>
                  <li>Click <span className="font-bold text-amber-500">+ Add Vehicle</span>.</li>
                  <li>Provide registration plate, designated operator/driver, fuel type, category, and standard fuel benchmark.</li>
                  <li>Save to immediately begin receiving calibrated consumption telemetry.</li>
                </ol>
              </div>
            )}

            {activeTab === 'fuel_entry' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    3. Fuel Entry & Slip Logging
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    The core data pipeline for automated audit and reconciliations
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  Record fuel issues immediately upon refueling at pumps or mobile bowzers:
                </p>

                <ul className="space-y-2 text-xs sm:text-sm list-disc list-inside">
                  <li><strong>Date & Timestamp:</strong> Specify exact refueling schedule.</li>
                  <li><strong>Vehicle Selection:</strong> Choose registration plate or scan asset QR code.</li>
                  <li><strong>Fuel Source:</strong> Distinguish between <span className="text-amber-500 font-bold">External Highway Pump</span> or <span className="text-emerald-500 font-bold">Mobile Bowzer / Depot Tank</span>.</li>
                  <li><strong>Memo & Slip Code:</strong> Input printed receipt or voucher number.</li>
                  <li><strong>Odometer / Hour Meter:</strong> Enter current meter reading. The system calculates delta distance/hours and evaluates efficiency against expected baseline.</li>
                  <li><strong>Volume & Unit Price:</strong> Input total liters pumped and tariff per liter.</li>
                </ul>
              </div>
            )}

            {activeTab === 'pumps_ledger' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    4. Highway Pump Credit & Financial Ledger
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Vendor credit line tracking, payments, and automated reconciliations
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  Fleets frequently operate on credit contracts with roadside filling stations. FuelNest maintains an exact accounting ledger for each vendor:
                </p>

                <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm">
                  <li>Navigate to <span className="font-bold text-amber-500">Pumps</span> in the navigation sidebar.</li>
                  <li>Monitor total fuel delivered, gross billings, cumulative payments cleared, and outstanding liabilities.</li>
                  <li>When settling invoices via bank transfer, cheque, or cash, click <span className="font-bold text-emerald-500">Record Payment</span> to log transactions.</li>
                  <li>Click <span className="font-bold text-blue-500">Print Statement</span> to produce an A4 reconciliation statement with your company header.</li>
                </ol>
              </div>
            )}

            {activeTab === 'bowzer_tanker' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    5. Mobile Bowzers & Dip Stick Audit
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Site mobile distribution, dipstick calibration, and physical stock reconciliation
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  On remote construction projects or quarry operations, mobile bowzers refuel excavators on-site. FuelNest prevents fuel pilferage with dip stick verification:
                </p>

                <ul className="space-y-2 text-xs sm:text-sm list-disc list-inside">
                  <li><strong>Depot Inward Loads:</strong> Record bulk liters loaded into bowzer compartments.</li>
                  <li><strong>Direct Dispensation:</strong> Log each machinery refueling transaction executed in the field.</li>
                  <li><strong>Dip Stick Calibration:</strong> At the close of each shift, record the physical dip stick measurement in centimeters. The system compares physical remaining volume against mathematical ledger balance to instantly expose variances.</li>
                </ul>
              </div>
            )}

            {activeTab === 'anomaly_alerts' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    6. Theft & Anomaly AI Detection Engine
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Automated anomaly detection algorithm for theft and mechanical leaks
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  When actual fuel consumption exceeds standard equipment baseline by more than 20%, or when abnormal meter increments occur, FuelNest flags the transaction with a <strong className="text-red-500">Red Anomaly Alert</strong>:
                </p>

                <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm">
                  <li>Access the alert badge on the top header or open <span className="font-bold text-red-500">Anomalies</span> in the sidebar.</li>
                  <li>Examine slip metadata, operator name, recorded mileage, and variance percentage.</li>
                  <li>Audit the transaction and update status to Reviewed, Cleared, or Confirmed Suspect.</li>
                </ol>
              </div>
            )}

            {activeTab === 'bulk_import' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    7. Excel & CSV Bulk Data Ingestion
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Fast data onboarding for legacy enterprise datasets
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  Instead of manual single-entry logging, ingest entire spreadsheets directly:
                </p>

                <ol className="space-y-2 list-decimal list-inside text-xs sm:text-sm">
                  <li>Click <span className="font-bold text-amber-500">Bulk Import</span> from the sidebar or header quick actions.</li>
                  <li>Choose your data category: Vehicles, Fuel Slips, Pumps, or Companies.</li>
                  <li>Click <span className="font-bold text-indigo-500">Download Template (.xlsx)</span> to retrieve the verified format.</li>
                  <li>Paste your data into the template and upload. The validation parser validates every row before committing to the live database.</li>
                </ol>
              </div>
            )}

            {activeTab === 'pdf_reports' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    8. PDF Reports & Official A4 Letterhead
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Executive corporate reporting formatted in Times New Roman
                  </span>
                </div>

                <p className="text-xs sm:text-sm">
                  All generated reports adhere to international corporate printing standards in portrait A4:
                </p>

                <ul className="space-y-2 text-xs sm:text-sm list-disc list-inside">
                  <li><strong>Corporate Branding:</strong> Your uploaded logo renders cleanly alongside your official address and tax details.</li>
                  <li><strong>Report Formats:</strong> Vehicle Efficiency Audits, Highway Pump Vendor Statements, Bowzer Inventory Balances, and Anomaly Incident Summaries.</li>
                  <li><strong>Vector PDF Export:</strong> Click <span className="font-bold text-amber-500">Download PDF</span> or <span className="font-bold text-slate-700 dark:text-slate-300">Print</span> to export high-definition documents suitable for executive presentation.</li>
                </ul>
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    9. Subscriptions & Renewal Guidelines
                  </h3>
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                    Commercial tiers, renewal schedules, and gateway payments
                  </span>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <p>
                    FuelNest provides 5 official enterprise tiers tailored for fleets of all scales:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white">1. 3-Day Free Trial (0 BDT)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Full features unlocked for evaluation. Notice banner shows trial status.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-amber-500">2. 1 Month Plan (749 BDT)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        30 days validity. Complete operational access and live AI monitoring.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-amber-500">3. 3 Months Plan (2,199 BDT)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        90 days quarterly package. Cost-effective for commercial construction.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <h4 className="font-bold text-amber-500">4. 6 Months Plan (3,999 BDT)</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        180 days semi-annual package. 11% operational savings.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-amber-500/40 col-span-1 sm:col-span-2 bg-amber-500/5">
                      <h4 className="font-bold text-amber-600 dark:text-amber-400">5. 12 Months (1 Year) Plan (7,999 BDT)</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        365 days annual master access. Maximum savings and 24/7 dedicated support.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 mt-4">
                    <h4 className="font-bold text-slate-900 dark:text-white">Renewal Notice Period:</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      When your active subscription has 7 or fewer days remaining, an unobtrusive banner appears with a one-click payment renewal link. Upon payment confirmation, your workspace updates automatically with zero downtime.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900">
          <span>FuelNest Enterprise Fleet & Fuel Documentation</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
