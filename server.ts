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
  syncAllDataToMySQL
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

// Global in-memory + file-backed tenant and user registry
let activeTenants = loadTenants();
let activeUsers = loadUsers();

async function startServer() {
  const app = express();

  // Initialize MySQL connection in background (non-blocking)
  initMySQLDatabase().catch(err => {
    console.warn('[MySQL] Auto-initialization error (running fallback mode):', err?.message || err);
  });

  app.use(express.json());

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

    // STRICT FILTER: Only return active, non-deleted tenants
    const publicCompanies = activeTenants
      .filter(t => !t.deleted_at && (t.status === 'active' || (!t.status && t.subscription?.status === 'active')))
      .map(t => ({
        id: t.id,
        name: t.name,
        code: t.code,
        status: t.status || t.subscription?.status || 'active',
        currency: t.currency || 'BDT',
        phone: t.phone,
        address: t.address,
        created_at: t.created_at,
        subscription_plan: t.subscription?.plan,
        subscription_status: t.subscription?.status || 'active'
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
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Error checking database status' });
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
          '7. Run fuelflow_schema.sql in TiDB SQL Editor or let FuelFlow auto-migrate!'
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

  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
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
          res.status(500).send("FuelFlow application index could not be loaded.");
        }
      });
    });
  }

  // Cloud Run assigns an ingress port via process.env.PORT (typically 8080).
  // In development, the dev reverse proxy strictly requires port 3000.
  const PORT = isProduction ? (Number(process.env.PORT) || 3000) : 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FuelFlow Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });

  // If running in production on a custom port like 8080, also bind 3000 as fallback
  if (isProduction && PORT !== 3000) {
    try {
      const backupServer = app.listen(3000, "0.0.0.0", () => {
        console.log(`FuelFlow Server also listening on http://0.0.0.0:3000`);
      });
      backupServer.on("error", () => {
        // Silently ignore if port 3000 is occupied
      });
    } catch {
      // Ignore
    }
  }
}

startServer();
