import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Tenant,
  User,
  Company,
  Vendor,
  FuelPump,
  FuelType,
  VehicleCategory,
  Vehicle,
  FuelEntry,
  PumpPayment,
  TankerInventory,
  TankerLog,
  UserRole,
  SubscriptionPlan,
  SubscriptionStatus,
  TenantSubscription,
  SaasOwnerProfile,
  SaasModerator,
  UserPermissions,
  OwnerRole,
  PendingApprovalAction,
  PendingActionType,
  ApprovalStatus,
  SubscriptionPaymentRecord
} from '../types';
import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_COMPANIES,
  INITIAL_VENDORS,
  INITIAL_PUMPS,
  INITIAL_FUEL_TYPES,
  INITIAL_CATEGORIES,
  INITIAL_VEHICLES,
  INITIAL_FUEL_ENTRIES,
  INITIAL_PAYMENTS,
  INITIAL_TANKERS,
  INITIAL_TANKER_LOGS,
  DEFAULT_SAAS_OWNER,
  INITIAL_MODERATORS,
  DEFAULT_FALLBACK_TENANT,
  DEFAULT_FALLBACK_USER
} from '../data/seedData';
import { hashPassword, verifyPassword, isHashed } from '../utils/authSecurity';
import { getEffectiveFuelPriceForDate } from '../utils/fuelPricing';

interface AppContextType {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
  currentTenant: Tenant;
  setCurrentTenantId: (tenantId: string) => void;
  allTenants: Tenant[];
  activeTenants: Tenant[];
  tenantSuspensionNotice: string;
  clearTenantSuspensionNotice: () => void;
  refreshTenantsFromServer: () => Promise<void>;
  refreshUsersFromServer: () => Promise<void>;
  syncManager: {
    syncAll: () => Promise<void>;
    reconcileState: () => Promise<void>;
    bulkDeleteVehicles: (ids: string[]) => Promise<{ success: boolean; deletedCount?: number }>;
    bulkDeleteDrivers: (vehicleIds: string[]) => Promise<{ success: boolean; clearedCount?: number }>;
  };
  currentUser: User;
  setCurrentUserId: (userId: string) => void;
  allUsers: User[];

  // SaaS Master Control & Owner Auth
  saasOwner: SaasOwnerProfile;
  updateSaasOwnerCredentials: (username: string, password: string, name?: string, email?: string, phone?: string) => { success: boolean; message: string };
  moderators: SaasModerator[];
  addModerator: (mod: Omit<SaasModerator, 'id' | 'role' | 'created_at'>) => void;
  updateModerator: (id: string, mod: Partial<SaasModerator>) => void;
  deleteModerator: (id: string) => void;

  // View & Auth Role
  isAuthenticated: boolean;
  logout: () => void;
  activeAuthRole: 'saas_owner' | 'saas_moderator' | 'company_user';
  activeModerator?: SaasModerator;
  isSaasControlOpen: boolean;
  setIsSaasControlOpen: (open: boolean) => void;
  loginAsSaasOwner: (user: string, pass: string) => { success: boolean; message: string };
  loginAsModerator: (user: string, pass: string) => { success: boolean; message: string };
  loginAsCompanyUser: (tenantCodeOrId: string, usernameOrEmail: string, pass: string) => Promise<{ success: boolean; message: string }>;
  impersonateTenant: (tenantId: string) => void;
  exitToSaasControl: () => void;

  // Subscriber / Tenant Management
  addTenantSubscriber: (data: {
    name: string;
    code: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    currency?: string;
    plan: SubscriptionPlan;
    duration_type: 'days' | 'months' | 'years';
    duration_val: number;
    price_bdt: number;
    payment_status: 'paid' | 'partial' | 'due';
    max_vehicles: number;
    max_users: number;
    max_pumps: number;
    super_admin_name: string;
    super_admin_username: string;
    super_admin_password: string;
    super_admin_email: string;
    super_admin_phone?: string;
    must_change_password?: boolean;
    features?: {
      tanker_bowzer: boolean;
      anomaly_ai: boolean;
      reports_export: boolean;
      qr_scanner: boolean;
      custom_categories: boolean;
    };
    notes?: string;
  }) => Promise<{ success: boolean; tenantId: string; tenant?: Tenant; superAdminUser?: User }>;

  updateTenantSubscription: (tenantId: string, subscriptionUpdates: Partial<TenantSubscription>) => void;
  extendTenantSubscription: (tenantId: string, additionalDays: number) => void;
  setTenantStatus: (tenantId: string, status: SubscriptionStatus) => void;
  updateTenantSuperAdminCredentials: (tenantId: string, username: string, password: string) => void;
  deleteTenantSubscriber: (tenantId: string) => void;
  updateTenantLogo: (tenantId: string, logo: string) => void;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => void;

  // Tenant Internal User & Role/Category Management (for Company Super Admin)
  addCompanyUser: (userData: {
    tenant_id?: string;
    name: string;
    email: string;
    username: string;
    password?: string;
    phone?: string;
    role: UserRole;
    role_title_bn?: string;
    company_id?: string;
    allowed_category_ids?: string[];
    allowed_pump_ids?: string[];
    permissions?: UserPermissions;
    must_change_password?: boolean;
  }) => { success: boolean; userId: string; message?: string };

  updateCompanyUser: (id: string, updates: Partial<User>) => { success?: boolean; message?: string };
  deleteCompanyUser: (id: string) => Promise<{ success?: boolean; message?: string }> | { success?: boolean; message?: string };
  
  // Scoped Collections (filtered by active tenant)
  companies: Company[];
  vendors: Vendor[];
  pumps: FuelPump[];
  fuelTypes: FuelType[];
  categories: VehicleCategory[];
  vehicles: Vehicle[];
  fuelEntries: FuelEntry[];
  payments: PumpPayment[];
  tankers: TankerInventory[];
  tankerLogs: TankerLog[];

  // Statistics
  kpis: {
    todayFuelLiters: number;
    todayFuelCost: number;
    totalPumpOutstanding: number;
    monthFuelLiters: number;
    monthFuelCost: number;
    activeVehiclesCount: number;
    anomalyCount: number;
  };

  // Actions
  addCompany: (comp: Omit<Company, 'id' | 'tenant_id' | 'user_id' | 'created_at'>) => void;
  updateCompany: (id: string, comp: Partial<Company>) => void;
  deleteCompany: (id: string) => void;

  addVendor: (vend: Omit<Vendor, 'id' | 'tenant_id' | 'user_id' | 'created_at'>) => void;
  updateVendor: (id: string, vend: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;

  addPump: (pump: Omit<FuelPump, 'id' | 'tenant_id' | 'user_id' | 'current_balance' | 'created_at'>) => void;
  updatePump: (id: string, pump: Partial<FuelPump>) => void;
  deletePump: (id: string) => void;

  updateFuelPrice: (fuelTypeId: string, newPrice: number) => void;
  addFuelType: (fuelData: { name: string; code?: string; unit?: string; current_price: number }) => Promise<{ success: boolean; message: string; fuelType?: FuelType }>;
  updateFuelType: (id: string, updates: Partial<FuelType>) => Promise<{ success: boolean; message: string }>;
  deleteFuelType: (id: string) => Promise<{ success: boolean; message: string; has_dependencies?: boolean }>;

  // Cascade Delete (Update 7)
  cascadeDeleteTenant: (tenantId: string) => Promise<{ success: boolean; message: string }>;

  // Mandatory Password Change (Update 10)
  changeUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;

  // Bulk Data Import (Update 11)
  bulkImportData: (entityType: string, rows: any[]) => Promise<{ success: boolean; count: number; message: string; new_count?: number; updated_count?: number }>;

  // SaaS Multi-Level Action Approvals (Update 9)
  approvals: PendingApprovalAction[];
  fetchApprovals: () => Promise<void>;
  requestApprovalAction: (req: Omit<PendingApprovalAction, 'id' | 'status' | 'created_at'>) => Promise<{ success: boolean; message: string; action?: PendingApprovalAction }>;
  approveAction: (actionId: string, reviewerName: string) => Promise<{ success: boolean; message: string }>;
  rejectAction: (actionId: string, reviewerName: string, note?: string) => Promise<{ success: boolean; message: string }>;

  addCategory: (cat: Omit<VehicleCategory, 'id' | 'tenant_id' | 'user_id'>) => void;
  updateCategory: (id: string, cat: Partial<VehicleCategory>) => void;
  deleteCategory: (id: string) => void;

  addVehicle: (veh: Omit<Vehicle, 'id' | 'tenant_id' | 'user_id' | 'created_at'>) => void;
  updateVehicle: (id: string, veh: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  addFuelEntry: (entryData: {
    vehicle_id: string;
    company_id: string;
    entry_date: string;
    slip_no: string;
    source_type: 'pump' | 'tanker';
    pump_id?: string;
    tanker_id?: string;
    previous_meter: number;
    current_meter: number;
    fuel_liters: number;
    unit_price?: number;
    receipt_image_url?: string;
    notes?: string;
  }) => { success: boolean; message?: string; isAnomaly?: boolean };

  getFuelPriceForDate: (fuelType: FuelType | undefined, dateStr?: string) => number;

  // Subscription Upgrade & Payment Verification (Update 2)
  subscriptionPayments: SubscriptionPaymentRecord[];
  fetchSubscriptionPayments: () => Promise<void>;
  submitSubscriptionPayment: (paymentData: Omit<SubscriptionPaymentRecord, 'id' | 'status' | 'created_at'>) => Promise<{ success: boolean; message: string; payment?: SubscriptionPaymentRecord }>;
  approveSubscriptionPayment: (id: string, reviewerName?: string) => Promise<{ success: boolean; message: string; new_end_date?: string }>;
  rejectSubscriptionPayment: (id: string, reason?: string, reviewerName?: string) => Promise<{ success: boolean; message: string }>;

  deleteFuelEntry: (id: string) => void;
  updateFuelEntry: (id: string, updates: Partial<FuelEntry>) => void;

  addPumpPayment: (paymentData: {
    pump_id: string;
    payment_date: string;
    amount: number;
    payment_method: 'bank_transfer' | 'cheque' | 'cash' | 'mfs';
    transaction_ref: string;
    notes?: string;
  }) => void;
  deletePumpPayment: (paymentId: string) => void;
  updatePumpPayment: (id: string, updates: Partial<PumpPayment>) => void;

  addTanker: (tanker: Omit<TankerInventory, 'id' | 'tenant_id' | 'user_id'>) => void;
  updateTanker: (id: string, tanker: Partial<TankerInventory>) => void;
  deleteTanker: (id: string) => void;
  addTankerStockIn: (tankerId: string, liters: number, unitCost: number, source: string, notes?: string) => void;
  addTankerDispenseOrAdjustment: (tankerId: string, liters: number, logType: 'dispense_out' | 'dip_adjustment', recipientOrReason: string, notes?: string) => void;

  resetToDefaultData: () => void;

  // Generic Confirm Delete Modal State & Actions
  confirmDeleteModal: {
    isOpen: boolean;
    title: string;
    message: string;
    entityName?: string;
    onConfirm: () => Promise<void> | void;
  } | null;
  requestConfirmDelete: (options: {
    title?: string;
    message: string;
    entityName?: string;
    onConfirm: () => Promise<void> | void;
  }) => void;
  closeConfirmDelete: () => void;
}

const STORAGE_KEY_PREFIX = 'fuelflow_v1_';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'theme') as 'light' | 'dark' | null;
    if (saved === 'light') return 'light';
    return 'dark';
  });

  // Full application is strictly English only
  const [language, setLanguageState] = useState<'en'>('en');

  const setLanguage = (_newLang?: 'bn' | 'en') => {
    setLanguageState('en');
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'user_lang_pref', 'en');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'lang', 'en');
    } catch (e) {}
  };

  // SaaS Platform Owner Credentials & Profile (Default: mashudalone / 00000)
  const [saasOwner, setSaasOwner] = useState<SaasOwnerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'saas_owner');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SAAS_OWNER;
  });

  // SaaS Moderators
  const [moderators, setModerators] = useState<SaasModerator[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'moderators');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MODERATORS;
  });

  // Authentication Session State - Preserves login state across tabs, refresh, and browser sessions
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const localAuth = localStorage.getItem(STORAGE_KEY_PREFIX + 'is_auth');
      if (localAuth === 'true') return true;
      const sessionAuth = sessionStorage.getItem(STORAGE_KEY_PREFIX + 'is_auth');
      if (sessionAuth === 'true') return true;
    } catch (e) {}
    return false;
  });

  const logout = () => {
    setIsAuthenticated(false);
    setIsSaasControlOpenState(false);
    try {
      sessionStorage.setItem(STORAGE_KEY_PREFIX + 'is_auth', 'false');
      localStorage.setItem(STORAGE_KEY_PREFIX + 'is_auth', 'false');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'active_user_id');
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'active_mod_id');
    } catch (e) {}
  };

  // Generic Confirm Delete Modal State
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    entityName?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const requestConfirmDelete = (options: {
    title?: string;
    message: string;
    entityName?: string;
    onConfirm: () => Promise<void> | void;
  }) => {
    setConfirmDeleteModal({
      isOpen: true,
      title: options.title || 'Confirm Deletion',
      message: options.message,
      entityName: options.entityName,
      onConfirm: options.onConfirm
    });
  };

  const closeConfirmDelete = () => {
    setConfirmDeleteModal(null);
  };

  // Auth Mode: saas_owner | saas_moderator | company_user
  const [activeAuthRole, setActiveAuthRole] = useState<'saas_owner' | 'saas_moderator' | 'company_user'>(() => {
    return (localStorage.getItem(STORAGE_KEY_PREFIX + 'auth_role') as any) || 'company_user';
  });

  const [activeModeratorId, setActiveModeratorId] = useState<string | undefined>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'active_mod_id') || undefined;
  });

  // SaaS Control Panel View Flag
  const [isSaasControlOpen, setIsSaasControlOpenState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'saas_control_open');
    if (saved !== null) return saved === 'true';
    return false; // Default to tenant fleet view, but can open anytime via header button or login
  });

  const setIsSaasControlOpen = (open: boolean) => {
    setIsSaasControlOpenState(open);
    localStorage.setItem(STORAGE_KEY_PREFIX + 'saas_control_open', String(open));
  };

  // Tenants & Subscribers (Stateful & Dynamic - Server Authoritative)
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'tenants');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [currentTenantId, setCurrentTenantIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'tenant_id') || 'tenant_1';
  });

  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_PREFIX + 'user_id') || 'usr_super_admin';
  });

  // Helper to ensure unique entities by id
  function dedupeEntitiesById<T extends { id?: string }>(items: T[]): T[] {
    if (!Array.isArray(items)) return [];
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
      if (item && item.id) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          result.push(item);
        }
      } else if (item) {
        result.push(item);
      }
    }
    return result;
  }

  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'companies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_COMPANIES;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'vendors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_VENDORS;
  });

  const [pumps, setPumps] = useState<FuelPump[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'pumps');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_PUMPS;
  });

  const [fuelTypes, setFuelTypes] = useState<FuelType[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'fuel_types');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_FUEL_TYPES;
  });

  const [categories, setCategories] = useState<VehicleCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_CATEGORIES;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'vehicles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_VEHICLES;
  });

  const [fuelEntries, setFuelEntries] = useState<FuelEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'fuel_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_FUEL_ENTRIES;
  });

  const [payments, setPayments] = useState<PumpPayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'payments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_PAYMENTS;
  });

  const [tankers, setTankers] = useState<TankerInventory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'tankers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_TANKERS;
  });

  const [tankerLogs, setTankerLogs] = useState<TankerLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + 'tanker_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return dedupeEntitiesById(parsed);
      }
    } catch (e) {}
    return INITIAL_TANKER_LOGS;
  });

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'lang', language);
      localStorage.setItem(STORAGE_KEY_PREFIX + 'user_lang_pref', language);
    } catch (e) {}
  }, [language]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'tenant_id', currentTenantId);
  }, [currentTenantId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'pumps', JSON.stringify(pumps));
  }, [pumps]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'fuel_types', JSON.stringify(fuelTypes));
  }, [fuelTypes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'fuel_entries', JSON.stringify(fuelEntries));
  }, [fuelEntries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'tankers', JSON.stringify(tankers));
  }, [tankers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'tanker_logs', JSON.stringify(tankerLogs));
  }, [tankerLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'saas_owner', JSON.stringify(saasOwner));
  }, [saasOwner]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'moderators', JSON.stringify(moderators));
  }, [moderators]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(tenants));
  }, [tenants]);

  // Tenant suspension notice state
  const [tenantSuspensionNotice, setTenantSuspensionNotice] = useState<string>('');
  const clearTenantSuspensionNotice = () => setTenantSuspensionNotice('');

  // Cross-browser & server-side tenant fetch (Server Authoritative)
  const refreshTenantsFromServer = async () => {
    try {
      const res = await fetch(`/api/tenants/all?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const json = await res.json();
        const serverList: Tenant[] = Array.isArray(json)
          ? json
          : (json.success && Array.isArray(json.data) ? json.data : []);

        const serverTenants: Tenant[] = serverList.filter(t => t && t.id && !t.deleted_at);

        setTenants(serverTenants);
        try {
          localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(serverTenants));
          localStorage.removeItem('fuelflow_deleted_tenants');
        } catch (e) {}
      }
    } catch (e) {
      // Server offline or initializing
    }
  };

  // Cross-browser & server-side users fetch (Server Authoritative)
  const refreshUsersFromServer = async () => {
    try {
      const res = await fetch(`/api/users?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const json = await res.json();
        const serverList: User[] = json.success && Array.isArray(json.data) 
          ? json.data 
          : (Array.isArray(json) ? json : []);
        const serverUsers: User[] = serverList.filter((su: any) => su && su.id);

        setUsers(serverUsers);
        try {
          localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(serverUsers));
        } catch (e) {}
      }
    } catch (e) {
      // Server offline or initializing
    }
  };

  // Cross-browser, cloud database & server disk fleet data fetch (Safe merge and self-healing auto-push)
  const refreshFleetDataFromServer = async () => {
    try {
      const res = await fetch(`/api/fleet/all?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const fleetData = json.data;

          // Helper to safely merge server items and local items ensuring unique IDs & unique names per tenant
          const safeMergeEntities = <T extends { id?: string; name?: string; tenant_id?: string }>(serverItems: T[] = [], localItems: T[] = []) => {
            const map = new Map<string, T>();
            const nameToIdMap = new Map<string, string>(); // (tenant_id + '::' + name.toLowerCase()) -> id
            (serverItems || []).forEach(item => {
              if (item && item.id) {
                const nameKey = item.name ? ((item.tenant_id || '') + '::' + item.name.trim().toLowerCase()) : null;
                if (nameKey && nameToIdMap.has(nameKey)) {
                  // Duplicate name on server, skip duplicate
                  return;
                }
                map.set(item.id, item);
                if (nameKey) nameToIdMap.set(nameKey, item.id);
              }
            });
            const missingOnServer: T[] = [];
            (localItems || []).forEach(item => {
              if (item && item.id) {
                const nameKey = item.name ? ((item.tenant_id || '') + '::' + item.name.trim().toLowerCase()) : null;
                const existingIdByName = nameKey ? nameToIdMap.get(nameKey) : null;
                if (existingIdByName) {
                  // Entity with same name already exists, merge attributes into existing
                  const existing = map.get(existingIdByName)!;
                  map.set(existingIdByName, { ...existing, ...item, id: existingIdByName });
                  return;
                }
                if (!map.has(item.id)) {
                  map.set(item.id, item);
                  if (nameKey) nameToIdMap.set(nameKey, item.id);
                  missingOnServer.push(item);
                }
              }
            });
            return { merged: Array.from(map.values()), missingOnServer };
          };

          // Merge vehicles
          if (Array.isArray(fleetData.vehicles)) {
            setVehicles(prev => {
              let deletedIds: string[] = [];
              try {
                deletedIds = JSON.parse(localStorage.getItem(STORAGE_KEY_PREFIX + 'deleted_vehicle_ids') || '[]');
              } catch (e) {}

              const cleanServerVehicles = (fleetData.vehicles || []).filter((v: any) => v && v.id && !deletedIds.includes(v.id));
              const { merged, missingOnServer } = safeMergeEntities(cleanServerVehicles, prev);
              const trulyMissing = missingOnServer.filter(item => item.id && !deletedIds.includes(item.id));
              if (trulyMissing.length > 0) {
                fetch('/api/fleet/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ vehicles: trulyMissing })
                }).catch(() => {});
              }
              const finalVehicles = merged.filter(v => v && v.id && !deletedIds.includes(v.id));
              try {
                localStorage.setItem(STORAGE_KEY_PREFIX + 'vehicles', JSON.stringify(finalVehicles));
              } catch (e) {}
              return finalVehicles;
            });
          }

          // Merge fuelEntries
          if (Array.isArray(fleetData.fuelEntries) && fleetData.fuelEntries.length > 0) {
            setFuelEntries(prev => {
              const { merged, missingOnServer } = safeMergeEntities(fleetData.fuelEntries, prev);
              if (missingOnServer.length > 0) {
                fetch('/api/fleet/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fuelEntries: missingOnServer })
                }).catch(() => {});
              }
              return merged;
            });
          }

          // Merge pumps
          if (Array.isArray(fleetData.pumps) && fleetData.pumps.length > 0) {
            setPumps(prev => {
              const { merged, missingOnServer } = safeMergeEntities(fleetData.pumps, prev);
              if (missingOnServer.length > 0) {
                fetch('/api/fleet/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ pumps: missingOnServer })
                }).catch(() => {});
              }
              return merged;
            });
          }

          // Merge payments
          if (Array.isArray(fleetData.payments) && fleetData.payments.length > 0) {
            setPayments(prev => {
              const { merged, missingOnServer } = safeMergeEntities(fleetData.payments, prev);
              if (missingOnServer.length > 0) {
                fetch('/api/fleet/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ payments: missingOnServer })
                }).catch(() => {});
              }
              return merged;
            });
          }

          // Merge categories
          if (Array.isArray(fleetData.categories) && fleetData.categories.length > 0) {
            setCategories(prev => {
              const { merged, missingOnServer } = safeMergeEntities(fleetData.categories, prev);
              if (missingOnServer.length > 0) {
                fetch('/api/fleet/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ categories: missingOnServer })
                }).catch(() => {});
              }
              return merged;
            });
          }

          // Merge tankers
          if (Array.isArray(fleetData.tankers) && fleetData.tankers.length > 0) {
            setTankers(prev => {
              const { merged, missingOnServer } = safeMergeEntities(fleetData.tankers, prev);
              if (missingOnServer.length > 0) {
                fetch('/api/fleet/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tankers: missingOnServer })
                }).catch(() => {});
              }
              return merged;
            });
          }

          // Merge tankerLogs
          if (Array.isArray(fleetData.tankerLogs) && fleetData.tankerLogs.length > 0) {
            setTankerLogs(prev => {
              const { merged, missingOnServer } = safeMergeEntities(fleetData.tankerLogs, prev);
              if (missingOnServer.length > 0) {
                fetch('/api/fleet/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tankerLogs: missingOnServer })
                }).catch(() => {});
              }
              return merged;
            });
          }

          // Merge companies
          if (Array.isArray(fleetData.companies) && fleetData.companies.length > 0) {
            setCompanies(prev => {
              const { merged } = safeMergeEntities(fleetData.companies, prev);
              return merged;
            });
          }

          // Merge vendors
          if (Array.isArray(fleetData.vendors) && fleetData.vendors.length > 0) {
            setVendors(prev => {
              const { merged } = safeMergeEntities(fleetData.vendors, prev);
              return merged;
            });
          }

          // Merge fuelTypes
          if (Array.isArray(fleetData.fuelTypes) && fleetData.fuelTypes.length > 0) {
            setFuelTypes(prev => {
              const { merged } = safeMergeEntities(fleetData.fuelTypes, prev);
              return merged;
            });
          }
        }
      }
    } catch (e) {
      // Offline fallback active
    }
  };

  const bulkDeleteVehicles = async (ids: string[]) => {
    if (!ids || ids.length === 0) return { success: false, deletedCount: 0 };
    try {
      const deletedIdsKey = STORAGE_KEY_PREFIX + 'deleted_vehicle_ids';
      let existingDeleted: string[] = [];
      try {
        existingDeleted = JSON.parse(localStorage.getItem(deletedIdsKey) || '[]');
      } catch (e) {}

      ids.forEach(id => {
        if (!existingDeleted.includes(id)) existingDeleted.push(id);
      });
      localStorage.setItem(deletedIdsKey, JSON.stringify(existingDeleted));

      setVehicles(prev => {
        const updated = prev.filter(v => !ids.includes(v.id));
        localStorage.setItem(STORAGE_KEY_PREFIX + 'vehicles', JSON.stringify(updated));
        return updated;
      });

      setFuelEntries(prev => {
        const updated = prev.filter(e => !ids.includes(e.vehicle_id));
        localStorage.setItem(STORAGE_KEY_PREFIX + 'fuel_entries', JSON.stringify(updated));
        return updated;
      });

      const res = await fetch('/api/fleet/vehicles/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      await SyncManager.syncAll();
      return { success: true, deletedCount: ids.length, ...data };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const bulkDeleteDrivers = async (vehicleIds: string[]) => {
    if (!vehicleIds || vehicleIds.length === 0) return { success: false, clearedCount: 0 };
    try {
      setVehicles(prev => {
        const updated = prev.map(v => vehicleIds.includes(v.id) ? { ...v, driver_name: 'N/A', driver_phone: 'N/A' } : v);
        localStorage.setItem(STORAGE_KEY_PREFIX + 'vehicles', JSON.stringify(updated));
        return updated;
      });

      const res = await fetch('/api/fleet/drivers/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleIds })
      });
      const data = await res.json();
      await SyncManager.syncAll();
      return { success: true, clearedCount: vehicleIds.length, ...data };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const SyncManager = useMemo(() => ({
    syncAll: async () => {
      try {
        await Promise.all([
          refreshTenantsFromServer(),
          refreshUsersFromServer(),
          refreshFleetDataFromServer()
        ]);
      } catch (e) {
        console.error("SyncManager syncAll error:", e);
      }
    },
    reconcileState: async () => {
      await SyncManager.syncAll();
    },
    bulkDeleteVehicles,
    bulkDeleteDrivers
  }), [refreshTenantsFromServer, refreshUsersFromServer, refreshFleetDataFromServer, bulkDeleteVehicles, bulkDeleteDrivers]);

  useEffect(() => {
    SyncManager.syncAll();

    const handleFocus = () => {
      SyncManager.syncAll();
    };
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => {
      SyncManager.syncAll();
    }, 6000);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('fuelflow_tenants_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'REFRESH_TENANTS' || event.data?.type === 'REFRESH_USERS' || event.data?.type === 'REFRESH_FLEET') {
          SyncManager.syncAll();
        }
      };
    } catch (e) {}

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
      channel?.close();
    };
  }, [SyncManager]);

  // Filtered active tenants list for login and public selection (ISSUE 2 Fix)
  const activeTenants = useMemo(() => {
    return tenants.filter(t => !t.deleted_at && (t.status === 'active' || (!t.status && t.subscription?.status === 'active')));
  }, [tenants]);

  // Global Middleware Enforcement: CheckTenantStatus (ISSUE 2 Fix)
  // If an active user's company is suspended or deleted, immediately log them out and redirect with error notice
  useEffect(() => {
    if (isAuthenticated && activeAuthRole === 'company_user' && currentTenantId) {
      const activeT = tenants.find(t => t.id === currentTenantId);
      if (activeT) {
        const isSuspended =
          Boolean(activeT.deleted_at) ||
          activeT.status === 'suspended' ||
          activeT.status === 'inactive' ||
          activeT.subscription?.status === 'suspended' ||
          activeT.subscription?.status === 'inactive';

        if (isSuspended) {
          logout();
          setTenantSuspensionNotice("Your company account has been suspended. Please contact support.");
        }
      }
    }
  }, [tenants, currentTenantId, isAuthenticated, activeAuthRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_role', activeAuthRole);
  }, [activeAuthRole]);

  useEffect(() => {
    if (activeModeratorId) {
      localStorage.setItem(STORAGE_KEY_PREFIX + 'active_mod_id', activeModeratorId);
    } else {
      localStorage.removeItem(STORAGE_KEY_PREFIX + 'active_mod_id');
    }
  }, [activeModeratorId]);

  const currentTenant = useMemo(() => {
    const matched = tenants.find(t => t && t.id === currentTenantId);
    if (matched) return matched;
    if (tenants.length > 0 && tenants[0]) return tenants[0];
    return DEFAULT_FALLBACK_TENANT;
  }, [tenants, currentTenantId]);

  const activeModerator = useMemo(() => {
    if (!activeModeratorId) return undefined;
    return moderators.find(m => m.id === activeModeratorId);
  }, [moderators, activeModeratorId]);

  const currentUser = useMemo(() => {
    if (activeAuthRole === 'saas_owner') {
      return {
        id: saasOwner?.id || 'saas_owner_1',
        tenant_id: currentTenantId || 'tenant_default',
        name: saasOwner?.name || 'Md. Mashud (Platform Owner)',
        username: saasOwner?.username || 'mashudalone',
        email: saasOwner?.email || 'admin.fuelnest@gmail.com',
        role: 'super_admin' as const,
        role_title_bn: 'Platform Owner',
        status: 'active' as const
      };
    }
    if (activeAuthRole === 'saas_moderator' && activeModerator) {
      return {
        id: activeModerator.id,
        tenant_id: currentTenantId || 'tenant_default',
        name: activeModerator.name,
        username: activeModerator.username,
        email: activeModerator.email || 'moderator@company.com',
        role: 'super_admin' as const,
        role_title_bn: 'Platform Moderator',
        status: 'active' as const
      };
    }

    // 1. Matched user in current tenant with currentUserId
    const exactMatch = users.find(u => u && u.tenant_id === currentTenantId && u.id === currentUserId);
    if (exactMatch) return exactMatch;

    // 2. Any super_admin in current tenant
    const superAdmin = users.find(u => u && u.tenant_id === currentTenantId && u.role === 'super_admin');
    if (superAdmin) return superAdmin;

    // 3. Any user belonging to current tenant
    const tenantUser = users.find(u => u && u.tenant_id === currentTenantId);
    if (tenantUser) return tenantUser;

    // 4. Fallback to currentUserId or first user
    const fallbackUser = users.find(u => u && u.id === currentUserId) || (users.length > 0 ? users[0] : null);
    return fallbackUser || DEFAULT_FALLBACK_USER;
  }, [users, currentUserId, currentTenantId, activeAuthRole, saasOwner, activeModerator]);

  // Strict Tenant-scoped records (Zero cross-tenant data leakage)
  const scopedCompanies = useMemo(() => {
    const list = companies.filter(c => c.tenant_id === currentTenantId);
    const seen = new Set<string>();
    return list.filter(c => {
      const key = (c.name || '').toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [companies, currentTenantId]);

  const scopedVendors = useMemo(() => {
    const list = vendors.filter(v => v.tenant_id === currentTenantId);
    const seen = new Set<string>();
    return list.filter(v => {
      const key = (v.name || '').toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [vendors, currentTenantId]);

  const scopedPumps = useMemo(() => {
    const list = pumps.filter(p => p.tenant_id === currentTenantId);
    const seen = new Set<string>();
    return list.filter(p => {
      const key = (p.name || '').toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [pumps, currentTenantId]);

  const scopedFuelTypes = useMemo(() => {
    const list = fuelTypes.filter(f => f.tenant_id === currentTenantId);
    if (list.length > 0) return list;
    return fuelTypes.filter(f => !f.tenant_id);
  }, [fuelTypes, currentTenantId]);

  const scopedCategories = useMemo(() => {
    const list = categories.filter(c => c.tenant_id === currentTenantId);
    if (list.length > 0) return list;
    return categories.filter(c => !c.tenant_id);
  }, [categories, currentTenantId]);

  const scopedVehicles = useMemo(() => {
    const list = vehicles.filter(v => v.tenant_id === currentTenantId);
    let effective = list;
    if (currentUser?.role === 'client_viewer' && currentUser?.company_id) {
      effective = effective.filter(v => v.company_id === currentUser.company_id);
    }
    // Category-Based Access Control enforced for Subscriber Users
    if (
      currentUser?.allowed_category_ids &&
      currentUser.allowed_category_ids.length > 0 &&
      !currentUser.allowed_category_ids.includes('all')
    ) {
      effective = effective.filter(v => currentUser.allowed_category_ids!.includes(v.category_id));
    }
    return effective;
  }, [vehicles, currentTenantId, currentUser]);

  const scopedFuelEntries = useMemo(() => {
    const list = fuelEntries.filter(e => e.tenant_id === currentTenantId);
    let effective = list;
    if (currentUser?.role === 'client_viewer' && currentUser?.company_id) {
      effective = effective.filter(e => e.company_id === currentUser.company_id);
    }
    return effective;
  }, [fuelEntries, currentTenantId, currentUser]);

  const scopedPayments = useMemo(() => {
    return payments.filter(p => p.tenant_id === currentTenantId);
  }, [payments, currentTenantId]);

  const scopedTankers = useMemo(() => {
    return tankers.filter(t => t.tenant_id === currentTenantId);
  }, [tankers, currentTenantId]);

  const scopedTankerLogs = useMemo(() => {
    return tankerLogs.filter(l => l.tenant_id === currentTenantId);
  }, [tankerLogs, currentTenantId]);

  // KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonthPrefix = today.substring(0, 7);

    let todayLiters = 0;
    let todayCost = 0;
    let monthLiters = 0;
    let monthCost = 0;
    let anomalyCount = 0;

    scopedFuelEntries.forEach(entry => {
      if (entry.entry_date === today) {
        todayLiters += entry.fuel_liters;
        todayCost += entry.total_amount;
      }
      if (entry.entry_date.startsWith(thisMonthPrefix)) {
        monthLiters += entry.fuel_liters;
        monthCost += entry.total_amount;
      }
      if (entry.is_anomaly) {
        anomalyCount += 1;
      }
    });

    const totalPumpOutstanding = scopedPumps.reduce((acc, p) => acc + (p.current_balance || 0), 0);

    return {
      todayFuelLiters: Math.round(todayLiters * 10) / 10,
      todayFuelCost: Math.round(todayCost),
      totalPumpOutstanding: Math.round(totalPumpOutstanding),
      monthFuelLiters: Math.round(monthLiters * 10) / 10,
      monthFuelCost: Math.round(monthCost),
      activeVehiclesCount: scopedVehicles.filter(v => v.status === 'active').length,
      anomalyCount
    };
  }, [scopedFuelEntries, scopedPumps, scopedVehicles]);

  // Company CRUD
  const addCompany = (comp: Omit<Company, 'id' | 'tenant_id' | 'user_id' | 'created_at'>) => {
    const newComp: Company = {
      ...comp,
      id: 'comp_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id,
      created_at: new Date().toISOString().split('T')[0]
    };
    setCompanies(prev => [newComp, ...prev]);
    fetch('/api/fleet/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companies: [newComp] })
    }).catch(() => {});
  };

  const updateCompany = (id: string, comp: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...comp } : c));
    fetch(`/api/fleet/companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comp)
    }).catch(() => {});
  };

  const deleteCompany = (id: string) => {
    const comp = companies.find(c => c.id === id);
    requestConfirmDelete({
      title: 'Delete Customer Company',
      message: 'Are you sure you want to permanently delete this customer company?',
      entityName: comp ? `${comp.name} (${comp.code})` : id,
      onConfirm: async () => {
        try {
          await fetch(`/api/fleet/companies/${id}`, { method: 'DELETE' });
        } catch {}
        setCompanies(prev => prev.filter(c => c.id !== id));
      }
    });
  };

  // Vendor CRUD
  const addVendor = (vend: Omit<Vendor, 'id' | 'tenant_id' | 'user_id' | 'created_at'>) => {
    const newVend: Vendor = {
      ...vend,
      id: 'vnd_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id,
      created_at: new Date().toISOString().split('T')[0]
    };
    setVendors(prev => [newVend, ...prev]);
    fetch('/api/fleet/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendors: [newVend] })
    }).catch(() => {});
  };

  const updateVendor = (id: string, vend: Partial<Vendor>) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...vend } : v));
    fetch(`/api/fleet/vendors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vend)
    }).catch(() => {});
  };

  const deleteVendor = (id: string) => {
    const vend = vendors.find(v => v.id === id);
    requestConfirmDelete({
      title: 'Delete Vendor',
      message: 'Are you sure you want to permanently delete this vendor?',
      entityName: vend ? `${vend.name}` : id,
      onConfirm: async () => {
        try {
          await fetch(`/api/fleet/vendors/${id}`, { method: 'DELETE' });
        } catch {}
        setVendors(prev => prev.filter(v => v.id !== id));
      }
    });
  };

  // Pump CRUD
  const addPump = (pump: Omit<FuelPump, 'id' | 'tenant_id' | 'user_id' | 'current_balance' | 'created_at'>) => {
    const newPump: FuelPump = {
      ...pump,
      id: 'pump_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id,
      current_balance: pump.opening_balance || 0,
      created_at: new Date().toISOString().split('T')[0]
    };
    setPumps(prev => [newPump, ...prev]);
    fetch('/api/fleet/pumps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPump)
    }).catch(() => {});
  };

  const updatePump = (id: string, pump: Partial<FuelPump>) => {
    setPumps(prev => prev.map(p => p.id === id ? { ...p, ...pump } : p));
    fetch(`/api/fleet/pumps/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pump)
    }).catch(() => {});
  };

  const deletePump = (id: string) => {
    const pump = pumps.find(p => p.id === id);
    requestConfirmDelete({
      title: 'Delete Fuel Pump',
      message: 'Are you sure you want to permanently delete this fuel pump? Once deleted, it will no longer appear for new fuel entries.',
      entityName: pump ? `${pump.name} (${pump.location || ''})` : id,
      onConfirm: async () => {
        try {
          await fetch(`/api/fleet/pumps/${id}`, { method: 'DELETE' });
        } catch {}
        setPumps(prev => prev.filter(p => p.id !== id));
      }
    });
  };

  // Fuel Price Update
  const updateFuelPrice = (fuelTypeId: string, newPrice: number) => {
    const today = new Date().toISOString().split('T')[0];
    let updatedFuelType: FuelType | null = null;
    setFuelTypes(prev => prev.map(ft => {
      if (ft.id === fuelTypeId) {
        const history = [...ft.price_history, { date: today, price: newPrice, changed_by: currentUser.name }];
        updatedFuelType = {
          ...ft,
          current_price: newPrice,
          price_history: history,
          updated_at: today
        };
        return updatedFuelType;
      }
      return ft;
    }));
    if (updatedFuelType) {
      fetch('/api/fleet/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fuelTypes: [updatedFuelType] })
      }).catch(() => {});
    }
  };

  // Category CRUD
  const addCategory = (cat: Omit<VehicleCategory, 'id' | 'tenant_id' | 'user_id'>) => {
    const newCat: VehicleCategory = {
      ...cat,
      id: 'cat_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id
    };
    setCategories(prev => [...prev, newCat]);
    fetch('/api/fleet/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat)
    }).catch(() => {});
  };

  const updateCategory = (id: string, cat: Partial<VehicleCategory>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...cat } : c));
    fetch(`/api/fleet/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    }).catch(() => {});
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    requestConfirmDelete({
      title: 'Delete Vehicle Category',
      message: 'Are you sure you want to permanently delete this vehicle category?',
      entityName: cat ? `${cat.name}` : id,
      onConfirm: async () => {
        try {
          await fetch(`/api/fleet/categories/${id}`, { method: 'DELETE' });
        } catch {}
        setCategories(prev => prev.filter(c => c.id !== id));
      }
    });
  };

  // Vehicle CRUD
  const addVehicle = (veh: Omit<Vehicle, 'id' | 'tenant_id' | 'user_id' | 'created_at'>) => {
    const newVeh: Vehicle = {
      ...veh,
      id: 'veh_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id,
      created_at: new Date().toISOString().split('T')[0]
    };
    setVehicles(prev => [newVeh, ...prev]);
    fetch('/api/fleet/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVeh)
    }).catch(() => {});
  };

  const updateVehicle = (id: string, veh: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...veh } : v));
    fetch(`/api/fleet/vehicles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(veh)
    }).catch(() => {});
  };

  const deleteVehicle = (id: string) => {
    const veh = vehicles.find(v => v.id === id);
    requestConfirmDelete({
      title: 'Delete Vehicle',
      message: 'Are you sure you want to permanently delete this vehicle and all its dependent fuel history logs?',
      entityName: veh ? `${veh.vehicle_number}` : id,
      onConfirm: async () => {
        try {
          const deletedIdsKey = STORAGE_KEY_PREFIX + 'deleted_vehicle_ids';
          const existingDeleted = JSON.parse(localStorage.getItem(deletedIdsKey) || '[]');
          if (!existingDeleted.includes(id)) {
            existingDeleted.push(id);
            localStorage.setItem(deletedIdsKey, JSON.stringify(existingDeleted));
          }
        } catch (e) {}

        setVehicles(prev => {
          const updated = prev.filter(v => v.id !== id);
          try {
            localStorage.setItem(STORAGE_KEY_PREFIX + 'vehicles', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        setFuelEntries(prev => {
          const updated = prev.filter(e => e.vehicle_id !== id);
          try {
            localStorage.setItem(STORAGE_KEY_PREFIX + 'fuel_entries', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        try {
          await fetch(`/api/fleet/vehicles/${id}`, { method: 'DELETE' });
        } catch (e) {}
      }
    });
  };

  // Core Ultra-Fast Fuel Entry with Smart Calculations
  const addFuelEntry = (entryData: {
    vehicle_id: string;
    company_id: string;
    entry_date: string;
    slip_no: string;
    source_type: 'pump' | 'tanker';
    pump_id?: string;
    tanker_id?: string;
    previous_meter: number;
    current_meter: number;
    fuel_liters: number;
    unit_price?: number;
    receipt_image_url?: string;
    notes?: string;
  }) => {
    const vehicle = vehicles.find(v => v.id === entryData.vehicle_id);
    if (!vehicle) {
      return { success: false, message: 'Vehicle not found.' };
    }

    const category = categories.find(c => c.id === vehicle.category_id);
    const fuelType = fuelTypes.find(f => f.id === vehicle.fuel_type_id);

    // Exact Historical Price Resolution:
    // 1) If user/form explicitly provided a unit_price for this slip, use that.
    // 2) Otherwise, resolve the exact price active on entryData.entry_date from fuelType.price_history!
    // Changing future fuel prices will NEVER alter this recorded entry!
    const effectiveHistoricalPrice = getEffectiveFuelPriceForDate(fuelType, entryData.entry_date);
    const unitPrice = (entryData.unit_price !== undefined && entryData.unit_price > 0)
      ? Number(entryData.unit_price)
      : effectiveHistoricalPrice;

    const distanceTraveled = entryData.current_meter - entryData.previous_meter;
    if (distanceTraveled <= 0) {
      return { success: false, message: 'Current meter reading must be greater than previous meter reading.' };
    }

    const totalAmount = Math.round(entryData.fuel_liters * unitPrice * 100) / 100;
    
    // Mileage calculation
    // If kmpl: distance / liters
    // If lph: liters / distance (hours)
    let calculatedMileage = 0;
    let isAnomaly = false;
    let anomalyDiffPercent = 0;
    let anomalyReason = '';

    const isLph = category?.metric_type === 'lph';

    if (isLph) {
      // Liters per Hour
      calculatedMileage = Math.round((entryData.fuel_liters / distanceTraveled) * 100) / 100;
      const benchmark = vehicle.expected_benchmark || category?.default_benchmark || 15.0;
      // If fuel consumption per hour is >25% higher than benchmark, trigger anomaly!
      const diff = ((calculatedMileage - benchmark) / benchmark) * 100;
      if (diff > 25) {
        isAnomaly = true;
        anomalyDiffPercent = Math.round(diff * 10) / 10;
        anomalyReason = `Excessive hourly fuel consumption (${anomalyDiffPercent}% higher). Engine overload or equipment defect suspected.`;
      }
    } else {
      // KMPL (Kilometers per Liter)
      calculatedMileage = Math.round((distanceTraveled / entryData.fuel_liters) * 100) / 100;
      const benchmark = vehicle.expected_benchmark || category?.default_benchmark || 8.0;
      // If mileage is >20% lower than benchmark, trigger anomaly!
      const diff = ((calculatedMileage - benchmark) / benchmark) * 100;
      if (diff < -20) {
        isAnomaly = true;
        anomalyDiffPercent = Math.round(diff * 10) / 10;
        anomalyReason = `Abnormally low mileage (${Math.abs(anomalyDiffPercent)}% drop). Potential fuel pipe leak or fuel siphoning/theft suspected!`;
      }
    }

    const newEntry: FuelEntry = {
      id: 'entry_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id,
      entry_date: entryData.entry_date,
      slip_no: entryData.slip_no || `SLIP-${Math.floor(10000 + Math.random() * 90000)}`,
      vehicle_id: entryData.vehicle_id,
      company_id: entryData.company_id,
      source_type: entryData.source_type,
      pump_id: entryData.pump_id,
      tanker_id: entryData.tanker_id,
      previous_meter: entryData.previous_meter,
      current_meter: entryData.current_meter,
      distance_traveled: distanceTraveled,
      fuel_liters: entryData.fuel_liters,
      unit_price: unitPrice,
      total_amount: totalAmount,
      calculated_mileage: calculatedMileage,
      benchmark_mileage: vehicle.expected_benchmark,
      is_anomaly: isAnomaly,
      anomaly_diff_percent: isAnomaly ? anomalyDiffPercent : undefined,
      anomaly_reason: isAnomaly ? anomalyReason : undefined,
      receipt_image_url: entryData.receipt_image_url,
      notes: entryData.notes,
      created_by_name: currentUser.name,
      created_at: new Date().toISOString()
    };

    // Update vehicle's current odometer
    setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, current_odometer: entryData.current_meter } : v));
    fetch(`/api/fleet/vehicles/${vehicle.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_odometer: entryData.current_meter })
    }).catch(() => {});

    // If source is Pump, increase pump's current_balance
    if (entryData.source_type === 'pump' && entryData.pump_id) {
      setPumps(prev => prev.map(p => {
        if (p.id === entryData.pump_id) {
          const newBal = (p.current_balance || 0) + totalAmount;
          fetch(`/api/fleet/pumps/${p.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_balance: newBal })
          }).catch(() => {});
          return { ...p, current_balance: newBal };
        }
        return p;
      }));
    }

    // If source is Tanker, deduct stock from tanker and create tanker log
    if (entryData.source_type === 'tanker' && entryData.tanker_id) {
      const tanker = tankers.find(t => t.id === entryData.tanker_id);
      if (tanker) {
        const prevStock = tanker.current_stock_liters;
        const newStock = Math.max(0, prevStock - entryData.fuel_liters);
        setTankers(prev => prev.map(t => t.id === tanker.id ? { ...t, current_stock_liters: newStock } : t));
        fetch(`/api/fleet/tankers/${tanker.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_stock_liters: newStock })
        }).catch(() => {});
        
        const newLog: TankerLog = {
          id: 'tlog_' + Date.now(),
          tenant_id: currentTenantId,
          user_id: currentUser.id,
          tanker_id: tanker.id,
          log_type: 'dispense_out',
          date: entryData.entry_date,
          liters: entryData.fuel_liters,
          source_or_vehicle: `${vehicle.vehicle_number} (${category?.name})`,
          notes: `Fuel entry ${newEntry.slip_no}`,
          previous_stock: prevStock,
          new_stock: newStock,
          created_at: new Date().toISOString()
        };
        setTankerLogs(prev => [newLog, ...prev]);
        fetch('/api/fleet/tanker-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog)
        }).catch(() => {});
      }
    }

    setFuelEntries(prev => [newEntry, ...prev]);
    fetch('/api/fleet/fuel-entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    }).catch(() => {});
    return { success: true, isAnomaly };
  };

  const deleteFuelEntry = (id: string) => {
    const target = fuelEntries.find(e => e.id === id);
    requestConfirmDelete({
      title: 'Delete Fuel Entry',
      message: 'Are you sure you want to permanently delete this fuel entry? If pump credit or tanker stock was affected, balances will be automatically restored.',
      entityName: target ? `Slip #${target.slip_no} (${target.fuel_liters} Liters, BDT ${target.total_amount?.toLocaleString()})` : id,
      onConfirm: async () => {
        if (target) {
          // If pump entry, adjust pump balance (reduce due)
          if (target.source_type === 'pump' && target.pump_id) {
            setPumps(prev => prev.map(p => {
              if (p.id === target.pump_id) {
                const newBal = (p.current_balance || 0) - target.total_amount;
                fetch(`/api/fleet/pumps/${p.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ current_balance: newBal })
                }).catch(() => {});
                return { ...p, current_balance: newBal };
              }
              return p;
            }));
          }
          // If tanker entry, restore fuel stock to tanker
          if (target.source_type === 'tanker' && target.tanker_id) {
            setTankers(prev => prev.map(t => {
              if (t.id === target.tanker_id) {
                const newStock = t.current_stock_liters + target.fuel_liters;
                fetch(`/api/fleet/tankers/${t.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ current_stock_liters: newStock })
                }).catch(() => {});
                return { ...t, current_stock_liters: newStock };
              }
              return t;
            }));
          }
        }
        try {
          await fetch(`/api/fleet/fuel-entries/${id}`, { method: 'DELETE' });
        } catch {}
        setFuelEntries(prev => prev.filter(e => e.id !== id));
      }
    });
  };

  const updateFuelEntry = (id: string, updates: Partial<FuelEntry>) => {
    const existing = fuelEntries.find(e => e.id === id);
    if (!existing) return;

    // Recalculate amount if liters or rate changed
    const newLiters = updates.fuel_liters !== undefined ? Number(updates.fuel_liters) : existing.fuel_liters;
    const newRate = updates.fuel_price_per_liter !== undefined ? Number(updates.fuel_price_per_liter) : existing.fuel_price_per_liter;
    const newTotal = updates.total_amount !== undefined ? Number(updates.total_amount) : Number((newLiters * newRate).toFixed(2));

    // Calculate updated mileage
    const newDistance = updates.distance_traveled !== undefined ? Number(updates.distance_traveled) : existing.distance_traveled;
    const calculatedMileage = newLiters > 0 ? Number((newDistance / newLiters).toFixed(2)) : existing.calculated_mileage;

    // Adjust pump balance if pump changed or amount changed
    if (existing.source_type === 'pump' && existing.pump_id) {
      const amountDiff = newTotal - existing.total_amount;
      if (amountDiff !== 0) {
        setPumps(prev => prev.map(p => {
          if (p.id === existing.pump_id) {
            const updatedBal = (p.current_balance || 0) + amountDiff;
            fetch(`/api/fleet/pumps/${p.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ current_balance: updatedBal })
            }).catch(() => {});
            return { ...p, current_balance: updatedBal };
          }
          return p;
        }));
      }
    }

    // Adjust bowzer stock if liters changed
    if (existing.source_type === 'tanker' && existing.tanker_id) {
      const literDiff = newLiters - existing.fuel_liters;
      if (literDiff !== 0) {
        setTankers(prev => prev.map(t => {
          if (t.id === existing.tanker_id) {
            const updatedStock = Math.max(0, t.current_stock_liters - literDiff);
            fetch(`/api/fleet/tankers/${t.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ current_stock_liters: updatedStock })
            }).catch(() => {});
            return { ...t, current_stock_liters: updatedStock };
          }
          return t;
        }));
      }
    }

    const updatedEntry: FuelEntry = {
      ...existing,
      ...updates,
      fuel_liters: newLiters,
      fuel_price_per_liter: newRate,
      total_amount: newTotal,
      distance_traveled: newDistance,
      calculated_mileage: calculatedMileage
    };

    setFuelEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
    fetch(`/api/fleet/fuel-entries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});
  };

  // Pump Payment Handlers
  const addPumpPayment = (paymentData: {
    pump_id: string;
    payment_date: string;
    amount: number;
    payment_method: 'bank_transfer' | 'cheque' | 'cash' | 'mfs';
    transaction_ref: string;
    notes?: string;
  }) => {
    const newPayment: PumpPayment = {
      id: 'pay_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id,
      pump_id: paymentData.pump_id,
      payment_date: paymentData.payment_date,
      amount: paymentData.amount,
      payment_method: paymentData.payment_method,
      transaction_ref: paymentData.transaction_ref,
      notes: paymentData.notes,
      recorded_by: currentUser.name,
      created_at: new Date().toISOString()
    };

    setPayments(prev => [newPayment, ...prev]);
    fetch('/api/fleet/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPayment)
    }).catch(() => {});

    // Decrease the pump's current balance (settled due or advance)
    setPumps(prev => prev.map(p => {
      if (p.id === paymentData.pump_id) {
        const newBal = (p.current_balance || 0) - paymentData.amount;
        fetch(`/api/fleet/pumps/${p.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_balance: newBal })
        }).catch(() => {});
        return { ...p, current_balance: newBal };
      }
      return p;
    }));
  };

  const deletePumpPayment = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    requestConfirmDelete({
      title: 'Confirm Payment Deletion',
      message: 'Are you sure you want to delete this payment record? The pump outstanding due will be restored.',
      entityName: payment ? `Payment BDT ${payment.amount?.toLocaleString()} (${payment.payment_method})` : paymentId,
      onConfirm: async () => {
        if (payment) {
          // Revert the payment by restoring due to the pump
          setPumps(prev => prev.map(p => {
            if (p.id === payment.pump_id) {
              const newBal = (p.current_balance || 0) + payment.amount;
              fetch(`/api/fleet/pumps/${p.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_balance: newBal })
              }).catch(() => {});
              return { ...p, current_balance: newBal };
            }
            return p;
          }));
        }
        try {
          await fetch(`/api/fleet/payments/${paymentId}`, { method: 'DELETE' });
        } catch {}
        setPayments(prev => prev.filter(p => p.id !== paymentId));
      }
    });
  };

  const updatePumpPayment = (id: string, updates: Partial<PumpPayment>) => {
    const existing = payments.find(p => p.id === id);
    if (!existing) return;

    if (updates.amount !== undefined && updates.amount !== existing.amount) {
      const diff = Number(updates.amount) - existing.amount;
      // increasing payment reduces pump outstanding balance
      setPumps(prev => prev.map(pump => {
        if (pump.id === existing.pump_id) {
          const newBal = (pump.current_balance || 0) - diff;
          fetch(`/api/fleet/pumps/${pump.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ current_balance: newBal })
          }).catch(() => {});
          return { ...pump, current_balance: newBal };
        }
        return pump;
      }));
    }

    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    fetch(`/api/fleet/payments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});
  };

  // Tanker / Bowzer Management
  const addTanker = (tanker: Omit<TankerInventory, 'id' | 'tenant_id' | 'user_id'>) => {
    const newTanker: TankerInventory = {
      ...tanker,
      id: 'tanker_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id
    };
    setTankers(prev => [newTanker, ...prev]);
    fetch('/api/fleet/tankers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTanker)
    }).catch(() => {});
  };

  const updateTanker = (id: string, tanker: Partial<TankerInventory>) => {
    setTankers(prev => prev.map(t => t.id === id ? { ...t, ...tanker } : t));
    fetch(`/api/fleet/tankers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tanker)
    }).catch(() => {});
  };

  const deleteTanker = (id: string) => {
    const tanker = tankers.find(t => t.id === id);
    requestConfirmDelete({
      title: 'Delete Fuel Bowzer / Tanker',
      message: 'Are you sure you want to delete this tanker bowzer?',
      entityName: tanker ? `${tanker.tanker_name}` : id,
      onConfirm: async () => {
        try {
          await fetch(`/api/fleet/tankers/${id}`, { method: 'DELETE' });
        } catch {}
        setTankers(prev => prev.filter(t => t.id !== id));
      }
    });
  };

  // Tanker Stock In
  const addTankerStockIn = (tankerId: string, liters: number, unitCost: number, source: string, notes?: string) => {
    const tanker = tankers.find(t => t.id === tankerId);
    if (!tanker) return;

    const prevStock = tanker.current_stock_liters;
    const newStock = prevStock + liters;
    const today = new Date().toISOString().split('T')[0];

    setTankers(prev => prev.map(t => t.id === tankerId ? { ...t, current_stock_liters: newStock, last_restocked_at: today } : t));
    fetch(`/api/fleet/tankers/${tankerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_stock_liters: newStock, last_restocked_at: today })
    }).catch(() => {});

    const newLog: TankerLog = {
      id: 'tlog_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id,
      tanker_id: tankerId,
      log_type: 'stock_in',
      date: today,
      liters,
      unit_cost: unitCost,
      source_or_vehicle: source,
      notes,
      previous_stock: prevStock,
      new_stock: newStock,
      created_at: new Date().toISOString()
    };

    setTankerLogs(prev => [newLog, ...prev]);
    fetch('/api/fleet/tanker-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(() => {});
  };

  // Tanker Dispense Out or Dip Adjustment
  const addTankerDispenseOrAdjustment = (tankerId: string, liters: number, logType: 'dispense_out' | 'dip_adjustment', recipientOrReason: string, notes?: string) => {
    const tanker = tankers.find(t => t.id === tankerId);
    if (!tanker) return;

    const prevStock = tanker.current_stock_liters;
    const newStock = logType === 'dispense_out'
      ? Math.max(0, prevStock - Math.abs(liters))
      : Math.max(0, prevStock + liters);

    const today = new Date().toISOString().split('T')[0];
    setTankers(prev => prev.map(t => t.id === tankerId ? { ...t, current_stock_liters: newStock } : t));
    fetch(`/api/fleet/tankers/${tankerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_stock_liters: newStock })
    }).catch(() => {});

    const newLog: TankerLog = {
      id: 'tlog_' + Date.now(),
      tenant_id: currentTenantId,
      user_id: currentUser.id,
      tanker_id: tankerId,
      log_type: logType,
      date: today,
      liters: Math.abs(liters),
      source_or_vehicle: recipientOrReason,
      notes,
      previous_stock: prevStock,
      new_stock: newStock,
      created_at: new Date().toISOString()
    };

    setTankerLogs(prev => [newLog, ...prev]);
    fetch('/api/fleet/tanker-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(() => {});
  };

  // SaaS Owner Profile & Credentials Management
  const updateSaasOwnerCredentials = (username: string, password: string, name?: string, email?: string, phone?: string) => {
    if (!username.trim() || !password.trim()) {
      return { success: false, message: 'Username and password are required.' };
    }
    setSaasOwner(prev => ({
      ...prev,
      username: username.trim(),
      password: password.trim(),
      name: name?.trim() || prev.name,
      email: email?.trim() || prev.email,
      phone: phone?.trim() || prev.phone,
      updated_at: new Date().toISOString().split('T')[0]
    }));
    return { success: true, message: 'SaaS owner login credentials updated successfully.' };
  };

  // Moderator Management
  const addModerator = (mod: Omit<SaasModerator, 'id' | 'role' | 'created_at'>) => {
    const newMod: SaasModerator = {
      ...mod,
      id: 'mod_' + Date.now(),
      role: 'saas_moderator',
      must_change_password: mod.must_change_password !== undefined ? mod.must_change_password : true,
      created_at: new Date().toISOString().split('T')[0]
    };
    setModerators(prev => [newMod, ...prev]);
  };

  const updateModerator = (id: string, updates: Partial<SaasModerator>) => {
    setModerators(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteModerator = (id: string) => {
    setModerators(prev => prev.filter(m => m.id !== id));
  };

  // Auth Operations
  const loginAsSaasOwner = (user: string, pass: string) => {
    if (user.trim().toLowerCase() === saasOwner.username.toLowerCase() && pass.trim() === saasOwner.password) {
      setActiveAuthRole('saas_owner');
      setActiveModeratorId(undefined);
      setIsSaasControlOpen(true);
      setIsAuthenticated(true);
      refreshTenantsFromServer();
      refreshUsersFromServer();
      try {
        sessionStorage.setItem(STORAGE_KEY_PREFIX + 'is_auth', 'true');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'is_auth', 'true');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_role', 'saas_owner');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'saas_control_open', 'true');
      } catch (e) {}
      return { success: true, message: 'Logged in as SaaS Platform Owner successfully.' };
    }
    return { success: false, message: 'Invalid Owner username or password!' };
  };

  const loginAsModerator = (user: string, pass: string) => {
    const mod = moderators.find(m => m.username.toLowerCase() === user.trim().toLowerCase() && m.password === pass.trim());
    if (mod) {
      if (mod.status === 'suspended') {
        return { success: false, message: 'This moderator account is suspended.' };
      }
      setActiveAuthRole('saas_moderator');
      setActiveModeratorId(mod.id);
      setIsSaasControlOpen(true);
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(STORAGE_KEY_PREFIX + 'is_auth', 'true');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'is_auth', 'true');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_role', 'saas_moderator');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'active_mod_id', mod.id);
        localStorage.setItem(STORAGE_KEY_PREFIX + 'saas_control_open', 'true');
      } catch (e) {}
      return { success: true, message: `Logged in as Moderator: ${mod.name}.` };
    }
    return { success: false, message: 'Invalid moderator username or password!' };
  };

  const loginAsCompanyUser = async (tenantCodeOrId: string, usernameOrEmail: string, pass: string) => {
    const cleanUser = usernameOrEmail.trim().toLowerCase();
    const cleanPass = pass.trim();

    let targetTenant = tenants.find(t => 
      t.id.toLowerCase() === (tenantCodeOrId || '').toLowerCase() || 
      t.code.toLowerCase() === (tenantCodeOrId || '').toLowerCase()
    );

    let matchedUser: User | undefined;

    if (targetTenant) {
      matchedUser = users.find(u => 
        u.tenant_id === targetTenant!.id && 
        (u.username?.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) &&
        (!u.password || verifyPassword(cleanPass, u.password))
      );
    }

    // Cross-tenant fallback search in case tenant was mismatched in dropdown
    if (!matchedUser) {
      const fallbackUser = users.find(u => 
        (u.username?.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) &&
        (!u.password || verifyPassword(cleanPass, u.password))
      );
      if (fallbackUser && fallbackUser.tenant_id) {
        const foundTenant = tenants.find(t => t.id === fallbackUser.tenant_id);
        if (foundTenant) {
          targetTenant = foundTenant;
          matchedUser = fallbackUser;
        }
      }
    }

    // Check tenant subscription super_admin credentials if user wasn't in users list
    if (!matchedUser) {
      // If targetTenant was found, check its subscription
      if (targetTenant?.subscription?.super_admin_username) {
        const sub = targetTenant.subscription;
        if (
          sub.super_admin_username.toLowerCase() === cleanUser &&
          (!sub.super_admin_password || verifyPassword(cleanPass, sub.super_admin_password))
        ) {
          matchedUser = {
            id: 'usr_sa_' + targetTenant.id,
            tenant_id: targetTenant.id,
            name: targetTenant.contact_person || `${targetTenant.name} Admin`,
            email: targetTenant.email || `${cleanUser}@example.com`,
            username: sub.super_admin_username,
            password: sub.super_admin_password,
            phone: targetTenant.phone || '',
            role: 'super_admin',
            role_title_bn: 'Company Super Admin',
            status: 'active',
            allowed_category_ids: ['all'],
            allowed_pump_ids: ['all'],
            permissions: {
              can_add_fuel: true,
              can_manage_vehicles: true,
              can_manage_pumps: true,
              can_view_reports: true,
              can_manage_users: true,
              can_edit_settings: true
            },
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
            created_at: targetTenant.created_at || '2026-08-01'
          };
        }
      }

      // If targetTenant was not found or didn't match, check all tenants by subscription super_admin_username
      if (!matchedUser) {
        for (const t of tenants) {
          if (
            t.subscription?.super_admin_username &&
            t.subscription.super_admin_username.toLowerCase() === cleanUser &&
            (!t.subscription.super_admin_password || verifyPassword(cleanPass, t.subscription.super_admin_password))
          ) {
            targetTenant = t;
            matchedUser = {
              id: 'usr_sa_' + t.id,
              tenant_id: t.id,
              name: t.contact_person || `${t.name} Admin`,
              email: t.email || `${cleanUser}@example.com`,
              username: t.subscription.super_admin_username,
              password: t.subscription.super_admin_password,
              phone: t.phone || '',
              role: 'super_admin',
              role_title_bn: 'Company Super Admin',
              status: 'active',
              allowed_category_ids: ['all'],
              allowed_pump_ids: ['all'],
              permissions: {
                can_add_fuel: true,
                can_manage_vehicles: true,
                can_manage_pumps: true,
                can_view_reports: true,
                can_manage_users: true,
                can_edit_settings: true
              },
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
              created_at: t.created_at || '2026-08-01'
            };
            break;
          }
        }
      }
    }

    // Direct server-side authentication fallback to ensure newly created backend users always log in smoothly
    if (!matchedUser || !targetTenant) {
      try {
        const serverAuthRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenant_id: targetTenant?.id || tenantCodeOrId,
            tenant_code: tenantCodeOrId,
            username: cleanUser,
            password: cleanPass
          })
        });
        const serverAuthJson = await serverAuthRes.json();
        if (serverAuthJson.success && serverAuthJson.user && serverAuthJson.tenant) {
          targetTenant = serverAuthJson.tenant;
          matchedUser = serverAuthJson.user;
          // Sync into local state
          setTenants(prev => {
            if (!prev.some(t => t.id === targetTenant!.id)) {
              return [targetTenant!, ...prev];
            }
            return prev.map(t => t.id === targetTenant!.id ? { ...t, ...targetTenant } : t);
          });
          setUsers(prev => {
            if (!prev.some(u => u.id === matchedUser!.id)) {
              return [matchedUser!, ...prev];
            }
            return prev.map(u => u.id === matchedUser!.id ? { ...u, ...matchedUser } : u);
          });
        }
      } catch (e) {}
    }

    if (!targetTenant) {
      return { success: false, message: 'Company / Tenant workspace not found!' };
    }

    // STRICT AUTH GUARD: Check tenant status
    if (
      targetTenant.deleted_at ||
      targetTenant.status === 'suspended' ||
      targetTenant.status === 'inactive' ||
      targetTenant.subscription?.status === 'suspended' ||
      targetTenant.subscription?.status === 'inactive'
    ) {
      return {
        success: false,
        message: "This account is suspended. Please contact the support team."
      };
    }

    if (matchedUser) {
      if (matchedUser.status === 'suspended') {
        return { success: false, message: 'This user account has been deactivated.' };
      }
      setCurrentTenantIdState(targetTenant.id);
      setCurrentUserIdState(matchedUser.id);
      setActiveAuthRole('company_user');
      setIsSaasControlOpen(false);
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem(STORAGE_KEY_PREFIX + 'is_auth', 'true');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'is_auth', 'true');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'auth_role', 'company_user');
        localStorage.setItem(STORAGE_KEY_PREFIX + 'tenant_id', targetTenant.id);
        localStorage.setItem(STORAGE_KEY_PREFIX + 'user_id', matchedUser.id);
        localStorage.setItem(STORAGE_KEY_PREFIX + 'saas_control_open', 'false');
      } catch (e) {}
      return { success: true, message: `Logged in successfully as ${matchedUser.name}!` };
    }
    return { success: false, message: 'Invalid username or password!' };
  };

  const impersonateTenant = (tenantId: string) => {
    const targetTenant = tenants.find(t => t.id === tenantId);
    if (!targetTenant) return;
    setCurrentTenantIdState(tenantId);
    const adminUser = users.find(u => u.tenant_id === tenantId && (u.role === 'super_admin' || u.role === 'company_owner')) || users.find(u => u.tenant_id === tenantId);
    if (adminUser) {
      setCurrentUserIdState(adminUser.id);
    }
    setIsSaasControlOpen(false);
  };

  const exitToSaasControl = () => {
    setIsSaasControlOpen(true);
  };

  // Subscriber / Tenant Creation & Management
  const addTenantSubscriber = async (data: {
    name: string;
    code: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    currency?: string;
    plan: SubscriptionPlan;
    duration_type: 'days' | 'months' | 'years';
    duration_val: number;
    price_bdt: number;
    payment_status: 'paid' | 'partial' | 'due';
    max_vehicles: number;
    max_users: number;
    max_pumps: number;
    super_admin_name: string;
    super_admin_username: string;
    super_admin_password: string;
    super_admin_email: string;
    super_admin_phone?: string;
    must_change_password?: boolean;
    features?: {
      tanker_bowzer: boolean;
      anomaly_ai: boolean;
      reports_export: boolean;
      qr_scanner: boolean;
      custom_categories: boolean;
    };
    notes?: string;
  }): Promise<{ success: boolean; tenantId: string; tenant: Tenant; superAdminUser: User }> => {
    const tenantId = 'tenant_' + Date.now();
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];

    const endDateObj = new Date(today);
    if (data.duration_type === 'days') {
      endDateObj.setDate(endDateObj.getDate() + data.duration_val);
    } else if (data.duration_type === 'months') {
      endDateObj.setMonth(endDateObj.getMonth() + data.duration_val);
    } else {
      endDateObj.setFullYear(endDateObj.getFullYear() + data.duration_val);
    }
    const endDate = endDateObj.toISOString().split('T')[0];

    const planNamesBn: Record<SubscriptionPlan, string> = {
      trial_3days: '3 Days Free Trial',
      plan_1month: '1 Month Plan',
      plan_3months: '3 Months Plan',
      plan_6months: '6 Months Plan',
      plan_12months: '12 Months Annual VIP Plan',
      starter: 'Starter Plan',
      professional: 'Professional Plan',
      enterprise: 'Enterprise Plan',
      custom: 'Custom Enterprise Plan'
    };

    const newSubscription: TenantSubscription = {
      plan: data.plan,
      plan_name_bn: planNamesBn[data.plan] || 'Custom Plan',
      status: 'active',
      is_approved: true,
      start_date: startDate,
      end_date: endDate,
      duration_type: data.duration_type,
      duration_val: data.duration_val,
      price_bdt: data.price_bdt,
      payment_status: 'paid',
      max_vehicles: data.max_vehicles,
      max_users: data.max_users,
      max_pumps: data.max_pumps,
      super_admin_username: data.super_admin_username,
      super_admin_password: data.super_admin_password,
      features: data.features || {
        tanker_bowzer: true,
        anomaly_ai: true,
        reports_export: true,
        qr_scanner: true,
        custom_categories: true
      },
      notes: data.notes
    };

    const newTenant: Tenant = {
      id: tenantId,
      name: data.name,
      code: data.code.toUpperCase(),
      currency: data.currency || 'BDT',
      phone: data.phone,
      address: data.address,
      contact_person: data.contact_person,
      email: data.email,
      status: 'active',
      is_approved: true,
      deleted_at: null,
      created_at: startDate,
      subscription: newSubscription
    };

    const rawPass = data.super_admin_password || 'admin123';
    const hashedPassword = isHashed(rawPass) ? rawPass : hashPassword(rawPass);

    const superAdminUser: User = {
      id: 'usr_' + Date.now(),
      tenant_id: tenantId,
      name: data.super_admin_name,
      email: data.super_admin_email,
      username: data.super_admin_username,
      password: hashedPassword,
      phone: data.super_admin_phone || data.phone,
      role: 'super_admin',
      role_title_bn: 'Company Super Admin',
      status: 'active',
      must_change_password: data.must_change_password !== undefined ? data.must_change_password : true,
      allowed_category_ids: ['all'],
      allowed_pump_ids: ['all'],
      permissions: {
        can_add_fuel: true,
        can_manage_vehicles: true,
        can_manage_pumps: true,
        can_view_reports: true,
        can_manage_users: true,
        can_edit_settings: true
      },
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      created_at: startDate
    };

    // Primary company entity for the new tenant
    const primaryCompany: Company = {
      id: 'comp_' + tenantId,
      tenant_id: tenantId,
      user_id: superAdminUser.id,
      name: data.name,
      code: data.code.toUpperCase(),
      contact_person: data.contact_person,
      phone: data.phone,
      email: data.email,
      address: data.address,
      created_at: startDate
    };

    // Standard baseline fuel types for the tenant
    const defaultFuelTypes: FuelType[] = [
      { id: `fuel_diesel_${tenantId}`, tenant_id: tenantId, user_id: superAdminUser.id, name: 'Diesel', code: 'diesel', unit: 'Liter', current_price: 108.50, price_history: [{ date: startDate, price: 108.50, changed_by: data.super_admin_name }], updated_at: startDate },
      { id: `fuel_octane_${tenantId}`, tenant_id: tenantId, user_id: superAdminUser.id, name: 'Octane', code: 'octane', unit: 'Liter', current_price: 131.00, price_history: [{ date: startDate, price: 131.00, changed_by: data.super_admin_name }], updated_at: startDate },
      { id: `fuel_petrol_${tenantId}`, tenant_id: tenantId, user_id: superAdminUser.id, name: 'Petrol', code: 'petrol', unit: 'Liter', current_price: 126.00, price_history: [{ date: startDate, price: 126.00, changed_by: data.super_admin_name }], updated_at: startDate },
      { id: `fuel_cng_${tenantId}`, tenant_id: tenantId, user_id: superAdminUser.id, name: 'CNG', code: 'cng', unit: 'm3', current_price: 43.00, price_history: [{ date: startDate, price: 43.00, changed_by: data.super_admin_name }], updated_at: startDate }
    ];

    // Standard baseline vehicle categories for the tenant
    const defaultCategories: VehicleCategory[] = [
      { id: `cat_dump_${tenantId}`, tenant_id: tenantId, user_id: superAdminUser.id, name: 'Heavy Dump Truck', metric_type: 'kmpl', default_benchmark: 2.8, icon_name: 'Truck', description: 'Mining & material hauling' },
      { id: `cat_excavator_${tenantId}`, tenant_id: tenantId, user_id: superAdminUser.id, name: 'Hydraulic Excavator', metric_type: 'lph', default_benchmark: 18.0, icon_name: 'Excavator', description: 'Earthmoving & construction' },
      { id: `cat_trailer_${tenantId}`, tenant_id: tenantId, user_id: superAdminUser.id, name: 'Prime Mover Trailer', metric_type: 'kmpl', default_benchmark: 2.2, icon_name: 'Truck', description: 'Long haul freight transport' },
      { id: `cat_pickup_${tenantId}`, tenant_id: tenantId, user_id: superAdminUser.id, name: 'Pickup Truck', metric_type: 'kmpl', default_benchmark: 11.5, icon_name: 'Car', description: 'Site logistics runabout' }
    ];

    setCompanies(prev => [primaryCompany, ...prev]);
    setFuelTypes(prev => [...defaultFuelTypes, ...prev]);
    setCategories(prev => [...defaultCategories, ...prev]);
    setTenants(prev => [newTenant, ...prev]);
    setUsers(prev => [superAdminUser, ...prev]);

    // Cross-Browser & Server-side tenant & user persistence (ISSUE 1 Fix)
    try {
      await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant: newTenant, super_admin_user: superAdminUser })
      }).catch(err => console.warn('Failed to sync tenant to server:', err));

      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(superAdminUser)
      }).catch(err => console.warn('Failed to sync user to server:', err));

      const channel = new BroadcastChannel('fuelflow_tenants_sync');
      channel.postMessage({ type: 'REFRESH_TENANTS' });
      channel.postMessage({ type: 'REFRESH_USERS' });
      channel.close();
    } catch (e) {}

    return { success: true, tenantId, tenant: newTenant, superAdminUser };
  };

  const updateTenantSubscription = (tenantId: string, subscriptionUpdates: Partial<TenantSubscription>) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId || !t.subscription) return t;
      const updatedSub = {
        ...t.subscription,
        ...subscriptionUpdates
      };
      fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: updatedSub })
      }).catch(() => {});
      return {
        ...t,
        subscription: updatedSub
      };
    }));
  };

  const extendTenantSubscription = (tenantId: string, additionalDays: number) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId || !t.subscription) return t;
      const currentEnd = new Date(t.subscription.end_date);
      const now = new Date();
      const baseDate = currentEnd > now ? currentEnd : now;
      baseDate.setDate(baseDate.getDate() + additionalDays);
      const newEndDate = baseDate.toISOString().split('T')[0];

      const updatedSub = {
        ...t.subscription,
        end_date: newEndDate,
        status: 'active' as SubscriptionStatus
      };
      fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: updatedSub, status: 'active' })
      }).catch(() => {});

      return {
        ...t,
        status: 'active',
        subscription: updatedSub
      };
    }));
  };

  const setTenantStatus = (tenantId: string, status: SubscriptionStatus) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      return {
        ...t,
        status,
        subscription: t.subscription ? {
          ...t.subscription,
          status
        } : undefined
      };
    }));

    // Cross-session & server status sync (ISSUE 2 Fix)
    try {
      fetch(`/api/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }).catch(err => console.warn('Failed to update tenant status on server:', err));

      const channel = new BroadcastChannel('fuelflow_tenants_sync');
      channel.postMessage({ type: 'REFRESH_TENANTS' });
      channel.close();
    } catch (e) {}
  };

  const updateTenantSuperAdminCredentials = (tenantId: string, username: string, password: string) => {
    const rawPass = password.trim();
    const hashedPassword = isHashed(rawPass) ? rawPass : hashPassword(rawPass);

    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId || !t.subscription) return t;
      return {
        ...t,
        subscription: {
          ...t.subscription,
          super_admin_username: username.trim(),
          super_admin_password: rawPass
        }
      };
    }));

    setUsers(prev => prev.map(u => {
      if (u.tenant_id === tenantId && u.role === 'super_admin') {
        return {
          ...u,
          username: username.trim(),
          password: hashedPassword
        };
      }
      return u;
    }));
  };

  const deleteTenantSubscriber = async (tenantId: string) => {
    // 1. Immediately remove from local state & localStorage so UI updates instantaneously
    setTenants(prev => {
      const updated = prev.filter(t => t.id !== tenantId);
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setUsers(prev => {
      const updated = prev.filter(u => u.tenant_id !== tenantId);
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    setVehicles(prev => prev.filter(v => v.tenant_id !== tenantId));
    setFuelEntries(prev => prev.filter(e => e.tenant_id !== tenantId));
    setPumps(prev => prev.filter(p => p.tenant_id !== tenantId));
    setPayments(prev => prev.filter(pm => pm.tenant_id !== tenantId));
    setCategories(prev => prev.filter(c => c.tenant_id !== tenantId));
    setCompanies(prev => prev.filter(c => c.tenant_id !== tenantId));
    setVendors(prev => prev.filter(v => v.tenant_id !== tenantId));
    setFuelTypes(prev => prev.filter(f => f.tenant_id !== tenantId));
    setTankers(prev => prev.filter(tk => tk.tenant_id !== tenantId));
    setTankerLogs(prev => prev.filter(tl => tl.tenant_id !== tenantId));

    try {
      await fetch(`/api/tenants/${tenantId}/cascade`, {
        method: 'DELETE'
      });
      const channel = new BroadcastChannel('fuelflow_tenants_sync');
      channel.postMessage({ type: 'REFRESH_TENANTS' });
      channel.close();
    } catch (e) {}

    if (currentTenantId === tenantId) {
      const remaining = tenants.filter(t => t.id !== tenantId);
      if (remaining.length > 0) {
        setCurrentTenantIdState(remaining[0].id);
      }
    }
  };

  const updateTenantLogo = (tenantId: string, logo: string) => {
    setTenants(prev => {
      const exists = prev.some(t => t && t.id === tenantId);
      let updated: Tenant[];
      if (!exists) {
        const stub: Tenant = currentTenantId === tenantId ? currentTenant : {
          id: tenantId,
          name: 'Company Workspace',
          code: 'COMP_' + tenantId.slice(-4),
          currency: 'BDT',
          phone: '',
          address: '',
          status: 'active'
        };
        updated = [{ ...stub, logo }, ...prev];
      } else {
        updated = prev.map(t => {
          if (t.id !== tenantId) return t;
          return { ...t, logo };
        });
      }
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + 'tenants', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    try {
      fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo })
      }).catch(() => {});
      const channel = new BroadcastChannel('fuelflow_tenants_sync');
      channel.postMessage({ type: 'REFRESH_TENANTS' });
      channel.close();
    } catch (e) {}
  };

  const updateTenant = (tenantId: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== tenantId) return t;
      return { ...t, ...updates };
    }));
    try {
      fetch(`/api/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).catch(() => {});
      const channel = new BroadcastChannel('fuelflow_tenants_sync');
      channel.postMessage({ type: 'REFRESH_TENANTS' });
      channel.close();
    } catch (e) {}
  };

  // Company Internal User & Category Permissions (Subscriber Super Admin Feature)
  const addCompanyUser = (userData: {
    tenant_id?: string;
    name: string;
    email: string;
    username: string;
    password?: string;
    phone?: string;
    role: UserRole;
    role_title_bn?: string;
    company_id?: string;
    allowed_category_ids?: string[];
    allowed_pump_ids?: string[];
    permissions?: UserPermissions;
    must_change_password?: boolean;
  }) => {
    const targetTenantId = userData.tenant_id || currentTenantId;

    // Constraint: 1 subscriber can only have 1 Company Super Admin account
    if (userData.role === 'super_admin') {
      const existingSuperAdmin = users.find(
        u => u.tenant_id === targetTenantId && u.role === 'super_admin'
      );
      if (existingSuperAdmin) {
        return {
          success: false,
          userId: '',
          message: 'Only 1 Company Super Admin account is allowed per subscriber.'
        };
      }
    }

    const newUserId = 'usr_' + Date.now();
    const rawPass = (userData.password && userData.password.trim()) || 'user123';
    const cleanUsername = userData.username.trim();
    const hashedPassword = isHashed(rawPass) ? rawPass : hashPassword(rawPass);
    const newUser: User = {
      id: newUserId,
      tenant_id: targetTenantId,
      name: userData.name.trim(),
      email: userData.email.trim(),
      username: cleanUsername,
      password: hashedPassword,
      phone: userData.phone?.trim() || '',
      role: userData.role,
      role_title_bn: userData.role_title_bn || (
        userData.role === 'super_admin'
          ? 'Super Admin'
          : userData.role === 'supervisor'
          ? 'Supervisor'
          : userData.role === 'operator'
          ? 'Fuel Operator'
          : userData.role === 'accountant'
          ? 'Accountant'
          : 'Viewer'
      ),
      company_id: userData.company_id,
      allowed_category_ids: userData.allowed_category_ids && userData.allowed_category_ids.length > 0 ? userData.allowed_category_ids : ['all'],
      allowed_pump_ids: userData.allowed_pump_ids && userData.allowed_pump_ids.length > 0 ? userData.allowed_pump_ids : ['all'],
      permissions: userData.permissions || {
        can_add_fuel: userData.role !== 'client_viewer',
        can_manage_vehicles: userData.role === 'super_admin' || userData.role === 'accountant',
        can_manage_pumps: userData.role === 'super_admin' || userData.role === 'operator' || userData.role === 'accountant',
        can_view_reports: true,
        can_manage_users: userData.role === 'super_admin',
        can_edit_settings: userData.role === 'super_admin'
      },
      status: 'active',
      must_change_password: userData.must_change_password !== undefined ? userData.must_change_password : true,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`,
      created_at: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => {
      const updated = [newUser, ...prev];
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    }).catch(() => {});
    return { success: true, userId: newUserId };
  };

  const updateCompanyUser = (id: string, updates: Partial<User>) => {
    const targetUser = users.find(u => u.id === id);
    if (!targetUser) return { success: false, message: 'User not found.' };

    // Prevent promoting a user to super_admin if one already exists for this tenant
    if (updates.role === 'super_admin' && targetUser.role !== 'super_admin') {
      const existingSuperAdmin = users.find(
        u => u.tenant_id === targetUser.tenant_id && u.role === 'super_admin' && u.id !== id
      );
      if (existingSuperAdmin) {
        return { success: false, message: 'Only 1 Company Super Admin account is allowed per subscriber.' };
      }
    }

    const processedUpdates = { ...updates };
    if (processedUpdates.password) {
      const raw = processedUpdates.password.trim();
      processedUpdates.password = isHashed(raw) ? raw : hashPassword(raw);
    }
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...processedUpdates } : u);
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(processedUpdates)
    }).catch(() => {});
    return { success: true };
  };

  const deleteCompanyUser = async (id: string) => {
    const target = users.find(u => u.id === id);
    if (target?.role === 'super_admin') {
      return { success: false, message: 'Primary Company Super Admin account cannot be deleted.' };
    }
    setUsers(prev => {
      const updated = prev.filter(u => u.id !== id);
      try { localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
    try {
      await fetch(`/api/users/${id}`, {
        method: 'DELETE'
      });
      const channel = new BroadcastChannel('fuelflow_tenants_sync');
      channel.postMessage({ type: 'REFRESH_USERS' });
      channel.close();
    } catch (e) {}
    return { success: true, message: 'User deleted successfully.' };
  };

  // Reset to seed data
  const resetToDefaultData = () => {
    setCompanies(INITIAL_COMPANIES);
    setVendors(INITIAL_VENDORS);
    setPumps(INITIAL_PUMPS);
    setFuelTypes(INITIAL_FUEL_TYPES);
    setCategories(INITIAL_CATEGORIES);
    setVehicles(INITIAL_VEHICLES);
    setFuelEntries(INITIAL_FUEL_ENTRIES);
    setPayments(INITIAL_PAYMENTS);
    setTankers(INITIAL_TANKERS);
    setTankerLogs(INITIAL_TANKER_LOGS);
    setTenants(INITIAL_TENANTS);
    setUsers(INITIAL_USERS);
    setSaasOwner(DEFAULT_SAAS_OWNER);
    setModerators(INITIAL_MODERATORS);
    localStorage.clear();
  };

  // -----------------------------------------------------------
  // SaaS Multi-Level Action Approvals (Update 9)
  // -----------------------------------------------------------
  const [approvals, setApprovals] = useState<PendingApprovalAction[]>([]);

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`/api/saas/approvals?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setApprovals(json.data);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch approvals:', e);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const requestApprovalAction = async (req: Omit<PendingApprovalAction, 'id' | 'status' | 'created_at'>) => {
    try {
      const res = await fetch('/api/saas/approvals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });
      const data = await res.json();
      if (data.success && data.action) {
        setApprovals(prev => [data.action, ...prev]);
        return { success: true, message: data.message, action: data.action };
      }
      return { success: false, message: data.message || 'Failed to submit request' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  const approveAction = async (actionId: string, reviewerName: string) => {
    try {
      const res = await fetch(`/api/saas/approvals/${actionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewed_by_name: reviewerName })
      });
      const data = await res.json();
      if (data.success) {
        setApprovals(prev => prev.map(a => a.id === actionId ? { ...a, status: 'APPROVED' as ApprovalStatus, reviewed_by: reviewerName, reviewed_at: new Date().toISOString() } : a));
        if (data.tenant) {
          setTenants(prev => prev.map(t => t.id === data.tenant.id ? { ...t, ...data.tenant } : t));
        }
        await refreshTenantsFromServer();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Approval failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  const rejectAction = async (actionId: string, reviewerName: string, note?: string) => {
    try {
      const res = await fetch(`/api/saas/approvals/${actionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewed_by_name: reviewerName, note })
      });
      const data = await res.json();
      if (data.success) {
        setApprovals(prev => prev.map(a => a.id === actionId ? { ...a, status: 'REJECTED' as ApprovalStatus, reviewed_by: reviewerName, reviewed_at: new Date().toISOString() } : a));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Rejection failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  // -----------------------------------------------------------
  // Subscription Upgrade & Payment Verification (Update 2)
  // -----------------------------------------------------------
  const [subscriptionPayments, setSubscriptionPayments] = useState<SubscriptionPaymentRecord[]>([]);

  const fetchSubscriptionPayments = async () => {
    try {
      const res = await fetch(`/api/subscription-payments?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSubscriptionPayments(json.data);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch subscription payments:', e);
    }
  };

  useEffect(() => {
    fetchSubscriptionPayments();
  }, []);

  const submitSubscriptionPayment = async (
    paymentData: Omit<SubscriptionPaymentRecord, 'id' | 'status' | 'created_at'>
  ) => {
    try {
      const res = await fetch('/api/subscription-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });
      const data = await res.json();
      if (data.success && data.payment) {
        setSubscriptionPayments(prev => [data.payment, ...prev]);
        return { success: true, message: data.message, payment: data.payment };
      }
      return { success: false, message: data.message || 'Payment submission failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  const approveSubscriptionPayment = async (id: string, reviewerName: string = 'Master Administrator') => {
    try {
      const res = await fetch(`/api/subscription-payments/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewed_by: reviewerName })
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptionPayments(prev =>
          prev.map(p => p.id === id ? { ...p, status: 'approved', reviewed_by: reviewerName, reviewed_at: new Date().toISOString() } : p)
        );
        if (data.tenant) {
          setTenants(prev => prev.map(t => t.id === data.tenant.id ? { ...t, ...data.tenant } : t));
        }
        await refreshTenantsFromServer();
        return { success: true, message: data.message, new_end_date: data.new_end_date };
      }
      return { success: false, message: data.message || 'Approval failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  const rejectSubscriptionPayment = async (id: string, reason: string = 'TrxID could not be verified', reviewerName: string = 'Master Administrator') => {
    try {
      const res = await fetch(`/api/subscription-payments/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewed_by: reviewerName, reason })
      });
      const data = await res.json();
      if (data.success) {
        setSubscriptionPayments(prev =>
          prev.map(p => p.id === id ? { ...p, status: 'rejected', reviewed_by: reviewerName, reviewed_at: new Date().toISOString(), rejection_reason: reason } : p)
        );
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Rejection failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  const getFuelPriceForDate = (fuelType: FuelType | undefined, dateStr?: string): number => {
    return getEffectiveFuelPriceForDate(fuelType, dateStr);
  };

  // -----------------------------------------------------------
  // Permanent Cascade Delete (Update 7)
  // -----------------------------------------------------------
  const cascadeDeleteTenant = async (tenantId: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}/cascade`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setTenants(prev => prev.filter(t => t.id !== tenantId));
        setUsers(prev => prev.filter(u => u.tenant_id !== tenantId));
        setVehicles(prev => prev.filter(v => v.tenant_id !== tenantId));
        setFuelEntries(prev => prev.filter(e => e.tenant_id !== tenantId));
        setPumps(prev => prev.filter(p => p.tenant_id !== tenantId));
        setPayments(prev => prev.filter(pm => pm.tenant_id !== tenantId));
        setCategories(prev => prev.filter(c => c.tenant_id !== tenantId));
        setCompanies(prev => prev.filter(c => c.tenant_id !== tenantId));
        setVendors(prev => prev.filter(v => v.tenant_id !== tenantId));
        setFuelTypes(prev => prev.filter(f => f.tenant_id !== tenantId));
        setTankers(prev => prev.filter(tk => tk.tenant_id !== tenantId));
        setTankerLogs(prev => prev.filter(tl => tl.tenant_id !== tenantId));

        if (currentTenantId === tenantId) {
          const remaining = tenants.filter(t => t.id !== tenantId && !t.deleted_at && t.status === 'active');
          if (remaining.length > 0) {
            setCurrentTenantIdState(remaining[0].id);
          }
        }
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Cascade delete failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  // -----------------------------------------------------------
  // Mandatory First-Time Password Change (Update 10)
  // -----------------------------------------------------------
  const changeUserPassword = async (userId: string, newPassword: string) => {
    // If updating a moderator / SaaS control panel user
    const isMod = moderators.some(m => m.id === userId);
    if (isMod) {
      setModerators(prev => {
        const updated = prev.map(m => m.id === userId ? { ...m, password: newPassword, must_change_password: false } : m);
        try { localStorage.setItem(STORAGE_KEY_PREFIX + 'moderators', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      return { success: true, message: 'Password updated successfully!' };
    }

    try {
      const res = await fetch('/api/auth/force-change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, new_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => {
          const updated = prev.map(u => u.id === userId ? { ...u, password: newPassword, must_change_password: false } : u);
          try { localStorage.setItem(STORAGE_KEY_PREFIX + 'users', JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Failed to update password' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  // -----------------------------------------------------------
  // Bulk Data Import (Update 11 - Resilient with Client-Side Fallback)
  // -----------------------------------------------------------
  const bulkImportData = async (entityType: string, rows: any[]): Promise<{ success: boolean; count: number; message: string; new_count?: number; updated_count?: number }> => {
    if (!currentTenantId) {
      return { success: false, count: 0, message: 'No subscriber workspace active.' };
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, count: 0, message: 'No data rows found in uploaded file.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let serverSuccess = false;
    let serverItems: any[] = [];
    let serverMessage = '';
    let data: any = null;

    try {
      const res = await fetch('/api/fleet/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenantId,
          entity_type: entityType,
          rows
        })
      });

      const text = await res.text();
      if (text && (text.trim().startsWith('{') || text.trim().startsWith('['))) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (data && data.success && Array.isArray(data.items)) {
        serverSuccess = true;
        serverItems = data.items;
        serverMessage = data.message || `Successfully registered ${data.items.length} records.`;
      }
    } catch (networkErr: any) {
      console.warn('[Bulk Import] Server API request failed, engaging local client fallback:', networkErr?.message || networkErr);
    }

    // Process items (using server items if available, or locally parsed items as fallback)
    let processedCount = 0;
    let newCount = 0;
    let updatedCount = 0;
    const serverNewCount = data?.new_count;
    const serverUpdatedCount = data?.updated_count;

    if (entityType === 'vehicles') {
      // 1. AUTO-SETUP MASTER DATA: Extract and deduplicate all unique categories, companies, vendors, pumps, fuel types
      const categoryNameToIdMap = new Map<string, string>();
      categories.forEach(c => categoryNameToIdMap.set((c.name || '').toLowerCase().trim(), c.id));
      const newCategoriesToAdd: VehicleCategory[] = [];

      const companyNameToIdMap = new Map<string, string>();
      companies.forEach(c => companyNameToIdMap.set((c.name || '').toLowerCase().trim(), c.id));
      const newCompaniesToAdd: Company[] = [];

      const vendorNameToIdMap = new Map<string, string>();
      vendors.forEach(v => vendorNameToIdMap.set((v.name || '').toLowerCase().trim(), v.id));
      const newVendorsToAdd: Vendor[] = [];

      const pumpNameToIdMap = new Map<string, string>();
      pumps.forEach(p => pumpNameToIdMap.set((p.name || '').toLowerCase().trim(), p.id));
      const newPumpsToAdd: FuelPump[] = [];

      const fuelNameToIdMap = new Map<string, string>();
      fuelTypes.forEach(f => fuelNameToIdMap.set((f.name || '').toLowerCase().trim(), f.name));
      const newFuelsToAdd: FuelType[] = [];

      // Pass 1: Discover and create missing Master Entities
      for (const r of rows) {
        // Categories Auto-Setup (e.g. 15 'Big Bus' -> 1 unique 'Big Bus' category)
        const rawCat = r.category || r.vehicle_category || r.category_name;
        if (rawCat && String(rawCat).trim() && String(rawCat).trim() !== 'N/A') {
          const catName = String(rawCat).trim();
          const lower = catName.toLowerCase();
          if (!categoryNameToIdMap.has(lower)) {
            const isLph = /excavator|generator|crane|earthmover|dozer|loader|bowzer/i.test(catName);
            const bench = Number(r.benchmark_mileage || r.benchmark || r.expected_benchmark) || (isLph ? 18.0 : 8.0);
            const newCat: VehicleCategory = {
              id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              tenant_id: currentTenantId,
              user_id: currentUser.id || 'user_1',
              name: catName,
              metric_type: isLph ? 'lph' : 'kmpl',
              default_benchmark: bench,
              tolerance_percentage: 15,
              icon_name: isLph ? 'Excavator' : 'Truck',
              description: 'Auto-configured from fleet sheet upload'
            };
            categoryNameToIdMap.set(lower, newCat.id);
            newCategoriesToAdd.push(newCat);
          }
        }

        // Assigned Company Auto-Setup
        const rawComp = r.assigned_company || r.company || r.company_name;
        if (rawComp && String(rawComp).trim() && String(rawComp).trim() !== 'N/A') {
          const compName = String(rawComp).trim();
          const lower = compName.toLowerCase();
          if (!companyNameToIdMap.has(lower)) {
            const cleanCode = compName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || 'COMP';
            const newComp: Company = {
              id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              tenant_id: currentTenantId,
              user_id: currentUser.id || 'user_1',
              name: compName,
              code: cleanCode,
              contact_person: 'N/A',
              phone: 'N/A',
              email: '',
              address: 'N/A',
              created_at: todayStr
            };
            companyNameToIdMap.set(lower, newComp.id);
            newCompaniesToAdd.push(newComp);
          }
        }

        // Vendor Auto-Setup
        const rawVen = r.vehicle_vendor || r.vendor_name || r.vendor || r.supplier;
        if (rawVen && String(rawVen).trim() && String(rawVen).trim() !== 'N/A' && String(rawVen).trim().toLowerCase() !== 'own' && String(rawVen).trim().toLowerCase() !== 'none') {
          const venName = String(rawVen).trim();
          const lower = venName.toLowerCase();
          if (!vendorNameToIdMap.has(lower)) {
            const newVen: Vendor = {
              id: `ven_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              tenant_id: currentTenantId,
              user_id: currentUser.id || 'user_1',
              name: venName,
              contact_person: 'Vendor Manager',
              email: 'N/A',
              phone: r.vendor_contact || r.vendor_phone || 'N/A',
              type: 'fuel',
              address: 'N/A',
              created_at: todayStr
            };
            vendorNameToIdMap.set(lower, newVen.id);
            newVendorsToAdd.push(newVen);
          }
        }

        // Fuel Pump Auto-Setup
        const rawPump = r.fuel_pumps || r.fuel_pump || r.fuel_pump_station || r.pump;
        if (rawPump && String(rawPump).trim() && String(rawPump).trim() !== 'N/A' && String(rawPump).trim().toLowerCase() !== 'none') {
          const pumpName = String(rawPump).trim();
          const lower = pumpName.toLowerCase();
          if (!pumpNameToIdMap.has(lower)) {
            const newPump: FuelPump = {
              id: `pump_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              tenant_id: currentTenantId,
              user_id: currentUser.id || 'user_1',
              name: pumpName,
              location: r.pump_location || 'N/A',
              contact_person: 'Station Manager',
              phone: 'N/A',
              credit_limit: 500000,
              opening_balance: 0,
              current_balance: 0,
              status: 'active',
              fuel_types: ['Diesel', 'Octane'],
              payment_terms: 'Credit',
              created_at: todayStr
            };
            pumpNameToIdMap.set(lower, newPump.id);
            newPumpsToAdd.push(newPump);
          }
        }

        // Fuel Type Auto-Setup
        const rawFuel = r.fuel_type || r.fuel;
        if (rawFuel && String(rawFuel).trim() && String(rawFuel).trim() !== 'N/A') {
          const fuelName = String(rawFuel).trim();
          const lower = fuelName.toLowerCase();
          if (!fuelNameToIdMap.has(lower)) {
            const unit = lower === 'cng' ? 'm3' : 'Liter';
            const price = Number(r.fuel_price || r.price) || (lower === 'cng' ? 43.00 : lower === 'octane' ? 131.00 : lower === 'petrol' ? 126.00 : 108.50);
            const newFuel: FuelType = {
              id: `fuel_${lower}_${currentTenantId}`,
              tenant_id: currentTenantId,
              user_id: currentUser.id || 'user_1',
              name: fuelName,
              code: lower,
              unit,
              current_price: price,
              price_history: [{ date: todayStr, price, changed_by: 'Fleet Bulk Import' }],
              updated_at: todayStr
            };
            fuelNameToIdMap.set(lower, newFuel.name);
            newFuelsToAdd.push(newFuel);
          }
        }
      }

      // Commit newly discovered master data to local state
      if (newCategoriesToAdd.length > 0) {
        setCategories(prev => [...newCategoriesToAdd, ...prev]);
        fetch('/api/fleet/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: currentTenantId, entity_type: 'categories', rows: newCategoriesToAdd })
        }).catch(() => {});
      }
      if (newCompaniesToAdd.length > 0) {
        setCompanies(prev => [...newCompaniesToAdd, ...prev]);
        fetch('/api/fleet/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: currentTenantId, entity_type: 'companies', rows: newCompaniesToAdd })
        }).catch(() => {});
      }
      if (newVendorsToAdd.length > 0) {
        setVendors(prev => [...newVendorsToAdd, ...prev]);
        fetch('/api/fleet/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: currentTenantId, entity_type: 'vendors', rows: newVendorsToAdd })
        }).catch(() => {});
      }
      if (newPumpsToAdd.length > 0) {
        setPumps(prev => [...newPumpsToAdd, ...prev]);
        fetch('/api/fleet/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: currentTenantId, entity_type: 'pumps', rows: newPumpsToAdd })
        }).catch(() => {});
      }
      if (newFuelsToAdd.length > 0) {
        setFuelTypes(prev => [...newFuelsToAdd, ...prev]);
        fetch('/api/fleet/bulk-import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant_id: currentTenantId, entity_type: 'fuel_types', rows: newFuelsToAdd })
        }).catch(() => {});
      }

      // 2. Map Vehicles with exact Master Data Foreign Keys and Safe Defaults
      const itemsToApply = serverSuccess && serverItems.length > 0 ? serverItems : rows.map(r => {
        const rawNum = r.vehicle_reg_no || r.vehicle_number || r.plate_number || r.vehicle_no || r.plate_no || r.registration_number || r.registration_no || r.car_number || r.name;
        const plate = String(rawNum || '').trim();
        if (!plate) return null;

        const catKey = (r.category || r.vehicle_category || '').toLowerCase().trim();
        const matchedCatId = categoryNameToIdMap.get(catKey) || (categories[0]?.id || 'cat_1');

        const compKey = (r.assigned_company || r.company || '').toLowerCase().trim();
        const matchedCompId = companyNameToIdMap.get(compKey) || (companies[0]?.id || 'comp_1');

        const venKey = (r.vendor_name || r.vendor || '').toLowerCase().trim();
        const matchedVenId = vendorNameToIdMap.get(venKey) || undefined;

        const fuelKey = (r.fuel_type || r.fuel || '').toLowerCase().trim();
        const matchedFuel = fuelNameToIdMap.get(fuelKey) || (r.fuel_type && String(r.fuel_type).trim() !== 'N/A' ? String(r.fuel_type).trim() : null) || (fuelTypes[0]?.name || 'Diesel');

        const isRental = matchedVenId !== undefined || (r.ownership && String(r.ownership).toLowerCase() === 'rental');

        let driverName = r.driver_name;
        let driverPhone = r.driver_contact || r.driver_phone;
        const combinedDriver = r['driver_&_contact'] || r.driver_and_contact || r['diver_&_contact'] || r.diver_and_contact;
        if (combinedDriver && typeof combinedDriver === 'string' && combinedDriver.trim() && combinedDriver.trim() !== 'N/A') {
          const phoneMatch = combinedDriver.match(/(?:\+?88)?01[3-9]\d{8}/);
          if (phoneMatch) {
            if (!driverPhone || driverPhone === 'N/A') driverPhone = phoneMatch[0];
            if (!driverName || driverName === 'N/A') driverName = combinedDriver.replace(phoneMatch[0], '').replace(/[()\-:,]/g, '').trim();
          } else if (!driverName || driverName === 'N/A') {
            driverName = combinedDriver.trim();
          }
        }

        return {
          id: r.id || 'veh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          tenant_id: currentTenantId,
          user_id: currentUser.id || 'user_1',
          vehicle_number: plate,
          plate_number: plate,
          model: r.model || 'N/A',
          category_id: matchedCatId,
          company_id: matchedCompId,
          vendor_id: matchedVenId,
          ownership: isRental ? 'rented' : 'owned' as 'owned' | 'rented',
          fuel_type_id: matchedFuel,
          fuel_type: matchedFuel,
          expected_benchmark: Number(r.benchmark_mileage || r.expected_benchmark || r.benchmark) || 8.0,
          current_odometer: Number(r.current_meter || r.current_odometer || r.initial_odometer) || 0,
          driver_name: (driverName && String(driverName).trim()) ? String(driverName).trim() : 'N/A',
          driver_phone: (driverPhone && String(driverPhone).trim()) ? String(driverPhone).trim() : 'N/A',
          fuel_tank_capacity: Number(r.fuel_tank_capacity || r.capacity) || 100,
          status: (r.status === 'maintenance' || r.status === 'idle') ? r.status : 'active',
          notes: r.notes || 'Bulk imported via Fleet Master Excel/CSV',
          created_at: r.created_at || todayStr
        };
      }).filter(Boolean);

      setVehicles(prev => {
        const map = new Map<string, Vehicle>();
        (prev || []).forEach(v => {
          if (v && v.id) map.set(v.id, v);
        });
        for (const item of itemsToApply) {
          if (!item) continue;
          const targetNum = ((item.vehicle_number || item.plate_number || '') + '').toLowerCase().trim();
          let matchedId: string | null = null;
          for (const [id, v] of map.entries()) {
            if (id === item.id) {
              matchedId = id;
              break;
            }
            if (targetNum && (v.tenant_id === item.tenant_id || !v.tenant_id || !item.tenant_id)) {
              const curNum = ((v.vehicle_number || (v as any).plate_number || '') + '').toLowerCase().trim();
              if (curNum && curNum === targetNum) {
                matchedId = id;
                break;
              }
            }
          }
          if (matchedId) {
            map.set(matchedId, { ...map.get(matchedId)!, ...item, id: matchedId });
            updatedCount++;
          } else {
            map.set(item.id, item);
            newCount++;
          }
          processedCount++;
        }
        return Array.from(map.values());
      });
    } else if (entityType === 'companies') {
      const itemsToApply = serverSuccess && serverItems.length > 0 ? serverItems : rows.map(r => {
        const rawName = r.name || r.company_name || r.title;
        const name = String(rawName || '').trim();
        if (!name) return null;
        return {
          id: r.id || 'comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          tenant_id: currentTenantId,
          user_id: currentUser.id || 'user_1',
          name,
          code: r.code || name.substring(0, 4).toUpperCase(),
          contact_person: r.contact_person || r.contact || '',
          phone: r.phone || r.mobile || '',
          email: r.email || '',
          address: r.address || '',
          status: r.status || 'active',
          created_at: r.created_at || todayStr
        };
      }).filter(Boolean);

      setCompanies(prev => {
        const map = new Map<string, Company>();
        (prev || []).forEach(c => {
          if (c && c.id) map.set(c.id, c);
        });
        for (const item of itemsToApply) {
          if (!item) continue;
          const targetName = (item.name || '').toLowerCase().trim();
          let matchedId: string | null = null;
          for (const [id, c] of map.entries()) {
            if (id === item.id) {
              matchedId = id;
              break;
            }
            if (targetName && (c.tenant_id === item.tenant_id || !c.tenant_id || !item.tenant_id)) {
              if ((c.name || '').toLowerCase().trim() === targetName) {
                matchedId = id;
                break;
              }
            }
          }
          if (matchedId) {
            map.set(matchedId, { ...map.get(matchedId)!, ...item, id: matchedId });
            updatedCount++;
          } else {
            map.set(item.id, item);
            newCount++;
          }
          processedCount++;
        }
        return Array.from(map.values());
      });
    } else if (entityType === 'vendors') {
      const itemsToApply = serverSuccess && serverItems.length > 0 ? serverItems : rows.map(r => {
        const rawName = r.name || r.vendor_name || r.supplier;
        const name = String(rawName || '').trim();
        if (!name) return null;
        return {
          id: r.id || 'ven_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          tenant_id: currentTenantId,
          user_id: currentUser.id || 'user_1',
          name,
          phone: r.phone || r.mobile || '',
          contact_person: r.contact_person || r.contact || '',
          email: r.email || '',
          type: r.type || 'fuel',
          address: r.address || '',
          status: r.status || 'active',
          created_at: r.created_at || todayStr
        };
      }).filter(Boolean);

      setVendors(prev => {
        const map = new Map<string, Vendor>();
        (prev || []).forEach(v => {
          if (v && v.id) map.set(v.id, v);
        });
        for (const item of itemsToApply) {
          if (!item) continue;
          const targetName = (item.name || '').toLowerCase().trim();
          let matchedId: string | null = null;
          for (const [id, v] of map.entries()) {
            if (id === item.id) {
              matchedId = id;
              break;
            }
            if (targetName && (v.tenant_id === item.tenant_id || !v.tenant_id || !item.tenant_id)) {
              if ((v.name || '').toLowerCase().trim() === targetName) {
                matchedId = id;
                break;
              }
            }
          }
          if (matchedId) {
            map.set(matchedId, { ...map.get(matchedId)!, ...item, id: matchedId });
            updatedCount++;
          } else {
            map.set(item.id, item);
            newCount++;
          }
          processedCount++;
        }
        return Array.from(map.values());
      });
    } else if (entityType === 'pumps') {
      const itemsToApply = serverSuccess && serverItems.length > 0 ? serverItems : rows.map(r => {
        const rawName = r.name || r.pump_name || r.station_name;
        const name = String(rawName || '').trim();
        if (!name) return null;
        return {
          id: r.id || 'pump_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          tenant_id: currentTenantId,
          user_id: currentUser.id || 'user_1',
          name,
          location: r.location || r.address || '',
          contact_person: r.contact_person || r.contact || '',
          phone: r.phone || r.contact_number || r.mobile || '',
          credit_limit: Number(r.credit_limit) || 500000,
          opening_balance: Number(r.opening_balance) || 0,
          current_balance: Number(r.current_balance) || 0,
          fuel_types: Array.isArray(r.fuel_types) ? r.fuel_types : ['Diesel', 'Octane'],
          payment_terms: r.payment_terms || 'Credit',
          status: r.status || 'active',
          created_at: r.created_at || todayStr
        };
      }).filter(Boolean);

      setPumps(prev => {
        const map = new Map<string, FuelPump>();
        (prev || []).forEach(p => {
          if (p && p.id) map.set(p.id, p);
        });
        for (const item of itemsToApply) {
          if (!item) continue;
          const targetName = (item.name || '').toLowerCase().trim();
          let matchedId: string | null = null;
          for (const [id, p] of map.entries()) {
            if (id === item.id) {
              matchedId = id;
              break;
            }
            if (targetName && (p.tenant_id === item.tenant_id || !p.tenant_id || !item.tenant_id)) {
              if ((p.name || '').toLowerCase().trim() === targetName) {
                matchedId = id;
                break;
              }
            }
          }
          if (matchedId) {
            map.set(matchedId, { ...map.get(matchedId)!, ...item, id: matchedId });
            updatedCount++;
          } else {
            map.set(item.id, item);
            newCount++;
          }
          processedCount++;
        }
        return Array.from(map.values());
      });
    } else if (entityType === 'fuel_types') {
      const itemsToApply = serverSuccess && serverItems.length > 0 ? serverItems : rows.map(r => {
        const rawName = r.name || r.fuel_name || r.type;
        const name = String(rawName || '').trim();
        if (!name) return null;
        const price = Number(r.current_price || r.price) || 105;
        return {
          id: r.id || 'ft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          tenant_id: currentTenantId,
          user_id: currentUser.id || 'user_1',
          name,
          code: (r.code || name.replace(/\s+/g, '_')).toLowerCase(),
          unit: r.unit || 'Liter',
          current_price: price,
          price_history: [{ date: todayStr, price, changed_by: 'Bulk Import' }],
          status: r.status || 'active',
          updated_at: todayStr
        };
      }).filter(Boolean);

      setFuelTypes(prev => {
        const map = new Map<string, FuelType>();
        (prev || []).forEach(f => {
          if (f && f.id) map.set(f.id, f);
        });
        for (const item of itemsToApply) {
          if (!item) continue;
          const targetName = (item.name || '').toLowerCase().trim();
          let matchedId: string | null = null;
          for (const [id, f] of map.entries()) {
            if (id === item.id) {
              matchedId = id;
              break;
            }
            if (targetName && (f.tenant_id === item.tenant_id || !f.tenant_id || !item.tenant_id)) {
              if ((f.name || '').toLowerCase().trim() === targetName) {
                matchedId = id;
                break;
              }
            }
          }
          if (matchedId) {
            map.set(matchedId, { ...map.get(matchedId)!, ...item, id: matchedId });
            updatedCount++;
          } else {
            map.set(item.id, item);
            newCount++;
          }
          processedCount++;
        }
        return Array.from(map.values());
      });
    } else if (entityType === 'categories') {
      const itemsToApply = serverSuccess && serverItems.length > 0 ? serverItems : rows.map(r => {
        const rawName = r.name || r.category_name;
        const name = String(rawName || '').trim();
        if (!name) return null;
        return {
          id: r.id || 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          tenant_id: currentTenantId,
          user_id: currentUser.id || 'user_1',
          name,
          metric_type: ((r.metric_type || 'kmpl').toLowerCase() === 'lph' ? 'lph' : 'kmpl') as 'kmpl' | 'lph',
          default_benchmark: Number(r.default_benchmark || r.benchmark) || 8.0,
          tolerance_percentage: Number(r.tolerance_percentage) || 15,
          icon_name: r.icon_name || 'Truck',
          description: r.description || r.name_bn || ''
        };
      }).filter(Boolean);

      setCategories(prev => {
        const map = new Map<string, VehicleCategory>();
        (prev || []).forEach(c => {
          if (c && c.id) map.set(c.id, c);
        });
        for (const item of itemsToApply) {
          if (!item) continue;
          const targetName = (item.name || '').toLowerCase().trim();
          let matchedId: string | null = null;
          for (const [id, c] of map.entries()) {
            if (id === item.id) {
              matchedId = id;
              break;
            }
            if (targetName && (c.tenant_id === item.tenant_id || !c.tenant_id || !item.tenant_id)) {
              if ((c.name || '').toLowerCase().trim() === targetName) {
                matchedId = id;
                break;
              }
            }
          }
          if (matchedId) {
            map.set(matchedId, { ...map.get(matchedId)!, ...item, id: matchedId });
            updatedCount++;
          } else {
            map.set(item.id, item);
            newCount++;
          }
          processedCount++;
        }
        return Array.from(map.values());
      });
    } else if (entityType === 'tankers') {
      const itemsToApply = serverSuccess && serverItems.length > 0 ? serverItems : rows.map(r => {
        const rawNum = r.tanker_name || r.tanker_number || r.name || r.tanker_no;
        const num = String(rawNum || '').trim();
        if (!num) return null;
        return {
          id: r.id || 'tank_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          tenant_id: currentTenantId,
          user_id: currentUser.id || 'user_1',
          tanker_name: num,
          tanker_number: num,
          location: r.location || 'Central Depot',
          capacity_liters: Number(r.capacity_liters || r.capacity) || 5000,
          current_stock_liters: Number(r.current_stock_liters || r.current_fuel_liters || r.stock) || 0,
          fuel_type_id: r.fuel_type_id || r.fuel_type || 'Diesel',
          min_alert_threshold: Number(r.min_alert_threshold) || 500,
          last_restocked_at: r.last_restocked_at || todayStr,
          assigned_driver: r.assigned_driver || r.driver_name || '',
          driver_phone: r.driver_phone || '',
          status: r.status || 'active'
        };
      }).filter(Boolean);

      setTankers(prev => {
        const map = new Map<string, TankerInventory>();
        (prev || []).forEach(tk => {
          if (tk && tk.id) map.set(tk.id, tk);
        });
        for (const item of itemsToApply) {
          if (!item) continue;
          const targetName = ((item.tanker_name || item.tanker_number || '') + '').toLowerCase().trim();
          let matchedId: string | null = null;
          for (const [id, tk] of map.entries()) {
            if (id === item.id) {
              matchedId = id;
              break;
            }
            if (targetName && (tk.tenant_id === item.tenant_id || !tk.tenant_id || !item.tenant_id)) {
              const curName = ((tk.tanker_name || (tk as any).tanker_number || '') + '').toLowerCase().trim();
              if (curName === targetName) {
                matchedId = id;
                break;
              }
            }
          }
          if (matchedId) {
            map.set(matchedId, { ...map.get(matchedId)!, ...item, id: matchedId });
            updatedCount++;
          } else {
            map.set(item.id, item);
            newCount++;
          }
          processedCount++;
        }
        return Array.from(map.values());
      });
    }

    const finalNew = serverSuccess && typeof serverNewCount === 'number' ? serverNewCount : newCount;
    const finalUpdated = serverSuccess && typeof serverUpdatedCount === 'number' ? serverUpdatedCount : updatedCount;

    if (processedCount > 0) {
      return {
        success: true,
        count: processedCount,
        new_count: finalNew,
        updated_count: finalUpdated,
        message: serverMessage || `Successfully registered ${processedCount} records (${finalNew} new, ${finalUpdated} merged with double-entry protection).`
      };
    }

    return {
      success: false,
      count: 0,
      message: 'No valid records could be processed. Please verify column headers and row data in your spreadsheet.'
    };
  };

  // -----------------------------------------------------------
  // Dynamic Fuel Types & Pricing (Update 8)
  // -----------------------------------------------------------
  const addFuelType = async (fuelData: { name: string; code?: string; unit?: string; current_price: number }) => {
    const today = new Date().toISOString().split('T')[0];
    const generatedId = `fuel_${(fuelData.code || fuelData.name).toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const localFuelType: FuelType = {
      id: generatedId,
      tenant_id: currentTenantId,
      user_id: currentUser.id,
      name: fuelData.name.trim(),
      code: (fuelData.code || fuelData.name).toLowerCase().replace(/[^a-z0-9]/g, '_'),
      unit: fuelData.unit || 'Liter',
      current_price: Number(fuelData.current_price),
      price_history: [{ date: today, price: Number(fuelData.current_price), changed_by: currentUser.name || 'Admin' }],
      updated_at: today
    };

    try {
      const res = await fetch('/api/master/fuel-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: currentTenantId,
          user_id: currentUser.id,
          name: fuelData.name,
          code: fuelData.code,
          unit: fuelData.unit || 'Liter',
          current_price: fuelData.current_price
        })
      });
      const data = await res.json();
      if (data.success && data.fuelType) {
        setFuelTypes(prev => [data.fuelType, ...prev.filter(f => f.id !== data.fuelType.id)]);
        return { success: true, message: data.message || 'Fuel type added successfully', fuelType: data.fuelType };
      }
      // If server returned success or fallback message without error
      setFuelTypes(prev => [localFuelType, ...prev.filter(f => f.id !== localFuelType.id)]);
      return { success: true, message: 'Fuel type added successfully.', fuelType: localFuelType };
    } catch (err: any) {
      // Offline fallback: still add to local state
      setFuelTypes(prev => [localFuelType, ...prev.filter(f => f.id !== localFuelType.id)]);
      return { success: true, message: 'Fuel type added successfully.', fuelType: localFuelType };
    }
  };

  const updateFuelType = async (id: string, updates: Partial<FuelType>) => {
    const today = new Date().toISOString().split('T')[0];
    setFuelTypes(prev => prev.map(f => {
      if (f.id === id) {
        let history = [...(f.price_history || [])];
        if (updates.current_price !== undefined && updates.current_price !== f.current_price) {
          history.push({
            date: today,
            price: Number(updates.current_price),
            changed_by: currentUser.name || 'Admin'
          });
        }
        return {
          ...f,
          ...updates,
          price_history: history,
          updated_at: today
        };
      }
      return f;
    }));

    try {
      const res = await fetch(`/api/master/fuel-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success && data.fuelType) {
        setFuelTypes(prev => prev.map(f => f.id === id ? data.fuelType : f));
        return { success: true, message: data.message };
      }
      return { success: true, message: 'Fuel type updated.' };
    } catch (err: any) {
      return { success: true, message: 'Fuel type updated locally.' };
    }
  };

  const deleteFuelType = async (id: string) => {
    try {
      const res = await fetch(`/api/master/fuel-types/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setFuelTypes(prev => prev.filter(f => f.id !== id));
        return { success: true, message: data.message };
      }
      return {
        success: false,
        message: data.message || 'Failed to delete fuel type',
        has_dependencies: !!data.has_dependencies
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        language,
        setLanguage,
        currentTenant,
        setCurrentTenantId: setCurrentTenantIdState,
        allTenants: tenants,
        activeTenants,
        tenantSuspensionNotice,
        clearTenantSuspensionNotice,
        refreshTenantsFromServer,
        refreshUsersFromServer,
        syncManager: SyncManager,
        currentUser,
        setCurrentUserId: setCurrentUserIdState,
        allUsers: users,

        // SaaS Owner & Moderator
        saasOwner,
        updateSaasOwnerCredentials,
        moderators,
        addModerator,
        updateModerator,
        deleteModerator,

        // Auth & View state
        isAuthenticated,
        logout,
        activeAuthRole,
        activeModerator,
        isSaasControlOpen,
        setIsSaasControlOpen,
        loginAsSaasOwner,
        loginAsModerator,
        loginAsCompanyUser,
        impersonateTenant,
        exitToSaasControl,

        // Subscriber / Tenant Management
        addTenantSubscriber,
        updateTenantSubscription,
        extendTenantSubscription,
        setTenantStatus,
        updateTenantSuperAdminCredentials,
        deleteTenantSubscriber,
        cascadeDeleteTenant,
        updateTenantLogo,
        updateTenant,

        // Approvals & Governance (Update 9)
        approvals,
        fetchApprovals,
        requestApprovalAction,
        approveAction,
        rejectAction,

        // Mandatory Password Change (Update 10)
        changeUserPassword,

        // Bulk Data Import (Update 11)
        bulkImportData,

        // Company User Management & Category Access
        addCompanyUser,
        updateCompanyUser,
        deleteCompanyUser,

        companies: scopedCompanies,
        vendors: scopedVendors,
        pumps: scopedPumps,
        fuelTypes: scopedFuelTypes,
        categories: scopedCategories,
        vehicles: scopedVehicles,
        fuelEntries: scopedFuelEntries,
        payments: scopedPayments,
        tankers: scopedTankers,
        tankerLogs: scopedTankerLogs,

        kpis,

        addCompany,
        updateCompany,
        deleteCompany,

        addVendor,
        updateVendor,
        deleteVendor,

        addPump,
        updatePump,
        deletePump,

        updateFuelPrice,
        addFuelType,
        updateFuelType,
        deleteFuelType,

        addCategory,
        updateCategory,
        deleteCategory,

        addVehicle,
        updateVehicle,
        deleteVehicle,

        addFuelEntry,
        updateFuelEntry,
        deleteFuelEntry,

        addPumpPayment,
        updatePumpPayment,
        deletePumpPayment,

        addTanker,
        updateTanker,
        deleteTanker,
        addTankerStockIn,
        addTankerDispenseOrAdjustment,

        // Subscription Upgrade & Verification Payments (Update 2)
        subscriptionPayments,
        fetchSubscriptionPayments,
        submitSubscriptionPayment,
        approveSubscriptionPayment,
        rejectSubscriptionPayment,
        getFuelPriceForDate,

        resetToDefaultData,

        // Generic Confirm Delete Modal State & Actions
        confirmDeleteModal,
        requestConfirmDelete,
        closeConfirmDelete
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
