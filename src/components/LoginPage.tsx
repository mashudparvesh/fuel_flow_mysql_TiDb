import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Crown,
  Building2,
  Lock,
  User,
  ShieldCheck,
  Fuel,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Truck,
  Sun,
  Moon,
  Globe,
  Search,
  ChevronsUpDown,
  Check,
  X,
  RefreshCw
} from 'lucide-react';

interface LoginPageProps {
  initialTab?: 'subscriber' | 'control';
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialTab = 'subscriber', onBackToLanding }) => {
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    allTenants,
    activeTenants,
    tenantSuspensionNotice,
    clearTenantSuspensionNotice,
    refreshTenantsFromServer,
    allUsers,
    saasOwner,
    loginAsCompanyUser,
    loginAsSaasOwner,
    loginAsModerator
  } = useApp();

  const [activeTab, setActiveTab] = useState<'subscriber' | 'control'>(initialTab);

  // Subscriber Login State
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    return activeTenants[0]?.id || 'tenant_1';
  });
  const [selectedTenantCode, setSelectedTenantCode] = useState<string>(() => {
    return activeTenants[0]?.code || 'PMFS';
  });

  // Searchable Company Combobox state (ISSUE 3 Fix)
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [companySearchQuery, setCompanySearchQuery] = useState('');
  const [isRefreshingCompanies, setIsRefreshingCompanies] = useState(false);
  const companyComboboxRef = useRef<HTMLDivElement>(null);

  // Sync selected tenant when activeTenants updates from server
  useEffect(() => {
    if (activeTenants.length > 0) {
      const exists = activeTenants.find(t => t.id === selectedTenantId || t.code === selectedTenantCode);
      if (!exists) {
        setSelectedTenantId(activeTenants[0].id);
        setSelectedTenantCode(activeTenants[0].code);
      }
    }
  }, [activeTenants, selectedTenantId, selectedTenantCode]);

  // Handle outside click for combobox
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (companyComboboxRef.current && !companyComboboxRef.current.contains(e.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered active companies for searchable combobox
  const filteredCompanies = useMemo(() => {
    if (!companySearchQuery.trim()) return activeTenants;
    const q = companySearchQuery.toLowerCase().trim();
    return activeTenants.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.address && t.address.toLowerCase().includes(q))
    );
  }, [activeTenants, companySearchQuery]);

  const selectedTenant = useMemo(() => {
    return activeTenants.find(t => t.id === selectedTenantId) ||
      activeTenants.find(t => t.code === selectedTenantCode) ||
      activeTenants[0] || null;
  }, [activeTenants, selectedTenantId, selectedTenantCode]);

  const handleManualRefreshCompanies = async () => {
    setIsRefreshingCompanies(true);
    await refreshTenantsFromServer();
    setTimeout(() => setIsRefreshingCompanies(false), 500);
  };

  const [subscriberUsername, setSubscriberUsername] = useState('');
  const [subscriberPassword, setSubscriberPassword] = useState('');
  const [showSubscriberPassword, setShowSubscriberPassword] = useState(false);
  const [subscriberError, setSubscriberError] = useState('');
  const [subscriberSuccess, setSubscriberSuccess] = useState('');
  const [isSubscriberLoading, setIsSubscriberLoading] = useState(false);

  // Control Login State (SaaS Owner & Moderators)
  const [controlUsername, setControlUsername] = useState('');
  const [controlPassword, setControlPassword] = useState('');
  const [showControlPassword, setShowControlPassword] = useState(false);
  const [controlError, setControlError] = useState('');
  const [controlSuccess, setControlSuccess] = useState('');
  const [isControlLoading, setIsControlLoading] = useState(false);

  // Submit Subscriber Login
  const handleSubscriberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscriberError('');
    setSubscriberSuccess('');

    if (!selectedTenant) {
      setSubscriberError('Please select a company.');
      return;
    }

    if (!subscriberUsername.trim() || !subscriberPassword.trim()) {
      setSubscriberError('Please enter Username and Password.');
      return;
    }

    setIsSubscriberLoading(true);
    setTimeout(() => {
      const res = loginAsCompanyUser(selectedTenant.id, subscriberUsername.trim(), subscriberPassword.trim());
      setIsSubscriberLoading(false);
      if (!res.success) {
        setSubscriberError(res.message);
      } else {
        setSubscriberSuccess(res.message);
      }
    }, 200);
  };

  // Submit Control Login (SaaS Owner & Moderator)
  const handleControlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setControlError('');
    setControlSuccess('');

    if (!controlUsername.trim() || !controlPassword.trim()) {
      setControlError('Please provide Master Username and Password.');
      return;
    }

    setIsControlLoading(true);
    setTimeout(() => {
      // First test SaaS Owner
      const ownerRes = loginAsSaasOwner(controlUsername.trim(), controlPassword.trim());
      if (ownerRes.success) {
        setIsControlLoading(false);
        setControlSuccess(ownerRes.message);
        return;
      }

      // If not owner, test Moderator
      const modRes = loginAsModerator(controlUsername.trim(), controlPassword.trim());
      setIsControlLoading(false);
      if (modRes.success) {
        setControlSuccess(modRes.message);
      } else {
        setControlError('Invalid Master Credentials! Please provide correct username and password.');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background Ambience / Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full px-4 sm:px-8 py-4 flex items-center justify-between z-10 border-b border-slate-800/80 backdrop-blur-md bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Fuel className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">FuelNest</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                fuelnest.xyz
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multi-Company Fleet & Fuel Platform
            </p>
          </div>
        </div>

        {/* Top Right Utilities */}
        <div className="flex items-center gap-2">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
          )}

          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-all"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-blue-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-4">
        <div className="w-full max-w-xl">
          {/* Dual Tab Header Bar */}
          <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6 shadow-2xl backdrop-blur-md">
            {/* Tab 1: Subscriber Login */}
            <button
              type="button"
              onClick={() => setActiveTab('subscriber')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === 'subscriber'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Subscriber Login</span>
            </button>

            {/* Tab 2: Control Login */}
            <button
              type="button"
              onClick={() => setActiveTab('control')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all ${
                activeTab === 'control'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 font-black'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900/60'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>Control Login (SaaS)</span>
            </button>
          </div>

          {/* TAB 1: SUBSCRIBER FLEET LOGIN */}
          {activeTab === 'subscriber' && (
            <div className="rounded-3xl bg-slate-950/90 border border-slate-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-opacity duration-150">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Company Fleet Portal</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Subscriber Company Login
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Sign in with your company Super Admin, Supervisor, or Operator credentials.
                </p>
              </div>

              {/* Suspension Alert Notice (ISSUE 2 Fix) */}
              {tenantSuspensionNotice && (
                <div className="mb-5 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                    <span className="font-semibold">{tenantSuspensionNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearTenantSuspensionNotice}
                    className="p-1 rounded-md text-amber-400 hover:text-amber-200 hover:bg-amber-500/20 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {subscriberError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{subscriberError}</span>
                </div>
              )}

              {subscriberSuccess && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{subscriberSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubscriberSubmit} className="space-y-4">
                {/* Searchable Company Combobox / Autocomplete (ISSUE 3 Fix) */}
                <div ref={companyComboboxRef} className="relative">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Select Company / Subscriber
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {activeTenants.length} Active
                      </span>
                      <button
                        type="button"
                        onClick={handleManualRefreshCompanies}
                        title="Refresh company list from server"
                        className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCompanies ? 'animate-spin text-blue-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Hidden form input for strict tenant submission */}
                  <input type="hidden" name="tenant_id" value={selectedTenant?.id || ''} />

                  {/* Combobox Trigger */}
                  <div
                    onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900/90 text-white hover:border-slate-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <Building2 className="w-4 h-4 text-blue-400 absolute left-3.5 top-9 sm:top-9" />
                    <div className="truncate flex items-center gap-2">
                      {selectedTenant ? (
                        <>
                          <span className="font-semibold text-slate-100 truncate">{selectedTenant.name}</span>
                          <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider shrink-0">
                            {selectedTenant.code}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">
                          Select company...
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>

                  {/* Dropdown Menu Popup with Autocomplete Filter */}
                  {isCompanyDropdownOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in duration-150">
                      {/* Search Filter Input */}
                      <div className="p-2 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-10 flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-slate-400 ml-1.5 shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search by company name or code..."
                          value={companySearchQuery}
                          onChange={e => setCompanySearchQuery(e.target.value)}
                          className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-hidden py-1"
                        />
                        {companySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCompanySearchQuery('')}
                            className="p-1 text-slate-500 hover:text-slate-300 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Filtered Active Companies List */}
                      <div className="max-h-56 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-800/40">
                        {filteredCompanies.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            No active companies match "{companySearchQuery}".
                          </div>
                        ) : (
                          filteredCompanies.map(tenant => {
                            const isSelected = selectedTenant?.id === tenant.id;
                            return (
                              <button
                                key={tenant.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTenantId(tenant.id);
                                  setSelectedTenantCode(tenant.code);
                                  setIsCompanyDropdownOpen(false);
                                  setCompanySearchQuery('');
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600/20 text-white border border-blue-500/40'
                                    : 'hover:bg-slate-800/80 text-slate-300'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-100 truncate">{tenant.name}</span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-800 text-blue-400 border border-slate-700 uppercase">
                                      {tenant.code}
                                    </span>
                                  </div>
                                  {tenant.address && (
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{tenant.address}</p>
                                  )}
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. padma_admin, tariqul_fleet, etc."
                      value={subscriberUsername}
                      onChange={e => setSubscriberUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900/90 text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showSubscriberPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={subscriberPassword}
                      onChange={e => setSubscriberPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-900/90 text-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSubscriberPassword(!showSubscriberPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showSubscriberPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubscriberLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubscriberLoading ? (
                    <span>Signing in...</span>
                  ) : (
                    <>
                      <span>Sign In to Fleet Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: CONTROL LOGIN (SAAS OWNER & MODERATOR) */}
          {activeTab === 'control' && (
            <div className="rounded-3xl bg-slate-950/95 border border-amber-500/30 p-6 sm:p-8 shadow-2xl shadow-amber-500/10 backdrop-blur-xl transition-opacity duration-150">
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>SaaS Owner & Moderator Control</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Master Control Login
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Exclusively for Platform Owner and authorized moderators. Subscribers do not have access here.
                </p>
              </div>

              {controlError && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{controlError}</span>
                </div>
              )}

              {controlSuccess && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{controlSuccess}</span>
                </div>
              )}

              <form onSubmit={handleControlSubmit} className="space-y-4">
                {/* Master Username */}
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1.5">
                    Master Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-amber-500/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="master_admin"
                      value={controlUsername}
                      onChange={e => setControlUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-amber-500/40 bg-slate-900 text-white focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Master Password */}
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1.5">
                    Master Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-amber-500/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showControlPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={controlPassword}
                      onChange={e => setControlPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-amber-500/40 bg-slate-900 text-white focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowControlPassword(!showControlPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400/60 hover:text-amber-400"
                    >
                      {showControlPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isControlLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isControlLoading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Access Master Control Panel</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-800/60 z-10">
        <span>FuelNest SaaS Multi-Tenant Cloud Architecture • fuelnest.xyz • 100% Isolated Databases & RBAC</span>
      </footer>
    </div>
  );
};
