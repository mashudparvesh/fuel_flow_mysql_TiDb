import express from "express";
import type { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
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
  deleteTankerInDB,
  wipeAllDataFromDB,
  registerTenantWithTransaction,
  approveTenantWithTransaction
} from "./server/mysql.ts";
import { verifyPassword, hashPassword, isHashed } from "./src/utils/authSecurity.ts";
import { DEFAULT_SITE_CONTENT, SiteContentConfig } from "./src/data/defaultSiteContent.ts";

// Initial fallback tenant data (empty - clean production state)
const DEFAULT_TENANTS: any[] = [];

// Persistent File Path for Tenants & Users
// On Vercel serverless, root filesystem is read-only; /tmp is the writable storage location.
const SEED_DATA_DIR = path.join(process.cwd(), 'data');
const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'fuelnest_data') : SEED_DATA_DIR;
const TENANTS_FILE = path.join(DATA_DIR, 'tenants.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REGISTRATION_REQUESTS_FILE = path.join(DATA_DIR, 'registration_requests.json');
const CONTACT_MESSAGES_FILE = path.join(DATA_DIR, 'contact_messages.json');
const SITE_CONTENT_FILE = path.join(DATA_DIR, 'site_content.json');
const ADMIN_NOTIFICATIONS_FILE = path.join(DATA_DIR, 'admin_notifications.json');
const SUBSCRIPTION_PAYMENTS_FILE = path.join(DATA_DIR, 'subscription_payments.json');

const DEFAULT_USERS: any[] = [];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  // On Vercel, copy initial seed files from repo to writable /tmp
  if (process.env.VERCEL && fs.existsSync(SEED_DATA_DIR)) {
    try {
      const files = fs.readdirSync(SEED_DATA_DIR);
      for (const file of files) {
        const dest = path.join(DATA_DIR, file);
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(path.join(SEED_DATA_DIR, file), dest);
        }
      }
    } catch (e) {}
  }
  if (!fs.existsSync(TENANTS_FILE)) {
    fs.writeFileSync(TENANTS_FILE, JSON.stringify(DEFAULT_TENANTS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf-8');
  }
  if (!fs.existsSync(REGISTRATION_REQUESTS_FILE)) {
    fs.writeFileSync(REGISTRATION_REQUESTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(ADMIN_NOTIFICATIONS_FILE)) {
    fs.writeFileSync(ADMIN_NOTIFICATIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
  if (!fs.existsSync(SUBSCRIPTION_PAYMENTS_FILE)) {
    fs.writeFileSync(SUBSCRIPTION_PAYMENTS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function loadSubscriptionPayments(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(SUBSCRIPTION_PAYMENTS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIPTION_PAYMENTS_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
}

function saveSubscriptionPayments(payments: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(SUBSCRIPTION_PAYMENTS_FILE, JSON.stringify(payments, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save subscription payments:', e);
  }
}

function loadContactMessages(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(CONTACT_MESSAGES_FILE)) {
      const raw = fs.readFileSync(CONTACT_MESSAGES_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return [];
}

function saveContactMessages(messages: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(CONTACT_MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save contact messages:', e);
  }
}

function loadSiteContent(): SiteContentConfig {
  try {
    ensureDataDir();
    if (fs.existsSync(SITE_CONTENT_FILE)) {
      const raw = fs.readFileSync(SITE_CONTENT_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SITE_CONTENT,
        ...parsed,
        branding: { ...DEFAULT_SITE_CONTENT.branding, ...(parsed.branding || {}) },
        home: { ...DEFAULT_SITE_CONTENT.home, ...(parsed.home || {}) },
        contact: { ...DEFAULT_SITE_CONTENT.contact, ...(parsed.contact || {}) },
        about: { ...DEFAULT_SITE_CONTENT.about, ...(parsed.about || {}) },
        privacy: { ...DEFAULT_SITE_CONTENT.privacy, ...(parsed.privacy || {}) },
        terms: { ...DEFAULT_SITE_CONTENT.terms, ...(parsed.terms || {}) },
        faqs: Array.isArray(parsed.faqs) && parsed.faqs.length > 0 ? parsed.faqs : DEFAULT_SITE_CONTENT.faqs
      };
    }
  } catch (e) {}
  return DEFAULT_SITE_CONTENT;
}

function saveSiteContent(content: SiteContentConfig) {
  try {
    ensureDataDir();
    fs.writeFileSync(SITE_CONTENT_FILE, JSON.stringify(content, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save site content:', e);
  }
}

function loadRegistrationRequests(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(REGISTRATION_REQUESTS_FILE)) {
      const raw = fs.readFileSync(REGISTRATION_REQUESTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading registration requests file:', err);
  }
  return [];
}

function saveRegistrationRequests(requests: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(REGISTRATION_REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving registration requests file:', err);
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
// Automated Email Dispatch (SMTP Nodemailer & Resend Multi-Channel)
// -------------------------------------------------------------
const EMAIL_LOGS_FILE = path.join(DATA_DIR, 'email_logs.json');
const EMAIL_CONFIG_FILE = path.join(DATA_DIR, 'email_config.json');

export interface EmailSettingsConfig {
  smtp_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  resend_from: string;
  verified_domain: string;
}

function loadEmailConfig(): EmailSettingsConfig {
  ensureDataDir();
  let config: EmailSettingsConfig = {
    smtp_enabled: process.env.SMTP_ENABLED === 'true',
    smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtp_port: Number(process.env.SMTP_PORT) || 465,
    smtp_secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465' || !process.env.SMTP_PORT,
    smtp_user: process.env.SMTP_USER || 'admin.fuelnest@gmail.com',
    smtp_pass: process.env.SMTP_PASS || '',
    smtp_from: process.env.SMTP_FROM || 'FuelNest Intelligence <admin.fuelnest@gmail.com>',
    resend_from: process.env.RESEND_FROM || 'FuelNest <admin.fuelnest@gmail.com>',
    verified_domain: process.env.EMAIL_DOMAIN || 'fuelnest.xyz'
  };

  if (fs.existsSync(EMAIL_CONFIG_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(EMAIL_CONFIG_FILE, 'utf-8'));
      config = { ...config, ...saved };
    } catch (e) {
      console.warn('[Email Config Load Error]:', e);
    }
  }
  return config;
}

function saveEmailConfig(cfg: Partial<EmailSettingsConfig>) {
  ensureDataDir();
  const current = loadEmailConfig();
  const updated = { ...current, ...cfg };
  fs.writeFileSync(EMAIL_CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

function recordAdminNotification(notification: any) {
  try {
    ensureDataDir();
    let notifs: any[] = [];
    if (fs.existsSync(ADMIN_NOTIFICATIONS_FILE)) {
      try {
        notifs = JSON.parse(fs.readFileSync(ADMIN_NOTIFICATIONS_FILE, 'utf-8'));
      } catch {}
    }
    notifs.unshift({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...notification
    });
    if (notifs.length > 50) notifs = notifs.slice(0, 50);
    fs.writeFileSync(ADMIN_NOTIFICATIONS_FILE, JSON.stringify(notifs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Admin Notification Log Error]:', e);
  }
}

function recordEmailLog(entry: any) {
  try {
    ensureDataDir();
    let logs: any[] = [];
    if (fs.existsSync(EMAIL_LOGS_FILE)) {
      try {
        logs = JSON.parse(fs.readFileSync(EMAIL_LOGS_FILE, 'utf-8'));
      } catch {}
    }
    logs.unshift({
      id: `em_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
    if (logs.length > 100) logs = logs.slice(0, 100);
    fs.writeFileSync(EMAIL_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Email Log Error]:', e);
  }
}

async function sendWelcomeEmail(data: {
  email: string;
  companyName: string;
  username: string;
  tempPassword: string;
  loginUrl?: string;
  planName?: string;
}) {
  const emailCfg = loadEmailConfig();
  const resendApiKey = process.env.RESEND_API_KEY;
  // Always enforce the dedicated subscriber portal URL: https://fuelnest.xyz/login
  const targetLoginUrl = (data.loginUrl && !data.loginUrl.includes('localhost')) ? data.loginUrl : 'https://fuelnest.xyz/login';
  console.log(`[Email Dispatch] Triggered for ${data.companyName} (${data.email}) - User: ${data.username} - Portal: ${targetLoginUrl}`);

  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px;">
      <div style="margin-bottom: 20px; border-bottom: 2px solid #f59e0b; padding-bottom: 16px;">
        <h1 style="color: #0f172a; margin: 0 0 6px 0; font-size: 24px; font-weight: 800;">FuelNest Fleet & Fuel Intelligence</h1>
        <p style="margin: 0; color: #64748b; font-size: 14px;">Enterprise Commercial Fleet Provisioning</p>
      </div>
      
      <p style="font-size: 15px; line-height: 1.6;">Hello,</p>
      <p style="font-size: 15px; line-height: 1.6;">
        Congratulations! Your dedicated enterprise workspace for <strong>${data.companyName}</strong> (${data.planName || 'Active Workspace'}) has been provisioned and configured on FuelNest.
      </p>

      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 16px;">Your Super Admin Sign-in Credentials:</h3>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Portal Access URL:</strong> <a href="${targetLoginUrl}" style="color: #d97706; text-decoration: none; font-weight: bold;">${targetLoginUrl}</a></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Super Admin Username:</strong> <code style="background: #e2e8f0; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold;">${data.username}</code></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 14px; font-weight: bold;">${data.tempPassword}</code></p>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px; margin: 20px 0; color: #92400e; font-size: 13px; line-height: 1.5;">
        <strong>Security Notice:</strong> You can update your temporary password anytime from the Fleet User Management panel.
      </div>

      <div style="text-align: center; margin: 30px 0 20px;">
        <a href="${targetLoginUrl}" style="background: #f59e0b; color: #000000; padding: 12px 28px; font-weight: bold; text-decoration: none; border-radius: 10px; display: inline-block; font-size: 15px;">Login to Your Fleet Dashboard &rarr;</a>
      </div>

      <p style="color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
        FuelNest Enterprise Multi-Company Platform &bull; Automated System Provisioning
      </p>
    </div>
  `;

  // CHANNEL 1: Custom SMTP (Nodemailer) - No sandbox restriction! Sends directly to ANY recipient email
  const isSmtpReady = emailCfg.smtp_enabled || (Boolean(emailCfg.smtp_host) && Boolean(emailCfg.smtp_user) && Boolean(emailCfg.smtp_pass));
  if (isSmtpReady) {
    try {
      console.log(`[Email SMTP] Dispatching to ${data.email} via ${emailCfg.smtp_host}:${emailCfg.smtp_port}...`);
      const transporter = nodemailer.createTransport({
        host: emailCfg.smtp_host,
        port: Number(emailCfg.smtp_port) || 587,
        secure: Boolean(emailCfg.smtp_secure),
        auth: {
          user: emailCfg.smtp_user,
          pass: emailCfg.smtp_pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const senderFrom = emailCfg.smtp_from || '"FuelNest Admin" <admin.fuelnest@gmail.com>';
      const info = await transporter.sendMail({
        from: senderFrom,
        replyTo: 'admin.fuelnest@gmail.com',
        to: data.email,
        subject: `Welcome to FuelNest - Your Fleet Workspace is Ready! (${data.companyName})`,
        html: htmlBody
      });

      console.log(`[Email SMTP Success] Delivered to ${data.email} - ID: ${info.messageId}`);
      recordEmailLog({
        recipient: data.email,
        company: data.companyName,
        username: data.username,
        status: 'delivered',
        method: 'smtp',
        messageId: info.messageId,
        from: senderFrom
      });

      return {
        dispatched: true,
        delivered: true,
        method: 'smtp',
        recipient: data.email
      };
    } catch (smtpErr: any) {
      const smtpErrMsg = smtpErr?.message || String(smtpErr);
      console.warn('[Email SMTP Failed]:', smtpErrMsg);
      recordEmailLog({
        recipient: data.email,
        company: data.companyName,
        username: data.username,
        status: 'smtp_failed',
        error: smtpErrMsg
      });
      // Fall through to Resend
    }
  }

  // CHANNEL 2: Resend API Dispatch
  if (resendApiKey) {
    let directOk = false;
    let errorMsg = '';
    const resendSender = (emailCfg.resend_from && emailCfg.resend_from.trim().length > 0)
      ? emailCfg.resend_from.trim()
      : 'FuelNest Onboarding <onboarding@resend.dev>';

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendSender,
          to: [data.email],
          subject: `Welcome to FuelNest - Your Fleet Workspace is Ready! (${data.companyName})`,
          html: htmlBody
        })
      });

      if (res.ok) {
        directOk = true;
        recordEmailLog({
          recipient: data.email,
          company: data.companyName,
          username: data.username,
          status: 'delivered',
          method: 'resend_direct',
          from: resendSender
        });
        console.log(`[Email Success] Delivered to ${data.email} via Resend`);
        return {
          dispatched: true,
          delivered: true,
          status: res.status,
          recipient: data.email,
          method: 'resend'
        };
      } else {
        const errJson: any = await res.json().catch(() => ({}));
        errorMsg = errJson.message || `HTTP ${res.status}`;
        console.warn(`[Resend Notice] Direct send to ${data.email} returned: ${errorMsg}`);
      }
    } catch (err: any) {
      errorMsg = err?.message || String(err);
      console.warn('[Resend Email Error]:', errorMsg);
    }

    const isSandboxLimitation = errorMsg.toLowerCase().includes('testing emails to your own email address') ||
                                errorMsg.toLowerCase().includes('verify a domain') ||
                                errorMsg.toLowerCase().includes('resend.com/domains');

    // Attempt sandbox relay to verified account owner (admin.fuelnest@gmail.com) so credentials are preserved
    const ownerEmail = 'admin.fuelnest@gmail.com';
    let relayedOk = false;
    if (!directOk && data.email.toLowerCase() !== ownerEmail.toLowerCase()) {
      try {
        const relayRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'FuelNest Onboarding <onboarding@resend.dev>',
            to: [ownerEmail],
            subject: `[Subscriber Credentials] Workspace Provisioned: ${data.companyName} (${data.email})`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #0f172a;">New Subscriber Workspace Provisioned</h2>
                <p><strong>Company:</strong> ${data.companyName}</p>
                <p><strong>Client Email:</strong> ${data.email}</p>
                <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 15px 0;">
                  <p><strong>Username:</strong> <code>${data.username}</code></p>
                  <p><strong>Temporary Password:</strong> <code>${data.tempPassword}</code></p>
                  <p><strong>Portal URL:</strong> <a href="${targetLoginUrl}">${targetLoginUrl}</a></p>
                </div>
                <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 10px; border-radius: 8px; font-size: 13px;">
                  <strong>Delivery Notice:</strong> Direct send to client (${data.email}) was blocked because Resend is in testing sandbox mode. To send directly to client inboxes: verify domain (fuelnest.xyz) at resend.com/domains or configure custom SMTP in Master Control.
                </div>
              </div>
            `
          })
        });
        if (relayRes.ok) {
          relayedOk = true;
          console.log(`[Email Relay] Dispatched credential copy to owner ${ownerEmail}`);
        }
      } catch (e: any) {
        console.warn('[Email Relay Error]:', e?.message || e);
      }
    }

    recordEmailLog({
      recipient: data.email,
      company: data.companyName,
      username: data.username,
      status: isSandboxLimitation ? 'sandbox_restricted' : 'failed',
      relayTo: relayedOk ? ownerEmail : undefined,
      error: errorMsg,
      reason: isSandboxLimitation
        ? 'Resend sandbox mode limitation: Testing emails can only be sent to owner. Verify domain at resend.com/domains or configure SMTP.'
        : errorMsg
    });

    return {
      dispatched: false,
      delivered: false,
      sandbox_restricted: isSandboxLimitation,
      recipient: data.email,
      relayed_to_owner: relayedOk,
      relay_target: ownerEmail,
      error: errorMsg,
      message: isSandboxLimitation
        ? 'Sandbox limitation: To dispatch emails directly to customer inboxes, verify fuelnest.xyz at resend.com/domains or connect SMTP.'
        : errorMsg
    };
  }

  // CHANNEL 3: Simulated mock fallback
  console.log(`[Email Mock] Welcome email for ${data.companyName} to ${data.email}:`);
  console.log(`[Email Mock] Portal URL: ${targetLoginUrl} | Username: ${data.username} | Temporary Password: ${data.tempPassword}`);
  recordEmailLog({
    recipient: data.email,
    company: data.companyName,
    username: data.username,
    portalUrl: targetLoginUrl,
    status: 'simulated_no_api_key'
  });
  return { dispatched: false, delivered: false, simulated: true, recipient: data.email };
}

// -------------------------------------------------------------
// Master Admin Notification Email Dispatcher (admin.fuelnest@gmail.com)
// -------------------------------------------------------------
export async function sendAdminNotificationEmail({
  subject,
  html,
  text
}: {
  subject: string;
  html: string;
  text?: string;
}) {
  const targetAdminEmail = 'admin.fuelnest@gmail.com';
  const emailCfg = loadEmailConfig();
  const resendApiKey = process.env.RESEND_API_KEY;

  console.log(`[Admin Alert] Initiating alert email to ${targetAdminEmail}: "${subject}"`);

  // Record into persistent Admin Notification Queue
  recordAdminNotification({
    subject,
    recipient: targetAdminEmail,
    text: text || subject,
    created_at: new Date().toISOString()
  });

  // 1. Try Custom SMTP if configured
  if (emailCfg.smtp_enabled && emailCfg.smtp_host && emailCfg.smtp_user && emailCfg.smtp_pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: emailCfg.smtp_host,
        port: emailCfg.smtp_port || 587,
        secure: Boolean(emailCfg.smtp_secure),
        auth: {
          user: emailCfg.smtp_user,
          pass: emailCfg.smtp_pass
        }
      });
      await transporter.sendMail({
        from: emailCfg.smtp_from || `FuelNest System <${emailCfg.smtp_user}>`,
        to: targetAdminEmail,
        subject,
        html,
        text: text || subject
      });
      console.log(`[Admin Alert Success] Dispatched via SMTP to ${targetAdminEmail}`);
      recordEmailLog({
        recipient: targetAdminEmail,
        company: 'FuelNest Admin Alert',
        username: 'admin.fuelnest',
        status: 'delivered',
        method: 'smtp'
      });
      return { success: true, method: 'smtp' };
    } catch (smtpErr: any) {
      console.warn('[Admin Alert SMTP error]:', smtpErr?.message || smtpErr);
    }
  }

  // 2. Try Resend API
  if (resendApiKey) {
    const resendSender = (emailCfg.resend_from && emailCfg.resend_from.trim().length > 0)
      ? emailCfg.resend_from.trim()
      : 'FuelNest Alert <onboarding@resend.dev>';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: resendSender,
          to: [targetAdminEmail],
          subject,
          html
        })
      });
      if (res.ok) {
        console.log(`[Admin Alert Success] Dispatched via Resend to ${targetAdminEmail}`);
        recordEmailLog({
          recipient: targetAdminEmail,
          company: 'FuelNest Admin Alert',
          username: 'admin.fuelnest',
          status: 'delivered',
          method: 'resend'
        });
        return { success: true, method: 'resend' };
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.warn('[Admin Alert Resend error]:', errJson);
      }
    } catch (e: any) {
      console.warn('[Admin Alert Resend error]:', e?.message || e);
    }
  }

  // 3. Fallback log
  recordEmailLog({
    recipient: targetAdminEmail,
    company: 'FuelNest Admin Alert',
    username: 'admin.fuelnest',
    status: 'recorded_locally',
    method: 'system_log'
  });
  return { success: true, method: 'system_log' };
}

// -------------------------------------------------------------
// Automated Tenant Provisioning & Default Credential Engine
// -------------------------------------------------------------
async function provisionNewTenant(payload: {
  company_name: string;
  admin_name?: string;
  email: string;
  phone?: string;
  plan_id: string; // 'trial_3days' | 'plan_1month' | 'plan_3months' | 'plan_6months' | 'plan_12months'
  max_vehicles?: number;
  custom_price?: number;
  address?: string;
  origin?: string;
  payment_completed?: boolean;
  payment_method?: string;
  transaction_id?: string;
  send_email?: boolean;
  initial_status?: 'active' | 'suspended' | 'pending';
  is_approved?: boolean;
  password?: string;
}) {
  const companyName = String(payload.company_name || 'Fleet Company').trim();
  const words = companyName.split(/\s+/).filter(Boolean);
  const firstWord = (words[0] || 'Fleet').replace(/[^a-zA-Z0-9]/g, '');
  const cleanCode = (words.length > 1
    ? words.map(w => w[0]).join('')
    : firstWord
  ).toUpperCase().substring(0, 8);

  const existingTenants = loadTenants();
  const dbTenants = await fetchTenantsFromDB().catch(() => null);
  const allKnownTenants = [...existingTenants, ...(dbTenants || [])];

  // Guaranteed unique tenant ID with timestamp to prevent any collisions or client tombstone caching
  const uniqueSuffix = Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const tenantId = `tenant_${firstWord.toLowerCase()}_${uniqueSuffix}`;

  // Ensure unique code to avoid MySQL UNIQUE KEY idx_tenants_code collisions
  let baseCode = cleanCode.length < 3 ? `${cleanCode}FLT` : cleanCode;
  let tenantCode = baseCode;
  let codeCounter = 1;
  while (allKnownTenants.some(t => t && t.code && t.code.toUpperCase() === tenantCode.toUpperCase())) {
    tenantCode = `${baseCode}${codeCounter++}`.substring(0, 16);
  }

  // 2. Super Admin Username: FirstWord_admin (guaranteed unique)
  const baseUsername = `${firstWord.toLowerCase()}_admin`;
  let superAdminUsername = baseUsername;
  let userCounter = 1;
  const existingUsers = loadUsers();
  const dbUsers = await fetchUsersFromDB().catch(() => null);
  const allKnownUsers = [...existingUsers, ...(dbUsers || [])];
  while (allKnownUsers.some(u => u && u.username && u.username.toLowerCase() === superAdminUsername.toLowerCase())) {
    superAdminUsername = `${baseUsername}_${userCounter++}`;
  }

  // 3. Password: User provided or FirstWord@12345
  const capitalizedWord = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  const rawPassword = payload.password && String(payload.password).trim().length >= 6
    ? String(payload.password).trim()
    : `${capitalizedWord}@12345`;
  const temporaryPassword = rawPassword;
  const hashedPassword = isHashed(temporaryPassword) ? temporaryPassword : hashPassword(temporaryPassword);

  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const planId = (payload.plan_id || 'trial_3days').toLowerCase();

  let endDateObj = new Date(today);
  let durationType: 'days' | 'months' | 'years' = 'months';
  let durationVal = 1;
  let priceBdt = 749;
  let planNameEn = '1 Month Plan (749 BDT)';
  let isTrial = false;
  let isPaidPlan = true;

  if (planId === 'trial_3days' || planId === 'trial') {
    endDateObj.setDate(endDateObj.getDate() + 3);
    durationType = 'days';
    durationVal = 3;
    priceBdt = 0;
    planNameEn = '3 Days Free Trial';
    isTrial = true;
    isPaidPlan = false;
  } else if (planId === 'plan_1month' || planId === 'starter') {
    endDateObj.setMonth(endDateObj.getMonth() + 1);
    durationType = 'months';
    durationVal = 1;
    priceBdt = 749;
    planNameEn = '1 Month Plan (749 BDT)';
  } else if (planId === 'plan_3months' || planId === 'pro') {
    endDateObj.setMonth(endDateObj.getMonth() + 3);
    durationType = 'months';
    durationVal = 3;
    priceBdt = 2199;
    planNameEn = '3 Months Plan (2,199 BDT)';
  } else if (planId === 'plan_6months') {
    endDateObj.setMonth(endDateObj.getMonth() + 6);
    durationType = 'months';
    durationVal = 6;
    priceBdt = 3999;
    planNameEn = '6 Months Plan (3,999 BDT)';
  } else if (planId === 'plan_12months' || planId === 'enterprise') {
    endDateObj.setFullYear(endDateObj.getFullYear() + 1);
    durationType = 'years';
    durationVal = 1;
    priceBdt = 7999;
    planNameEn = 'VIP Plan (7,999 BDT)';
  }

  if (payload.custom_price !== undefined && payload.custom_price !== null && !isNaN(Number(payload.custom_price))) {
    priceBdt = Number(payload.custom_price);
  }

  const endDate = endDateObj.toISOString().split('T')[0];
  const maxVehicles = payload.max_vehicles || 100;
  const maxUsers = 25;
  const maxPumps = 15;

  const isActuallyPaid = isTrial || Boolean(payload.payment_completed);
  const initialStatus = payload.initial_status || (isActuallyPaid ? 'active' : 'pending');
  const isApproved = payload.is_approved !== undefined ? Boolean(payload.is_approved) : (initialStatus === 'active');
  const initialPaymentStatus = isTrial ? 'trial' : (isActuallyPaid ? 'paid' : 'due');

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
    is_approved: isApproved,
    deleted_at: null,
    created_at: startDate,
    subscription: {
      plan: planId as any,
      plan_name_bn: planNameEn,
      status: initialStatus,
      is_approved: isApproved,
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
      notes: isTrial
        ? '3-Day Free Trial (Landing Page Registration - Pending Master Control approval)'
        : `Subscription - Plan: ${planNameEn} (${payload.payment_method || 'Online Checkout'} - Pending Master Control approval)`
    }
  };

  const newSuperAdminUser: any = {
    id: `usr_${tenantId}_admin`,
    tenant_id: tenantId,
    name: payload.admin_name || `${companyName} Administrator`,
    email: payload.email,
    username: superAdminUsername,
    password: hashedPassword,
    phone: payload.phone || '',
    role: 'super_admin',
    role_title_bn: 'Company Super Admin',
    status: initialStatus === 'active' ? 'active' : 'suspended',
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

  // Persist to DB with atomic transaction
  try {
    await registerTenantWithTransaction({ tenant: newTenant, user: newSuperAdminUser });
  } catch (dbErr) {
    console.warn('[DB] Transaction fallback to individual upserts:', dbErr);
    await upsertTenantInDB(newTenant).catch(() => {});
    await upsertUserInDB(newSuperAdminUser).catch(() => {});
  }

  // Dispatch Welcome Email only if explicitly requested
  const loginUrl = 'https://fuelnest.xyz/login';
  let emailRes: any = { delivered: false, reason: 'Manual master admin approval flow active' };
  if (payload.send_email) {
    emailRes = await sendWelcomeEmail({
      email: payload.email,
      companyName,
      username: superAdminUsername,
      tempPassword: temporaryPassword,
      loginUrl,
      planName: planNameEn
    });
  }

  return {
    success: true,
    tenant: newTenant,
    user: newSuperAdminUser,
    super_admin_username: superAdminUsername,
    temporary_password: temporaryPassword,
    login_url: loginUrl,
    email_status: emailRes
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
    const dbTenants = await fetchTenantsFromDB().catch(() => null);
    const fileTenants = loadTenants();
    const combined = Array.isArray(dbTenants) && dbTenants.length > 0 ? [...dbTenants] : [...fileTenants];
    fileTenants.forEach(ft => {
      if (ft && ft.id && !combined.some(ct => ct.id === ft.id)) {
        combined.unshift(ft);
      }
    });
    activeTenants = combined;

    // Return non-deleted active tenants for login dropdown
    const publicCompanies = activeTenants
      .filter(t => !t.deleted_at && (t.status === 'active' || t.subscription?.status === 'active'))
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

  // 2. GET /api/tenants/all & /api/owner/subscribers - Full subscriber list for SaaS Master Control Panel (Includes Pending, Active & Suspended)
  const handleGetAllSubscribers = async (req: Request, res: Response) => {
    const dbTenants = await fetchTenantsFromDB().catch(() => null);
    if (dbTenants !== null) {
      activeTenants = dbTenants;
      saveTenants(activeTenants);
    } else {
      activeTenants = loadTenants();
    }
    res.json({
      success: true,
      data: activeTenants.filter(t => t && !t.deleted_at),
      timestamp: new Date().toISOString()
    });
  };

  app.get('/api/tenants/all', handleGetAllSubscribers);
  app.get('/api/owner/subscribers', handleGetAllSubscribers);

  // 2.b POST /api/saas/wipe-all-subscribers - Complete wipe of all subscribers and database data
  app.post('/api/saas/wipe-all-subscribers', async (req: Request, res: Response) => {
    try {
      await wipeAllDataFromDB().catch(e => console.warn('[MySQL wipe warning]:', e));
      activeTenants = [];
      saveTenants([]);
      activeUsers = [];
      saveUsers([]);
      const emptyFleet = {
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
      saveFleetData(emptyFleet);
      saveRegistrationRequests([]);
      try {
        fs.writeFileSync(path.join(DATA_DIR, 'email_logs.json'), JSON.stringify([], null, 2), 'utf-8');
      } catch (e) {}

      res.json({
        success: true,
        message: 'All subscriber accounts, demo data, and associated database records completely deleted.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error wiping subscribers' });
    }
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

      // 🚨 CRITICAL: Instant Notification Email to admin.fuelnest@gmail.com
      sendAdminNotificationEmail({
        subject: `🚨 [New Subscriber Added] ${tenantRecord.name} (${tenantRecord.code})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 18px 22px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">🚨 New Subscriber Workspace Created</h2>
              <p style="color: #451a03; margin: 4px 0 0 0; font-size: 13px; font-weight: 600;">FuelNest Telemetry Cloud &bull; Alert for admin.fuelnest@gmail.com</p>
            </div>
            
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              A new subscriber has been added to FuelNest. Here are the subscriber details:
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; background-color: #f8fafc; border-radius: 8px; overflow: hidden;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b; width: 35%;">Company Name:</td>
                <td style="padding: 10px 12px; font-weight: 800; color: #0f172a; font-size: 14px;">${tenantRecord.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Workspace Code:</td>
                <td style="padding: 10px 12px; font-weight: 800; color: #0284c7;">${tenantRecord.code}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Contact Person:</td>
                <td style="padding: 10px 12px; color: #0f172a; font-weight: 600;">${tenantRecord.contact_person || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Email Address:</td>
                <td style="padding: 10px 12px; color: #0284c7; font-weight: bold;">${tenantRecord.email || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Phone / WhatsApp:</td>
                <td style="padding: 10px 12px; color: #0f172a;">${tenantRecord.phone || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Plan:</td>
                <td style="padding: 10px 12px; color: #d97706; font-weight: 800;">${tenantRecord.subscription?.plan_name_bn || tenantRecord.subscription?.plan || 'Active Plan'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Status:</td>
                <td style="padding: 10px 12px; color: #16a34a; font-weight: 800;">${(tenantRecord.status || 'active').toUpperCase()}</td>
              </tr>
            </table>

            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 22px;">
              FuelNest Telemetry Cloud &bull; Auto-dispatched to admin.fuelnest@gmail.com
            </p>
          </div>
        `
      }).catch(err => console.warn('[Subscriber create admin notification error]:', err));

      // Telegram alert
      sendTelegramAlert(`🏢 <b>Manual Subscriber Created (ACTIVE)</b>\n\n<b>Company:</b> ${tenantRecord.name}\n<b>Tenant Code:</b> ${tenantRecord.code}\n<b>Plan:</b> ${tenantRecord.subscription?.plan || 'Active Plan'}\n<b>Status:</b> ACTIVE (Approved Immediately)\n<b>Valid Until:</b> ${tenantRecord.subscription?.end_date || 'N/A'}\n\n👉 <a href="https://fuelnest.xyz/control-panel/subscribers">Manage in Control Panel</a>`).catch(() => {});

      res.status(201).json({
        success: true,
        message: 'Subscriber created and synchronized across all sessions successfully.',
        tenant: tenantRecord
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Server error creating tenant' });
    }
  };

  app.post('/api/tenants', handleCreateTenantRecord);
  app.post('/api/owner/subscribers/create', handleCreateTenantRecord);

  // 4. PATCH /api/tenants/:id/status - Suspend, Activate, or Inactivate Tenant (ISSUE 2 Fix)
  app.patch('/api/tenants/:id/status', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'suspended' | 'inactive'

    const fileTenants = loadTenants();
    const dbTenants = await fetchTenantsFromDB().catch(() => null);
    activeTenants = Array.isArray(dbTenants) && dbTenants.length > 0 ? dbTenants : fileTenants;
    fileTenants.forEach(ft => {
      if (ft && ft.id && !activeTenants.some(ct => ct.id === ft.id)) {
        activeTenants.unshift(ft);
      }
    });

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

    // Update corresponding users for this tenant
    activeUsers = loadUsers();
    let usersUpdated = false;
    for (const u of activeUsers) {
      if (u.tenant_id === id) {
        u.status = status === 'active' ? 'active' : 'suspended';
        usersUpdated = true;
        await upsertUserInDB(u).catch(e => console.warn('[MySQL] User status update error:', e));
      }
    }
    if (usersUpdated) {
      saveUsers(activeUsers);
    }

    // Also update any linked registration request status
    const reqs = loadRegistrationRequests();
    let reqsChanged = false;
    reqs.forEach((r: any) => {
      if (r.tenant_id === id) {
        if (status === 'active') {
          r.status = 'approved';
          r.approved_at = new Date().toISOString();
        } else if (status === 'suspended') {
          r.status = 'pending';
        }
        reqsChanged = true;
      }
    });
    if (reqsChanged) {
      saveRegistrationRequests(reqs);
    }

    res.json({
      success: true,
      message: `Tenant ${tenant.name} status updated to ${status}.`,
      tenant,
      super_admin_username: tenant.subscription?.super_admin_username,
      temporary_password: tenant.subscription?.super_admin_password
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
      saveRegistrationRequests(loadRegistrationRequests().filter(r => r.tenant_id !== id));

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
      saveRegistrationRequests(loadRegistrationRequests().filter(r => r.tenant_id !== id));

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
  // Subscription Manual Upgrade & Payment Verification Routes
  // bKash, Nagad, Rocket, Bank Transfer manual verification by Master Control
  // -------------------------------------------------------------
  app.get('/api/subscription-payments', (req: Request, res: Response) => {
    try {
      const list = loadSubscriptionPayments();
      res.json({ success: true, data: list });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message || 'Error fetching subscription payments' });
    }
  });

  app.post('/api/subscription-payments', async (req: Request, res: Response) => {
    try {
      const {
        tenant_id, tenant_name, user_id, user_name, user_email, user_phone,
        plan_id, plan_name, plan_days, amount_bdt, payment_method,
        sender_number, transaction_id, payment_date, receipt_image, notes
      } = req.body;

      if (!tenant_id || !transaction_id || !payment_method) {
        res.status(400).json({ success: false, message: 'Tenant ID, payment method, and Transaction ID (TrxID) are required.' });
        return;
      }

      const payments = loadSubscriptionPayments();
      const newPayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tenant_id,
        tenant_name: tenant_name || 'Subscriber Workspace',
        user_id: user_id || 'system',
        user_name: user_name || 'Admin',
        user_email: user_email || '',
        user_phone: user_phone || '',
        plan_id: plan_id || 'plan_1month',
        plan_name: plan_name || '1 Month Plan',
        plan_days: Number(plan_days) || 30,
        amount_bdt: Number(amount_bdt) || 0,
        payment_method: payment_method || 'bkash',
        sender_number: sender_number || '',
        transaction_id: String(transaction_id).trim().toUpperCase(),
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        receipt_image: receipt_image || '',
        notes: notes || '',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      payments.unshift(newPayment);
      saveSubscriptionPayments(payments);

      // Instant notification email to admin.fuelnest@gmail.com
      const alertSubject = `🚨 New Subscription Upgrade Payment Received - ${newPayment.tenant_name} (${newPayment.amount_bdt} BDT / ${newPayment.payment_method.toUpperCase()})`;
      const alertText = `A subscriber has submitted manual payment verification for renewal/upgrade:
Company: ${newPayment.tenant_name}
Plan: ${newPayment.plan_name} (${newPayment.plan_days} Days)
Amount: ${newPayment.amount_bdt} BDT
Method: ${newPayment.payment_method.toUpperCase()}
Sender No / Account: ${newPayment.sender_number}
Transaction ID (TrxID): ${newPayment.transaction_id}
Payment Date: ${newPayment.payment_date}

Please visit Master Control -> Approvals -> Payment Verification to match with bank/MFS statement and approve validity extension.`;
      sendAdminNotificationEmail({
        subject: alertSubject,
        text: alertText,
        html: `<div style="font-family:sans-serif;padding:16px;">
          <h2 style="color:#d97706;">🚨 New Subscription Payment Received</h2>
          <p><strong>Company:</strong> ${newPayment.tenant_name}</p>
          <p><strong>Plan:</strong> ${newPayment.plan_name} (+${newPayment.plan_days} Days)</p>
          <p><strong>Amount:</strong> ${newPayment.amount_bdt} BDT</p>
          <p><strong>Method:</strong> ${newPayment.payment_method.toUpperCase()}</p>
          <p><strong>Sender No / Account:</strong> ${newPayment.sender_number}</p>
          <p><strong>Transaction ID (TrxID):</strong> <span style="font-family:monospace;font-size:16px;color:#d97706;font-weight:bold;">${newPayment.transaction_id}</span></p>
          <p><strong>Payment Date:</strong> ${newPayment.payment_date}</p>
          <hr/>
          <p>Please log in to <strong>FuelNest Master Control &rarr; Approvals &rarr; Payment Verifications</strong> to verify against statement and click Approve.</p>
        </div>`
      }).catch(e => console.warn('[Payment Alert Email] Error:', e));

      res.status(201).json({
        success: true,
        payment: newPayment,
        message: 'Payment verification details submitted successfully. Master Control will verify and activate your validity.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error submitting payment' });
    }
  });

  app.post('/api/subscription-payments/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewed_by } = req.body;
      const reviewer = reviewed_by || 'Master Administrator';
      const now = new Date().toISOString();

      const payments = loadSubscriptionPayments();
      const pIdx = payments.findIndex(p => p.id === id);
      if (pIdx < 0) {
        res.status(404).json({ success: false, message: 'Payment record not found.' });
        return;
      }

      const paymentRecord = payments[pIdx];
      const tenants = loadTenants();
      const tIdx = tenants.findIndex(t => t.id === paymentRecord.tenant_id);
      if (tIdx < 0) {
        res.status(404).json({ success: false, message: 'Associated subscriber workspace not found.' });
        return;
      }

      const tenant = tenants[tIdx];
      const addDays = Number(paymentRecord.plan_days) || 30;
      let baseDate = new Date();
      const currentEndStr = tenant.subscription?.end_date;
      if (currentEndStr) {
        const currentEndDate = new Date(currentEndStr);
        if (currentEndDate.getTime() > Date.now()) {
          baseDate = currentEndDate;
        }
      }
      baseDate.setDate(baseDate.getDate() + addDays);
      const newEndDate = baseDate.toISOString().split('T')[0];

      // Update tenant
      const updatedTenant = {
        ...tenant,
        status: 'active',
        is_approved: true,
        subscription: {
          ...(tenant.subscription || {}),
          status: 'active',
          is_approved: true,
          plan: paymentRecord.plan_id,
          plan_name_bn: paymentRecord.plan_name,
          start_date: tenant.subscription?.start_date || new Date().toISOString().split('T')[0],
          end_date: newEndDate,
          price_bdt: Number(paymentRecord.amount_bdt),
          payment_status: 'paid'
        }
      };
      tenants[tIdx] = updatedTenant;
      saveTenants(tenants);

      // Reactivate tenant users if suspended
      const users = loadUsers();
      let usersChanged = false;
      users.forEach(u => {
        if (u.tenant_id === tenant.id && u.status === 'suspended') {
          u.status = 'active';
          usersChanged = true;
        }
      });
      if (usersChanged) saveUsers(users);

      // Update payment record
      paymentRecord.status = 'approved';
      paymentRecord.reviewed_by = reviewer;
      paymentRecord.reviewed_at = now;
      saveSubscriptionPayments(payments);

      // Alert email confirming approval
      const apprSubject = `✅ Payment Verified & Subscription Extended - ${tenant.name} (+${addDays} Days)`;
      const apprText = `Master Control has approved payment TrxID: ${paymentRecord.transaction_id} for ${tenant.name}. New subscription validity is now ${newEndDate} (+${addDays} Days extended).`;
      sendAdminNotificationEmail({
        subject: apprSubject,
        text: apprText,
        html: `<div style="font-family:sans-serif;padding:16px;">
          <h2 style="color:#059669;">✅ Payment Verified & Subscription Extended</h2>
          <p><strong>Company:</strong> ${tenant.name}</p>
          <p><strong>Transaction ID (TrxID):</strong> ${paymentRecord.transaction_id}</p>
          <p><strong>Extension Period:</strong> +${addDays} Days</p>
          <p><strong>New Expiry Date:</strong> ${newEndDate}</p>
          <p><strong>Status:</strong> Active</p>
        </div>`
      }).catch(() => {});

      res.json({
        success: true,
        message: `Payment verified & approved! Subscription validity for "${tenant.name}" extended until ${newEndDate} (+${addDays} days).`,
        new_end_date: newEndDate,
        extended_days: addDays,
        tenant: updatedTenant
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error approving payment' });
    }
  });

  app.post('/api/subscription-payments/:id/reject', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reviewed_by, reason } = req.body;
      const reviewer = reviewed_by || 'Master Administrator';
      const rejectionReason = reason || 'TrxID could not be matched with bank/MFS statement';
      const now = new Date().toISOString();

      const payments = loadSubscriptionPayments();
      const pIdx = payments.findIndex(p => p.id === id);
      if (pIdx < 0) {
        res.status(404).json({ success: false, message: 'Payment record not found.' });
        return;
      }

      payments[pIdx].status = 'rejected';
      payments[pIdx].reviewed_by = reviewer;
      payments[pIdx].reviewed_at = now;
      payments[pIdx].rejection_reason = rejectionReason;
      saveSubscriptionPayments(payments);

      res.json({
        success: true,
        message: 'Payment verification marked as rejected.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Error rejecting payment' });
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
  // Submissions immediately provision a workspace in PENDING state awaiting Master Control approval.
  const handleSubscriberRegister = async (req: Request, res: Response) => {
    try {
      const { company_name, admin_name, email, phone, plan_id, payment_completed, payment_method, transaction_id, password } = req.body;

      if (!company_name || !email) {
        return res.status(400).json({ success: false, message: 'Company name and email are required.' });
      }

      let planNameEn = '3 Days Free Trial';
      let isTrial = true;
      let priceBdt = 0;
      const pid = plan_id || 'trial_3days';

      if (pid === 'trial_3days' || pid === 'trial') {
        planNameEn = '3 Days Free Trial';
        isTrial = true;
        priceBdt = 0;
      } else if (pid === 'plan_1month' || pid === 'starter') {
        planNameEn = '1 Month Plan (749 BDT)';
        isTrial = false;
        priceBdt = 749;
      } else if (pid === 'plan_3months' || pid === 'pro') {
        planNameEn = '3 Months Plan (2,199 BDT)';
        isTrial = false;
        priceBdt = 2199;
      } else if (pid === 'plan_6months') {
        planNameEn = '6 Months Plan (3,999 BDT)';
        isTrial = false;
        priceBdt = 3999;
      } else if (pid === 'plan_12months' || pid === 'enterprise') {
        planNameEn = 'VIP Plan (7,999 BDT)';
        isTrial = false;
        priceBdt = 7999;
      }

      const origin = req.protocol + '://' + req.get('host');

      // 1. Immediately provision the tenant subscription and user in PENDING state (MySQL Transaction Safe)
      const provisionResult = await provisionNewTenant({
        company_name: String(company_name).trim(),
        admin_name: String(admin_name || company_name + ' Admin').trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone || '').trim(),
        password: password ? String(password).trim() : (req.body.password ? String(req.body.password).trim() : undefined),
        plan_id: pid,
        payment_completed: Boolean(payment_completed || isTrial),
        payment_method: payment_method || (isTrial ? 'Free Trial' : 'Online Payment'),
        transaction_id: transaction_id ? String(transaction_id).trim() : '',
        origin,
        send_email: false,
        initial_status: 'pending', // PENDING STATE AWAITING MASTER CONTROL APPROVAL
        is_approved: false
      });

      const reqId = `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newRequest = {
        id: reqId,
        company_name: String(company_name).trim(),
        admin_name: String(admin_name || company_name + ' Admin').trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone || '').trim(),
        plan_id: pid,
        plan_name: planNameEn,
        is_trial: isTrial,
        price_bdt: priceBdt,
        payment_completed: Boolean(payment_completed || isTrial),
        payment_method: payment_method || (isTrial ? 'Free Trial' : 'Online Payment'),
        transaction_id: transaction_id ? String(transaction_id).trim() : '',
        status: 'pending', // Pending manual Master Control approval
        is_approved: false,
        tenant_id: provisionResult.tenant.id,
        super_admin_username: provisionResult.super_admin_username,
        temporary_password: provisionResult.temporary_password,
        login_url: provisionResult.login_url,
        created_at: new Date().toISOString()
      };

      const requests = loadRegistrationRequests();
      requests.unshift(newRequest);
      saveRegistrationRequests(requests);

      // 🚨 CRITICAL: Instant Notification Email to admin.fuelnest@gmail.com
      // Allows Platform Owner to immediately review & activate the new subscriber's workspace
      sendAdminNotificationEmail({
        subject: `🚨 [New Subscriber Registered] ${newRequest.company_name} (${newRequest.plan_name})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 18px 22px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">🚨 New Subscriber Registration</h2>
              <p style="color: #451a03; margin: 4px 0 0 0; font-size: 13px; font-weight: 600;">FuelNest Cloud &bull; Immediate Approval Alert</p>
            </div>
            
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              A new subscriber has just submitted registration on FuelNest. Please review the company information below and activate their workspace.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; background-color: #f8fafc; border-radius: 8px; overflow: hidden;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b; width: 35%;">Company Name:</td>
                <td style="padding: 10px 12px; font-weight: 800; color: #0f172a; font-size: 14px;">${newRequest.company_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Admin Contact:</td>
                <td style="padding: 10px 12px; color: #0f172a; font-weight: 600;">${newRequest.admin_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Email Address:</td>
                <td style="padding: 10px 12px; color: #0284c7; font-weight: bold;"><a href="mailto:${newRequest.email}">${newRequest.email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Phone / WhatsApp:</td>
                <td style="padding: 10px 12px; color: #0f172a;"><a href="tel:${newRequest.phone}">${newRequest.phone || 'N/A'}</a> &bull; <a href="https://wa.me/${String(newRequest.phone || '').replace(/[^0-9]/g, '')}" target="_blank">Chat WhatsApp</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Chosen Plan:</td>
                <td style="padding: 10px 12px; color: #d97706; font-weight: 800;">${newRequest.plan_name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Payment Method:</td>
                <td style="padding: 10px 12px; color: #0f172a;">${newRequest.payment_method || 'N/A'}</td>
              </tr>
              ${newRequest.transaction_id ? `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Transaction ID (TrxID):</td>
                <td style="padding: 10px 12px; font-family: monospace; font-weight: 800; color: #059669; font-size: 14px;">${newRequest.transaction_id}</td>
              </tr>
              ` : ''}
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Account Status:</td>
                <td style="padding: 10px 12px; color: #ea580c; font-weight: 800;">PENDING MASTER APPROVAL</td>
              </tr>
            </table>

            <div style="text-align: center; margin: 26px 0 16px 0;">
              <a href="https://fuelnest.xyz/master-control" style="background: #0f172a; color: #f59e0b; padding: 13px 26px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 14px; display: inline-block;">
                ⚡ Open Master Control Panel to Approve
              </a>
            </div>
            
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 22px;">
              FuelNest Telemetry Cloud &bull; Auto-dispatched to admin.fuelnest@gmail.com
            </p>
          </div>
        `
      }).catch(err => console.warn('[Subscriber registration email notification error]:', err));

      // Return confirmation of submission
      return res.status(201).json({
        success: true,
        pending_approval: true,
        status: 'pending',
        is_approved: false,
        tenant_id: provisionResult.tenant.id,
        tenant: provisionResult.tenant,
        message: 'Registration application submitted successfully. Workspace created in PENDING status awaiting Master Control approval.',
        request: {
          id: newRequest.id,
          company_name: newRequest.company_name,
          admin_name: newRequest.admin_name,
          email: newRequest.email,
          phone: newRequest.phone,
          plan_id: newRequest.plan_id,
          plan_name: newRequest.plan_name,
          is_trial: newRequest.is_trial,
          payment_method: newRequest.payment_method,
          transaction_id: newRequest.transaction_id,
          status: newRequest.status,
          is_approved: false,
          created_at: newRequest.created_at
        }
      });
    } catch (err: any) {
      console.error('[Registration Error]:', err);
      return res.status(500).json({ success: false, message: err?.message || 'Registration error' });
    }
  };

  app.post('/api/subscribers/register', handleSubscriberRegister);
  app.post('/api/register', handleSubscriberRegister);

  // -------------------------------------------------------------
  // Public Contact Form Endpoint (Dispatches to admin.fuelnest@gmail.com)
  // -------------------------------------------------------------
  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const { name, email, phone, company_name, subject, message } = req.body || {};

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required fields.'
        });
      }

      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newMsg = {
        id: msgId,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: String(phone || '').trim(),
        company_name: String(company_name || '').trim(),
        subject: String(subject || 'General Inquiry').trim(),
        message: String(message).trim(),
        status: 'unread',
        created_at: new Date().toISOString()
      };

      const messages = loadContactMessages();
      messages.unshift(newMsg);
      saveContactMessages(messages);

      // Instant Email Dispatch to admin.fuelnest@gmail.com
      sendAdminNotificationEmail({
        subject: `📬 [Contact Inquiry] ${newMsg.name}: ${newMsg.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #0284c7, #0369a1); padding: 18px 22px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">📬 New Website Contact Message</h2>
              <p style="color: #bae6fd; margin: 4px 0 0 0; font-size: 13px;">FuelNest Commercial Fleet Telemetry</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; background-color: #f8fafc; border-radius: 8px;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b; width: 30%;">From:</td>
                <td style="padding: 10px 12px; font-weight: 800; color: #0f172a;">${newMsg.name} ${newMsg.company_name ? `(${newMsg.company_name})` : ''}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Email:</td>
                <td style="padding: 10px 12px; color: #0284c7; font-weight: bold;"><a href="mailto:${newMsg.email}">${newMsg.email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Phone / WhatsApp:</td>
                <td style="padding: 10px 12px; color: #0f172a;"><a href="tel:${newMsg.phone}">${newMsg.phone || 'N/A'}</a> &bull; <a href="https://wa.me/${String(newMsg.phone || '').replace(/[^0-9]/g, '')}" target="_blank">WhatsApp Chat</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: bold; color: #64748b;">Subject:</td>
                <td style="padding: 10px 12px; font-weight: 800; color: #0f172a;">${newMsg.subject}</td>
              </tr>
            </table>

            <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <strong style="color: #334155; display: block; margin-bottom: 8px; font-size: 13px;">Message Content:</strong>
              <p style="white-space: pre-wrap; margin: 0; color: #0f172a; font-size: 13px; line-height: 1.6;">${newMsg.message}</p>
            </div>

            <div style="text-align: center; margin: 24px 0 12px 0;">
              <a href="mailto:${newMsg.email}?subject=${encodeURIComponent('Re: ' + newMsg.subject)}" style="background: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 14px; display: inline-block;">
                ✉️ Reply via Email to ${newMsg.email}
              </a>
            </div>

            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px;">
              FuelNest Telemetry Cloud &bull; Auto-dispatched to admin.fuelnest@gmail.com
            </p>
          </div>
        `
      }).catch(e => console.warn('[Contact alert dispatch error]:', e));

      return res.status(200).json({
        success: true,
        message: 'Thank you for reaching out! Your message has been sent to our team at admin.fuelnest@gmail.com. We will reply promptly.'
      });
    } catch (err: any) {
      console.error('[Contact Error]:', err);
      return res.status(500).json({
        success: false,
        message: err?.message || 'Error processing contact form submission'
      });
    }
  });

  // -------------------------------------------------------------
  // Public CMS Content Endpoint (Dynamic content for Landing, About, Contact, Privacy, Terms, FAQ)
  // -------------------------------------------------------------
  app.get('/api/public/content', (req: Request, res: Response) => {
    try {
      const content = loadSiteContent();
      res.json({ success: true, content });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Master Control CMS Content Update
  app.post('/api/owner/content', (req: Request, res: Response) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'object') {
        return res.status(400).json({ success: false, message: 'Valid content payload is required.' });
      }
      saveSiteContent(content);
      res.json({
        success: true,
        message: 'Site content and page copywriting updated successfully.',
        content
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Master Control Contact Messages Inbox
  app.get('/api/owner/contact-messages', (req: Request, res: Response) => {
    try {
      const messages = loadContactMessages();
      res.json({ success: true, messages });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Delete Contact Message
  app.delete('/api/owner/contact-messages/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const messages = loadContactMessages();
      const filtered = messages.filter((m: any) => m.id !== id);
      saveContactMessages(filtered);
      res.json({ success: true, message: 'Message removed successfully.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Direct Tenant Plan Approval Endpoint for Master Control Panel
  const handleApproveTenant = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { approved_by } = req.body || {};

      // 1. Transaction-safe approval in MySQL
      await approveTenantWithTransaction(id).catch(async () => {
        await updateTenantStatusInDB(id, 'active').catch(() => {});
      });

      // 2. Update activeTenants in memory & disk
      const fileTenants = loadTenants();
      const dbTenants = await fetchTenantsFromDB().catch(() => null);
      activeTenants = Array.isArray(dbTenants) && dbTenants.length > 0 ? dbTenants : fileTenants;
      const targetTenant = activeTenants.find(t => t.id === id);
      if (targetTenant) {
        targetTenant.status = 'active';
        targetTenant.is_approved = true;
        if (targetTenant.subscription) {
          targetTenant.subscription.status = 'active';
          targetTenant.subscription.is_approved = true;
        }
        saveTenants(activeTenants);
      }

      // 3. Activate associated admin users
      activeUsers = loadUsers();
      let activatedUser: any = null;
      activeUsers.forEach(u => {
        if (u.tenant_id === id) {
          u.status = 'active';
          activatedUser = u;
          upsertUserInDB(u).catch(() => {});
        }
      });
      saveUsers(activeUsers);

      // 4. Mark registration request as approved
      const requests = loadRegistrationRequests();
      const reqItem = requests.find((r: any) => r.tenant_id === id);
      if (reqItem) {
        reqItem.status = 'approved';
        reqItem.is_approved = true;
        reqItem.approved_at = new Date().toISOString();
        reqItem.approved_by = approved_by || 'Platform Owner';
        saveRegistrationRequests(requests);
      }

      return res.json({
        success: true,
        tenant_id: id,
        status: 'active',
        is_approved: true,
        message: `Plan approved for "${targetTenant?.name || id}". Workspace is now ACTIVE and login access is enabled.`,
        tenant: targetTenant,
        user: activatedUser
      });
    } catch (err: any) {
      console.error('[Approval Error]:', err);
      return res.status(500).json({ success: false, message: err?.message || 'Error approving plan' });
    }
  };

  app.post('/api/tenants/:id/approve', handleApproveTenant);
  app.post('/api/owner/subscribers/:id/approve', handleApproveTenant);

  // Get all subscriber registration requests for Master Control
  app.get('/api/subscribers/registration-requests', (req: Request, res: Response) => {
    try {
      const requests = loadRegistrationRequests();
      res.json({ success: true, count: requests.length, requests });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Approve / Unsuspend a registration request: activates the tenant workspace and returns credentials
  app.post('/api/subscribers/registration-requests/:id/approve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const requests = loadRegistrationRequests();
      const index = requests.findIndex((r: any) => r.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Registration request not found.' });
      }

      const item = requests[index];

      // If already approved, return stored credentials
      if (item.status === 'approved' && item.super_admin_username) {
        return res.json({
          success: true,
          message: 'This workspace is already active.',
          already_approved: true,
          request: item,
          super_admin_username: item.super_admin_username,
          temporary_password: item.temporary_password,
          login_url: item.login_url || 'https://fuelnest.xyz/login'
        });
      }

      const origin = req.protocol + '://' + req.get('host');

      let targetTenant: any = null;
      let targetUser: any = null;
      let superAdminUsername = item.super_admin_username;
      let temporaryPassword = item.temporary_password;
      let loginUrl = item.login_url || 'https://fuelnest.xyz/login';

      // If tenant already provisioned in suspended state, unsuspend it now
      if (item.tenant_id) {
        const fileTenants = loadTenants();
        const dbTenants = await fetchTenantsFromDB().catch(() => null);
        activeTenants = Array.isArray(dbTenants) && dbTenants.length > 0 ? dbTenants : fileTenants;
        fileTenants.forEach(ft => {
          if (ft && ft.id && !activeTenants.some(ct => ct.id === ft.id)) {
            activeTenants.unshift(ft);
          }
        });
        targetTenant = activeTenants.find(t => t.id === item.tenant_id);
        if (targetTenant) {
          targetTenant.status = 'active';
          if (targetTenant.subscription) {
            targetTenant.subscription.status = 'active';
            targetTenant.subscription.payment_status = item.is_trial ? 'trial' : 'paid';
          }
          saveTenants(activeTenants);
          await updateTenantStatusInDB(targetTenant.id, 'active').catch(() => {});

          // Activate user
          activeUsers = loadUsers();
          for (const u of activeUsers) {
            if (u.tenant_id === item.tenant_id) {
              u.status = 'active';
              targetUser = u;
              await upsertUserInDB(u).catch(() => {});
            }
          }
          saveUsers(activeUsers);

          superAdminUsername = targetTenant.subscription?.super_admin_username || item.super_admin_username;
          temporaryPassword = targetTenant.subscription?.super_admin_password || item.temporary_password;
        }
      }

      // If tenant wasn't provisioned yet (legacy fallback), provision now
      if (!targetTenant) {
        const provisionResult = await provisionNewTenant({
          company_name: item.company_name,
          admin_name: item.admin_name,
          email: item.email,
          phone: item.phone,
          plan_id: item.plan_id,
          payment_completed: true,
          payment_method: item.payment_method,
          transaction_id: item.transaction_id,
          origin,
          send_email: false,
          initial_status: 'active'
        });
        targetTenant = provisionResult.tenant;
        targetUser = provisionResult.user;
        superAdminUsername = provisionResult.super_admin_username;
        temporaryPassword = provisionResult.temporary_password;
        loginUrl = provisionResult.login_url;
        item.tenant_id = targetTenant.id;
      }

      // Update registration record
      item.status = 'approved';
      item.approved_at = new Date().toISOString();
      item.approved_by = req.body?.approved_by || 'Master Administrator';
      item.super_admin_username = superAdminUsername;
      item.temporary_password = temporaryPassword;
      item.login_url = loginUrl;

      requests[index] = item;
      saveRegistrationRequests(requests);

      // Notify admin.fuelnest@gmail.com about activation
      sendAdminNotificationEmail({
        subject: `✅ [Subscriber Activated] ${item.company_name} - Workspace Ready`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 18px 22px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">✅ Subscriber Workspace Activated</h2>
              <p style="color: #d1fae5; margin: 4px 0 0 0; font-size: 13px;">FuelNest Platform Administration &bull; admin.fuelnest@gmail.com</p>
            </div>
            <p style="font-size: 14px; color: #334155;">The workspace for <strong>${item.company_name}</strong> (${item.plan_name}) has been approved and activated.</p>
            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Username:</strong> <code style="font-family: monospace;">${superAdminUsername}</code></p>
              <p style="margin: 4px 0;"><strong>Password:</strong> <code style="font-family: monospace;">${temporaryPassword}</code></p>
              <p style="margin: 4px 0;"><strong>Portal Login:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
            </div>
          </div>
        `
      }).catch(err => console.warn('[Admin alert error on approval]:', err));

      res.json({
        success: true,
        message: `Subscriber workspace for "${item.company_name}" has been unsuspended and activated!`,
        request: item,
        tenant: targetTenant,
        user: targetUser,
        super_admin_username: superAdminUsername,
        temporary_password: temporaryPassword,
        login_url: loginUrl
      });
    } catch (err: any) {
      console.error('[Registration Approval Error]:', err);
      res.status(500).json({ success: false, message: err?.message || 'Failed to approve registration.' });
    }
  });

  // Reject a registration request
  app.post('/api/subscribers/registration-requests/:id/reject', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const requests = loadRegistrationRequests();
      const index = requests.findIndex((r: any) => r.id === id);

      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Registration request not found.' });
      }

      requests[index].status = 'rejected';
      requests[index].rejected_at = new Date().toISOString();
      requests[index].rejection_reason = reason || 'Declined by Administrator';

      saveRegistrationRequests(requests);
      res.json({ success: true, message: 'Registration request rejected.', request: requests[index] });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Manual trigger by Master Admin to send welcome email via system
  app.post('/api/subscribers/registration-requests/:id/send-email', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const requests = loadRegistrationRequests();
      const item = requests.find((r: any) => r.id === id);

      if (!item) {
        return res.status(404).json({ success: false, message: 'Registration request not found.' });
      }

      if (item.status !== 'approved' || !item.super_admin_username) {
        return res.status(400).json({ success: false, message: 'Cannot email unapproved registration. Approve workspace first.' });
      }

      const emailRes = await sendWelcomeEmail({
        email: item.email,
        companyName: item.company_name,
        username: item.super_admin_username,
        tempPassword: item.temporary_password,
        loginUrl: item.login_url || 'https://fuelnest.xyz/login',
        planName: item.plan_name
      });

      item.email_sent = Boolean(emailRes.delivered);
      item.email_sent_at = new Date().toISOString();
      item.last_email_status = emailRes;
      saveRegistrationRequests(requests);

      res.json({ success: true, email_status: emailRes });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Delete a registration request
  app.delete('/api/subscribers/registration-requests/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      let requests = loadRegistrationRequests();
      requests = requests.filter((r: any) => r.id !== id);
      saveRegistrationRequests(requests);
      res.json({ success: true, message: 'Registration request deleted.' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Recent Email Dispatch Logs endpoint for Master Audit
  app.get('/api/email/logs', (req: Request, res: Response) => {
    try {
      ensureDataDir();
      let logs: any[] = [];
      if (fs.existsSync(EMAIL_LOGS_FILE)) {
        logs = JSON.parse(fs.readFileSync(EMAIL_LOGS_FILE, 'utf-8'));
      }
      res.json({ success: true, count: logs.length, logs });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Admin Notification Queue endpoint
  app.get('/api/admin-notifications', (req: Request, res: Response) => {
    try {
      ensureDataDir();
      let notifs: any[] = [];
      if (fs.existsSync(ADMIN_NOTIFICATIONS_FILE)) {
        notifs = JSON.parse(fs.readFileSync(ADMIN_NOTIFICATIONS_FILE, 'utf-8'));
      }
      res.json({ success: true, notifications: notifs });
    } catch (e: any) {
      res.json({ success: true, notifications: [] });
    }
  });

  // Email & SMTP Configuration Endpoint
  app.get('/api/email/config', (req: Request, res: Response) => {
    try {
      const cfg = loadEmailConfig();
      res.json({
        success: true,
        config: {
          smtp_enabled: Boolean(cfg.smtp_enabled),
          smtp_host: cfg.smtp_host || '',
          smtp_port: Number(cfg.smtp_port) || 587,
          smtp_secure: Boolean(cfg.smtp_secure),
          smtp_user: cfg.smtp_user || '',
          smtp_pass_configured: Boolean(cfg.smtp_pass),
          smtp_from: cfg.smtp_from || '',
          resend_active: Boolean(process.env.RESEND_API_KEY),
          resend_from: cfg.resend_from || 'FuelNest Onboarding <onboarding@resend.dev>',
          verified_domain: cfg.verified_domain || 'fuelnest.xyz',
          owner_email: 'admin.fuelnest@gmail.com'
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  app.post('/api/email/config', (req: Request, res: Response) => {
    try {
      const {
        smtp_enabled,
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_user,
        smtp_pass,
        smtp_from,
        resend_from,
        verified_domain
      } = req.body;

      const current = loadEmailConfig();
      const updated = saveEmailConfig({
        smtp_enabled: typeof smtp_enabled === 'boolean' ? smtp_enabled : current.smtp_enabled,
        smtp_host: smtp_host !== undefined ? String(smtp_host).trim() : current.smtp_host,
        smtp_port: smtp_port !== undefined ? Number(smtp_port) : current.smtp_port,
        smtp_secure: typeof smtp_secure === 'boolean' ? smtp_secure : current.smtp_secure,
        smtp_user: smtp_user !== undefined ? String(smtp_user).trim() : current.smtp_user,
        smtp_pass: smtp_pass ? String(smtp_pass) : current.smtp_pass,
        smtp_from: smtp_from !== undefined ? String(smtp_from).trim() : current.smtp_from,
        resend_from: resend_from !== undefined ? String(resend_from).trim() : current.resend_from,
        verified_domain: verified_domain !== undefined ? String(verified_domain).trim() : current.verified_domain
      });

      res.json({
        success: true,
        message: 'Email & SMTP settings saved successfully.',
        config: {
          smtp_enabled: updated.smtp_enabled,
          smtp_host: updated.smtp_host,
          smtp_port: updated.smtp_port,
          smtp_secure: updated.smtp_secure,
          smtp_user: updated.smtp_user,
          smtp_pass_configured: Boolean(updated.smtp_pass),
          smtp_from: updated.smtp_from,
          resend_active: Boolean(process.env.RESEND_API_KEY),
          resend_from: updated.resend_from,
          verified_domain: updated.verified_domain
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // Test Email Dispatcher Endpoint
  app.post('/api/email/test', async (req: Request, res: Response) => {
    try {
      const { recipient_email } = req.body;
      const targetEmail = String(recipient_email || 'admin.fuelnest@gmail.com').trim();

      if (!targetEmail.includes('@')) {
        res.status(400).json({ success: false, message: 'Valid recipient email address is required.' });
        return;
      }

      console.log(`[Email Test] Initiating test delivery to ${targetEmail}...`);
      const result = await sendWelcomeEmail({
        email: targetEmail,
        companyName: 'Test Fleet Intelligence Ltd',
        username: 'test_admin',
        tempPassword: 'Test@' + Math.floor(10000 + Math.random() * 90000),
        loginUrl: 'https://fuelnest.xyz/login',
        planName: 'Enterprise Test Delivery'
      });

      res.json({
        success: Boolean(result.delivered || result.dispatched),
        result
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message });
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
        fleet.categories = Array.isArray(fleet.categories) ? fleet.categories : [];
        fleet.companies = Array.isArray(fleet.companies) ? fleet.companies : [];
        fleet.vendors = Array.isArray(fleet.vendors) ? fleet.vendors : [];
        fleet.pumps = Array.isArray(fleet.pumps) ? fleet.pumps : [];
        fleet.fuelTypes = Array.isArray(fleet.fuelTypes) ? fleet.fuelTypes : [];

        // 1. Auto-discover Categories, Companies, Vendors, Pumps, Fuel Types
        const categoryMap = new Map<string, string>();
        fleet.categories.forEach(c => c && c.name && categoryMap.set(String(c.name).toLowerCase().trim(), c.id));

        const companyMap = new Map<string, string>();
        fleet.companies.forEach(c => c && c.name && companyMap.set(String(c.name).toLowerCase().trim(), c.id));

        const vendorMap = new Map<string, string>();
        fleet.vendors.forEach(v => v && v.name && vendorMap.set(String(v.name).toLowerCase().trim(), v.id));

        const pumpMap = new Map<string, string>();
        fleet.pumps.forEach(p => p && p.name && pumpMap.set(String(p.name).toLowerCase().trim(), p.id));

        const fuelMap = new Map<string, string>();
        fleet.fuelTypes.forEach(f => f && f.name && fuelMap.set(String(f.name).toLowerCase().trim(), f.name));

        for (const r of rows) {
          // Category Auto-Setup
          const rawCat = r.category || r.vehicle_category || r.category_name;
          if (rawCat && String(rawCat).trim() && String(rawCat).trim() !== 'N/A') {
            const catName = String(rawCat).trim();
            const lower = catName.toLowerCase();
            if (!categoryMap.has(lower)) {
              const isLph = /excavator|generator|crane|earthmover|dozer|loader|bowzer/i.test(catName);
              const bench = Number(r.benchmark_mileage || r.benchmark || r.expected_benchmark) || (isLph ? 18.0 : 8.0);
              const newCat = {
                id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                tenant_id,
                user_id: r.user_id || 'user_1',
                name: catName,
                metric_type: isLph ? 'lph' : 'kmpl',
                default_benchmark: bench,
                tolerance_percentage: 15,
                icon_name: isLph ? 'Excavator' : 'Truck',
                description: 'Auto-configured from fleet sheet upload'
              };
              categoryMap.set(lower, newCat.id);
              fleet.categories.unshift(newCat);
            }
          }

          // Company Auto-Setup
          const rawComp = r.assigned_company || r.company || r.company_name;
          if (rawComp && String(rawComp).trim() && String(rawComp).trim() !== 'N/A') {
            const compName = String(rawComp).trim();
            const lower = compName.toLowerCase();
            if (!companyMap.has(lower)) {
              const cleanCode = compName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || 'COMP';
              const newComp = {
                id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                tenant_id,
                user_id: r.user_id || 'user_1',
                name: compName,
                code: cleanCode,
                contact_person: 'N/A',
                phone: 'N/A',
                email: '',
                address: 'N/A',
                created_at: todayStr
              };
              companyMap.set(lower, newComp.id);
              fleet.companies.unshift(newComp);
            }
          }

          // Vendor Auto-Setup
          const rawVen = r.vehicle_vendor || r.vendor_name || r.vendor || r.supplier;
          if (rawVen && String(rawVen).trim() && String(rawVen).trim() !== 'N/A' && String(rawVen).trim().toLowerCase() !== 'own' && String(rawVen).trim().toLowerCase() !== 'none') {
            const venName = String(rawVen).trim();
            const lower = venName.toLowerCase();
            if (!vendorMap.has(lower)) {
              const newVen = {
                id: `ven_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                tenant_id,
                user_id: r.user_id || 'user_1',
                name: venName,
                phone: r.vendor_contact || r.vendor_phone || 'N/A',
                type: 'fuel',
                address: 'N/A',
                created_at: todayStr
              };
              vendorMap.set(lower, newVen.id);
              fleet.vendors.unshift(newVen);
            }
          }

          // Fuel Pump Auto-Setup
          const rawPump = r.fuel_pumps || r.fuel_pump || r.fuel_pump_station || r.pump;
          if (rawPump && String(rawPump).trim() && String(rawPump).trim() !== 'N/A' && String(rawPump).trim().toLowerCase() !== 'none') {
            const pumpName = String(rawPump).trim();
            const lower = pumpName.toLowerCase();
            if (!pumpMap.has(lower)) {
              const newPump = {
                id: `pump_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                tenant_id,
                user_id: r.user_id || 'user_1',
                name: pumpName,
                location: r.pump_location || 'N/A',
                contact_person: 'Station Manager',
                phone: 'N/A',
                credit_limit: 500000,
                opening_balance: 0,
                current_balance: 0,
                fuel_types: ['Diesel', 'Octane'],
                payment_terms: 'Credit',
                created_at: todayStr
              };
              pumpMap.set(lower, newPump.id);
              fleet.pumps.unshift(newPump);
            }
          }

          // Fuel Type Auto-Setup
          const rawFuel = r.fuel_type || r.fuel;
          if (rawFuel && String(rawFuel).trim() && String(rawFuel).trim() !== 'N/A') {
            const fuelName = String(rawFuel).trim();
            const lower = fuelName.toLowerCase();
            if (!fuelMap.has(lower)) {
              const unit = lower === 'cng' ? 'm3' : 'Liter';
              const price = Number(r.fuel_price || r.price) || (lower === 'cng' ? 43.00 : lower === 'octane' ? 131.00 : lower === 'petrol' ? 126.00 : 108.50);
              const newFuel = {
                id: `fuel_${lower}_${tenant_id}`,
                tenant_id,
                user_id: r.user_id || 'user_1',
                name: fuelName,
                code: lower,
                unit,
                current_price: price,
                price_history: [{ date: todayStr, price, changed_by: 'Fleet Bulk Import' }],
                updated_at: todayStr
              };
              fuelMap.set(lower, newFuel.name);
              fleet.fuelTypes.unshift(newFuel);
            }
          }
        }

        // 2. Map Vehicles with registered foreign keys
        for (const r of rows) {
          const rawNum = r.vehicle_reg_no || r.vehicle_number || r.plate_number || r.vehicle_no || r.plate_no || r.registration_number || r.registration_no || r.car_number || r.name;
          if (!rawNum) continue;
          const plate = String(rawNum).trim();
          if (!plate) continue;

          const targetPlate = plate.toLowerCase();
          const existingIdx = fleet.vehicles.findIndex(v =>
            v && v.tenant_id === tenant_id &&
            (((v.vehicle_number || v.plate_number || '') + '').toLowerCase() === targetPlate)
          );

          const catKey = (r.category || r.vehicle_category || '').toLowerCase().trim();
          const matchedCatId = categoryMap.get(catKey) || (fleet.categories[0]?.id || 'cat_1');

          const compKey = (r.assigned_company || r.company || '').toLowerCase().trim();
          const matchedCompId = companyMap.get(compKey) || (fleet.companies[0]?.id || 'comp_1');

          const venKey = (r.vendor_name || r.vendor || '').toLowerCase().trim();
          const matchedVenId = vendorMap.get(venKey) || undefined;

          const fuelKey = (r.fuel_type || '').toLowerCase().trim();
          const matchedFuel = fuelMap.get(fuelKey) || (fleet.fuelTypes[0]?.name || 'Diesel');

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

          const vehicleItem: any = {
            id: r.id || 'veh_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            tenant_id,
            user_id: r.user_id || 'user_1',
            vehicle_number: plate,
            plate_number: plate,
            model: r.model || 'N/A',
            category_id: matchedCatId,
            company_id: matchedCompId,
            vendor_id: matchedVenId,
            ownership: isRental ? 'rented' : 'owned' as 'owned' | 'rented',
            fuel_type_id: matchedFuel,
            expected_benchmark: Number(r.benchmark_mileage || r.expected_benchmark || r.benchmark) || 8.0,
            current_odometer: Number(r.current_meter || r.current_odometer || r.initial_odometer) || 0,
            driver_name: (driverName && String(driverName).trim()) ? String(driverName).trim() : 'N/A',
            driver_phone: (driverPhone && String(driverPhone).trim()) ? String(driverPhone).trim() : 'N/A',
            fuel_tank_capacity: Number(r.fuel_tank_capacity || r.capacity) || 100,
            status: (r.status === 'maintenance' || r.status === 'idle') ? r.status : 'active',
            notes: r.notes || 'Bulk imported via Fleet Master Excel/CSV',
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
  app.get(['/api/fleet/all', '/api/fleet'], async (req: Request, res: Response) => {
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

  app.patch('/api/fleet/fuel-entries/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const store = loadFleetData();
      const idx = store.fuelEntries.findIndex(e => e.id === id);
      if (idx >= 0) {
        store.fuelEntries[idx] = { ...store.fuelEntries[idx], ...updates };
        saveFleetData({ fuelEntries: store.fuelEntries });
        await syncAllDataToMySQL({ fuelEntries: [store.fuelEntries[idx]] });
        res.json({ success: true, entry: store.fuelEntries[idx] });
      } else {
        res.status(404).json({ success: false, message: 'Fuel entry not found' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.patch('/api/fleet/vendors/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const store = loadFleetData();
      const idx = store.vendors.findIndex(v => v.id === id);
      if (idx >= 0) {
        store.vendors[idx] = { ...store.vendors[idx], ...updates };
        saveFleetData({ vendors: store.vendors });
        await syncAllDataToMySQL({ vendors: [store.vendors[idx]] } as any);
        res.json({ success: true, vendor: store.vendors[idx] });
      } else {
        res.status(404).json({ success: false, message: 'Vendor not found' });
      }
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

  app.patch('/api/fleet/payments/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const store = loadFleetData();
      const idx = store.payments.findIndex(pm => pm.id === id);
      if (idx >= 0) {
        store.payments[idx] = { ...store.payments[idx], ...updates };
        saveFleetData({ payments: store.payments });
        await syncAllDataToMySQL({ payments: [store.payments[idx]] });
        res.json({ success: true, payment: store.payments[idx] });
      } else {
        res.status(404).json({ success: false, message: 'Payment not found' });
      }
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

      // Check if Master Platform Owner Login (mashudalone / 00000 or admin.fuelnest@gmail.com)
      if (
        (cleanUser === 'mashudalone' || cleanUser === 'admin.fuelnest@gmail.com' || cleanUser === 'master') &&
        (cleanPass === '00000' || cleanPass === 'password123')
      ) {
        return res.status(200).json({
          success: true,
          is_saas_owner: true,
          role: 'saas_owner',
          message: 'Welcome Master Platform Owner.',
          user: {
            id: 'saas_owner_1',
            username: 'mashudalone',
            name: 'Md. Mashud (Platform Owner)',
            email: 'admin.fuelnest@gmail.com',
            role: 'saas_owner'
          }
        });
      }

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
              role_title_bn: 'Company Super Admin',
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
  const isProduction = isBundled || process.env.NODE_ENV === "production";
  const isDev = !isProduction;

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
    const PORT = Number(process.env.PORT) || 3000;

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`FuelNest Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
      } else {
        console.error("Server listen error:", err);
      }
    });

    const gracefulExit = () => {
      server.close(() => {
        process.exit(0);
      });
    };
    process.on("SIGTERM", gracefulExit);
    process.on("SIGINT", gracefulExit);
  }

  // Only start standalone HTTP server when not running in Vercel Serverless environment
  if (!process.env.VERCEL) {
    startServer();
  }

  export default app;
