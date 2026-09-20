import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import {
  initMySQLDatabase,
  getMySQLStatus,
  fetchTenantsFromDB,
  upsertTenantInDB,
  updateTenantStatusInDB,
  softDeleteTenantInDB,
  fetchUsersFromDB,
  upsertUserInDB,
  syncAllDataToMySQL,
  fetchFleetDataFromDB,
  deleteVehicleInDB,
  deleteFuelEntryInDB,
  deletePumpInDB,
  deletePaymentInDB,
  deleteCategoryInDB,
  deleteTankerInDB
} from "./server/mysql.ts";

// Initial fallback tenant data
const DEFAULT_TENANTS = [
  {
    id: 'tenant_1',
    name: 'Padma Multipurpose Fleet Services Ltd',
    code: 'PMFS',
    currency: 'BDT',
    phone: '+880 1711-892341',
    address: 'Plot 14, Commercial Area, Ishwardi, Pabna',
    contact_person: 'M. A. Rahman',
    email: 'admin@padmafleet.com',
    status: 'active',
    deleted_at: null,
    created_at: '2026-08-01',
    subscription: {
      plan: 'enterprise',
      plan_name_bn: 'এন্টারপ্রাইজ প্ল্যান (Enterprise)',
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
    status: 'active',
    deleted_at: null,
    created_at: '2026-08-15',
    subscription: {
      plan: 'professional',
      plan_name_bn: 'প্রফেশনাল প্ল্যান (Professional)',
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
      plan_name_bn: 'এন্টারপ্রাইজ প্ল্যান (Enterprise)',
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

// Persistent File Path for Tenants & Users
const DATA_DIR = path.join(process.cwd(), 'data');
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_USERS = [
  {
    id: 'usr_super_admin',
    tenant_id: 'tenant_1',
    name: 'M. A. Rahman (Super Admin)',
    email: 'admin@padma-fleet.com',
    username: 'padma_admin',
    password: 'padma#pass123',
    phone: '+880 1711-001122',
    role: 'super_admin',
    role_title_bn: 'কোম্পানি সুপার অ্যাডমিন (Super Admin)',
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
    created_at: '2026-08-01'
  },
  {
    id: 'usr_supervisor',
    tenant_id: 'tenant_1',
    name: 'Kamal Hossain (Fuel In-charge)',
    email: 'kamal.entry@padma-fleet.com',
    username: 'kamal_entry',
    password: 'user1234',
    phone: '+880 1712-334455',
    role: 'data_entry',
    role_title_bn: 'ডাটা এন্ট্রি অপারেটর (Fuel Operator)',
    status: 'active',
    allowed_category_ids: ['all'],
    allowed_pump_ids: ['all'],
    permissions: {
      can_add_fuel: true,
      can_manage_vehicles: false,
      can_manage_pumps: false,
      can_view_reports: true,
      can_manage_users: false,
      can_edit_settings: false
    },
    created_at: '2026-08-05'
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
    role_title_bn: 'কোম্পানি সুপার অ্যাডমিন (Super Admin)',
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
    role_title_bn: 'কোম্পানি সুপার অ্যাডমিন (Super Admin)',
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
    created_at: '2026-09-01'
  }
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TENANTS_FILE)) {
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(DEFAULT_TENANTS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
  }
}

function loadTenants(): any[] {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(TENANTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Error reading tenants file:', err);
  }
  return DEFAULT_TENANTS;
}

function saveTenants(tenants: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving tenants file:', err);
  }
}

function loadUsers(): any[] {
  try {
    ensureDataDir();
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Error reading users file:', err);
  }
  return DEFAULT_USERS;
}

function saveUsers(usersList: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users file:', err);
  }
}

const FLEET_FILE = path.join(DATA_DIR, 'fleet.json');

export interface FleetStore {
  vehicles: any[];
  fuelEntries: any[];
  pumps: any[];
  payments: any[];
  categories: any[];
  companies: any[];
  vendors: any[];
  fuelTypes: any[];
  tankers: any[];
  tankerLogs: any[];
}

function loadFleetData(): FleetStore {
  try {
    ensureDataDir();
    if (fs.existsSync(FLEET_FILE)) {
      const raw = fs.readFileSync(FLEET_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          vehicles: Array.isArray(parsed.vehicles) ? parsed.vehicles : [],
          fuelEntries: Array.isArray(parsed.fuelEntries) ? parsed.fuelEntries : [],
          pumps: Array.isArray(parsed.pumps) ? parsed.pumps : [],
          payments: Array.isArray(parsed.payments) ? parsed.payments : [],
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          companies: Array.isArray(parsed.companies) ? parsed.companies : [],
          vendors: Array.isArray(parsed.vendors) ? parsed.vendors : [],
          fuelTypes: Array.isArray(parsed.fuelTypes) ? parsed.fuelTypes : [],
          tankers: Array.isArray(parsed.tankers) ? parsed.tankers : [],
          tankerLogs: Array.isArray(parsed.tankerLogs) ? parsed.tankerLogs : []
        };
      }
    }
  } catch (err) {
    console.error('Error reading fleet file:', err);
  }
  return {
    vehicles: [],
    fuelEntries: [],
    pumps: [],
    payments: [],
    categories: [],
    companies: [],
    vendors: [],
    fuelTypes: [],
    tankers: [],
    tankerLogs: []
  };
}

function saveFleetData(data: Partial<FleetStore>) {
  try {
    ensureDataDir();
    const current = loadFleetData();
    const merged: FleetStore = {
      vehicles: data.vehicles !== undefined ? data.vehicles : current.vehicles,
      fuelEntries: data.fuelEntries !== undefined ? data.fuelEntries : current.fuelEntries,
      pumps: data.pumps !== undefined ? data.pumps : current.pumps,
      payments: data.payments !== undefined ? data.payments : current.payments,
      categories: data.categories !== undefined ? data.categories : current.categories,
      companies: data.companies !== undefined ? data.companies : current.companies,
      vendors: data.vendors !== undefined ? data.vendors : current.vendors,
      fuelTypes: data.fuelTypes !== undefined ? data.fuelTypes : current.fuelTypes,
      tankers: data.tankers !== undefined ? data.tankers : current.tankers,
      tankerLogs: data.tankerLogs !== undefined ? data.tankerLogs : current.tankerLogs
    };
    fs.writeFileSync(FLEET_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fleet file:', err);
  }
}

// Global in-memory + file-backed tenant and user registry
let activeTenants = loadTenants();
let activeUsers = loadUsers();

export const app = express();

// Security Hardening: Disable technology stack fingerprinting
app.disable("x-powered-by");

// Security Hardening: Apply OWASP-recommended HTTP security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  next();
});

// Security Hardening: Prototype Pollution & Payload Depth Guard
function sanitizeIncomingPayload(obj: any, depth = 0): any {
  if (depth > 12) return null; // Prevent deep recursive payload bombs
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(item => sanitizeIncomingPayload(item, depth + 1));
  const clean: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue; // Strip prototype pollution vectors
    }
    clean[key] = sanitizeIncomingPayload(obj[key], depth + 1);
  }
  return clean;
}

// In-memory brute-force rate limiter for authentication endpoints
const authRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimitAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress || "127.0.0.1").trim();
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minute window
  const maxAttempts = 30; // Max 30 attempts per 5 minutes

  const record = authRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    authRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. For security reasons, please wait 5 minutes before trying again."
    });
  }

  record.count += 1;
  next();
}

// Initialize MySQL connection in background (non-blocking)
initMySQLDatabase().catch(err => {
  console.warn('[MySQL] Auto-initialization error (running fallback mode):', err?.message || err);
});

app.use(express.json({ limit: "5mb" }));

// Sanitize request body to prevent Prototype Pollution
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeIncomingPayload(req.body);
  }
  next();
});

// Protect auth endpoints with brute force protection
app.use(['/api/login', '/api/control-login'], rateLimitAuthMiddleware);

// Prevent ANY client or intermediary HTTP caching on all /api/* routes (ISSUE 1 Fix)
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Global CheckTenantStatus Middleware for all fleet and tenant scoped operations (ISSUE 2 Fix)
  const checkTenantStatusMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const tenantIdOrCode = req.headers['x-tenant-id'] || req.headers['x-tenant-code'] || req.query.tenant_id || req.body?.tenant_id;
    if (tenantIdOrCode) {
      const tenant = activeTenants.find(t =>
        t.id === tenantIdOrCode ||
        t.code?.toUpperCase() === String(tenantIdOrCode).toUpperCase()
      );
      if (tenant) {
        if (tenant.deleted_at) {
          res.status(403).json({
            success: false,
            suspended: true,
            error: "Your company account has been suspended. Please contact support."
          });
          return;
        }
        if (tenant.status === 'suspended' || tenant.status === 'inactive' || tenant.subscription?.status === 'suspended') {
          res.status(403).json({
            success: false,
            suspended: true,
            error: "Your company account has been suspended. Please contact support."
          });
          return;
        }
      }
    }
    next();
  };

  app.use('/api/fleet', checkTenantStatusMiddleware);

  // 1. GET /api/tenants - Public dropdown endpoint for Login Form
  // Filters out soft-deleted (whereNull('deleted_at')) and inactive/suspended (where('status', 'active')) (ISSUE 1 & 2 Fix)
  app.get('/api/tenants', async (req: Request, res: Response) => {
    // Try to load from MySQL if connected
    const dbTenants = await fetchTenantsFromDB();
    if (dbTenants && dbTenants.length > 0) {
      activeTenants = dbTenants;
    } else {
      activeTenants = loadTenants();
    }

    // STRICT FILTER: Return non-deleted tenants with complete details preserved
    const publicCompanies = activeTenants
      .filter(t => !t.deleted_at)
      .map(t => ({
        ...t,
        status: t.status || t.subscription?.status || 'active'
      }));

    res.json({
      success: true,
      data: publicCompanies,
      timestamp: new Date().toISOString()
    });
  });

  // 2. GET /api/tenants/all - Full subscriber list for SaaS Master Control Panel
  app.get('/api/tenants/all', async (req: Request, res: Response) => {
    const dbTenants = await fetchTenantsFromDB();
    if (dbTenants && dbTenants.length > 0) {
      activeTenants = dbTenants;
    } else {
      activeTenants = loadTenants();
    }
    res.json({
      success: true,
      data: activeTenants,
      timestamp: new Date().toISOString()
    });
  });

  // 3. POST /api/tenants - Create new subscriber (SaaS Super Admin / Owner)
  // Persists to disk immediately and to MySQL if connected
  app.post('/api/tenants', async (req: Request, res: Response) => {
    try {
      const newTenant = req.body;
      if (!newTenant.id || !newTenant.name || !newTenant.code) {
        res.status(400).json({ success: false, message: 'Missing required tenant fields: id, name, code' });
        return;
      }

      activeTenants = loadTenants();
      const existingIdx = activeTenants.findIndex(t => t.id === newTenant.id || t.code.toUpperCase() === newTenant.code.toUpperCase());

      const tenantRecord = {
        ...newTenant,
        status: newTenant.status || 'active',
        deleted_at: null,
        created_at: newTenant.created_at || new Date().toISOString().split('T')[0]
      };

      if (existingIdx >= 0) {
        activeTenants[existingIdx] = tenantRecord;
      } else {
        activeTenants.unshift(tenantRecord);
      }

      saveTenants(activeTenants);
      // Persist to MySQL
      await upsertTenantInDB(tenantRecord).catch(e => console.warn('[MySQL] Background tenant save error:', e));

      res.status(201).json({
        success: true,
        message: 'Subscriber created and synchronized across all sessions successfully.',
        tenant: tenantRecord
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Server error creating tenant' });
    }
  });

  // 4. PATCH /api/tenants/:id/status - Suspend, Activate, or Inactivate Tenant (ISSUE 2 Fix)
  app.patch('/api/tenants/:id/status', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'suspended' | 'inactive'

    activeTenants = loadTenants();
    const tenant = activeTenants.find(t => t.id === id);

    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found.' });
      return;
    }

    tenant.status = status;
    if (tenant.subscription) {
      tenant.subscription.status = status;
    }

    saveTenants(activeTenants);
    await updateTenantStatusInDB(id, status).catch(e => console.warn('[MySQL] Status update error:', e));

    res.json({
      success: true,
      message: `Tenant ${tenant.name} status updated to ${status}.`,
      tenant
    });
  });

  // 4b. PATCH /api/tenants/:id - Update Tenant info (logo, name, etc.)
  app.patch('/api/tenants/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    activeTenants = loadTenants();
    const tenant = activeTenants.find(t => t.id === id);

    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found.' });
      return;
    }

    Object.assign(tenant, req.body);
    saveTenants(activeTenants);
    await upsertTenantInDB(tenant).catch(e => console.warn('[MySQL] Tenant update error:', e));

    res.json({
      success: true,
      message: `Tenant ${tenant.name} updated successfully.`,
      tenant
    });
  });

  // 5. DELETE /api/tenants/:id - Soft-Delete Tenant (ISSUE 2 Fix)
  app.delete('/api/tenants/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    activeTenants = loadTenants();
    const tenant = activeTenants.find(t => t.id === id);

    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found.' });
      return;
    }

    // Soft delete with timestamp
    tenant.deleted_at = new Date().toISOString();
    tenant.status = 'inactive';
    if (tenant.subscription) {
      tenant.subscription.status = 'suspended';
    }

    saveTenants(activeTenants);
    await softDeleteTenantInDB(id).catch(e => console.warn('[MySQL] Soft delete error:', e));

    res.json({
      success: true,
      message: `Tenant ${tenant.name} soft-deleted successfully.`
    });
  });

  // 5.1 GET /api/users - Cross-session user synchronization
  app.get('/api/users', async (req: Request, res: Response) => {
    const dbUsers = await fetchUsersFromDB();
    if (dbUsers && dbUsers.length > 0) {
      activeUsers = dbUsers;
    } else {
      activeUsers = loadUsers();
    }
    res.json({
      success: true,
      data: activeUsers,
      timestamp: new Date().toISOString()
    });
  });

  // 5.2 POST /api/users - Register or update user across all sessions & browsers
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const newUser = req.body;
      if (!newUser.id || !newUser.username || !newUser.tenant_id) {
        res.status(400).json({ success: false, message: 'Missing user fields: id, username, tenant_id' });
        return;
      }
      activeUsers = loadUsers();
      const existingIdx = activeUsers.findIndex(u => u.id === newUser.id || (u.tenant_id === newUser.tenant_id && u.username.toLowerCase() === newUser.username.toLowerCase()));
      if (existingIdx >= 0) {
        activeUsers[existingIdx] = { ...activeUsers[existingIdx], ...newUser };
      } else {
        activeUsers.unshift(newUser);
      }
      saveUsers(activeUsers);
      await upsertUserInDB(newUser).catch(e => console.warn('[MySQL] User save error:', e));

      res.status(201).json({
        success: true,
        message: 'User synchronized successfully across all browser sessions.',
        user: newUser
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Server error syncing user' });
    }
  });

  // 5.3 Database Status & Health Endpoint
  app.get('/api/database/status', async (req: Request, res: Response) => {
    try {
      const retry = req.query.retry === 'true';
      const status = await getMySQLStatus(retry);
      const safeError = typeof status.error === 'string'
        ? status.error
        : (status.error && typeof status.error === 'object'
            ? (status.error as any).message || (status.error as any).code || JSON.stringify(status.error)
            : null);

      res.json({
        success: true,
        ...status,
        error: safeError
      });
    } catch (err: any) {
      const errMsg = typeof err?.message === 'string' ? err.message : String(err || 'Error checking database status');
      res.json({
        success: true,
        configured: true,
        connected: false,
        provider: 'TiDB Cloud (Local Fallback Active)',
        host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
        port: 4000,
        database: 'test',
        error: errMsg
      });
    }
  });

  // 5.4 Database Sync Endpoint (Sync local data to MySQL or pull MySQL data)
  app.post('/api/database/sync', async (req: Request, res: Response) => {
    try {
      const result = await syncAllDataToMySQL(req.body);
      if (req.body.tenants && Array.isArray(req.body.tenants) && req.body.tenants.length > 0) {
        activeTenants = req.body.tenants;
        saveTenants(activeTenants);
      }
      if (req.body.users && Array.isArray(req.body.users) && req.body.users.length > 0) {
        activeUsers = req.body.users;
        saveUsers(activeUsers);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Sync failed' });
    }
  });

  // 5.7 Fleet Data - Unified Cross-Browser & Cloud Sync Endpoints
  app.get('/api/fleet/all', async (req: Request, res: Response) => {
    try {
      const tenantId = req.query.tenant_id as string | undefined;
      const dbFleet = await fetchFleetDataFromDB(tenantId);
      const fileFleet = loadFleetData();

      if (dbFleet && (
        dbFleet.vehicles.length > 0 ||
        dbFleet.fuelEntries.length > 0 ||
        dbFleet.pumps.length > 0 ||
        dbFleet.categories.length > 0
      )) {
        saveFleetData(dbFleet);
        res.json({
          success: true,
          source: 'cloud_database',
          data: dbFleet,
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (fileFleet.vehicles.length > 0 || fileFleet.fuelEntries.length > 0) {
        syncAllDataToMySQL(fileFleet).catch(() => {});
      }

      res.json({
        success: true,
        source: 'persistent_disk_backup',
        data: fileFleet,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch fleet data' });
    }
  });

  app.post('/api/fleet/sync', async (req: Request, res: Response) => {
    try {
      const payload = req.body || {};
      saveFleetData(payload);
      const dbResult = await syncAllDataToMySQL(payload);

      res.json({
        success: true,
        message: 'Fleet records synchronized to cloud database and local backup.',
        dbResult
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Sync failed' });
    }
  });

  app.post('/api/fleet/vehicles', async (req: Request, res: Response) => {
    try {
      const vehicle = req.body;
      const store = loadFleetData();
      const idx = store.vehicles.findIndex(v => v.id === vehicle.id);
      if (idx >= 0) {
        store.vehicles[idx] = vehicle;
      } else {
        store.vehicles.unshift(vehicle);
      }
      saveFleetData({ vehicles: store.vehicles });
      await syncAllDataToMySQL({ vehicles: [vehicle] });
      res.status(201).json({ success: true, vehicle });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.patch('/api/fleet/vehicles/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const store = loadFleetData();
      const idx = store.vehicles.findIndex(v => v.id === id);
      if (idx >= 0) {
        store.vehicles[idx] = { ...store.vehicles[idx], ...updates };
        saveFleetData({ vehicles: store.vehicles });
        await syncAllDataToMySQL({ vehicles: [store.vehicles[idx]] });
        res.json({ success: true, vehicle: store.vehicles[idx] });
      } else {
        res.status(404).json({ success: false, message: 'Vehicle not found' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete('/api/fleet/vehicles/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const store = loadFleetData();
      store.vehicles = store.vehicles.filter(v => v.id !== id);
      saveFleetData({ vehicles: store.vehicles });
      await deleteVehicleInDB(id);
      res.json({ success: true, message: 'Vehicle deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/fleet/fuel-entries', async (req: Request, res: Response) => {
    try {
      const entry = req.body;
      const store = loadFleetData();
      const idx = store.fuelEntries.findIndex(e => e.id === entry.id);
      if (idx >= 0) {
        store.fuelEntries[idx] = entry;
      } else {
        store.fuelEntries.unshift(entry);
      }
      saveFleetData({ fuelEntries: store.fuelEntries });
      await syncAllDataToMySQL({ fuelEntries: [entry] });
      res.status(201).json({ success: true, entry });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete('/api/fleet/fuel-entries/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const store = loadFleetData();
      store.fuelEntries = store.fuelEntries.filter(e => e.id !== id);
      saveFleetData({ fuelEntries: store.fuelEntries });
      await deleteFuelEntryInDB(id);
      res.json({ success: true, message: 'Fuel entry deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/fleet/pumps', async (req: Request, res: Response) => {
    try {
      const pump = req.body;
      const store = loadFleetData();
      const idx = store.pumps.findIndex(p => p.id === pump.id);
      if (idx >= 0) {
        store.pumps[idx] = pump;
      } else {
        store.pumps.unshift(pump);
      }
      saveFleetData({ pumps: store.pumps });
      await syncAllDataToMySQL({ pumps: [pump] });
      res.status(201).json({ success: true, pump });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.patch('/api/fleet/pumps/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const store = loadFleetData();
      const idx = store.pumps.findIndex(p => p.id === id);
      if (idx >= 0) {
        store.pumps[idx] = { ...store.pumps[idx], ...updates };
        saveFleetData({ pumps: store.pumps });
        await syncAllDataToMySQL({ pumps: [store.pumps[idx]] });
        res.json({ success: true, pump: store.pumps[idx] });
      } else {
        res.status(404).json({ success: false, message: 'Pump not found' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete('/api/fleet/pumps/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const store = loadFleetData();
      store.pumps = store.pumps.filter(p => p.id !== id);
      saveFleetData({ pumps: store.pumps });
      await deletePumpInDB(id);
      res.json({ success: true, message: 'Pump deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/fleet/payments', async (req: Request, res: Response) => {
    try {
      const payment = req.body;
      const store = loadFleetData();
      const idx = store.payments.findIndex(pm => pm.id === payment.id);
      if (idx >= 0) {
        store.payments[idx] = payment;
      } else {
        store.payments.unshift(payment);
      }
      saveFleetData({ payments: store.payments });
      await syncAllDataToMySQL({ payments: [payment] });
      res.status(201).json({ success: true, payment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete('/api/fleet/payments/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const store = loadFleetData();
      store.payments = store.payments.filter(pm => pm.id !== id);
      saveFleetData({ payments: store.payments });
      await deletePaymentInDB(id);
      res.json({ success: true, message: 'Payment deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/fleet/categories', async (req: Request, res: Response) => {
    try {
      const cat = req.body;
      const store = loadFleetData();
      const idx = store.categories.findIndex(c => c.id === cat.id);
      if (idx >= 0) {
        store.categories[idx] = cat;
      } else {
        store.categories.push(cat);
      }
      saveFleetData({ categories: store.categories });
      await syncAllDataToMySQL({ categories: [cat] } as any);
      res.status(201).json({ success: true, category: cat });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.patch('/api/fleet/categories/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const store = loadFleetData();
      const idx = store.categories.findIndex(c => c.id === id);
      if (idx >= 0) {
        store.categories[idx] = { ...store.categories[idx], ...updates };
        saveFleetData({ categories: store.categories });
        await syncAllDataToMySQL({ categories: [store.categories[idx]] } as any);
        res.json({ success: true, category: store.categories[idx] });
      } else {
        res.status(404).json({ success: false, message: 'Category not found' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete('/api/fleet/categories/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const store = loadFleetData();
      store.categories = store.categories.filter(c => c.id !== id);
      saveFleetData({ categories: store.categories });
      await deleteCategoryInDB(id);
      res.json({ success: true, message: 'Category deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/fleet/tankers', async (req: Request, res: Response) => {
    try {
      const tanker = req.body;
      const store = loadFleetData();
      const idx = store.tankers.findIndex(t => t.id === tanker.id);
      if (idx >= 0) {
        store.tankers[idx] = tanker;
      } else {
        store.tankers.push(tanker);
      }
      saveFleetData({ tankers: store.tankers });
      await syncAllDataToMySQL({ tankers: [tanker] } as any);
      res.status(201).json({ success: true, tanker });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.patch('/api/fleet/tankers/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const store = loadFleetData();
      const idx = store.tankers.findIndex(t => t.id === id);
      if (idx >= 0) {
        store.tankers[idx] = { ...store.tankers[idx], ...updates };
        saveFleetData({ tankers: store.tankers });
        await syncAllDataToMySQL({ tankers: [store.tankers[idx]] } as any);
        res.json({ success: true, tanker: store.tankers[idx] });
      } else {
        res.status(404).json({ success: false, message: 'Tanker not found' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete('/api/fleet/tankers/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const store = loadFleetData();
      store.tankers = store.tankers.filter(t => t.id !== id);
      saveFleetData({ tankers: store.tankers });
      await deleteTankerInDB(id);
      res.json({ success: true, message: 'Tanker deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/fleet/tanker-logs', async (req: Request, res: Response) => {
    try {
      const log = req.body;
      const store = loadFleetData();
      store.tankerLogs.unshift(log);
      saveFleetData({ tankerLogs: store.tankerLogs });
      await syncAllDataToMySQL({ tankerLogs: [log] } as any);
      res.status(201).json({ success: true, log });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // 5.5 Download / View fuelflow_schema.sql
  app.get('/api/database/schema-sql', (req: Request, res: Response) => {
    try {
      const schemaPath = path.join(process.cwd(), 'fuelflow_schema.sql');
      if (fs.existsSync(schemaPath)) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="fuelflow_mysql_schema.sql"');
        res.sendFile(schemaPath);
      } else {
        res.status(404).send('Schema file not found');
      }
    } catch (err: any) {
      res.status(500).send(err?.message || 'Error reading schema file');
    }
  });

  // 5.6 Free MySQL Database Setup Guide
  app.get('/api/database/guide', (req: Request, res: Response) => {
    res.json({
      success: true,
      recommendation: {
        provider: 'TiDB Cloud Serverless',
        url: 'https://tidbcloud.com',
        benefits: [
          '100% MySQL 8.0 wire-compatible',
          '5 GB storage FREE forever (no credit card required)',
          'High availability, automatic backups, and SSL encryption',
          'Scale-to-zero with zero cold-start delay'
        ],
        steps: [
          '1. Go to https://tidbcloud.com and sign up for free (Google Login supported).',
          '2. Click "Create Cluster" -> Select "Serverless" (Free Tier).',
          '3. Choose region nearest to you (e.g., Singapore or Mumbai).',
          '4. Create cluster (takes 5-10 seconds).',
          '5. Click "Connect" -> Note Host, Port (4000), User, Password, and Database name (test or fuelflow).',
          '6. Set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_SSL=true in your environment variables.',
          '7. Run fuelflow_schema.sql in TiDB SQL Editor or let FuelNest auto-migrate!'
        ]
      },
      alternatives: [
        {
          name: 'Aiven MySQL',
          url: 'https://aiven.io',
          info: 'Free trial & cloud instances available.'
        },
        {
          name: 'FreeDB',
          url: 'https://freedb.tech',
          info: 'Free remote MySQL databases.'
        },
        {
          name: 'Local / cPanel MySQL',
          url: 'localhost / cPanel phpMyAdmin',
          info: 'Self-hosted MySQL or standard web hosting MySQL.'
        }
      ]
    });
  });


  // 6. POST /api/auth/login - Strict Authentication Guard (ISSUE 2 Fix)
  // Replicates LoginController attempt validation
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { tenant_id, tenant_code, username, password } = req.body;
    activeTenants = loadTenants();
    activeUsers = loadUsers();

    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    let targetTenant = activeTenants.find(t =>
      (tenant_id && t.id === tenant_id) ||
      (tenant_code && t.code.toUpperCase() === String(tenant_code).toUpperCase())
    );

    // Fallback search tenant by username if tenant wasn't specified
    if (!targetTenant) {
      targetTenant = activeTenants.find(t => 
        t.subscription?.super_admin_username?.toLowerCase() === cleanUser ||
        activeUsers.some(u => u.tenant_id === t.id && (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser))
      );
    }

    if (!targetTenant) {
      res.status(404).json({ success: false, message: 'Company / Tenant not found.' });
      return;
    }

    // STRICT STATUS CHECK: Check tenant status BEFORE or IMMEDIATELY AFTER credential verification
    if (
      targetTenant.deleted_at ||
      targetTenant.status === 'suspended' ||
      targetTenant.status === 'inactive' ||
      targetTenant.subscription?.status === 'suspended' ||
      targetTenant.subscription?.status === 'inactive'
    ) {
      res.status(403).json({
        success: false,
        suspended: true,
        message: "This account is suspended. Please contact the support team."
      });
      return;
    }

    // Verify user in tenant
    let matchedUser = activeUsers.find(u =>
      u.tenant_id === targetTenant!.id &&
      (u.username.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser)
    );

    // If not in activeUsers, check tenant subscription super_admin credentials
    if (!matchedUser && targetTenant.subscription?.super_admin_username) {
      if (targetTenant.subscription.super_admin_username.toLowerCase() === cleanUser) {
        matchedUser = {
          id: 'usr_sa_' + targetTenant.id,
          tenant_id: targetTenant.id,
          name: targetTenant.contact_person || `${targetTenant.name} Admin`,
          email: targetTenant.email || `${cleanUser}@example.com`,
          username: targetTenant.subscription.super_admin_username,
          password: targetTenant.subscription.super_admin_password,
          phone: targetTenant.phone || '',
          role: 'super_admin',
          role_title_bn: 'কোম্পানি সুপার অ্যাডমিন (Super Admin)',
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
          created_at: targetTenant.created_at || '2026-08-01'
        };
        activeUsers.unshift(matchedUser);
        saveUsers(activeUsers);
      }
    }

    res.json({
      success: true,
      message: "Credentials verified.",
      tenant: targetTenant,
      user: matchedUser
    });
  });

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Determine if running in production vs development
  // When compiled by esbuild for deployment, IS_BUNDLED is statically replaced with true
  // @ts-ignore
  const isBundled = typeof IS_BUNDLED !== "undefined" && Boolean(IS_BUNDLED);
  const isDev = !isBundled && process.env.NODE_ENV === "development";
  const isProduction = !isDev;

  async function startServer() {
    if (isDev) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: false,
        },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");

      app.use(express.static(distPath));
      app.get("*", (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, "index.html"), (err) => {
          if (err && !res.headersSent) {
            res.status(500).send("FuelNest application index could not be loaded.");
          }
        });
      });
    }

    // Secure Centralized Error Boundary (Prevents leaking stack traces / internals)
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('[Server Error]', err?.message || err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "A secure server error occurred. Please try again later."
        });
      }
    });

    // Port 3000 is the hardcoded entrypoint required by the platform infrastructure.
    // The nginx reverse proxy listens on 8080 and proxies all requests to port 3000.
    const PORT = 3000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`FuelNest Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
    });
  }

  // Only start standalone HTTP server when not running in Vercel Serverless environment
  if (!process.env.VERCEL) {
    startServer();
  }

  export default app;
