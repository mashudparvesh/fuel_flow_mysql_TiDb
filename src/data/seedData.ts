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
  SaasOwnerProfile,
  SaasModerator
} from '../types';

export const DEFAULT_SAAS_OWNER: SaasOwnerProfile = {
  id: 'saas_owner_1',
  username: 'mashudalone',
  password: '00000',
  name: 'Md. Mashud (Platform Owner)',
  email: 'mashudrus@gmail.com',
  phone: '+880 1700-000000',
  role: 'platform_owner',
  owner_role: 'OWNER_ADMIN',
  updated_at: '2026-09-24'
};

export const INITIAL_MODERATORS: SaasModerator[] = [];

export const INITIAL_TENANTS: Tenant[] = [];

export const INITIAL_USERS: User[] = [];

export const INITIAL_COMPANIES: Company[] = [];

export const INITIAL_VENDORS: Vendor[] = [];

export const INITIAL_PUMPS: FuelPump[] = [];

export const INITIAL_FUEL_TYPES: FuelType[] = [
  { id: 'ft_1', tenant_id: 'default', user_id: 'u_admin', code: 'diesel', name: 'Diesel', unit: 'Liter', current_price: 105.00, price_history: [], updated_at: '2025-01-01' },
  { id: 'ft_2', tenant_id: 'default', user_id: 'u_admin', code: 'octane', name: 'Octane', unit: 'Liter', current_price: 125.00, price_history: [], updated_at: '2025-01-01' },
  { id: 'ft_3', tenant_id: 'default', user_id: 'u_admin', code: 'petrol', name: 'Petrol', unit: 'Liter', current_price: 121.00, price_history: [], updated_at: '2025-01-01' },
  { id: 'ft_4', tenant_id: 'default', user_id: 'u_admin', code: 'cng', name: 'CNG', unit: 'm3', current_price: 43.00, price_history: [], updated_at: '2025-01-01' },
  { id: 'ft_5', tenant_id: 'default', user_id: 'u_admin', code: 'lpg', name: 'LPG', unit: 'Liter', current_price: 110.00, price_history: [], updated_at: '2025-01-01' }
];

export const INITIAL_CATEGORIES: VehicleCategory[] = [
  { id: 'cat_1', tenant_id: 'default', user_id: 'u_admin', name: 'Heavy Excavator', description: 'Heavy earth moving and mining excavators', metric_type: 'lph', default_benchmark: 14.0, icon_name: 'Shovel' },
  { id: 'cat_2', tenant_id: 'default', user_id: 'u_admin', name: 'Dump Truck', description: 'Heavy material transport dump trucks', metric_type: 'kmpl', default_benchmark: 3.2, icon_name: 'Truck' },
  { id: 'cat_3', tenant_id: 'default', user_id: 'u_admin', name: 'Diesel Generator', description: 'Continuous running standby diesel generators', metric_type: 'lph', default_benchmark: 18.0, icon_name: 'Zap' },
  { id: 'cat_4', tenant_id: 'default', user_id: 'u_admin', name: 'Mobile Tanker Bowzer', description: 'On-site mobile fuel dispensing tankers', metric_type: 'kmpl', default_benchmark: 4.0, icon_name: 'Fuel' },
  { id: 'cat_5', tenant_id: 'default', user_id: 'u_admin', name: 'Site Pickup & SUV', description: 'Site engineering and supervisory pickups', metric_type: 'kmpl', default_benchmark: 8.5, icon_name: 'Car' }
];

export const INITIAL_VEHICLES: Vehicle[] = [];

export const INITIAL_FUEL_ENTRIES: FuelEntry[] = [];

export const INITIAL_PAYMENTS: PumpPayment[] = [];

export const INITIAL_TANKERS: TankerInventory[] = [];

export const INITIAL_TANKER_LOGS: TankerLog[] = [];
