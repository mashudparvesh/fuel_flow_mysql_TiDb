export type UserRole = 'super_admin' | 'company_owner' | 'supervisor' | 'operator' | 'accountant' | 'client_viewer';

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise' | 'custom';
export type SubscriptionStatus = 'active' | 'expired' | 'suspended' | 'trial' | 'inactive';

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
  allowed_category_ids?: string[]; // If empty or contains 'all', has access to all vehicle categories
  allowed_pump_ids?: string[]; // If empty or contains 'all', has access to all fuel pumps
  permissions?: UserPermissions;
  created_at?: string;
}

export interface SaasOwnerProfile {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  role: 'platform_owner';
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
  email: string;
  phone: string;
  role: 'saas_moderator';
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
  code: 'diesel' | 'petrol' | 'octane' | 'cng' | 'lpg';
  unit: 'Liter' | 'm3' | 'Kg';
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
