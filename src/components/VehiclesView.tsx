import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TablePagination } from './TablePagination';
import { CsvExportMenu } from './CsvExportMenu';
import { exportToCsv } from '../utils/csvExporter';
import {
  Truck,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
  Fuel,
  TrendingUp,
  User,
  Phone,
  Building,
  ShieldAlert
} from 'lucide-react';
import { Vehicle } from '../types';

interface VehiclesViewProps {
  onSelectVehicleForEntry: (vehicleId: string) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({ onSelectVehicleForEntry }) => {
  const {
    language,
    currentTenant,
    currentUser,
    vehicles,
    companies,
    vendors,
    categories,
    fuelTypes,
    fuelEntries,
    addVehicle,
    updateVehicle,
    deleteVehicle
  } = useApp();

  const isViewer = currentUser?.role === 'client_viewer';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterOwnership, setFilterOwnership] = useState('all');

  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  const [vehNumber, setVehNumber] = useState('');
  const [vehCategoryId, setVehCategoryId] = useState('');
  const [vehOwnership, setVehOwnership] = useState<'owned' | 'rented'>('owned');
  const [vehVendorId, setVehVendorId] = useState('');
  const [vehCompanyId, setVehCompanyId] = useState('');
  const [vehFuelTypeId, setVehFuelTypeId] = useState('');
  const [vehBenchmark, setVehBenchmark] = useState('8.0');
  const [vehOdometer, setVehOdometer] = useState('0');
  const [vehDriverName, setVehDriverName] = useState('');
  const [vehDriverPhone, setVehDriverPhone] = useState('');

  // Vehicle Profile / Fuel Log Inspection Modal
  const [selectedVehicleForInspect, setSelectedVehicleForInspect] = useState<Vehicle | null>(null);

  const t = {
    title: 'Vehicles & Heavy Equipment Management',
    subtitle: 'Vehicle registration, ownership (Owned/Vendor), assigned company and standard mileage benchmark',
    addVehicle: 'Register Vehicle',
    allCompanies: 'All Companies',
    allCategories: 'All Categories',
    allOwnership: 'All Ownership',
    owned: 'Company Owned',
    rented: 'Vendor Rented',
    searchPlaceholder: 'Search vehicle reg or driver...',
    vehNumber: 'Vehicle Reg No',
    category: 'Category',
    company: 'Assigned Company',
    ownership: 'Ownership',
    fuelType: 'Fuel Type',
    benchmark: 'Benchmark Mileage',
    lastMeter: 'Current Meter',
    driver: 'Driver & Contact',
    actions: 'Actions',
    fuelEntryBtn: 'Add Fuel Entry',
    inspectBtn: 'Fuel History',
    noVehiclesFound: 'No vehicles or equipment found.',
    addFuelShort: '+ Fuel',
    addFuelTooltip: 'Add fuel entry for this vehicle',
    viewHistoryTooltip: 'View fuel history logs',
    editBtn: 'Edit',
    deleteBtn: 'Delete',
    modalEditTitle: 'Update Vehicle Information',
    modalAddTitle: 'Register New Vehicle / Equipment',
    modalSubtitle: 'Vehicle fuel consumption will be monitored based on standard mileage benchmark.',
    regNoLabel: 'Vehicle Registration Number *',
    regNoPlaceholder: 'e.g. Dhaka Metro-Ba 15-4421 or RNPP-EXC-07',
    categoryLabel: 'Category *',
    customerCompLabel: 'Customer Company *',
    ownershipTypeLabel: 'Ownership Type *',
    vendorCompLabel: 'Vendor Company *',
    selectVendorPlaceholder: '-- Select Vendor --',
    fuelTypeLabel: 'Fuel Type *',
    benchmarkLabel: 'Standard Benchmark (KMPL or LPH) *',
    currentMeterLabel: 'Current Meter / Hour Meter Reading *',
    driverNameLabel: 'Driver / Operator Name',
    driverPhoneLabel: 'Driver Mobile Number',
    cancelBtn: 'Cancel',
    updateBtn: 'Update Vehicle',
    registerBtn: 'Register Vehicle',
    totalFuelUsed: 'Total Fuel Consumed',
    totalCostLabel: 'Total Expense',
    targetBenchmark: 'Target Benchmark',
    historyTitle: 'Fuel Entry History',
    recordsSuffix: 'records',
    dateSlipCol: 'Date & Slip',
    meterCol: 'Meter Reading',
    distanceCol: 'Distance',
    litersCol: 'Liters',
    mileageCol: 'Mileage',
    statusCol: 'Status',
    anomalyBadge: 'Anomaly',
    normalBadge: 'Normal',
    addNewFuelEntry: '+ Add New Fuel Entry',
    closeBtn: 'Close'
  };

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (filterCompany !== 'all' && v.company_id !== filterCompany) return false;
      if (filterCategory !== 'all' && v.category_id !== filterCategory) return false;
      if (filterOwnership !== 'all' && v.ownership !== filterOwnership) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        if (
          !v.vehicle_number.toLowerCase().includes(term) &&
          !v.driver_name.toLowerCase().includes(term) &&
          !v.driver_phone.includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [vehicles, filterCompany, filterCategory, filterOwnership, searchTerm]);

  // Pagination (Max 10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterCompany, filterCategory, filterOwnership, searchTerm]);

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage]);

  const handleExportCurrentViewCsv = () => {
    const headers = ['Vehicle Number', 'Category', 'Assigned Company', 'Ownership', 'Vendor', 'Fuel Type', 'Benchmark Mileage', 'Current Meter', 'Driver Name', 'Driver Phone'];
    const rows = paginatedVehicles.map(veh => {
      const cat = categories.find(c => c.id === veh.category_id);
      const comp = companies.find(c => c.id === veh.company_id);
      const vnd = vendors.find(v => v.id === veh.vendor_id);
      const ft = fuelTypes.find(f => f.id === veh.fuel_type_id);
      const isLph = cat?.metric_type === 'lph';
      return [
        veh.vehicle_number,
        cat?.name || '',
        comp?.name || '',
        veh.ownership === 'owned' ? 'Owned' : 'Rented',
        vnd?.name || 'N/A',
        ft?.name || '',
        `${veh.expected_benchmark} ${isLph ? 'L/Hr' : 'KM/L'}`,
        `${veh.current_odometer} ${isLph ? 'Hrs' : 'KM'}`,
        veh.driver_name,
        veh.driver_phone
      ];
    });
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Vehicles_Page_${currentPage}_(${paginatedVehicles.length}_records)_${dateStr}`, headers, rows);
  };

  const handleExportAllCsv = () => {
    const headers = ['Vehicle Number', 'Category', 'Assigned Company', 'Ownership', 'Vendor', 'Fuel Type', 'Benchmark Mileage', 'Current Meter', 'Driver Name', 'Driver Phone'];
    const rows = filteredVehicles.map(veh => {
      const cat = categories.find(c => c.id === veh.category_id);
      const comp = companies.find(c => c.id === veh.company_id);
      const vnd = vendors.find(v => v.id === veh.vendor_id);
      const ft = fuelTypes.find(f => f.id === veh.fuel_type_id);
      const isLph = cat?.metric_type === 'lph';
      return [
        veh.vehicle_number,
        cat?.name || '',
        comp?.name || '',
        veh.ownership === 'owned' ? 'Owned' : 'Rented',
        vnd?.name || 'N/A',
        ft?.name || '',
        `${veh.expected_benchmark} ${isLph ? 'L/Hr' : 'KM/L'}`,
        `${veh.current_odometer} ${isLph ? 'Hrs' : 'KM'}`,
        veh.driver_name,
        veh.driver_phone
      ];
    });
    const dateStr = new Date().toISOString().split('T')[0];
    const isFiltered = filteredVehicles.length !== vehicles.length;
    const filterTag = isFiltered ? `Filtered_${filteredVehicles.length}_of_${vehicles.length}` : `All_${filteredVehicles.length}`;
    exportToCsv(`Vehicles_${filterTag}_records_${currentTenant.code}_${dateStr}`, headers, rows);
  };

  const handleOpenAdd = () => {
    setEditingVehicleId(null);
    setVehNumber('');
    setVehCategoryId(categories[0]?.id || '');
    setVehOwnership('owned');
    setVehVendorId('');
    setVehCompanyId(companies[0]?.id || '');
    setVehFuelTypeId(fuelTypes[0]?.id || '');
    setVehBenchmark(categories[0]?.default_benchmark.toString() || '8.0');
    setVehOdometer('0');
    setVehDriverName('');
    setVehDriverPhone('');
    setShowModal(true);
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicleId(v.id);
    setVehNumber(v.vehicle_number);
    setVehCategoryId(v.category_id);
    setVehOwnership(v.ownership);
    setVehVendorId(v.vendor_id || '');
    setVehCompanyId(v.company_id);
    setVehFuelTypeId(v.fuel_type_id);
    setVehBenchmark(v.expected_benchmark.toString());
    setVehOdometer(v.current_odometer.toString());
    setVehDriverName(v.driver_name);
    setVehDriverPhone(v.driver_phone);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehNumber.trim()) return;

    const payload = {
      vehicle_number: vehNumber.trim(),
      category_id: vehCategoryId,
      ownership: vehOwnership,
      vendor_id: vehOwnership === 'rented' ? vehVendorId : undefined,
      company_id: vehCompanyId,
      fuel_type_id: vehFuelTypeId,
      expected_benchmark: parseFloat(vehBenchmark) || 8.0,
      current_odometer: parseFloat(vehOdometer) || 0,
      driver_name: vehDriverName,
      driver_phone: vehDriverPhone,
      status: 'active' as const
    };

    if (editingVehicleId) {
      updateVehicle(editingVehicleId, payload);
    } else {
      addVehicle(payload);
    }

    setShowModal(false);
  };

  // Inspect vehicle stats
  const vehicleEntries = useMemo(() => {
    if (!selectedVehicleForInspect) return [];
    return fuelEntries.filter(e => e.vehicle_id === selectedVehicleForInspect.id);
  }, [fuelEntries, selectedVehicleForInspect]);

  const totalFuelConsumed = useMemo(() => {
    return vehicleEntries.reduce((acc, e) => acc + e.fuel_liters, 0);
  }, [vehicleEntries]);

  const totalCost = useMemo(() => {
    return vehicleEntries.reduce((acc, e) => acc + e.total_amount, 0);
  }, [vehicleEntries]);

  const totalRun = useMemo(() => {
    return vehicleEntries.reduce((acc, e) => acc + e.distance_traveled, 0);
  }, [vehicleEntries]);

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

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <CsvExportMenu
            onExportCurrentPage={handleExportCurrentViewCsv}
            onExportAll={handleExportAllCsv}
            currentPage={currentPage}
            totalPages={Math.max(1, Math.ceil(filteredVehicles.length / pageSize))}
            currentPageCount={paginatedVehicles.length}
            totalFilteredCount={filteredVehicles.length}
            totalUnfilteredCount={vehicles.length}
            startItem={filteredVehicles.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            endItem={Math.min(currentPage * pageSize, filteredVehicles.length)}
            entityName="vehicles"
            buttonVariant="header"
            dropDirection="down"
          />

          {!isViewer && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addVehicle}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {/* Company Filter */}
            <select
              value={filterCompany}
              onChange={e => setFilterCompany(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="all">{t.allCompanies}</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="all">{t.allCategories}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Ownership Filter */}
            <select
              value={filterOwnership}
              onChange={e => setFilterOwnership(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="all">{t.allOwnership}</option>
              <option value="owned">{t.owned}</option>
              <option value="rented">{t.rented}</option>
            </select>
          </div>
        </div>

        {/* Vehicles Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.vehNumber}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.category}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.company}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.ownership}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.fuelType}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.benchmark}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.lastMeter}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3">{t.driver}</th>
                <th className="py-2.5 px-2 sm:px-2.5 lg:px-3 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedVehicles.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {t.noVehiclesFound}
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map(veh => {
                  const cat = categories.find(c => c.id === veh.category_id);
                  const comp = companies.find(c => c.id === veh.company_id);
                  const vnd = vendors.find(v => v.id === veh.vendor_id);
                  const ft = fuelTypes.find(f => f.id === veh.fuel_type_id);
                  const isLph = cat?.metric_type === 'lph';

                  return (
                    <tr key={veh.id} className="hover:bg-slate-50 transition-colors">
                      {/* Vehicle Number */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900">{veh.vehicle_number}</div>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {veh.id}</span>
                      </td>

                      {/* Category */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 text-slate-700 whitespace-nowrap">
                        <div className="font-semibold">{cat?.name}</div>
                      </td>

                      {/* Company */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800">{comp?.code || comp?.name}</span>
                      </td>

                      {/* Ownership */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        {veh.ownership === 'owned' ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            OWNED
                          </span>
                        ) : (
                          <div>
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                              RENTED
                            </span>
                            <div className="text-[10px] text-slate-500 truncate max-w-[110px]" title={vnd?.name}>
                              {vnd?.name}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Fuel Type */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap font-medium text-slate-600">
                        {ft?.name}
                      </td>

                      {/* Benchmark */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap font-mono font-bold text-slate-800">
                        {veh.expected_benchmark} {isLph ? 'L/Hr' : 'KM/L'}
                      </td>

                      {/* Current Odometer */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap font-mono font-semibold text-blue-700">
                        {veh.current_odometer.toLocaleString()} {isLph ? 'Hrs' : 'KM'}
                      </td>

                      {/* Driver */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{veh.driver_name || '—'}</div>
                        <div className="text-[11px] font-mono text-slate-400">{veh.driver_phone}</div>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2 sm:px-2.5 lg:px-3 text-right whitespace-nowrap space-x-1">
                        {!isViewer && (
                          <button
                            onClick={() => onSelectVehicleForEntry(veh.id)}
                            className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px]"
                            title={t.addFuelTooltip}
                          >
                            {t.addFuelShort}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedVehicleForInspect(veh)}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          title={t.viewHistoryTooltip}
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {!isViewer && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(veh)}
                              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title={t.editBtn}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteVehicle(veh.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title={t.deleteBtn}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & CSV Export */}
        <div className="mt-4">
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredVehicles.length}
            totalUnfilteredItems={vehicles.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onExportCurrentPageCsv={handleExportCurrentViewCsv}
            onExportAllCsv={handleExportAllCsv}
            itemName="vehicles"
          />
        </div>
      </div>

      {/* MODAL: Register / Edit Vehicle */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 my-6">
            <h3 className="font-black text-slate-900 text-sm mb-1">
              {editingVehicleId ? t.modalEditTitle : t.modalAddTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {t.modalSubtitle}
            </p>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.regNoLabel}</label>
                <input
                  type="text"
                  value={vehNumber}
                  onChange={e => setVehNumber(e.target.value)}
                  required
                  placeholder={t.regNoPlaceholder}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.categoryLabel}</label>
                  <select
                    value={vehCategoryId}
                    onChange={e => {
                      setVehCategoryId(e.target.value);
                      const cat = categories.find(c => c.id === e.target.value);
                      if (cat) {
                        setVehBenchmark(cat.default_benchmark.toString());
                      }
                    }}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.customerCompLabel}</label>
                  <select
                    value={vehCompanyId}
                    onChange={e => setVehCompanyId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.ownershipTypeLabel}</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setVehOwnership('owned')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                        vehOwnership === 'owned'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Owned
                    </button>
                    <button
                      type="button"
                      onClick={() => setVehOwnership('rented')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border ${
                        vehOwnership === 'rented'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      Vendor Rented
                    </button>
                  </div>
                </div>

                {vehOwnership === 'rented' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">{t.vendorCompLabel}</label>
                    <select
                      value={vehVendorId}
                      onChange={e => setVehVendorId(e.target.value)}
                      required={vehOwnership === 'rented'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="">{t.selectVendorPlaceholder}</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.fuelTypeLabel}</label>
                  <select
                    value={vehFuelTypeId}
                    onChange={e => setVehFuelTypeId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                  >
                    {fuelTypes.map(f => (
                      <option key={f.id} value={f.id}>{f.name} (৳{f.current_price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.benchmarkLabel}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vehBenchmark}
                    onChange={e => setVehBenchmark(e.target.value)}
                    required
                    placeholder="e.g. 9.5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t.currentMeterLabel}</label>
                <input
                  type="number"
                  value={vehOdometer}
                  onChange={e => setVehOdometer(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.driverNameLabel}</label>
                  <input
                    type="text"
                    value={vehDriverName}
                    onChange={e => setVehDriverName(e.target.value)}
                    placeholder="e.g. Md. Shamsul Haque"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t.driverPhoneLabel}</label>
                  <input
                    type="text"
                    value={vehDriverPhone}
                    onChange={e => setVehDriverPhone(e.target.value)}
                    placeholder="e.g. +880 1711-000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
                >
                  {editingVehicleId ? t.updateBtn : t.registerBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Vehicle History & Profile */}
      {selectedVehicleForInspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {selectedVehicleForInspect.vehicle_number}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedVehicleForInspect.driver_name} • {selectedVehicleForInspect.driver_phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedVehicleForInspect(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.totalFuelUsed}</span>
                <span className="text-base font-black text-slate-900 font-mono">{totalFuelConsumed} L</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.totalCostLabel}</span>
                <span className="text-base font-black text-amber-600 font-mono">৳{totalCost.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t.targetBenchmark}</span>
                <span className="text-base font-black text-emerald-700 font-mono">{selectedVehicleForInspect.expected_benchmark}</span>
              </div>
            </div>

            {/* History Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">
                {t.historyTitle} ({vehicleEntries.length} {t.recordsSuffix})
              </h4>
              <div className="overflow-x-auto max-h-60 rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">{t.dateSlipCol}</th>
                      <th className="py-2 px-3">{t.meterCol}</th>
                      <th className="py-2 px-3">{t.distanceCol}</th>
                      <th className="py-2 px-3">{t.litersCol}</th>
                      <th className="py-2 px-3">{t.mileageCol}</th>
                      <th className="py-2 px-3">{t.statusCol}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {vehicleEntries.map(e => (
                      <tr key={e.id} className={e.is_anomaly ? 'bg-red-50' : ''}>
                        <td className="py-2 px-3 font-mono">{e.entry_date} ({e.slip_no})</td>
                        <td className="py-2 px-3 font-mono">{e.current_meter}</td>
                        <td className="py-2 px-3 font-mono">{e.distance_traveled}</td>
                        <td className="py-2 px-3 font-mono font-bold">{e.fuel_liters} L</td>
                        <td className="py-2 px-3 font-mono font-extrabold text-slate-900">
                          {e.calculated_mileage}
                        </td>
                        <td className="py-2 px-3">
                          {e.is_anomaly ? (
                            <span className="text-red-600 font-bold text-[10px]">{t.anomalyBadge}</span>
                          ) : (
                            <span className="text-emerald-700 text-[10px]">{t.normalBadge}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              {!isViewer && (
                <button
                  onClick={() => {
                    const id = selectedVehicleForInspect.id;
                    setSelectedVehicleForInspect(null);
                    onSelectVehicleForEntry(id);
                  }}
                  className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                >
                  {t.addNewFuelEntry}
                </button>
              )}
              <button
                onClick={() => setSelectedVehicleForInspect(null)}
                className="py-2 px-4 rounded-xl border border-slate-300 font-bold text-xs"
              >
                {t.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
