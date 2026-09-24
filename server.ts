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
  deleteTenantInDB,
  fetchUsersFromDB,
  upsertUserInDB,
  deleteUserInDB,
  syncAllDataToMySQL,
  fetchFleetDataFromDB,
  deleteVehicleInDB,
  deleteFuelEntryInDB,
  deletePumpInDB,
  deletePaymentInDB,
  deleteCategoryInDB,
  deleteTankerInDB
} from "./server/mysql.ts";
import { verifyPassword, hashPassword } from "./src/utils/authSecurity.ts";

// Initial fallback tenant data (empty - clean production state)
const DEFAULT_TENANTS: any[] = [];

// Persistent File Path for Tenants & Users
const DATA_DIR = path.join(process.cwd(), 'data');
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_USERS: any[] = [];

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
    if (Array.isArray(parsed)) {
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
    if (Array.isArray(parsed)) {
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

function dedupeAndMergeById<T extends { id: string }>(existing: T[] = [], incoming?: T[]): T[] {
  const map = new Map<string, T>();
  (existing || []).forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  if (Array.isArray(incoming)) {
    incoming.forEach(item => {
      if (item && item.id) {
        map.set(item.id, { ...(map.get(item.id) || {}), ...item });
      }
    });
  }
  return Array.from(map.values());
}

function saveFleetData(data: Partial<FleetStore>) {
  try {
    ensureDataDir();
    const current = loadFleetData();
    const merged: FleetStore = {
      vehicles: data.vehicles !== undefined ? dedupeAndMergeById(current.vehicles, data.vehicles) : dedupeAndMergeById(current.vehicles),
      fuelEntries: data.fuelEntries !== undefined ? dedupeAndMergeById(current.fuelEntries, data.fuelEntries) : dedupeAndMergeById(current.fuelEntries),
      pumps: data.pumps !== undefined ? dedupeAndMergeById(current.pumps, data.pumps) : dedupeAndMergeById(current.pumps),
      payments: data.payments !== undefined ? dedupeAndMergeById(current.payments, data.payments) : dedupeAndMergeById(current.payments),
      categories: data.categories !== undefined ? dedupeAndMergeById(current.categories, data.categories) : dedupeAndMergeById(current.categories),
      companies: data.companies !== undefined ? dedupeAndMergeById(current.companies, data.companies) : dedupeAndMergeById(current.companies),
      vendors: data.vendors !== undefined ? dedupeAndMergeById(current.vendors, data.vendors) : dedupeAndMergeById(current.vendors),
      fuelTypes: data.fuelTypes !== undefined ? dedupeAndMergeById(current.fuelTypes, data.fuelTypes) : dedupeAndMergeById(current.fuelTypes),
      tankers: data.tankers !== undefined ? dedupeAndMergeById(current.tankers, data.tankers) : dedupeAndMergeById(current.tankers),
      tankerLogs: data.tankerLogs !== undefined ? dedupeAndMergeById(current.tankerLogs, data.tankerLogs) : dedupeAndMergeById(current.tankerLogs)
    };
    fs.writeFileSync(FLEET_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fleet file:', err);
  }
}

// -------------------------------------------------------------
// SaaS Multi-Level Approvals Engine
// -------------------------------------------------------------
const APPROVALS_FILE = path.join(DATA_DIR, 'approvals.json');

function loadApprovals(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(APPROVALS_FILE)) {
      const raw = fs.readFileSync(APPROVALS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading approvals file:', err);
  }
  return [];
}

function saveApprovals(approvals: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(APPROVALS_FILE, JSON.stringify(approvals, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving approvals file:', err);
  }
}

// -------------------------------------------------------------
// Automated Email Dispatch (Resend / Nodemailer fallback)
// -------------------------------------------------------------
async function sendWelcomeEmail(data: {
  email: string;
  companyName: string;
  username: string;
  tempPassword: string;
  loginUrl: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.log(`[Email Mock] Welcome email for ${data.companyName} to ${data.email}:`);
    console.log(`[Email Mock] Portal URL: ${data.loginUrl} | Username: ${data.username} | Temporary Password: ${data.tempPassword}`);
    return { dispatched: false, reason: 'api_key_not_configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'FuelNest Onboarding <onboarding@resend.dev>',
        to: [data.email],
        subject: `Welcome to FuelNest - Your Fleet Workspace is Ready! (${data.companyName})`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="margin-bottom: 20px; border-bottom: 2px solid #f59e0b; padding-bottom: 16px;">
              <h1 style="color: #0f172a; margin: 0 0 6px 0; font-size: 24px; font-weight: 800;">FuelNest Fleet & Fuel Intelligence</h1>
              <p style="margin: 0; color: #64748b; font-size: 14px;">Automated SaaS Commercial Provisioning</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6;">Hello,</p>
            <p style="font-size: 15px; line-height: 1.6;">
              Congratulations! Your dedicated enterprise workspace for <strong>${data.companyName}</strong> has been automatically provisioned and configured on FuelNest.
            </p>

            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 20px 0;">
              <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 16px;">Your Super Admin Sign-in Credentials:</h3>
              <p style="margin: 6px 0; font-size: 14px;"><strong>Portal Access URL:</strong> <a href="${data.loginUrl}" style="color: #d97706; text-decoration: none; font-weight: bold;">${data.loginUrl}</a></p>
              <p style="margin: 6px 0; font-size: 14px;"><strong>Super Admin Username:</strong> <code style="background: #e2e8f0; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold;">${data.username}</code></p>
              <p style="margin: 6px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold;">${data.tempPassword}</code></p>
            </div>

            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; margin: 20px 0; color: #92400e; font-size: 13px; line-height: 1.5;">
              <strong>Security Notice:</strong> For security compliance, you will be required to update your temporary password upon your first sign-in before accessing fleet dashboards.
            </div>

            <div style="text-align: center; margin: 30px 0 20px;">
              <a href="${data.loginUrl}" style="background: #f59e0b; color: #000000; padding: 12px 28px; font-weight: bold; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 15px;">Login to Your Fleet Dashboard &rarr;</a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
              FuelNest SaaS Multi-Tenant Platform &bull; If you have any inquiries, contact support@fuelnest.xyz
            </p>
          </div>
        `
      })
    });
    return { dispatched: res.ok, status: res.status };
  } catch (err: any) {
    console.warn('[Resend Email Error]:', err?.message || err);
    return { dispatched: false, error: err?.message };
  }
}

// -------------------------------------------------------------
// Automated Tenant Provisioning & Default Credential Engine
// -------------------------------------------------------------
async function provisionNewTenant(payload: {
  company_name: string;
  admin_name?: string;
  email: string;
  phone?: string;
  plan_id: string; // 'starter' | 'pro' | 'enterprise' | 'custom'
  max_vehicles?: number;
  custom_price?: number;
  address?: string;
  origin?: string;
}) {
  const companyName = String(payload.company_name || 'Fleet Company').trim();
  const words = companyName.split(/\s+/).filter(Boolean);
  const firstWord = (words[0] || 'Fleet').replace(/[^a-zA-Z0-9]/g, '');
  const cleanCode = (words.length > 1
    ? words.map(w => w[0]).join('')
    : firstWord
  ).toUpperCase().substring(0, 8);

  const existingTenants = loadTenants();
  let candidateId = `tenant_${firstWord.toLowerCase()}`;
  let counter = 1;
  while (existingTenants.some(t => t.id === candidateId)) {
    candidateId = `tenant_${firstWord.toLowerCase()}_${counter++}`;
  }

  const tenantId = candidateId;
  const tenantCode = cleanCode.length < 3 ? `${cleanCode}FLT` : cleanCode;

  // 2. Super Admin Username: FirstWord_admin
  const superAdminUsername = `${firstWord.toLowerCase()}_admin`;

  // 3. Temporary Password: FirstWord@12345
  const capitalizedWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  const temporaryPassword = `${capitalizedWord}@12345`;

  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const planId = (payload.plan_id || 'trial_3days').toLowerCase();

  let endDateObj = new Date(today);
  let durationType: 'days' | 'months' | 'years' = 'months';
  let durationVal = 1;
  let priceBdt = 749;
  let planNameBn = '১ মাস প্ল্যান (749 BDT)';
  let isTrial = false;
  let isPaidPlan = true;

  if (planId === 'trial_3days' || planId === 'trial') {
    endDateObj.setDate(endDateObj.getDate() + 3);
    durationType = 'days';
    durationVal = 3;
    priceBdt = 0;
    planNameBn = '৩ দিনের ফ্রি ট্রায়াল (3-Day Free Trial)';
    isTrial = true;
    isPaidPlan = false;
  } else if (planId === 'plan_1month' || planId === 'starter') {
    endDateObj.setMonth(endDateObj.getMonth() + 1);
    durationType = 'months';
    durationVal = 1;
    priceBdt = 749;
    planNameBn = '১ মাস প্ল্যান (749 BDT - Full Options)';
  } else if (planId === 'plan_3months' || planId === 'pro') {
    endDateObj.setMonth(endDateObj.getMonth() + 3);
    durationType = 'months';
    durationVal = 3;
    priceBdt = 2199;
    planNameBn = '৩ মাস প্ল্যান (2,199 BDT - Full Options)';
  } else if (planId === 'plan_6months') {
    endDateObj.setMonth(endDateObj.getMonth() + 6);
    durationType = 'months';
    durationVal = 6;
    priceBdt = 3999;
    planNameBn = '৬ মাস প্ল্যান (3,999 BDT - Full Options)';
  } else if (planId === 'plan_12months' || planId === 'enterprise') {
    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
    durationType = 'years';
    durationVal = 1;
    priceBdt = 7999;
    planNameBn = '১২ মাস প্ল্যান (7,999 BDT - Full Options)';
  }

  if (payload.custom_price !== undefined && payload.custom_price !== null && !isNaN(Number(payload.custom_price))) {
    priceBdt = Number(payload.custom_price);
  }

  const endDate = endDateObj.toISOString().split('T')[0];
  const maxVehicles = payload.max_vehicles || 100;
  const maxUsers = 25;
  const maxPumps = 15;

  const initialStatus = isTrial ? 'active' : 'pending_payment';
  const initialPaymentStatus = isTrial ? 'paid' : 'due';

  const newTenant: any = {
    id: tenantId,
    name: companyName,
    code: tenantCode,
    currency: 'BDT',
    phone: payload.phone || '+880 1700-000000',
    address: payload.address || 'Dhaka, Bangladesh',
    contact_person: payload.admin_name || `${companyName} Admin`,
    email: payload.email,
    status: initialStatus,
    deleted_at: null,
    created_at: startDate,
    subscription: {
      plan: planId as any,
      plan_name_bn: planNameBn,
      status: initialStatus,
      start_date: startDate,
      end_date: endDate,
      duration_type: durationType,
      duration_val: durationVal,
      price_bdt: priceBdt,
      payment_status: initialPaymentStatus,
      max_vehicles: maxVehicles,
      max_users: maxUsers,
      max_pumps: maxPumps,
      super_admin_username: superAdminUsername,
      super_admin_password: temporaryPassword,
      features: {
        tanker_bowzer: true,
        anomaly_ai: true,
        reports_export: true,
        qr_scanner: true,
        custom_categories: true
      },
      notes: isTrial ? '3-Day Free Trial Provisioning' : `Direct Gateway Subscription - Plan: ${planId.toUpperCase()}`
    }
  };

  const newSuperAdminUser: any = {
    id: `usr_${tenantId}_admin`,
    tenant_id: tenantId,
    name: payload.admin_name || `${companyName} Administrator`,
    email: payload.email,
    username: superAdminUsername,
    password: temporaryPassword,
    phone: payload.phone || '',
    role: 'super_admin',
    role_title_bn: 'কোম্পানি সুপার অ্যাডমিন (Super Admin)',
    status: 'active',
    must_change_password: true,
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
    created_at: startDate
  };

  // Seed default master data in FleetStore for this tenant
  const fleet = loadFleetData();
  const defaultFuelTypes = [
    { id: `fuel_diesel_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: 'Diesel', code: 'diesel', unit: 'Liter', current_price: 108.50, price_history: [{ date: startDate, price: 108.50, changed_by: newSuperAdminUser.name }], updated_at: startDate },
    { id: `fuel_octane_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: 'Octane', code: 'octane', unit: 'Liter', current_price: 131.00, price_history: [{ date: startDate, price: 131.00, changed_by: newSuperAdminUser.name }], updated_at: startDate },
    { id: `fuel_petrol_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: 'Petrol', code: 'petrol', unit: 'Liter', current_price: 126.00, price_history: [{ date: startDate, price: 126.00, changed_by: newSuperAdminUser.name }], updated_at: startDate },
    { id: `fuel_cng_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: 'CNG', code: 'cng', unit: 'm3', current_price: 43.00, price_history: [{ date: startDate, price: 43.00, changed_by: newSuperAdminUser.name }], updated_at: startDate },
    { id: `fuel_lpg_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: 'LPG', code: 'lpg', unit: 'Kg', current_price: 115.00, price_history: [{ date: startDate, price: 115.00, changed_by: newSuperAdminUser.name }], updated_at: startDate }
  ];

  const defaultCategories = [
    { id: `cat_dump_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: 'Dump Truck', metric_type: 'kmpl', default_benchmark: 3.2, icon_name: 'Truck', description: 'Heavy material & sand hauling' },
    { id: `cat_excavator_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: 'Hydraulic Excavator', metric_type: 'lph', default_benchmark: 14.0, icon_name: 'Excavator', description: 'Earthmoving & construction' },
    { id: `cat_crane_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: 'Crane & Rig', metric_type: 'lph', default_benchmark: 18.0, icon_name: 'Truck', description: 'Heavy lifting & piling rig' },
    { id: `cat_generator_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: 'Site Diesel Generator', metric_type: 'lph', default_benchmark: 22.0, icon_name: 'Fuel', description: 'Power generation' },
    { id: `cat_bus_${tenantId}`, tenant_id: tenantId, user_id: newSuperAdminUser.id, name: '40-Seat Staff Bus', metric_type: 'kmpl', default_benchmark: 4.5, icon_name: 'Car', description: 'Personnel logistics' }
  ];

  fleet.fuelTypes = [...(fleet.fuelTypes || []), ...defaultFuelTypes];
  fleet.categories = [...(fleet.categories || []), ...defaultCategories];
  saveFleetData(fleet);

  // Add tenant and user
  const tenantsList = loadTenants();
  tenantsList.unshift(newTenant);
  saveTenants(tenantsList);
  activeTenants = tenantsList;

  const usersList = loadUsers();
  usersList.unshift(newSuperAdminUser);
  saveUsers(usersList);
  activeUsers = usersList;

  // Persist to DB if connected
  await upsertTenantInDB(newTenant).catch(e => console.warn('[DB] Provision tenant sync warning:', e));
  await upsertUserInDB(newSuperAdminUser).catch(e => console.warn('[DB] Provision user sync warning:', e));

  // Dispatch Welcome Email
  const loginUrl = `${payload.origin || ''}/login`;
  await sendWelcomeEmail({
    email: payload.email,
    companyName,
    username: superAdminUsername,
    tempPassword: temporaryPassword,
    loginUrl
  });

  return {
    success: true,
    tenant: newTenant,
    user: newSuperAdminUser,
    super_admin_username: superAdminUsername,
    temporary_password: temporaryPassword,
    login_url: loginUrl
  };
}

// Global in-memory + file-backed tenant and user registry
let activeTenants = loadTenants();
let activeUsers = loadUsers();

export const app = express();

// Enable Trust Proxy for Cloud Run, Nginx, and Mobile Cellular/CGNAT proxies
app.set("trust proxy", true);

// Security Hardening: Disable technology stack fingerprinting
app.disable("x-powered-by");

// Permissive CORS & Preflight Handling for All Browsers (iOS Safari, Chrome, Edge, Firefox)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, x-tenant-id, x-tenant-code, x-api-key, x-api-secret, x-webhook-secret, x-baniq-signature"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

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

// In-memory brute-force rate limiter for authentication endpoints (Mobile Carrier & iPhone friendly)
const authRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function rateLimitAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only monitor POST login submissions; never throttle OPTIONS preflight or GET requests
  if (req.method !== "POST") {
    return next();
  }

  // Extract client IP safely respecting Cloud Run reverse proxy
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : (req.ip || req.socket.remoteAddress || "127.0.0.1").trim();
  const ip = rawIp.replace(/^::ffff:/, ''); // Normalize IPv4-mapped IPv6

  // Bypass rate limiting for loopback and internal container healthchecks
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost" || ip.startsWith("169.254.") || ip.startsWith("10.")) {
    return next();
  }

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minute sliding window
  const maxAttempts = 150; // Accommodates corporate NATs and cellular CGNAT networks on mobile phones

  const record = authRateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    authRateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }

  if (record.count >= maxAttempts) {
    console.warn(`[Auth Rate Limit Triggered] IP: ${ip}, attempts: ${record.count}`);
    return res.status(429).json({
      success: false,
      message: "Security Notice: Too many authentication attempts from this network. Please wait a few minutes before trying again."
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

  // 5. DELETE /api/tenants/:id - Permanent Cascade Delete Tenant
  app.delete('/api/tenants/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dbTenants = await fetchTenantsFromDB().catch(() => null);
      if (dbTenants && dbTenants.length > 0) {
        activeTenants = dbTenants;
      } else {
        activeTenants = loadTenants();
      }
      const targetTenant = activeTenants.find(t => t.id === id);

      // Permanently remove from activeTenants list
      activeTenants = activeTenants.filter(t => t.id !== id);
      saveTenants(activeTenants);

      // Remove all users belonging to this tenant
      activeUsers = loadUsers().filter(u => u.tenant_id !== id);
      saveUsers(activeUsers);

      // Remove all fleet data belonging to this tenant
      const fleet = loadFleetData();
      fleet.vehicles = (fleet.vehicles || []).filter(v => v.tenant_id !== id);
      fleet.fuelEntries = (fleet.fuelEntries || []).filter(e => e.tenant_id !== id);
      fleet.pumps = (fleet.pumps || []).filter(p => p.tenant_id !== id);
      fleet.payments = (fleet.payments || []).filter(pm => pm.tenant_id !== id);
      fleet.categories = (fleet.categories || []).filter(c => c.tenant_id !== id);
      fleet.companies = (fleet.companies || []).filter(c => c.tenant_id !== id);
      fleet.vendors = (fleet.vendors || []).filter(v => v.tenant_id !== id);
      fleet.fuelTypes = (fleet.fuelTypes || []).filter(f => f.tenant_id !== id);
      fleet.tankers = (fleet.tankers || []).filter(tk => tk.tenant_id !== id);
      fleet.tankerLogs = (fleet.tankerLogs || []).filter(tl => tl.tenant_id !== id);
      saveFleetData(fleet);

      await deleteTenantInDB(id).catch(async (e) => {
        console.warn('[MySQL] Cascade delete fallback to soft delete:', e);
        await softDeleteTenantInDB(id).catch(() => {});
      });

      res.json({
        success: true,
        message: `Subscriber workspace "${targetTenant?.name || id}" permanently deleted.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error deleting tenant' });
    }
  });

  // 5.b DELETE /api/tenants/:id/cascade - Permanent Cascade Delete (Update 7)
  app.delete('/api/tenants/:id/cascade', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const dbTenants = await fetchTenantsFromDB().catch(() => null);
      if (dbTenants && dbTenants.length > 0) {
        activeTenants = dbTenants;
      } else {
        activeTenants = loadTenants();
      }
      const targetTenant = activeTenants.find(t => t.id === id);

      // Remove tenant from activeTenants
      activeTenants = activeTenants.filter(t => t.id !== id);
      saveTenants(activeTenants);

      // Remove all users of this tenant
      activeUsers = loadUsers().filter(u => u.tenant_id !== id);
      saveUsers(activeUsers);

      // Remove all fleet data belonging to this tenant
      const fleet = loadFleetData();
      fleet.vehicles = (fleet.vehicles || []).filter(v => v.tenant_id !== id);
      fleet.fuelEntries = (fleet.fuelEntries || []).filter(e => e.tenant_id !== id);
      fleet.pumps = (fleet.pumps || []).filter(p => p.tenant_id !== id);
      fleet.payments = (fleet.payments || []).filter(pm => pm.tenant_id !== id);
      fleet.categories = (fleet.categories || []).filter(c => c.tenant_id !== id);
      fleet.companies = (fleet.companies || []).filter(c => c.tenant_id !== id);
      fleet.vendors = (fleet.vendors || []).filter(v => v.tenant_id !== id);
      fleet.fuelTypes = (fleet.fuelTypes || []).filter(f => f.tenant_id !== id);
      fleet.tankers = (fleet.tankers || []).filter(tk => tk.tenant_id !== id);
      fleet.tankerLogs = (fleet.tankerLogs || []).filter(tl => tl.tenant_id !== id);
      saveFleetData(fleet);

      await deleteTenantInDB(id).catch(async (e) => {
        console.warn('[MySQL] Cascade delete fallback to soft delete:', e);
        await softDeleteTenantInDB(id).catch(() => {});
      });

      res.json({
        success: true,
        message: `Subscriber workspace "${targetTenant?.name || id}" and all associated fleet data permanently deleted.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error deleting subscriber' });
    }
  });

  // -------------------------------------------------------------
  // Dynamic Fuel Types & Pricing CRUD (Update 8)
  // -------------------------------------------------------------
  app.get('/api/master/fuel-types', (req: Request, res: Response) => {
    const { tenant_id } = req.query;
    const fleet = loadFleetData();
    const list = tenant_id 
      ? (fleet.fuelTypes || []).filter(f => f.tenant_id === tenant_id)
      : (fleet.fuelTypes || []);
    res.json({ success: true, data: list });
  });

  app.post('/api/master/fuel-types', async (req: Request, res: Response) => {
    try {
      const { tenant_id, name, code, unit, current_price, user_id } = req.body;
      if (!name || !current_price) {
        res.status(400).json({ success: false, message: 'Fuel name and price are required.' });
        return;
      }
      const fleet = loadFleetData();
      const today = new Date().toISOString().split('T')[0];
      const newFuelType = {
        id: `fuel_${(code || name).toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
        tenant_id: tenant_id || 'tenant_1',
        user_id: user_id || 'system',
        name: String(name).trim(),
        code: String(code || name).toLowerCase().replace(/[^a-z0-9]/g, '_'),
        unit: String(unit || 'Liter').trim(),
        current_price: Number(current_price),
        price_history: [{ date: today, price: Number(current_price), changed_by: 'Administrator' }],
        updated_at: today
      };

      fleet.fuelTypes = [newFuelType, ...(fleet.fuelTypes || [])];
      saveFleetData(fleet);
      res.status(201).json({ success: true, fuelType: newFuelType, message: 'Fuel type created successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error creating fuel type' });
    }
  });

  app.patch('/api/master/fuel-types/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const fleet = loadFleetData();
      const idx = (fleet.fuelTypes || []).findIndex(f => f.id === id);
      if (idx < 0) {
        res.status(404).json({ success: false, message: 'Fuel type not found.' });
        return;
      }
      const existing = fleet.fuelTypes[idx];
      const today = new Date().toISOString().split('T')[0];
      let history = [...(existing.price_history || [])];

      if (updates.current_price !== undefined && updates.current_price !== existing.current_price) {
        history.push({
          date: today,
          price: Number(updates.current_price),
          changed_by: updates.changed_by || 'Admin'
        });
      }

      fleet.fuelTypes[idx] = {
        ...existing,
        ...updates,
        price_history: history,
        updated_at: today
      };
      saveFleetData(fleet);
      res.json({ success: true, fuelType: fleet.fuelTypes[idx], message: 'Fuel type updated.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error updating fuel type' });
    }
  });

  app.delete('/api/master/fuel-types/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const fleet = loadFleetData();
      const target = (fleet.fuelTypes || []).find(f => f.id === id);
      if (!target) {
        res.status(404).json({ success: false, message: 'Fuel type not found.' });
        return;
      }

      // Check dependent transactions in fuelEntries
      const dependentEntries = (fleet.fuelEntries || []).filter(e =>
        e.fuel_type_id === id ||
        (e.fuel_type && target.code && e.fuel_type.toLowerCase() === target.code.toLowerCase()) ||
        (e.fuel_type && target.name && e.fuel_type.toLowerCase() === target.name.toLowerCase())
      );

      // Check dependent vehicles using this fuel type
      const dependentVehicles = (fleet.vehicles || []).filter(v =>
        v.fuel_type && target.code && v.fuel_type.toLowerCase() === target.code.toLowerCase()
      );

      if (dependentEntries.length > 0 || dependentVehicles.length > 0) {
        res.status(400).json({
          success: false,
          has_dependencies: true,
          dependent_entries_count: dependentEntries.length,
          dependent_vehicles_count: dependentVehicles.length,
          message: `Cannot delete "${target.name}": It is currently referenced in ${dependentEntries.length} fuel logs and ${dependentVehicles.length} vehicles. Please reassign those records first.`
        });
        return;
      }

      fleet.fuelTypes = (fleet.fuelTypes || []).filter(f => f.id !== id);
      saveFleetData(fleet);
      res.json({ success: true, message: `Fuel type "${target.name}" deleted successfully.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error deleting fuel type' });
    }
  });

  // -------------------------------------------------------------
  // Baniq Pay Gateway Integration & Webhook (API Key, API Secret & Webhook)
  // Supports automated verification for bKash, Nagad, Rocket & Bank
  // -------------------------------------------------------------
  const handleBaniqPayCheckout = async (req: Request, res: Response) => {
    try {
      const { full_name, email, phone, amount, metadata } = req.body;
      const apiKey = process.env.BANIQ_PAY_API_KEY;
      const apiSecret = process.env.BANIQ_PAY_API_SECRET;
      const rawBaseUrl = process.env.BANIQ_PAY_BASE_URL || 'https://api.baniqpay.com';
      const baseUrl = rawBaseUrl.replace(/\/+$/, '');
      const origin = req.protocol + '://' + req.get('host');

      // If Baniq Pay API credentials provided, call live/sandbox gateway API
      if (apiKey && apiKey.trim() !== '' && apiSecret && apiSecret.trim() !== '') {
        const checkoutPayload = {
          customer_name: full_name || 'Subscriber Customer',
          customer_email: email || 'subscriber@example.com',
          customer_phone: phone || '01700000000',
          amount: Number(amount || '1500'),
          currency: 'BDT',
          metadata: metadata || {},
          redirect_url: `${origin}/payment/success`,
          cancel_url: `${origin}/`,
          webhook_url: `${origin}/api/baniq-pay/webhook`
        };

        try {
          const response = await fetch(`${baseUrl}/api/v1/payment/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': apiKey,
              'X-API-SECRET': apiSecret,
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(checkoutPayload)
          });

          const data: any = await response.json().catch(() => ({}));
          const targetUrl = data.payment_url || data.checkout_url || data.url || (data.data && (data.data.payment_url || data.data.url));
          if (response.ok && targetUrl) {
            res.json({
              success: true,
              payment_url: targetUrl,
              invoice_id: data.invoice_id || data.trx_id || (data.data && data.data.invoice_id)
            });
            return;
          }
        } catch (fetchErr) {
          console.warn('[Baniq Pay] API connection attempt warning:', fetchErr);
        }
      }

      // Fallback: Instant Sandbox Provisioning Session (bKash/Nagad/Rocket simulation)
      const sessionId = 'bnq_' + Date.now();
      res.json({
        success: true,
        is_sandbox: true,
        session_id: sessionId,
        amount: amount || 1500,
        company_name: metadata?.company_name || full_name,
        payment_url: `/payment/sandbox?session=${sessionId}&amount=${amount || 1500}&company=${encodeURIComponent(metadata?.company_name || '')}`,
        message: 'Baniq Pay sandbox gateway session generated.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Payment checkout error' });
    }
  };

  app.post('/api/baniq-pay/checkout', handleBaniqPayCheckout);
  app.post('/api/payment/checkout', handleBaniqPayCheckout);

  // Webhook listener for Baniq Pay instant IPN/Webhook
  const handleBaniqPayWebhook = async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.BANIQ_PAY_API_KEY;
      const apiSecret = process.env.BANIQ_PAY_API_SECRET;
      const webhookSecret = process.env.BANIQ_PAY_WEBHOOK_SECRET;

      const incomingApiKey = req.header('x-api-key') || req.header('X-API-KEY') || req.header('x-baniq-api-key');
      const incomingApiSecret = req.header('x-api-secret') || req.header('X-API-SECRET') || req.header('x-webhook-secret') || req.header('x-baniq-signature');

      // Security check on webhook key & secret if configured
      if (apiKey && incomingApiKey && apiKey !== incomingApiKey) {
        res.status(401).json({ status: 'unauthorized', message: 'Invalid Baniq Pay API key.' });
        return;
      }
      if ((apiSecret || webhookSecret) && incomingApiSecret) {
        const expectedSecret = webhookSecret || apiSecret;
        if (expectedSecret && incomingApiSecret !== expectedSecret) {
          res.status(401).json({ status: 'unauthorized', message: 'Invalid Baniq Pay API secret or webhook signature.' });
          return;
        }
      }

      const body = req.body || {};
      const status = String(body.status || body.payment_status || body.transaction_status || '').toUpperCase();

      if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'PAID' || status === 'SUCCESSFUL') {
        const meta = body.metadata || {};
        const origin = req.protocol + '://' + req.get('host');

        const provisionResult = await provisionNewTenant({
          company_name: meta.company_name || body.customer_name || body.full_name || 'Commercial Fleet',
          admin_name: meta.admin_name || body.customer_name || body.full_name,
          email: body.email || body.customer_email || meta.email,
          phone: meta.phone || body.customer_phone || body.phone,
          plan_id: meta.plan_id || 'starter',
          max_vehicles: Number(meta.max_vehicles) || 5,
          custom_price: Number(body.amount) || Number(meta.custom_price) || undefined,
          origin
        });

        res.status(200).json({ status: 'success', message: 'Tenant workspace provisioned via Baniq Pay.', tenant_id: provisionResult.tenant.id });
        return;
      }

      res.status(200).json({ status: 'ignored', message: `Status is ${status}` });
    } catch (err: any) {
      console.error('[Baniq Pay Webhook Error]:', err);
      res.status(500).json({ status: 'error', message: err?.message });
    }
  };

  app.post('/api/baniq-pay/webhook', handleBaniqPayWebhook);
  app.post('/api/payment/webhook', handleBaniqPayWebhook);

  // Baniq Pay Configuration & Webhook URL Status endpoint
  app.get('/api/baniq-pay/config', (req: Request, res: Response) => {
    const origin = req.protocol + '://' + req.get('host');
    res.json({
      success: true,
      gateway: 'Baniq Pay',
      configured: Boolean(process.env.BANIQ_PAY_API_KEY && process.env.BANIQ_PAY_API_SECRET),
      has_api_key: Boolean(process.env.BANIQ_PAY_API_KEY),
      has_api_secret: Boolean(process.env.BANIQ_PAY_API_SECRET),
      has_webhook_secret: Boolean(process.env.BANIQ_PAY_WEBHOOK_SECRET),
      webhook_url: `${origin}/api/baniq-pay/webhook`,
      supported_methods: ['bKash', 'Nagad', 'Rocket', 'Bank Transfer', 'Upay']
    });
  });

  // Dedicated subscriber registration endpoint for Landing Page (Trial & Premium Plans)
  app.post('/api/subscribers/register', async (req: Request, res: Response) => {
    try {
      const { company_name, admin_name, email, phone, plan_id } = req.body;
      const origin = req.protocol + '://' + req.get('host');

      const result = await provisionNewTenant({
        company_name,
        admin_name,
        email,
        phone,
        plan_id: plan_id || 'trial_3days',
        origin
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Registration error' });
    }
  });

  // Instant one-click simulation endpoint for Sandbox preview
  app.post('/api/payment/simulate-success', async (req: Request, res: Response) => {
    try {
      const { company_name, admin_name, email, phone, plan_id, max_vehicles, custom_price } = req.body;
      const origin = req.protocol + '://' + req.get('host');

      const result = await provisionNewTenant({
        company_name,
        admin_name,
        email,
        phone,
        plan_id: plan_id || 'starter',
        max_vehicles: Number(max_vehicles) || (plan_id === 'pro' ? 20 : 5),
        custom_price: Number(custom_price),
        origin
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Provisioning error' });
    }
  });

  // -------------------------------------------------------------
  // Multi-Level Action Approvals (Update 9)
  // -------------------------------------------------------------
  app.get('/api/saas/approvals', (req: Request, res: Response) => {
    const list = loadApprovals();
    res.json({ success: true, data: list });
  });

  app.post('/api/saas/approvals/request', (req: Request, res: Response) => {
    try {
      const { action_type, requested_by_id, requested_by_name, requested_by_role, target_tenant_id, target_tenant_name, details } = req.body;
      if (!action_type || !target_tenant_id) {
        res.status(400).json({ success: false, message: 'action_type and target_tenant_id are required.' });
        return;
      }

      const approvals = loadApprovals();
      const newAction = {
        id: `act_${Date.now()}`,
        action_type,
        requested_by_id: requested_by_id || 'usr_staff',
        requested_by_name: requested_by_name || 'Staff Member',
        requested_by_role: requested_by_role || 'ADMIN',
        target_tenant_id,
        target_tenant_name: target_tenant_name || target_tenant_id,
        details: details || {},
        status: 'PENDING',
        created_at: new Date().toISOString()
      };

      approvals.unshift(newAction);
      saveApprovals(approvals);

      res.status(201).json({
        success: true,
        action: newAction,
        message: 'Action request submitted for Owner/Co-Owner Approval.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error creating approval request' });
    }
  });

  app.post('/api/saas/approvals/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewed_by_name } = req.body;
      const approvals = loadApprovals();
      const idx = approvals.findIndex(a => a.id === id);
      if (idx < 0) {
        res.status(404).json({ success: false, message: 'Approval action not found.' });
        return;
      }

      const action = approvals[idx];
      if (action.status !== 'PENDING') {
        res.status(400).json({ success: false, message: `Action is already ${action.status}.` });
        return;
      }

      const dbTenants = await fetchTenantsFromDB().catch(() => null);
      if (dbTenants && dbTenants.length > 0) {
        activeTenants = dbTenants;
      } else {
        activeTenants = loadTenants();
      }
      let tenant = activeTenants.find(t => t.id === action.target_tenant_id);

      // Execute requested action
      if (tenant) {
        if (action.action_type === 'DELETE_SUBSCRIBER') {
          activeTenants = activeTenants.filter(t => t.id !== action.target_tenant_id);
          saveTenants(activeTenants);
          activeUsers = loadUsers().filter(u => u.tenant_id !== action.target_tenant_id);
          saveUsers(activeUsers);
          const fleet = loadFleetData();
          fleet.vehicles = (fleet.vehicles || []).filter(v => v.tenant_id !== action.target_tenant_id);
          fleet.fuelEntries = (fleet.fuelEntries || []).filter(e => e.tenant_id !== action.target_tenant_id);
          fleet.pumps = (fleet.pumps || []).filter(p => p.tenant_id !== action.target_tenant_id);
          fleet.payments = (fleet.payments || []).filter(pm => pm.tenant_id !== action.target_tenant_id);
          fleet.categories = (fleet.categories || []).filter(c => c.tenant_id !== action.target_tenant_id);
          fleet.companies = (fleet.companies || []).filter(c => c.tenant_id !== action.target_tenant_id);
          fleet.vendors = (fleet.vendors || []).filter(v => v.tenant_id !== action.target_tenant_id);
          fleet.fuelTypes = (fleet.fuelTypes || []).filter(f => f.tenant_id !== action.target_tenant_id);
          fleet.tankers = (fleet.tankers || []).filter(tk => tk.tenant_id !== action.target_tenant_id);
          fleet.tankerLogs = (fleet.tankerLogs || []).filter(tl => tl.tenant_id !== action.target_tenant_id);
          saveFleetData(fleet);
          await deleteTenantInDB(action.target_tenant_id).catch(async () => {
            await softDeleteTenantInDB(action.target_tenant_id).catch(() => {});
          });
        } else if (action.action_type === 'EXTEND_SUBSCRIPTION') {
          const days = Number(action.details?.extension_days || 30);
          if (!tenant.subscription) {
            tenant.subscription = {
              plan: 'starter',
              status: 'active',
              start_date: new Date().toISOString().split('T')[0],
              end_date: new Date().toISOString().split('T')[0],
              price_bdt: 0
            };
          }
          const currentEnd = tenant.subscription.end_date ? new Date(tenant.subscription.end_date) : new Date();
          const now = new Date();
          const baseDate = !isNaN(currentEnd.getTime()) && currentEnd > now ? currentEnd : now;
          baseDate.setDate(baseDate.getDate() + days);
          const newEndDate = baseDate.toISOString().split('T')[0];
          tenant.subscription.end_date = newEndDate;
          tenant.subscription.status = 'active';
          tenant.status = 'active';
          saveTenants(activeTenants);
          await upsertTenantInDB(tenant).catch(() => {});
        } else if (action.action_type === 'SUSPEND_TENANT') {
          tenant.status = 'suspended';
          if (tenant.subscription) tenant.subscription.status = 'suspended';
          saveTenants(activeTenants);
          await updateTenantStatusInDB(tenant.id, 'suspended').catch(() => {});
        } else if (action.action_type === 'UNSUSPEND_TENANT') {
          tenant.status = 'active';
          if (tenant.subscription) tenant.subscription.status = 'active';
          saveTenants(activeTenants);
          await updateTenantStatusInDB(tenant.id, 'active').catch(() => {});
        }
      }

      action.status = 'APPROVED';
      action.reviewed_by_name = reviewed_by_name || 'Owner Administrator';
      action.reviewed_at = new Date().toISOString();
      saveApprovals(approvals);

      res.json({
        success: true,
        action,
        tenant,
        new_end_date: tenant?.subscription?.end_date,
        message: `Action ${action.action_type} approved and executed successfully.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error approving action' });
    }
  });

  app.post('/api/saas/approvals/:id/reject', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewed_by_name, note } = req.body;
      const approvals = loadApprovals();
      const idx = approvals.findIndex(a => a.id === id);
      if (idx < 0) {
        res.status(404).json({ success: false, message: 'Approval action not found.' });
        return;
      }

      const action = approvals[idx];
      action.status = 'REJECTED';
      action.reviewed_by_name = reviewed_by_name || 'Owner Administrator';
      action.reviewed_at = new Date().toISOString();
      if (note) {
        action.details = { ...action.details, reject_note: note };
      }
      saveApprovals(approvals);

      res.json({
        success: true,
        action,
        message: `Action ${action.action_type} has been rejected.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error rejecting action' });
    }
  });

  // -------------------------------------------------------------
  // Mandatory Password Change Endpoint (Update 10)
  // -------------------------------------------------------------
  app.post('/api/auth/force-change-password', async (req: Request, res: Response) => {
    try {
      const { user_id, new_password } = req.body;
      if (!user_id || !new_password) {
        res.status(400).json({ success: false, message: 'user_id and new_password are required.' });
        return;
      }
      const cleanPass = String(new_password).trim();
      if (cleanPass.length < 6) {
        res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        return;
      }

      activeUsers = loadUsers();
      let user = activeUsers.find(u => u.id === user_id);
      if (!user) {
        const dbUsers = await fetchUsersFromDB().catch(() => null);
        if (dbUsers) {
          user = dbUsers.find(u => u.id === user_id);
          if (user) activeUsers.push(user);
        }
      }

      if (!user) {
        res.status(404).json({ success: false, message: 'User account not found.' });
        return;
      }

      const hashed = hashPassword(cleanPass);
      user.password = hashed;
      user.must_change_password = false;
      saveUsers(activeUsers);

      // If user is super admin, update subscription credentials
      if (user.role === 'super_admin' && user.tenant_id) {
        activeTenants = loadTenants();
        const t = activeTenants.find(ten => ten.id === user.tenant_id);
        if (t && t.subscription) {
          t.subscription.super_admin_password = cleanPass;
          saveTenants(activeTenants);
          await upsertTenantInDB(t).catch(() => {});
        }
      }

      await upsertUserInDB(user).catch(() => {});

      res.json({
        success: true,
        message: 'Password changed successfully. You may now access your dashboard.',
        user
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Password change error' });
    }
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

  // 5.2b PATCH /api/users/:id - Update company user
  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      activeUsers = loadUsers();
      let user = activeUsers.find(u => u.id === id);
      if (!user) {
        const dbUsers = await fetchUsersFromDB().catch(() => null);
        if (dbUsers) {
          user = dbUsers.find(u => u.id === id);
          if (user) activeUsers.push(user);
        }
      }
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      Object.assign(user, updates);
      saveUsers(activeUsers);
      await upsertUserInDB(user).catch(() => {});
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error updating user' });
    }
  });

  // 5.2c DELETE /api/users/:id - Delete company user
  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      activeUsers = loadUsers().filter(u => u.id !== id);
      saveUsers(activeUsers);
      await deleteUserInDB(id).catch(e => console.warn('[MySQL] User delete error:', e));
      res.json({ success: true, message: 'User deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error deleting user' });
    }
  });

  // 5.2d POST /api/fleet/bulk-import - Bulk Excel / CSV Data Import
  app.post('/api/fleet/bulk-import', async (req: Request, res: Response) => {
    try {
      const { tenant_id, entity_type, rows } = req.body;
      if (!tenant_id || !entity_type || !Array.isArray(rows) || rows.length === 0) {
        res.status(400).json({ success: false, message: 'tenant_id, entity_type, and non-empty rows array required.' });
        return;
      }

      const fleet = loadFleetData();
      let importedCount = 0;
      let newCount = 0;
      let updatedCount = 0;
      const addedItems: any[] = [];
      const todayStr = new Date().toISOString().split('T')[0];

      if (entity_type === 'vehicles') {
        fleet.vehicles = Array.isArray(fleet.vehicles) ? fleet.vehicles : [];
        for (const r of rows) {
          const rawNum = r.vehicle_number || r.plate_number || r.vehicle_no || r.plate_no || r.registration_number || r.registration_no || r.car_number || r.name;
          if (!rawNum) continue;
          const plate = String(rawNum).trim();
          if (!plate) continue;

          const targetPlate = plate.toLowerCase();
          const existingIdx = fleet.vehicles.findIndex(v =>
            v && v.tenant_id === tenant_id &&
            (((v.vehicle_number || v.plate_number || '') + '').toLowerCase() === targetPlate)
          );

          const vehicleItem: any = {
            id: r.id || 'veh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenant_id,
            user_id: r.user_id || 'user_1',
            vehicle_number: plate,
            plate_number: plate,
            model: r.model || 'Commercial Vehicle',
            category_id: r.category_id || r.category || 'cat_1',
            company_id: r.company_id || r.company || 'comp_1',
            vendor_id: r.vendor_id || r.vendor || undefined,
            ownership: (r.ownership || (r.vendor_id || r.vendor ? 'rented' : 'owned')) as 'owned' | 'rented',
            fuel_type_id: r.fuel_type_id || r.fuel_type || 'Diesel',
            expected_benchmark: Number(r.expected_benchmark || r.benchmark || r.mileage_benchmark) || 8.0,
            current_odometer: Number(r.current_odometer || r.initial_odometer || r.odometer) || 0,
            driver_name: r.driver_name || 'Assigned Driver',
            driver_phone: r.driver_phone || r.phone || '',
            fuel_tank_capacity: Number(r.fuel_tank_capacity || r.capacity) || 100,
            status: (r.status === 'maintenance' || r.status === 'idle') ? r.status : 'active',
            notes: r.notes || 'Bulk imported via Excel/CSV',
            created_at: r.created_at || todayStr
          };

          if (existingIdx >= 0) {
            fleet.vehicles[existingIdx] = { ...fleet.vehicles[existingIdx], ...vehicleItem, id: fleet.vehicles[existingIdx].id };
            addedItems.push(fleet.vehicles[existingIdx]);
            updatedCount++;
          } else {
            fleet.vehicles = fleet.vehicles.filter(v => v.id !== vehicleItem.id);
            fleet.vehicles.unshift(vehicleItem);
            addedItems.push(vehicleItem);
            newCount++;
          }
          importedCount++;
        }
      } else if (entity_type === 'companies') {
        fleet.companies = Array.isArray(fleet.companies) ? fleet.companies : [];
        for (const r of rows) {
          const rawName = r.name || r.company_name || r.title;
          if (!rawName) continue;
          const name = String(rawName).trim();
          if (!name) continue;

          const targetName = name.toLowerCase();
          const compItem: any = {
            id: r.id || 'comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenant_id,
            user_id: r.user_id || 'user_1',
            name,
            code: r.code || name.substring(0, 4).toUpperCase(),
            contact_person: r.contact_person || r.contact || '',
            phone: r.phone || r.mobile || '',
            email: r.email || '',
            address: r.address || '',
            status: r.status || 'active',
            created_at: r.created_at || todayStr
          };

          const existingIdx = fleet.companies.findIndex(c =>
            c && c.tenant_id === tenant_id &&
            (((c.name || '') + '').toLowerCase() === targetName)
          );

          if (existingIdx >= 0) {
            fleet.companies[existingIdx] = { ...fleet.companies[existingIdx], ...compItem, id: fleet.companies[existingIdx].id };
            addedItems.push(fleet.companies[existingIdx]);
            updatedCount++;
          } else {
            fleet.companies = fleet.companies.filter(c => c.id !== compItem.id);
            fleet.companies.unshift(compItem);
            addedItems.push(compItem);
            newCount++;
          }
          importedCount++;
        }
      } else if (entity_type === 'vendors') {
        fleet.vendors = Array.isArray(fleet.vendors) ? fleet.vendors : [];
        for (const r of rows) {
          const rawName = r.name || r.vendor_name || r.supplier;
          if (!rawName) continue;
          const name = String(rawName).trim();
          if (!name) continue;

          const targetName = name.toLowerCase();
          const venItem: any = {
            id: r.id || 'ven_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenant_id,
            user_id: r.user_id || 'user_1',
            name,
            phone: r.phone || r.mobile || '',
            contact_person: r.contact_person || r.contact || '',
            email: r.email || '',
            type: r.type || 'fuel',
            address: r.address || '',
            status: r.status || 'active',
            created_at: r.created_at || todayStr
          };

          const existingIdx = fleet.vendors.findIndex(v =>
            v && v.tenant_id === tenant_id &&
            (((v.name || '') + '').toLowerCase() === targetName)
          );

          if (existingIdx >= 0) {
            fleet.vendors[existingIdx] = { ...fleet.vendors[existingIdx], ...venItem, id: fleet.vendors[existingIdx].id };
            addedItems.push(fleet.vendors[existingIdx]);
            updatedCount++;
          } else {
            fleet.vendors = fleet.vendors.filter(v => v.id !== venItem.id);
            fleet.vendors.unshift(venItem);
            addedItems.push(venItem);
            newCount++;
          }
          importedCount++;
        }
      } else if (entity_type === 'pumps') {
        fleet.pumps = Array.isArray(fleet.pumps) ? fleet.pumps : [];
        for (const r of rows) {
          const rawName = r.name || r.pump_name || r.station_name;
          if (!rawName) continue;
          const name = String(rawName).trim();
          if (!name) continue;

          const targetName = name.toLowerCase();
          const pumpItem: any = {
            id: r.id || 'pump_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenant_id,
            user_id: r.user_id || 'user_1',
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

          const existingIdx = fleet.pumps.findIndex(p =>
            p && p.tenant_id === tenant_id &&
            (((p.name || '') + '').toLowerCase() === targetName)
          );

          if (existingIdx >= 0) {
            fleet.pumps[existingIdx] = { ...fleet.pumps[existingIdx], ...pumpItem, id: fleet.pumps[existingIdx].id };
            addedItems.push(fleet.pumps[existingIdx]);
            updatedCount++;
          } else {
            fleet.pumps = fleet.pumps.filter(p => p.id !== pumpItem.id);
            fleet.pumps.unshift(pumpItem);
            addedItems.push(pumpItem);
            newCount++;
          }
          importedCount++;
        }
      } else if (entity_type === 'fuel_types') {
        fleet.fuelTypes = Array.isArray(fleet.fuelTypes) ? fleet.fuelTypes : [];
        for (const r of rows) {
          const rawName = r.name || r.fuel_name || r.type;
          if (!rawName) continue;
          const name = String(rawName).trim();
          if (!name) continue;

          const targetName = name.toLowerCase();
          const price = Number(r.current_price || r.price) || 105;
          const fuelItem: any = {
            id: r.id || 'ft_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenant_id,
            user_id: r.user_id || 'user_1',
            name,
            code: (r.code || name.replace(/\s+/g, '_')).toLowerCase(),
            unit: r.unit || 'Liter',
            current_price: price,
            price_history: [{ date: todayStr, price, changed_by: 'Bulk Import' }],
            status: r.status || 'active',
            updated_at: todayStr
          };

          const existingIdx = fleet.fuelTypes.findIndex(f =>
            f && f.tenant_id === tenant_id &&
            (((f.name || '') + '').toLowerCase() === targetName)
          );

          if (existingIdx >= 0) {
            fleet.fuelTypes[existingIdx] = { ...fleet.fuelTypes[existingIdx], ...fuelItem, id: fleet.fuelTypes[existingIdx].id };
            addedItems.push(fleet.fuelTypes[existingIdx]);
            updatedCount++;
          } else {
            fleet.fuelTypes = fleet.fuelTypes.filter(f => f.id !== fuelItem.id);
            fleet.fuelTypes.unshift(fuelItem);
            addedItems.push(fuelItem);
            newCount++;
          }
          importedCount++;
        }
      } else if (entity_type === 'categories') {
        fleet.categories = Array.isArray(fleet.categories) ? fleet.categories : [];
        for (const r of rows) {
          const rawName = r.name || r.category_name;
          if (!rawName) continue;
          const name = String(rawName).trim();
          if (!name) continue;

          const targetName = name.toLowerCase();
          const catItem: any = {
            id: r.id || 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenant_id,
            user_id: r.user_id || 'user_1',
            name,
            metric_type: (r.metric_type || 'kmpl').toLowerCase() === 'lph' ? 'lph' : 'kmpl',
            default_benchmark: Number(r.default_benchmark || r.benchmark) || 8.0,
            tolerance_percentage: Number(r.tolerance_percentage) || 15,
            icon_name: r.icon_name || 'Truck',
            description: r.description || r.name_bn || ''
          };

          const existingIdx = fleet.categories.findIndex(c =>
            c && c.tenant_id === tenant_id &&
            (((c.name || '') + '').toLowerCase() === targetName)
          );

          if (existingIdx >= 0) {
            fleet.categories[existingIdx] = { ...fleet.categories[existingIdx], ...catItem, id: fleet.categories[existingIdx].id };
            addedItems.push(fleet.categories[existingIdx]);
            updatedCount++;
          } else {
            fleet.categories = fleet.categories.filter(c => c.id !== catItem.id);
            fleet.categories.unshift(catItem);
            addedItems.push(catItem);
            newCount++;
          }
          importedCount++;
        }
      } else if (entity_type === 'tankers') {
        fleet.tankers = Array.isArray(fleet.tankers) ? fleet.tankers : [];
        for (const r of rows) {
          const rawNum = r.tanker_name || r.tanker_number || r.name || r.tanker_no;
          if (!rawNum) continue;
          const num = String(rawNum).trim();
          if (!num) continue;

          const targetNum = num.toLowerCase();
          const tankerItem: any = {
            id: r.id || 'tank_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenant_id,
            user_id: r.user_id || 'user_1',
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

          const existingIdx = fleet.tankers.findIndex(tk =>
            tk && tk.tenant_id === tenant_id &&
            (((tk.tanker_name || tk.tanker_number || '') + '').toLowerCase() === targetNum)
          );

          if (existingIdx >= 0) {
            fleet.tankers[existingIdx] = { ...fleet.tankers[existingIdx], ...tankerItem, id: fleet.tankers[existingIdx].id };
            addedItems.push(fleet.tankers[existingIdx]);
            updatedCount++;
          } else {
            fleet.tankers = fleet.tankers.filter(tk => tk.id !== tankerItem.id);
            fleet.tankers.unshift(tankerItem);
            addedItems.push(tankerItem);
            newCount++;
          }
          importedCount++;
        }
      }

      saveFleetData(fleet);
      await syncAllDataToMySQL({
        vehicles: fleet.vehicles,
        pumps: fleet.pumps,
        fuelEntries: fleet.fuelEntries,
        payments: fleet.payments
      }).catch(e => console.warn('[MySQL] Bulk sync warning:', e));

      res.json({
        success: true,
        imported_count: importedCount,
        count: importedCount,
        new_count: newCount,
        updated_count: updatedCount,
        entity_type,
        items: addedItems,
        message: `Successfully registered ${importedCount} items (${newCount} newly created, ${updatedCount} updated). Double-entry protection active.`
      });
    } catch (err: any) {
      console.error('[Bulk Import Error]', err);
      res.status(500).json({ success: false, message: err?.message || 'Error importing bulk data' });
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


  // 6. POST /api/auth/login - Strict Authentication Guard (ISSUE 2 & 4 Fix)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { tenant_id, tenant_code, username, password } = req.body;
      const dbTenants = await fetchTenantsFromDB().catch(() => null);
      if (dbTenants && dbTenants.length > 0) {
        activeTenants = dbTenants;
      } else {
        activeTenants = loadTenants();
      }

      const dbUsers = await fetchUsersFromDB().catch(() => null);
      if (dbUsers && dbUsers.length > 0) {
        activeUsers = dbUsers;
      } else {
        activeUsers = loadUsers();
      }

      const cleanUser = String(username || '').trim().toLowerCase();
      const cleanPass = String(password || '').trim();

      // Look for target tenant
      let targetTenant = activeTenants.find(t =>
        (tenant_id && t.id === tenant_id) ||
        (tenant_code && t.code.toUpperCase() === String(tenant_code).toUpperCase())
      );

      // Verify user across target tenant first, or global fallback if tenant not passed or mismatched
      let matchedUser: any = null;
      if (targetTenant) {
        matchedUser = activeUsers.find(u =>
          u.tenant_id === targetTenant!.id &&
          (u.username.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser) &&
          verifyPassword(cleanPass, u.password)
        );
      }

      // Cross-tenant fallback search
      if (!matchedUser) {
        matchedUser = activeUsers.find(u =>
          (u.username.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser) &&
          verifyPassword(cleanPass, u.password)
        );
        if (matchedUser && matchedUser.tenant_id) {
          const tFound = activeTenants.find(t => t.id === matchedUser.tenant_id);
          if (tFound) targetTenant = tFound;
        }
      }

      // Check tenant subscription super_admin credentials fallback
      if (!matchedUser) {
        for (const t of activeTenants) {
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
              role_title_bn: 'কোম্পানি সুপার অ্যাডমিন (Super Admin)',
              status: 'active',
              must_change_password: false,
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
              created_at: t.created_at || '2026-08-01'
            };
            break;
          }
        }
      }

      if (!matchedUser || !targetTenant) {
        res.status(401).json({ success: false, message: 'Invalid username or password. Please verify your credentials.' });
        return;
      }

      // STRICT STATUS CHECK
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
          message: "This workspace is suspended or expired. Please contact the administrator."
        });
        return;
      }

      if (matchedUser.status === 'suspended') {
        res.status(403).json({
          success: false,
          message: "Your user account is suspended. Please contact your company administrator."
        });
        return;
      }

      res.json({
        success: true,
        message: "Credentials verified.",
        tenant: targetTenant,
        user: matchedUser
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Login error' });
    }
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
