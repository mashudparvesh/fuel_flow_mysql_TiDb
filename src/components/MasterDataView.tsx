import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TablePagination } from './TablePagination';
import { exportToCsv } from '../utils/csvExporter';
import {
  Database,
  Building,
  Users,
  Fuel,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Tag,
  Clock,
  DollarSign,
  AlertTriangle,
  MapPin,
  Phone,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { Company, FuelPump, FuelType } from '../types';

interface MasterDataViewProps {
  onOpenBulkImport?: (entity?: any) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({ onOpenBulkImport }) => {
  const {
    language,
    currentUser,
    companies,
    addCompany,
    updateCompany,
    deleteCompany,
    vendors,
    addVendor,
    deleteVendor,
    pumps,
    addPump,
    updatePump,
    deletePump,
    fuelTypes,
    updateFuelPrice,
    addFuelType,
    deleteFuelType,
    categories,
    addCategory,
    deleteCategory
  } = useApp();

  const isViewer = currentUser?.role === 'client_viewer';

  const [activeTab, setActiveTab] = useState<'companies' | 'vendors' | 'pumps' | 'fuel_types' | 'categories'>('companies');

  // Fuel Type Add & Delete states
  const [showAddFuelModal, setShowAddFuelModal] = useState(false);
  const [newFuelName, setNewFuelName] = useState('');
  const [newFuelCode, setNewFuelCode] = useState('');
  const [newFuelUnit, setNewFuelUnit] = useState('Liter');
  const [newFuelPrice, setNewFuelPrice] = useState('');
  const [deleteConfirmFuelType, setDeleteConfirmFuelType] = useState<FuelType | null>(null);
  const [fuelActionError, setFuelActionError] = useState<string | null>(null);
  const [isSubmittingFuel, setIsSubmittingFuel] = useState(false);

  // Pagination states (10 items max per list)
  const pageSize = 10;
  const [companyPage, setCompanyPage] = useState(1);
  const [vendorPage, setVendorPage] = useState(1);
  const [pumpPage, setPumpPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);

  // Paginated arrays
  const paginatedCompanies = useMemo(() => {
    const start = (companyPage - 1) * pageSize;
    return companies.slice(start, start + pageSize);
  }, [companies, companyPage]);

  const paginatedVendors = useMemo(() => {
    const start = (vendorPage - 1) * pageSize;
    return vendors.slice(start, start + pageSize);
  }, [vendors, vendorPage]);

  const paginatedPumps = useMemo(() => {
    const start = (pumpPage - 1) * pageSize;
    return pumps.slice(start, start + pageSize);
  }, [pumps, pumpPage]);

  const paginatedCategories = useMemo(() => {
    const start = (categoryPage - 1) * pageSize;
    return categories.slice(start, start + pageSize);
  }, [categories, categoryPage]);

  // CSV Export Handlers
  const handleExportCompaniesCurrentCsv = () => {
    const headers = ['Code', 'Company Name', 'Contact Person', 'Phone', 'Email', 'Address'];
    const rows = paginatedCompanies.map(c => [c.code, c.name, c.contact_person || '', c.phone || '', c.email || '', c.address || '']);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Customer_Companies_Page_${companyPage}_(${paginatedCompanies.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportCompaniesAllCsv = () => {
    const headers = ['Code', 'Company Name', 'Contact Person', 'Phone', 'Email', 'Address'];
    const rows = companies.map(c => [c.code, c.name, c.contact_person || '', c.phone || '', c.email || '', c.address || '']);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Customer_Companies_All_(${companies.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportVendorsCurrentCsv = () => {
    const headers = ['Vendor Name', 'Contact Person', 'Phone', 'Email', 'Address'];
    const rows = paginatedVendors.map(v => [v.name, v.contact_person || '', v.phone || '', v.email || '', v.address || '']);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Vendors_Page_${vendorPage}_(${paginatedVendors.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportVendorsAllCsv = () => {
    const headers = ['Vendor Name', 'Contact Person', 'Phone', 'Email', 'Address'];
    const rows = vendors.map(v => [v.name, v.contact_person || '', v.phone || '', v.email || '', v.address || '']);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Vendors_All_(${vendors.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportPumpsCurrentCsv = () => {
    const headers = ['Pump Name', 'Location', 'Contact Person', 'Phone', 'Credit Limit (BDT)', 'Current Balance (BDT)', 'Status'];
    const rows = paginatedPumps.map(p => [p.name, p.location, p.contact_person || '', p.phone || '', p.credit_limit, p.current_balance, p.status]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Fuel_Pumps_Page_${pumpPage}_(${paginatedPumps.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportPumpsAllCsv = () => {
    const headers = ['Pump Name', 'Location', 'Contact Person', 'Phone', 'Credit Limit (BDT)', 'Current Balance (BDT)', 'Status'];
    const rows = pumps.map(p => [p.name, p.location, p.contact_person || '', p.phone || '', p.credit_limit, p.current_balance, p.status]);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Fuel_Pumps_All_(${pumps.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportCategoriesCurrentCsv = () => {
    const headers = ['Category Name', 'Metric Type', 'Benchmark', 'Tolerance %', 'Description'];
    const rows = paginatedCategories.map(c => [c.name, c.metric_type, c.default_benchmark, c.tolerance_percentage, c.description || '']);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Vehicle_Categories_Page_${categoryPage}_(${paginatedCategories.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportCategoriesAllCsv = () => {
    const headers = ['Category Name', 'Metric Type', 'Benchmark', 'Tolerance %', 'Description'];
    const rows = categories.map(c => [c.name, c.metric_type, c.default_benchmark, c.tolerance_percentage, c.description || '']);
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Vehicle_Categories_All_(${categories.length}_records)_${dateStr}`, headers, rows);
  };

  // New Company Modal / Form State
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyCode, setNewCompanyCode] = useState('');
  const [newCompanyContact, setNewCompanyContact] = useState('');
  const [newCompanyPhone, setNewCompanyPhone] = useState('');
  const [newCompanyEmail, setNewCompanyEmail] = useState('');
  const [newCompanyAddress, setNewCompanyAddress] = useState('');

  // Edit Company Modal / Form State
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyCode, setEditCompanyCode] = useState('');
  const [editCompanyContact, setEditCompanyContact] = useState('');
  const [editCompanyPhone, setEditCompanyPhone] = useState('');
  const [editCompanyEmail, setEditCompanyEmail] = useState('');
  const [editCompanyAddress, setEditCompanyAddress] = useState('');

  // Delete Modals State
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [pumpToDelete, setPumpToDelete] = useState<FuelPump | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3500);
  };

  // New Vendor Form State
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorContact, setNewVendorContact] = useState('');
  const [newVendorPhone, setNewVendorPhone] = useState('');
  const [newVendorEmail, setNewVendorEmail] = useState('');
  const [newVendorAddress, setNewVendorAddress] = useState('');

  // New Pump Form State
  const [showPumpModal, setShowPumpModal] = useState(false);
  const [newPumpName, setNewPumpName] = useState('');
  const [newPumpLocation, setNewPumpLocation] = useState('');
  const [newPumpContact, setNewPumpContact] = useState('');
  const [newPumpPhone, setNewPumpPhone] = useState('');
  const [newPumpCreditLimit, setNewPumpCreditLimit] = useState('500000');
  const [newPumpOpeningBalance, setNewPumpOpeningBalance] = useState('0');

  // Price Updater State
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType | null>(null);
  const [newPriceValue, setNewPriceValue] = useState('');

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatMetric, setNewCatMetric] = useState<'kmpl' | 'lph'>('kmpl');
  const [newCatBenchmark, setNewCatBenchmark] = useState('8.0');
  const [newCatDesc, setNewCatDesc] = useState('');

  const t = {
    title: 'Master Data Management (CRUD Modules)',
    subtitle: 'Companies, Vendors, Fuel Pumps, Fuel Pricing and Categories Configuration',
    companiesTab: 'Customer Companies',
    vendorsTab: 'Vehicle Vendors',
    pumpsTab: 'Fuel Pumps',
    fuelTypesTab: 'Fuel Types & Pricing',
    categoriesTab: 'Vehicle Categories',
    addCompany: 'Add New Company',
    addVendor: 'Add New Vendor',
    addPump: 'Add Fuel Pump',
    addCategory: 'Add Category',
    updatePrice: 'Update Unit Price',
    name: 'Name',
    code: 'Code',
    contact: 'Contact Person',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    action: 'Action',
    companiesSub: 'Customer Companies (Rosatom, Nikimth, PBRLP etc.)',
    vendorsSub: 'Vehicle Vendors (Third-party vehicle suppliers)',
    pumpsSub: 'Fuel Pumps (Pump name, credit limit & outstanding due)',
    fuelTypesSub: '5 Fuel Types & Per-Liter Price Update Option',
    fuelTypesDesc: 'Price changes will apply to future entries and are recorded in price history.',
    updatedLabel: 'Updated',
    prevPriceChanges: 'Recent Price Changes:',
    categoriesSub: 'Vehicle & Equipment Categories (Bus, HiAce, Noah, Excavator, Crane)',
    metricLabel: 'Metric:',
    defaultBenchmarkLabel: 'Default Benchmark:',
    contactLabel: 'Contact:',
    phoneLabel: 'Phone:',
    creditLimitLabel: 'Credit Limit:',
    currentDueLabel: 'Current Due:',
    creditUsageLabel: 'Credit Usage',
    cancelBtn: 'Cancel',
    saveBtn: 'Save',
    deleteTooltip: 'Delete',
    editTooltip: 'Edit',
    editCompanyModalTitle: 'Edit Customer Company',
    editCompanyBtn: 'Update Company',
    deleteConfirmBtn: 'Yes, Delete',
    confirmDeleteCompanyTitle: 'Confirm Delete Company',
    confirmDeleteCompanyMsg: 'Are you sure you want to delete this customer company from the system?',
    confirmDeletePumpTitle: 'Confirm Delete Fuel Pump',
    confirmDeletePumpMsg: 'Are you sure you want to delete this fuel pump? Once deleted, it will no longer appear for new fuel entries.',
    pumpDueWarning: 'Warning: This pump has an outstanding balance of',
    noCompaniesMsg: 'No customer companies found. Click the button above to add one.',
    noPumpsMsg: 'No fuel pumps found. Click the button above to add one.',
    priceModalTitle: 'Update Fuel Price',
    currentPriceLabel: 'Current Price:',
    newUnitPriceLabel: 'New Per-Liter Price (BDT)',
    savePriceBtn: 'Save Price',
    addCompanyModalTitle: 'Add New Customer Company',
    companyNameLabel: 'Company Name *',
    shortCodeLabel: 'Short Code *',
    addVendorModalTitle: 'Add New Vendor',
    vendorNameLabel: 'Vendor Name *',
    addPumpModalTitle: 'Add New Fuel Pump',
    pumpNameLabel: 'Pump Name *',
    locationLabel: 'Location / Address *',
    creditLimitInputLabel: 'Credit Limit (BDT)',
    openingBalanceLabel: 'Opening Balance (BDT)',
    addCategoryModalTitle: 'Create New Category',
    categoryNameLabel: 'Category Name *',
    metricTypeLabel: 'Metric Type *',
    kmplOption: 'KMPL (KM/Liter)',
    lphOption: 'LPH (Liters/Hour - Heavy Equipment)',
    benchmarkInputLabel: 'Default Benchmark *',
    descriptionLabel: 'Description'
  };

  // Save Company
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    const addedName = newCompanyName.trim();
    addCompany({
      name: addedName,
      code: newCompanyCode.trim() || addedName.substring(0, 4).toUpperCase(),
      contact_person: newCompanyContact.trim(),
      phone: newCompanyPhone.trim(),
      email: newCompanyEmail.trim(),
      address: newCompanyAddress.trim()
    });
    setNewCompanyName('');
    setNewCompanyCode('');
    setNewCompanyContact('');
    setNewCompanyPhone('');
    setNewCompanyEmail('');
    setNewCompanyAddress('');
    setShowCompanyModal(false);
    showNotification(`Customer company "${addedName}" added successfully!`);
  };

  // Open Edit Company Modal
  const openEditCompanyModal = (c: Company) => {
    setEditCompanyId(c.id);
    setEditCompanyName(c.name);
    setEditCompanyCode(c.code);
    setEditCompanyContact(c.contact_person || '');
    setEditCompanyPhone(c.phone || '');
    setEditCompanyEmail(c.email || '');
    setEditCompanyAddress(c.address || '');
    setShowEditCompanyModal(true);
  };

  // Save Updated Company
  const handleUpdateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompanyName.trim() || !editCompanyId) return;
    const updatedName = editCompanyName.trim();
    updateCompany(editCompanyId, {
      name: updatedName,
      code: editCompanyCode.trim() || updatedName.substring(0, 4).toUpperCase(),
      contact_person: editCompanyContact.trim(),
      phone: editCompanyPhone.trim(),
      email: editCompanyEmail.trim(),
      address: editCompanyAddress.trim()
    });
    setShowEditCompanyModal(false);
    showNotification(`Company "${updatedName}" updated successfully!`);
  };

  // Confirm Delete Company
  const handleConfirmDeleteCompany = () => {
    if (!companyToDelete) return;
    const name = companyToDelete.name;
    deleteCompany(companyToDelete.id);
    setCompanyToDelete(null);
    showNotification(`Company "${name}" deleted successfully!`);
  };

  // Save Vendor
  const handleSaveVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim()) return;
    const vendorName = newVendorName.trim();
    addVendor({
      name: vendorName,
      contact_person: newVendorContact.trim(),
      phone: newVendorPhone.trim(),
      email: newVendorEmail.trim(),
      address: newVendorAddress.trim()
    });
    setNewVendorName('');
    setNewVendorContact('');
    setNewVendorPhone('');
    setNewVendorEmail('');
    setNewVendorAddress('');
    setShowVendorModal(false);
    showNotification(`Vendor "${vendorName}" added successfully!`);
  };

  // Save Pump
  const handleSavePump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPumpName.trim()) return;
    const pumpName = newPumpName.trim();
    addPump({
      name: pumpName,
      location: newPumpLocation.trim() || 'Bangladesh',
      contact_person: newPumpContact.trim(),
      phone: newPumpPhone.trim(),
      credit_limit: parseFloat(newPumpCreditLimit) || 0,
      opening_balance: parseFloat(newPumpOpeningBalance) || 0,
      status: 'active'
    });
    setNewPumpName('');
    setNewPumpLocation('');
    setNewPumpContact('');
    setNewPumpPhone('');
    setNewPumpCreditLimit('500000');
    setNewPumpOpeningBalance('0');
    setShowPumpModal(false);
    showNotification(`Fuel pump "${pumpName}" added successfully!`);
  };

  // Confirm Delete Pump
  const handleConfirmDeletePump = () => {
    if (!pumpToDelete) return;
    const name = pumpToDelete.name;
    deletePump(pumpToDelete.id);
    setPumpToDelete(null);
    showNotification(`Fuel pump "${name}" deleted successfully!`);
  };

  // Save Price Update
  const handleUpdatePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFuelType || !newPriceValue) return;
    updateFuelPrice(selectedFuelType.id, parseFloat(newPriceValue));
    setSelectedFuelType(null);
    setNewPriceValue('');
  };

  // Add New Fuel Type
  const handleAddFuelType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFuelName.trim() || !newFuelPrice) return;
    setIsSubmittingFuel(true);
    setFuelActionError(null);
    try {
      const res = await addFuelType({
        name: newFuelName.trim(),
        code: newFuelCode.trim().toLowerCase() || newFuelName.trim().toLowerCase().replace(/\s+/g, '_'),
        unit: newFuelUnit.trim() || 'Liter',
        current_price: parseFloat(newFuelPrice) || 0
      });
      setIsSubmittingFuel(false);
      if (res.success) {
        setShowAddFuelModal(false);
        setNewFuelName('');
        setNewFuelCode('');
        setNewFuelUnit('Liter');
        setNewFuelPrice('');
        showNotification(`Fuel type "${newFuelName.trim()}" added successfully!`);
      } else {
        setFuelActionError(res.message);
      }
    } catch (err: any) {
      setIsSubmittingFuel(false);
      setFuelActionError(err?.message || 'Error adding fuel type');
    }
  };

  // Delete Fuel Type
  const handleDeleteFuelType = async () => {
    if (!deleteConfirmFuelType) return;
    setIsSubmittingFuel(true);
    setFuelActionError(null);
    try {
      const name = deleteConfirmFuelType.name;
      const res = await deleteFuelType(deleteConfirmFuelType.id);
      setIsSubmittingFuel(false);
      if (res.success) {
        setDeleteConfirmFuelType(null);
        showNotification(`Fuel type "${name}" deleted successfully!`);
      } else {
        setFuelActionError(res.message);
      }
    } catch (err: any) {
      setIsSubmittingFuel(false);
      setFuelActionError(err?.message || 'Error deleting fuel type');
    }
  };

  // Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName,
      metric_type: newCatMetric,
      default_benchmark: parseFloat(newCatBenchmark) || 8.0,
      icon_name: 'Truck',
      description: newCatDesc
    });
    setNewCatName('');
    setNewCatDesc('');
    setShowCategoryModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.title}
          </h2>
          <p className="text-xs text-slate-500 font-medium">{t.subtitle}</p>
        </div>

        {onOpenBulkImport && !isViewer && (
          <button
            type="button"
            id="masterdata-bulk-import-btn"
            onClick={() => onOpenBulkImport(activeTab)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-600/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
            title="Bulk import data from Excel/CSV (Includes sample format templates)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Bulk Import {activeTab.replace('_', ' ').toUpperCase()} (Excel/CSV)</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {[
          { id: 'companies', label: t.companiesTab, icon: <Building className="w-4 h-4" />, count: companies.length },
          { id: 'vendors', label: t.vendorsTab, icon: <Users className="w-4 h-4" />, count: vendors.length },
          { id: 'pumps', label: t.pumpsTab, icon: <CreditCard className="w-4 h-4" />, count: pumps.length },
          { id: 'fuel_types', label: t.fuelTypesTab, icon: <Fuel className="w-4 h-4" />, count: fuelTypes.length },
          { id: 'categories', label: t.categoriesTab, icon: <Tag className="w-4 h-4" />, count: categories.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: Companies */}
      {activeTab === 'companies' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {t.companiesSub}
            </h3>
            {!isViewer && (
              <button
                onClick={() => setShowCompanyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addCompany}</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-blue-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#182952] text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">{t.code}</th>
                  <th className="py-2.5 px-3">{t.name}</th>
                  <th className="py-2.5 px-3">{t.contact}</th>
                  <th className="py-2.5 px-3">{t.phone}</th>
                  <th className="py-2.5 px-3">{t.email}</th>
                  <th className="py-2.5 px-3">{t.address}</th>
                  <th className="py-2.5 px-3 text-right">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-blue-900/40">
                {paginatedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                      {t.noCompaniesMsg}
                    </td>
                  </tr>
                ) : (
                  paginatedCompanies.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-blue-950/40">
                      <td className="py-2.5 px-3 font-mono font-black text-amber-700 dark:text-amber-300">{c.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200">{c.contact_person || '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">{c.phone || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.email || '—'}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{c.address || '—'}</td>
                      <td className="py-2.5 px-3 text-right">
                        {!isViewer ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditCompanyModal(c)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                              title={t.editTooltip}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCompanyToDelete(c)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title={t.deleteTooltip}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-blue-900/40">
            <TablePagination
              currentPage={companyPage}
              totalItems={companies.length}
              pageSize={pageSize}
              onPageChange={setCompanyPage}
              onExportCurrentPageCsv={handleExportCompaniesCurrentCsv}
              onExportAllCsv={handleExportCompaniesAllCsv}
              itemName="companies"
            />
          </div>
        </div>
      )}

      {/* TAB 2: Vendors */}
      {activeTab === 'vendors' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {t.vendorsSub}
            </h3>
            {!isViewer && (
              <button
                onClick={() => setShowVendorModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addVendor}</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-blue-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#182952] text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">{t.name}</th>
                  <th className="py-2.5 px-3">{t.contact}</th>
                  <th className="py-2.5 px-3">{t.phone}</th>
                  <th className="py-2.5 px-3">{t.address}</th>
                  <th className="py-2.5 px-3 text-right">{t.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-blue-900/40">
                {paginatedVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                      No vendors registered yet.
                    </td>
                  </tr>
                ) : (
                  paginatedVendors.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-blue-950/40">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{v.name}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200">{v.contact_person}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200">{v.phone}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{v.address}</td>
                      <td className="py-2.5 px-3 text-right">
                        {!isViewer ? (
                          <button
                            onClick={() => deleteVendor(v.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title={t.deleteTooltip}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-blue-900/40">
            <TablePagination
              currentPage={vendorPage}
              totalItems={vendors.length}
              pageSize={pageSize}
              onPageChange={setVendorPage}
              onExportCurrentPageCsv={handleExportVendorsCurrentCsv}
              onExportAllCsv={handleExportVendorsAllCsv}
              itemName="vendors"
            />
          </div>
        </div>
      )}

      {/* TAB 3: Fuel Pumps */}
      {activeTab === 'pumps' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {t.pumpsSub}
            </h3>
            {!isViewer && (
              <button
                onClick={() => setShowPumpModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addPump}</span>
              </button>
            )}
          </div>

          {paginatedPumps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-blue-900/40">
              {t.noPumpsMsg}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {paginatedPumps.map(p => (
                <div
                  key={p.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-blue-800/70 bg-slate-50/70 dark:bg-[#14234b] space-y-3 relative group hover:border-amber-400 dark:hover:border-amber-400/80 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/20 dark:border-amber-400/30">
                          <Fuel className="w-4 h-4" />
                        </div>
                        <h4 className="font-black text-slate-950 dark:text-amber-300 text-sm truncate">{p.name}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium truncate flex items-center gap-1 pl-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                        <span>{p.location || 'Location not specified'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        p.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      }`}>
                        {p.status.toUpperCase()}
                      </span>
                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => setPumpToDelete(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors"
                          title={t.deleteTooltip}
                          aria-label={`${t.deleteTooltip} ${p.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-slate-200 dark:border-blue-800/60 pt-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{t.contactLabel}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{p.contact_person || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{t.phoneLabel}</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 dark:text-slate-400" />
                        {p.phone || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{t.creditLimitLabel}</span>
                      <span className="font-mono font-black text-slate-950 dark:text-amber-300">BDT {p.credit_limit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{t.currentDueLabel}</span>
                      <span className="font-mono font-black text-rose-600 dark:text-rose-400">BDT {p.current_balance.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Credit usage bar */}
                  <div className="pt-1.5">
                    <div className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      <span>{t.creditUsageLabel}</span>
                      <span className="font-black font-mono text-slate-950 dark:text-white">
                        {Math.round((p.current_balance / (p.credit_limit || 1)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((p.current_balance / (p.credit_limit || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-blue-900/40">
            <TablePagination
              currentPage={pumpPage}
              totalItems={pumps.length}
              pageSize={pageSize}
              onPageChange={setPumpPage}
              onExportCurrentPageCsv={handleExportPumpsCurrentCsv}
              onExportAllCsv={handleExportPumpsAllCsv}
              itemName="pumps"
            />
          </div>
        </div>
      )}

      {/* TAB 4: Fuel Types & Pricing */}
      {activeTab === 'fuel_types' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                {t.fuelTypesSub}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.fuelTypesDesc}
              </p>
            </div>
            {!isViewer && (
              <button
                onClick={() => {
                  setFuelActionError(null);
                  setShowAddFuelModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Fuel Type</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fuelTypes.map(ft => (
              <div key={ft.id} className="p-4 rounded-xl border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-[#101b38] flex flex-col justify-between shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700/60">
                      {ft.code}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {t.updatedLabel}: {ft.updated_at}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mb-1">{ft.name}</h4>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    BDT {ft.current_price.toFixed(2)} <span className="text-xs font-normal text-slate-600 dark:text-slate-300">/ {ft.unit}</span>
                  </div>

                  {/* Price history badge */}
                  <div className="mt-3 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{t.prevPriceChanges}</span>
                    <ul className="mt-1 space-y-0.5 max-h-20 overflow-y-auto">
                      {ft.price_history && ft.price_history.slice(-3).reverse().map((h, i) => (
                        <li key={i} className="text-[10px] text-slate-600 dark:text-slate-300 flex justify-between font-mono">
                          <span>{h.date}:</span>
                          <span>BDT {h.price.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {!isViewer && (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedFuelType(ft);
                        setNewPriceValue(ft.current_price.toString());
                      }}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{t.updatePrice}</span>
                    </button>
                    <button
                      onClick={() => {
                        setFuelActionError(null);
                        setDeleteConfirmFuelType(ft);
                      }}
                      title="Delete Fuel Type"
                      className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Vehicle Categories */}
      {activeTab === 'categories' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1a36] border border-slate-200 dark:border-blue-900/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-100">
              {t.categoriesSub}
            </h3>
            {!isViewer && (
              <button
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addCategory}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paginatedCategories.map(cat => (
              <div key={cat.id} className="p-4 rounded-xl border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-[#101b38] flex items-start justify-between shadow-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{cat.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold uppercase font-mono">
                      {t.metricLabel} {cat.metric_type === 'kmpl' ? 'KMPL (KM/Liter)' : 'LPH (Liters/Hour)'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold font-mono">
                      {t.defaultBenchmarkLabel} {cat.default_benchmark} {cat.metric_type === 'kmpl' ? 'KM/L' : 'L/Hr'}
                    </span>
                  </div>
                </div>

                {!isViewer && (
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    title={t.deleteTooltip}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-blue-900/40">
            <TablePagination
              currentPage={categoryPage}
              totalItems={categories.length}
              pageSize={pageSize}
              onPageChange={setCategoryPage}
              onExportCurrentPageCsv={handleExportCategoriesCurrentCsv}
              onExportAllCsv={handleExportCategoriesAllCsv}
              itemName="categories"
            />
          </div>
        </div>
      )}

      {/* MODAL: Update Fuel Price */}
      {selectedFuelType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              {t.priceModalTitle}: {selectedFuelType.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t.currentPriceLabel} BDT {selectedFuelType.current_price.toFixed(2)}
            </p>

            <form onSubmit={handleUpdatePrice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.newUnitPriceLabel}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newPriceValue}
                  onChange={e => setNewPriceValue(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFuelType(null)}
                  className="w-1/2 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600"
                >
                  {t.savePriceBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add New Fuel Type */}
      {showAddFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c162d] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-blue-900/40">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">
                    Add New Fuel Type
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define a fuel grade with pricing & measurement unit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddFuelModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {fuelActionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 text-xs font-semibold">
                {fuelActionError}
              </div>
            )}

            <form onSubmit={handleAddFuelType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fuel Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CNG, LPG Autogas, High-Octane 98"
                  value={newFuelName}
                  onChange={e => setNewFuelName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. cng, lpg"
                    value={newFuelCode}
                    onChange={e => setNewFuelCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unit of Measure *
                  </label>
                  <select
                    value={newFuelUnit}
                    onChange={e => setNewFuelUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Liter">Liter</option>
                    <option value="Cubic Meter (m³)">Cubic Meter (m³)</option>
                    <option value="Kg">Kg</option>
                    <option value="Gallon">Gallon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Price per Unit (BDT) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 52.50"
                  value={newFuelPrice}
                  onChange={e => setNewFuelPrice(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddFuelModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFuel}
                  className="w-1/2 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmittingFuel ? 'Saving...' : 'Add Fuel Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirm Fuel Type */}
      {deleteConfirmFuelType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c162d] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-blue-900/40">
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  Delete Fuel Type?
                </h3>
                <p className="text-[11px] text-slate-500">
                  {deleteConfirmFuelType.name} ({deleteConfirmFuelType.code.toUpperCase()})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Are you sure you want to delete this fuel type? If fuel entries or tankers are linked to it, the system will prevent deletion to preserve audit history.
            </p>

            {fuelActionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 text-xs font-semibold">
                {fuelActionError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmFuelType(null)}
                className="w-1/2 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingFuel}
                onClick={handleDeleteFuelType}
                className="w-1/2 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmittingFuel ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Company */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-3">{t.addCompanyModalTitle}</h3>
            <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.companyNameLabel}</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  required
                  placeholder="e.g. Rosatom Site Sector"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.shortCodeLabel}</label>
                <input
                  type="text"
                  value={newCompanyCode}
                  onChange={e => setNewCompanyCode(e.target.value)}
                  placeholder="e.g. ROSATOM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.contact}</label>
                <input
                  type="text"
                  value={newCompanyContact}
                  onChange={e => setNewCompanyContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.phone}</label>
                <input
                  type="text"
                  value={newCompanyPhone}
                  onChange={e => setNewCompanyPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.email}</label>
                <input
                  type="email"
                  value={newCompanyEmail}
                  onChange={e => setNewCompanyEmail(e.target.value)}
                  placeholder="e.g. info@company.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.address}</label>
                <input
                  type="text"
                  value={newCompanyAddress}
                  onChange={e => setNewCompanyAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                >
                  {t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Vendor */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-3">{t.addVendorModalTitle}</h3>
            <form onSubmit={handleSaveVendor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.vendorNameLabel}</label>
                <input
                  type="text"
                  value={newVendorName}
                  onChange={e => setNewVendorName(e.target.value)}
                  required
                  placeholder="e.g. Chowdhury Transport Ltd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.contact}</label>
                <input
                  type="text"
                  value={newVendorContact}
                  onChange={e => setNewVendorContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.phone}</label>
                <input
                  type="text"
                  value={newVendorPhone}
                  onChange={e => setNewVendorPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.address}</label>
                <input
                  type="text"
                  value={newVendorAddress}
                  onChange={e => setNewVendorAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                >
                  {t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Pump */}
      {showPumpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-3">{t.addPumpModalTitle}</h3>
            <form onSubmit={handleSavePump} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.pumpNameLabel}</label>
                <input
                  type="text"
                  value={newPumpName}
                  onChange={e => setNewPumpName(e.target.value)}
                  required
                  placeholder="e.g. Jamuna Highway Fuel Station"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.locationLabel}</label>
                <input
                  type="text"
                  value={newPumpLocation}
                  onChange={e => setNewPumpLocation(e.target.value)}
                  required
                  placeholder="e.g. Ishwardi Highway"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.contact}</label>
                  <input
                    type="text"
                    value={newPumpContact}
                    onChange={e => setNewPumpContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.phone}</label>
                  <input
                    type="text"
                    value={newPumpPhone}
                    onChange={e => setNewPumpPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.creditLimitInputLabel}</label>
                  <input
                    type="number"
                    value={newPumpCreditLimit}
                    onChange={e => setNewPumpCreditLimit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.openingBalanceLabel}</label>
                  <input
                    type="number"
                    value={newPumpOpeningBalance}
                    onChange={e => setNewPumpOpeningBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPumpModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                >
                  {t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm mb-3">{t.addCategoryModalTitle}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.categoryNameLabel}</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  required
                  placeholder="e.g. 50T Mobile Crane"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.metricTypeLabel}</label>
                  <select
                    value={newCatMetric}
                    onChange={e => setNewCatMetric(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="kmpl">{t.kmplOption}</option>
                    <option value="lph">{t.lphOption}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.benchmarkInputLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCatBenchmark}
                    onChange={e => setNewCatBenchmark(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.descriptionLabel}</label>
                <input
                  type="text"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="e.g. Heavy lifting hydraulic crane"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                >
                  {t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Company */}
      {showEditCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">{t.editCompanyModalTitle}</h3>
              <button
                type="button"
                onClick={() => setShowEditCompanyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCompany} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.companyNameLabel}</label>
                <input
                  type="text"
                  value={editCompanyName}
                  onChange={e => setEditCompanyName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.shortCodeLabel}</label>
                <input
                  type="text"
                  value={editCompanyCode}
                  onChange={e => setEditCompanyCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.contact}</label>
                <input
                  type="text"
                  value={editCompanyContact}
                  onChange={e => setEditCompanyContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.phone}</label>
                <input
                  type="text"
                  value={editCompanyPhone}
                  onChange={e => setEditCompanyPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.email}</label>
                <input
                  type="email"
                  value={editCompanyEmail}
                  onChange={e => setEditCompanyEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.address}</label>
                <input
                  type="text"
                  value={editCompanyAddress}
                  onChange={e => setEditCompanyAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditCompanyModal(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-300 font-bold hover:bg-slate-50"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                >
                  {t.editCompanyBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Pump */}
      {pumpToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t.confirmDeletePumpTitle}</h3>
                <p className="text-xs text-slate-500 font-medium">{pumpToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t.confirmDeletePumpMsg}
            </p>

            {pumpToDelete.current_balance > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                <span>{t.pumpDueWarning}</span>
                <span className="font-mono font-bold text-red-600">BDT {pumpToDelete.current_balance.toLocaleString()}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPumpToDelete(null)}
                className="w-1/2 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePump}
                className="w-1/2 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-xs"
              >
                {t.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Company */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{t.confirmDeleteCompanyTitle}</h3>
                <p className="text-xs text-slate-500 font-medium">{companyToDelete.name} ({companyToDelete.code})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t.confirmDeleteCompanyMsg}
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setCompanyToDelete(null)}
                className="w-1/2 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCompany}
                className="w-1/2 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 shadow-xs"
              >
                {t.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white text-xs font-medium rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 p-1 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
