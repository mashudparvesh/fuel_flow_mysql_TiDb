import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QrCode, Camera, CheckCircle2, Truck, X } from 'lucide-react';

interface QuickScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicleId: string) => void;
}

export const QuickScannerModal: React.FC<QuickScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectVehicle
}) => {
  const { vehicles, language } = useApp();
  const [isScanning, setIsScanning] = useState(true);

  const t = {
    modalTitle: 'Vehicle QR Code Scanner (Fast Site / Pump Entry)',
    cameraInstructions: 'Point camera towards the vehicle windshield QR code sticker',
    cameraStatus: '[Ready to Scan / Live Camera Detection]',
    simulateLabel: 'Or click a fleet vehicle below to simulate instant scan:',
    odometerLabel: 'Odometer:',
    selectBtn: 'Select Vehicle',
    closeBtn: 'Close'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              {t.modalTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera / Scanner Frame Simulation */}
        <div className="my-5 relative rounded-2xl overflow-hidden bg-slate-950 aspect-video flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-amber-500/50">
          {/* Scanning Animation Line */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />

          <Camera className="w-10 h-10 text-amber-400 mb-2 opacity-80" />
          <p className="text-xs text-slate-300 font-medium">
            {t.cameraInstructions}
          </p>
          <span className="text-[10px] text-amber-400/80 mt-1 font-mono">
            {t.cameraStatus}
          </span>
        </div>

        {/* Quick select simulator (Simulate scanning a real fleet vehicle sticker) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            {t.simulateLabel}
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {vehicles.map((veh, idx) => (
              <button
                key={veh.id ? `${veh.id}_${idx}` : `scan_veh_${idx}`}
                onClick={() => {
                  onSelectVehicle(veh.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900">{veh.vehicle_number}</div>
                    <div className="text-[10px] text-slate-500">{veh.driver_name} • {t.odometerLabel} {veh.current_odometer}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-600 px-2 py-0.5 rounded-md bg-amber-100">
                  {t.selectBtn}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
        >
          {t.closeBtn}
        </button>
      </div>
    </div>
  );
};
