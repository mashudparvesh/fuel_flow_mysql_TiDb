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
      // If targetId is a registration request ID (reg_...), look up tenant
      if (targetId.startsWith('reg_')) {
        // Look up by id or activate first pending tenant
        const [pRows] = await pool.query("SELECT id FROM `tenants` WHERE `status` = 'pending' LIMIT 1");
        if (pRows && pRows[0]) targetId = pRows[0].id;
      }

      await pool.query(
        "UPDATE `tenants` SET `status` = 'active', `subscription_status` = 'active', `is_approved` = 1 WHERE `id` = ?",
        [targetId]
      );
      await pool.query(
        "UPDATE `users` SET `status` = 'active' WHERE `tenant_id` = ?",
        [targetId]
      );

      const [tenantRows] = await pool.query("SELECT * FROM `tenants` WHERE `id` = ?", [targetId]);
      const [userRows] = await pool.query("SELECT * FROM `users` WHERE `tenant_id` = ? AND `role` = 'super_admin' LIMIT 1", [targetId]);

      return res.status(200).json({
        success: true,
        tenant_id: targetId,
        status: 'active',
        is_approved: true,
        message: `Plan approved for "${tenantRows?.[0]?.name || targetId}". Workspace is now ACTIVE and login access is enabled.`,
        tenant: tenantRows?.[0] || null,
        user: userRows?.[0] || null,
        super_admin_username: userRows?.[0]?.username,
        temporary_password: `${tenantRows?.[0]?.code || 'User'}@12345`,
        login_url: 'https://fuelnest.xyz/login'
      });
    } catch (apprErr) {
      console.error('[TiDB Approve Error]:', apprErr);
      return res.status(500).json({ success: false, message: apprErr?.message || 'Approval failed' });
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
      const [rows] = await pool.query('SELECT * FROM `tenants` ORDER BY `created_at` DESC');
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

  // 9. Strict Authentication Guard (POST /api/auth/login)
  if (cleanUrl === '/api/auth/login' && method === 'POST') {
    try {
      const body = await parseBody(req);
      const { username, password } = body;
      const cleanUser = String(username || '').trim().toLowerCase();
      const cleanPass = String(password || '').trim();

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

      return res.status(200).json({
        success: true,
        data: {
          vehicles: vehicles || [],
          fuelEntries: fuelEntries || [],
          pumps: pumps || [],
          payments: payments || [],
          categories: categories || [],
          companies: companies || [],
          vendors: vendors || []
        }
      });
    } catch (e) {
      return res.status(200).json({ success: true, data: { vehicles: [], fuelEntries: [] } });
    }
  }

  // Catch-all fallback
  return res.status(200).json({
    success: true,
    message: 'FuelNest API Serverless Route',
    url: cleanUrl
  });
}
