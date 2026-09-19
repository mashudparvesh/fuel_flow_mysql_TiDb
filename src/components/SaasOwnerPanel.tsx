import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  Tenant,
  SaasModerator
} from '../types';
import {
  Crown,
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  Key,
  Lock,
  Unlock,
  Calendar,
  Clock,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Layers,
  Settings,
  UserPlus,
  ChevronRight,
  Truck,
  Shield,
  Phone,
  Mail,
  X
} from 'lucide-react';

export const SaasOwnerPanel: React.FC<{ onOpenCompanyUserManagement?: () => void; onSwitchToFleetView?: () => void }> = ({ onOpenCompanyUserManagement, onSwitchToFleetView }) => {
  const {
    language,
    saasOwner,
    updateSaasOwnerCredentials,
    moderators,
    addModerator,
    updateModerator,
    deleteModerator,
    allTenants,
    currentTenant,
    setCurrentTenantId,
    allUsers,
    vehicles,
    activeAuthRole,
    activeModerator,
    addTenantSubscriber,
    updateTenantSubscription,
    extendTenantSubscription,
    setTenantStatus,
    updateTenantSuperAdminCredentials,
    deleteTenantSubscriber,
    impersonateTenant,
    setIsSaasControlOpen
  } = useApp();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'subscribers' | 'moderators' | 'owner_profile' | 'packages'>('subscribers');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [planFilter, setPlanFilter] = useState<'all' | SubscriptionPlan>('all');

  // Modals
  const [isAddSubscriberModalOpen, setIsAddSubscriberModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedTenantForExtend, setSelectedTenantForExtend] = useState<Tenant | null>(null);
  const [extendDaysVal, setExtendDaysVal] = useState(30);

  const [isEditCredsModalOpen, setIsEditCredsModalOpen] = useState(false);
  const [selectedTenantForCreds, setSelectedTenantForCreds] = useState<Tenant | null>(null);
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');

  const [isAddModeratorModalOpen, setIsAddModeratorModalOpen] = useState(false);

  // Owner Creds Form state
  const [ownerUsernameInput, setOwnerUsernameInput] = useState(saasOwner.username);
  const [ownerPasswordInput, setOwnerPasswordInput] = useState(saasOwner.password);
  const [ownerNameInput, setOwnerNameInput] = useState(saasOwner.name);
  const [ownerEmailInput, setOwnerEmailInput] = useState(saasOwner.email);
  const [ownerPhoneInput, setOwnerPhoneInput] = useState(saasOwner.phone);
  const [ownerSuccessMsg, setOwnerSuccessMsg] = useState('');
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);

  // Reveal password state for each tenant
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Subscriber Form State
  const [newSubForm, setNewSubForm] = useState({
    name: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    currency: 'BDT',
    plan: 'professional' as SubscriptionPlan,
    duration_type: 'months' as 'days' | 'months' | 'years',
    duration_val: 1,
    price_bdt: 15000,
    payment_status: 'paid' as 'paid' | 'partial' | 'due',
    max_vehicles: 50,
    max_users: 10,
    max_pumps: 10,
    super_admin_name: '',
    super_admin_username: '',
    super_admin_password: '',
    super_admin_email: '',
    super_admin_phone: '',
    notes: ''
  });

  // New Moderator Form State
  const [newModForm, setNewModForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    can_manage_subscriptions: true,
    can_reset_passwords: true,
    can_add_subscribers: true,
    can_view_financials: true
  });

  // Toggle Password View
  const toggleShowPassword = (tenantId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [tenantId]: !prev[tenantId] }));
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper calculation for Days Remaining
  const getDaysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Filtered Subscribers
  const filteredSubscribers = useMemo(() => {
    return allTenants.filter(t => {
      const matchSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.subscription?.super_admin_username && t.subscription.super_admin_username.toLowerCase().includes(searchQuery.toLowerCase()));

      const subStatus = t.subscription?.status || 'active';
      const matchStatus = statusFilter === 'all' || subStatus === statusFilter;
      const matchPlan = planFilter === 'all' || t.subscription?.plan === planFilter;

      return matchSearch && matchStatus && matchPlan;
    });
  }, [allTenants, searchQuery, statusFilter, planFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = allTenants.length;
    let active = 0;
    let expiring = 0;
    let expired = 0;
    let totalRevenue = 0;

    allTenants.forEach(t => {
      const sub = t.subscription;
      if (sub) {
        totalRevenue += Number(sub.price_bdt) || 0;
        const days = getDaysRemaining(sub.end_date);
        if (sub.status === 'suspended') {
          // suspended
        } else if (days < 0 || sub.status === 'expired') {
          expired++;
        } else if (days <= 7) {
          expiring++;
          active++;
        } else {
          active++;
        }
      } else {
        active++;
      }
    });

    return { total, active, expiring, expired, totalRevenue };
  }, [allTenants]);

  // Auto-generate code when typing name
  const handleNameChange = (name: string) => {
    const generatedCode = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .slice(0, 12);
    setNewSubForm(prev => ({
      ...prev,
      name,
      code: prev.code ? prev.code : generatedCode + '_01',
      super_admin_name: prev.super_admin_name ? prev.super_admin_name : name + ' Admin',
      super_admin_username: prev.super_admin_username ? prev.super_admin_username : 'admin_' + generatedCode.toLowerCase()
    }));
  };

  // Submit New Subscriber
  const handleCreateSubscriber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubForm.name || !newSubForm.super_admin_username || !newSubForm.super_admin_password) {
      alert(language === 'bn' ? 'দয়া করে কোম্পানির নাম, সুপার অ্যাডমিন ইউজার ও পাসওয়ার্ড পূরণ করুন।' : 'Please provide Company Name, Super Admin Username and Password.');
      return;
    }

    addTenantSubscriber({
      name: newSubForm.name,
      code: newSubForm.code || 'CO_' + Date.now().toString().slice(-4),
      contact_person: newSubForm.contact_person || newSubForm.name + ' Representative',
      phone: newSubForm.phone || '01700000000',
      email: newSubForm.email || 'info@' + newSubForm.name.toLowerCase().replace(/\s+/g, '') + '.com',
      address: newSubForm.address || 'Dhaka, Bangladesh',
      currency: newSubForm.currency || 'BDT',
      plan: newSubForm.plan,
      duration_type: newSubForm.duration_type,
      duration_val: Number(newSubForm.duration_val) || 1,
      price_bdt: Number(newSubForm.price_bdt) || 15000,
      payment_status: newSubForm.payment_status,
      max_vehicles: Number(newSubForm.max_vehicles) || 50,
      max_users: Number(newSubForm.max_users) || 10,
      max_pumps: Number(newSubForm.max_pumps) || 10,
      super_admin_name: newSubForm.super_admin_name || 'Admin',
      super_admin_username: newSubForm.super_admin_username,
      super_admin_password: newSubForm.super_admin_password,
      super_admin_email: newSubForm.super_admin_email || newSubForm.email || 'admin@domain.com',
      super_admin_phone: newSubForm.super_admin_phone || newSubForm.phone,
      notes: newSubForm.notes
    });

    setIsAddSubscriberModalOpen(false);
    // Reset form
    setNewSubForm({
      name: '',
      code: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      currency: 'BDT',
      plan: 'professional',
      duration_type: 'months',
      duration_val: 1,
      price_bdt: 15000,
      payment_status: 'paid',
      max_vehicles: 50,
      max_users: 10,
      max_pumps: 10,
      super_admin_name: '',
      super_admin_username: '',
      super_admin_password: '',
      super_admin_email: '',
      super_admin_phone: '',
      notes: ''
    });
  };

  // Submit Extend Duration
  const handleConfirmExtend = () => {
    if (!selectedTenantForExtend) return;
    extendTenantSubscription(selectedTenantForExtend.id, Number(extendDaysVal) || 30);
    setIsExtendModalOpen(false);
    setSelectedTenantForExtend(null);
  };

  // Submit Credential Edit
  const handleSaveCredentials = () => {
    if (!selectedTenantForCreds || !credUsername.trim() || !credPassword.trim()) return;
    updateTenantSuperAdminCredentials(selectedTenantForCreds.id, credUsername.trim(), credPassword.trim());
    setIsEditCredsModalOpen(false);
    setSelectedTenantForCreds(null);
  };

  // Submit Owner Profile Update
  const handleSaveOwnerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateSaasOwnerCredentials(
      ownerUsernameInput,
      ownerPasswordInput,
      ownerNameInput,
      ownerEmailInput,
      ownerPhoneInput
    );
    if (res.success) {
      setOwnerSuccessMsg(res.message);
      setTimeout(() => setOwnerSuccessMsg(''), 4000);
    } else {
      alert(res.message);
    }
  };

  // Submit Moderator Form
  const handleCreateModerator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModForm.name || !newModForm.username || !newModForm.password) {
      alert(language === 'bn' ? 'মডারেটরের নাম, ইউজারনেম এবং পাসওয়ার্ড পূরণ করুন।' : 'Please fill Moderator Name, Username and Password.');
      return;
    }

    addModerator({
      name: newModForm.name,
      username: newModForm.username,
      password: newModForm.password,
      email: newModForm.email,
      phone: newModForm.phone,
      status: 'active',
      permissions: {
        can_manage_subscribers: Boolean(newModForm.can_add_subscribers || newModForm.can_manage_subscriptions),
        can_extend_subscriptions: Boolean(newModForm.can_manage_subscriptions),
        can_manage_pricing: false,
        can_view_financials: Boolean(newModForm.can_view_financials),
        can_impersonate: false,
        can_reset_passwords: Boolean(newModForm.can_reset_passwords),
        can_manage_subscriptions: Boolean(newModForm.can_manage_subscriptions),
        can_add_subscribers: Boolean(newModForm.can_add_subscribers)
      }
    });

    setIsAddModeratorModalOpen(false);
    setNewModForm({
      name: '',
      username: '',
      password: '',
      email: '',
      phone: '',
      can_manage_subscriptions: true,
      can_reset_passwords: true,
      can_add_subscribers: true,
      can_view_financials: true
    });
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Identity Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>SaaS Master Control Panel (প্ল্যাটফর্ম ওনার)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {language === 'bn' ? 'ফুয়েলনেস্ট (FuelNest) SaaS প্ল্যাটফর্ম কন্ট্রোল প্যানেল' : 'FuelNest SaaS Platform Master Control • fuelnest.xyz'}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              {language === 'bn'
                ? 'এখান থেকে আপনি কোম্পানির সাবস্ক্রিপশন বিক্রি, মেয়াদ (দিন/মাস) নিয়ন্ত্রণ, সুপার অ্যাডমিন লগইন-পাসওয়ার্ড ম্যানেজমেন্ট এবং মডারেটর নিয়োগ ও পরিচালনা করতে পারবেন।'
                : 'Manage subscriber companies, control access validity (days/months), configure Super Admin credentials, and assign moderators on your behalf.'}
            </p>
          </div>

          {/* Owner Switch Tenant Control, Credentials Badge & Workspace Return Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Switch Active Tenant Selector for Owner */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-amber-500/40 backdrop-blur-xs flex items-center gap-2.5 text-xs shadow-md">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-amber-400/80 text-[10px] font-bold uppercase tracking-wider">
                  {language === 'bn' ? 'সক্রিয় টেন্যান্ট পরিবর্তন' : 'Switch Active Tenant'}
                </div>
                <select
                  id="saas-owner-tenant-select"
                  value={currentTenant.id}
                  onChange={(e) => setCurrentTenantId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg px-2 py-1 outline-hidden focus:border-amber-400 cursor-pointer mt-0.5"
                >
                  {allTenants.map((ten) => (
                    <option key={ten.id} value={ten.id}>
                      {ten.name} ({ten.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700/80 backdrop-blur-xs flex items-center gap-3 text-xs">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold">
                👑
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">
                  {language === 'bn' ? 'ওনার আইডি' : 'Owner ID'}
                </div>
                <div className="text-amber-300 font-mono font-bold text-sm">
                  {saasOwner.username}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSaasControlOpen(false)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
              title={language === 'bn' ? 'ফ্লিট ওয়ার্কস্পেসে ফিরে যান' : 'Go to Fleet Workspace'}
            >
              <span>{language === 'bn' ? 'ফ্লিট ড্যাশবোর্ডে যান' : 'Launch Fleet App'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{language === 'bn' ? 'মোট সাবস্ক্রাইবার' : 'Total Subscribers'}</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'bn' ? 'রেজিস্টার্ড কোম্পানি' : 'Registered Companies'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
            <span>{language === 'bn' ? 'সক্রিয় এক্সেস' : 'Active Access'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'bn' ? 'মেয়াদ বৈধ রয়েছে' : 'Valid subscriptions'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">
            <span>{language === 'bn' ? 'দ্রুত শেষ হচ্ছে' : 'Expiring Soon'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.expiring}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'bn' ? '৭ দিনের কম বাকি' : 'Under 7 days remaining'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400 text-xs font-semibold mb-1">
            <span>{language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Expired'}</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {stats.expired}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'bn' ? 'রিনিউ প্রয়োজন' : 'Action needed'}
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{language === 'bn' ? 'মোট সাবস্ক্রিপশন সেল' : 'Total Revenue'}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            ৳ {stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'bn' ? 'প্ল্যাটফর্ম রেভিনিউ' : 'Gross BDT Revenue'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'subscribers'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'bn' ? 'কোম্পানি সাবস্ক্রাইবার তালিকা' : 'Subscribers & Plans'}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10">
              {allTenants.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('moderators')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'moderators'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'bn' ? 'মডারেটর ম্যানেজমেন্ট' : 'Moderators'}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10">
              {moderators.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('owner_profile')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'owner_profile'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>{language === 'bn' ? 'ওনার আইডি ও পাসওয়ার্ড' : 'Owner Security'}</span>
          </button>
        </div>

        {/* Action button based on tab */}
        {activeTab === 'subscribers' && (
          <button
            onClick={() => setIsAddSubscriberModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন সাবস্ক্রাইবার কোম্পানি যোগ করুন' : '+ Add New Subscriber'}</span>
          </button>
        )}

        {activeTab === 'moderators' && (
          <button
            onClick={() => setIsAddModeratorModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'bn' ? 'নতুন মডারেটর নিয়োগ করুন' : '+ Add Moderator'}</span>
          </button>
        )}
      </div>

      {/* ================= TAB 1: SUBSCRIBERS ================= */}
      {activeTab === 'subscribers' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={language === 'bn' ? 'কোম্পানি নাম, কোড, ইউজারনেম দিয়ে খুঁজুন...' : 'Search by company name, code, username...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-medium"
              >
                <option value="all">{language === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
                <option value="active">{language === 'bn' ? 'সক্রিয় (Active)' : 'Active'}</option>
                <option value="expired">{language === 'bn' ? 'মেয়াদোত্তীর্ণ (Expired)' : 'Expired'}</option>
                <option value="suspended">{language === 'bn' ? 'স্থগিত (Suspended)' : 'Suspended'}</option>
              </select>

              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-medium"
              >
                <option value="all">{language === 'bn' ? 'সকল প্ল্যান' : 'All Plans'}</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          {/* Subscribers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSubscribers.map(tenant => {
              const sub = tenant.subscription;
              const daysRemaining = sub ? getDaysRemaining(sub.end_date) : 0;
              const isExpired = daysRemaining < 0 || sub?.status === 'expired';
              const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;
              const isSuspended = sub?.status === 'suspended';
              const showPass = visiblePasswords[tenant.id];

              const superAdminUsername = sub?.super_admin_username || 'admin_' + tenant.code.toLowerCase();
              const superAdminPassword = sub?.super_admin_password || 'pass1234';

              return (
                <div
                  key={tenant.id}
                  className={`rounded-2xl p-5 bg-white dark:bg-[#0c162d] border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                    isSuspended
                      ? 'border-slate-300 dark:border-slate-700 opacity-80'
                      : isExpired
                      ? 'border-red-300 dark:border-red-900/60 bg-red-50/20'
                      : isExpiringSoon
                      ? 'border-amber-300 dark:border-amber-700/60'
                      : 'border-slate-200 dark:border-blue-900/40'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Company Name, Code & Plan */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                            {tenant.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {tenant.code}
                          </span>
                          <span className="text-xs text-slate-500">
                            {tenant.contact_person}
                          </span>
                        </div>
                      </div>

                      {/* Status & Plan Badge */}
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isSuspended
                              ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                              : isExpired
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 border border-red-300'
                              : isExpiringSoon
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300'
                          }`}
                        >
                          {isSuspended
                            ? (language === 'bn' ? 'স্থগিত' : 'Suspended')
                            : isExpired
                            ? (language === 'bn' ? 'মেয়াদ শেষ' : 'Expired')
                            : isExpiringSoon
                            ? (language === 'bn' ? `${daysRemaining} দিন বাকি` : `${daysRemaining}d Left`)
                            : (language === 'bn' ? `${daysRemaining} দিন বাকি` : `${daysRemaining}d Active`)}
                        </span>

                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 capitalize">
                          {sub?.plan ? `${sub.plan.toUpperCase()} Plan` : 'Standard Plan'}
                        </span>
                      </div>
                    </div>

                    {/* Subscription Duration & Billing Box */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{language === 'bn' ? 'মেয়াদ সমাপ্তি:' : 'Expires:'}</span>
                        </span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {sub?.end_date || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{language === 'bn' ? 'প্যাকেজ মূল্য:' : 'Subscription Price:'}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            ৳ {(sub?.price_bdt || 0).toLocaleString()}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                              sub?.payment_status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                            }`}
                          >
                            {sub?.payment_status || 'paid'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar for Duration */}
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isExpired ? 'bg-red-500 w-full' : isExpiringSoon ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{
                            width: isExpired ? '100%' : `${Math.max(5, Math.min(100, (daysRemaining / 90) * 100))}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* SUPER ADMIN CREDENTIALS BOX (Requested by user) */}
                    <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 dark:text-amber-400">
                        <span className="flex items-center gap-1">
                          <Key className="w-3.5 h-3.5 text-amber-600" />
                          <span>{language === 'bn' ? 'সুপার অ্যাডমিন লগইন তথ্য' : 'Super Admin Login'}</span>
                        </span>
                        <button
                          onClick={() => {
                            setSelectedTenantForCreds(tenant);
                            setCredUsername(superAdminUsername);
                            setCredPassword(superAdminPassword);
                            setIsEditCredsModalOpen(true);
                          }}
                          className="hover:underline flex items-center gap-0.5 text-amber-700 dark:text-amber-400 text-[10px]"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{language === 'bn' ? 'পরিবর্তন' : 'Edit'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white dark:bg-[#0c162d] p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/30">
                          <span className="text-[10px] text-slate-400 block font-semibold">User</span>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                              {superAdminUsername}
                            </span>
                            <button
                              onClick={() => handleCopyText(superAdminUsername, tenant.id + '_user')}
                              className="text-slate-400 hover:text-amber-600 p-0.5"
                              title="Copy username"
                            >
                              {copiedId === tenant.id + '_user' ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-[#0c162d] p-2 rounded-lg border border-amber-200/60 dark:border-amber-900/30">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-semibold">Pass</span>
                            <button
                              onClick={() => toggleShowPassword(tenant.id)}
                              className="text-[10px] text-slate-400 hover:text-slate-600"
                            >
                              {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                              {showPass ? superAdminPassword : '••••••••'}
                            </span>
                            <button
                              onClick={() => handleCopyText(superAdminPassword, tenant.id + '_pass')}
                              className="text-slate-400 hover:text-amber-600 p-0.5"
                              title="Copy password"
                            >
                              {copiedId === tenant.id + '_pass' ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 mt-4">
                    {/* Primary Button: Impersonate / Launch Workspace */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => impersonateTenant(tenant.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs shadow-xs transition-all hover:scale-[1.01]"
                        title={language === 'bn' ? 'এই কোম্পানির ড্যাশবোর্ডে প্রবেশ করুন' : 'Launch Tenant Fleet'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{language === 'bn' ? 'কোম্পানি ড্যাশবোর্ড খুলুন' : 'Enter Workspace'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedTenantForExtend(tenant);
                          setIsExtendModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-800 transition-colors"
                        title={language === 'bn' ? 'মেয়াদ বাড়ান' : 'Extend Duration'}
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{language === 'bn' ? '+মেয়াদ' : '+Days'}</span>
                      </button>
                    </div>

                    {/* Secondary Row: Quick Actions */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        onClick={() => setTenantStatus(tenant.id, isSuspended ? 'active' : 'suspended')}
                        className={`text-[11px] font-semibold hover:underline ${
                          isSuspended ? 'text-emerald-600' : 'text-slate-500 hover:text-amber-600'
                        }`}
                      >
                        {isSuspended ? '✅ আন-সাসপেন্ড করুন' : '⏸️ সাময়িক স্থগিত (Suspend)'}
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(language === 'bn' ? `আপনি কি সত্যিই "${tenant.name}" কোম্পানি মুছে ফেলতে চান?` : `Are you sure you want to delete ${tenant.name}?`)) {
                            deleteTenantSubscriber(tenant.id);
                          }
                        }}
                        className="text-[11px] font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1"
                        title="Delete Tenant"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSubscribers.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-[#0c162d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                {language === 'bn' ? 'কোনো সাবস্ক্রাইবার পাওয়া যায়নি' : 'No Subscribers Found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'bn' ? 'সার্চ ফিল্টার রিসেট করুন অথবা নতুন কোম্পানি অনবোর্ড করুন।' : 'Try resetting your search or add a new subscriber.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: MODERATORS ================= */}
      {activeTab === 'moderators' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong className="font-bold block text-sm mb-0.5">
                {language === 'bn' ? 'মডারেটর ও ডেলিগেটেড এডমিন সুবিধা:' : 'Moderator Delegation Feature:'}
              </strong>
              {language === 'bn'
                ? 'আপনি ওনার হিসেবে একাধিক মডারেটর যোগ করতে পারেন। তারা আপনার পক্ষ থেকে সাবস্ক্রিপশন সেল, মেয়াদ বাড়ানো, এবং কোম্পানির সুপার অ্যাডমিন পাসওয়ার্ড রিসেট করতে পারবে।'
                : 'As platform owner, you can appoint moderators with dedicated credentials to manage subscriptions and reset client passwords on your behalf.'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moderators.map(mod => (
              <div
                key={mod.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base">
                        {mod.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mt-0.5">
                        <Shield className="w-3.5 h-3.5" />
                        <span>SaaS Moderator</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        mod.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300'
                      }`}
                    >
                      {mod.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Credentials Box */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Username:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{mod.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Password:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-white">{mod.password}</span>
                    </div>
                    {mod.phone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="text-slate-700 dark:text-slate-300">{mod.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Permissions */}
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400">ক্ষমতা ও পারমিশন:</span>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        {mod.permissions.can_manage_subscriptions ? '✅' : '❌'} সাবস্ক্রিপশন
                      </div>
                      <div className="flex items-center gap-1">
                        {mod.permissions.can_reset_passwords ? '✅' : '❌'} পাসওয়ার্ড রিসেট
                      </div>
                      <div className="flex items-center gap-1">
                        {mod.permissions.can_add_subscribers ? '✅' : '❌'} নতুন অনবোর্ড
                      </div>
                      <div className="flex items-center gap-1">
                        {mod.permissions.can_view_financials ? '✅' : '❌'} ফাইন্যান্স ভিউ
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      updateModerator(mod.id, {
                        status: mod.status === 'active' ? 'suspended' : 'active'
                      });
                    }}
                    className={`text-[11px] font-semibold ${
                      mod.status === 'active' ? 'text-slate-500 hover:text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {mod.status === 'active' ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`আপনি কি সত্যিই মডারেটর "${mod.name}" মুছে ফেলতে চান?`)) {
                        deleteModerator(mod.id);
                      }
                    }}
                    className="text-[11px] text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ডিলিট</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: OWNER SECURITY & PROFILE ================= */}
      {activeTab === 'owner_profile' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 text-2xl font-black">
              👑
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'SaaS ওনার প্রোফাইল ও লগইন পরিবর্তন' : 'SaaS Owner Profile & Security'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'bn'
                  ? 'আপনার ওনার ইউজারনেম ও পাসওয়ার্ড এখান থেকে যে কোনো সময় পরিবর্তন করতে পারবেন।'
                  : 'Update your SaaS Master credentials anytime from this secure screen.'}
              </p>
            </div>
          </div>

          {ownerSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{ownerSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveOwnerProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ওনার ইউজারনেম (Username)' : 'Owner Username'} *
                </label>
                <input
                  type="text"
                  required
                  value={ownerUsernameInput}
                  onChange={e => setOwnerUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {language === 'bn' ? 'ডিফল্ট: mashudalone' : 'Default: mashudalone'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'bn' ? 'ওনার পাসওয়ার্ড (Password)' : 'Owner Password'} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                    className="text-[10px] text-slate-400 hover:text-slate-600"
                  >
                    {showOwnerPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showOwnerPassword ? 'text' : 'password'}
                    required
                    value={ownerPasswordInput}
                    onChange={e => setOwnerPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {language === 'bn' ? 'ডিফল্ট: 00000' : 'Default: 00000'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ওনারের নাম (Display Name)' : 'Display Name'}
                </label>
                <input
                  type="text"
                  value={ownerNameInput}
                  onChange={e => setOwnerNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email'}
                </label>
                <input
                  type="email"
                  value={ownerEmailInput}
                  onChange={e => setOwnerEmailInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
              </label>
              <input
                type="text"
                value={ownerPhoneInput}
                onChange={e => setOwnerPhoneInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
              >
                {language === 'bn' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: ADD SUBSCRIBER ================= */}
      {isAddSubscriberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {language === 'bn' ? 'নতুন সাবস্ক্রাইবার কোম্পানি অনবোর্ড করুন' : 'Onboard New Subscriber Company'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddSubscriberModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubscriber} className="space-y-4">
              {/* Company Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  ১. কোম্পানি ও প্রতিষ্ঠানের তথ্য
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      কোম্পানির নাম (Company Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মেঘনা লজিস্টিকস লিমিটেড"
                      value={newSubForm.name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ইউনিক টেন্যান্ট কোড (Tenant Code) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSubForm.code}
                      onChange={e => setNewSubForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      যোগাযোগকারীর নাম (Contact Person)
                    </label>
                    <input
                      type="text"
                      value={newSubForm.contact_person}
                      onChange={e => setNewSubForm(prev => ({ ...prev, contact_person: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ফোন নম্বর (Phone) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="017XXXXXXXX"
                      value={newSubForm.phone}
                      onChange={e => setNewSubForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Plan & Duration */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  ২. সাবস্ক্রিপশন প্ল্যান ও মেয়াদের পরিমাপ
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      প্ল্যান নির্বাচন
                    </label>
                    <select
                      value={newSubForm.plan}
                      onChange={e => {
                        const p = e.target.value as SubscriptionPlan;
                        let price = 15000;
                        if (p === 'starter') price = 6000;
                        if (p === 'enterprise') price = 35000;
                        if (p === 'custom') price = 50000;
                        setNewSubForm(prev => ({ ...prev, plan: p, price_bdt: price }));
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-medium"
                    >
                      <option value="starter">Starter (৫০ গাড়ি)</option>
                      <option value="professional">Professional (২০০ গাড়ি)</option>
                      <option value="enterprise">Enterprise (আনলিমিটেড)</option>
                      <option value="custom">Custom Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মেয়াদের ধরন (Duration)
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={newSubForm.duration_type}
                        onChange={e => setNewSubForm(prev => ({ ...prev, duration_type: e.target.value as any }))}
                        className="w-1/2 px-2 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                      >
                        <option value="days">দিন (Days)</option>
                        <option value="months">মাস (Months)</option>
                        <option value="years">বছর (Years)</option>
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={newSubForm.duration_val}
                        onChange={e => setNewSubForm(prev => ({ ...prev, duration_val: Number(e.target.value) || 1 }))}
                        className="w-1/2 px-2 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      মূল্য (BDT) ও পেমেন্ট
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={newSubForm.price_bdt}
                        onChange={e => setNewSubForm(prev => ({ ...prev, price_bdt: Number(e.target.value) || 0 }))}
                        className="w-2/3 px-2 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-bold"
                      />
                      <select
                        value={newSubForm.payment_status}
                        onChange={e => setNewSubForm(prev => ({ ...prev, payment_status: e.target.value as any }))}
                        className="w-1/3 px-1 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                      >
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="due">Due</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* SUPER ADMIN CREDENTIALS SETTING */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    ৩. সাবস্ক্রাইবার সুপার অ্যাডমিন একাউন্ট (লগইন ক্রেডেনশিয়াল)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = Math.random().toString(36).slice(-6) + '@ff';
                      setNewSubForm(prev => ({ ...prev, super_admin_password: randomPass }));
                    }}
                    className="text-[11px] text-amber-600 font-bold hover:underline"
                  >
                    🎲 অটো পাসওয়ার্ড তৈরি করুন
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      সুপার অ্যাডমিন ইউজারনেম (Login Username) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="admin_company"
                      value={newSubForm.super_admin_username}
                      onChange={e => setNewSubForm(prev => ({ ...prev, super_admin_username: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      লগইন পাসওয়ার্ড (Password) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="পাসওয়ার্ড লিখুন"
                      value={newSubForm.super_admin_password}
                      onChange={e => setNewSubForm(prev => ({ ...prev, super_admin_password: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddSubscriberModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
                >
                  সাবস্ক্রাইবার কোম্পানি যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EXTEND DURATION ================= */}
      {isExtendModalOpen && selectedTenantForExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'সাবস্ক্রিপশন মেয়াদ বৃদ্ধি করুন' : 'Extend Subscription Duration'}
              </h3>
              <button onClick={() => setIsExtendModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e1e] text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {selectedTenantForExtend.name}
              </div>
              <div className="text-slate-500">
                বর্তমান মেয়াদ শেষ: <span className="font-mono font-bold text-amber-600">{selectedTenantForExtend.subscription?.end_date}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                কত দিন মেয়াদ বাড়াতে চান? (Additional Days)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[7, 15, 30, 90, 180, 365].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setExtendDaysVal(days)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                      extendDaysVal === days
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    +{days >= 30 ? `${Math.round(days / 30)} মাস` : `${days} দিন`}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <input
                  type="number"
                  min="1"
                  value={extendDaysVal}
                  onChange={e => setExtendDaysVal(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  placeholder="কাস্টম দিন সংখ্যা লিখুন"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmExtend}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md"
              >
                মেয়াদ নিশ্চিত করুন (+{extendDaysVal} দিন)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT SUPER ADMIN CREDENTIALS ================= */}
      {isEditCredsModalOpen && selectedTenantForCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'সুপার অ্যাডমিন লগইন ও পাসওয়ার্ড পরিবর্তন' : 'Edit Super Admin Credentials'}
              </h3>
              <button onClick={() => setIsEditCredsModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#080e1e] text-xs space-y-0.5">
              <div className="font-bold text-slate-900 dark:text-white">{selectedTenantForCreds.name}</div>
              <div className="text-slate-500">Tenant Code: {selectedTenantForCreds.code}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ইউজারনেম (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={credUsername}
                  onChange={e => setCredUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  নতুন পাসওয়ার্ড (Password) *
                </label>
                <input
                  type="text"
                  required
                  value={credPassword}
                  onChange={e => setCredPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditCredsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleSaveCredentials}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md"
              >
                লগইন তথ্য সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD MODERATOR ================= */}
      {isAddModeratorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {language === 'bn' ? 'নতুন SaaS মডারেটর নিয়োগ করুন' : 'Appoint New SaaS Moderator'}
              </h3>
              <button onClick={() => setIsAddModeratorModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateModerator} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  মডারেটরের নাম (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ কামরুল হাসান"
                  value={newModForm.name}
                  onChange={e => setNewModForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ইউজারনেম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="mod_kamrul"
                    value={newModForm.username}
                    onChange={e => setNewModForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    পাসওয়ার্ড *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="00000"
                    value={newModForm.password}
                    onChange={e => setNewModForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ফোন নম্বর
                  </label>
                  <input
                    type="text"
                    placeholder="017..."
                    value={newModForm.phone}
                    onChange={e => setNewModForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ইমেইল
                  </label>
                  <input
                    type="email"
                    placeholder="mod@saas.com"
                    value={newModForm.email}
                    onChange={e => setNewModForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Permission Checkboxes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  মডারেটর পারমিশন সমূহ:
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newModForm.can_manage_subscriptions}
                    onChange={e => setNewModForm(prev => ({ ...prev, can_manage_subscriptions: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span>সাবস্ক্রিপশন মেয়াদ ও স্ট্যাটাস নিয়ন্ত্রণ</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newModForm.can_reset_passwords}
                    onChange={e => setNewModForm(prev => ({ ...prev, can_reset_passwords: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span>ক্লায়েন্ট সুপার অ্যাডমিন পাসওয়ার্ড পরিবর্তন</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newModForm.can_add_subscribers}
                    onChange={e => setNewModForm(prev => ({ ...prev, can_add_subscribers: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span>নতুন সাবস্ক্রাইবার অনবোর্ড / সেলস</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModeratorModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  মডারেটর নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
