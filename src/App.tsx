import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { FuelEntryForm } from './components/FuelEntryForm';
import { VehiclesView } from './components/VehiclesView';
import { PumpCreditView } from './components/PumpCreditView';
import { TankerBowzerView } from './components/TankerBowzerView';
import { AnomaliesView } from './components/AnomaliesView';
import { MasterDataView } from './components/MasterDataView';
import { ReportsView } from './components/ReportsView';
import { QuickScannerModal } from './components/QuickScannerModal';
import { SaasOwnerPanel } from './components/SaasOwnerPanel';
import { CompanyUserManagementView } from './components/CompanyUserManagementView';
import { AuthSwitcherModal } from './components/AuthSwitcherModal';
import { LoginPage } from './components/LoginPage';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { Fuel, QrCode, PanelLeftOpen } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    isAuthenticated,
    language,
    currentUser,
    activeAuthRole,
    isSaasControlOpen,
    setIsSaasControlOpen
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'super_admin' || activeAuthRole === 'saas_owner';
  const isViewer = currentUser?.role === 'client_viewer';

  const [currentView, setCurrentView] = useState<
    'dashboard' | 'fuel_entry' | 'vehicles' | 'pumps' | 'pump_credit' | 'tankers' | 'tanker_bowzer' | 'anomalies' | 'master_data' | 'reports' | 'saas_owner_panel' | 'company_users'
  >('dashboard');

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('fuelflow_sidebar_open');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const next = !prev;
      try {
        localStorage.setItem('fuelflow_sidebar_open', String(next));
      } catch (e) {}
      return next;
    });
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    try {
      localStorage.setItem('fuelflow_sidebar_open', 'false');
    } catch (e) {}
  };

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAuthSwitcherOpen, setIsAuthSwitcherOpen] = useState(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [selectedVehicleForEntry, setSelectedVehicleForEntry] = useState<string | undefined>(undefined);

  const handleOpenFuelEntryWithVehicle = (vehicleId?: string) => {
    if (isViewer) return;
    setSelectedVehicleForEntry(vehicleId);
    setCurrentView('fuel_entry');
  };

  const handleScannedVehicle = (vehicleId: string) => {
    if (isViewer) return;
    setSelectedVehicleForEntry(vehicleId);
    setCurrentView('fuel_entry');
  };

  // If user is not authenticated, show LoginPage
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060b18] text-slate-900 dark:text-slate-100 flex flex-col antialiased w-full overflow-x-hidden">
      {/* Top Header */}
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onOpenFuelEntry={() => handleOpenFuelEntryWithVehicle()}
        onOpenScanner={() => setIsScannerOpen(true)}
        onNavigateToAnomalies={() => setCurrentView('anomalies')}
        onOpenAuthSwitcher={() => setIsAuthSwitcherOpen(true)}
        onOpenDatabase={() => setIsDbModalOpen(true)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex w-full px-2.5 sm:px-4 lg:px-6 py-3 sm:py-4 gap-3 sm:gap-5 relative">
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => {
            setCurrentView(view as any);
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              closeSidebar();
            }
          }}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />

        {/* Desktop Quick Reopen Floating Tab when Sidebar is Hidden */}
        {!isSidebarOpen && (
          <button
            id="desktop-reopen-sidebar-btn"
            onClick={() => {
              setIsSidebarOpen(true);
              try {
                localStorage.setItem('fuelflow_sidebar_open', 'true');
              } catch (e) {}
            }}
            className="hidden md:flex fixed left-0 top-20 z-30 items-center gap-1.5 px-3 py-2 rounded-r-xl bg-slate-900 text-amber-400 shadow-xl border-y border-r border-slate-700 hover:bg-slate-800 transition-all font-bold text-xs group"
            title="Open Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-white">Menu</span>
          </button>
        )}

        {/* View Routing Area */}
        <main className="flex-1 min-w-0 pb-16 w-full">
          <div className="w-full transition-opacity duration-200 ease-out">
            {/* If SaaS control panel mode is toggled by SaaS Owner/Moderator, show SaasOwnerPanel */}
            {isSaasControlOpen && (activeAuthRole === 'saas_owner' || activeAuthRole === 'saas_moderator') ? (
              <SaasOwnerPanel onSwitchToFleetView={() => setIsSaasControlOpen(false)} />
            ) : (
              <>
                {currentView === 'dashboard' && (
                  <DashboardView
                    onOpenFuelEntry={() => handleOpenFuelEntryWithVehicle()}
                    onNavigateToAnomalies={() => setCurrentView('anomalies')}
                    onNavigateToPumpCredit={() => setCurrentView('pumps')}
                    onNavigateToTanker={() => setCurrentView('tankers')}
                    onSelectVehicleForEntry={handleOpenFuelEntryWithVehicle}
                  />
                )}

                {currentView === 'saas_owner_panel' && (activeAuthRole === 'saas_owner' || activeAuthRole === 'saas_moderator') && (
                  <SaasOwnerPanel onSwitchToFleetView={() => setCurrentView('dashboard')} />
                )}

                {currentView === 'company_users' && isSuperAdmin && (
                  <CompanyUserManagementView />
                )}

                {currentView === 'fuel_entry' && !isViewer && (
                  <FuelEntryForm
                    initialVehicleId={selectedVehicleForEntry}
                    onSuccess={() => {
                      setCurrentView('dashboard');
                    }}
                    onCancel={() => setCurrentView('dashboard')}
                  />
                )}

                {currentView === 'vehicles' && (
                  <VehiclesView
                    onSelectVehicleForEntry={handleOpenFuelEntryWithVehicle}
                  />
                )}

                {(currentView === 'pumps' || currentView === 'pump_credit') && <PumpCreditView />}

                {(currentView === 'tankers' || currentView === 'tanker_bowzer') && <TankerBowzerView />}

                {currentView === 'anomalies' && <AnomaliesView />}

                {currentView === 'master_data' && <MasterDataView />}

                {currentView === 'reports' && <ReportsView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Button for Quick Fuel Entry on Mobile (Hidden for Viewer) */}
      {!isViewer && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 sm:hidden">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-3 rounded-2xl bg-slate-900 text-amber-400 shadow-xl border border-slate-800"
            title="QR Scanner"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleOpenFuelEntryWithVehicle()}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 text-white font-bold text-xs shadow-xl shadow-amber-500/20"
          >
            <Fuel className="w-5 h-5" />
            <span>Fuel Entry</span>
          </button>
        </div>
      )}

      {/* Global Application Footer */}
      <Footer />

      {/* Quick QR Scanner Modal */}
      <QuickScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectVehicle={handleScannedVehicle}
      />

      {/* Role & Auth Switcher Modal */}
      <AuthSwitcherModal
        isOpen={isAuthSwitcherOpen}
        onClose={() => setIsAuthSwitcherOpen(false)}
      />

      {/* Database Status & MySQL Modal */}
      <DatabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
