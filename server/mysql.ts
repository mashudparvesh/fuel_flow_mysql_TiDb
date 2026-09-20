import mysql from 'mysql2/promise';
import type { Pool, PoolOptions } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

export interface DatabaseStatus {
  configured: boolean;
  connected: boolean;
  provider: string; // 'TiDB Cloud' | 'MySQL' | 'Local File Fallback' | 'Offline'
  host?: string;
  port?: number;
  database?: string;
  pingMs?: number;
  tableCounts?: Record<string, number>;
  error?: string | null;
  lastChecked: string;
}

let pool: Pool | null = null;
let isInitialized = false;
let initPromise: Promise<boolean> | null = null;
let lastStatus: DatabaseStatus = {
  configured: false,
  connected: false,
  provider: 'Local File Fallback',
  lastChecked: new Date().toISOString()
};

/**
 * Parses MySQL connection configuration from environment variables
 */
export function getMySQLConfig(): PoolOptions | null {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && (dbUrl.startsWith('mysql://') || dbUrl.startsWith('mysql2://')) && !dbUrl.includes('infinityfree') && !dbUrl.includes('epizy') && !dbUrl.includes('byetcluster')) {
    try {
      const url = new URL(dbUrl);
      const isSsl = url.searchParams.get('ssl') === 'true' || url.searchParams.get('sslaccept') === 'strict' || dbUrl.includes('tidbcloud.com');
      return {
        host: url.hostname,
        port: parseInt(url.port || '3306', 10),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, '') || 'fuelflow',
        ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 7000
      };
    } catch (e) {
      console.error('[MySQL] Error parsing DATABASE_URL:', e);
    }
  }

  let host = process.env.MYSQL_HOST?.trim();
  let user = process.env.MYSQL_USER?.trim();
  let password = process.env.MYSQL_PASSWORD?.trim() ?? '';
  let database = process.env.MYSQL_DATABASE?.trim() || 'test';
  let port = parseInt(process.env.MYSQL_PORT?.trim() || '4000', 10);
  const sslEnv = process.env.MYSQL_SSL?.trim().toLowerCase();

  // If host is empty or points to the blocked InfinityFree host or TiDB Cloud, ensure TiDB credentials with password
  if (!host || host.includes('infinityfree') || host.includes('epizy') || host.includes('byetcluster') || host.includes('tidbcloud')) {
    host = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
    user = '3vs45pD8HohQ35M.root';
    port = 4000;
    database = 'test';
    // Use user-provided TiDB password if environment still holds the old InfinityFree password or is empty
    if (!password || password === 'MashudAlone420' || host.includes('tidbcloud')) {
      password = (process.env.MYSQL_PASSWORD && process.env.MYSQL_PASSWORD !== 'MashudAlone420') 
        ? process.env.MYSQL_PASSWORD 
        : 'FaiamIkyLcN3kABc';
    }
  }

  if (!host || !user) {
    return null;
  }

  const useSsl = sslEnv === 'true' || sslEnv === '1' || host.includes('tidbcloud.com') || host.includes('aivencloud.com') || !sslEnv;

  return {
    host,
    port,
    user,
    password,
    database,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 7000
  };
}

export function isMySQLConfigured(): boolean {
  return getMySQLConfig() !== null;
}

/**
 * Initializes the MySQL pool, tests connection, and automatically migrates tables.
 * If connection fails, safely falls back to local JSON file storage with clear diagnostic advice.
 */
export async function initMySQLDatabase(forceRetry: boolean = false): Promise<boolean> {
  if (forceRetry) {
    if (pool) {
      try { await pool.end(); } catch (e) {}
      pool = null;
    }
    initPromise = null;
    isInitialized = false;
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const config = getMySQLConfig();
    if (!config) {
      console.log('[MySQL] No MySQL environment variables set. Running in Local File Storage mode.');
      lastStatus = {
        configured: false,
        connected: false,
        provider: 'Local File Storage',
        error: 'MySQL environment variables (MYSQL_HOST, MYSQL_USER) not set.',
        lastChecked: new Date().toISOString()
      };
      return false;
    }

    const hostStr = String(config.host || '').toLowerCase();

    // If host is TiDB Cloud but password has not been provided yet
    if (!config.password) {
      const notice = "TiDB Cloud cluster detected (3vs45pD8HohQ35M.root @ gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000). Please click 'Generate Password' in your TiDB Cloud tab, then set MYSQL_PASSWORD in Settings > Secrets to activate live cloud database storage.";
      console.warn(`[MySQL Setup] ${notice}`);
      lastStatus = {
        configured: true,
        connected: false,
        provider: 'TiDB Cloud Serverless (Pending Password)',
        host: config.host,
        port: config.port,
        database: config.database,
        error: notice,
        lastChecked: new Date().toISOString()
      };
      initPromise = null;
      return false;
    }

    // Check if host is InfinityFree or other shared free web hosting that blocks external remote MySQL connections
    if (hostStr.includes('infinityfree') || hostStr.includes('epizy') || hostStr.includes('byetcluster')) {
      const friendlyNotice = `InfinityFree does not support Remote MySQL connections (incoming connections from external cloud platforms like Google Cloud Run are blocked by InfinityFree firewall). To use free cloud MySQL, please use TiDB Cloud Serverless (tidbcloud.com - 5GB free forever with remote access) or Aiven MySQL. Running in safe local file mode.`;
      console.warn(`[MySQL Fallback Mode] ${friendlyNotice}`);
      lastStatus = {
        configured: true,
        connected: false,
        provider: 'Local Storage (Fallback Active)',
        host: config.host,
        port: config.port,
        database: config.database,
        error: friendlyNotice,
        lastChecked: new Date().toISOString()
      };
      initPromise = null;
      return false;
    }

    try {
      console.log(`[MySQL] Connecting to ${config.host}:${config.port}/${config.database} as ${config.user}...`);
      pool = mysql.createPool(config);

      // Verify connection with simple PING
      const t0 = Date.now();
      const [rows] = await pool.query('SELECT 1 + 1 AS pingResult');
      const pingMs = Date.now() - t0;
      console.log(`[MySQL] Connected successfully! Ping latency: ${pingMs}ms`);

      // Determine provider
      let provider = 'MySQL';
      if (String(config.host).includes('tidbcloud.com')) provider = 'TiDB Cloud Serverless';
      else if (String(config.host).includes('aivencloud.com')) provider = 'Aiven MySQL';
      else if (String(config.host).includes('clever-cloud.com')) provider = 'Clever Cloud';
      else if (String(config.host).includes('localhost') || String(config.host) === '127.0.0.1') provider = 'Local MySQL';

      lastStatus = {
        configured: true,
        connected: true,
        provider,
        host: config.host,
        port: config.port,
        database: config.database,
        pingMs,
        error: null,
        lastChecked: new Date().toISOString()
      };

      // Auto-migrate tables
      await runMigrations(pool);

      // Auto-seed initial tenants & users if empty
      await seedInitialDataIfEmpty(pool);

      isInitialized = true;

      // Refresh table row counts in background
      updateTableCounts().catch(err => console.warn('[MySQL] Error counting tables:', err));

      return true;
    } catch (err: any) {
      if (pool) {
        try { await pool.end(); } catch (e) {}
        pool = null;
      }
      initPromise = null; // Reset so user can retry

      let friendlyError = err?.message || 'Failed to connect to MySQL database';
      if (hostStr.includes('infinityfree') || hostStr.includes('epizy') || hostStr.includes('byetcluster')) {
        friendlyError = 'InfinityFree does not support Remote MySQL connections (connections outside InfinityFree are blocked). Use TiDB Cloud Serverless (5GB free forever) or Aiven MySQL.';
      } else if (err?.code === 'EAI_AGAIN' || err?.code === 'ENOTFOUND') {
        friendlyError = `Host '${config.host}' could not be resolved (DNS lookup failed). Remote MySQL might be blocked or hostname is incorrect. Safe local storage fallback active.`;
      } else if (err?.code === 'ETIMEDOUT') {
        friendlyError = `Connection to '${config.host}:${config.port}' timed out. The server firewall may be blocking port ${config.port}. Safe local storage fallback active.`;
      } else if (err?.code === 'ECONNREFUSED') {
        friendlyError = `Connection refused by '${config.host}:${config.port}'. Check if MySQL is running. Safe local storage fallback active.`;
      } else if (err?.code === 'ER_ACCESS_DENIED_ERROR') {
        friendlyError = `Access denied for user '${config.user}'. Check your password. Safe local storage fallback active.`;
      }

      console.warn(`[MySQL Fallback Mode] Remote connection to ${config.host} unavailable: ${friendlyError}. Safe local storage fallback active.`);
      lastStatus = {
        configured: true,
        connected: false,
        provider: 'Local Storage (Fallback Active)',
        host: config.host,
        port: config.port,
        database: config.database,
        error: friendlyError,
        lastChecked: new Date().toISOString()
      };
      return false;
    }
  })();

  return initPromise;
}

/**
 * Creates all required tables if they don't already exist
 */
async function runMigrations(p: Pool): Promise<void> {
  const schemaFile = path.join(process.cwd(), 'fuelflow_schema.sql');
  if (fs.existsSync(schemaFile)) {
    try {
      const rawSql = fs.readFileSync(schemaFile, 'utf-8');
      const cleanSql = rawSql
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');

      const statements = cleanSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toUpperCase().startsWith('CREATE DATABASE') && !s.toUpperCase().startsWith('USE '));

      for (const statement of statements) {
        try {
          await p.query(statement);
        } catch (stmtErr: any) {
          if (!stmtErr.message.includes('already exists')) {
            console.warn('[MySQL Migration Warning]:', stmtErr.message);
          }
        }
      }
      try {
        await p.query('ALTER TABLE `tenants` ADD COLUMN `logo` LONGTEXT DEFAULT NULL');
      } catch (e) {}
      console.log('[MySQL] Schema migration completed.');
    } catch (err) {
      console.error('[MySQL] Error reading fuelflow_schema.sql:', err);
    }
  }
}

/**
 * Auto-seeds initial tenants & users if table is empty
 */
async function seedInitialDataIfEmpty(p: Pool): Promise<void> {
  try {
    const [rows]: any = await p.query('SELECT COUNT(*) as c FROM `tenants`');
    if (rows?.[0]?.c === 0) {
      const tenantsFile = path.join(process.cwd(), 'data', 'tenants.json');
      const usersFile = path.join(process.cwd(), 'data', 'users.json');
      if (fs.existsSync(tenantsFile)) {
        const tenants = JSON.parse(fs.readFileSync(tenantsFile, 'utf-8'));
        for (const t of tenants) {
          await upsertTenantInDB(t);
        }
        console.log(`[MySQL] Auto-seeded ${tenants.length} tenants into database.`);
      }
      if (fs.existsSync(usersFile)) {
        const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
        for (const u of users) {
          await upsertUserInDB(u);
        }
        console.log(`[MySQL] Auto-seeded ${users.length} users into database.`);
      }
    }
  } catch (err) {
    console.warn('[MySQL] Auto-seed error:', err);
  }
}

/**
 * Counts rows in major tables
 */
async function updateTableCounts(): Promise<Record<string, number>> {
  if (!pool) return {};
  const counts: Record<string, number> = {};
  const tables = ['tenants', 'users', 'vehicles', 'fuel_entries', 'fuel_pumps', 'pump_payments', 'companies', 'vendors'];

  for (const table of tables) {
    try {
      const [rows]: any = await pool.query(`SELECT COUNT(*) as count FROM \`${table}\``);
      counts[table] = rows?.[0]?.count ?? 0;
    } catch {
      counts[table] = 0;
    }
  }
  lastStatus.tableCounts = counts;
  return counts;
}

/**
 * Returns latest connection and health status
 */
export async function getMySQLStatus(forceRetry: boolean = false): Promise<DatabaseStatus> {
  const config = getMySQLConfig();
  if (!config) {
    return {
      configured: false,
      connected: false,
      provider: 'Local File Storage',
      error: null,
      lastChecked: new Date().toISOString()
    };
  }

  if (forceRetry || (!pool && !lastStatus.connected)) {
    await initMySQLDatabase(forceRetry);
  }

  if (pool) {
    try {
      const t0 = Date.now();
      await pool.query('SELECT 1');
      lastStatus.pingMs = Date.now() - t0;
      lastStatus.connected = true;
      lastStatus.error = null;
      await updateTableCounts();
    } catch (err: any) {
      lastStatus.connected = false;
      lastStatus.error = err?.message || 'Database ping failed';
    }
  }

  lastStatus.lastChecked = new Date().toISOString();
  return lastStatus;
}

// -------------------------------------------------------------
// Database Operations (with automatic fallback to memory/file)
// -------------------------------------------------------------

export async function fetchTenantsFromDB(): Promise<any[] | null> {
  if (!pool || !lastStatus.connected) return null;
  try {
    const [rows]: any = await pool.query('SELECT * FROM `tenants` ORDER BY `created_at` DESC');
    return rows.map((r: any) => {
      let sub = null;
      try {
        if (r.subscription_raw) {
          sub = typeof r.subscription_raw === 'string' ? JSON.parse(r.subscription_raw) : r.subscription_raw;
        }
      } catch (e) {}

      if (!sub) {
        sub = {
          plan: r.subscription_plan || 'starter',
          status: r.subscription_status || 'active',
          start_date: r.subscription_start_date,
          end_date: r.subscription_end_date,
          price_bdt: Number(r.subscription_price) || 0
        };
      }

      return {
        id: r.id,
        name: r.name,
        code: r.code,
        logo: r.logo || sub?.logo || null,
        currency: r.currency || 'BDT',
        phone: r.phone || '',
        address: r.address || '',
        contact_person: r.contact_person || '',
        email: r.email || '',
        status: r.status || 'active',
        deleted_at: r.deleted_at,
        created_at: r.created_at,
        subscription: sub
      };
    });
  } catch (err) {
    console.error('[MySQL] Error fetching tenants:', err);
    return null;
  }
}

export async function upsertTenantInDB(tenant: any): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    const query = `
      INSERT INTO \`tenants\` (
        \`id\`, \`name\`, \`code\`, \`currency\`, \`phone\`, \`address\`, \`contact_person\`, \`email\`,
        \`status\`, \`deleted_at\`, \`created_at\`, \`subscription_plan\`, \`subscription_status\`,
        \`subscription_start_date\`, \`subscription_end_date\`, \`subscription_price\`, \`subscription_raw\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        \`name\` = VALUES(\`name\`),
        \`code\` = VALUES(\`code\`),
        \`currency\` = VALUES(\`currency\`),
        \`phone\` = VALUES(\`phone\`),
        \`address\` = VALUES(\`address\`),
        \`contact_person\` = VALUES(\`contact_person\`),
        \`email\` = VALUES(\`email\`),
        \`status\` = VALUES(\`status\`),
        \`deleted_at\` = VALUES(\`deleted_at\`),
        \`subscription_plan\` = VALUES(\`subscription_plan\`),
        \`subscription_status\` = VALUES(\`subscription_status\`),
        \`subscription_start_date\` = VALUES(\`subscription_start_date\`),
        \`subscription_end_date\` = VALUES(\`subscription_end_date\`),
        \`subscription_price\` = VALUES(\`subscription_price\`),
        \`subscription_raw\` = VALUES(\`subscription_raw\`);
    `;

    const sub = { ...(tenant.subscription || {}) };
    if (tenant.logo) {
      sub.logo = tenant.logo;
    }
    const values = [
      tenant.id,
      tenant.name,
      tenant.code,
      tenant.currency || 'BDT',
      tenant.phone || '',
      tenant.address || '',
      tenant.contact_person || '',
      tenant.email || '',
      tenant.status || 'active',
      tenant.deleted_at || null,
      tenant.created_at || new Date().toISOString().slice(0, 19).replace('T', ' '),
      sub.plan || 'starter',
      sub.status || 'active',
      sub.start_date || null,
      sub.end_date || null,
      Number(sub.price_bdt) || 0,
      JSON.stringify(sub)
    ];

    await pool.query(query, values);
    return true;
  } catch (err) {
    console.error('[MySQL] Error upserting tenant:', err);
    return false;
  }
}

export async function updateTenantStatusInDB(id: string, status: string): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    await pool.query('UPDATE `tenants` SET `status` = ?, `subscription_status` = ? WHERE `id` = ?', [status, status, id]);
    return true;
  } catch (err) {
    console.error('[MySQL] Error updating tenant status:', err);
    return false;
  }
}

export async function softDeleteTenantInDB(id: string): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.query('UPDATE `tenants` SET `deleted_at` = ?, `status` = ?, `subscription_status` = ? WHERE `id` = ?', [now, 'inactive', 'suspended', id]);
    return true;
  } catch (err) {
    console.error('[MySQL] Error soft-deleting tenant:', err);
    return false;
  }
}

export async function fetchUsersFromDB(): Promise<any[] | null> {
  if (!pool || !lastStatus.connected) return null;
  try {
    const [rows]: any = await pool.query('SELECT * FROM `users` ORDER BY `created_at` DESC');
    return rows.map((u: any) => {
      let allowedCats = ['all'];
      let allowedPumps = ['all'];
      let perms = null;
      try {
        if (u.allowed_categories) allowedCats = typeof u.allowed_categories === 'string' ? JSON.parse(u.allowed_categories) : u.allowed_categories;
        if (u.allowed_pumps) allowedPumps = typeof u.allowed_pumps === 'string' ? JSON.parse(u.allowed_pumps) : u.allowed_pumps;
        if (u.permissions) perms = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : u.permissions;
      } catch (e) {}

      return {
        id: u.id,
        tenant_id: u.tenant_id,
        name: u.name,
        email: u.email,
        username: u.username,
        password: u.password_hash,
        phone: u.phone || '',
        role: u.role,
        role_title_bn: u.role_title_bn,
        company_id: u.company_id,
        status: u.status,
        allowed_category_ids: allowedCats,
        allowed_pump_ids: allowedPumps,
        permissions: perms,
        created_at: u.created_at
      };
    });
  } catch (err) {
    console.error('[MySQL] Error fetching users:', err);
    return null;
  }
}

export async function upsertUserInDB(user: any): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    const query = `
      INSERT INTO \`users\` (
        \`id\`, \`tenant_id\`, \`name\`, \`email\`, \`username\`, \`password_hash\`, \`phone\`,
        \`role\`, \`role_title_bn\`, \`company_id\`, \`status\`, \`allowed_categories\`,
        \`allowed_pumps\`, \`permissions\`, \`created_at\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        \`name\` = VALUES(\`name\`),
        \`email\` = VALUES(\`email\`),
        \`password_hash\` = VALUES(\`password_hash\`),
        \`phone\` = VALUES(\`phone\`),
        \`role\` = VALUES(\`role\`),
        \`role_title_bn\` = VALUES(\`role_title_bn\`),
        \`company_id\` = VALUES(\`company_id\`),
        \`status\` = VALUES(\`status\`),
        \`allowed_categories\` = VALUES(\`allowed_categories\`),
        \`allowed_pumps\` = VALUES(\`allowed_pumps\`),
        \`permissions\` = VALUES(\`permissions\`);
    `;

    const values = [
      user.id,
      user.tenant_id,
      user.name,
      user.email,
      user.username,
      user.password || '',
      user.phone || '',
      user.role || 'operator',
      user.role_title_bn || '',
      user.company_id || null,
      user.status || 'active',
      JSON.stringify(user.allowed_category_ids || ['all']),
      JSON.stringify(user.allowed_pump_ids || ['all']),
      JSON.stringify(user.permissions || {}),
      user.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
    ];

    await pool.query(query, values);
    return true;
  } catch (err) {
    console.error('[MySQL] Error upserting user:', err);
    return false;
  }
}

/**
 * Sync entire dataset into MySQL
 */
export async function syncAllDataToMySQL(data: {
  tenants?: any[];
  users?: any[];
  vehicles?: any[];
  fuelEntries?: any[];
  pumps?: any[];
  payments?: any[];
}): Promise<{ success: boolean; synced: Record<string, number>; error?: string }> {
  if (!pool || !lastStatus.connected) {
    return { success: false, synced: {}, error: 'MySQL is not connected' };
  }

  const synced: Record<string, number> = { tenants: 0, users: 0, vehicles: 0, fuelEntries: 0, pumps: 0, payments: 0 };

  try {
    if (data.tenants && Array.isArray(data.tenants)) {
      for (const t of data.tenants) {
        if (await upsertTenantInDB(t)) synced.tenants++;
      }
    }

    if (data.users && Array.isArray(data.users)) {
      for (const u of data.users) {
        if (await upsertUserInDB(u)) synced.users++;
      }
    }

    // Vehicles
    if (data.vehicles && Array.isArray(data.vehicles)) {
      for (const v of data.vehicles) {
        try {
          await pool.query(`
            INSERT INTO \`vehicles\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`vehicle_number\`, \`category_id\`, \`ownership\`,
              \`vendor_id\`, \`company_id\`, \`fuel_type_id\`, \`expected_benchmark\`, \`current_odometer\`,
              \`driver_name\`, \`driver_phone\`, \`status\`, \`created_at\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`vehicle_number\` = VALUES(\`vehicle_number\`),
              \`category_id\` = VALUES(\`category_id\`),
              \`ownership\` = VALUES(\`ownership\`),
              \`vendor_id\` = VALUES(\`vendor_id\`),
              \`company_id\` = VALUES(\`company_id\`),
              \`fuel_type_id\` = VALUES(\`fuel_type_id\`),
              \`expected_benchmark\` = VALUES(\`expected_benchmark\`),
              \`current_odometer\` = VALUES(\`current_odometer\`),
              \`driver_name\` = VALUES(\`driver_name\`),
              \`driver_phone\` = VALUES(\`driver_phone\`),
              \`status\` = VALUES(\`status\`);
          `, [
            v.id, v.tenant_id, v.user_id || null, v.vehicle_number, v.category_id, v.ownership || 'owned',
            v.vendor_id || null, v.company_id, v.fuel_type_id, v.expected_benchmark || 10, v.current_odometer || 0,
            v.driver_name || '', v.driver_phone || '', v.status || 'active',
            v.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]);
          synced.vehicles++;
        } catch (e) {
          console.warn('[MySQL] Vehicle sync item skipped:', e);
        }
      }
    }

    // Fuel Entries
    if (data.fuelEntries && Array.isArray(data.fuelEntries)) {
      for (const f of data.fuelEntries) {
        try {
          await pool.query(`
            INSERT INTO \`fuel_entries\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`entry_date\`, \`slip_no\`, \`vehicle_id\`, \`company_id\`,
              \`source_type\`, \`pump_id\`, \`tanker_id\`, \`previous_meter\`, \`current_meter\`,
              \`distance_traveled\`, \`fuel_liters\`, \`unit_price\`, \`total_amount\`, \`calculated_mileage\`,
              \`benchmark_mileage\`, \`is_anomaly\`, \`anomaly_diff_percent\`, \`anomaly_reason\`,
              \`receipt_image_url\`, \`notes\`, \`created_by_name\`, \`created_at\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`entry_date\` = VALUES(\`entry_date\`),
              \`slip_no\` = VALUES(\`slip_no\`),
              \`previous_meter\` = VALUES(\`previous_meter\`),
              \`current_meter\` = VALUES(\`current_meter\`),
              \`distance_traveled\` = VALUES(\`distance_traveled\`),
              \`fuel_liters\` = VALUES(\`fuel_liters\`),
              \`unit_price\` = VALUES(\`unit_price\`),
              \`total_amount\` = VALUES(\`total_amount\`),
              \`calculated_mileage\` = VALUES(\`calculated_mileage\`),
              \`is_anomaly\` = VALUES(\`is_anomaly\`);
          `, [
            f.id, f.tenant_id, f.user_id || null, f.entry_date, f.slip_no || '', f.vehicle_id, f.company_id,
            f.source_type || 'pump', f.pump_id || null, f.tanker_id || null, f.previous_meter || 0, f.current_meter || 0,
            f.distance_traveled || 0, f.fuel_liters || 0, f.unit_price || 0, f.total_amount || 0, f.calculated_mileage || 0,
            f.benchmark_mileage || 0, f.is_anomaly ? 1 : 0, f.anomaly_diff_percent || 0, f.anomaly_reason || '',
            f.receipt_image_url || '', f.notes || '', f.created_by_name || 'System',
            f.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]);
          synced.fuelEntries++;
        } catch (e) {
          console.warn('[MySQL] Fuel entry sync item skipped:', e);
        }
      }
    }

    // Pumps
    if (data.pumps && Array.isArray(data.pumps)) {
      for (const p of data.pumps) {
        try {
          await pool.query(`
            INSERT INTO \`fuel_pumps\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`name\`, \`location\`, \`contact_person\`, \`phone\`,
              \`credit_limit\`, \`opening_balance\`, \`current_balance\`, \`status\`, \`created_at\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`name\` = VALUES(\`name\`),
              \`location\` = VALUES(\`location\`),
              \`contact_person\` = VALUES(\`contact_person\`),
              \`phone\` = VALUES(\`phone\`),
              \`credit_limit\` = VALUES(\`credit_limit\`),
              \`current_balance\` = VALUES(\`current_balance\`),
              \`status\` = VALUES(\`status\`);
          `, [
            p.id, p.tenant_id, p.user_id || null, p.name, p.location || '', p.contact_person || '', p.phone || '',
            p.credit_limit || 0, p.opening_balance || 0, p.current_balance || 0, p.status || 'active',
            p.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]);
          synced.pumps++;
        } catch (e) {
          console.warn('[MySQL] Pump sync item skipped:', e);
        }
      }
    }

    // Payments
    if (data.payments && Array.isArray(data.payments)) {
      for (const pm of data.payments) {
        try {
          await pool.query(`
            INSERT INTO \`pump_payments\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`pump_id\`, \`payment_date\`, \`amount\`,
              \`payment_method\`, \`transaction_ref\`, \`receipt_url\`, \`notes\`, \`recorded_by\`, \`created_at\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`amount\` = VALUES(\`amount\`),
              \`payment_method\` = VALUES(\`payment_method\`),
              \`transaction_ref\` = VALUES(\`transaction_ref\`),
              \`notes\` = VALUES(\`notes\`);
          `, [
            pm.id, pm.tenant_id, pm.user_id || null, pm.pump_id, pm.payment_date, pm.amount || 0,
            pm.payment_method || 'bank_transfer', pm.transaction_ref || '', pm.receipt_url || '',
            pm.notes || '', pm.recorded_by || 'Admin',
            pm.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]);
          synced.payments++;
        } catch (e) {
          console.warn('[MySQL] Payment sync item skipped:', e);
        }
      }
    }

    // Categories
    if ((data as any).categories && Array.isArray((data as any).categories)) {
      for (const c of (data as any).categories) {
        try {
          await pool.query(`
            INSERT INTO \`vehicle_categories\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`name\`, \`metric_type\`, \`default_benchmark\`, \`icon_name\`, \`description\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`name\` = VALUES(\`name\`),
              \`metric_type\` = VALUES(\`metric_type\`),
              \`default_benchmark\` = VALUES(\`default_benchmark\`),
              \`icon_name\` = VALUES(\`icon_name\`),
              \`description\` = VALUES(\`description\`);
          `, [
            c.id, c.tenant_id, c.user_id || null, c.name, c.metric_type || 'kmpl',
            c.default_benchmark || 10, c.icon_name || 'Truck', c.description || ''
          ]);
        } catch (e) {}
      }
    }

    // Companies
    if ((data as any).companies && Array.isArray((data as any).companies)) {
      for (const comp of (data as any).companies) {
        try {
          await pool.query(`
            INSERT INTO \`companies\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`name\`, \`code\`, \`contact_person\`, \`phone\`, \`email\`, \`address\`, \`created_at\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`name\` = VALUES(\`name\`),
              \`code\` = VALUES(\`code\`),
              \`contact_person\` = VALUES(\`contact_person\`),
              \`phone\` = VALUES(\`phone\`),
              \`email\` = VALUES(\`email\`),
              \`address\` = VALUES(\`address\`);
          `, [
            comp.id, comp.tenant_id, comp.user_id || null, comp.name, comp.code || '',
            comp.contact_person || '', comp.phone || '', comp.email || '', comp.address || '',
            comp.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]);
        } catch (e) {}
      }
    }

    // Vendors
    if ((data as any).vendors && Array.isArray((data as any).vendors)) {
      for (const v of (data as any).vendors) {
        try {
          await pool.query(`
            INSERT INTO \`vendors\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`name\`, \`contact_person\`, \`phone\`, \`email\`, \`address\`, \`created_at\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`name\` = VALUES(\`name\`),
              \`contact_person\` = VALUES(\`contact_person\`),
              \`phone\` = VALUES(\`phone\`),
              \`email\` = VALUES(\`email\`),
              \`address\` = VALUES(\`address\`);
          `, [
            v.id, v.tenant_id, v.user_id || null, v.name, v.contact_person || '',
            v.phone || '', v.email || '', v.address || '',
            v.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]);
        } catch (e) {}
      }
    }

    // Fuel Types
    if ((data as any).fuelTypes && Array.isArray((data as any).fuelTypes)) {
      for (const ft of (data as any).fuelTypes) {
        try {
          await pool.query(`
            INSERT INTO \`fuel_types\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`name\`, \`code\`, \`unit\`, \`current_price\`, \`price_history\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`name\` = VALUES(\`name\`),
              \`current_price\` = VALUES(\`current_price\`),
              \`price_history\` = VALUES(\`price_history\`);
          `, [
            ft.id, ft.tenant_id, ft.user_id || null, ft.name, ft.code || '',
            ft.unit || 'Liter', ft.current_price || 0,
            JSON.stringify(ft.price_history || [])
          ]);
        } catch (e) {}
      }
    }

    // Tankers
    if ((data as any).tankers && Array.isArray((data as any).tankers)) {
      for (const tk of (data as any).tankers) {
        try {
          await pool.query(`
            INSERT INTO \`tanker_inventories\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`tanker_name\`, \`location\`, \`capacity_liters\`,
              \`current_stock_liters\`, \`fuel_type_id\`, \`min_alert_threshold\`, \`last_restocked_at\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`tanker_name\` = VALUES(\`tanker_name\`),
              \`location\` = VALUES(\`location\`),
              \`capacity_liters\` = VALUES(\`capacity_liters\`),
              \`current_stock_liters\` = VALUES(\`current_stock_liters\`),
              \`min_alert_threshold\` = VALUES(\`min_alert_threshold\`);
          `, [
            tk.id, tk.tenant_id, tk.user_id || null, tk.tanker_name, tk.location || '',
            tk.capacity_liters || 0, tk.current_stock_liters || 0, tk.fuel_type_id || '',
            tk.min_alert_threshold || 1000, tk.last_restocked_at || null
          ]);
        } catch (e) {}
      }
    }

    // Tanker Logs
    if ((data as any).tankerLogs && Array.isArray((data as any).tankerLogs)) {
      for (const tl of (data as any).tankerLogs) {
        try {
          await pool.query(`
            INSERT INTO \`tanker_logs\` (
              \`id\`, \`tenant_id\`, \`user_id\`, \`tanker_id\`, \`log_type\`, \`date\`,
              \`liters\`,\`unit_cost\`, \`source_or_vehicle\`, \`notes\`, \`previous_stock\`, \`new_stock\`, \`created_at\`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              \`liters\` = VALUES(\`liters\`),
              \`unit_cost\` = VALUES(\`unit_cost\`),
              \`new_stock\` = VALUES(\`new_stock\`);
          `, [
            tl.id, tl.tenant_id, tl.user_id || null, tl.tanker_id, tl.log_type,
            tl.date, tl.liters || 0, tl.unit_cost || 0, tl.source_or_vehicle || '',
            tl.notes || '', tl.previous_stock || 0, tl.new_stock || 0,
            tl.created_at || new Date().toISOString().slice(0, 19).replace('T', ' ')
          ]);
        } catch (e) {}
      }
    }

    await updateTableCounts();
    return { success: true, synced };
  } catch (err: any) {
    return { success: false, synced, error: err?.message || 'Sync failed' };
  }
}

/**
 * Fetches all fleet management data from MySQL database
 */
export async function fetchFleetDataFromDB(tenantId?: string): Promise<{
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
} | null> {
  if (!pool || !lastStatus.connected) return null;
  try {
    const where = tenantId ? ' WHERE `tenant_id` = ?' : '';
    const params = tenantId ? [tenantId] : [];

    const [vehicles]: any = await pool.query(`SELECT * FROM \`vehicles\`${where} ORDER BY \`created_at\` DESC`, params);
    const [fuelEntries]: any = await pool.query(`SELECT * FROM \`fuel_entries\`${where} ORDER BY \`entry_date\` DESC, \`created_at\` DESC`, params);
    const [pumps]: any = await pool.query(`SELECT * FROM \`fuel_pumps\`${where} ORDER BY \`created_at\` DESC`, params);
    const [payments]: any = await pool.query(`SELECT * FROM \`pump_payments\`${where} ORDER BY \`payment_date\` DESC`, params);
    const [categories]: any = await pool.query(`SELECT * FROM \`vehicle_categories\`${where}`, params);
    const [companies]: any = await pool.query(`SELECT * FROM \`companies\`${where} ORDER BY \`created_at\` DESC`, params);
    const [vendors]: any = await pool.query(`SELECT * FROM \`vendors\`${where} ORDER BY \`created_at\` DESC`, params);
    const [fuelTypes]: any = await pool.query(`SELECT * FROM \`fuel_types\`${where}`, params);
    const [tankers]: any = await pool.query(`SELECT * FROM \`tanker_inventories\`${where}`, params);
    const [tankerLogs]: any = await pool.query(`SELECT * FROM \`tanker_logs\`${where} ORDER BY \`date\` DESC, \`created_at\` DESC`, params);

    return {
      vehicles: vehicles.map((v: any) => ({
        ...v,
        expected_benchmark: Number(v.expected_benchmark) || 10,
        current_odometer: Number(v.current_odometer) || 0
      })),
      fuelEntries: fuelEntries.map((f: any) => ({
        ...f,
        entry_date: f.entry_date instanceof Date ? f.entry_date.toISOString().split('T')[0] : String(f.entry_date).split('T')[0],
        previous_meter: Number(f.previous_meter) || 0,
        current_meter: Number(f.current_meter) || 0,
        distance_traveled: Number(f.distance_traveled) || 0,
        fuel_liters: Number(f.fuel_liters) || 0,
        unit_price: Number(f.unit_price) || 0,
        total_amount: Number(f.total_amount) || 0,
        calculated_mileage: Number(f.calculated_mileage) || 0,
        benchmark_mileage: Number(f.benchmark_mileage) || 0,
        is_anomaly: Boolean(f.is_anomaly),
        anomaly_diff_percent: Number(f.anomaly_diff_percent) || 0
      })),
      pumps: pumps.map((p: any) => ({
        ...p,
        credit_limit: Number(p.credit_limit) || 0,
        opening_balance: Number(p.opening_balance) || 0,
        current_balance: Number(p.current_balance) || 0
      })),
      payments: payments.map((pm: any) => ({
        ...pm,
        payment_date: pm.payment_date instanceof Date ? pm.payment_date.toISOString().split('T')[0] : String(pm.payment_date).split('T')[0],
        amount: Number(pm.amount) || 0
      })),
      categories: categories.map((c: any) => ({
        ...c,
        default_benchmark: Number(c.default_benchmark) || 10
      })),
      companies,
      vendors,
      fuelTypes: fuelTypes.map((ft: any) => {
        let history = [];
        try {
          if (ft.price_history) {
            history = typeof ft.price_history === 'string' ? JSON.parse(ft.price_history) : ft.price_history;
          }
        } catch (e) {}
        return {
          ...ft,
          current_price: Number(ft.current_price) || 0,
          price_history: Array.isArray(history) ? history : []
        };
      }),
      tankers: tankers.map((t: any) => ({
        ...t,
        capacity_liters: Number(t.capacity_liters) || 0,
        current_stock_liters: Number(t.current_stock_liters) || 0,
        min_alert_threshold: Number(t.min_alert_threshold) || 1000
      })),
      tankerLogs: tankerLogs.map((tl: any) => ({
        ...tl,
        date: tl.date instanceof Date ? tl.date.toISOString().split('T')[0] : String(tl.date).split('T')[0],
        liters: Number(tl.liters) || 0,
        unit_cost: Number(tl.unit_cost) || 0,
        previous_stock: Number(tl.previous_stock) || 0,
        new_stock: Number(tl.new_stock) || 0
      }))
    };
  } catch (err) {
    console.error('[MySQL] Error fetching fleet data:', err);
    return null;
  }
}

export async function deleteVehicleInDB(id: string): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    await pool.query('DELETE FROM `vehicles` WHERE `id` = ?', [id]);
    return true;
  } catch (err) {
    console.error('[MySQL] Error deleting vehicle:', err);
    return false;
  }
}

export async function deleteFuelEntryInDB(id: string): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    await pool.query('DELETE FROM `fuel_entries` WHERE `id` = ?', [id]);
    return true;
  } catch (err) {
    console.error('[MySQL] Error deleting fuel entry:', err);
    return false;
  }
}

export async function deletePumpInDB(id: string): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    await pool.query('DELETE FROM `fuel_pumps` WHERE `id` = ?', [id]);
    return true;
  } catch (err) {
    console.error('[MySQL] Error deleting pump:', err);
    return false;
  }
}

export async function deletePaymentInDB(id: string): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    await pool.query('DELETE FROM `pump_payments` WHERE `id` = ?', [id]);
    return true;
  } catch (err) {
    console.error('[MySQL] Error deleting payment:', err);
    return false;
  }
}

export async function deleteCategoryInDB(id: string): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    await pool.query('DELETE FROM `vehicle_categories` WHERE `id` = ?', [id]);
    return true;
  } catch (err) {
    console.error('[MySQL] Error deleting category:', err);
    return false;
  }
}

export async function deleteTankerInDB(id: string): Promise<boolean> {
  if (!pool || !lastStatus.connected) return false;
  try {
    await pool.query('DELETE FROM `tanker_inventories` WHERE `id` = ?', [id]);
    return true;
  } catch (err) {
    console.error('[MySQL] Error deleting tanker:', err);
    return false;
  }
}
