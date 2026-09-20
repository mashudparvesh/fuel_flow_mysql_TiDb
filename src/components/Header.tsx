import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Fuel,
  Building,
  UserCheck,
  Globe,
  Bell,
  QrCode,
  ShieldAlert,
  Sun,
  Moon,
  Crown,
  Shield,
  LayoutDashboard,
  LogOut,
  Database,
  Camera
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
    updateTenantLogo,
    logout
  } = useApp();

  const handleQuickEntry = onOpenQuickEntry || onOpenFuelEntry;
  const handleQrScanner = onOpenQrScanner || onOpenScanner;

  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'company_owner' || activeAuthRole === 'saas_owner';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size should be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        updateTenantLogo(currentTenant.id, result);
      }
    };
    reader.readAsDataURL(file);
  };

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
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#090d16]/95 backdrop-blur border-b border-slate-200 dark:border-slate-800/80 shadow-xs px-3 sm:px-6 py-2.5 transition-colors print:hidden">
      <div className="flex items-center justify-between gap-3">
        {/* Left: App Brand & Company Identity with Proportional Logo */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* FuelNest App Icon & Title */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs transition-transform duration-200 hover:scale-105">
              <Fuel className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                  {t.appName}
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Fleet Management
              </p>
            </div>
          </div>

          {/* Elegant Divider */}
          <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800 hidden md:block shrink-0" />

          {/* Company Brand (Logo on Left + Company Name on Right) */}
          <div
            id="company-header-brand"
            className="flex items-center gap-2 sm:gap-2.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 px-2.5 py-1.5 rounded-xl transition-all duration-200 hover:border-amber-400/50 shadow-2xs group relative"
          >
            {/* Logo Container - Sized harmoniously to match the company name font size */}
            <div className="relative shrink-0 flex items-center justify-center">
              {currentTenant.logo ? (
                <img
                  src={currentTenant.logo}
                  alt={currentTenant.name}
                  className="h-7 w-7 sm:h-8 sm:w-8 max-w-[32px] max-h-[32px] object-contain rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-0.5 shadow-2xs"
                />
              ) : (
                <div className="w-7 h-7 sm:h-8 sm:w-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Building className="w-4 h-4" />
                </div>
              )}

              {/* Super Admin Quick Logo Upload Trigger */}
              {isSuperAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1 rounded-full shadow-xs border border-white dark:border-slate-900 transition-all duration-150 hover:scale-115 cursor-pointer"
                    title="Super Admin: Click to upload company logo"
                    aria-label="Upload Company Logo"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </>
              )}
            </div>

            {/* Company Name & Code */}
            <div className="flex flex-col text-left min-w-0 max-w-[120px] xs:max-w-[160px] sm:max-w-[220px] md:max-w-[280px]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {currentTenant.name}
                </span>
                {isSuperAdmin && (
                  <span className="hidden lg:inline-block text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-1 py-0.2 rounded border border-amber-500/30">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-medium truncate">
                ID: {currentTenant.code}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct SaaS Owner / Moderator Control Panel Switch Button */}
          {(activeAuthRole === 'saas_owner' || activeAuthRole === 'saas_moderator') && (
            <button
              id="saas-view-toggle-header-btn"
              onClick={() => setIsSaasControlOpen(!isSaasControlOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border ${
                isSaasControlOpen
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-blue-500/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 font-black shadow-amber-500/20'
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
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
              <span className="text-[10px] uppercase font-black px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-amber-300 hidden lg:inline">
                {activeAuthRole === 'saas_owner' ? 'Owner' : 'Mod'}
              </span>
            </button>
          )}

          {/* Logout Button */}
          <button
            id="header-logout-btn"
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-xs font-bold text-red-700 dark:text-red-300 transition-colors shadow-2xs"
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
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-amber-300/80 dark:border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                title={t.switchTenant}
              >
                {currentTenant.logo ? (
                  <img
                    src={currentTenant.logo}
                    alt={currentTenant.name}
                    className="h-4.5 w-auto max-w-[28px] max-h-[18px] object-contain rounded shrink-0"
                  />
                ) : (
                  <Building className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                <div className="text-left hidden md:block">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 block uppercase font-bold leading-none">
                    {t.tenantBadge}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px] block">
                    {currentTenant.code}
                  </span>
                </div>
              </button>

              {showTenantMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0d172f] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 transition-opacity duration-150">
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
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center gap-2 mb-1 ${
                        ten.id === currentTenant.id
                          ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-500/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {ten.logo ? (
                        <img src={ten.logo} alt={ten.name} className="h-4 w-auto max-w-[24px] object-contain rounded shrink-0" />
                      ) : (
                        <Building className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{ten.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">ID: {ten.id} • {ten.currency}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              id="subscriber-company-pill"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs"
              title={`${currentTenant.name} (${currentTenant.code})`}
            >
              {currentTenant.logo ? (
                <img
                  src={currentTenant.logo}
                  alt={currentTenant.name}
                  className="h-4.5 w-auto max-w-[28px] max-h-[18px] object-contain rounded shrink-0"
                />
              ) : (
                <Building className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              )}
              <div className="text-left hidden md:block">
                <span className="text-[10px] text-slate-400 block uppercase font-bold leading-none">
                  {t.tenantBadge}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px] block">
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
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/80 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors"
                title={t.switchUser}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
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
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#0d172f] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50 transition-opacity duration-150">
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
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs font-medium text-slate-700 dark:text-slate-200"
              title={`${currentUser.name} (${currentUser.role.replace('_', ' ')})`}
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
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
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
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
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-800 transition-colors"
            title={`${kpis.anomalyCount} ${t.anomalies}`}
          >
            <Bell className="w-4 h-4" />
            {kpis.anomalyCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {kpis.anomalyCount}
              </span>
            )}
          </button>

          {/* Dark Mode & Light Mode Radio Group */}
          <div
            id="theme-mode-radiogroup"
            className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#070d1d] shadow-xs"
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
                  ? 'bg-amber-500 text-slate-950 shadow-xs border border-amber-400 font-black'
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
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors"
              title={t.scanQr}
            >
              <QrCode className="w-4 h-4 text-emerald-500" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
