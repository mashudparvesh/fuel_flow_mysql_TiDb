import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Fuel,
  Truck,
  Database,
  CreditCard,
  Container,
  AlertTriangle,
  FileSpreadsheet,
  Code2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  PanelLeftClose,
  Crown,
  Users,
  LogOut
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'fuel_entry'
  | 'vehicles'
  | 'master_data'
  | 'pump_credit'
  | 'tanker_bowzer'
  | 'anomalies'
  | 'reports'
  | 'company_users';

interface SidebarProps {
  currentTab?: NavTab | string;
  currentView?: string;
  onSelectTab?: (tab: NavTab) => void;
  onNavigate?: (tab: any) => void;
  isMobileOpen?: boolean;
  isOpen?: boolean;
  onCloseMobile?: () => void;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  currentView,
  onSelectTab,
  onNavigate,
  isMobileOpen,
  isOpen,
  onCloseMobile,
  onClose
}) => {
  // Normalize currentView if it was 'pumps' or 'tankers'
  const normalizedView = currentView === 'pumps' ? 'pump_credit' : currentView === 'tankers' ? 'tanker_bowzer' : currentView;
  const activeTab = currentTab || (normalizedView as NavTab) || 'dashboard';

  const handleSelect = (tab: NavTab) => {
    if (onSelectTab) onSelectTab(tab);
    if (onNavigate) onNavigate(tab);
  };
  const mobileOpen = isMobileOpen ?? isOpen ?? false;
  const handleClose = () => {
    if (onCloseMobile) onCloseMobile();
    if (onClose) onClose();
  };
  const { language, kpis, currentUser, currentTenant, activeAuthRole, saasOwner, logout } = useApp();

  const labels = {
    dashboard: 'Dashboard & Analytics',
    fuel_entry: 'Ultra-Fast Fuel Entry',
    vehicles: 'Vehicles & Equipment',
    master_data: 'Master Data Setup',
    pump_credit: 'Pump Credit & Ledger',
    tanker_bowzer: 'Internal Bowzer Stock',
    anomalies: 'Fuel Loss & Anomalies',
    reports: 'Reports & Export (PDF/Excel)',
    blueprint: 'Laravel Migration Schema',
    saas_panel: 'SaaS Control Panel (Owner)',
    company_users: 'Users & Category Access',
    systemActive: 'System Active',
    currentTenant: 'Current Tenant',
    role: 'User Role',
    navigationMenu: 'Menu Navigation',
    hideSidebar: 'Hide Sidebar'
  };

  const isSuperAdmin = currentUser?.role === 'super_admin' || activeAuthRole === 'saas_owner';
  const isViewer = currentUser?.role === 'client_viewer';

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
    highlight?: boolean;
    section?: 'main' | 'admin';
  }[] = [
    {
      id: 'dashboard',
      label: labels.dashboard,
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    ...(!isViewer
      ? [
          {
            id: 'fuel_entry' as NavTab,
            label: labels.fuel_entry,
            icon: <Fuel className="w-5 h-5" />,
            highlight: true
          }
        ]
      : []),
    {
      id: 'vehicles',
      label: labels.vehicles,
      icon: <Truck className="w-5 h-5" />,
      badge: kpis.activeVehiclesCount,
      badgeColor: 'bg-slate-200 text-slate-700'
    },
    {
      id: 'pump_credit',
      label: labels.pump_credit,
      icon: <CreditCard className="w-5 h-5" />,
      badge: `${(kpis.totalPumpOutstanding / 1000).toFixed(0)}k`,
      badgeColor: 'bg-amber-100 text-amber-800'
    },
    {
      id: 'tanker_bowzer',
      label: labels.tanker_bowzer,
      icon: <Container className="w-5 h-5" />
    },
    {
      id: 'master_data',
      label: labels.master_data,
      icon: <Database className="w-5 h-5" />
    },
    {
      id: 'anomalies',
      label: labels.anomalies,
      icon: <AlertTriangle className="w-5 h-5" />,
      badge: kpis.anomalyCount > 0 ? kpis.anomalyCount : undefined,
      badgeColor: 'bg-red-500 text-white animate-pulse'
    },
    {
      id: 'reports',
      label: labels.reports,
      icon: <FileSpreadsheet className="w-5 h-5" />
    },
    ...(isSuperAdmin
      ? [
          {
            id: 'company_users' as NavTab,
            label: labels.company_users,
            icon: <Users className="w-5 h-5" />,
            badge: 'RBAC',
            badgeColor: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
          }
        ]
      : [])
  ];

  const handleNavClick = (tab: NavTab) => {
    handleSelect(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      handleClose();
    }
  };

  if (!mobileOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop - only for small screens (< md 768px) */}
      <div
        className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-xs print:hidden"
        onClick={handleClose}
      />

      {/* Sidebar Container - always inline & sticky on desktop/tablet (>= md 768px) */}
      <aside
        className="fixed md:sticky top-0 md:top-[57px] bottom-0 left-0 z-40 w-64 shrink-0 bg-white dark:bg-[#0b1329] border-r border-slate-200 dark:border-blue-900/60 flex flex-col justify-between transition-transform duration-200 ease-in-out h-screen md:h-[calc(100vh-57px)] overflow-y-auto shadow-md md:shadow-none print:hidden"
      >
        <div className="p-3 space-y-1">
          {/* Header Controls inside Sidebar */}
          <div className="flex items-center justify-between px-1 pb-2 mb-1.5 border-b border-slate-200 dark:border-blue-900/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>{labels.navigationMenu}</span>
            </div>
            <button
              id="sidebar-inner-close-btn"
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-blue-900/40 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title={labels.hideSidebar}
              aria-label="Hide Sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* Tenant & User Status Card */}
          <div className="p-3 mb-2 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-blue-950">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="text-xs font-bold text-slate-800 dark:text-white truncate" title={currentTenant.name}>
                  {currentTenant.name}
                </div>
              </div>
              {activeAuthRole === 'saas_owner' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950 shrink-0">
                  Owner
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-blue-900/40 pt-1.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {labels.systemActive}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-slate-950 dark:font-black shadow-xs font-bold'
                        : 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 dark:font-black shadow-xs'
                      : item.highlight
                      ? 'bg-amber-50 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-400/25 border border-amber-200 dark:border-amber-400/30'
                      : 'text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#142247] hover:text-slate-900 dark:hover:text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white dark:text-slate-950' : item.highlight ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}>
                      {item.icon}
                    </span>
                    <span className="text-left leading-tight">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950'
                          : item.badgeColor || 'bg-slate-100 dark:bg-[#142247] text-slate-600 dark:text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-200 dark:border-blue-900/60 bg-slate-50/50 dark:bg-[#080e1e]/60 space-y-2">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="font-bold text-amber-500">FuelNest Engine</span>
            <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">fuelnest.xyz</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
            All DB models include <code className="text-slate-600 dark:text-slate-300 font-semibold">user_id</code> & <code className="text-slate-600 dark:text-slate-300 font-semibold">tenant_id</code>
          </p>
          <button
            id="sidebar-logout-btn"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 transition-colors shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
