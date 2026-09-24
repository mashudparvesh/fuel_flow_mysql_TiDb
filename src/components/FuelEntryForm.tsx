import React, { useState, useEffect, useId } from 'react';
import { useApp } from '../context/AppContext';
import {
  Fuel,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Calculator,
  Gauge,
  Calendar,
  FileText,
  DollarSign,
  Truck,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface FuelEntryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialVehicleId?: string;
  preselectedVehicleId?: string;
}

export const FuelEntryForm: React.FC<FuelEntryFormProps> = ({
  onSuccess,
  onCancel,
  initialVehicleId,
  preselectedVehicleId
}) => {
  const {
    language,
    companies,
    vehicles,
    fuelTypes,
    categories,
    pumps,
    tankers,
    addFuelEntry
  } = useApp();

  const effectiveInitialVehicleId = initialVehicleId || preselectedVehicleId || '';
  const [companyId, setCompanyId] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>(effectiveInitialVehicleId);
  const [sourceType, setSourceType] = useState<'pump' | 'tanker'>('pump');
  const [pumpId, setPumpId] = useState<string>('');
  const [tankerId, setTankerId] = useState<string>('');

  useEffect(() => {
    if (effectiveInitialVehicleId) {
      setVehicleId(effectiveInitialVehicleId);
    }
  }, [effectiveInitialVehicleId]);
  
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [slipNo, setSlipNo] = useState<string>(() => `SLIP-${Math.floor(10000 + Math.random() * 90000)}`);
  
  const [previousMeter, setPreviousMeter] = useState<number>(0);
  const [currentMeter, setCurrentMeter] = useState<string>('');
  const [fuelLiters, setFuelLiters] = useState<string>('');
  
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const t = {
    title: 'Ultra-Fast Fuel Entry Module',
    subtitle: 'Dynamic calculation with real-time fuel anomaly detection',
    companySelect: 'Select Customer Company',
    allCompanies: '-- Select Company --',
    vehicleSelect: 'Select Vehicle / Equipment',
    allVehicles: '-- Select Vehicle --',
    fuelSource: 'Fuel Source',
    pumpCredit: 'Fuel Pump (On Credit)',
    tankerDirect: 'Internal Tanker / Bowzer',
    selectPump: 'Select Fuel Pump',
    selectTanker: 'Select Internal Bowzer',
    entryDate: 'Date',
    slipNo: 'Slip / Memo Number',
    prevMeter: 'Previous Meter Reading',
    currMeter: 'Current Meter Reading',
    liters: 'Fuel Volume (Liters)',
    unitRate: 'Unit Price',
    distance: 'Distance / Operating Hours',
    totalAmount: 'Total Cost (BDT)',
    calcMileage: 'Calculated Mileage',
    benchmark: 'Standard Benchmark',
    receiptUpload: 'Upload Receipt Slip Photo',
    notes: 'Remarks / Notes',
    submitBtn: 'Save Fuel Entry',
    anomalyWarning: 'Fuel Anomaly / Theft Alert! Mileage significantly below benchmark.',
    optimalNotice: 'Mileage is within optimal benchmark parameters.',
    category: 'Category',
    fuelTypeAndRate: 'Fuel Type & Rate',
    standardBenchmark: 'Standard Benchmark',
    previousReading: 'Previous Reading',
    dueLabel: 'Due',
    stockLabel: 'Stock',
    smartCalcHeading: 'Smart Calculation & Meter Readings',
    deviationLabel: 'deviation',
    anomalyDetailText: 'Expected benchmark for this vehicle is {benchmark}, but actual recorded is only {calculated}. Fuel theft or mechanical fault suspected.',
    chooseFileText: 'Choose file / Camera capture',
    notesPlaceholder: 'e.g. Rooppur VIP trip / Pabna highway route',
    failedMessage: 'Operation failed.',
    successAnomalyMsg: 'Notice: Fuel entry saved, but flagged as anomaly due to abnormal mileage!',
    successNormalMsg: 'Fuel entry recorded successfully!'
  };

  // Filter vehicles by selected company with ID deduplication
  const availableVehicles = React.useMemo(() => {
    const seen = new Set<string>();
    const list = companyId ? vehicles.filter(v => v.company_id === companyId) : vehicles;
    return list.filter(v => {
      if (!v || !v.id || seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });
  }, [vehicles, companyId]);

  // Selected vehicle details
  const selectedVehicle = React.useMemo(() => {
    return vehicles.find(v => v.id === vehicleId);
  }, [vehicles, vehicleId]);

  const selectedCategory = React.useMemo(() => {
    if (!selectedVehicle) return null;
    return categories.find(c => c.id === selectedVehicle.category_id);
  }, [categories, selectedVehicle]);

  const selectedFuelType = React.useMemo(() => {
    if (!selectedVehicle) return null;
    return fuelTypes.find(f => f.id === selectedVehicle.fuel_type_id);
  }, [fuelTypes, selectedVehicle]);

  // Auto-fill when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      if (!companyId) {
        setCompanyId(selectedVehicle.company_id);
      }
      setPreviousMeter(selectedVehicle.current_odometer || 0);
    }
  }, [selectedVehicle]);

  // Set default pump / tanker
  useEffect(() => {
    if (pumps.length > 0 && !pumpId) {
      setPumpId(pumps[0].id);
    }
    if (tankers.length > 0 && !tankerId) {
      setTankerId(tankers[0].id);
    }
  }, [pumps, tankers, pumpId, tankerId]);

  // Live Calculations
  const currentMeterNum = parseFloat(currentMeter) || 0;
  const fuelLitersNum = parseFloat(fuelLiters) || 0;
  const unitRate = selectedFuelType ? selectedFuelType.current_price : 108.50;

  const distanceOrHours = Math.max(0, currentMeterNum - previousMeter);
  const totalAmount = Math.round(fuelLitersNum * unitRate * 100) / 100;

  const isLph = selectedCategory?.metric_type === 'lph';

  // Mileage calculation
  let calculatedMileage = 0;
  let isSevereAnomaly = false;
  let percentDiff = 0;

  if (fuelLitersNum > 0 && distanceOrHours > 0) {
    if (isLph) {
      // Liters per Hour
      calculatedMileage = Math.round((fuelLitersNum / distanceOrHours) * 100) / 100;
      const benchmark = selectedVehicle?.expected_benchmark || 15.0;
      percentDiff = Math.round(((calculatedMileage - benchmark) / benchmark) * 100);
      if (percentDiff > 25) {
        isSevereAnomaly = true;
      }
    } else {
      // Kilometers per Liter
      calculatedMileage = Math.round((distanceOrHours / fuelLitersNum) * 100) / 100;
      const benchmark = selectedVehicle?.expected_benchmark || 8.0;
      percentDiff = Math.round(((calculatedMileage - benchmark) / benchmark) * 100);
      if (percentDiff < -20) {
        isSevereAnomaly = true;
      }
    }
  }

  // Handle receipt image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!vehicleId) {
      setStatusMessage({ type: 'error', text: 'Please select a vehicle.' });
      return;
    }

    if (currentMeterNum <= previousMeter) {
      setStatusMessage({
        type: 'error',
        text: `Current meter reading (${currentMeterNum}) must be greater than previous meter (${previousMeter}).`
      });
      return;
    }

    if (fuelLitersNum <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid fuel quantity in liters.' });
      return;
    }

    const res = addFuelEntry({
      vehicle_id: vehicleId,
      company_id: companyId || selectedVehicle?.company_id || '',
      entry_date: entryDate,
      slip_no: slipNo,
      source_type: sourceType,
      pump_id: sourceType === 'pump' ? pumpId : undefined,
      tanker_id: sourceType === 'tanker' ? tankerId : undefined,
      previous_meter: previousMeter,
      current_meter: currentMeterNum,
      fuel_liters: fuelLitersNum,
      receipt_image_url: receiptImage || undefined,
      notes
    });

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: res.isAnomaly ? t.successAnomalyMsg : t.successNormalMsg
      });

      // Reset form
      setSlipNo(`SLIP-${Math.floor(10000 + Math.random() * 90000)}`);
      setCurrentMeter('');
      setFuelLiters('');
      setReceiptImage('');
      setNotes('');

      if (onSuccess) {
        setTimeout(onSuccess, 1200);
      }
    } else {
      setStatusMessage({ type: 'error', text: res.message || t.failedMessage });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
            <Fuel className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-tight">{t.title}</h2>
            <p className="text-xs text-amber-100">{t.subtitle}</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-amber-700/40 px-3 py-1.5 rounded-lg text-xs font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>{entryDate}</span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mx-6 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Step 3.1: Company & Vehicle Dynamic Cascading Select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. {t.companySelect}
            </label>
            <select
              value={companyId}
              onChange={e => {
                setCompanyId(e.target.value);
                setVehicleId('');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
            >
              <option value="">{t.allCompanies}</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. {t.vehicleSelect} <span className="text-red-500">*</span>
            </label>
            <select
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold text-slate-800"
            >
              <option value="">{t.allVehicles}</option>
              {availableVehicles.map((v, idx) => (
                <option key={v.id ? `${v.id}_${idx}` : `v_${idx}`} value={v.id}>
                  {v.vehicle_number} — {v.driver_name} ({v.ownership.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Vehicle Auto-Loaded Parameters Card */}
        {selectedVehicle && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">{t.category}</span>
              <span className="font-bold text-slate-800">{selectedCategory?.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">{t.fuelTypeAndRate}</span>
              <span className="font-bold text-amber-900">
                {selectedFuelType?.name} ({unitRate} BDT /{selectedFuelType?.unit})
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">{t.standardBenchmark}</span>
              <span className="font-bold text-slate-800">
                {selectedVehicle.expected_benchmark} {isLph ? 'L/Hr' : 'KM/L'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">{t.previousReading}</span>
              <span className="font-mono font-bold text-blue-700">
                {previousMeter.toLocaleString()} {isLph ? 'Hrs' : 'KM'}
              </span>
            </div>
          </div>
        )}

        {/* Fuel Source Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              3. {t.fuelSource}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceType('pump')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  sourceType === 'pump'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {t.pumpCredit}
              </button>
              <button
                type="button"
                onClick={() => setSourceType('tanker')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  sourceType === 'tanker'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {t.tankerDirect}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {sourceType === 'pump' ? t.selectPump : t.selectTanker}
            </label>
            {sourceType === 'pump' ? (
              <select
                value={pumpId}
                onChange={e => setPumpId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {pumps.map(p => {
                  const bal = p.current_balance || 0;
                  const balText = bal >= 0 ? `${t.dueLabel}: ${bal.toLocaleString()} BDT ` : `Advance: BDT ${Math.abs(bal).toLocaleString()}`;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({balText})
                    </option>
                  );
                })}
              </select>
            ) : (
              <select
                value={tankerId}
                onChange={e => setTankerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {tankers.map(tItem => (
                  <option key={tItem.id} value={tItem.id}>
                    {tItem.tanker_name} ({t.stockLabel}: {tItem.current_stock_liters} L)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Date & Slip Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.entryDate}
            </label>
            <input
              type="date"
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.slipNo}
            </label>
            <input
              type="text"
              value={slipNo}
              onChange={e => setSlipNo(e.target.value)}
              placeholder="e.g. SLIP-99014"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Step 3.2: Meter Reading & Fuel Liter Inputs */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-bold text-slate-900 mb-3 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-amber-600" />
            <span>{t.smartCalcHeading}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {t.prevMeter} ({isLph ? 'Hours' : 'KM'})
              </label>
              <input
                type="number"
                value={previousMeter}
                onChange={e => setPreviousMeter(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-slate-100 font-mono font-bold text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                {t.currMeter} ({isLph ? 'Hours' : 'KM'}) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={currentMeter}
                onChange={e => setCurrentMeter(e.target.value)}
                placeholder={previousMeter ? `>${previousMeter}` : 'e.g. 142850'}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                {t.liters} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={fuelLiters}
                onChange={e => setFuelLiters(e.target.value)}
                placeholder="e.g. 95.5"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Real-time Dynamic Results Display */}
          {distanceOrHours > 0 && fuelLitersNum > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/80">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">{t.distance}</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">
                    {distanceOrHours.toLocaleString()} {isLph ? 'Hrs' : 'KM'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">{t.totalAmount}</span>
                  <span className="text-sm font-extrabold text-amber-600 font-mono">
                    BDT {totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isSevereAnomaly 
                    ? 'bg-red-50 border-red-300 text-red-900 animate-pulse' 
                    : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">{t.calcMileage}</span>
                  <span className={`text-sm font-extrabold font-mono ${isSevereAnomaly ? 'text-red-700' : 'text-emerald-700'}`}>
                    {calculatedMileage} {isLph ? 'L/Hr' : 'KM/L'}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">{t.benchmark}</span>
                  <span className="text-sm font-extrabold text-slate-700 font-mono">
                    {selectedVehicle?.expected_benchmark || '--'} {isLph ? 'L/Hr' : 'KM/L'}
                  </span>
                </div>
              </div>

              {/* Anomaly Real-Time Alert Banner */}
              {isSevereAnomaly && (
                <div className="mt-3 p-3 rounded-xl bg-red-100 border border-red-300 text-red-900 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {t.anomalyWarning} ({percentDiff}% {t.deviationLabel})
                    </span>
                    <span className="text-[11px] text-red-700">
                      {t.anomalyDetailText
                        .replace('{benchmark}', `${selectedVehicle?.expected_benchmark}`)
                        .replace('{calculated}', `${calculatedMileage}`)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 3.3: Receipt Attachment & Remarks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.receiptUpload}
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/50 text-xs font-medium text-slate-600 transition-colors w-full">
                <UploadCloud className="w-4 h-4 text-amber-600" />
                <span>{t.chooseFileText}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {receiptImage && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                  <img
                    src={receiptImage}
                    alt="Receipt preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t.notes}
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="pt-2 flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              id="cancel-fuel-entry-btn"
              onClick={onCancel}
              className="py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            id="save-fuel-entry-btn"
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{t.submitBtn}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
