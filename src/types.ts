export type UserRole = 'super_admin' | 'company_owner' | 'supervisor' | 'operator' | 'accountant' | 'client_viewer';

export type SubscriptionPlan =
  | 'trial_3days'
  | 'plan_1month'
  | 'plan_3months'
  | 'plan_6months'
  | 'plan_12months'
  | 'starter'
  | 'professional'
  | 'enterprise'
  | 'custom';
export type SubscriptionStatus = 'active' | 'expired' | 'suspended' | 'trial' | 'inactive' | 'pending_payment';

export type SubscriptionPlanId = SubscriptionPlan;

export interface SubscriptionPlanConfig {
  id: SubscriptionPlan;
  name_en: string;
  name_bn: string;
  nameEn?: string;
  nameBn?: string;
  duration_days: number;
  durationDays?: number;
  duration_type: 'days' | 'months' | 'years';
  durationType?: 'days' | 'months' | 'years';
  duration_val: number;
  durationVal?: number;
  duration_label: string;
  durationLabel?: string;
  price_bdt: number;
  priceBdt?: number;
  is_trial?: boolean;
  isTrial?: boolean;
  badge?: string;
  payment_url?: string;
  paymentUrl?: string;
  features: string[];
}

export const OFFICIAL_SUBSCRIPTION_PLANS: SubscriptionPlanConfig[] = [
  {
    id: 'trial_3days',
    name_en: '3 Days Free Trial',
    name_bn: '3 Days Free Trial',
    nameEn: '3 Days Free Trial',
    nameBn: '3 Days Free Trial',
    duration_days: 3,
    durationDays: 3,
    duration_type: 'days',
    durationType: 'days',
    duration_val: 3,
    durationVal: 3,
    duration_label: '3 Days',
    durationLabel: '3 Days',
    price_bdt: 0,
    priceBdt: 0,
    is_trial: true,
    isTrial: true,
    badge: 'Free Trial',
    features: [
      'Full options & all features unlocked',
      'Dual Metric Tracking (LPH & KMPL)',
      'Bowzer Depot & Highway Pump Ledgers',
      'Bulk Data Import (Excel & CSV)',
      'A4 Official PDF Reports & Analytics'
    ]
  },
  {
    id: 'plan_1month',
    name_en: '1 Month Plan',
    name_bn: '1 Month Plan',
    nameEn: '1 Month Plan',
    nameBn: '1 Month Plan',
    duration_days: 30,
    durationDays: 30,
    duration_type: 'months',
    durationType: 'months',
    duration_val: 1,
    durationVal: 1,
    duration_label: '1 Month',
    durationLabel: '1 Month',
    price_bdt: 749,
    priceBdt: 749,
    badge: 'Most Popular',
    payment_url: 'https://baniq.app/link/b2c3e4d825',
    paymentUrl: 'https://baniq.app/link/b2c3e4d825',
    features: [
      'Full options & all modules unlocked',
      'Dual Metric (LPH & KMPL) Analytics',
      'Physical Dip Stick & Dispense Reconciliation',
      'Unlimited Vehicle & Fuel Entries',
      'Highway Pump Balance & Credit Ledgers'
    ]
  },
  {
    id: 'plan_3months',
    name_en: '3 Months Plan',
    name_bn: '3 Months Plan',
    nameEn: '3 Months Plan',
    nameBn: '3 Months Plan',
    duration_days: 90,
    durationDays: 90,
    duration_type: 'months',
    durationType: 'months',
    duration_val: 3,
    durationVal: 3,
    duration_label: '3 Months',
    durationLabel: '3 Months',
    price_bdt: 2199,
    priceBdt: 2199,
    badge: 'Quarterly',
    payment_url: 'https://baniq.app/link/551a5611cc',
    paymentUrl: 'https://baniq.app/link/551a5611cc',
    features: [
      'Full options & all modules unlocked',
      'Dual Metric (LPH & KMPL) Engine',
      'Role-based Multi User Access',
      'Audit Logs & Anomaly Detection',
      'Cost Savings Package'
    ]
  },
  {
    id: 'plan_6months',
    name_en: '6 Months Plan',
    name_bn: '6 Months Plan',
    nameEn: '6 Months Plan',
    nameBn: '6 Months Plan',
    duration_days: 180,
    durationDays: 180,
    duration_type: 'months',
    durationType: 'months',
    duration_val: 6,
    durationVal: 6,
    duration_label: '6 Months',
    durationLabel: '6 Months',
    price_bdt: 3999,
    priceBdt: 3999,
    badge: 'Best Value',
    payment_url: 'https://baniq.app/link/f08fdcda12',
    paymentUrl: 'https://baniq.app/link/f08fdcda12',
    features: [
      'Full options & all modules unlocked',
      'Multi-site Fleet & Bowzer Logistics',
      'AI Fuel Theft & Siphoning Alerts',
      'Company Logo on All Printable Reports',
      'High Cost Savings (Semi-Annual Discount)'
    ]
  },
  {
    id: 'plan_12months',
    name_en: 'VIP Plan',
    name_bn: 'VIP Plan',
    nameEn: 'VIP Plan',
    nameBn: 'VIP Plan',
    duration_days: 365,
    durationDays: 365,
    duration_type: 'years',
    durationType: 'years',
    duration_val: 1,
    durationVal: 1,
    duration_label: '1 Year',
    durationLabel: '1 Year',
    price_bdt: 7999,
    priceBdt: 7999,
    badge: 'VIP Plan',
    payment_url: 'https://baniq.app/link/4827e7deb9',
    paymentUrl: 'https://baniq.app/link/4827e7deb9',
    features: [
      'Full options & all modules unlocked',
      'Maximum Commercial Savings',
      'Unlimited Machinery, Bowzers & Pumps',
      'Dedicated SLA Guarantee & Data Protection',
      'Priority Customer & Migration Support'
    ]
  }
];

export const OFFICIAL_SUBSCRIPTION_PLANS_MAP: Record<string, SubscriptionPlanConfig> = OFFICIAL_SUBSCRIPTION_PLANS.reduce(
  (acc, plan) => {
    acc[plan.id] = plan;
    return acc;
  },
  {} as Record<string, SubscriptionPlanConfig>
);

export interface TenantSubscription {
  plan: SubscriptionPlan;
  plan_name_bn: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  duration_type: 'days' | 'months' | 'years';
  duration_val: number;
  price_bdt: number;
  payment_status: 'paid' | 'partial' | 'due';
  max_vehicles: number;
  max_users: number;
  max_pumps: number;
  super_admin_username: string;
  super_admin_password?: string;
  features: {
    tanker_bowzer: boolean;
    anomaly_ai: boolean;
    reports_export: boolean;
    qr_scanner: boolean;
    custom_categories: boolean;
  };
  notes?: string;
}

export interface Tenant {
  id: string;
  name: string;
  code: string;
  currency: string;
  phone: string;
  address: string;
  contact_person?: string;
  email?: string;
  status?: SubscriptionStatus;
  deleted_at?: string | null;
  created_at?: string;
  subscription?: TenantSubscription;
  logo?: string;
}

export interface UserPermissions {
  can_add_fuel: boolean;
  can_manage_vehicles: boolean;
  can_manage_pumps: boolean;
  can_view_reports: boolean;
  can_manage_users: boolean;
  can_edit_settings: boolean;
}

export interface User {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  phone?: string;
  role: UserRole;
  role_title_bn: string;
  company_id?: string; // If client_viewer, restricted to this company
  avatar?: string;
  status?: 'active' | 'suspended';
  must_change_password?: boolean;
  allowed_category_ids?: string[]; // If empty or contains 'all', has access to all vehicle categories
  allowed_pump_ids?: string[]; // If empty or contains 'all', has access to all fuel pumps
  permissions?: UserPermissions;
  created_at?: string;
}

export type OwnerRole = 'OWNER_ADMIN' | 'CO_OWNER_ADMIN' | 'ADMIN' | 'MODERATOR';
export type PendingActionType = 'DELETE_SUBSCRIBER' | 'EXTEND_SUBSCRIPTION' | 'SUSPEND_TENANT' | 'UNSUSPEND_TENANT';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PendingApprovalAction {
  id: string;
  action_type: PendingActionType;
  target_tenant_id: string;
  target_tenant_name: string;
  requested_by_id: string;
  requested_by_name: string;
  requested_by_role: OwnerRole;
  details: Record<string, any>;
  status: ApprovalStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface SaasOwnerProfile {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  role: 'platform_owner';
  owner_role?: OwnerRole;
  updated_at: string;
}

export interface ModeratorPermissions {
  can_manage_subscribers: boolean;
  can_manage_subscriptions?: boolean;
  can_add_subscribers?: boolean;
  can_extend_subscriptions: boolean;
  can_manage_pricing: boolean;
  can_view_financials: boolean;
  can_impersonate: boolean;
  can_reset_passwords: boolean;
}

export interface SaasModerator {
  id: string;
  name: string;
  username: string;
  password: string;
  must_change_password?: boolean;
  email: string;
  phone: string;
  role: 'saas_moderator';
  owner_role?: OwnerRole;
  status: 'active' | 'suspended';
  permissions: ModeratorPermissions;
  created_at: string;
}

export interface Company {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  code: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
}

export interface FuelPump {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  location: string;
  contact_person: string;
  phone: string;
  credit_limit: number;
  opening_balance: number;
  current_balance: number; // calculated: opening + credit entries - payments
  status: 'active' | 'inactive';
  created_at: string;
}

export interface FuelPriceRecord {
  date: string;
  price: number;
  changed_by: string;
}

export interface FuelType {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  code: string; // 'diesel' | 'petrol' | 'octane' | 'cng' | 'lpg' | custom code
  unit: string; // 'Liter' | 'm3' | 'Kg' | 'Gallon' | custom unit
  current_price: number;
  price_history: FuelPriceRecord[];
  updated_at: string;
}

export interface VehicleCategory {
  id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  metric_type: 'kmpl' | 'lph'; // KMPL = km/liter for vehicles, LPH = liters/hour for heavy equipment & generators
  default_benchmark: number;
  tolerance_percentage?: number;
  icon_name: string;
  description: string;
}

export interface Vehicle {
  id: string;
  tenant_id: string;
  user_id: string;
  vehicle_number: string;
  category_id: string;
  ownership: 'owned' | 'rented';
  vendor_id?: string;
  company_id: string;
  fuel_type_id: string;
  expected_benchmark: number; // Benchmark mileage (e.g. 9.5 km/L or 12 L/hr)
  current_odometer: number; // Last recorded odometer or hour meter
  driver_name: string;
  driver_phone: string;
  status: 'active' | 'maintenance' | 'idle';
  created_at: string;
}

export interface FuelEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  entry_date: string;
  slip_no: string;
  vehicle_id: string;
  company_id: string;
  source_type: 'pump' | 'tanker';
  pump_id?: string;
  tanker_id?: string;
  previous_meter: number;
  current_meter: number;
  distance_traveled: number; // or operating hours
  fuel_liters: number;
  unit_price: number;
  total_amount: number;
  calculated_mileage: number; // distance / liters (or liters / hr for LPH)
  benchmark_mileage: number;
  is_anomaly: boolean;
  anomaly_diff_percent?: number;
  anomaly_reason?: string;
  receipt_image_url?: string;
  notes?: string;
  created_by_name: string;
  created_at: string;
}

export interface PumpPayment {
  id: string;
  tenant_id: string;
  user_id: string;
  pump_id: string;
  payment_date: string;
  amount: number;
  payment_method: 'bank_transfer' | 'cheque' | 'cash' | 'mfs';
  transaction_ref: string;
  receipt_url?: string;
  notes?: string;
  recorded_by: string;
  created_at: string;
}

export interface TankerInventory {
  id: string;
  tenant_id: string;
  user_id: string;
  tanker_name: string;
  location: string;
  capacity_liters: number;
  current_stock_liters: number;
  fuel_type_id: string;
  min_alert_threshold: number;
  last_restocked_at: string;
}

export interface TankerLog {
  id: string;
  tenant_id: string;
  user_id: string;
  tanker_id: string;
  log_type: 'stock_in' | 'dispense_out' | 'dip_adjustment' | 'transfer';
  date: string;
  liters: number;
  unit_cost?: number;
  source_or_vehicle: string;
  notes?: string;
  previous_stock: number;
  new_stock: number;
  created_at: string;
}
