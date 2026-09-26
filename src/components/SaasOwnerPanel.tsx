import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  Tenant,
  SaasModerator,
  OwnerRole,
  PendingApprovalAction,
  PendingActionType,
  ApprovalStatus
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
  AlertTriangle,
  CheckCircle2,
  Layers,
  Settings,
  UserPlus,
  ChevronRight,
  Truck,
  Shield,
  Phone,
  Mail,
  Download,
  FileText,
  Send,
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
    setIsSaasControlOpen,
    approvals,
    requestApprovalAction,
    approveAction,
    rejectAction
  } = useApp();

  // Role Calculation & Permissions
  const effectiveRole: OwnerRole = useMemo(() => {
    if (activeAuthRole === 'saas_owner') {
      return saasOwner.owner_role || 'OWNER_ADMIN';
    }
    if (activeAuthRole === 'saas_moderator' && activeModerator) {
      return activeModerator.owner_role || 'MODERATOR';
    }
    return 'OWNER_ADMIN';
  }, [activeAuthRole, saasOwner.owner_role, activeModerator]);

  const currentUserName = useMemo(() => {
    if (activeAuthRole === 'saas_owner') return saasOwner.name || 'Md. Mashud';
    if (activeModerator) return activeModerator.name;
    return 'Master User';
  }, [activeAuthRole, saasOwner.name, activeModerator]);

  // Permissions Matrix
  const isOwnerOrCoOwner = effectiveRole === 'OWNER_ADMIN' || effectiveRole === 'CO_OWNER_ADMIN';
  const canAccessOwnerSecurity = isOwnerOrCoOwner;
  const canManageControlUsers = isOwnerOrCoOwner;
  const canDirectlyManageSubscribers = effectiveRole === 'OWNER_ADMIN' || effectiveRole === 'CO_OWNER_ADMIN' || effectiveRole === 'ADMIN';
  const isModerator = effectiveRole === 'MODERATOR';
  const canApproveRequests = effectiveRole === 'OWNER_ADMIN' || effectiveRole === 'CO_OWNER_ADMIN' || effectiveRole === 'ADMIN';

  // Active Tab
  const [activeTab, setActiveTab] = useState<'subscribers' | 'moderators' | 'approvals' | 'owner_profile' | 'packages' | 'gateway'>('subscribers');

  // Enforce access control if tab is restricted
  useEffect(() => {
    if (activeTab === 'owner_profile' && !canAccessOwnerSecurity) {
      setActiveTab('subscribers');
    }
  }, [activeTab, canAccessOwnerSecurity]);

  // Pending count for badge
  const pendingApprovalsCount = useMemo(() => {
    return approvals.filter(a => a.status === 'PENDING').length;
  }, [approvals]);

  // Gateway webhook test states
  const [webhookTestLoading, setWebhookTestLoading] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubscriptionStatus>('all');
  const [planFilter, setPlanFilter] = useState<'all' | SubscriptionPlan>('all');

  // Modals & In-App Confirmations (No native window.confirm)
  const [isAddSubscriberModalOpen, setIsAddSubscriberModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedTenantForExtend, setSelectedTenantForExtend] = useState<Tenant | null>(null);
  const [extendDaysVal, setExtendDaysVal] = useState(30);

  // In-app Subscriber Delete Confirmation Modal
  const [deleteConfirmTenant, setDeleteConfirmTenant] = useState<Tenant | null>(null);
  const [isDeletingTenant, setIsDeletingTenant] = useState(false);

  // In-app Moderator Approval Request Modal
  const [modRequestModal, setModRequestModal] = useState<{
    type: PendingActionType;
    tenant: Tenant;
  } | null>(null);
  const [modRequestReason, setModRequestReason] = useState('');
  const [modRequestDays, setModRequestDays] = useState(30);
  const [isSubmittingApprovalRequest, setIsSubmittingApprovalRequest] = useState(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  // Approvals view filters & modals
  const [approvalFilter, setApprovalFilter] = useState<'all' | ApprovalStatus>('all');
  const [reviewRejectModal, setReviewRejectModal] = useState<PendingApprovalAction | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // In-app Moderator Delete Confirmation Modal
  const [deleteConfirmMod, setDeleteConfirmMod] = useState<SaasModerator | null>(null);

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
    must_change_password: true,
    notes: ''
  });

  // New Moderator Form State
  const [newModForm, setNewModForm] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    owner_role: 'MODERATOR' as OwnerRole,
    must_change_password: true,
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

  // Filtered Approvals
  const filteredApprovals = useMemo(() => {
    return approvals.filter(a => {
      if (approvalFilter === 'all') return true;
      return a.status === approvalFilter;
    });
  }, [approvals, approvalFilter]);

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
      alert('Please provide Company Name, Super Admin Username and Password.');
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
      must_change_password: newSubForm.must_change_password,
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
      must_change_password: true,
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

  // Download Subscribers List as CSV
  const handleDownloadSubscribersCsv = () => {
    const headers = [
      'Subscriber ID',
      'Company Name',
      'Tenant Code',
      'Contact Person',
      'Phone',
      'Email',
      'Address',
      'Plan',
      'Subscription Status',
      'Price (BDT)',
      'Payment Status',
      'Max Vehicles',
      'Max Users',
      'Max Pumps',
      'Start Date',
      'End Date',
      'Days Remaining',
      'Super Admin Username',
      'Registered Date'
    ];

    const rows = allTenants.map(t => {
      const sub = t.subscription;
      const daysLeft = sub?.end_date ? getDaysRemaining(sub.end_date) : 0;
      return [
        t.id,
        `"${(t.name || '').replace(/"/g, '""')}"`,
        t.code,
        `"${(t.contact_person || '').replace(/"/g, '""')}"`,
        `"${(t.phone || '').replace(/"/g, '""')}"`,
        t.email || '',
        `"${(t.address || '').replace(/"/g, '""')}"`,
        sub?.plan || 'trial',
        sub?.status || 'active',
        sub?.price_bdt || 0,
        sub?.payment_status || 'paid',
        sub?.max_vehicles || 0,
        sub?.max_users || 0,
        sub?.max_pumps || 0,
        sub?.start_date || '',
        sub?.end_date || '',
        daysLeft,
        sub?.super_admin_username || '',
        t.created_at || ''
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fuelnest_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Direct In-App Delete Tenant (For Owner Admin, Co-Owner Admin, Admin)
  const handleExecuteDeleteTenant = () => {
    if (!deleteConfirmTenant) return;
    setIsDeletingTenant(true);
    try {
      deleteTenantSubscriber(deleteConfirmTenant.id);
      setDeleteConfirmTenant(null);
      setApprovalFeedback('Subscriber deleted successfully.');
      setTimeout(() => setApprovalFeedback(null), 4000);
    } finally {
      setIsDeletingTenant(false);
    }
  };

  // Moderator submits action request for approval
  const handleSubmitModeratorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modRequestModal) return;
    if (!modRequestReason.trim()) {
      alert('Please provide a reason or justification for this action.');
      return;
    }

    setIsSubmittingApprovalRequest(true);
    try {
      const res = await requestApprovalAction({
        action_type: modRequestModal.type,
        target_tenant_id: modRequestModal.tenant.id,
        target_tenant_name: modRequestModal.tenant.name,
        requested_by_id: activeModerator?.id || 'mod_user',
        requested_by_name: activeModerator?.name || currentUserName,
        requested_by_role: effectiveRole,
        details: {
          reason: modRequestReason.trim(),
          extension_days: modRequestModal.type === 'EXTEND_SUBSCRIPTION' ? Number(modRequestDays) || 30 : undefined
        }
      });

      if (res.success) {
        setApprovalFeedback('Action request submitted! Awaiting review from Admin, Co-Owner Admin, or Owner Admin.');
        setModRequestModal(null);
        setModRequestReason('');
        setModRequestDays(30);
        setTimeout(() => setApprovalFeedback(null), 5000);
      } else {
        alert(res.message || 'Failed to submit approval request');
      }
    } finally {
      setIsSubmittingApprovalRequest(false);
    }
  };

  // Admin / Co-Owner / Owner Approve action
  const handleApproveAction = async (actionId: string) => {
    setIsProcessingApproval(true);
    try {
      const res = await approveAction(actionId, currentUserName);
      if (res.success) {
        setApprovalFeedback('Action approved and executed successfully.');
        setTimeout(() => setApprovalFeedback(null), 4000);
      } else {
        alert(res.message || 'Approval failed');
      }
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Admin / Co-Owner / Owner Reject action
  const handleConfirmReject = async () => {
    if (!reviewRejectModal) return;
    setIsProcessingApproval(true);
    try {
      const res = await rejectAction(reviewRejectModal.id, currentUserName, rejectionNote.trim() || undefined);
      if (res.success) {
        setApprovalFeedback('Action request rejected.');
        setReviewRejectModal(null);
        setRejectionNote('');
        setTimeout(() => setApprovalFeedback(null), 4000);
      } else {
        alert(res.message || 'Rejection failed');
      }
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Submit Moderator Form
  const handleCreateModerator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModForm.name || !newModForm.username || !newModForm.password) {
      alert('Please fill Name, Username and Password.');
      return;
    }

    addModerator({
      name: newModForm.name,
      username: newModForm.username,
      password: newModForm.password,
      email: newModForm.email,
      phone: newModForm.phone,
      status: 'active',
      owner_role: newModForm.owner_role || 'MODERATOR',
      must_change_password: newModForm.must_change_password,
      permissions: {
        can_manage_subscribers: Boolean(newModForm.can_add_subscribers || newModForm.can_manage_subscriptions),
        can_extend_subscriptions: Boolean(newModForm.can_manage_subscriptions),
        can_manage_pricing: newModForm.owner_role === 'CO_OWNER_ADMIN' || newModForm.owner_role === 'ADMIN',
        can_view_financials: Boolean(newModForm.can_view_financials),
        can_impersonate: newModForm.owner_role === 'CO_OWNER_ADMIN' || newModForm.owner_role === 'ADMIN',
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
      owner_role: 'MODERATOR',
      must_change_password: true,
      can_manage_subscriptions: true,
      can_reset_passwords: true,
      can_add_subscribers: true,
      can_view_financials: true
    });
  };

  return (
    <div className="w-full space-y-6 transition-opacity duration-150">
      {/* Top Banner & Identity Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-slate-700">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>SaaS Master Control Panel (Platform Owner)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {'FuelNest SaaS Platform Master Control • fuelnest.xyz'}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              {'Manage subscriber companies, control access validity (days/months), configure Super Admin credentials, and assign moderators on your behalf.'}
            </p>
          </div>

          {/* Owner Switch Tenant Control, Credentials Badge & Workspace Return Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Switch Active Tenant Selector for Owner */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-amber-500/40 backdrop-blur-xs flex items-center gap-2.5 text-xs shadow-md">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-amber-400/80 text-[10px] font-bold uppercase tracking-wider">
                  {'Switch Active Tenant'}
                </div>
                <select
                  id="saas-owner-tenant-select"
                  value={currentTenant?.id || ''}
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
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 font-bold text-base">
                {effectiveRole === 'OWNER_ADMIN' ? '👑' : effectiveRole === 'CO_OWNER_ADMIN' ? '🤝' : effectiveRole === 'ADMIN' ? '🛡️' : '👮'}
              </div>
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase">
                  {effectiveRole === 'OWNER_ADMIN'
                    ? 'Owner Admin'
                    : effectiveRole === 'CO_OWNER_ADMIN'
                    ? 'Co-Owner Admin'
                    : effectiveRole === 'ADMIN'
                    ? 'Control Admin'
                    : 'Moderator'}
                </div>
                <div className="text-amber-300 font-mono font-bold text-sm">
                  {activeAuthRole === 'saas_owner' ? saasOwner.username : activeModerator?.username || 'moderator'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsSaasControlOpen(false)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
              title={'Go to Fleet Workspace'}
            >
              <span>{'Launch Fleet App'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {approvalFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{approvalFeedback}</span>
          </div>
          <button onClick={() => setApprovalFeedback(null)} className="text-emerald-400/60 hover:text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{'Total Subscribers'}</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {'Registered Companies'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-1">
            <span>{'Active Access'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {'Valid subscriptions'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-semibold mb-1">
            <span>{'Expiring Soon'}</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.expiring}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {'Under 7 days remaining'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-red-600 dark:text-red-400 text-xs font-semibold mb-1">
            <span>{'Expired'}</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {stats.expired}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {'Action needed'}
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
            <span>{'Total Revenue'}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            BDT {stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {'Gross BDT Revenue'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Tab 1: Subscribers */}
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'subscribers'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{'Subscribers & Plans'}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10">
              {allTenants.length}
            </span>
          </button>

          {/* Tab 2: Control Roles & Team */}
          <button
            onClick={() => setActiveTab('moderators')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'moderators'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{'Roles & Team'}</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10">
              {moderators.length + 1}
            </span>
          </button>

          {/* Tab 3: Approvals & Governance Queue */}
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'approvals'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{'Approvals & Governance'}</span>
            {pendingApprovalsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                {pendingApprovalsCount}
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10">
                {approvals.length}
              </span>
            )}
          </button>

          {/* Tab 4: Owner Security - Only visible to Owner Admin & Co-Owner Admin */}
          {canAccessOwnerSecurity && (
            <button
              onClick={() => setActiveTab('owner_profile')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === 'owner_profile'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>{'Owner Security'}</span>
            </button>
          )}

          {/* Tab 5: Payment Gateway */}
          <button
            onClick={() => setActiveTab('gateway')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'gateway'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{'Baniq Pay Gateway'}</span>
          </button>
        </div>

        {/* Action buttons based on active tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'subscribers' && (
            <>
              {/* Requirement 4: Download / Export Subscriber List */}
              <button
                onClick={handleDownloadSubscribersCsv}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0c162d] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all cursor-pointer"
                title="Download complete subscriber list as CSV"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>{'Export CSV List'}</span>
              </button>

              <button
                onClick={() => setIsAddSubscriberModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>{'+ Add Subscriber'}</span>
              </button>
            </>
          )}

          {activeTab === 'moderators' && canManageControlUsers && (
            <button
              onClick={() => setIsAddModeratorModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              <span>{'+ Add Control User'}</span>
            </button>
          )}
        </div>
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
                placeholder={'Search by company name, code, username...'}
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
                <option value="all">{'All Status'}</option>
                <option value="active">{'Active'}</option>
                <option value="expired">{'Expired'}</option>
                <option value="suspended">{'Suspended'}</option>
              </select>

              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-medium"
              >
                <option value="all">{'All Plans'}</option>
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
                            ? ('Suspended')
                            : isExpired
                            ? ('Expired')
                            : isExpiringSoon
                            ? (`${daysRemaining}d Left`)
                            : (`${daysRemaining}d Active`)}
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
                          <span>{'Expires:'}</span>
                        </span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {sub?.end_date || 'N/A'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{'Subscription Price:'}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            BDT {(sub?.price_bdt || 0).toLocaleString()}
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
                          <span>{'Super Admin Login'}</span>
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
                          <span>{'Edit'}</span>
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
                        title={'Launch Tenant Fleet'}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{'Enter Workspace'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (isModerator) {
                            setModRequestModal({ type: 'EXTEND_SUBSCRIPTION', tenant });
                            setModRequestDays(30);
                            setModRequestReason('');
                          } else {
                            setSelectedTenantForExtend(tenant);
                            setIsExtendModalOpen(true);
                          }
                        }}
                        className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-300 font-bold text-xs border border-amber-300 dark:border-amber-800 transition-colors cursor-pointer"
                        title={isModerator ? 'Request Extend Duration (Requires Approval)' : 'Extend Duration'}
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isModerator ? 'Req +Days' : '+Days'}</span>
                      </button>
                    </div>

                    {/* Secondary Row: Quick Actions */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        onClick={() => {
                          if (isModerator) {
                            setModRequestModal({
                              type: isSuspended ? 'UNSUSPEND_TENANT' : 'SUSPEND_TENANT',
                              tenant
                            });
                            setModRequestReason('');
                          } else {
                            setTenantStatus(tenant.id, isSuspended ? 'active' : 'suspended');
                          }
                        }}
                        className={`text-[11px] font-semibold hover:underline cursor-pointer ${
                          isSuspended ? 'text-emerald-600' : 'text-slate-500 hover:text-amber-600'
                        }`}
                      >
                        {isSuspended
                          ? (isModerator ? 'Req Unsuspend' : '✅ Unsuspend Access')
                          : (isModerator ? 'Req Suspend' : '⏸️ Suspend Access')}
                      </button>

                      <button
                        onClick={() => {
                          if (isModerator) {
                            setModRequestModal({
                              type: 'DELETE_SUBSCRIBER',
                              tenant
                            });
                            setModRequestReason('');
                          } else {
                            setDeleteConfirmTenant(tenant);
                          }
                        }}
                        className="text-[11px] font-semibold text-slate-400 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                        title={isModerator ? 'Request Deletion Approval' : 'Delete Subscriber'}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{isModerator ? 'Req Delete' : 'Delete'}</span>
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
                {'No Subscribers Found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {'Try resetting your search or add a new subscriber.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: ROLES & TEAM ================= */}
      {activeTab === 'moderators' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong className="font-bold block text-sm mb-1">
                {'3-Tier Control Panel Role Architecture & Governance:'}
              </strong>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span>👑 Owner Admin & 🤝 Co-Owner Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {'Full master access, direct execution, user creation & management, and Owner Security access.'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <span>🛡️ Control Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {'Full subscriber management & approval authority over moderator requests (no Owner Security access).'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>👮 SaaS Moderator</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {'Can view and request subscriber deletion, duration extension, and suspension (requires Admin/Owner approval).'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Primary Platform Owner Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border-2 border-amber-500/40 shadow-md space-y-4 flex flex-col justify-between text-white">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-white text-base flex items-center gap-2">
                      <span>👑 {saasOwner.name}</span>
                    </h4>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mt-0.5">
                      <span>Platform Owner Admin</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    MASTER OWNER
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="font-mono font-bold text-amber-300">{saasOwner.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-200">{saasOwner.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-slate-200">{saasOwner.phone}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-amber-400/80">Authority Level:</span>
                  <div className="p-2 rounded-lg bg-black/40 text-[11px] text-amber-200">
                    {'Full unrestricted access to all control systems, financial data, team governance, and security profile.'}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-amber-500/20 text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Master Control</span>
              </div>
            </div>

            {/* Other Control Team Members */}
            {moderators.map(mod => {
              const roleTitle =
                mod.owner_role === 'CO_OWNER_ADMIN'
                  ? 'Co-Owner Admin'
                  : mod.owner_role === 'ADMIN'
                  ? 'Control Admin'
                  : 'SaaS Moderator';

              const roleBadgeColor =
                mod.owner_role === 'CO_OWNER_ADMIN'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-400/50'
                  : mod.owner_role === 'ADMIN'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-400/50'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-400/50';

              return (
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
                        <div className="flex items-center gap-1.5 text-xs font-bold mt-0.5">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleBadgeColor}`}>
                            {mod.owner_role === 'CO_OWNER_ADMIN' ? '🤝 ' : mod.owner_role === 'ADMIN' ? '🛡️ ' : '👮 '}
                            {roleTitle}
                          </span>
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
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Password:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 dark:text-white">{mod.password}</span>
                          {mod.must_change_password ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-bold border border-amber-500/20" title="Must change password on login">
                              Reset Required
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold border border-emerald-500/20" title="Password is set">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                      {mod.phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <span className="text-slate-700 dark:text-slate-300">{mod.phone}</span>
                        </div>
                      )}
                      {mod.email && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="text-slate-700 dark:text-slate-300">{mod.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Authority Summary */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Authority & Scope:</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {mod.owner_role === 'CO_OWNER_ADMIN'
                          ? 'Full access, user creation, approves requests, and accesses Owner Security.'
                          : mod.owner_role === 'ADMIN'
                          ? 'Full subscriber operations & approves requests. Restricted from Owner Security.'
                          : 'Subscriber delete, duration extend, and suspend actions require Admin/Owner approval.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    {canManageControlUsers ? (
                      <>
                        <button
                          onClick={() => {
                            updateModerator(mod.id, {
                              status: mod.status === 'active' ? 'suspended' : 'active'
                            });
                          }}
                          className={`text-[11px] font-semibold cursor-pointer ${
                            mod.status === 'active' ? 'text-slate-500 hover:text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {mod.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => {
                            updateModerator(mod.id, {
                              must_change_password: !mod.must_change_password
                            });
                          }}
                          className="text-[11px] text-amber-600 hover:underline cursor-pointer"
                          title="Toggle force password change on next login"
                        >
                          {mod.must_change_password ? 'Clear PW Mandate' : 'Force PW Reset'}
                        </button>

                        <button
                          onClick={() => setDeleteConfirmMod(mod)}
                          className="text-[11px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        {'Managed by Owner/Co-Owner'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: APPROVALS & GOVERNANCE ================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
              <strong className="font-bold block text-sm mb-1">
                {'Dual-Control Governance & Sensitive Action Approval Queue:'}
              </strong>
              <p>
                {'Moderators can request critical operations (Subscriber Deletion, Subscription Extension, Suspension/Unsuspension). These actions require explicit approval from an Admin, Co-Owner Admin, or Owner Admin to ensure platform security.'}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2">
            {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(filter => {
              const count =
                filter === 'all'
                  ? approvals.length
                  : filter === 'PENDING'
                  ? pendingApprovalsCount
                  : approvals.filter(a => a.status === filter).length;

              const label =
                filter === 'all'
                  ? 'ALL'
                  : filter;

              return (
                <button
                  key={filter}
                  onClick={() => setApprovalFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    approvalFilter === filter
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Approval Cards List */}
          <div className="space-y-3">
            {filteredApprovals.map(action => {
              const actionLabel =
                action.action_type === 'DELETE_SUBSCRIBER'
                  ? 'Delete Subscriber'
                  : action.action_type === 'EXTEND_SUBSCRIPTION'
                  ? `Extend Subscription (+${action.details?.extension_days || 30} Days)`
                  : action.action_type === 'SUSPEND_TENANT'
                  ? 'Suspend Subscriber'
                  : 'Unsuspend Subscriber';

              const actionBadgeColor =
                action.action_type === 'DELETE_SUBSCRIBER'
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                  : action.action_type === 'EXTEND_SUBSCRIPTION'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  : action.action_type === 'SUSPEND_TENANT'
                  ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

              const statusBadgeColor =
                action.status === 'PENDING'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-400/40 animate-pulse'
                  : action.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-400/40'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 border-red-400/40';

              return (
                <div
                  key={action.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${actionBadgeColor}`}>
                        {actionLabel}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeColor}`}>
                        {action.status === 'PENDING' ? '⏳ PENDING REVIEW' : action.status}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      Target Company:{' '}
                      <span className="text-amber-600 dark:text-amber-400">{action.target_tenant_name}</span>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Requested by: <strong className="text-slate-700 dark:text-slate-300">{action.requested_by_name}</strong> ({action.requested_by_role})
                      </span>
                      <span>•</span>
                      <span>{new Date(action.created_at).toLocaleString()}</span>
                    </div>

                    {action.details?.reason && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                        <strong className="text-slate-500">Justification:</strong> "{action.details.reason}"
                      </div>
                    )}

                    {action.reviewed_by && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Reviewed by: <strong className="text-slate-700 dark:text-slate-300">{action.reviewed_by}</strong> on {action.reviewed_at ? new Date(action.reviewed_at).toLocaleString() : ''}
                        {action.details?.rejection_note && (
                          <div className="text-red-500 dark:text-red-400 mt-0.5 font-medium">
                            Note: "{action.details.rejection_note}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions for PENDING */}
                  {action.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      {canApproveRequests ? (
                        <>
                          <button
                            onClick={() => handleApproveAction(action.id)}
                            disabled={isProcessingApproval}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{'Approve & Execute'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setReviewRejectModal(action);
                              setRejectionNote('');
                            }}
                            disabled={isProcessingApproval}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{'Reject'}</span>
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
                          {'⏳ Awaiting Admin Approval'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredApprovals.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#0c162d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                  {'No Approval Requests Found'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {'Any sensitive actions requested by moderators will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: OWNER SECURITY & PROFILE ================= */}
      {activeTab === 'owner_profile' && (
        <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-md space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 text-2xl font-black">
              👑
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {'SaaS Owner Profile & Security'}
              </h3>
              <p className="text-xs text-slate-500">
                {'Update your SaaS Master credentials anytime from this secure screen.'}
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
                  {'Owner Username'} *
                </label>
                <input
                  type="text"
                  required
                  value={ownerUsernameInput}
                  onChange={e => setOwnerUsernameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {'Default: mashudalone'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {'Owner Password'} *
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
                  {'Default: 00000'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {'Display Name'}
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
                  {'Email'}
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
                {'Phone Number'}
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
                {'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= TAB 4: BANIQ PAY GATEWAY & WEBHOOK ================= */}
      {activeTab === 'gateway' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Overview Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Baniq Pay Payment Automation
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active Integration
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automated bKash, Nagad, Rocket & Bank payment verification with instant tenant provisioning
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Currency: BDT
                </span>
              </div>
            </div>

            {/* Webhook Configuration Box */}
            <div className="mt-6 p-5 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase">
                    Your Webhook URL
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    (Paste this in your Baniq Pay merchant dashboard)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/baniq-pay/webhook`;
                    navigator.clipboard?.writeText(url);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2500);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all"
                >
                  {copiedWebhook ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Webhook URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-xs text-amber-600 dark:text-amber-400 break-all select-all">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}/api/baniq-pay/webhook`}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                <span><strong>HTTP Method:</strong> POST</span>
                <span>•</span>
                <span><strong>Payload Type:</strong> JSON</span>
                <span>•</span>
                <span><strong>Authentication:</strong> X-API-KEY / X-API-SECRET Header</span>
              </div>
            </div>

            {/* Credentials Status Grid */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  API Base URL
                </div>
                <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  https://api.baniqpay.com
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Default Production Host
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Baniq API Key
                </div>
                <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                  BANIQ_PAY_API_KEY
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Configured in environment (.env)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Baniq API Secret
                </div>
                <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                  BANIQ_PAY_API_SECRET
                </div>
                <div className="text-[10px] text-slate-500 mt-2">
                  Secures incoming webhook verification
                </div>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="mt-6 p-5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
              <h4 className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>How Baniq Pay Works with FuelNest (Setup Guide)</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <li>
                  <strong>Log in to Baniq Pay Merchant Dashboard:</strong> Navigate to your Baniq Pay account and open Developer / API Settings.
                </li>
                <li>
                  <strong>Configure Webhook URL:</strong> Copy the <code>/api/baniq-pay/webhook</code> URL from the box above and paste it into the Webhook Endpoint URL field in Baniq Pay.
                </li>
                <li>
                  <strong>Set API Credentials:</strong> Obtain your API Key and Secret from Baniq Pay and ensure they are populated in your server environment (<code>BANIQ_PAY_API_KEY</code> & <code>BANIQ_PAY_API_SECRET</code>).
                </li>
                <li>
                  <strong>Automated Provisioning:</strong> When a subscriber completes payment via bKash, Nagad, Rocket, or Bank Transfer, the webhook immediately activates their workspace, creates the Super Admin credentials, and sends confirmation notifications automatically!
                </li>
              </ol>
            </div>

            {/* Webhook Tester Simulator */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Simulate Baniq Pay Webhook Event
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Test the automated subscriber creation workflow without making a real money transaction.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={webhookTestLoading}
                  onClick={async () => {
                    setWebhookTestLoading(true);
                    setWebhookTestResult(null);
                    try {
                      const res = await fetch('/api/baniq-pay/simulate-success', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          company_name: `Baniq Fleet ${Math.floor(Math.random() * 900 + 100)} Ltd`,
                          admin_name: 'Baniq Test Admin',
                          email: 'subscriber@example.com',
                          phone: '+880 1712-345678',
                          plan_id: 'starter',
                          max_vehicles: 5,
                          custom_price: 1500
                        })
                      });
                      const data = await res.json();
                      if (data.success) {
                        setWebhookTestResult(`Success! Created Tenant "${data.tenant?.name}" with username "${data.super_admin_username}" & temporary password "${data.temporary_password}".`);
                      } else {
                        setWebhookTestResult(`Failed: ${data.message || 'Error occurred'}`);
                      }
                    } catch (err: any) {
                      setWebhookTestResult(`Error: ${err?.message || 'Connection failed'}`);
                    } finally {
                      setWebhookTestLoading(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${webhookTestLoading ? 'animate-spin' : ''}`} />
                  <span>{webhookTestLoading ? 'Simulating...' : 'Send Test Webhook'}</span>
                </button>
              </div>

              {webhookTestResult && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
                  {webhookTestResult}
                </div>
              )}
            </div>
          </div>
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
                  {'Onboard New Subscriber Company'}
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
                  1. Company & Organization Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Meghna Logistics Ltd"
                      value={newSubForm.name}
                      onChange={e => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unique Tenant Code *
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
                      Contact Person Name
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
                      Phone Number *
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
                  2. Subscription Plan & Validity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Select Plan
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
                      <option value="starter">Starter (Up to 50 Vehicles)</option>
                      <option value="professional">Professional (Up to 200 Vehicles)</option>
                      <option value="enterprise">Enterprise (Unlimited Vehicles)</option>
                      <option value="custom">Custom Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Duration Period
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={newSubForm.duration_type}
                        onChange={e => setNewSubForm(prev => ({ ...prev, duration_type: e.target.value as any }))}
                        className="w-1/2 px-2 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                      >
                        <option value="days">Days</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
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
                      Price (BDT) & Payment
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
                    3. Super Admin Account (Login Credentials)
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const randomPass = Math.random().toString(36).slice(-6) + '@ff';
                      setNewSubForm(prev => ({ ...prev, super_admin_password: randomPass }));
                    }}
                    className="text-[11px] text-amber-600 font-bold hover:underline"
                  >
                    🎲 Generate Random Password
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Super Admin Username *
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
                      Login Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter strong password"
                      value={newSubForm.super_admin_password}
                      onChange={e => setNewSubForm(prev => ({ ...prev, super_admin_password: e.target.value }))}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                    />
                    <label className="mt-2 flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newSubForm.must_change_password}
                        onChange={e => setNewSubForm(prev => ({ ...prev, must_change_password: e.target.checked }))}
                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 border-slate-300 dark:border-slate-600"
                      />
                      <span>Force password change on first login</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddSubscriberModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all hover:scale-105"
                >
                  Onboard Subscriber Company
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
                {'Extend Subscription Duration'}
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
                Current Expiry: <span className="font-mono font-bold text-amber-600">{selectedTenantForExtend.subscription?.end_date}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                How many days to extend? (Additional Days)
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
                    +{days >= 30 ? `${Math.round(days / 30)} Months` : `${days} Days`}
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
                  placeholder="Enter custom days count"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsExtendModalOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExtend}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md"
              >
                Confirm Extension (+{extendDaysVal} Days)
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
                {'Edit Super Admin Credentials'}
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
                  Login Username *
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
                  New Password *
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
                Cancel
              </button>
              <button
                onClick={handleSaveCredentials}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md"
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CONTROL USER / MODERATOR ================= */}
      {isAddModeratorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {'Add Control User / Moderator'}
              </h3>
              <button onClick={() => setIsAddModeratorModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateModerator} className="space-y-3">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Assign System Role *
                </label>
                <select
                  value={newModForm.owner_role}
                  onChange={e => setNewModForm(prev => ({ ...prev, owner_role: e.target.value as OwnerRole }))}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-600/50 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white"
                >
                  <option value="MODERATOR">👮 SaaS Moderator (Sensitive actions require approval)</option>
                  <option value="ADMIN">🛡️ Control Admin (Full subscriber control & approvals)</option>
                  <option value="CO_OWNER_ADMIN">🤝 Co-Owner Admin (Full access & user management)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {newModForm.owner_role === 'CO_OWNER_ADMIN'
                    ? 'Co-Owner Admin has equal authority to create users and access Owner Security.'
                    : newModForm.owner_role === 'ADMIN'
                    ? 'Admin has full operations and approval authority, but cannot access Owner Security.'
                    : 'Moderators can submit action requests for Subscriber deletion, extension, and suspension.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kamrul Hasan"
                  value={newModForm.name}
                  onChange={e => setNewModForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="user_kamrul"
                    value={newModForm.username}
                    onChange={e => setNewModForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="pass1234"
                    value={newModForm.password}
                    onChange={e => setNewModForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-semibold cursor-pointer bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={newModForm.must_change_password}
                    onChange={e => setNewModForm(prev => ({ ...prev, must_change_password: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 border-slate-300 dark:border-slate-600"
                  />
                  <span>Force password change on first login</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
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
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="user@control.com"
                    value={newModForm.email}
                    onChange={e => setNewModForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Permission Checkboxes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                  Permissions & Capabilities:
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newModForm.can_manage_subscriptions}
                    onChange={e => setNewModForm(prev => ({ ...prev, can_manage_subscriptions: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span>Manage Subscription Duration & Status</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newModForm.can_reset_passwords}
                    onChange={e => setNewModForm(prev => ({ ...prev, can_reset_passwords: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span>Reset Client Super Admin Password</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newModForm.can_add_subscribers}
                    onChange={e => setNewModForm(prev => ({ ...prev, can_add_subscribers: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                  />
                  <span>Onboard New Subscribers / Sales</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModeratorModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Confirm Appoint User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM DELETE SUBSCRIBER ================= */}
      {deleteConfirmTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-red-300 dark:border-red-900/60 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {'Confirm Subscriber Deletion'}
                </h3>
                <p className="text-xs text-slate-500">
                  {'Permanent cascade removal across all platform databases'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-xs space-y-2">
              <div className="font-bold text-red-950 dark:text-red-200">
                Are you sure you want to delete <span className="underline">{deleteConfirmTenant.name}</span> ({deleteConfirmTenant.code})?
              </div>
              <p className="text-red-700 dark:text-red-300 text-[11px] leading-relaxed">
                This will permanently delete this subscriber company, all associated user accounts, vehicles, fuel stock, filling stations, pumps, and transactions. This operation cannot be undone.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTenant(null)}
                disabled={isDeletingTenant}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteTenant}
                disabled={isDeletingTenant}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingTenant ? 'Deleting Cascade...' : 'Yes, Delete Subscriber'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRM DELETE CONTROL USER ================= */}
      {deleteConfirmMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-red-300 dark:border-red-900/60 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {'Remove Control User'}
                </h3>
                <p className="text-xs text-slate-500">
                  {'Revoke system credentials and access rights'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {deleteConfirmMod.name} (@{deleteConfirmMod.username})
              </div>
              <div className="text-slate-500 text-[11px]">
                Role: {deleteConfirmMod.owner_role}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMod(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteModerator(deleteConfirmMod.id);
                  setDeleteConfirmMod(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Remove User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MODERATOR ACTION APPROVAL REQUEST ================= */}
      {modRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-600/50 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {modRequestModal.type === 'DELETE_SUBSCRIBER'
                    ? 'Request Subscriber Deletion'
                    : modRequestModal.type === 'EXTEND_SUBSCRIPTION'
                    ? 'Request Subscription Extension'
                    : modRequestModal.type === 'SUSPEND_TENANT'
                    ? 'Request Access Suspension'
                    : 'Request Access Unsuspension'}
                </h3>
              </div>
              <button onClick={() => setModRequestModal(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs space-y-1">
              <div className="font-bold text-amber-900 dark:text-amber-200">
                Target: {modRequestModal.tenant.name} ({modRequestModal.tenant.code})
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                {'As a SaaS Moderator, this sensitive action will be forwarded to an Admin, Co-Owner Admin, or Owner Admin for verification & approval.'}
              </p>
            </div>

            <form onSubmit={handleSubmitModeratorRequest} className="space-y-3">
              {modRequestModal.type === 'EXTEND_SUBSCRIPTION' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Extension Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={modRequestDays}
                    onChange={e => setModRequestDays(Number(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Justification / Reason for Request *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this action is necessary (e.g., Client requested cancellation via email / offline cash payment confirmed)..."
                  value={modRequestReason}
                  onChange={e => setModRequestReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModRequestModal(null)}
                  disabled={isSubmittingApprovalRequest}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApprovalRequest}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingApprovalRequest ? 'Submitting...' : 'Submit Request for Approval'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REJECT APPROVAL REQUEST ================= */}
      {reviewRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] rounded-2xl shadow-2xl border border-red-300 dark:border-red-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {'Reject Action Request'}
              </h3>
              <button onClick={() => setReviewRejectModal(null)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              You are rejecting the request to <strong>{reviewRejectModal.action_type}</strong> for{' '}
              <strong>{reviewRejectModal.target_tenant_name}</strong> submitted by {reviewRejectModal.requested_by_name}.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Rejection Note / Feedback (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="State reason for rejecting this request..."
                value={rejectionNote}
                onChange={e => setRejectionNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewRejectModal(null)}
                disabled={isProcessingApproval}
                className="px-4 py-2 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessingApproval}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isProcessingApproval ? 'Processing...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
