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
  updated_at: '2026-09-12'
};

export const INITIAL_MODERATORS: SaasModerator[] = [
  {
    id: 'mod_1',
    name: 'Tanvir Ahmed (SaaS Ops)',
    username: 'tanvir_ops',
    password: 'mod12345',
    email: 'ops@fuelnest.xyz',
    phone: '+880 1911-223344',
    role: 'saas_moderator',
    status: 'active',
    permissions: {
      can_manage_subscribers: true,
      can_extend_subscriptions: true,
      can_manage_pricing: true,
      can_view_financials: true,
      can_impersonate: true,
      can_reset_passwords: true
    },
    created_at: '2026-08-01'
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant_1',
    name: 'Padma Multipurpose Fleet Services Ltd',
    code: 'PMFS',
    currency: 'BDT',
    phone: '+880 1711-892341',
    address: 'Plot 14, Commercial Area, Ishwardi, Pabna',
    contact_person: 'M. A. Rahman',
    email: 'admin@padmafleet.com',
    created_at: '2026-08-01',
    subscription: {
      plan: 'enterprise',
      plan_name_bn: 'Enterprise Plan',
      status: 'active',
      start_date: '2026-08-01',
      end_date: '2026-11-01',
      duration_type: 'months',
      duration_val: 3,
      price_bdt: 25000,
      payment_status: 'paid',
      max_vehicles: 100,
      max_users: 25,
      max_pumps: 15,
      super_admin_username: 'padma_admin',
      super_admin_password: 'padma#pass123',
      features: {
        tanker_bowzer: true,
        anomaly_ai: true,
        reports_export: true,
        qr_scanner: true,
        custom_categories: true
      },
      notes: 'Ruppur Mega Project Fleet Vendor - Paid via Bank Cheque'
    }
  },
  {
    id: 'tenant_2',
    name: 'Bengal Infra Logistics & Transport',
    code: 'BILT',
    currency: 'BDT',
    phone: '+880 1819-445566',
    address: 'Tejgaon Industrial Area, Dhaka',
    contact_person: 'Shafiqul Alam',
    email: 'shafiq@bengalinfra.com',
    created_at: '2026-08-15',
    subscription: {
      plan: 'professional',
      plan_name_bn: 'Professional Plan',
      status: 'active',
      start_date: '2026-08-15',
      end_date: '2026-09-30',
      duration_type: 'months',
      duration_val: 1,
      price_bdt: 12000,
      payment_status: 'paid',
      max_vehicles: 40,
      max_users: 10,
      max_pumps: 5,
      super_admin_username: 'bengal_admin',
      super_admin_password: 'bengal#2026',
      features: {
        tanker_bowzer: true,
        anomaly_ai: true,
        reports_export: true,
        qr_scanner: true,
        custom_categories: false
      },
      notes: 'Dhaka - Chittagong Highway Logistics Division'
    }
  },
  {
    id: 'tenant_3',
    name: 'Jamuna Mega Cargo & Haulage Ltd',
    code: 'JMCH',
    currency: 'BDT',
    phone: '+880 1712-998877',
    address: 'Bangabandhu Bridge West Link, Sirajganj',
    contact_person: 'Md. Tariqul Islam',
    email: 'info@jamunacargo.com',
    status: 'active',
    deleted_at: null,
    created_at: '2026-09-01',
    subscription: {
      plan: 'enterprise',
      plan_name_bn: 'Enterprise Plan',
      status: 'active',
      start_date: '2026-09-01',
      end_date: '2027-09-01',
      duration_type: 'years',
      duration_val: 1,
      price_bdt: 90000,
      payment_status: 'paid',
      max_vehicles: 80,
      max_users: 20,
      max_pumps: 10,
      super_admin_username: 'jamuna_admin',
      super_admin_password: 'jamuna#pass2026',
      features: {
        tanker_bowzer: true,
        anomaly_ai: true,
        reports_export: true,
        qr_scanner: true,
        custom_categories: true
      },
      notes: 'National Highway Fuel Network Client'
    }
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_super_admin',
    tenant_id: 'tenant_1',
    name: 'M. A. Rahman',
    email: 'admin@padmafleet.com',
    username: 'padma_admin',
    password: 'padma#pass123',
    phone: '+880 1711-892341',
    role: 'super_admin',
    role_title_bn: 'Super Admin',
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
    created_at: '2026-08-01'
  },
  {
    id: 'usr_owner',
    tenant_id: 'tenant_1',
    name: 'Tariqul Islam',
    email: 'tariqul@padmafleet.com',
    username: 'tariqul_fleet',
    password: 'padma#pass123',
    phone: '+880 1712-334455',
    role: 'company_owner',
    role_title_bn: 'Company Owner',
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
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-08-01'
  },
  {
    id: 'usr_supervisor',
    tenant_id: 'tenant_1',
    name: 'Kamal Hossain',
    email: 'kamal.fuel@padmafleet.com',
    username: 'kamal_entry',
    password: 'user1234',
    phone: '+880 1713-778899',
    role: 'supervisor',
    role_title_bn: 'Data Entry Supervisor',
    status: 'active',
    allowed_category_ids: ['cat_heavy_dump', 'cat_trailer'], // Category restricted example!
    allowed_pump_ids: ['all'],
    permissions: {
      can_add_fuel: true,
      can_manage_vehicles: false,
      can_manage_pumps: false,
      can_view_reports: true,
      can_manage_users: false,
      can_edit_settings: false
    },
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-08-05'
  },
  {
    id: 'usr_client_rosatom',
    tenant_id: 'tenant_1',
    name: 'Alexei Ivanov (Rosatom)',
    email: 'alexei@rosatom-site.org',
    username: 'alexei_rosatom',
    password: 'client1234',
    phone: '+880 1714-990011',
    role: 'client_viewer',
    role_title_bn: 'Client Viewer',
    company_id: 'comp_rosatom',
    status: 'active',
    allowed_category_ids: ['cat_heavy_dump', 'cat_excavator'],
    allowed_pump_ids: ['pump_1', 'pump_2'],
    permissions: {
      can_add_fuel: false,
      can_manage_vehicles: false,
      can_manage_pumps: false,
      can_view_reports: true,
      can_manage_users: false,
      can_edit_settings: false
    },
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-08-10'
  },
  {
    id: 'usr_operator_faruk',
    tenant_id: 'tenant_1',
    name: 'Faruk Hossain (Fuel Operator)',
    email: 'faruk.fuel@padmafleet.com',
    username: 'faruk_operator',
    password: 'operator123',
    phone: '+880 1715-445566',
    role: 'operator',
    role_title_bn: 'Fuel Operator',
    status: 'active',
    allowed_category_ids: ['all'],
    allowed_pump_ids: ['all'],
    permissions: {
      can_add_fuel: true,
      can_manage_vehicles: false,
      can_manage_pumps: true,
      can_view_reports: true,
      can_manage_users: false,
      can_edit_settings: false
    },
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-08-12'
  },
  {
    id: 'usr_accountant_selim',
    tenant_id: 'tenant_1',
    name: 'Selim Reza (Fleet Accountant)',
    email: 'selim.acc@padmafleet.com',
    username: 'selim_account',
    password: 'account123',
    phone: '+880 1716-556677',
    role: 'accountant',
    role_title_bn: 'Fleet Accountant',
    status: 'active',
    allowed_category_ids: ['all'],
    allowed_pump_ids: ['all'],
    permissions: {
      can_add_fuel: true,
      can_manage_vehicles: true,
      can_manage_pumps: true,
      can_view_reports: true,
      can_manage_users: false,
      can_edit_settings: false
    },
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-08-14'
  },
  {
    id: 'usr_bengal_admin',
    tenant_id: 'tenant_2',
    name: 'Shafiqul Alam (Admin)',
    email: 'shafiq@bengalinfra.com',
    username: 'bengal_admin',
    password: 'bengal#2026',
    phone: '+880 1819-445566',
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
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-08-15'
  },
  {
    id: 'usr_jamuna_admin',
    tenant_id: 'tenant_3',
    name: 'Kabir Chowdhury (Admin)',
    email: 'kabir@jamunapower.com',
    username: 'jamuna_admin',
    password: 'jamuna#pass2026',
    phone: '+880 1912-887766',
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
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-09-01'
  }
];

export const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp_rosatom',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Rosatom (Rooppur NPP Project)',
    code: 'ROSATOM',
    contact_person: 'Mr. Sergei Pavlov',
    phone: '+880 1713-998811',
    email: 'logistics@rosatom-rnpp.com',
    address: 'Project Site Camp 2, Rooppur, Ishwardi',
    created_at: '2026-01-10'
  },
  {
    id: 'comp_nikimth',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Nikimth Atomstroy Consortium',
    code: 'NIKIMTH',
    contact_person: 'Engr. Mahfuzur Rahman',
    phone: '+880 1715-334422',
    email: 'transport@nikimth-bd.com',
    address: 'Reactor Block West, Site Sector 4, Ishwardi',
    created_at: '2026-01-15'
  },
  {
    id: 'comp_pbrlp',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Padma Bridge Rail Link Project (PBRLP)',
    code: 'PBRLP',
    contact_person: 'Zahid Hasan',
    phone: '+880 1822-776655',
    email: 'fleet@pbrlp-infra.gov.bd',
    address: 'Camp Sector 8, Mawa, Munshiganj',
    created_at: '2026-02-01'
  },
  {
    id: 'comp_bengal',
    tenant_id: 'tenant_2',
    user_id: 'usr_bengal_admin',
    name: 'Bengal Infra Logistics & Transport',
    code: 'BILT',
    contact_person: 'Shafiqul Alam',
    phone: '+880 1819-445566',
    email: 'shafiq@bengalinfra.com',
    address: 'Tejgaon Industrial Area, Dhaka',
    created_at: '2026-08-15'
  },
  {
    id: 'comp_jamuna',
    tenant_id: 'tenant_3',
    user_id: 'usr_jamuna_admin',
    name: 'Jamuna Mega Cargo & Haulage Ltd',
    code: 'JMCH',
    contact_person: 'Md. Tariqul Islam',
    phone: '+880 1712-998877',
    email: 'info@jamunacargo.com',
    address: 'Bangabandhu Bridge West Link, Sirajganj',
    created_at: '2026-09-01'
  }
];

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vnd_chowdhury',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Chowdhury Transport Agency',
    contact_person: 'Al-Hajj Rafiq Chowdhury',
    phone: '+880 1712-114488',
    email: 'chowdhury.rentals@gmail.com',
    address: 'Station Road, Ishwardi, Pabna',
    created_at: '2026-01-12'
  },
  {
    id: 'vnd_bengal_heavy',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Bengal Heavy Equipment & Crane Rental',
    contact_person: 'Mirza Asaduzzaman',
    phone: '+880 1914-556677',
    email: 'info@bengalheavyequipment.com',
    address: 'Kushtia Bypass Road, Kushtia',
    created_at: '2026-01-20'
  },
  {
    id: 'vnd_raju_motors',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Raju Motors Fleet Services',
    contact_person: 'Raju Ahmed',
    phone: '+880 1618-990022',
    email: 'raju.motors.bd@gmail.com',
    address: 'Dashuria Railgate, Ishwardi',
    created_at: '2026-02-05'
  }
];

export const INITIAL_PUMPS: FuelPump[] = [
  {
    id: 'pump_jamuna',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Jamuna Highway Fuel & CNG Station',
    location: 'Rooppur Bypass, Ishwardi-Pabna Highway',
    contact_person: 'Kabir Hossain (Manager)',
    phone: '+880 1716-550011',
    credit_limit: 800000,
    opening_balance: 150000,
    current_balance: 284500,
    status: 'active',
    created_at: '2026-01-01'
  },
  {
    id: 'pump_padma_central',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Padma Central Oil Filling Station',
    location: 'Paksey Bridge Approach, Ishwardi',
    contact_person: 'Nurul Islam',
    phone: '+880 1819-223344',
    credit_limit: 1200000,
    opening_balance: 220000,
    current_balance: 412000,
    status: 'active',
    created_at: '2026-01-05'
  },
  {
    id: 'pump_meghna_express',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Meghna Express Petrol Pump',
    location: 'Dashuria Junction, Pabna',
    contact_person: 'Abu Sayeed',
    phone: '+880 1913-778899',
    credit_limit: 500000,
    opening_balance: 50000,
    current_balance: 85600,
    status: 'active',
    created_at: '2026-02-10'
  },
  {
    id: 'pump_dhaka_express',
    tenant_id: 'tenant_2',
    user_id: 'bengal_admin',
    name: 'Dhaka-Ctg Highway Central Pump',
    location: 'Signboard, Narayanganj',
    contact_person: 'Shafiqul Islam',
    phone: '+880 1711-229988',
    credit_limit: 1000000,
    opening_balance: 180000,
    current_balance: 245000,
    status: 'active',
    created_at: '2026-02-15'
  },
  {
    id: 'pump_bengal_fuel',
    tenant_id: 'tenant_2',
    user_id: 'bengal_admin',
    name: 'Tejgaon Fuel & Energy Station',
    location: 'Tejgaon Industrial Area, Dhaka',
    contact_person: 'Mahmudur Rahman',
    phone: '+880 1819-338877',
    credit_limit: 750000,
    opening_balance: 95000,
    current_balance: 132000,
    status: 'active',
    created_at: '2026-02-20'
  },
  {
    id: 'pump_jamuna_bridge',
    tenant_id: 'tenant_3',
    user_id: 'usr_jamuna_admin',
    name: 'Jamuna Bridge West Highway Fuel Hub',
    location: 'Bangabandhu Bridge West Link, Sirajganj',
    contact_person: 'Md. Tariqul Islam',
    phone: '+880 1712-998877',
    credit_limit: 800000,
    opening_balance: 150000,
    current_balance: 235400,
    status: 'active',
    created_at: '2026-09-01'
  },
  {
    id: 'pump_sirajganj_depot',
    tenant_id: 'tenant_3',
    user_id: 'usr_jamuna_admin',
    name: 'Sirajganj Central Fuel Depot & Station',
    location: 'Station Road, Sirajganj',
    contact_person: 'Farhan Chowdhury',
    phone: '+880 1715-442211',
    credit_limit: 600000,
    opening_balance: 75000,
    current_balance: 112000,
    status: 'active',
    created_at: '2026-09-02'
  }
];

export const INITIAL_FUEL_TYPES: FuelType[] = [
  {
    id: 'fuel_diesel',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Diesel',
    code: 'diesel',
    unit: 'Liter',
    current_price: 108.50,
    price_history: [
      { date: '2026-01-01', price: 106.00, changed_by: 'M. A. Rahman' },
      { date: '2026-03-01', price: 108.50, changed_by: 'M. A. Rahman' }
    ],
    updated_at: '2026-03-01'
  },
  {
    id: 'fuel_octane',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Octane',
    code: 'octane',
    unit: 'Liter',
    current_price: 131.00,
    price_history: [
      { date: '2026-01-01', price: 128.50, changed_by: 'M. A. Rahman' },
      { date: '2026-02-15', price: 131.00, changed_by: 'M. A. Rahman' }
    ],
    updated_at: '2026-02-15'
  },
  {
    id: 'fuel_petrol',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Petrol',
    code: 'petrol',
    unit: 'Liter',
    current_price: 126.00,
    price_history: [
      { date: '2026-01-01', price: 124.00, changed_by: 'M. A. Rahman' },
      { date: '2026-02-15', price: 126.00, changed_by: 'M. A. Rahman' }
    ],
    updated_at: '2026-02-15'
  },
  {
    id: 'fuel_cng',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'CNG',
    code: 'cng',
    unit: 'm3',
    current_price: 43.00,
    price_history: [
      { date: '2026-01-01', price: 43.00, changed_by: 'M. A. Rahman' }
    ],
    updated_at: '2026-01-01'
  },
  {
    id: 'fuel_lpg',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Auto LPG',
    code: 'lpg',
    unit: 'Liter',
    current_price: 105.00,
    price_history: [
      { date: '2026-01-01', price: 102.00, changed_by: 'M. A. Rahman' },
      { date: '2026-03-05', price: 105.00, changed_by: 'M. A. Rahman' }
    ],
    updated_at: '2026-03-05'
  }
];

export const INITIAL_CATEGORIES: VehicleCategory[] = [
  {
    id: 'cat_bus_40',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: '40-Seat Staff Bus',
    metric_type: 'kmpl',
    default_benchmark: 4.5,
    icon_name: 'Bus',
    description: 'Ashok Leyland / Hino large personnel transport buses'
  },
  {
    id: 'cat_minibus',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Mini Bus (28-Seat)',
    metric_type: 'kmpl',
    default_benchmark: 6.2,
    icon_name: 'BusFront',
    description: 'Mid-size 28 to 32 passenger shuttle buses'
  },
  {
    id: 'cat_hiace',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Toyota HiAce Microbus',
    metric_type: 'kmpl',
    default_benchmark: 9.5,
    icon_name: 'Van',
    description: '12-14 seat executive crew vans'
  },
  {
    id: 'cat_noah',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Toyota Noah / Voxy',
    metric_type: 'kmpl',
    default_benchmark: 10.2,
    icon_name: 'Car',
    description: '7-8 seat VIP & engineer patrol cars'
  },
  {
    id: 'cat_excavator',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Excavator Heavy Equipment',
    metric_type: 'lph',
    default_benchmark: 16.0, // Liters per hour
    icon_name: 'HardHat',
    description: 'Heavy earth-moving and trench excavation equipment'
  },
  {
    id: 'cat_crane',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Mobile Crane 50T',
    metric_type: 'lph',
    default_benchmark: 13.5, // Liters per hour
    icon_name: 'Truck',
    description: 'Heavy lifting hydraulic mobile crane machines'
  },
  {
    id: 'cat_generator',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    name: 'Diesel Generator 250kVA',
    metric_type: 'lph',
    default_benchmark: 22.0, // Liters per operating hour
    icon_name: 'Zap',
    description: 'Standby & prime power diesel generation plant'
  }
];

export const INITIAL_VEHICLES: Vehicle[] = [
  // Rosatom Vehicles
  {
    id: 'veh_ros_01',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    vehicle_number: 'Dhaka Metro-Ba 15-4421',
    category_id: 'cat_bus_40',
    ownership: 'owned',
    company_id: 'comp_rosatom',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 4.5,
    current_odometer: 142850,
    driver_name: 'Md. Shamsul Haque',
    driver_phone: '+880 1714-220011',
    status: 'active',
    created_at: '2026-01-10'
  },
  {
    id: 'veh_ros_02',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    vehicle_number: 'Dhaka Metro-Ch 11-4029',
    category_id: 'cat_hiace',
    ownership: 'owned',
    company_id: 'comp_rosatom',
    fuel_type_id: 'fuel_octane',
    expected_benchmark: 9.5,
    current_odometer: 78540,
    driver_name: 'Abdul Matin',
    driver_phone: '+880 1819-331122',
    status: 'active',
    created_at: '2026-01-11'
  },
  {
    id: 'veh_ros_03',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    vehicle_number: 'Dhaka Metro-Ga 33-8890',
    category_id: 'cat_noah',
    ownership: 'rented',
    vendor_id: 'vnd_chowdhury',
    company_id: 'comp_rosatom',
    fuel_type_id: 'fuel_octane',
    expected_benchmark: 10.2,
    current_odometer: 64200,
    driver_name: 'Sultan Mahmud',
    driver_phone: '+880 1912-778844',
    status: 'active',
    created_at: '2026-01-15'
  },
  {
    id: 'veh_ros_04',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    vehicle_number: 'RNPP-EXC-07 (CAT 330D)',
    category_id: 'cat_excavator',
    ownership: 'rented',
    vendor_id: 'vnd_bengal_heavy',
    company_id: 'comp_rosatom',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 16.0,
    current_odometer: 3420, // Operating Hours
    driver_name: 'Khorshed Alam (Operator)',
    driver_phone: '+880 1718-445599',
    status: 'active',
    created_at: '2026-01-20'
  },

  // Nikimth Vehicles
  {
    id: 'veh_nik_01',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    vehicle_number: 'Dhaka Metro-Ba 14-9988',
    category_id: 'cat_bus_40',
    ownership: 'rented',
    vendor_id: 'vnd_chowdhury',
    company_id: 'comp_nikimth',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 4.4,
    current_odometer: 188400,
    driver_name: 'Anwar Hossain',
    driver_phone: '+880 1711-554433',
    status: 'active',
    created_at: '2026-01-16'
  },
  {
    id: 'veh_nik_02',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    vehicle_number: 'Dhaka Metro-Ch 19-3321',
    category_id: 'cat_hiace',
    ownership: 'owned',
    company_id: 'comp_nikimth',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 9.2,
    current_odometer: 94100,
    driver_name: 'Shah Alam',
    driver_phone: '+880 1823-110022',
    status: 'active',
    created_at: '2026-01-18'
  },
  {
    id: 'veh_nik_03',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    vehicle_number: 'NK-CRANE-02 (Kato 50T)',
    category_id: 'cat_crane',
    ownership: 'owned',
    company_id: 'comp_nikimth',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 13.5,
    current_odometer: 2890, // Operating Hours
    driver_name: 'Babul Akhter (Master Crane Op)',
    driver_phone: '+880 1915-998822',
    status: 'active',
    created_at: '2026-01-22'
  },

  // PBRLP Vehicles
  {
    id: 'veh_pb_01',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    vehicle_number: 'Dhaka Metro-Sha 11-7714',
    category_id: 'cat_minibus',
    ownership: 'owned',
    company_id: 'comp_pbrlp',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 6.2,
    current_odometer: 112450,
    driver_name: 'Jasim Uddin',
    driver_phone: '+880 1719-887711',
    status: 'active',
    created_at: '2026-02-02'
  },
  {
    id: 'veh_pb_02',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    vehicle_number: 'GEN-SITE-PB01 (Perkins 250kVA)',
    category_id: 'cat_generator',
    ownership: 'owned',
    company_id: 'comp_pbrlp',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 22.0,
    current_odometer: 1650, // Operating Hours
    driver_name: 'Site Engineer Nur',
    driver_phone: '+880 1622-441199',
    status: 'active',
    created_at: '2026-02-04'
  },
  // Bengal Infra (Tenant 2) Vehicles
  {
    id: 'veh_bengal_01',
    tenant_id: 'tenant_2',
    user_id: 'usr_bengal_admin',
    vehicle_number: 'Dhaka Metro-Ta 18-9921',
    category_id: 'cat_heavy_dump',
    ownership: 'owned',
    company_id: 'comp_bengal',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 3.0,
    current_odometer: 64200,
    driver_name: 'Anowar Hossain',
    driver_phone: '+880 1711-332211',
    status: 'active',
    created_at: '2026-08-16'
  },
  {
    id: 'veh_bengal_02',
    tenant_id: 'tenant_2',
    user_id: 'usr_bengal_admin',
    vehicle_number: 'Dhaka Metro-Da 14-3310',
    category_id: 'cat_trailer',
    ownership: 'owned',
    company_id: 'comp_bengal',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 2.2,
    current_odometer: 118400,
    driver_name: 'Khorshed Mia',
    driver_phone: '+880 1819-445522',
    status: 'active',
    created_at: '2026-08-18'
  },
  {
    id: 'veh_jamuna_01',
    tenant_id: 'tenant_3',
    user_id: 'usr_jamuna_admin',
    vehicle_number: 'Sirajganj-Ta 11-4091',
    category_id: 'cat_heavy_dump',
    ownership: 'owned',
    company_id: 'comp_jamuna',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 2.8,
    current_odometer: 84200,
    driver_name: 'Mokbul Hossain',
    driver_phone: '+880 1718-223344',
    status: 'active',
    created_at: '2026-09-01'
  },
  {
    id: 'veh_jamuna_02',
    tenant_id: 'tenant_3',
    user_id: 'usr_jamuna_admin',
    vehicle_number: 'Dhaka Metro-Sha 15-8821',
    category_id: 'cat_trailer',
    ownership: 'owned',
    company_id: 'comp_jamuna',
    fuel_type_id: 'fuel_diesel',
    expected_benchmark: 2.2,
    current_odometer: 142000,
    driver_name: 'Rafiqul Islam',
    driver_phone: '+880 1819-778899',
    status: 'active',
    created_at: '2026-09-01'
  }
];

export const INITIAL_FUEL_ENTRIES: FuelEntry[] = [
  {
    id: 'entry_01',
    tenant_id: 'tenant_1',
    user_id: 'usr_supervisor',
    entry_date: '2026-09-09',
    slip_no: 'SLIP-99014',
    vehicle_id: 'veh_ros_01',
    company_id: 'comp_rosatom',
    source_type: 'pump',
    pump_id: 'pump_jamuna',
    previous_meter: 142420,
    current_meter: 142850,
    distance_traveled: 430, // km
    fuel_liters: 95.5,
    unit_price: 108.50,
    total_amount: 10361.75,
    calculated_mileage: 4.50, // 430 / 95.5 = 4.50 km/L (Matches benchmark!)
    benchmark_mileage: 4.5,
    is_anomaly: false,
    receipt_image_url: 'https://images.unsplash.com/photo-1554415707-9e49fe0488b1?w=400&auto=format&fit=crop&q=80',
    notes: 'Morning shift Rosatom staff route Pabna-Rooppur-Paksey',
    created_by_name: 'Kamal Hossain',
    created_at: '2026-09-09T08:30:00Z'
  },
  {
    id: 'entry_02',
    tenant_id: 'tenant_1',
    user_id: 'usr_supervisor',
    entry_date: '2026-09-09',
    slip_no: 'SLIP-99018',
    vehicle_id: 'veh_ros_02', // HiAce
    company_id: 'comp_rosatom',
    source_type: 'pump',
    pump_id: 'pump_padma_central',
    previous_meter: 78240,
    current_meter: 78540,
    distance_traveled: 300, // km
    fuel_liters: 58.8, // 300 / 58.8 = 5.10 km/L vs benchmark 9.5 km/L! Serious Anomaly!
    unit_price: 131.00,
    total_amount: 7702.80,
    calculated_mileage: 5.10,
    benchmark_mileage: 9.5,
    is_anomaly: true, // RED ALERT FLAG!
    anomaly_diff_percent: -46.3,
    anomaly_reason: 'Abnormally low mileage (46.3% drop). Suspected fuel pipe leakage or unauthorized fuel draining/theft.',
    receipt_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80',
    notes: 'Flagged for workshop technical audit & driver questioning.',
    created_by_name: 'Kamal Hossain',
    created_at: '2026-09-09T11:15:00Z'
  },
  {
    id: 'entry_03',
    tenant_id: 'tenant_1',
    user_id: 'usr_supervisor',
    entry_date: '2026-09-08',
    slip_no: 'SLIP-98920',
    vehicle_id: 'veh_ros_03', // Noah
    company_id: 'comp_rosatom',
    source_type: 'pump',
    pump_id: 'pump_jamuna',
    previous_meter: 63780,
    current_meter: 64200,
    distance_traveled: 420,
    fuel_liters: 41.5,
    unit_price: 131.00,
    total_amount: 5436.50,
    calculated_mileage: 10.12, // Close to benchmark 10.2
    benchmark_mileage: 10.2,
    is_anomaly: false,
    notes: 'Rosatom foreign engineer site inspection duty',
    created_by_name: 'Kamal Hossain',
    created_at: '2026-09-08T17:40:00Z'
  },
  {
    id: 'entry_04',
    tenant_id: 'tenant_1',
    user_id: 'usr_supervisor',
    entry_date: '2026-09-08',
    slip_no: 'SLIP-98894',
    vehicle_id: 'veh_ros_04', // Excavator CAT 330D
    company_id: 'comp_rosatom',
    source_type: 'tanker', // Internal Bowzer Tanker!
    tanker_id: 'tanker_01',
    previous_meter: 3405, // Hours
    current_meter: 3420, // Hours -> Run 15 operating hours
    distance_traveled: 15,
    fuel_liters: 245.0, // 245 / 15 = 16.33 L/hr vs benchmark 16.0
    unit_price: 108.50,
    total_amount: 26582.50,
    calculated_mileage: 16.33,
    benchmark_mileage: 16.0,
    is_anomaly: false,
    notes: 'Dispensed from Internal Diesel Bowzer at Site Camp 2 excavation trench',
    created_by_name: 'Kamal Hossain',
    created_at: '2026-09-08T19:00:00Z'
  },
  {
    id: 'entry_05',
    tenant_id: 'tenant_1',
    user_id: 'usr_supervisor',
    entry_date: '2026-09-07',
    slip_no: 'SLIP-98741',
    vehicle_id: 'veh_nik_01', // Nikimth 40-seat bus
    company_id: 'comp_nikimth',
    source_type: 'pump',
    pump_id: 'pump_padma_central',
    previous_meter: 187980,
    current_meter: 188400,
    distance_traveled: 420,
    fuel_liters: 95.0,
    unit_price: 108.50,
    total_amount: 10307.50,
    calculated_mileage: 4.42,
    benchmark_mileage: 4.4,
    is_anomaly: false,
    created_by_name: 'Kamal Hossain',
    created_at: '2026-09-07T09:10:00Z'
  },
  {
    id: 'entry_06',
    tenant_id: 'tenant_1',
    user_id: 'usr_supervisor',
    entry_date: '2026-09-07',
    slip_no: 'SLIP-98730',
    vehicle_id: 'veh_nik_02', // Nikimth HiAce
    company_id: 'comp_nikimth',
    source_type: 'pump',
    pump_id: 'pump_meghna_express',
    previous_meter: 93800,
    current_meter: 94100,
    distance_traveled: 300,
    fuel_liters: 44.0, // 300 / 44 = 6.81 km/L vs benchmark 9.2 km/L (-26% anomaly!)
    unit_price: 108.50,
    total_amount: 4774.00,
    calculated_mileage: 6.82,
    benchmark_mileage: 9.2,
    is_anomaly: true, // RED ALERT FLAG!
    anomaly_diff_percent: -25.8,
    anomaly_reason: '25.8% below standard benchmark. Inspect air filter obstruction or engine performance.',
    notes: 'Reported to Nikimth transport manager',
    created_by_name: 'Kamal Hossain',
    created_at: '2026-09-07T14:20:00Z'
  },
  {
    id: 'entry_07',
    tenant_id: 'tenant_2',
    user_id: 'usr_bengal_admin',
    entry_date: '2026-09-08',
    slip_no: 'SLIP-88102',
    vehicle_id: 'veh_bengal_01',
    company_id: 'comp_bengal',
    source_type: 'pump',
    pump_id: 'pump_bengal_fuel',
    previous_meter: 63900,
    current_meter: 64200,
    distance_traveled: 300,
    fuel_liters: 100.0,
    unit_price: 108.50,
    total_amount: 10850.00,
    calculated_mileage: 3.00,
    benchmark_mileage: 3.0,
    is_anomaly: false,
    notes: 'Dhaka-Chittagong heavy freight transport refuel',
    created_by_name: 'Shafiqul Alam',
    created_at: '2026-09-08T10:30:00Z'
  },
  {
    id: 'entry_08',
    tenant_id: 'tenant_2',
    user_id: 'usr_bengal_admin',
    entry_date: '2026-09-09',
    slip_no: 'SLIP-88125',
    vehicle_id: 'veh_bengal_02',
    company_id: 'comp_bengal',
    source_type: 'pump',
    pump_id: 'pump_bengal_fuel',
    previous_meter: 118000,
    current_meter: 118400,
    distance_traveled: 400,
    fuel_liters: 181.8,
    unit_price: 108.50,
    total_amount: 19725.30,
    calculated_mileage: 2.20,
    benchmark_mileage: 2.2,
    is_anomaly: false,
    notes: 'Tejgaon depot prime mover refuel',
    created_by_name: 'Shafiqul Alam',
    created_at: '2026-09-09T16:00:00Z'
  },
  {
    id: 'entry_jamuna_01',
    tenant_id: 'tenant_3',
    user_id: 'usr_jamuna_admin',
    entry_date: '2026-09-08',
    slip_no: 'SLIP-JM-001',
    vehicle_id: 'veh_jamuna_01',
    company_id: 'comp_jamuna',
    source_type: 'pump',
    pump_id: 'pump_jamuna_bridge',
    previous_meter: 83800,
    current_meter: 84200,
    distance_traveled: 400,
    fuel_liters: 142.5,
    unit_price: 108.50,
    total_amount: 15461.25,
    calculated_mileage: 2.81,
    benchmark_mileage: 2.8,
    is_anomaly: false,
    notes: 'Highway Cargo haul Sirajganj to Bogra',
    created_by_name: 'Md. Tariqul Islam',
    created_at: '2026-09-08T09:30:00Z'
  },
  {
    id: 'entry_jamuna_02',
    tenant_id: 'tenant_3',
    user_id: 'usr_jamuna_admin',
    entry_date: '2026-09-09',
    slip_no: 'SLIP-JM-002',
    vehicle_id: 'veh_jamuna_02',
    company_id: 'comp_jamuna',
    source_type: 'pump',
    pump_id: 'pump_sirajganj_depot',
    previous_meter: 141500,
    current_meter: 142000,
    distance_traveled: 500,
    fuel_liters: 227.0,
    unit_price: 108.50,
    total_amount: 24629.50,
    calculated_mileage: 2.20,
    benchmark_mileage: 2.2,
    is_anomaly: false,
    notes: 'Heavy Prime Mover Haulage Run',
    created_by_name: 'Md. Tariqul Islam',
    created_at: '2026-09-09T14:15:00Z'
  }
];

export const INITIAL_PAYMENTS: PumpPayment[] = [
  {
    id: 'pay_01',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    pump_id: 'pump_jamuna',
    payment_date: '2026-09-01',
    amount: 100000,
    payment_method: 'bank_transfer',
    transaction_ref: 'EBL-TRX-8849102',
    notes: 'August credit settlement installment #1',
    recorded_by: 'M. A. Rahman',
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: 'pay_02',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    pump_id: 'pump_padma_central',
    payment_date: '2026-09-03',
    amount: 150000,
    payment_method: 'cheque',
    transaction_ref: 'CHQ-DBBL-4491029',
    notes: 'Dutch Bangla Bank Account Payee Cheque',
    recorded_by: 'M. A. Rahman',
    created_at: '2026-09-03T11:30:00Z'
  },
  {
    id: 'pay_03',
    tenant_id: 'tenant_2',
    user_id: 'bengal_admin',
    pump_id: 'pump_dhaka_express',
    payment_date: '2026-09-02',
    amount: 80000,
    payment_method: 'bank_transfer',
    transaction_ref: 'CITY-BTRX-992144',
    notes: 'City Bank corporate account transfer',
    recorded_by: 'Shafiqul Alam',
    created_at: '2026-09-02T14:00:00Z'
  },
  {
    id: 'pay_jamuna_01',
    tenant_id: 'tenant_3',
    user_id: 'usr_jamuna_admin',
    pump_id: 'pump_jamuna_bridge',
    payment_date: '2026-09-03',
    amount: 65000,
    payment_method: 'bank_transfer',
    transaction_ref: 'IBBL-TRX-771920',
    notes: 'Islami Bank Corporate Account Transfer',
    recorded_by: 'Md. Tariqul Islam',
    created_at: '2026-09-03T11:00:00Z'
  }
];

export const INITIAL_TANKERS: TankerInventory[] = [
  {
    id: 'tanker_01',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    tanker_name: 'Internal Diesel Bowzer #01 (Mobile Fuel Bowzer)',
    location: 'Rooppur Central Workshop & Yard',
    capacity_liters: 15000,
    current_stock_liters: 9255,
    fuel_type_id: 'fuel_diesel',
    min_alert_threshold: 3000,
    last_restocked_at: '2026-09-05'
  }
];

export const INITIAL_TANKER_LOGS: TankerLog[] = [
  {
    id: 'tlog_01',
    tenant_id: 'tenant_1',
    user_id: 'usr_super_admin',
    tanker_id: 'tanker_01',
    log_type: 'stock_in',
    date: '2026-09-05',
    liters: 9500,
    unit_cost: 107.00,
    source_or_vehicle: 'Meghna Petroleum Bulk Depot (Chalan #9812)',
    notes: 'Bulk stock procurement for project excavators and generators',
    previous_stock: 0,
    new_stock: 9500,
    created_at: '2026-09-05T10:00:00Z'
  },
  {
    id: 'tlog_02',
    tenant_id: 'tenant_1',
    user_id: 'usr_supervisor',
    tanker_id: 'tanker_01',
    log_type: 'dispense_out',
    date: '2026-09-08',
    liters: 245.0,
    source_or_vehicle: 'RNPP-EXC-07 (CAT 330D Excavator)',
    notes: 'Fuel entry SLIP-98894',
    previous_stock: 9500,
    new_stock: 9255,
    created_at: '2026-09-08T19:00:00Z'
  }
];
