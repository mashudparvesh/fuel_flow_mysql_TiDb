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
  X,
  UserCheck,
  Globe,
  Palette,
  Video
} from 'lucide-react';
import { CmsContentManager } from './CmsContentManager';

export type SaasOwnerTabType =
  | 'subscribers'
  | 'registrations'
  | 'moderators'
  | 'approvals'
  | 'owner_profile'
  | 'packages'
  | 'gateway'
  | 'email'
  | 'cms_pages'
  | 'branding'
  | 'promo_video';

export const SaasOwnerPanel: React.FC<{
  onOpenCompanyUserManagement?: () => void;
  onSwitchToFleetView?: () => void;
  initialTab?: SaasOwnerTabType;
  onTabChange?: (tab: SaasOwnerTabType) => void;
}> = ({ onOpenCompanyUserManagement, onSwitchToFleetView, initialTab = 'subscribers', onTabChange }) => {
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
    rejectAction,
    refreshTenantsFromServer,
    refreshUsersFromServer,
    subscriptionPayments,
    fetchSubscriptionPayments,
    approveSubscriptionPayment,
    rejectSubscriptionPayment
  } = useApp();

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  useEffect(() => {
    refreshTenantsFromServer?.();
    refreshUsersFromServer?.();
    fetchSubscriptionPayments?.();
  }, []);

  const [paymentActionLoadingId, setPaymentActionLoadingId] = useState<string | null>(null);
  const [paymentRejectModalItem, setPaymentRejectModalItem] = useState<any | null>(null);
  const [paymentRejectReason, setPaymentRejectReason] = useState<string>('TrxID could not be matched with bank/MFS statement');
  const [paymentTrxCopiedId, setPaymentTrxCopiedId] = useState<string | null>(null);

  const pendingPaymentsCount = useMemo(() => {
    return (subscriptionPayments || []).filter(p => p.status === 'pending').length;
  }, [subscriptionPayments]);

  const handleApprovePayment = async (paymentId: string) => {
    setPaymentActionLoadingId(paymentId);
    try {
      const res = await approveSubscriptionPayment(paymentId, saasOwner.name || 'Master Admin');
      if (res.success) {
        setActionFeedbackMsg({
          type: 'success',
          text: res.message || 'Payment verified & subscription validity extended!'
        });
        await refreshTenantsFromServer?.();
        await fetchSubscriptionPayments?.();
      } else {
        setActionFeedbackMsg({
          type: 'error',
          text: res.message || 'Failed to approve payment'
        });
      }
    } catch (e: any) {
      setActionFeedbackMsg({
        type: 'error',
        text: e?.message || 'Error approving payment'
      });
    } finally {
      setPaymentActionLoadingId(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!paymentRejectModalItem) return;
    setPaymentActionLoadingId(paymentRejectModalItem.id);
    try {
      const res = await rejectSubscriptionPayment(paymentRejectModalItem.id, paymentRejectReason, saasOwner.name || 'Master Admin');
      if (res.success) {
        setActionFeedbackMsg({
          type: 'success',
          text: 'Payment verification marked as rejected.'
        });
        setPaymentRejectModalItem(null);
        await fetchSubscriptionPayments?.();
      } else {
        setActionFeedbackMsg({
          type: 'error',
          text: res.message || 'Failed to reject payment'
        });
      }
    } catch (e: any) {
      setActionFeedbackMsg({
        type: 'error',
        text: e?.message || 'Error rejecting payment'
      });
    } finally {
      setPaymentActionLoadingId(null);
    }
  };

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    await Promise.all([
      refreshTenantsFromServer?.(),
      refreshUsersFromServer?.()
    ]);
    setTimeout(() => setIsManualRefreshing(false), 400);
  };

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
  const [activeTab, setActiveTab] = useState<SaasOwnerTabType>(initialTab);

  const changeTab = (tab: SaasOwnerTabType) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Sync if initialTab prop changes
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Enforce access control if tab is restricted
  useEffect(() => {
    if (activeTab === 'owner_profile' && !canAccessOwnerSecurity) {
      setActiveTab('subscribers');
    }
  }, [activeTab, canAccessOwnerSecurity]);

  // Registration Requests (New User Approvals Workflow)
  const [registrationRequests, setRegistrationRequests] = useState<any[]>([]);
  const [regRequestsLoading, setRegRequestsLoading] = useState(false);
  const [regFilter, setRegFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [regSearchTerm, setRegSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedApprovalModalData, setSelectedApprovalModalData] = useState<any | null>(null);
  const [copiedEmailText, setCopiedEmailText] = useState(false);
  const [copiedCredsModal, setCopiedCredsModal] = useState(false);
  const [sendingEmailDirectly, setSendingEmailDirectly] = useState(false);
  const [directEmailResult, setDirectEmailResult] = useState<any | null>(null);
  const [actionFeedbackMsg, setActionFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // In-app modal for rejecting registration request (replaces window.prompt)
  const [rejectModalItem, setRejectModalItem] = useState<any | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('Information incomplete or payment unverified');

  // In-app modal for deleting registration request (replaces window.confirm)
  const [deleteRegModalItem, setDeleteRegModalItem] = useState<any | null>(null);

  const fetchRegistrationRequests = async () => {
    try {
      setRegRequestsLoading(true);
      const res = await fetch('/api/subscribers/registration-requests');
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        setRegistrationRequests(data.requests);
      }
    } catch (err) {
      console.warn('Failed to fetch registration requests:', err);
    } finally {
      setRegRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrationRequests();

    // Automatic real-time polling every 4 seconds so new registrations appear instantly
    const interval = setInterval(() => {
      fetchRegistrationRequests();
    }, 4000);

    const handleWindowFocus = () => {
      fetchRegistrationRequests();
      refreshTenantsFromServer?.();
    };
    window.addEventListener('focus', handleWindowFocus);

    try {
      const ch = new BroadcastChannel('fuelflow_tenants_sync');
      ch.onmessage = (event) => {
        if (event.data?.type === 'NEW_REGISTRATION' || event.data?.type === 'REFRESH_TENANTS') {
          fetchRegistrationRequests();
          refreshTenantsFromServer?.();
        }
      };
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleWindowFocus);
        ch.close();
      };
    } catch (e) {
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', handleWindowFocus);
      };
    }
  }, []);

  const pendingRegRequestsCount = useMemo(() => {
    return registrationRequests.filter(r => r.status === 'pending').length;
  }, [registrationRequests]);

  const handleApproveRegistration = async (reqItem: any) => {
    try {
      setActionLoadingId(reqItem.id);
      const res = await fetch(`/api/subscribers/registration-requests/${reqItem.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: currentUserName })
      });
      const data = await res.json();
      setActionLoadingId(null);

      if (data.success) {
        // Refresh tenants and users across the platform
        await refreshTenantsFromServer?.();
        await refreshUsersFromServer?.();
        await fetchRegistrationRequests();

        try {
          const ch = new BroadcastChannel('fuelflow_tenants_sync');
          ch.postMessage({ type: 'REFRESH_TENANTS' });
          ch.postMessage({ type: 'REFRESH_USERS' });
          ch.close();
        } catch (e) {}

        setActionFeedbackMsg({
          text: `Workspace for "${reqItem.company_name}" has been approved and activated!`,
          type: 'success'
        });
        setTimeout(() => setActionFeedbackMsg(null), 5000);

        // Open Credentials & Email modal for immediate manual email dispatch
        setSelectedApprovalModalData({
          ...reqItem,
          ...data.request,
          super_admin_username: data.super_admin_username,
          temporary_password: data.temporary_password,
          login_url: data.login_url || 'https://fuelnest.xyz/login'
        });
        setDirectEmailResult(null);
      } else {
        setActionFeedbackMsg({
          text: data.message || 'Failed to approve registration.',
          type: 'error'
        });
        setTimeout(() => setActionFeedbackMsg(null), 5000);
      }
    } catch (err: any) {
      setActionLoadingId(null);
      setActionFeedbackMsg({
        text: err?.message || 'Error occurred while approving registration.',
        type: 'error'
      });
      setTimeout(() => setActionFeedbackMsg(null), 5000);
    }
  };

  const handleConfirmRejectRegistration = async () => {
    if (!rejectModalItem) return;
    const reqId = rejectModalItem.id;
    const reason = rejectReasonText.trim() || 'Information incomplete or payment unverified';

    try {
      setActionLoadingId(reqId);
      const res = await fetch(`/api/subscribers/registration-requests/${reqId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      setActionLoadingId(null);
      setRejectModalItem(null);
      if (data.success) {
        fetchRegistrationRequests();
        setActionFeedbackMsg({
          text: `Registration request for "${rejectModalItem.company_name}" rejected.`,
          type: 'success'
        });
        setTimeout(() => setActionFeedbackMsg(null), 5000);
      } else {
        setActionFeedbackMsg({
          text: data.message || 'Failed to reject registration.',
          type: 'error'
        });
        setTimeout(() => setActionFeedbackMsg(null), 5000);
      }
    } catch (err: any) {
      setActionLoadingId(null);
      setRejectModalItem(null);
      setActionFeedbackMsg({
        text: err?.message || 'Error occurred while rejecting request.',
        type: 'error'
      });
      setTimeout(() => setActionFeedbackMsg(null), 5000);
    }
  };

  const handleConfirmDeleteRegistration = async () => {
    if (!deleteRegModalItem) return;
    const reqId = deleteRegModalItem.id;
    try {
      setActionLoadingId(reqId);
      const res = await fetch(`/api/subscribers/registration-requests/${reqId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      setActionLoadingId(null);
      setDeleteRegModalItem(null);
      if (data.success) {
        fetchRegistrationRequests();
        setActionFeedbackMsg({
          text: 'Registration request deleted successfully.',
          type: 'success'
        });
        setTimeout(() => setActionFeedbackMsg(null), 4000);
      }
    } catch (err) {
      setActionLoadingId(null);
      setDeleteRegModalItem(null);
    }
  };

  const handleSendDirectEmail = async (id: string) => {
    try {
      setSendingEmailDirectly(true);
      setDirectEmailResult(null);
      const res = await fetch(`/api/subscribers/registration-requests/${id}/send-email`, {
        method: 'POST'
      });
      const data = await res.json();
      setSendingEmailDirectly(false);
      setDirectEmailResult(data.email_status || { error: 'Unknown response' });
      fetchRegistrationRequests();
    } catch (err: any) {
      setSendingEmailDirectly(false);
      setDirectEmailResult({ delivered: false, error: err?.message || 'Failed to send' });
    }
  };

  // Dedicated Master Control Unsuspend & Activate Handler (Available to SaaS Owner, Admin & Moderator)
  const handleUnsuspendAndActivate = async (tenant: any) => {
    if (!tenant) return;
    try {
      setActionLoadingId(tenant.id);
      const res = await fetch(`/api/tenants/${tenant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' })
      });
      const data = await res.json();
      setActionLoadingId(null);

      // Local state update
      setTenantStatus(tenant.id, 'active');
      await Promise.all([
        refreshTenantsFromServer?.(),
        refreshUsersFromServer?.(),
        fetchRegistrationRequests()
      ]);

      try {
        const ch = new BroadcastChannel('fuelflow_tenants_sync');
        ch.postMessage({ type: 'REFRESH_TENANTS' });
        ch.postMessage({ type: 'REFRESH_USERS' });
        ch.close();
      } catch (e) {}

      // Find matching registration request if available to get credentials
      const matchingReq = registrationRequests.find(r => r.tenant_id === tenant.id || r.company_name?.toLowerCase() === tenant.name?.toLowerCase());
      const sub = tenant.subscription;
      const uname = matchingReq?.super_admin_username || sub?.super_admin_username || data.super_admin_username || `admin_${tenant.code.toLowerCase()}`;
      const pass = matchingReq?.temporary_password || sub?.super_admin_password || data.temporary_password || `${tenant.code}@12345`;

      // Open Credentials Modal immediately with full 1-click tools
      setSelectedApprovalModalData({
        id: tenant.id,
        company_name: tenant.name,
        admin_name: tenant.contact_person,
        email: tenant.email,
        phone: tenant.phone,
        plan_name: sub?.plan_name_bn || sub?.plan || matchingReq?.plan_name || 'Standard Plan',
        super_admin_username: uname,
        temporary_password: pass,
        login_url: 'https://fuelnest.xyz/login'
      });
      setDirectEmailResult(null);

      setActionFeedbackMsg({
        text: `Workspace for "${tenant.name}" has been unsuspended and activated! Access is now active.`,
        type: 'success'
      });
      setTimeout(() => setActionFeedbackMsg(null), 5000);
    } catch (err: any) {
      setActionLoadingId(null);
      setActionFeedbackMsg({
        text: err?.message || 'Error occurred while unsuspending workspace.',
        type: 'error'
      });
      setTimeout(() => setActionFeedbackMsg(null), 5000);
    }
  };

  // Dedicated Master Control Direct Plan Approval Handler (Available to SaaS Owner, Admin & Moderator)
  const handleApproveTenantPlan = async (tenant: any) => {
    if (!tenant) return;
    try {
      setActionLoadingId(tenant.id);
      const res = await fetch(`/api/tenants/${tenant.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: currentUserName })
      });
      const data = await res.json();
      setActionLoadingId(null);

      // Local state update
      setTenantStatus(tenant.id, 'active');
      await Promise.all([
        refreshTenantsFromServer?.(),
        refreshUsersFromServer?.(),
        fetchRegistrationRequests()
      ]);

      try {
        const ch = new BroadcastChannel('fuelflow_tenants_sync');
        ch.postMessage({ type: 'REFRESH_TENANTS' });
        ch.postMessage({ type: 'REFRESH_USERS' });
        ch.close();
      } catch (e) {}

      // Find matching registration request if available to get credentials
      const matchingReq = registrationRequests.find(r => r.tenant_id === tenant.id || r.company_name?.toLowerCase() === tenant.name?.toLowerCase());
      const sub = tenant.subscription;
      const uname = matchingReq?.super_admin_username || sub?.super_admin_username || data.user?.username || `admin_${(tenant.code || '').toLowerCase()}`;
      const pass = matchingReq?.temporary_password || sub?.super_admin_password || `${tenant.code || 'User'}@12345`;

      // Open Credentials Modal immediately with full 1-click tools
      setSelectedApprovalModalData({
        id: tenant.id,
        company_name: tenant.name,
        admin_name: tenant.contact_person,
        email: tenant.email,
        phone: tenant.phone,
        plan_name: sub?.plan_name_bn || sub?.plan || matchingReq?.plan_name || 'Standard Plan',
        super_admin_username: uname,
        temporary_password: pass,
        login_url: 'https://fuelnest.xyz/login'
      });
      setDirectEmailResult(null);

      setActionFeedbackMsg({
        text: `Plan approved for "${tenant.name}"! Workspace is now ACTIVE and login access is enabled.`,
        type: 'success'
      });
      setTimeout(() => setActionFeedbackMsg(null), 5000);
    } catch (err: any) {
      setActionLoadingId(null);
      setActionFeedbackMsg({
        text: err?.message || 'Error occurred while approving plan.',
        type: 'error'
      });
      setTimeout(() => setActionFeedbackMsg(null), 5000);
    }
  };

  const handleSuspendTenant = async (tenant: any) => {
    if (!tenant) return;
    try {
      setActionLoadingId(tenant.id);
      await fetch(`/api/tenants/${tenant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'suspended' })
      });
      setActionLoadingId(null);
      setTenantStatus(tenant.id, 'suspended');
      await Promise.all([
        refreshTenantsFromServer?.(),
        refreshUsersFromServer?.()
      ]);

      try {
        const ch = new BroadcastChannel('fuelflow_tenants_sync');
        ch.postMessage({ type: 'REFRESH_TENANTS' });
        ch.postMessage({ type: 'REFRESH_USERS' });
        ch.close();
      } catch (e) {}

      setActionFeedbackMsg({
        text: `Workspace for "${tenant.name}" has been suspended.`,
        type: 'success'
      });
      setTimeout(() => setActionFeedbackMsg(null), 4000);
    } catch (err: any) {
      setActionLoadingId(null);
      setActionFeedbackMsg({
        text: err?.message || 'Error suspending workspace.',
        type: 'error'
      });
    }
  };

  // Email & SMTP configuration states
  const [emailConfig, setEmailConfig] = useState<any>({
    smtp_enabled: false,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_secure: true,
    smtp_user: 'admin.fuelnest@gmail.com',
    smtp_pass: '',
    smtp_pass_configured: false,
    smtp_from: 'FuelNest Intelligence <admin.fuelnest@gmail.com>',
    resend_active: false,
    resend_from: 'FuelNest <admin.fuelnest@gmail.com>',
    verified_domain: 'fuelnest.xyz',
    owner_email: 'admin.fuelnest@gmail.com'
  });
  const [emailConfigLoading, setEmailConfigLoading] = useState(false);
  const [emailConfigSaving, setEmailConfigSaving] = useState(false);
  const [emailConfigMessage, setEmailConfigMessage] = useState<{ text: string; isError?: boolean } | null>(null);
  const [emailTestRecipient, setEmailTestRecipient] = useState('prematraders542@gmail.com');
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<any>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [emailLogsLoading, setEmailLogsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'email') {
      setEmailConfigLoading(true);
      fetch('/api/email/config')
        .then(r => r.json())
        .then(data => {
          if (data.success && data.config) {
            setEmailConfig((prev: any) => ({ ...prev, ...data.config, smtp_pass: '' }));
          }
        })
        .catch(err => console.warn('Failed to fetch email config:', err))
        .finally(() => setEmailConfigLoading(false));

      setEmailLogsLoading(true);
      fetch('/api/email/logs')
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.logs)) {
            setEmailLogs(data.logs);
          }
        })
        .catch(err => console.warn('Failed to fetch email logs:', err))
        .finally(() => setEmailLogsLoading(false));
    }
  }, [activeTab]);

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
    plan: 'plan_1month' as SubscriptionPlan,
    duration_type: 'months' as 'days' | 'months' | 'years',
    duration_val: 1,
    price_bdt: 749,
    payment_status: 'paid' as 'paid' | 'partial' | 'due',
    max_vehicles: 100,
    max_users: 25,
    max_pumps: 15,
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
      if (!t) return false;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (t.name || '').toLowerCase().includes(q) ||
        (t.code || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q) ||
        (t.contact_person || '').toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q) ||
        ((t.subscription?.super_admin_username || '').toLowerCase().includes(q));

      const isPending = t.status === 'pending' || t.subscription?.status === 'pending' || t.is_approved === false;
      const isSusp = !isPending && (t.status === 'suspended' || t.subscription?.status === 'suspended');
      const subStatus = isPending ? 'pending' : (isSusp ? 'suspended' : (t.subscription?.status || t.status || 'active'));
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'suspended' && isSusp) ||
        (((statusFilter as string) === 'pending_approval' || (statusFilter as string) === 'pending') && isPending) ||
        (statusFilter === 'active' && !isPending && !isSusp && subStatus === 'active') ||
        subStatus === statusFilter;
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
    let suspended = 0;
    let pending = 0;
    let totalRevenue = 0;

    allTenants.forEach(t => {
      const sub = t.subscription;
      const isPending = t.status === 'pending' || sub?.status === 'pending' || t.is_approved === false;
      const isSusp = !isPending && (t.status === 'suspended' || sub?.status === 'suspended');
      if (isPending) {
        pending++;
      } else if (isSusp) {
        suspended++;
      } else {
        if (sub) {
          totalRevenue += Number(sub.price_bdt) || 0;
          const days = getDaysRemaining(sub.end_date);
          if (days < 0 || sub.status === 'expired') {
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
      }
    });

    return { total, active, expiring, expired, suspended, pending, totalRevenue };
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
      plan: 'plan_1month',
      duration_type: 'months',
      duration_val: 1,
      price_bdt: 749,
      payment_status: 'paid',
      max_vehicles: 100,
      max_users: 25,
      max_pumps: 15,
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
  const handleExecuteDeleteTenant = async () => {
    if (!deleteConfirmTenant) return;
    setIsDeletingTenant(true);
    try {
      await deleteTenantSubscriber(deleteConfirmTenant.id);
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
        setApprovalFeedback('Action request submitted! Awaiting review from Executive Administration.');
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
              <span>Central Master Control Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {'FuelNest Central Governance & Fleet Console'}
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              {'Manage subscriber companies, control access validity (days/months), configure Super Admin credentials, and assign administrative officers.'}
            </p>
          </div>

          {/* Switch Active Organization, Credentials Badge & Workspace Return Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Switch Active Organization Selector */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-800/90 border border-amber-500/40 backdrop-blur-xs flex items-center gap-2.5 text-xs shadow-md">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-amber-400/80 text-[10px] font-bold uppercase tracking-wider">
                  {'Switch Active Organization'}
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
                    ? 'Executive Admin'
                    : effectiveRole === 'CO_OWNER_ADMIN'
                    ? 'Deputy Admin'
                    : effectiveRole === 'ADMIN'
                    ? 'Control Admin'
                    : 'System Moderator'}
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
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

        <div
          onClick={() => {
            setActiveTab('subscribers');
            setStatusFilter('suspended');
          }}
          className={`p-4 rounded-xl border shadow-xs cursor-pointer transition-all hover:scale-[1.02] ${
            stats.suspended > 0
              ? 'bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20'
              : 'bg-white dark:bg-[#0c162d] border-slate-200 dark:border-blue-900/40'
          }`}
          title="Click to view suspended subscriptions"
        >
          <div className="flex items-center justify-between text-amber-500 dark:text-amber-400 text-xs font-semibold mb-1">
            <span>{'Suspended'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500 flex items-center gap-1.5">
            <span>{stats.suspended}</span>
            {stats.suspended > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold animate-pulse">
                Action
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {'Awaiting Activation'}
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
            {pendingRegRequestsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 animate-pulse">
                +{pendingRegRequestsCount}
              </span>
            )}
          </button>

          {/* Tab 2: Subscriber Approvals */}
          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'registrations'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>{'Subscriber Approvals'}</span>
            {pendingRegRequestsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                {pendingRegRequestsCount} Pending
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10 dark:bg-white/10">
                {registrationRequests.length}
              </span>
            )}
          </button>

          {/* Tab 3: Control Roles & Team */}
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

          {/* Tab 4: Approvals & Governance Queue */}
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
            {(pendingApprovalsCount + pendingRegRequestsCount + pendingPaymentsCount) > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                {pendingApprovalsCount + pendingRegRequestsCount + pendingPaymentsCount} Pending
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-black/10">
                {approvals.length + registrationRequests.length + (subscriptionPayments || []).length}
              </span>
            )}
          </button>

          {/* Tab 4: Security & Credentials - Only visible to Owner Admin & Co-Owner Admin */}
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
              <span>{'Security & Credentials'}</span>
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

          {/* Tab 6: Email & SMTP */}
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'email'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>{'Email & Alerts'}</span>
          </button>

          {/* Tab 7: Website Pages CMS */}
          <button
            onClick={() => setActiveTab('cms_pages')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'cms_pages'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>{'CMS & Pages'}</span>
          </button>

          {/* Tab 8: App Branding & Logo */}
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'branding'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{'Logo & Favicon'}</span>
          </button>

          {/* Tab 9: Promotional Video */}
          <button
            onClick={() => setActiveTab('promo_video')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'promo_video'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white dark:bg-[#0c162d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>{'Promo Video'}</span>
          </button>
        </div>

        {/* Action buttons based on active tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'subscribers' && (
            <>
              {/* Refresh Subscribers from Server Button */}
              <button
                onClick={handleManualRefresh}
                disabled={isManualRefreshing}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0c162d] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all cursor-pointer"
                title="Sync with cloud database to refresh latest subscribers"
              >
                <RefreshCw className={`w-4 h-4 text-amber-500 ${isManualRefreshing ? 'animate-spin' : ''}`} />
                <span>{isManualRefreshing ? 'Refreshing...' : 'Refresh List'}</span>
              </button>

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

          {activeTab === 'registrations' && (
            <button
              onClick={fetchRegistrationRequests}
              disabled={regRequestsLoading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0c162d] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-amber-500 ${regRequestsLoading ? 'animate-spin' : ''}`} />
              <span>{regRequestsLoading ? 'Loading...' : 'Refresh Requests'}</span>
            </button>
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
          {/* Pending Registration Requests Alert Banner & Quick Approval Grid */}
          {pendingRegRequestsCount > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-600/15 border-2 border-amber-500/50 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        {pendingRegRequestsCount} New Subscriber Registration{pendingRegRequestsCount > 1 ? 's' : ''} Awaiting Approval
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                        Action Required
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      New subscribers registered from the landing page. Click <strong>Approve & Activate</strong> below to instantly create their workspace and view credentials.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <a
                    href="https://mail.google.com/mail/u/admin.fuelnest@gmail.com/#search/FuelNest"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    title="Open Gmail for admin.fuelnest@gmail.com"
                  >
                    <Mail className="w-3.5 h-3.5 text-rose-400" />
                    <span>Gmail (admin.fuelnest)</span>
                  </a>
                  <button
                    type="button"
                    onClick={fetchRegistrationRequests}
                    disabled={regRequestsLoading}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0c162d] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${regRequestsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('registrations')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer shrink-0 transition-transform active:scale-95"
                  >
                    <span>View All Approvals</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Pending Registrations Approval Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {registrationRequests
                  .filter(r => r.status === 'pending')
                  .map(reqItem => (
                    <div
                      key={reqItem.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-[#0c162d] border-2 border-amber-500/40 hover:border-amber-400 shadow-sm flex flex-col justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-black text-xs text-slate-900 dark:text-white truncate">
                            {reqItem.company_name}
                          </h5>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                            {reqItem.is_trial ? 'Free Trial' : 'Paid Plan'}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-amber-500 truncate">
                          {reqItem.plan_name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
                          <div className="truncate">Contact: {reqItem.admin_name || 'Admin'}</div>
                          <div className="truncate">Email: {reqItem.email}</div>
                          <div className="truncate">Phone: {reqItem.phone || 'N/A'}</div>
                          <div className="truncate text-emerald-400 font-semibold">
                            Payment: {reqItem.payment_method || 'Verified'} {reqItem.transaction_id ? `(${reqItem.transaction_id})` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleApproveRegistration(reqItem)}
                          disabled={actionLoadingId === reqItem.id}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
                        >
                          {actionLoadingId === reqItem.id ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>Activating...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Activate</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectModalItem(reqItem);
                            setRejectReasonText('Information incomplete or payment unverified');
                          }}
                          disabled={actionLoadingId === reqItem.id}
                          className="py-1.5 px-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[11px] font-bold border border-rose-500/30 cursor-pointer disabled:opacity-50"
                          title="Reject Application"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Feedback Message Toast */}
          {actionFeedbackMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-md ${
                actionFeedbackMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              <span>{actionFeedbackMsg.text}</span>
              <button
                type="button"
                onClick={() => setActionFeedbackMsg(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
                <option value="pending_approval">{`Pending Approval (${stats.pending || pendingRegRequestsCount})`}</option>
                <option value="expired">{'Expired'}</option>
                <option value="suspended">{'Suspended'}</option>
              </select>

              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-medium"
              >
                <option value="all">{'All Plans'}</option>
                <option value="trial_3days">3 Days Free Trial (0 BDT)</option>
                <option value="plan_1month">1 Month Plan (749 BDT)</option>
                <option value="plan_3months">3 Months Plan (2,199 BDT)</option>
                <option value="plan_6months">6 Months Plan (3,999 BDT)</option>
                <option value="plan_12months">VIP Plan (7,999 BDT)</option>
                <option value="custom">Custom Enterprise</option>
              </select>
            </div>
          </div>

          {/* Subscribers Cards Grid */}
          {stats.suspended > 0 && statusFilter !== 'suspended' && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
                <span className="font-bold text-amber-400">
                  {stats.suspended} subscriber workspace{stats.suspended > 1 ? 's are' : ' is'} currently suspended awaiting review and unsuspension.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStatusFilter('suspended')}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer shadow-xs"
              >
                View Suspended ({stats.suspended})
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSubscribers.map(tenant => {
              const sub = tenant.subscription;
              const daysRemaining = sub ? getDaysRemaining(sub.end_date) : 0;
              const isExpired = daysRemaining < 0 || sub?.status === 'expired';
              const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;
              const isPending = tenant.status === 'pending' || sub?.status === 'pending' || tenant.is_approved === false;
              const isSuspended = !isPending && (tenant.status === 'suspended' || sub?.status === 'suspended');
              const showPass = visiblePasswords[tenant.id];

              const superAdminUsername = sub?.super_admin_username || 'admin_' + (tenant.code || '').toLowerCase();
              const superAdminPassword = sub?.super_admin_password || 'pass1234';

              return (
                <div
                  key={tenant.id}
                  className={`rounded-2xl p-5 bg-white dark:bg-[#0c162d] border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                    isPending
                      ? 'border-2 border-amber-500 bg-amber-500/[0.05] shadow-amber-500/10 ring-1 ring-amber-500/30'
                      : isSuspended
                      ? 'border-2 border-amber-500/60 bg-amber-500/[0.03] shadow-amber-500/10'
                      : isExpired
                      ? 'border-red-300 dark:border-red-900/60 bg-red-50/20'
                      : isExpiringSoon
                      ? 'border-amber-300 dark:border-amber-700/60'
                      : 'border-slate-200 dark:border-blue-900/40'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Pending Upgrade Payment Alert */}
                    {(() => {
                      const matchPay = (subscriptionPayments || []).find(p => p.tenant_id === tenant.id && p.status === 'pending');
                      if (!matchPay) return null;
                      return (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-between gap-2 text-xs shadow-xs animate-pulse">
                          <div className="min-w-0">
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 block text-[11px] truncate">
                              💳 Payment Verification Pending ({matchPay.payment_method.toUpperCase()}: <span className="font-mono">{matchPay.transaction_id}</span>)
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {matchPay.amount_bdt} BDT &bull; +{matchPay.plan_days} Days Extension
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApprovePayment(matchPay.id)}
                            disabled={paymentActionLoadingId === matchPay.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black shrink-0 cursor-pointer shadow-xs"
                          >
                            {paymentActionLoadingId === matchPay.id ? 'Approving...' : `Approve (+${matchPay.plan_days}d)`}
                          </button>
                        </div>
                      );
                    })()}

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
                            isPending
                              ? 'bg-amber-500 text-slate-950 font-black border border-amber-400 animate-pulse'
                              : isSuspended
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 animate-pulse'
                              : isExpired
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 border border-red-300'
                              : isExpiringSoon
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 animate-pulse'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300'
                          }`}
                        >
                          {isPending
                            ? ('Pending Approval')
                            : isSuspended
                            ? ('Suspended (Awaiting Activation)')
                            : isExpired
                            ? ('Expired')
                            : isExpiringSoon
                            ? (`${daysRemaining}d Left`)
                            : (`${daysRemaining}d Active`)}
                        </span>

                        <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 capitalize">
                          {(() => {
                            const p = sub?.plan;
                            if (p === 'trial_3days') return '3 Days Free Trial';
                            if (p === 'plan_1month') return '1 Month Plan (749 BDT)';
                            if (p === 'plan_3months') return '3 Months Plan (2,199 BDT)';
                            if (p === 'plan_6months') return '6 Months Plan (3,999 BDT)';
                            if (p === 'plan_12months') return 'VIP Plan (7,999 BDT)';
                            if (p === 'custom') return 'Custom Enterprise';
                            return sub?.plan ? `${sub.plan.toUpperCase()} Plan` : 'Standard Plan';
                          })()}
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
                    {isPending ? (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-bold flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0 animate-pulse text-amber-400" />
                          <span>New registration in PENDING status. Click below to approve plan & enable login.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveTenantPlan(tenant)}
                            disabled={actionLoadingId === tenant.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
                          >
                            {actionLoadingId === tenant.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Approving Plan...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-white" />
                                <span>Approve Plan</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (isModerator) {
                                setModRequestModal({ type: 'DELETE_SUBSCRIBER', tenant });
                                setModRequestReason('');
                              } else {
                                setDeleteConfirmTenant(tenant);
                              }
                            }}
                            className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                            title="Delete Subscriber"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : isSuspended ? (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                          <span>Workspace is suspended. Click below to unsuspend and activate access.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUnsuspendAndActivate(tenant)}
                            disabled={actionLoadingId === tenant.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
                          >
                            {actionLoadingId === tenant.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Activating...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>✅ Unsuspend & Activate</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (isModerator) {
                                setModRequestModal({ type: 'DELETE_SUBSCRIBER', tenant });
                                setModRequestReason('');
                              } else {
                                setDeleteConfirmTenant(tenant);
                              }
                            }}
                            className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                            title="Delete Subscriber"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
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
                            onClick={() => handleSuspendTenant(tenant)}
                            className="text-[11px] font-semibold text-slate-500 hover:text-amber-600 cursor-pointer"
                          >
                            ⏸️ Suspend Access
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
                      </>
                    )}
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

      {/* ================= TAB: NEW USER REGISTRATIONS & APPROVALS ================= */}
      {activeTab === 'registrations' && (
        <div className="space-y-4">
          {/* Header Info Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>New Subscriber Approvals & Credential Dispatch</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    Master Queue
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  When users register from the landing page (Free Trial or Paid Plan), their requests arrive here. Review each application, click <strong>Approve & Activate</strong> to provision their workspace, and send credentials via 1-click email or copy.
                </p>
              </div>
            </div>

            <button
              onClick={fetchRegistrationRequests}
              disabled={regRequestsLoading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-2 shrink-0 transition-colors border border-slate-700 cursor-pointer self-start md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${regRequestsLoading ? 'animate-spin' : ''}`} />
              <span>{regRequestsLoading ? 'Refreshing...' : 'Refresh List'}</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Requests</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {registrationRequests.length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-amber-500/40 shadow-xs">
              <span className="text-[11px] font-bold text-amber-500 uppercase block">Pending Review</span>
              <span className="text-2xl font-black text-amber-500 mt-1 block">
                {registrationRequests.filter(r => r.status === 'pending').length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-emerald-500/40 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-500 uppercase block">Approved & Active</span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {registrationRequests.filter(r => r.status === 'approved').length}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-rose-500/40 shadow-xs">
              <span className="text-[11px] font-bold text-rose-500 uppercase block">Rejected</span>
              <span className="text-2xl font-black text-rose-500 mt-1 block">
                {registrationRequests.filter(r => r.status === 'rejected').length}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-3 sm:p-4 rounded-xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by company name, contact, email, phone, trx id..."
                value={regSearchTerm}
                onChange={e => setRegSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => {
                const count =
                  tab === 'all'
                    ? registrationRequests.length
                    : registrationRequests.filter(r => r.status === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => setRegFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      regFilter === tab
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {tab} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Requests List */}
          {(() => {
            const filtered = registrationRequests
              .filter(r => regFilter === 'all' || r.status === regFilter)
              .filter(r => {
                if (!regSearchTerm.trim()) return true;
                const q = regSearchTerm.toLowerCase();
                return (
                  r.company_name?.toLowerCase().includes(q) ||
                  r.admin_name?.toLowerCase().includes(q) ||
                  r.email?.toLowerCase().includes(q) ||
                  r.phone?.toLowerCase().includes(q) ||
                  r.transaction_id?.toLowerCase().includes(q) ||
                  r.plan_name?.toLowerCase().includes(q)
                );
              });

            if (filtered.length === 0) {
              return (
                <div className="text-center py-12 bg-white dark:bg-[#0c162d] rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
                  <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                    {registrationRequests.length === 0
                      ? 'No Registration Requests Yet'
                      : 'No Matching Requests Found'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {registrationRequests.length === 0
                      ? 'When subscribers sign up on the landing page, they will automatically appear here for approval.'
                      : 'Try adjusting your search query or filter selection.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filtered.map(item => {
                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved';
                  const isRejected = item.status === 'rejected';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c162d] border transition-all shadow-xs ${
                        isPending
                          ? 'border-amber-400/80 dark:border-amber-500/50 hover:border-amber-500'
                          : isApproved
                          ? 'border-emerald-300 dark:border-emerald-800/40'
                          : 'border-slate-200 dark:border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Left / Info */}
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-base text-slate-900 dark:text-white">
                              {item.company_name}
                            </span>

                            {isPending && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                            {isApproved && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Approved & Active</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center gap-1">
                                <X className="w-3 h-3" />
                                <span>Rejected</span>
                              </span>
                            )}

                            <span className="text-[11px] text-slate-400 font-mono">
                              Requested: {new Date(item.created_at).toLocaleString()}
                            </span>
                          </div>

                          {/* Data Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs pt-1">
                            <div className="bg-slate-50 dark:bg-[#080e1e] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Contact Person</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{item.admin_name || 'Admin'}</span>
                              <span className="text-[11px] text-slate-500 block font-mono mt-0.5">{item.phone || 'No phone'}</span>
                            </div>

                            <div className="bg-slate-50 dark:bg-[#080e1e] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Email Address</span>
                              <span className="font-mono text-slate-800 dark:text-amber-400 select-all font-semibold break-all">
                                {item.email}
                              </span>
                            </div>

                            <div className="bg-slate-50 dark:bg-[#080e1e] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Requested Plan</span>
                              <span className="font-bold text-slate-900 dark:text-white">{item.plan_name}</span>
                              <span className="text-[11px] font-semibold text-amber-500 block">
                                {item.is_trial ? 'Free Trial (0 BDT)' : `${item.price_bdt} BDT`}
                              </span>
                            </div>

                            <div className="bg-slate-50 dark:bg-[#080e1e] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400 block uppercase font-bold">Payment & Reference</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {item.payment_method || (item.is_trial ? 'Free Trial' : 'Online')}
                              </span>
                              {item.transaction_id && (
                                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                                  <span>Trx: {item.transaction_id}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Rejection / Approval info */}
                          {isRejected && item.rejection_reason && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                              <strong>Rejection reason:</strong> {item.rejection_reason}
                            </div>
                          )}

                          {isApproved && (
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                              <span>Approved by: <strong className="text-white">{item.approved_by || 'Admin'}</strong></span>
                              <span>Tenant Code: <strong className="text-amber-400 font-mono">{item.tenant_id}</strong></span>
                              <span>Super Admin: <strong className="text-emerald-400 font-mono">{item.super_admin_username}</strong></span>
                              {item.email_sent && (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Email Dispatched
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right / Actions */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-end lg:self-center">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveRegistration(item)}
                                disabled={actionLoadingId === item.id}
                                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                {actionLoadingId === item.id ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Provisioning...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve & Activate</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRejectModalItem(item);
                                  setRejectReasonText('Information incomplete or payment unverified');
                                }}
                                disabled={actionLoadingId === item.id}
                                className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedApprovalModalData(item);
                                  setDirectEmailResult(null);
                                }}
                                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>View Credentials & Email</span>
                              </button>

                              <a
                                href={`mailto:${item.email}?cc=admin.fuelnest@gmail.com&subject=${encodeURIComponent(`FuelNest Workspace Access Credentials - ${item.company_name}`)}&body=${encodeURIComponent(`From: admin.fuelnest@gmail.com (FuelNest Administration)\nReply-To: admin.fuelnest@gmail.com\nTo: ${item.email}\n\nDear ${item.admin_name || item.company_name},\nYour FuelNest Fleet & Fuel Management Workspace is active.\n\nPortal: ${item.login_url || 'https://fuelnest.xyz/login'}\nUsername: ${item.super_admin_username}\nPassword: ${item.temporary_password}\n\nBest regards,\nMaster Administration Team\nadmin.fuelnest@gmail.com`)}`}
                                className="px-3 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                                title="Mail to subscriber (from admin.fuelnest@gmail.com)"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Mail To</span>
                              </a>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeleteRegModalItem(item)}
                            className="p-2.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete Request Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
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
                    <span>👑 Executive Admin & 🤝 Deputy Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {'Full master access, direct execution, user creation & management, and Security & Credentials access.'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <span>🛡️ Control Admin</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {'Full subscriber management & approval authority over operational requests.'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <span>👮 Operations Officer</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                    {'Can view and submit requests for tenant lifecycle adjustments (requires Executive Administrator approval).'}
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
                      <span>Chief Executive Administrator</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    EXECUTIVE MASTER
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
                  ? 'Deputy Admin'
                  : mod.owner_role === 'ADMIN'
                  ? 'Control Admin'
                  : 'Operations Officer';

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
                          ? 'Full access, user creation, approves requests, and accesses Security & Credentials.'
                          : mod.owner_role === 'ADMIN'
                          ? 'Full subscriber operations & approves requests.'
                          : 'Subscriber delete, duration extend, and suspend actions require Executive Administrator approval.'}
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
                        {'Managed by Executive Admin'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 4: APPROVALS & GOVERNANCE ================= */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Action Feedback Message Toast */}
          {actionFeedbackMsg && (
            <div
              className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-md ${
                actionFeedbackMsg.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              <span>{actionFeedbackMsg.text}</span>
              <button
                type="button"
                onClick={() => setActionFeedbackMsg(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* SECTION 1: NEW SUBSCRIBER REGISTRATIONS AWAITING MASTER APPROVAL */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c162d] border-2 border-amber-500/40 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      New Subscriber Registrations
                    </h3>
                    {pendingRegRequestsCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white animate-pulse">
                        {pendingRegRequestsCount} Awaiting Approval
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        All Cleared ({registrationRequests.length} Total)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Subscribers registering via the landing page arrive here. Approve to provision their tenant database and generate credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchRegistrationRequests}
                  disabled={regRequestsLoading}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${regRequestsLoading ? 'animate-spin' : ''}`} />
                  <span>{regRequestsLoading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('registrations')}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>Subscriber Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List of Pending Subscriber Registration Requests */}
            {registrationRequests.filter(r => r.status === 'pending').length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No Pending Subscriber Registrations
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When new subscribers sign up on the landing page, their applications will immediately appear here for approval.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {registrationRequests
                  .filter(r => r.status === 'pending')
                  .map(reqItem => (
                    <div
                      key={reqItem.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#080e1e] border-2 border-amber-500/40 hover:border-amber-400 transition-all flex flex-col justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                {reqItem.company_name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white animate-pulse">
                                Pending Approval
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-amber-500">
                              {reqItem.plan_name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(reqItem.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white dark:bg-[#0c162d] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Contact Person</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate block">
                              {reqItem.admin_name || 'Admin'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Email Address</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate block">
                              {reqItem.email}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Phone</span>
                            <span className="text-slate-800 dark:text-slate-200 font-semibold truncate block">
                              {reqItem.phone || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Payment</span>
                            <span className="text-emerald-500 font-bold truncate block">
                              {reqItem.payment_method || 'Verified'} {reqItem.transaction_id ? `(${reqItem.transaction_id})` : ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleApproveRegistration(reqItem)}
                          disabled={actionLoadingId === reqItem.id}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
                        >
                          {actionLoadingId === reqItem.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Activating Workspace...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Approve & Activate</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRejectModalItem(reqItem);
                            setRejectReasonText('Information incomplete or payment unverified');
                          }}
                          disabled={actionLoadingId === reqItem.id}
                          className="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* SECTION 2: SUBSCRIBER RENEWAL & UPGRADE PAYMENT VERIFICATIONS (bKash / Nagad / Bank / Rocket) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c162d] border-2 border-emerald-500/40 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-500 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Subscription Payment Verifications (ম্যানুয়াল পেমেন্ট ভেরিফিকেশন)
                    </h3>
                    {pendingPaymentsCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-600 text-white animate-pulse">
                        {pendingPaymentsCount} Awaiting Verification
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                        All Cleared ({(subscriptionPayments || []).length} Total)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Subscribers upgrading or renewing via bKash, Nagad, Rocket or Bank transfer appear here. Match the TrxID with statement and click "Verify & Approve" to automatically extend their subscription validity.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSubscriptionPayments}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Refresh Payments</span>
                </button>
              </div>
            </div>

            {/* List of Payments */}
            {(!subscriptionPayments || subscriptionPayments.length === 0) ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No Payment Verifications Pending
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When existing subscribers submit renewal or upgrade payment slips (bKash/Nagad/Bank), their verification requests will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {subscriptionPayments.map(payItem => {
                  const isPending = payItem.status === 'pending';
                  const isApproved = payItem.status === 'approved';

                  const methodBadge =
                    payItem.payment_method === 'bkash'
                      ? 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30'
                      : payItem.payment_method === 'nagad'
                      ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30'
                      : payItem.payment_method === 'rocket'
                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';

                  return (
                    <div
                      key={payItem.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-xs ${
                        isPending
                          ? 'bg-slate-50 dark:bg-[#080e1e] border-2 border-emerald-500/50 hover:border-emerald-400'
                          : isApproved
                          ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-slate-200 dark:border-slate-800 opacity-90'
                          : 'bg-rose-50/20 dark:bg-rose-950/10 border-slate-200 dark:border-slate-800 opacity-80'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                                {payItem.tenant_name}
                              </h4>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${methodBadge}`}>
                                {payItem.payment_method}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              By: <strong>{payItem.user_name}</strong> &bull; {payItem.user_phone || 'No phone'}
                            </span>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                              isPending
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-400/50 animate-pulse'
                                : isApproved
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-400/50'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300 border-red-400/50'
                            }`}
                          >
                            {isPending ? '⏳ Awaiting Review' : isApproved ? '✓ Approved' : '✗ Rejected'}
                          </span>
                        </div>

                        {/* Payment Data Grid */}
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Transaction ID (TrxID)
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                                {payItem.transaction_id}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(payItem.transaction_id);
                                  setPaymentTrxCopiedId(payItem.id);
                                  setTimeout(() => setPaymentTrxCopiedId(null), 2000);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                title="Copy TrxID"
                              >
                                {paymentTrxCopiedId === payItem.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Amount & Plan
                            </span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block">
                              {payItem.amount_bdt} BDT
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {payItem.plan_name} (+{payItem.plan_days} Days)
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Sender Number / A/C
                            </span>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {payItem.sender_number || 'N/A'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Payment Date
                            </span>
                            <span className="font-mono text-slate-700 dark:text-slate-300">
                              {payItem.payment_date || payItem.created_at?.slice(0, 10)}
                            </span>
                          </div>
                        </div>

                        {payItem.notes && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            Note: "{payItem.notes}"
                          </div>
                        )}

                        {payItem.reviewed_by && (
                          <div className="text-[11px] text-slate-500">
                            Reviewed by: <strong>{payItem.reviewed_by}</strong> on {payItem.reviewed_at ? new Date(payItem.reviewed_at).toLocaleDateString() : ''}
                            {payItem.rejection_reason && (
                              <span className="text-red-500 block font-medium">Reason: {payItem.rejection_reason}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons for Pending Payments */}
                      {isPending && (
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleApprovePayment(payItem.id)}
                            disabled={paymentActionLoadingId === payItem.id}
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-transform active:scale-95"
                          >
                            {paymentActionLoadingId === payItem.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Verifying & Extending...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Verify & Approve (+{payItem.plan_days} Days)</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPaymentRejectModalItem(payItem);
                              setPaymentRejectReason('TrxID could not be matched with bank/MFS statement');
                            }}
                            disabled={paymentActionLoadingId === payItem.id}
                            className="py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: DUAL-CONTROL INTERNAL GOVERNANCE & SENSITIVE OPERATIONS */}
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                <strong className="font-bold block text-sm mb-1">
                  {'Dual-Control Governance & Sensitive Action Approval Queue:'}
                </strong>
                <p>
                  {'Officers can request critical operations (Subscriber Deletion, Subscription Extension, Suspension/Unsuspension). These actions require explicit approval from an Executive Administrator to ensure system security.'}
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
                {'Master Profile & Administrative Security'}
              </h3>
              <p className="text-xs text-slate-500">
                {'Update your master system administrator credentials securely.'}
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
                  {'Admin Username'} *
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
                    {'Admin Password'} *
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

      {activeTab === 'email' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Email Status & Sandbox Diagnostic Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-blue-900/40 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Automated Email Dispatch & SMTP Engine
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Live Multi-Channel
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dispatches Super Admin credentials, onboarding welcome kits, and receipts to subscribers
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Domain: fuelnest.xyz
                </span>
              </div>
            </div>

            {/* Sandbox Notice Banner */}
            <div className="mt-5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Email Delivery Diagnostics & Sandbox Notice:</span>
              </div>
              <p className="leading-relaxed">
                Currently <strong>Resend API</strong> is active in test/sandbox mode. Using <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">onboarding@resend.dev</code> allows test delivery directly to the verified account owner email (<span className="underline font-mono">admin.fuelnest@gmail.com</span>). To deliver emails directly to any external subscriber address, follow either method below:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-white/70 dark:bg-slate-900/80 border border-amber-500/20 text-slate-800 dark:text-slate-200">
                  <div className="font-bold text-amber-600 dark:text-amber-400 mb-1">Method 1: Custom SMTP (Recommended)</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Configure your custom domain webmail (e.g., <code className="font-mono">mail.fuelnest.xyz</code>) or Gmail App Password or Brevo/SendGrid SMTP below. Custom SMTP has no sandbox restrictions!
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/70 dark:bg-slate-900/80 border border-amber-500/20 text-slate-800 dark:text-slate-200">
                  <div className="font-bold text-amber-600 dark:text-amber-400 mb-1">Method 2: Resend Domain Verification</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Visit <a href="https://resend.com/domains" target="_blank" rel="noreferrer" className="text-amber-500 underline font-bold">resend.com/domains</a> and verify the DNS records for <code className="font-mono">fuelnest.xyz</code>, then set the sender address below.
                  </p>
                </div>
              </div>
            </div>

            {/* Custom SMTP Configuration Form */}
            <div className="mt-6 p-5 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Custom SMTP Server Configuration</h4>
                  <p className="text-xs text-slate-500">Enable SMTP to dispatch directly to all subscribers without third-party sandbox restrictions</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailConfig.smtp_enabled}
                    onChange={e => setEmailConfig((prev: any) => ({ ...prev, smtp_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">SMTP Host</label>
                  <input
                    type="text"
                    value={emailConfig.smtp_host || ''}
                    onChange={e => setEmailConfig((prev: any) => ({ ...prev, smtp_host: e.target.value }))}
                    placeholder="e.g., mail.fuelnest.xyz or smtp.gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Port</label>
                    <input
                      type="number"
                      value={emailConfig.smtp_port || 587}
                      onChange={e => setEmailConfig((prev: any) => ({ ...prev, smtp_port: Number(e.target.value) }))}
                      placeholder="587 or 465"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">SSL/TLS</label>
                    <button
                      type="button"
                      onClick={() => setEmailConfig((prev: any) => ({ ...prev, smtp_secure: !prev.smtp_secure }))}
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        emailConfig.smtp_secure
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {emailConfig.smtp_secure ? 'SSL Active (465)' : 'STARTTLS (587)'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">SMTP Username / Email</label>
                  <input
                    type="text"
                    value={emailConfig.smtp_user || ''}
                    onChange={e => setEmailConfig((prev: any) => ({ ...prev, smtp_user: e.target.value }))}
                    placeholder="admin@fuelnest.xyz"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    SMTP Password {emailConfig.smtp_pass_configured && <span className="text-emerald-500 text-[10px]">(Password Configured)</span>}
                  </label>
                  <input
                    type="password"
                    value={emailConfig.smtp_pass || ''}
                    onChange={e => setEmailConfig((prev: any) => ({ ...prev, smtp_pass: e.target.value }))}
                    placeholder={emailConfig.smtp_pass_configured ? '••••••••••••••••' : 'Enter SMTP password'}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Sender 'From' Name & Email</label>
                  <input
                    type="text"
                    value={emailConfig.smtp_from || ''}
                    onChange={e => setEmailConfig((prev: any) => ({ ...prev, smtp_from: e.target.value }))}
                    placeholder='FuelNest Intelligence <admin@fuelnest.xyz>'
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Resend Verified Sender (Optional)</label>
                  <input
                    type="text"
                    value={emailConfig.resend_from || ''}
                    onChange={e => setEmailConfig((prev: any) => ({ ...prev, resend_from: e.target.value }))}
                    placeholder="FuelNest <noreply@fuelnest.xyz>"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {emailConfigMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  emailConfigMessage.isError
                    ? 'bg-red-500/10 border border-red-500/30 text-red-500'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                }`}>
                  {emailConfigMessage.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{emailConfigMessage.text}</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={emailConfigSaving}
                  onClick={async () => {
                    setEmailConfigSaving(true);
                    setEmailConfigMessage(null);
                    try {
                      const res = await fetch('/api/email/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(emailConfig)
                      });
                      const data = await res.json();
                      if (data.success) {
                        setEmailConfigMessage({ text: 'Email & SMTP settings saved successfully!' });
                        if (data.config) setEmailConfig((prev: any) => ({ ...prev, ...data.config, smtp_pass: '' }));
                      } else {
                        setEmailConfigMessage({ text: data.message || 'Failed to save configuration.', isError: true });
                      }
                    } catch (e: any) {
                      setEmailConfigMessage({ text: e?.message || 'Network error saving settings.', isError: true });
                    } finally {
                      setEmailConfigSaving(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{emailConfigSaving ? 'Saving Settings...' : 'Save Email Settings'}</span>
                </button>
              </div>
            </div>

            {/* Test Email Dispatcher Tool */}
            <div className="mt-6 p-5 rounded-xl bg-slate-50 dark:bg-[#080e1e] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Live Email Dispatch Test Tool</h4>
              </div>
              <p className="text-xs text-slate-500">
                Send a real test email with temporary Super Admin credentials to test deliverability to any recipient.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                <input
                  type="email"
                  value={emailTestRecipient}
                  onChange={e => setEmailTestRecipient(e.target.value)}
                  placeholder="Enter email to test (e.g. prematraders542@gmail.com)"
                  className="flex-1 w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 font-mono"
                />
                <button
                  type="button"
                  disabled={emailTestLoading || !emailTestRecipient.trim()}
                  onClick={async () => {
                    setEmailTestLoading(true);
                    setEmailTestResult(null);
                    try {
                      const res = await fetch('/api/email/test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ recipient_email: emailTestRecipient.trim() })
                      });
                      const data = await res.json();
                      setEmailTestResult(data);
                      // Refresh logs
                      fetch('/api/email/logs')
                        .then(r => r.json())
                        .then(d => { if (d.success && Array.isArray(d.logs)) setEmailLogs(d.logs); })
                        .catch(() => {});
                    } catch (e: any) {
                      setEmailTestResult({ success: false, message: e?.message });
                    } finally {
                      setEmailTestLoading(false);
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${emailTestLoading ? 'animate-spin' : ''}`} />
                  <span>{emailTestLoading ? 'Dispatching Test...' : 'Send Test Email'}</span>
                </button>
              </div>

              {emailTestResult && (
                <div className={`mt-3 p-3.5 rounded-xl border text-xs space-y-1 font-mono ${
                  emailTestResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : emailTestResult.result?.sandbox_restricted
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}>
                  <div className="font-bold font-sans flex items-center gap-1.5">
                    {emailTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span>
                      {emailTestResult.success
                        ? `Test Email Successfully Delivered via ${emailTestResult.result?.method || 'Direct Dispatch'}!`
                        : emailTestResult.result?.sandbox_restricted
                        ? 'Sandbox Restriction: Relayed to verified owner (admin.fuelnest@gmail.com)'
                        : 'Delivery Failed'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {emailTestResult.result?.reason || emailTestResult.result?.error || emailTestResult.message || JSON.stringify(emailTestResult.result)}
                  </p>
                </div>
              )}
            </div>

            {/* Email Dispatch Audit History Table */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Recent Email Dispatch Audit Logs</h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmailLogsLoading(true);
                    fetch('/api/email/logs')
                      .then(r => r.json())
                      .then(d => { if (d.success && Array.isArray(d.logs)) setEmailLogs(d.logs); })
                      .finally(() => setEmailLogsLoading(false));
                  }}
                  className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${emailLogsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh Logs</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-100 dark:bg-slate-900/80 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {emailLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 italic">
                          No email dispatch records found yet.
                        </td>
                      </tr>
                    ) : (
                      emailLogs.slice(0, 15).map((log: any, idx: number) => (
                        <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            {log.recipient}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {log.company || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'delivered'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : log.status === 'relayed_to_owner' || log.status === 'sandbox_restricted'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
                              {log.status === 'delivered'
                                ? 'Delivered'
                                : log.status === 'relayed_to_owner' || log.status === 'sandbox_restricted'
                                ? 'Relayed (Sandbox)'
                                : 'Failed'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {log.method || 'Resend'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
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
                        let price = 749;
                        let dType: 'days' | 'months' | 'years' = 'months';
                        let dVal = 1;
                        let maxVehicles = 100;
                        if (p === 'trial_3days') {
                          price = 0;
                          dType = 'days';
                          dVal = 3;
                          maxVehicles = 100;
                        } else if (p === 'plan_1month') {
                          price = 749;
                          dType = 'months';
                          dVal = 1;
                          maxVehicles = 100;
                        } else if (p === 'plan_3months') {
                          price = 2199;
                          dType = 'months';
                          dVal = 3;
                          maxVehicles = 100;
                        } else if (p === 'plan_6months') {
                          price = 3999;
                          dType = 'months';
                          dVal = 6;
                          maxVehicles = 250;
                        } else if (p === 'plan_12months') {
                          price = 7999;
                          dType = 'years';
                          dVal = 1;
                          maxVehicles = 999;
                        } else if (p === 'custom') {
                          price = 25000;
                          dType = 'months';
                          dVal = 12;
                          maxVehicles = 999;
                        }
                        setNewSubForm(prev => ({
                          ...prev,
                          plan: p,
                          price_bdt: price,
                          duration_type: dType,
                          duration_val: dVal,
                          max_vehicles: maxVehicles
                        }));
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white font-medium"
                    >
                      <option value="trial_3days">3 Days Free Trial (3 Days - 0 BDT)</option>
                      <option value="plan_1month">1 Month Plan (30 Days - 749 BDT)</option>
                      <option value="plan_3months">3 Months Plan (90 Days - 2,199 BDT)</option>
                      <option value="plan_6months">6 Months Plan (180 Days - 3,999 BDT)</option>
                      <option value="plan_12months">VIP Plan (365 Days - 7,999 BDT)</option>
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
                  <option value="MODERATOR">👮 Operations Officer (Sensitive actions require approval)</option>
                  <option value="ADMIN">🛡️ Control Admin (Full subscriber control & approvals)</option>
                  <option value="CO_OWNER_ADMIN">🤝 Deputy Admin (Full access & user management)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {newModForm.owner_role === 'CO_OWNER_ADMIN'
                    ? 'Deputy Admin has equal authority to manage users and access Security & Credentials.'
                    : newModForm.owner_role === 'ADMIN'
                    ? 'Admin has full operations and approval authority, but cannot access Security & Credentials.'
                    : 'Operations Officers can submit action requests for Subscriber deletion, extension, and suspension.'}
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
                {'This sensitive operation will be forwarded to an Executive Administrator for verification & approval.'}
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

      {/* Website Pages CMS Tab */}
      {activeTab === 'cms_pages' && (
        <CmsContentManager initialSection="home" />
      )}

      {/* App Branding & Logo Tab */}
      {activeTab === 'branding' && (
        <CmsContentManager initialSection="branding" />
      )}

      {/* Promotional Video Tab */}
      {activeTab === 'promo_video' && (
        <CmsContentManager initialSection="video" />
      )}

      {/* ================= MODAL: WORKSPACE APPROVED & CREDENTIAL / EMAIL DISPATCH ================= */}
      {selectedApprovalModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-4">
            <button
              onClick={() => setSelectedApprovalModalData(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">
                  Subscriber Workspace Approved & Active
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedApprovalModalData.company_name} &bull; {selectedApprovalModalData.plan_name}
                </p>
              </div>
            </div>

            {/* Generated Super Admin Credentials Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider">Super Admin Credentials</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Ready & Provisioned
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Dedicated Portal Access URL</span>
                <a
                  href={selectedApprovalModalData.login_url || 'https://fuelnest.xyz/login'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-mono font-bold text-xs hover:underline break-all"
                >
                  {selectedApprovalModalData.login_url || 'https://fuelnest.xyz/login'}
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Username</span>
                  <span className="text-white font-bold select-all">{selectedApprovalModalData.super_admin_username}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans font-bold">Temporary Password</span>
                  <span className="text-amber-400 font-bold select-all">{selectedApprovalModalData.temporary_password}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const url = selectedApprovalModalData.login_url || 'https://fuelnest.xyz/login';
                  const text = `FuelNest Super Admin Access:\nPortal: ${url}\nUsername: ${selectedApprovalModalData.super_admin_username}\nPassword: ${selectedApprovalModalData.temporary_password}`;
                  navigator.clipboard?.writeText(text);
                  setCopiedCredsModal(true);
                  setTimeout(() => setCopiedCredsModal(false), 2000);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCredsModal ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Credentials Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copy Login Credentials</span>
                  </>
                )}
              </button>
            </div>

            {/* Email Dispatch Section (Manual & Automated Options) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Send Credentials to User</span>
                </div>
                <span className="text-[11px] text-amber-300 font-mono underline">
                  {selectedApprovalModalData.email}
                </span>
              </div>

              {/* Sender Account Confirmation */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sender Account:</span>
                </div>
                <span className="font-mono text-emerald-300 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  admin.fuelnest@gmail.com
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Choose an option below to dispatch credentials. Opening via Gmail Web explicitly uses <strong className="text-amber-400">admin.fuelnest@gmail.com</strong> as the sender:
              </p>

              {/* Action Buttons for Email */}
              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Primary: 1-Click Direct Server Dispatch (Guaranteed from admin.fuelnest@gmail.com) */}
                <button
                  type="button"
                  onClick={() => handleSendDirectEmail(selectedApprovalModalData.id)}
                  disabled={sendingEmailDirectly}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-all transform active:scale-98"
                >
                  {sendingEmailDirectly ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Dispatching from admin.fuelnest@gmail.com...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-white" />
                      <span>⚡ 1-Click Send Email (Directly from admin.fuelnest@gmail.com)</span>
                    </>
                  )}
                </button>

                {directEmailResult && (
                  <div
                    className={`p-2.5 rounded-xl text-[11px] font-bold ${
                      directEmailResult.delivered
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                    }`}
                  >
                    {directEmailResult.delivered
                      ? '✅ Email successfully delivered from admin.fuelnest@gmail.com to subscriber!'
                      : `ℹ️ ${directEmailResult.error || 'Server email recorded. You can also send via Gmail Web below.'}`}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-amber-500/20">
                  {/* 2. Open in Gmail Web specifically targeting admin.fuelnest@gmail.com */}
                  <button
                    type="button"
                    onClick={() => {
                      const portal = selectedApprovalModalData.login_url || 'https://fuelnest.xyz/login';
                      const subject = `FuelNest Workspace Access Credentials - ${selectedApprovalModalData.company_name}`;
                      const body = `Dear ${selectedApprovalModalData.admin_name || selectedApprovalModalData.company_name},\n\nWe are pleased to inform you that your FuelNest Fleet & Fuel Management Workspace for "${selectedApprovalModalData.company_name}" has been approved and activated!\n\nHere are your Super Admin sign-in credentials:\n----------------------------------------------------\nPortal Login URL: ${portal}\nSuper Admin Username: ${selectedApprovalModalData.super_admin_username}\nTemporary Password: ${selectedApprovalModalData.temporary_password}\nSubscription Plan: ${selectedApprovalModalData.plan_name}\n----------------------------------------------------\n\nSecurity Notice:\nUpon your initial login, you will be prompted to set your personal permanent password.\n\nIf you have any questions or require deployment assistance, our team is always ready to assist you.\n\nBest regards,\nMaster Administration Team\nadmin.fuelnest@gmail.com\nFuelNest Intelligence\nhttps://fuelnest.xyz`;

                      // Target admin.fuelnest@gmail.com profile specifically
                      const gmailUrl = `https://mail.google.com/mail/u/admin.fuelnest@gmail.com/?view=cm&fs=1&to=${encodeURIComponent(selectedApprovalModalData.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&authuser=admin.fuelnest@gmail.com`;
                      window.open(gmailUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
                    title="Opens Gmail Web specifically with admin.fuelnest@gmail.com profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                    <span>Gmail (admin.fuelnest)</span>
                  </button>

                  {/* 3. Mail To Client App (with From/CC admin.fuelnest@gmail.com) */}
                  <a
                    href={`mailto:${selectedApprovalModalData.email}?cc=admin.fuelnest@gmail.com&subject=${encodeURIComponent(`FuelNest Workspace Access Credentials - ${selectedApprovalModalData.company_name}`)}&body=${encodeURIComponent(
`From: admin.fuelnest@gmail.com (FuelNest Administration)
Reply-To: admin.fuelnest@gmail.com
To: ${selectedApprovalModalData.email}

Dear ${selectedApprovalModalData.admin_name || selectedApprovalModalData.company_name},

We are pleased to inform you that your FuelNest Fleet & Fuel Management Workspace for "${selectedApprovalModalData.company_name}" has been approved and activated!

Here are your Super Admin sign-in credentials:
----------------------------------------------------
Portal Login URL: ${selectedApprovalModalData.login_url || 'https://fuelnest.xyz/login'}
Super Admin Username: ${selectedApprovalModalData.super_admin_username}
Temporary Password: ${selectedApprovalModalData.temporary_password}
Subscription Plan: ${selectedApprovalModalData.plan_name}
----------------------------------------------------

Security Notice:
Upon your initial login, you will be prompted to set your personal permanent password.

Best regards,
Master Administration Team
admin.fuelnest@gmail.com
FuelNest Intelligence
https://fuelnest.xyz`
                    )}`}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
                    title="Opens your local email client with admin.fuelnest@gmail.com prefilled"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mail To (Client)</span>
                  </a>

                  {/* 4. Copy Full Email Message */}
                  <button
                    type="button"
                    onClick={() => {
                      const portal = selectedApprovalModalData.login_url || 'https://fuelnest.xyz/login';
                      const emailMessage = `From: admin.fuelnest@gmail.com (FuelNest Administration)\nReply-To: admin.fuelnest@gmail.com\nSubject: FuelNest Workspace Access Credentials - ${selectedApprovalModalData.company_name}\n\nDear ${selectedApprovalModalData.admin_name || selectedApprovalModalData.company_name},\n\nWe are pleased to inform you that your FuelNest Fleet & Fuel Management Workspace for "${selectedApprovalModalData.company_name}" has been approved and activated!\n\nHere are your Super Admin sign-in credentials:\n----------------------------------------------------\nPortal Login URL: ${portal}\nSuper Admin Username: ${selectedApprovalModalData.super_admin_username}\nTemporary Password: ${selectedApprovalModalData.temporary_password}\nSubscription Plan: ${selectedApprovalModalData.plan_name}\n----------------------------------------------------\n\nSecurity Notice:\nUpon your initial login, you will be prompted to set your personal permanent password.\n\nIf you have any questions or require deployment assistance, our team is always ready to assist you.\n\nBest regards,\nMaster Administration Team\nadmin.fuelnest@gmail.com\nFuelNest Intelligence\nhttps://fuelnest.xyz`;

                      navigator.clipboard?.writeText(emailMessage);
                      setCopiedEmailText(true);
                      setTimeout(() => setCopiedEmailText(false), 2500);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
                  >
                    {copiedEmailText ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-400" />
                        <span>Copy Email Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedApprovalModalData(null)}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: IN-APP REGISTRATION REJECTION ================= */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Reject Registration Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to decline the registration request for{' '}
              <strong className="text-slate-900 dark:text-white">{rejectModalItem.company_name}</strong>?
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Reason for Rejection (Visible in Audit Log)
              </label>
              <textarea
                value={rejectReasonText}
                onChange={e => setRejectReasonText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#080e1e] text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                placeholder="Specify rejection reason..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectRegistration}
                disabled={actionLoadingId === rejectModalItem.id}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoadingId === rejectModalItem.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Declining...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: IN-APP REGISTRATION DELETION ================= */}
      {deleteRegModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Delete Registration Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteRegModalItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Permanently delete the registration record for{' '}
              <strong className="text-slate-900 dark:text-white">{deleteRegModalItem.company_name}</strong>? This action cannot be undone.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteRegModalItem(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRegistration}
                disabled={actionLoadingId === deleteRegModalItem.id}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoadingId === deleteRegModalItem.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: REJECT PAYMENT VERIFICATION ================= */}
      {paymentRejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c162d] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Reject Payment Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentRejectModalItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300">
              Decline payment verification for{' '}
              <strong className="text-slate-900 dark:text-white">{paymentRejectModalItem.tenant_name}</strong> (TrxID: <span className="font-mono text-amber-500 font-bold">{paymentRejectModalItem.transaction_id}</span>)?
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                value={paymentRejectReason}
                onChange={e => setPaymentRejectReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentRejectModalItem(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectPayment}
                disabled={paymentActionLoadingId === paymentRejectModalItem.id}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {paymentActionLoadingId === paymentRejectModalItem.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
