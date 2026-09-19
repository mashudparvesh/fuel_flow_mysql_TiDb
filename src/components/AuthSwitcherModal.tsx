import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Crown,
  ShieldCheck,
  Building2,
  Lock,
  User,
  Key,
  LogIn,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Shield,
  LogOut
} from 'lucide-react';

interface AuthSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthSwitcherModal: React.FC<AuthSwitcherModalProps> = ({ isOpen, onClose }) => {
  const {
    language,
    saasOwner,
    moderators,
    allTenants,
    allUsers,
    currentTenant,
    currentUser,
    activeAuthRole,
    activeModerator,
    loginAsSaasOwner,
    loginAsModerator,
    loginAsCompanyUser,
    setIsSaasControlOpen,
    logout
  } = useApp();

  const [authTab, setAuthTab] = useState<'owner' | 'moderator' | 'company'>('owner');

  // Owner Login State
  const [ownerUsername, setOwnerUsername] = useState(saasOwner.username);
  const [ownerPassword, setOwnerPassword] = useState(saasOwner.password);
  const [ownerError, setOwnerError] = useState('');

  // Moderator Login State
  const [modUsername, setModUsername] = useState('');
  const [modPassword, setModPassword] = useState('');
  const [modError, setModError] = useState('');

  // Company Login State
  const [selectedTenantId, setSelectedTenantId] = useState(currentTenant.id);
  const [companyUsername, setCompanyUsername] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  const [companyError, setCompanyError] = useState('');

  if (!isOpen) return null;

  // Handle Owner Login
  const handleOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerError('');
    const res = loginAsSaasOwner(ownerUsername, ownerPassword);
    if (res.success) {
      setIsSaasControlOpen(true);
      onClose();
    } else {
      setOwnerError(res.message);
    }
  };

  // Handle Moderator Login
  const handleModSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModError('');
    const res = loginAsModerator(modUsername, modPassword);
    if (res.success) {
      setIsSaasControlOpen(true);
      onClose();
    } else {
      setModError(res.message);
    }
  };

  // Handle Company User Login
  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyError('');
    const res = loginAsCompanyUser(selectedTenantId, companyUsername, companyPassword);
    if (res.success) {
      setIsSaasControlOpen(false);
      onClose();
    } else {
      setCompanyError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-slate-200 dark:border-blue-900/50 p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold">
              👑
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                System Authentication
              </h3>
              <p className="text-[11px] text-slate-500">
                Login as SaaS Owner, Moderator, or Company Admin
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Account:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              {activeAuthRole === 'saas_owner' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
              {activeAuthRole === 'saas_moderator' && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
              {activeAuthRole === 'company_user' && <Building2 className="w-3.5 h-3.5 text-blue-500" />}
              <span>{activeAuthRole === 'saas_owner' ? saasOwner.name : activeAuthRole === 'saas_moderator' ? activeModerator?.name : currentUser.name}</span>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300">
            {activeAuthRole.replace('_', ' ')}
          </span>
        </div>

        {/* Auth Role Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setAuthTab('owner')}
            className={`py-2 px-1 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
              authTab === 'owner'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span className="text-[10px]">SaaS Owner</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthTab('moderator')}
            className={`py-2 px-1 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
              authTab === 'moderator'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px]">Moderator</span>
          </button>

          <button
            type="button"
            onClick={() => setAuthTab('company')}
            className={`py-2 px-1 rounded-lg font-bold transition-all flex flex-col items-center gap-1 ${
              authTab === 'company'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-[10px]">Company User</span>
          </button>
        </div>

        {/* 1. SAAS OWNER LOGIN */}
        {authTab === 'owner' && (
          <form onSubmit={handleOwnerSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
              <span className="font-bold block mb-0.5">👑 Pre-configured Platform Owner Login:</span>
              <span>User: <strong>mashudalone</strong> | Pass: <strong>00000</strong></span>
            </div>

            {ownerError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{ownerError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Owner Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={ownerUsername}
                    onChange={e => setOwnerUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={ownerPassword}
                    onChange={e => setOwnerPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <Crown className="w-4 h-4" />
                <span>Login as Owner & Open Panel</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. MODERATOR LOGIN */}
        {authTab === 'moderator' && (
          <form onSubmit={handleModSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300">
              <span className="font-bold block mb-0.5">Moderator Login:</span>
              <span>Enter username and password configured from the Owner Panel.</span>
            </div>

            {modError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Moderator Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="mod_username"
                  value={modUsername}
                  onChange={e => setModUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={modPassword}
                  onChange={e => setModPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Login as Moderator</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. SUBSCRIBER COMPANY USER LOGIN */}
        {authTab === 'company' && (
          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300">
              <span className="font-bold block mb-0.5">Subscriber Company Login:</span>
              <span>Select tenant company and sign in with company credentials.</span>
            </div>

            {companyError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{companyError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Company *
                </label>
                <select
                  value={selectedTenantId}
                  onChange={e => setSelectedTenantId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-bold"
                >
                  {allTenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Username or Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="admin_username"
                  value={companyUsername}
                  onChange={e => setCompanyUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••"
                  value={companyPassword}
                  onChange={e => setCompanyPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Enter Company Workspace</span>
              </button>
            </div>
          </form>
        )}

        {/* Modal Footer with Logout Action */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            id="auth-modal-logout-btn"
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900/50 transition-colors shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout & Return to Login</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
