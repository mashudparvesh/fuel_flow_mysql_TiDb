// Vercel Serverless Function - Direct TiDB Cloud & MySQL API Handler (ES Module)
import mysql from 'mysql2/promise';

function getTiDBConfig() {
  let host = (process.env.MYSQL_HOST || '').trim();
  let user = (process.env.MYSQL_USER || '').trim();
  let password = (process.env.MYSQL_PASSWORD || '').trim();
  let database = (process.env.MYSQL_DATABASE || '').trim() || 'test';
  let port = parseInt((process.env.MYSQL_PORT || '').trim() || '4000', 10);

  // If host is empty or points to TiDB Cloud, enforce TiDB Cloud credentials
  if (!host || host.includes('infinityfree') || host.includes('epizy') || host.includes('byetcluster') || host.includes('tidbcloud')) {
    host = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
    user = '3vs45pD8HohQ35M.root';
    port = 4000;
    database = 'test';
    if (!password || password === 'MashudAlone420' || host.includes('tidbcloud')) {
      password = (process.env.MYSQL_PASSWORD && process.env.MYSQL_PASSWORD !== 'MashudAlone420')
        ? process.env.MYSQL_PASSWORD
        : 'FaiamIkyLcN3kABc';
    }
  }

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 7000,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  };
}

let cachedPool = null;
function getPool() {
  if (!cachedPool) {
    const config = getTiDBConfig();
    cachedPool = mysql.createPool(config);
  }
  return cachedPool;
}

// Helper to parse request body in Serverless environment
async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function hashPassword(plainPassword) {
  const trimmed = String(plainPassword || '').trim();
  let hashVal = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed.charCodeAt(i);
    hashVal = ((hashVal << 5) - hashVal) + char;
    hashVal |= 0;
  }
  const hexPart = Math.abs(hashVal).toString(16).padStart(8, '0');
  const b64Part = Buffer.from(encodeURIComponent(trimmed)).toString('base64').replace(/=/g, '');
  return `$2y$10$fuelflowSecuredSaltXX.${hexPart}${b64Part.slice(0, 22)}`;
}

function verifyPassword(plainPassword, storedPasswordHashOrPlain) {
  if (!storedPasswordHashOrPlain) return false;
  const cleanPlain = String(plainPassword || '').trim();
  const cleanStored = String(storedPasswordHashOrPlain).trim();
  if (cleanPlain === cleanStored) return true;
  return hashPassword(cleanPlain) === cleanStored;
}

// Resend Email Dispatch Helper for Serverless (from admin.fuelnest@gmail.com)
async function sendEmailViaResend({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = Array.isArray(to) ? to : [to];
  if (!apiKey) return { success: false, reason: 'No RESEND_API_KEY configured' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'FuelNest Admin <onboarding@resend.dev>',
        to: recipient,
        reply_to: 'admin.fuelnest@gmail.com',
        subject,
        html,
        text: text || subject
      })
    });
    if (res.ok) {
      return { success: true };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err };
  } catch (e) {
    return { success: false, error: e?.message || e };
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, x-tenant-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawUrl = req.url || '';
  const cleanUrl = rawUrl.split('?')[0];
  const method = req.method || 'GET';
  const config = getTiDBConfig();

  // 1. Health check
  if (cleanUrl === '/api/health' || cleanUrl.endsWith('/health')) {
    return res.status(200).json({
      status: 'ok',
      mode: 'vercel-serverless-esm',
      provider: 'TiDB Cloud Serverless',
      timestamp: new Date().toISOString()
    });
  }

  // 2. Database Status Check
  if (cleanUrl === '/api/database/status' || cleanUrl.endsWith('/database/status')) {
    const start = Date.now();
    try {
      const pool = getPool();
      await pool.query('SELECT 1 as val');
      const pingMs = Date.now() - start;

      const tableCounts = {};
      const tables = ['tenants', 'users', 'vehicles', 'fuel_entries', 'fuel_pumps', 'pump_payments', 'companies', 'vendors'];
      for (const t of tables) {
        try {
          const [cnt] = await pool.query(`SELECT COUNT(*) as count FROM \`${t}\``);
          tableCounts[t] = cnt[0]?.count ?? 0;
        } catch (e) {
          tableCounts[t] = 0;
        }
      }

      return res.status(200).json({
        success: true,
        configured: true,
        connected: true,
        provider: 'TiDB Cloud Serverless',
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        pingMs,
        tableCounts,
        error: null,
        lastChecked: new Date().toISOString()
      });
    } catch (dbErr) {
      console.error('[TiDB Serverless Status Error]:', dbErr);
      const pingMs = Date.now() - start;
      const errMsg = dbErr && dbErr.message ? String(dbErr.message) : 'Database connection error';

      return res.status(200).json({
        success: true,
        configured: true,
        connected: false,
        provider: 'TiDB Cloud Serverless',
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        pingMs,
        tableCounts: {},
        error: errMsg,
        lastChecked: new Date().toISOString()
      });
    }
  }

  // 3. Subscriber Onboarding Registration (POST /api/subscribers/register or /api/register)
  if ((cleanUrl.includes('/api/subscribers/register') || cleanUrl.endsWith('/register')) && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { company_name, admin_name, email, phone, plan_id, password } = body;

      if (!company_name || !email) {
        return res.status(400).json({ success: false, message: 'Company name and email are required.' });
      }

      const words = String(company_name).trim().split(/\s+/).filter(Boolean);
      const firstWord = (words[0] || 'Fleet').replace(/[^a-zA-Z0-9]/g, '');
      const uniqueSuffix = Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
      const tenantId = `tenant_${firstWord.toLowerCase()}_${uniqueSuffix}`;
      const tenantCode = ((words.length > 1 ? words.map(w => w[0]).join('') : firstWord).toUpperCase() + Math.floor(100 + Math.random() * 900)).slice(0, 16);

      const superAdminUsername = `${firstWord.toLowerCase()}_admin`;
      const rawPassword = password && String(password).trim().length >= 6 ? String(password).trim() : `${firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase()}@12345`;
      const hashedPassword = hashPassword(rawPassword);

      const today = new Date().toISOString().split('T')[0];
      let endDateObj = new Date();
      let priceBdt = 0;
      let planNameEn = '3 Days Free Trial';
      let isTrial = true;
      const pid = plan_id || 'trial_3days';

      if (pid === 'trial_3days' || pid === 'trial') {
        endDateObj.setDate(endDateObj.getDate() + 3);
        priceBdt = 0;
        planNameEn = '3 Days Free Trial';
        isTrial = true;
      } else if (pid === 'plan_1month' || pid === 'starter') {
        endDateObj.setMonth(endDateObj.getMonth() + 1);
        priceBdt = 749;
        planNameEn = '1 Month Plan (749 BDT)';
        isTrial = false;
      } else if (pid === 'plan_3months' || pid === 'pro') {
        endDateObj.setMonth(endDateObj.getMonth() + 3);
        priceBdt = 2199;
        planNameEn = '3 Months Plan (2,199 BDT)';
        isTrial = false;
      } else if (pid === 'plan_6months') {
        endDateObj.setMonth(endDateObj.getMonth() + 6);
        priceBdt = 3999;
        planNameEn = '6 Months Plan (3,999 BDT)';
        isTrial = false;
      } else if (pid === 'plan_12months' || pid === 'enterprise') {
        endDateObj.setFullYear(endDateObj.getFullYear() + 1);
        priceBdt = 7999;
        planNameEn = 'VIP Plan (7,999 BDT)';
        isTrial = false;
      }

      const endDate = endDateObj.toISOString().split('T')[0];
      const sub = {
        plan: pid,
        plan_name_bn: planNameEn,
        status: 'pending',
        is_approved: false,
        start_date: today,
        end_date: endDate,
        price_bdt: priceBdt,
        payment_status: isTrial ? 'trial' : 'paid',
        max_vehicles: 100,
        max_users: 25,
        max_pumps: 15,
        super_admin_username: superAdminUsername,
        super_admin_password: rawPassword,
        features: {
          tanker_bowzer: true,
          anomaly_ai: true,
          reports_export: true,
          qr_scanner: true,
          custom_categories: true
        },
        notes: isTrial ? '3-Day Free Trial (Landing Page Registration - Pending Master Control approval)' : `Subscription - ${planNameEn} (Pending Master Control approval)`
      };

      const pool = getPool();
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        // 1. Insert tenant in PENDING status
        await conn.query(
          `INSERT INTO \`tenants\` (
            \`id\`, \`name\`, \`code\`, \`currency\`, \`phone\`, \`address\`, \`contact_person\`, \`email\`,
            \`status\`, \`deleted_at\`, \`created_at\`, \`subscription_plan\`, \`subscription_status\`,
            \`subscription_start_date\`, \`subscription_end_date\`, \`subscription_price\`, \`subscription_raw\`, \`is_approved\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`status\` = VALUES(\`status\`),
            \`is_approved\` = VALUES(\`is_approved\`)`,
          [
            tenantId,
            String(company_name).trim(),
            tenantCode,
            'BDT',
            String(phone || '').trim(),
            'Dhaka, Bangladesh',
            String(admin_name || company_name + ' Admin').trim(),
            String(email).trim().toLowerCase(),
            'pending',
            null,
            today,
            pid,
            'pending',
            today,
            endDate,
            priceBdt,
            JSON.stringify(sub),
            0
          ]
        );

        // 2. Insert Super Admin User in suspended status awaiting approval
        const userId = `usr_${tenantId}_admin`;
        await conn.query(
          `INSERT INTO \`users\` (
            \`id\`, \`tenant_id\`, \`name\`, \`email\`, \`username\`, \`password_hash\`, \`phone\`,
            \`role\`, \`role_title_bn\`, \`company_id\`, \`status\`, \`allowed_categories\`,
            \`allowed_pumps\`, \`permissions\`, \`created_at\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`status\` = VALUES(\`status\`)`,
          [
            userId,
            tenantId,
            String(admin_name || company_name + ' Administrator').trim(),
            String(email).trim().toLowerCase(),
            superAdminUsername,
            hashedPassword,
            String(phone || '').trim(),
            'super_admin',
            'Company Super Admin',
            null,
            'suspended',
            JSON.stringify(['all']),
            JSON.stringify(['all']),
            JSON.stringify({
              can_add_fuel: true,
              can_manage_vehicles: true,
              can_manage_pumps: true,
              can_view_reports: true,
              can_manage_users: true,
              can_edit_settings: true
            }),
            today
          ]
        );

        await conn.commit();
      } catch (txErr) {
        await conn.rollback().catch(() => {});
        throw txErr;
      } finally {
        conn.release();
      }

      // 🚨 CRITICAL: Instant Notification Email to admin.fuelnest@gmail.com
      const alertSubject = `🚨 [New Subscriber Registered] ${company_name} (${planNameEn})`;
      const alertHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 18px 22px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">🚨 New Subscriber Registration</h2>
            <p style="color: #451a03; margin: 4px 0 0 0; font-size: 13px; font-weight: 600;">FuelNest Cloud &bull; Immediate Approval Alert for admin.fuelnest@gmail.com</p>
          </div>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            A new subscriber has just submitted registration on FuelNest. All submitted details are listed below so you can review and activate their workspace immediately.
          </p>
          <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; background-color: #f8fafc; border-radius: 8px;">
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold; color: #64748b; width: 35%;">Company Name:</td><td style="padding: 10px; font-weight: 800; color: #0f172a;">${company_name}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Admin Contact:</td><td style="padding: 10px; color: #0f172a; font-weight: 600;">${admin_name}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Email Address:</td><td style="padding: 10px; color: #0284c7; font-weight: bold;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Phone / WhatsApp:</td><td style="padding: 10px; color: #0f172a;">${phone || 'N/A'}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Chosen Plan:</td><td style="padding: 10px; color: #d97706; font-weight: 800;">${planNameEn}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Payment Method:</td><td style="padding: 10px; color: #0f172a;">${isTrial ? '3-Day Free Trial' : 'Online Payment'}</td></tr>
            <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px; font-weight: bold; color: #64748b;">Status:</td><td style="padding: 10px; color: #ea580c; font-weight: 800;">PENDING MASTER APPROVAL</td></tr>
            <tr><td style="padding: 10px; font-weight: bold; color: #64748b;">Registered At:</td><td style="padding: 10px; color: #64748b;">${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} BST</td></tr>
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
      `;

      sendEmailViaResend({
        to: 'admin.fuelnest@gmail.com',
        subject: alertSubject,
        html: alertHtml
      }).catch(err => console.warn('[Serverless subscriber notification error]:', err));

      // Record in admin_notifications table
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS \`admin_notifications\` (
          \`id\` VARCHAR(64) PRIMARY KEY,
          \`type\` VARCHAR(64),
          \`subject\` VARCHAR(255),
          \`details_json\` LONGTEXT,
          \`read_status\` TINYINT DEFAULT 0,
          \`created_at\` VARCHAR(64)
        )`).catch(() => {});

        await pool.query(
          'INSERT INTO `admin_notifications` (`id`, `type`, `subject`, `details_json`, `read_status`, `created_at`) VALUES (?, ?, ?, ?, ?, ?)',
          [
            `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            'new_subscriber',
            alertSubject,
            JSON.stringify({ company_name, admin_name, email, phone, plan: planNameEn, tenant_id: tenantId }),
            0,
            new Date().toISOString()
          ]
        ).catch(() => {});
      } catch (ne) {}

      return res.status(201).json({
        success: true,
        pending_approval: true,
        status: 'pending',
        is_approved: false,
        tenant_id: tenantId,
        tenant: {
          id: tenantId,
          name: String(company_name).trim(),
          code: tenantCode,
          contact_person: String(admin_name).trim(),
          email: String(email).trim().toLowerCase(),
          phone: String(phone || '').trim(),
          status: 'pending',
          is_approved: false,
          created_at: today,
          subscription: sub
        },
        message: 'Registration application submitted successfully. Workspace created in PENDING status awaiting Master Control approval.',
        request: {
          id: `reg_${Date.now()}`,
          company_name: String(company_name).trim(),
          admin_name: String(admin_name).trim(),
          email: String(email).trim().toLowerCase(),
          phone: String(phone || '').trim(),
          plan_id: pid,
          plan_name: planNameEn,
          is_trial: isTrial,
          payment_method: isTrial ? 'Free Trial' : 'Online Payment',
          status: 'pending',
          is_approved: false,
          created_at: new Date().toISOString()
        }
      });
    } catch (regErr) {
      console.error('[TiDB Register Error]:', regErr);
      return res.status(500).json({ success: false, message: regErr?.message || 'Registration failed' });
    }
  }

  // 4. Plan Approval Endpoint (POST /api/tenants/:id/approve or /api/owner/subscribers/:id/approve)
  if ((cleanUrl.includes('/approve')) && method === 'POST') {
    try {
      const parts = cleanUrl.split('/');
      // /api/tenants/:id/approve or /api/owner/subscribers/:id/approve or /api/subscribers/registration-requests/:id/approve
      let targetId = '';
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'approve' && i > 0) {
          targetId = parts[i - 1];
          break;
        }
      }

      if (!targetId) {
        return res.status(400).json({ success: false, message: 'Missing tenant ID to approve' });
      }

      const pool = getPool();
      let targetTenantId = targetId;
      let regItem = null;

      // If targetId is a registration request ID (reg_...), look up request details
      if (targetId.startsWith('reg_')) {
        const [regRows] = await pool.query("SELECT * FROM `registration_requests` WHERE `id` = ?", [targetId]).catch(() => [[]]);
        if (regRows && regRows[0]) {
          regItem = regRows[0];
          targetTenantId = regItem.tenant_id || `tenant_${Date.now()}`;
          // Mark registration request as approved
          await pool.query("UPDATE `registration_requests` SET `status` = 'approved', `approved_at` = NOW() WHERE `id` = ?", [targetId]).catch(() => {});
        } else {
          const [pRows] = await pool.query("SELECT id FROM `tenants` WHERE `status` = 'pending' LIMIT 1").catch(() => [[]]);
          if (pRows && pRows[0]) targetTenantId = pRows[0].id;
        }
      }

      // If tenant doesn't exist yet but we have registration request data, provision tenant & user immediately
      const [existingTenants] = await pool.query("SELECT * FROM `tenants` WHERE `id` = ?", [targetTenantId]).catch(() => [[]]);
      if (!existingTenants || existingTenants.length === 0) {
        if (regItem) {
          const code = String(regItem.company_name || 'CO').replace(/[^A-Za-z0-9]/g, '').substring(0, 8).toUpperCase() || 'TENANT';
          const today = new Date().toISOString().split('T')[0];
          const expDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
          await pool.query(
            `INSERT INTO \`tenants\` (\`id\`, \`name\`, \`code\`, \`currency\`, \`phone\`, \`address\`, \`contact_person\`, \`email\`, \`status\`, \`is_approved\`, \`created_at\`, \`subscription_plan\`, \`subscription_status\`, \`subscription_start_date\`, \`subscription_end_date\`, \`subscription_price\`, \`subscription_raw\`)
             VALUES (?, ?, ?, 'BDT', ?, 'Dhaka, Bangladesh', ?, ?, 'active', 1, ?, ?, 'active', ?, ?, 0, ?)
             ON DUPLICATE KEY UPDATE \`status\` = 'active', \`is_approved\` = 1, \`subscription_status\` = 'active'`,
            [
              targetTenantId, regItem.company_name, code, regItem.phone || '',
              regItem.admin_name || 'Admin', regItem.email || '', today,
              regItem.plan_name || 'starter', today, expDate,
              JSON.stringify({ plan: regItem.plan_name, status: 'active', payment_status: 'paid', super_admin_username: regItem.super_admin_username || 'admin' })
            ]
          ).catch(() => {});

          const rawPass = regItem.temporary_password || `${code}@12345`;
          const passHash = isHashed(rawPass) ? rawPass : hashPassword(rawPass);
          await pool.query(
            `INSERT INTO \`users\` (\`id\`, \`tenant_id\`, \`name\`, \`email\`, \`username\`, \`password_hash\`, \`phone\`, \`role\`, \`role_title_bn\`, \`status\`, \`allowed_categories\`, \`allowed_pumps\`, \`permissions\`)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'super_admin', 'Company Super Admin', 'active', '["all"]', '["all"]', '{"can_add_fuel":true,"can_manage_vehicles":true,"can_manage_pumps":true,"can_view_reports":true,"can_manage_users":true,"can_edit_settings":true}')
             ON DUPLICATE KEY UPDATE \`status\` = 'active'`,
            [`usr_${Date.now()}`, targetTenantId, regItem.admin_name || 'Admin', regItem.email || '', regItem.super_admin_username || 'admin', passHash, regItem.phone || '']
          ).catch(() => {});
        }
      }

      await pool.query(
        "UPDATE `tenants` SET `status` = 'active', `subscription_status` = 'active', `is_approved` = 1 WHERE `id` = ?",
        [targetTenantId]
      ).catch(() => {});
      await pool.query(
        "UPDATE `users` SET `status` = 'active' WHERE `tenant_id` = ?",
        [targetTenantId]
      ).catch(() => {});

      const [tenantRows] = await pool.query("SELECT * FROM `tenants` WHERE `id` = ?", [targetTenantId]).catch(() => [[]]);
      const [userRows] = await pool.query("SELECT * FROM `users` WHERE `tenant_id` = ? AND `role` = 'super_admin' LIMIT 1", [targetTenantId]).catch(() => [[]]);

      return res.status(200).json({
        success: true,
        tenant_id: targetTenantId,
        status: 'active',
        is_approved: true,
        message: `Plan approved for "${tenantRows?.[0]?.name || targetTenantId}". Workspace is now ACTIVE and login access is enabled.`,
        tenant: tenantRows?.[0] || null,
        user: userRows?.[0] || null,
        super_admin_username: userRows?.[0]?.username || regItem?.super_admin_username || 'admin',
        temporary_password: regItem?.temporary_password || `${tenantRows?.[0]?.code || 'User'}@12345`,
        login_url: 'https://fuelnest.xyz/login'
      });
    } catch (apprErr) {
      console.error('[TiDB Approve Error]:', apprErr);
      return res.status(500).json({ success: false, message: apprErr?.message || 'Approval failed' });
    }
  }

  // 4b. Create / Onboard New Subscriber Manually (POST /api/tenants or /api/owner/subscribers/create) - Always ACTIVE
  if ((cleanUrl === '/api/tenants' || cleanUrl === '/api/owner/subscribers/create') && method === 'POST') {
    try {
      const pool = getPool();
      const payload = req.body || {};
      const tenantId = payload.id || `tenant_${Date.now()}`;
      const name = String(payload.name || 'Fleet Company').trim();
      const code = String(payload.code || name.replace(/[^A-Za-z0-9]/g, '').substring(0, 8)).toUpperCase();
      const phone = payload.phone || '';
      const email = payload.email || '';
      const contactPerson = payload.contact_person || '';
      const address = payload.address || '';
      const sub = payload.subscription || {};
      const plan = sub.plan || payload.plan || 'starter';
      const startDate = sub.start_date || new Date().toISOString().split('T')[0];
      const endDate = sub.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      const price = Number(sub.price_bdt || payload.price_bdt) || 0;

      // Ensure tenants table has is_approved column
      await pool.query("ALTER TABLE `tenants` ADD COLUMN IF NOT EXISTS `is_approved` TINYINT(1) DEFAULT 1").catch(() => {});

      // Manual onboarding is ALWAYS ACTIVE and APPROVED immediately!
      await pool.query(
        `INSERT INTO \`tenants\` (\`id\`, \`name\`, \`code\`, \`currency\`, \`phone\`, \`address\`, \`contact_person\`, \`email\`, \`status\`, \`is_approved\`, \`created_at\`, \`subscription_plan\`, \`subscription_status\`, \`subscription_start_date\`, \`subscription_end_date\`, \`subscription_price\`, \`subscription_raw\`)
         VALUES (?, ?, ?, 'BDT', ?, ?, ?, ?, 'active', 1, ?, ?, 'active', ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`), \`status\` = 'active', \`is_approved\` = 1, \`subscription_status\` = 'active'`,
        [
          tenantId, name, code, phone, address, contactPerson, email,
          startDate, plan, startDate, endDate, price,
          JSON.stringify({ ...sub, status: 'active', is_approved: true, payment_status: 'paid' })
        ]
      );

      // Create super admin user if username provided
      const rawUser = payload.super_admin_username || sub.super_admin_username || 'admin';
      const rawPass = payload.super_admin_password || sub.super_admin_password || `${code}@12345`;
      const passHash = isHashed(rawPass) ? rawPass : hashPassword(rawPass);
      const userId = `usr_${Date.now()}`;
      await pool.query(
        `INSERT INTO \`users\` (\`id\`, \`tenant_id\`, \`name\`, \`email\`, \`username\`, \`password_hash\`, \`phone\`, \`role\`, \`role_title_bn\`, \`status\`, \`allowed_categories\`, \`allowed_pumps\`, \`permissions\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'super_admin', 'Company Super Admin', 'active', '["all"]', '["all"]', '{"can_add_fuel":true,"can_manage_vehicles":true,"can_manage_pumps":true,"can_view_reports":true,"can_manage_users":true,"can_edit_settings":true}')
         ON DUPLICATE KEY UPDATE \`status\` = 'active'`,
        [userId, tenantId, payload.super_admin_name || `${name} Admin`, email, rawUser, passHash, phone]
      ).catch(() => {});

      // Create default primary company
      await pool.query(
        `INSERT INTO \`companies\` (\`id\`, \`tenant_id\`, \`name\`, \`code\`, \`contact_person\`, \`phone\`, \`email\`, \`address\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`comp_${tenantId}`, tenantId, name, code, contactPerson, phone, email, address]
      ).catch(() => {});

      // Send telegram alert
      sendTelegramAlert(`🏢 <b>Manual Subscriber Created (ACTIVE)</b>\n\n<b>Company:</b> ${name}\n<b>Tenant Code:</b> ${code}\n<b>Plan:</b> ${plan}\n<b>Status:</b> ACTIVE (Approved Immediately)\n<b>Super Admin:</b> ${rawUser}\n<b>Valid Until:</b> ${endDate}\n\n👉 <a href="https://fuelnest.xyz/control-panel/subscribers">Manage in Control Panel</a>`).catch(() => {});

      return res.status(201).json({
        success: true,
        message: `Subscriber company "${name}" created successfully with ACTIVE status. No approval needed!`,
        tenant: {
          id: tenantId,
          name,
          code,
          status: 'active',
          is_approved: true,
          subscription: {
            plan,
            status: 'active',
            is_approved: true,
            start_date: startDate,
            end_date: endDate,
            price_bdt: price,
            super_admin_username: rawUser
          }
        }
      });
    } catch (createErr) {
      console.error('[Create Tenant Error]:', createErr);
      return res.status(500).json({ success: false, message: createErr?.message || 'Failed to create subscriber' });
    }
  }

  // 5. Cascade Delete Subscriber & All Data (DELETE /api/tenants/:id/cascade or /api/tenants/:id)
  if (cleanUrl.startsWith('/api/tenants/') && method === 'DELETE') {
    try {
      const parts = cleanUrl.split('/');
      // /api/tenants/:id or /api/tenants/:id/cascade
      const tenantId = parts[3];
      if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Missing tenant ID to delete' });
      }

      const pool = getPool();
      const tables = [
        'fuel_entries', 'pump_payments', 'vehicles', 'fuel_pumps',
        'vehicle_categories', 'companies', 'vendors', 'fuel_types',
        'tanker_logs', 'tanker_inventories', 'users', 'tenants'
      ];

      for (const tbl of tables) {
        const idCol = tbl === 'tenants' ? 'id' : 'tenant_id';
        await pool.query(`DELETE FROM \`${tbl}\` WHERE \`${idCol}\` = ?`, [tenantId]).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        message: `Subscriber workspace "${tenantId}" and all associated fleet data permanently deleted.`
      });
    } catch (delErr) {
      console.error('[TiDB Cascade Delete Error]:', delErr);
      return res.status(500).json({ success: false, message: delErr?.message || 'Delete failed' });
    }
  }

  // 6. Complete Data Wipe (POST /api/saas/wipe-all-subscribers)
  if (cleanUrl === '/api/saas/wipe-all-subscribers' && method === 'POST') {
    try {
      const pool = getPool();
      const tables = [
        'fuel_entries', 'pump_payments', 'vehicles', 'fuel_pumps',
        'vehicle_categories', 'companies', 'vendors', 'fuel_types',
        'tanker_logs', 'tanker_inventories', 'users', 'tenants'
      ];
      for (const tbl of tables) {
        await pool.query(`DELETE FROM \`${tbl}\``).catch(() => {});
      }
      return res.status(200).json({ success: true, message: 'All subscriber and tenant data wiped from DB.' });
    } catch (wErr) {
      return res.status(500).json({ success: false, message: wErr?.message || 'Wipe failed' });
    }
  }

  // 7. Get Subscribers / Tenants (GET /api/tenants/all, /api/owner/subscribers, /api/tenants)
  if ((cleanUrl === '/api/tenants/all' || cleanUrl === '/api/owner/subscribers' || cleanUrl === '/api/tenants') && method === 'GET') {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM `tenants` ORDER BY `created_at` DESC');
      const formatted = rows.map((t) => {
        let sub = {};
        try {
          sub = typeof t.subscription_raw === 'string' ? JSON.parse(t.subscription_raw) : (t.subscription_raw || {});
        } catch (e) {}
        return {
          id: t.id,
          name: t.name,
          code: t.code,
          currency: t.currency || 'BDT',
          phone: t.phone || '',
          address: t.address || '',
          contact_person: t.contact_person || '',
          email: t.email || '',
          status: t.status || 'active',
          is_approved: t.is_approved !== undefined ? Boolean(t.is_approved) : (t.status === 'active'),
          deleted_at: t.deleted_at || null,
          created_at: t.created_at,
          logo: t.logo || sub?.logo || null,
          subscription: {
            plan: t.subscription_plan || sub?.plan || 'starter',
            plan_name_bn: sub?.plan_name_bn || t.subscription_plan || 'Standard Plan',
            status: t.subscription_status || sub?.status || t.status || 'active',
            is_approved: t.is_approved !== undefined ? Boolean(t.is_approved) : (t.status === 'active'),
            start_date: t.subscription_start_date || sub?.start_date,
            end_date: t.subscription_end_date || sub?.end_date,
            price_bdt: Number(t.subscription_price) || sub?.price_bdt || 0,
            duration_type: sub?.duration_type || 'months',
            duration_val: sub?.duration_val || 1,
            max_vehicles: sub?.max_vehicles || 100,
            max_pumps: sub?.max_pumps || 15,
            max_users: sub?.max_users || 25,
            features: sub?.features || {
              tanker_bowzer: true,
              anomaly_ai: true,
              reports_export: true,
              qr_scanner: true,
              custom_categories: true
            },
            super_admin_username: sub?.super_admin_username,
            super_admin_password: sub?.super_admin_password
          }
        };
      });
      return res.status(200).json({ success: true, data: formatted });
    } catch (err) {
      console.error('[TiDB Fetch Tenants Error]:', err);
      return res.status(200).json({ success: false, data: [] });
    }
  }

  // 8. Registration Requests list (GET /api/subscribers/registration-requests)
  if (cleanUrl.includes('/api/subscribers/registration-requests') && method === 'GET') {
    try {
      const pool = getPool();
      // Only return pending unapproved registration requests, NEVER approved active subscribers
      const [rows] = await pool.query(
        'SELECT * FROM `tenants` WHERE (`is_approved` = 0 OR `status` = "pending") AND `deleted_at` IS NULL ORDER BY `created_at` DESC'
      ).catch(() => [[]]);
      const requests = rows.map(t => {
        let sub = {};
        try { sub = typeof t.subscription_raw === 'string' ? JSON.parse(t.subscription_raw) : (t.subscription_raw || {}); } catch (e) {}
        const isAppr = Boolean(t.is_approved);
        return {
          id: `reg_${t.id}`,
          tenant_id: t.id,
          company_name: t.name,
          admin_name: t.contact_person,
          email: t.email,
          phone: t.phone,
          plan_id: t.subscription_plan || sub?.plan || 'trial_3days',
          plan_name: sub?.plan_name_bn || 'Plan',
          is_trial: (t.subscription_plan === 'trial_3days' || sub?.plan === 'trial_3days'),
          status: isAppr ? 'approved' : (t.status === 'pending' ? 'pending' : t.status),
          is_approved: isAppr,
          super_admin_username: sub?.super_admin_username,
          temporary_password: sub?.super_admin_password,
          created_at: t.created_at
        };
      });
      return res.status(200).json({ success: true, requests });
    } catch (e) {
      return res.status(200).json({ success: true, requests: [] });
    }
  }

  // 8b. Delete Registration Request & Permanent Wipe (DELETE /api/subscribers/registration-requests/:id)
  if (cleanUrl.includes('/api/subscribers/registration-requests/') && method === 'DELETE') {
    try {
      const parts = cleanUrl.split('/');
      const rawReqId = parts[parts.length - 1];
      const targetTenantId = rawReqId.startsWith('reg_') ? rawReqId.substring(4) : rawReqId;
      const pool = getPool();

      if (rawReqId === 'all_test' || rawReqId === 'purge_all') {
        // Purge all unapproved test registrations except active approved tenants
        await pool.query('DELETE FROM `users` WHERE `tenant_id` IN (SELECT `id` FROM `tenants` WHERE `is_approved` = 0 OR `status` = "pending")').catch(() => {});
        await pool.query('DELETE FROM `vehicles` WHERE `tenant_id` IN (SELECT `id` FROM `tenants` WHERE `is_approved` = 0 OR `status` = "pending")').catch(() => {});
        await pool.query('DELETE FROM `fuel_entries` WHERE `tenant_id` IN (SELECT `id` FROM `tenants` WHERE `is_approved` = 0 OR `status` = "pending")').catch(() => {});
        await pool.query('DELETE FROM `fuel_pumps` WHERE `tenant_id` IN (SELECT `id` FROM `tenants` WHERE `is_approved` = 0 OR `status` = "pending")').catch(() => {});
        await pool.query('DELETE FROM `companies` WHERE `tenant_id` IN (SELECT `id` FROM `tenants` WHERE `is_approved` = 0 OR `status` = "pending")').catch(() => {});
        await pool.query('DELETE FROM `vendors` WHERE `tenant_id` IN (SELECT `id` FROM `tenants` WHERE `is_approved` = 0 OR `status` = "pending")').catch(() => {});
        await pool.query('DELETE FROM `tenants` WHERE `is_approved` = 0 OR `status` = "pending"').catch(() => {});
        return res.status(200).json({ success: true, message: 'All pending test registration requests purged permanently.' });
      }

      if (targetTenantId) {
        const tables = [
          'fuel_entries', 'pump_payments', 'vehicles', 'fuel_pumps',
          'vehicle_categories', 'companies', 'vendors', 'fuel_types',
          'tanker_logs', 'tanker_inventories', 'users'
        ];
        for (const tbl of tables) {
          await pool.query(`DELETE FROM \`${tbl}\` WHERE \`tenant_id\` = ?`, [targetTenantId]).catch(() => {});
        }
        await pool.query('DELETE FROM `tenants` WHERE `id` = ?', [targetTenantId]).catch(() => {});
        await pool.query('DELETE FROM `admin_notifications` WHERE `details_json` LIKE ?', [`%${targetTenantId}%`]).catch(() => {});
      }

      return res.status(200).json({ success: true, message: 'Registration request deleted and all associated data purged.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to delete registration request' });
    }
  }

  // 9. Strict Authentication Guard (POST /api/auth/login)
  if (cleanUrl === '/api/auth/login' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { username, password } = body;
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

      const pool = getPool();
      const [users] = await pool.query('SELECT * FROM `users` WHERE LOWER(username) = ? OR LOWER(email) = ?', [cleanUser, cleanUser]);
      if (!users || users.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid username or password.' });
      }

      const matchedUser = users.find(u => verifyPassword(cleanPass, u.password_hash));
      if (!matchedUser) {
        return res.status(401).json({ success: false, message: 'Invalid username or password.' });
      }

      const [tenants] = await pool.query('SELECT * FROM `tenants` WHERE `id` = ?', [matchedUser.tenant_id]);
      const targetTenant = tenants?.[0];

      if (!targetTenant) {
        return res.status(404).json({ success: false, message: 'Workspace not found.' });
      }

      if (targetTenant.status === 'pending' || targetTenant.is_approved === 0) {
        return res.status(403).json({
          success: false,
          pending: true,
          message: 'Your workspace application is pending administrator review and approval. You will be notified once activated.'
        });
      }

      if (targetTenant.status === 'suspended' || matchedUser.status === 'suspended') {
        return res.status(403).json({
          success: false,
          suspended: true,
          message: 'This workspace or user account is suspended. Please contact administrator.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Credentials verified.',
        tenant: targetTenant,
        user: matchedUser
      });
    } catch (authErr) {
      console.error('[TiDB Login Error]:', authErr);
      return res.status(500).json({ success: false, message: 'Authentication error' });
    }
  }

  // 10. Update Tenant Status (PATCH /api/tenants/:id/status or /api/tenants)
  if (cleanUrl.includes('/api/tenants') && method === 'PATCH') {
    try {
      const body = await parseBody(req);
      const parts = cleanUrl.split('/');
      const tenantId = parts[3] || body.id;
      const pool = getPool();

      if (tenantId && body.status) {
        await pool.query(
          'UPDATE `tenants` SET `status` = ?, `subscription_status` = ? WHERE `id` = ?',
          [body.status, body.status, tenantId]
        );
      }
      return res.status(200).json({ success: true, message: 'Tenant status updated.' });
    } catch (err) {
      return res.status(200).json({ success: true });
    }
  }

  // 11. Users list (GET /api/users) & Create User (POST /api/users)
  if (cleanUrl === '/api/users') {
    const pool = getPool();
    if (method === 'GET') {
      try {
        const [rows] = await pool.query('SELECT * FROM `users` ORDER BY `created_at` DESC');
        return res.status(200).json({ success: true, data: rows });
      } catch (e) {
        return res.status(200).json({ success: false, data: [] });
      }
    }
    if (method === 'POST') {
      try {
        const u = await parseBody(req);
        if (!u.id || !u.name || !u.username) {
          return res.status(400).json({ success: false, message: 'Missing user fields' });
        }
        await pool.query(
          `INSERT INTO \`users\` (
            \`id\`, \`tenant_id\`, \`name\`, \`email\`, \`username\`, \`password_hash\`, \`phone\`, \`role\`,
            \`role_title_bn\`, \`company_id\`, \`status\`, \`allowed_categories\`, \`allowed_pumps\`, \`permissions\`, \`created_at\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`name\` = VALUES(\`name\`),
            \`email\` = VALUES(\`email\`),
            \`password_hash\` = VALUES(\`password_hash\`),
            \`status\` = VALUES(\`status\`)`,
          [
            u.id,
            u.tenant_id,
            u.name,
            u.email || '',
            u.username,
            u.password || u.password_hash || '',
            u.phone || '',
            u.role || 'super_admin',
            u.role_title_bn || '',
            u.company_id || null,
            u.status || 'active',
            JSON.stringify(u.allowed_category_ids || ['all']),
            JSON.stringify(u.allowed_pump_ids || ['all']),
            JSON.stringify(u.permissions || {}),
            u.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]
        );
        return res.status(201).json({ success: true, message: 'User persisted to TiDB Cloud', data: u });
      } catch (err) {
        return res.status(500).json({ success: false, message: err?.message || 'Error saving user' });
      }
    }
  }

  // 12. Fleet Data Sync (POST /api/fleet/sync & GET /api/fleet/all)
  if (cleanUrl === '/api/fleet/all' && method === 'GET') {
    try {
      const pool = getPool();
      const [vehicles] = await pool.query('SELECT * FROM `vehicles`').catch(() => [[]]);
      const [fuelEntries] = await pool.query('SELECT * FROM `fuel_entries`').catch(() => [[]]);
      const [pumps] = await pool.query('SELECT * FROM `fuel_pumps`').catch(() => [[]]);
      const [payments] = await pool.query('SELECT * FROM `pump_payments`').catch(() => [[]]);
      const [categories] = await pool.query('SELECT * FROM `vehicle_categories`').catch(() => [[]]);
      const [companies] = await pool.query('SELECT * FROM `companies`').catch(() => [[]]);
      const [vendors] = await pool.query('SELECT * FROM `vendors`').catch(() => [[]]);
      const [fuelTypes] = await pool.query('SELECT * FROM `fuel_types`').catch(() => [[]]);

      return res.status(200).json({
        success: true,
        data: {
          vehicles: (vehicles || []).map(v => ({
            ...v,
            fuel_type_id: v.fuel_type_id || 'Diesel',
            fuel_type: v.fuel_type_id || 'Diesel'
          })),
          fuelEntries: fuelEntries || [],
          pumps: pumps || [],
          payments: payments || [],
          categories: categories || [],
          companies: companies || [],
          vendors: vendors || [],
          fuelTypes: fuelTypes || []
        }
      });
    } catch (e) {
      return res.status(200).json({ success: true, data: { vehicles: [], fuelEntries: [], fuelTypes: [] } });
    }
  }

  // 12b. Bulk Excel / CSV Data Import & Auto Setup (POST /api/fleet/bulk-import)
  if (cleanUrl === '/api/fleet/bulk-import' && method === 'POST') {
    try {
      const pool = getPool();
      const { tenant_id, entity_type, rows } = req.body || {};
      if (!tenant_id || !entity_type || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ success: false, message: 'tenant_id, entity_type, and rows array required' });
      }

      const addedItems = [];

      if (entity_type === 'vehicles') {
        const categoryMap = new Map();
        const companyMap = new Map();
        const vendorMap = new Map();
        const pumpMap = new Map();
        const fuelMap = new Map();

        // Preload existing entities for this tenant so we NEVER create duplicate rows!
        const [existCats] = await pool.query('SELECT id, name FROM `vehicle_categories` WHERE `tenant_id` = ?', [tenant_id]).catch(() => [[]]);
        (existCats || []).forEach(c => c && c.name && categoryMap.set(String(c.name).trim().toLowerCase(), c.id));

        const [existComps] = await pool.query('SELECT id, name FROM `companies` WHERE `tenant_id` = ?', [tenant_id]).catch(() => [[]]);
        (existComps || []).forEach(c => c && c.name && companyMap.set(String(c.name).trim().toLowerCase(), c.id));

        const [existVends] = await pool.query('SELECT id, name FROM `vendors` WHERE `tenant_id` = ?', [tenant_id]).catch(() => [[]]);
        (existVends || []).forEach(v => v && v.name && vendorMap.set(String(v.name).trim().toLowerCase(), v.id));

        const [existPumps] = await pool.query('SELECT id, name FROM `fuel_pumps` WHERE `tenant_id` = ?', [tenant_id]).catch(() => [[]]);
        (existPumps || []).forEach(p => p && p.name && pumpMap.set(String(p.name).trim().toLowerCase(), p.id));

        const [existFuels] = await pool.query('SELECT id, name FROM `fuel_types` WHERE `tenant_id` = ?', [tenant_id]).catch(() => [[]]);
        (existFuels || []).forEach(f => f && f.name && fuelMap.set(String(f.name).trim().toLowerCase(), f.name));

        // 1. Auto-extract Categories, Companies, Vendors, Pumps, Fuel Types
        for (const r of rows) {
          const rawCat = r.category || r.vehicle_category || r.category_name;
          if (rawCat && String(rawCat).trim() && String(rawCat).trim() !== 'N/A') {
            const catName = String(rawCat).trim();
            const lower = catName.toLowerCase();
            if (!categoryMap.has(lower)) {
              const catId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              categoryMap.set(lower, catId);
              const isLph = /excavator|generator|crane|earthmover|dozer|loader|bowzer/i.test(catName);
              const bench = Number(r.benchmark_mileage || r.benchmark || r.expected_benchmark) || (isLph ? 18.0 : 8.0);
              await pool.query(
                `INSERT INTO \`vehicle_categories\` (\`id\`, \`tenant_id\`, \`user_id\`, \`name\`, \`metric_type\`, \`default_benchmark\`, \`tolerance_percentage\`, \`icon_name\`, \`description\`)
                 VALUES (?, ?, 'user_1', ?, ?, ?, 15, ?, 'Auto-imported from fleet sheet')
                 ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)`,
                [catId, tenant_id, catName, isLph ? 'lph' : 'kmpl', bench, isLph ? 'Excavator' : 'Truck']
              ).catch(() => {});
            }
          }

          const rawComp = r.assigned_company || r.company || r.company_name;
          if (rawComp && String(rawComp).trim() && String(rawComp).trim() !== 'N/A') {
            const compName = String(rawComp).trim();
            const lower = compName.toLowerCase();
            if (!companyMap.has(lower)) {
              const compId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              companyMap.set(lower, compId);
              const code = compName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || 'COMP';
              await pool.query(
                `INSERT INTO \`companies\` (\`id\`, \`tenant_id\`, \`name\`, \`code\`, \`contact_person\`, \`phone\`, \`email\`, \`address\`)
                 VALUES (?, ?, ?, ?, 'N/A', 'N/A', '', 'N/A')
                 ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)`,
                [compId, tenant_id, compName, code]
              ).catch(() => {});
            }
          }

          const rawVen = r.vehicle_vendor || r.vendor_name || r.vendor || r.supplier;
          if (rawVen && String(rawVen).trim() && String(rawVen).trim() !== 'N/A' && String(rawVen).trim().toLowerCase() !== 'own' && String(rawVen).trim().toLowerCase() !== 'none') {
            const venName = String(rawVen).trim();
            const lower = venName.toLowerCase();
            if (!vendorMap.has(lower)) {
              const venId = `ven_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              vendorMap.set(lower, venId);
              await pool.query(
                `INSERT INTO \`vendors\` (\`id\`, \`tenant_id\`, \`name\`, \`phone\`, \`address\`)
                 VALUES (?, ?, ?, ?, 'N/A')
                 ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)`,
                [venId, tenant_id, venName, r.vendor_contact || r.vendor_phone || 'N/A']
              ).catch(() => {});
            }
          }

          const rawPump = r.fuel_pumps || r.fuel_pump || r.fuel_pump_station || r.pump;
          if (rawPump && String(rawPump).trim() && String(rawPump).trim() !== 'N/A' && String(rawPump).trim().toLowerCase() !== 'none') {
            const pumpName = String(rawPump).trim();
            const lower = pumpName.toLowerCase();
            if (!pumpMap.has(lower)) {
              const pumpId = `pump_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              pumpMap.set(lower, pumpId);
              await pool.query(
                `INSERT INTO \`fuel_pumps\` (\`id\`, \`tenant_id\`, \`name\`, \`location\`, \`credit_limit\`, \`current_balance\`, \`status\`)
                 VALUES (?, ?, ?, ?, 500000, 0, 'active')
                 ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`)`,
                [pumpId, tenant_id, pumpName, r.pump_location || 'N/A']
              ).catch(() => {});
            }
          }

          // Fuel Type & Pricing Auto-Setup
          const rawFuel = r.fuel_type || r.fuel || r.fuel_type_id || r.type_of_fuel;
          if (rawFuel && String(rawFuel).trim() && String(rawFuel).trim() !== 'N/A') {
            const fuelName = String(rawFuel).trim();
            const lower = fuelName.toLowerCase();
            if (!fuelMap.has(lower)) {
              const fuelId = `fuel_${lower}_${tenant_id}`;
              fuelMap.set(lower, fuelName);
              const price = Number(r.fuel_price || r.price) || (lower === 'cng' ? 43.00 : lower === 'octane' ? 131.00 : lower === 'petrol' ? 126.00 : 108.50);
              const unit = lower === 'cng' ? 'm3' : 'Liter';
              await pool.query(
                `INSERT INTO \`fuel_types\` (\`id\`, \`tenant_id\`, \`user_id\`, \`name\`, \`code\`, \`unit\`, \`current_price\`, \`status\`)
                 VALUES (?, ?, 'user_1', ?, ?, ?, ?, 'active')
                 ON DUPLICATE KEY UPDATE \`current_price\` = VALUES(\`current_price\`)`,
                [fuelId, tenant_id, fuelName, lower, unit, price]
              ).catch(() => {});
            }
          }
        }

        // 2. Insert / Update Vehicles with exact fuel_type_id column
        for (const r of rows) {
          const rawNum = r.vehicle_reg_no || r.vehicle_number || r.plate_number || r.vehicle_no || r.plate_no || r.registration_number || r.registration_no || r.car_number || r.name;
          if (!rawNum) continue;
          const plate = String(rawNum).trim();
          const vehId = r.id || `veh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const catKey = (r.category || r.vehicle_category || '').toLowerCase().trim();
          const matchedCat = categoryMap.get(catKey) || 'cat_1';
          const compKey = (r.assigned_company || r.company || '').toLowerCase().trim();
          const matchedComp = companyMap.get(compKey) || 'comp_1';
          const venKey = (r.vendor_name || r.vendor || '').toLowerCase().trim();
          const matchedVen = vendorMap.get(venKey) || null;
          const isRented = matchedVen !== null || (r.ownership && String(r.ownership).toLowerCase() === 'rental');

          // Resolve exact fuel type name
          const rawVehicleFuel = r.fuel_type || r.fuel || r.fuel_type_id || r.type_of_fuel;
          const fuelKey = (rawVehicleFuel ? String(rawVehicleFuel).trim().toLowerCase() : '');
          const matchedFuelName = fuelMap.get(fuelKey) || (rawVehicleFuel && String(rawVehicleFuel).trim() !== 'N/A' ? String(rawVehicleFuel).trim() : 'Diesel');

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

          const bench = Number(r.benchmark_mileage || r.expected_benchmark || r.benchmark) || 8.0;
          const odo = Number(r.current_meter || r.current_odometer || r.initial_odometer) || 0;
          const dName = (driverName && String(driverName).trim()) ? String(driverName).trim() : 'N/A';
          const dPhone = (driverPhone && String(driverPhone).trim()) ? String(driverPhone).trim() : 'N/A';

          await pool.query(
            `INSERT INTO \`vehicles\` (\`id\`, \`tenant_id\`, \`vehicle_number\`, \`category_id\`, \`company_id\`, \`vendor_id\`, \`ownership\`, \`fuel_type_id\`, \`expected_benchmark\`, \`current_odometer\`, \`driver_name\`, \`driver_phone\`, \`status\`)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
             ON DUPLICATE KEY UPDATE
               \`vehicle_number\` = VALUES(\`vehicle_number\`),
               \`category_id\` = VALUES(\`category_id\`),
               \`company_id\` = VALUES(\`company_id\`),
               \`vendor_id\` = VALUES(\`vendor_id\`),
               \`ownership\` = VALUES(\`ownership\`),
               \`fuel_type_id\` = VALUES(\`fuel_type_id\`),
               \`expected_benchmark\` = VALUES(\`expected_benchmark\`),
               \`current_odometer\` = VALUES(\`current_odometer\`),
               \`driver_name\` = VALUES(\`driver_name\`),
               \`driver_phone\` = VALUES(\`driver_phone\`)`,
            [
              vehId, tenant_id, plate,
              matchedCat, matchedComp, matchedVen,
              isRented ? 'rented' : 'owned',
              matchedFuelName,
              bench, odo, dName, dPhone
            ]
          ).catch((e) => {
            console.warn('[MySQL] Vehicle bulk insert error:', e);
          });

          addedItems.push({
            id: vehId,
            tenant_id,
            vehicle_number: plate,
            plate_number: plate,
            category_id: matchedCat,
            company_id: matchedComp,
            vendor_id: matchedVen,
            ownership: isRented ? 'rented' : 'owned',
            fuel_type_id: matchedFuelName,
            fuel_type: matchedFuelName,
            expected_benchmark: bench,
            current_odometer: odo,
            driver_name: dName,
            driver_phone: dPhone,
            status: 'active'
          });
        }
      }

      return res.status(200).json({
        success: true,
        count: rows.length,
        new_count: rows.length,
        updated_count: 0,
        items: addedItems,
        message: `Bulk import completed! ${rows.length} records processed and registered.`
      });
    } catch (bulkErr) {
      console.error('[Bulk Import Error]:', bulkErr);
      return res.status(500).json({ success: false, message: bulkErr?.message || 'Bulk import failed' });
    }
  }

  // 12c. Fleet Entities POST, PATCH & DELETE endpoints
  // Companies
  if (cleanUrl.startsWith('/api/fleet/companies') && method === 'DELETE') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[parts.length - 1];
      const pool = getPool();
      await pool.query('DELETE FROM `companies` WHERE `id` = ?', [id]);
      return res.status(200).json({ success: true, message: 'Company deleted successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  if (cleanUrl.startsWith('/api/fleet/companies') && method === 'PATCH') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[parts.length - 1];
      const pool = getPool();
      const updates = req.body || {};
      const fields = [];
      const values = [];
      Object.entries(updates).forEach(([k, v]) => {
        fields.push(`\`${k}\` = ?`);
        values.push(v);
      });
      if (fields.length > 0) {
        values.push(id);
        await pool.query(`UPDATE \`companies\` SET ${fields.join(', ')} WHERE \`id\` = ?`, values);
      }
      return res.status(200).json({ success: true, message: 'Company updated' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  // Vendors
  if (cleanUrl.startsWith('/api/fleet/vendors') && method === 'DELETE') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[parts.length - 1];
      const pool = getPool();
      await pool.query('DELETE FROM `vendors` WHERE `id` = ?', [id]);
      return res.status(200).json({ success: true, message: 'Vendor deleted successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  if (cleanUrl.startsWith('/api/fleet/vendors/') && method === 'PATCH') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[4];
      const pool = getPool();
      const updates = req.body || {};
      const fields = [];
      const values = [];
      Object.entries(updates).forEach(([k, v]) => {
        fields.push(`\`${k}\` = ?`);
        values.push(v);
      });
      if (fields.length > 0) {
        values.push(id);
        await pool.query(`UPDATE \`vendors\` SET ${fields.join(', ')} WHERE \`id\` = ?`, values);
      }
      return res.status(200).json({ success: true, message: 'Vendor updated' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  // Pumps
  if (cleanUrl.startsWith('/api/fleet/pumps') && method === 'DELETE') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[parts.length - 1];
      const pool = getPool();
      await pool.query('DELETE FROM `fuel_pumps` WHERE `id` = ?', [id]);
      return res.status(200).json({ success: true, message: 'Pump deleted successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  if (cleanUrl.startsWith('/api/fleet/pumps/') && method === 'PATCH') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[4];
      const pool = getPool();
      const updates = req.body || {};
      const fields = [];
      const values = [];
      Object.entries(updates).forEach(([k, v]) => {
        fields.push(`\`${k}\` = ?`);
        values.push(v);
      });
      if (fields.length > 0) {
        values.push(id);
        await pool.query(`UPDATE \`fuel_pumps\` SET ${fields.join(', ')} WHERE \`id\` = ?`, values);
      }
      return res.status(200).json({ success: true, message: 'Pump updated' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  // Categories
  if (cleanUrl.startsWith('/api/fleet/categories') && method === 'DELETE') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[parts.length - 1];
      const pool = getPool();
      await pool.query('DELETE FROM `vehicle_categories` WHERE `id` = ?', [id]);
      return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  // Vehicles
  if (cleanUrl.startsWith('/api/fleet/vehicles') && method === 'DELETE') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[parts.length - 1];
      const pool = getPool();
      await pool.query('DELETE FROM `vehicles` WHERE `id` = ?', [id]);
      return res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  // Fuel entries
  if (cleanUrl.startsWith('/api/fleet/fuel-entries/') && method === 'PATCH') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[4];
      const pool = getPool();
      const updates = req.body || {};
      const fields = [];
      const values = [];
      Object.entries(updates).forEach(([k, v]) => {
        fields.push(`\`${k}\` = ?`);
        values.push(v);
      });
      if (fields.length > 0) {
        values.push(id);
        await pool.query(`UPDATE \`fuel_entries\` SET ${fields.join(', ')} WHERE \`id\` = ?`, values);
      }
      return res.status(200).json({ success: true, message: 'Fuel entry updated' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  if (cleanUrl.startsWith('/api/fleet/fuel-entries/') && method === 'DELETE') {
    try {
      const parts = cleanUrl.split('/');
      const id = parts[4];
      const pool = getPool();
      await pool.query('DELETE FROM `fuel_entries` WHERE `id` = ?', [id]);
      return res.status(200).json({ success: true, message: 'Fuel entry deleted' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message });
    }
  }

  // 13. Dynamic Fuel Types (GET, POST, PATCH, DELETE /api/master/fuel-types)
  if (cleanUrl.startsWith('/api/master/fuel-types')) {
    const pool = getPool();
    const parts = cleanUrl.split('/');
    const fuelTypeId = parts[4] || null;

    // Ensure fuel_types table exists
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS \`fuel_types\` (
        \`id\` VARCHAR(128) PRIMARY KEY,
        \`tenant_id\` VARCHAR(128),
        \`user_id\` VARCHAR(128),
        \`name\` VARCHAR(128) NOT NULL,
        \`code\` VARCHAR(64) NOT NULL,
        \`unit\` VARCHAR(64) DEFAULT 'Liter',
        \`current_price\` DECIMAL(10, 2) NOT NULL,
        \`price_history\` JSON,
        \`updated_at\` VARCHAR(64),
        \`created_at\` VARCHAR(64)
      )`).catch(() => {});
    } catch (e) {}

    // GET /api/master/fuel-types
    if (method === 'GET') {
      try {
        const [rows] = await pool.query('SELECT * FROM `fuel_types` ORDER BY `created_at` DESC');
        const formatted = (rows || []).map(r => ({
          ...r,
          current_price: Number(r.current_price) || 0,
          price_history: typeof r.price_history === 'string' ? JSON.parse(r.price_history) : (r.price_history || [])
        }));
        return res.status(200).json({ success: true, data: formatted });
      } catch (err) {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    // POST /api/master/fuel-types
    if (method === 'POST') {
      try {
        const body = await parseBody(req);
        const { tenant_id, name, code, unit, current_price, user_id } = body;
        if (!name || current_price === undefined) {
          return res.status(400).json({ success: false, message: 'Fuel name and price are required.' });
        }
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
          updated_at: today,
          created_at: today
        };

        await pool.query(
          `INSERT INTO \`fuel_types\` (
            \`id\`, \`tenant_id\`, \`user_id\`, \`name\`, \`code\`, \`unit\`, \`current_price\`, \`price_history\`, \`updated_at\`, \`created_at\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            \`name\` = VALUES(\`name\`),
            \`current_price\` = VALUES(\`current_price\`),
            \`price_history\` = VALUES(\`price_history\`),
            \`updated_at\` = VALUES(\`updated_at\`)`,
          [
            newFuelType.id,
            newFuelType.tenant_id,
            newFuelType.user_id,
            newFuelType.name,
            newFuelType.code,
            newFuelType.unit,
            newFuelType.current_price,
            JSON.stringify(newFuelType.price_history),
            newFuelType.updated_at,
            newFuelType.created_at
          ]
        ).catch(dbErr => console.warn('[TiDB] Fuel type insert error:', dbErr?.message));

        return res.status(201).json({
          success: true,
          fuelType: newFuelType,
          message: 'Fuel type created successfully.'
        });
      } catch (err) {
        return res.status(500).json({ success: false, message: err?.message || 'Error creating fuel type' });
      }
    }

    // PATCH /api/master/fuel-types/:id
    if (method === 'PATCH' && fuelTypeId) {
      try {
        const updates = await parseBody(req);
        const today = new Date().toISOString().split('T')[0];
        const [rows] = await pool.query('SELECT * FROM `fuel_types` WHERE `id` = ?', [fuelTypeId]);
        let existing = rows?.[0];
        let history = [];
        if (existing) {
          try {
            history = typeof existing.price_history === 'string' ? JSON.parse(existing.price_history) : (existing.price_history || []);
          } catch (e) {}
        }
        if (updates.current_price !== undefined) {
          history.push({
            date: today,
            price: Number(updates.current_price),
            changed_by: updates.changed_by || 'Admin'
          });
        }
        const updatedFuel = {
          id: fuelTypeId,
          name: updates.name || existing?.name || '',
          code: updates.code || existing?.code || '',
          unit: updates.unit || existing?.unit || 'Liter',
          current_price: Number(updates.current_price ?? existing?.current_price ?? 0),
          price_history: history,
          updated_at: today
        };

        await pool.query(
          'UPDATE `fuel_types` SET `name` = ?, `current_price` = ?, `price_history` = ?, `updated_at` = ? WHERE `id` = ?',
          [updatedFuel.name, updatedFuel.current_price, JSON.stringify(history), today, fuelTypeId]
        ).catch(() => {});

        return res.status(200).json({ success: true, fuelType: updatedFuel, message: 'Fuel type updated.' });
      } catch (err) {
        return res.status(500).json({ success: false, message: err?.message || 'Error updating fuel type' });
      }
    }

    // DELETE /api/master/fuel-types/:id
    if (method === 'DELETE' && fuelTypeId) {
      try {
        await pool.query('DELETE FROM `fuel_types` WHERE `id` = ?', [fuelTypeId]).catch(() => {});
        return res.status(200).json({ success: true, message: 'Fuel type deleted successfully.' });
      } catch (err) {
        return res.status(500).json({ success: false, message: err?.message || 'Error deleting fuel type' });
      }
    }
  }

  // 14. Subscription Upgrade & Verification Payments (GET, POST /api/subscription-payments)
  if (cleanUrl.startsWith('/api/subscription-payments')) {
    const pool = getPool();
    const parts = cleanUrl.split('/');
    const isApprove = cleanUrl.includes('/approve');
    const isReject = cleanUrl.includes('/reject');
    let paymentId = '';
    if (isApprove || isReject) {
      paymentId = parts[3];
    }

    // Ensure subscription_payments table exists
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS \`subscription_payments\` (
        \`id\` VARCHAR(128) PRIMARY KEY,
        \`tenant_id\` VARCHAR(128) NOT NULL,
        \`tenant_name\` VARCHAR(255),
        \`user_id\` VARCHAR(128),
        \`user_name\` VARCHAR(255),
        \`user_email\` VARCHAR(255),
        \`user_phone\` VARCHAR(64),
        \`plan_id\` VARCHAR(64) NOT NULL,
        \`plan_name\` VARCHAR(128),
        \`plan_days\` INT DEFAULT 30,
        \`amount_bdt\` DECIMAL(10, 2) NOT NULL,
        \`payment_method\` VARCHAR(64) NOT NULL,
        \`sender_number\` VARCHAR(64),
        \`transaction_id\` VARCHAR(128) NOT NULL,
        \`payment_date\` VARCHAR(64),
        \`receipt_image\` LONGTEXT,
        \`notes\` TEXT,
        \`status\` VARCHAR(64) DEFAULT 'pending',
        \`reviewed_by\` VARCHAR(128),
        \`reviewed_at\` VARCHAR(64),
        \`rejection_reason\` TEXT,
        \`created_at\` VARCHAR(64)
      )`).catch(() => {});
    } catch (e) {}

    // GET /api/subscription-payments
    if (method === 'GET') {
      try {
        const [rows] = await pool.query('SELECT * FROM `subscription_payments` ORDER BY `created_at` DESC');
        return res.status(200).json({ success: true, data: rows || [] });
      } catch (err) {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    // POST /api/subscription-payments (Submit upgrade payment verification)
    if (method === 'POST' && !isApprove && !isReject) {
      try {
        const body = await parseBody(req);
        const {
          tenant_id, tenant_name, user_id, user_name, user_email, user_phone,
          plan_id, plan_name, plan_days, amount_bdt, payment_method,
          sender_number, transaction_id, payment_date, receipt_image, notes
        } = body;

        if (!tenant_id || !transaction_id || !payment_method) {
          return res.status(400).json({ success: false, message: 'Tenant ID, payment method, and Transaction ID (TrxID) are required.' });
        }

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

        await pool.query(
          `INSERT INTO \`subscription_payments\` (
            \`id\`, \`tenant_id\`, \`tenant_name\`, \`user_id\`, \`user_name\`, \`user_email\`, \`user_phone\`,
            \`plan_id\`, \`plan_name\`, \`plan_days\`, \`amount_bdt\`, \`payment_method\`, \`sender_number\`,
            \`transaction_id\`, \`payment_date\`, \`receipt_image\`, \`notes\`, \`status\`, \`created_at\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newPayment.id, newPayment.tenant_id, newPayment.tenant_name, newPayment.user_id,
            newPayment.user_name, newPayment.user_email, newPayment.user_phone, newPayment.plan_id,
            newPayment.plan_name, newPayment.plan_days, newPayment.amount_bdt, newPayment.payment_method,
            newPayment.sender_number, newPayment.transaction_id, newPayment.payment_date,
            newPayment.receipt_image, newPayment.notes, newPayment.status, newPayment.created_at
          ]
        ).catch(e => console.warn('[TiDB] Save payment error:', e?.message));

        return res.status(201).json({
          success: true,
          payment: newPayment,
          message: 'Payment verification details submitted successfully. Master Control will verify and activate your validity.'
        });
      } catch (err) {
        return res.status(500).json({ success: false, message: err?.message || 'Error submitting payment details' });
      }
    }

    // POST /api/subscription-payments/:id/approve
    if (method === 'POST' && isApprove && paymentId) {
      try {
        const body = await parseBody(req);
        const reviewer = body.reviewed_by || 'Master Administrator';
        const now = new Date().toISOString();

        // 1. Fetch payment record
        const [rows] = await pool.query('SELECT * FROM `subscription_payments` WHERE `id` = ?', [paymentId]);
        const paymentRecord = rows?.[0];
        if (!paymentRecord) {
          return res.status(404).json({ success: false, message: 'Payment record not found.' });
        }

        // 2. Fetch tenant
        const [tRows] = await pool.query('SELECT * FROM `tenants` WHERE `id` = ?', [paymentRecord.tenant_id]);
        const tenant = tRows?.[0];
        if (!tenant) {
          return res.status(404).json({ success: false, message: 'Associated subscriber workspace not found.' });
        }

        // 3. Calculate new subscription end date
        const addDays = Number(paymentRecord.plan_days) || 30;
        let baseDate = new Date();
        const currentEndStr = tenant.subscription_end_date;
        if (currentEndStr) {
          const currentEndDate = new Date(currentEndStr);
          // If current end date is in the future, extend from current end date!
          if (currentEndDate.getTime() > Date.now()) {
            baseDate = currentEndDate;
          }
        }
        baseDate.setDate(baseDate.getDate() + addDays);
        const newEndDate = baseDate.toISOString().split('T')[0];

        // 4. Update tenant subscription validity
        let sub = {};
        try {
          sub = typeof tenant.subscription_raw === 'string' ? JSON.parse(tenant.subscription_raw) : (tenant.subscription_raw || {});
        } catch (e) {}
        sub.status = 'active';
        sub.is_approved = true;
        sub.plan = paymentRecord.plan_id;
        sub.plan_name_bn = paymentRecord.plan_name;
        sub.end_date = newEndDate;
        sub.price_bdt = Number(paymentRecord.amount_bdt);
        sub.payment_status = 'paid';

        await pool.query(
          `UPDATE \`tenants\` SET
            \`status\` = 'active',
            \`subscription_status\` = 'active',
            \`subscription_plan\` = ?,
            \`subscription_end_date\` = ?,
            \`subscription_price\` = ?,
            \`subscription_raw\` = ?,
            \`is_approved\` = 1
          WHERE \`id\` = ?`,
          [paymentRecord.plan_id, newEndDate, Number(paymentRecord.amount_bdt), JSON.stringify(sub), tenant.id]
        );

        // Also reactivate super_admin user if suspended
        await pool.query("UPDATE `users` SET `status` = 'active' WHERE `tenant_id` = ?", [tenant.id]).catch(() => {});

        // 5. Update payment record to approved
        await pool.query(
          'UPDATE `subscription_payments` SET `status` = \'approved\', `reviewed_by` = ?, `reviewed_at` = ? WHERE `id` = ?',
          [reviewer, now, paymentId]
        );

        return res.status(200).json({
          success: true,
          message: `Payment verified & approved! Subscription validity for "${tenant.name}" extended until ${newEndDate} (+${addDays} days).`,
          new_end_date: newEndDate,
          extended_days: addDays
        });
      } catch (err) {
        return res.status(500).json({ success: false, message: err?.message || 'Error approving payment' });
      }
    }

    // POST /api/subscription-payments/:id/reject
    if (method === 'POST' && isReject && paymentId) {
      try {
        const body = await parseBody(req);
        const reviewer = body.reviewed_by || 'Master Administrator';
        const reason = body.reason || 'TrxID could not be matched with bank/MFS statement';
        const now = new Date().toISOString();

        await pool.query(
          'UPDATE `subscription_payments` SET `status` = \'rejected\', `reviewed_by` = ?, `reviewed_at` = ?, `rejection_reason` = ? WHERE `id` = ?',
          [reviewer, now, reason, paymentId]
        );

        return res.status(200).json({
          success: true,
          message: 'Payment verification marked as rejected.'
        });
      } catch (err) {
        return res.status(500).json({ success: false, message: err?.message || 'Error rejecting payment' });
      }
    }
  }

  // 15. Public & Owner CMS Content (GET /api/public/content, POST /api/owner/content)
  if (cleanUrl === '/api/public/content' && method === 'GET') {
    try {
      const pool = getPool();
      await pool.query(`CREATE TABLE IF NOT EXISTS \`site_content\` (
        \`key_name\` VARCHAR(64) PRIMARY KEY,
        \`content_json\` LONGTEXT,
        \`updated_at\` VARCHAR(64)
      )`).catch(() => {});

      const [rows] = await pool.query('SELECT `content_json` FROM `site_content` WHERE `key_name` = ? LIMIT 1', ['default_site_content']);
      if (rows && rows.length > 0 && rows[0].content_json) {
        const parsed = JSON.parse(rows[0].content_json);
        return res.status(200).json({ success: true, content: parsed });
      }
      return res.status(200).json({ success: true, content: null });
    } catch (e) {
      return res.status(200).json({ success: true, content: null });
    }
  }

  if (cleanUrl === '/api/owner/content' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { content } = body;
      if (!content) {
        return res.status(400).json({ success: false, message: 'Content is required.' });
      }
      const pool = getPool();
      await pool.query(`CREATE TABLE IF NOT EXISTS \`site_content\` (
        \`key_name\` VARCHAR(64) PRIMARY KEY,
        \`content_json\` LONGTEXT,
        \`updated_at\` VARCHAR(64)
      )`).catch(() => {});

      const jsonStr = JSON.stringify(content);
      const now = new Date().toISOString();
      await pool.query(
        'INSERT INTO `site_content` (`key_name`, `content_json`, `updated_at`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `content_json` = VALUES(`content_json`), `updated_at` = VALUES(`updated_at`)',
        ['default_site_content', jsonStr, now]
      );
      return res.status(200).json({ success: true, message: 'Content updated successfully.', content });
    } catch (err) {
      return res.status(500).json({ success: false, message: err?.message || 'Error saving content' });
    }
  }

  // 16. Public Contact Submission & Admin Alert (POST /api/contact)
  if (cleanUrl === '/api/contact' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { name, email, phone, company_name, subject, message } = body;
      if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
      }
      const pool = getPool();
      await pool.query(`CREATE TABLE IF NOT EXISTS \`contact_messages\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`name\` VARCHAR(128),
        \`email\` VARCHAR(128),
        \`phone\` VARCHAR(64),
        \`company_name\` VARCHAR(128),
        \`subject\` VARCHAR(255),
        \`message\` TEXT,
        \`created_at\` VARCHAR(64)
      )`).catch(() => {});

      const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const now = new Date().toISOString();
      await pool.query(
        'INSERT INTO `contact_messages` (`id`, `name`, `email`, `phone`, `company_name`, `subject`, `message`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [msgId, String(name).trim(), String(email).trim(), String(phone || '').trim(), String(company_name || '').trim(), String(subject || 'General Inquiry').trim(), String(message).trim(), now]
      );

      // Email dispatch to admin.fuelnest@gmail.com
      sendEmailViaResend({
        to: 'admin.fuelnest@gmail.com',
        subject: `📩 [Website Contact] ${subject || 'New Message'} from ${name}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h3 style="color: #0f172a; margin-top: 0;">New Contact Form Message</h3>
            <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Company:</strong> ${company_name || 'N/A'}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="background: #f8fafc; padding: 14px; border-radius: 8px; margin: 15px 0;">
              ${String(message).replace(/\n/g, '<br/>')}
            </div>
            <p style="font-size: 11px; color: #94a3b8;">Forwarded automatically to admin.fuelnest@gmail.com</p>
          </div>
        `
      }).catch(() => {});

      return res.status(200).json({ success: true, message: 'Message sent successfully.' });
    } catch (e) {
      return res.status(500).json({ success: false, message: e?.message });
    }
  }

  // 17. Contact Messages List (GET, DELETE /api/owner/contact-messages)
  if (cleanUrl.startsWith('/api/owner/contact-messages')) {
    const pool = getPool();
    if (method === 'GET') {
      try {
        const [rows] = await pool.query('SELECT * FROM `contact_messages` ORDER BY `created_at` DESC');
        return res.status(200).json({ success: true, messages: rows || [] });
      } catch (e) {
        return res.status(200).json({ success: true, messages: [] });
      }
    }
    if (method === 'DELETE') {
      const parts = cleanUrl.split('/');
      const msgId = parts[4];
      if (msgId) {
        try {
          await pool.query('DELETE FROM `contact_messages` WHERE `id` = ?', [msgId]);
          return res.status(200).json({ success: true, message: 'Message deleted.' });
        } catch (e) {
          return res.status(500).json({ success: false, message: e?.message });
        }
      }
    }
  }

  // 18. Send Subscriber Credentials Email (POST /api/subscribers/registration-requests/:id/send-email)
  if (cleanUrl.includes('/send-email') && method === 'POST') {
    try {
      const body = await parseBody(req);
      const parts = cleanUrl.split('/');
      let reqId = '';
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'send-email' && i > 0) {
          reqId = parts[i - 1];
          break;
        }
      }

      const pool = getPool();
      let targetEmail = body.to || body.email;
      let targetName = body.companyName || body.company_name || 'Subscriber';
      let targetUser = body.username || 'admin';
      let targetPass = body.tempPassword || body.password || '';
      let targetLogin = body.loginUrl || 'https://fuelnest.xyz/login';

      if (reqId && (!targetEmail || !targetPass)) {
        // Query tenant
        const cleanId = reqId.replace('reg_', '');
        const [rows] = await pool.query('SELECT * FROM `tenants` WHERE `id` = ?', [cleanId]);
        if (rows && rows[0]) {
          const t = rows[0];
          targetEmail = targetEmail || t.email;
          targetName = targetName || t.name;
          let sub = {};
          try { sub = typeof t.subscription_raw === 'string' ? JSON.parse(t.subscription_raw) : (t.subscription_raw || {}); } catch (e) {}
          targetUser = targetUser || sub.super_admin_username || t.code?.toLowerCase();
          targetPass = targetPass || sub.super_admin_password || 'Welcome@123';
        }
      }

      if (!targetEmail) {
        return res.status(400).json({ success: false, message: 'Recipient email is required.' });
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0f172a, #1e293b); padding: 20px; border-radius: 10px; color: #f59e0b; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800;">FuelNest Workspace Access Credentials</h2>
            <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px;">Official Activation Notice &bull; Sent from admin.fuelnest@gmail.com</p>
          </div>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Dear ${targetName},<br/><br/>
            Your FuelNest Fleet & Fuel Management Workspace has been approved and activated! You can now log in using the credentials below:
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 6px 0; font-size: 13px;"><strong>Login Portal:</strong> <a href="${targetLogin}" style="color: #0284c7; font-weight: bold;">${targetLogin}</a></p>
            <p style="margin: 6px 0; font-size: 13px;"><strong>Super Admin Username:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #0f172a;">${targetUser}</code></p>
            <p style="margin: 6px 0; font-size: 13px;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #d97706;">${targetPass}</code></p>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            Security Note: You will be prompted to set your personal permanent password upon your initial sign-in.
          </p>
          <p style="font-size: 13px; color: #334155; margin-top: 24px;">
            Best regards,<br/>
            <strong>Master Administration Team</strong><br/>
            <span style="color: #0284c7;">admin.fuelnest@gmail.com</span><br/>
            FuelNest Telemetry Cloud
          </p>
        </div>
      `;

      const sendRes = await sendEmailViaResend({
        to: targetEmail,
        subject: `FuelNest Workspace Access Credentials - ${targetName}`,
        html: emailHtml
      });

      return res.status(200).json({
        success: true,
        message: 'Credentials email dispatched successfully to subscriber from admin.fuelnest@gmail.com',
        send_result: sendRes
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: e?.message });
    }
  }

  // 19. Admin Notifications Queue (GET /api/admin/notifications)
  if (cleanUrl === '/api/admin/notifications' && method === 'GET') {
    try {
      const pool = getPool();
      await pool.query(`CREATE TABLE IF NOT EXISTS \`admin_notifications\` (
        \`id\` VARCHAR(64) PRIMARY KEY,
        \`type\` VARCHAR(64),
        \`subject\` VARCHAR(255),
        \`details_json\` LONGTEXT,
        \`read_status\` TINYINT DEFAULT 0,
        \`created_at\` VARCHAR(64)
      )`).catch(() => {});

      const [rows] = await pool.query('SELECT * FROM `admin_notifications` ORDER BY `created_at` DESC LIMIT 50');
      return res.status(200).json({ success: true, notifications: rows || [] });
    } catch (e) {
      return res.status(200).json({ success: true, notifications: [] });
    }
  }

  // Catch-all fallback
  return res.status(200).json({
    success: true,
    message: 'FuelNest API Serverless Route',
    url: cleanUrl
  });
}
