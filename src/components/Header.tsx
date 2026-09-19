import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Fuel,
  Building,
  UserCheck,
  Globe,
  Bell,
  PlusCircle,
  RefreshCw,
  QrCode,
  ShieldAlert,
  Sun,
  Moon,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Crown,
  Shield,
  LayoutDashboard,
  LogOut,
  Database
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onOpenFuelEntry?: () => void;
  onOpenScanner?: () => void;
  onOpenQuickEntry?: () => void;
  onOpenQrScanner?: () => void;
  onNavigateToAnomalies?: () => void;
  onOpenAuthSwitcher?: () => void;
  onOpenDatabase?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen = true,
  onOpenFuelEntry,
  onOpenScanner,
  onOpenQuickEntry,
  onOpenQrScanner,
  onNavigateToAnomalies,
  onOpenAuthSwitcher,
  onOpenDatabase
}) => {
  const {
    theme,
    setTheme,
    language,
    setLanguage,
    currentTenant,
    setCurrentTenantId,
    allTenants,
    currentUser,
    setCurrentUserId,
    allUsers,
    kpis,
    resetToDefaultData,
    activeAuthRole,
    activeModerator,
    saasOwner,
    isSaasControlOpen,
    setIsSaasControlOpen,
    logout
  } = useApp();

  const handleQuickEntry = onOpenQuickEntry || onOpenFuelEntry;
  const handleQrScanner = onOpenQrScanner || onOpenScanner;

  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const t = {
    appName: 'FuelNest',
    tagline: 'Fleet & Fuel Intelligence • fuelnest.xyz',
    quickEntry: 'New Fuel Entry',
    scanQr: 'QR Scan',
    schemaBtn: 'Laravel Schema',
    resetData: 'Reset Demo Data',
    switchTenant: 'Switch Tenant (SaaS)',
    switchUser: 'Switch User',
    switchAuth: 'Switch Role / Login',
    tenantBadge: 'Tenant',
    roleBadge: 'Role',
    anomalies: 'Anomaly Alerts',
    saasControlBtn: 'SaaS Control Panel',
    fleetViewBtn: 'Go to Fleet View'
  };

  const isViewer = currentUser?.role === 'client_viewer';

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-[#0b1329] border-b border-slate-200 dark:border-blue-900/60 shadow-xs px-4 py-2.5 sm:px-6 transition-colors print:hidden">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              id="sidebar-toggle-btn"
              onClick={onToggleSidebar}
              className={`flex items-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                isSidebarOpen
                  ? 'border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 hover:bg-amber-100/90'
                  : 'border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#0f1b3d] hover:bg-slate-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200'
              }`}
              title={
                isSidebarOpen
                  ? 'Hide Sidebar'
                  : 'Show Sidebar'
              }
              aria-label="Toggle Sidebar"
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              ) : (
                <PanelLeftOpen className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              )}
              <span className="hidden xl:inline">
                {isSidebarOpen ? 'Hide' : 'Menu'}
              </span>
            </button>
          )}
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500 text-white shadow-xs">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {t.appName}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30">
                SaaS v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct SaaS Owner / Moderator Control Panel Switch Button */}
          {(activeAuthRole === 'saas_owner' || activeAuthRole === 'saas_moderator') && (
            <button
              id="saas-view-toggle-header-btn"
              onClick={() => setIsSaasControlOpen(!isSaasControlOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-xs border ${
                isSaasControlOpen
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-blue-500/20'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 font-black shadow-amber-400/20'
              }`}
              title={isSaasControlOpen ? t.fleetViewBtn : t.saasControlBtn}
            >
              {isSaasControlOpen ? (
                <>
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden md:inline">{t.fleetViewBtn}</span>
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  <span className="hidden md:inline">{t.saasControlBtn}</span>
                </>
              )}
            </button>
          )}

          {/* SaaS Authentication / Role Switcher Pill - ONLY visible for SaaS Owner & Moderator */}
          {onOpenAuthSwitcher && (activeAuthRole === 'saas_owner' || activeAuthRole === 'saas_moderator') && (
            <button
              id="header-auth-switcher-btn"
              onClick={onOpenAuthSwitcher}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-[#0f1b3d] hover:bg-slate-100 dark:hover:bg-blue-900/40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              title={t.switchAuth}
            >
              {activeAuthRole === 'saas_owner' ? (
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span className="hidden sm:inline font-bold">
                {activeAuthRole === 'saas_owner'
                  ? saasOwner.username
                  : activeModerator?.name || 'Moderator'}
              </span>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-slate-200 dark:bg-blue-900/60 text-slate-800 dark:text-amber-300 hidden lg:inline">
                {activeAuthRole === 'saas_owner' ? 'Owner' : 'Mod'}
              </span>
            </button>
          )}

          {/* Logout Button */}
          <button
            id="header-logout-btn"
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold text-red-700 dark:text-red-300 transition-colors shadow-2xs"
            title="Logout & Return to Login"
          >
            <LogOut className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Tenant Switcher - ONLY for Owner & Moderator. Subscribers see their Company badge without switch option */}
          {(activeAuthRole === 'saas_owner' || activeAuthRole === 'saas_moderator') ? (
            <div className="relative">
              <button
                id="tenant-switcher-btn"
                onClick={() => {
                  setShowTenantMenu(!showTenantMenu);
                  setShowUserMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50/70 dark:bg-amber-400/10 hover:bg-amber-100 dark:hover:bg-amber-400/20 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                title={t.switchTenant}
              >
                <Building className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <div className="text-left hidden md:block">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 block uppercase font-bold leading-none">
                    {t.tenantBadge}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px] block">
                    {currentTenant.code}
                  </span>
                </div>
              </button>

              {showTenantMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0d1836] rounded-xl shadow-xl border border-slate-200 dark:border-blue-900/80 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.switchTenant}
                  </div>
                  {allTenants.map(ten => (
                    <button
                      key={ten.id}
                      onClick={() => {
                        setCurrentTenantId(ten.id);
                        setShowTenantMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 mb-1 ${
                        ten.id === currentTenant.id
                          ? 'bg-amber-50 dark:bg-amber-400/20 text-amber-900 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-400/30'
                          : 'hover:bg-slate-50 dark:hover:bg-[#142247] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="font-bold text-slate-900 dark:text-white">{ten.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">ID: {ten.id} • {ten.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              id="subscriber-company-pill"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/60 bg-slate-50/70 dark:bg-[#0f1b3d]/60 text-xs font-medium text-slate-700 dark:text-slate-200"
              title={`${currentTenant.name} (${currentTenant.code})`}
            >
              <Building className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <div className="text-left hidden md:block">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold leading-none">
                  {t.tenantBadge}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px] block">
                  {currentTenant.name}
                </span>
              </div>
            </div>
          )}

          {/* User & Role Badge - Dropdown ONLY for Owner & Moderator */}
          {(activeAuthRole === 'saas_owner' || activeAuthRole === 'saas_moderator') ? (
            <div className="relative">
              <button
                id="user-switcher-btn"
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowTenantMenu(false);
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/60 hover:bg-slate-50 dark:hover:bg-[#0f1b3d] text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                title={t.switchUser}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <div className="text-left hidden lg:block">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold leading-none">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px] block">
                    {currentUser.name}
                  </span>
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0d1836] rounded-xl shadow-xl border border-slate-200 dark:border-blue-900/80 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-2 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.switchUser}
                  </div>
                  {allUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUserId(u.id);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors mb-1 ${
                        u.id === currentUser.id
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-[#142247] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                        {u.role.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              id="subscriber-user-pill"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/60 bg-slate-50/70 dark:bg-[#0f1b3d]/60 text-xs font-medium text-slate-700 dark:text-slate-200"
              title={`${currentUser.name} (${currentUser.role.replace('_', ' ')})`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <div className="text-left hidden lg:block">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold leading-none">
                  {currentUser.role.replace('_', ' ')}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px] block">
                  {currentUser.name}
                </span>
              </div>
            </div>
          )}

          {/* Database Status Button */}
          {onOpenDatabase && (
            <button
              id="header-database-btn"
              onClick={onOpenDatabase}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-blue-900/60 bg-slate-50/70 dark:bg-[#0f1b3d]/60 hover:bg-slate-100 dark:hover:bg-blue-900/40 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              title="MySQL Cloud Database & Storage"
            >
              <Database className="w-4 h-4 text-amber-500" />
              <span className="hidden xl:inline">Database</span>
            </button>
          )}

          {/* Anomaly Alerts Notification Bell */}
          <button
            id="header-anomalies-bell"
            onClick={onNavigateToAnomalies}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-slate-200 dark:border-blue-900/60 transition-colors"
            title={`${kpis.anomalyCount} ${t.anomalies}`}
          >
            <Bell className="w-4 h-4" />
            {kpis.anomalyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white animate-pulse">
                {kpis.anomalyCount}
              </span>
            )}
          </button>

          {/* Dark Mode & Light Mode Radio Group */}
          <div
            id="theme-mode-radiogroup"
            className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-blue-900/60 bg-slate-100 dark:bg-[#091329] shadow-xs"
            role="radiogroup"
            aria-label="Theme Mode Selection"
          >
            {/* Light Mode Radio Option */}
            <label
              htmlFor="theme-radio-light"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer text-xs font-semibold select-none transition-all ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Select Light Mode"
            >
              <input
                type="radio"
                id="theme-radio-light"
                name="theme-selection"
                value="light"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
                className="w-3.5 h-3.5 text-amber-500 border-slate-300 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="inline">Light</span>
            </label>

            {/* Dark Mode Radio Option */}
            <label
              htmlFor="theme-radio-dark"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md cursor-pointer text-xs font-semibold select-none transition-all ${
                theme === 'dark'
                  ? 'bg-amber-400 text-slate-950 shadow-xs border border-amber-300 font-black'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-amber-300'
              }`}
              title="Select Dark Mode"
            >
              <input
                type="radio"
                id="theme-radio-dark"
                name="theme-selection"
                value="dark"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
                className="w-3.5 h-3.5 text-amber-500 border-slate-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-slate-950 font-bold' : 'text-slate-400'}`} />
              <span className="inline">Dark</span>
            </label>
          </div>

          {/* QR Scanner Quick Button */}
          {handleQrScanner && !isViewer && (
            <button
              id="quick-qr-scanner-btn"
              onClick={handleQrScanner}
              className="p-2 rounded-lg border border-slate-200 dark:border-blue-900/60 hover:bg-slate-100 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
              title={t.scanQr}
            >
              <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          )}

          {/* Quick Fuel Entry CTA Button */}
          {handleQuickEntry && !isViewer && (
            <button
              id="quick-fuel-entry-cta"
              onClick={handleQuickEntry}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-xs transition-all hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{t.quickEntry}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
