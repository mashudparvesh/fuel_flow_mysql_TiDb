var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app,
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);

// server/mysql.ts
var import_promise = __toESM(require("mysql2/promise"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var pool = null;
var isInitialized = false;
var initPromise = null;
var lastStatus = {
  configured: false,
  connected: false,
  provider: "Local File Fallback",
  lastChecked: (/* @__PURE__ */ new Date()).toISOString()
};
function getMySQLConfig() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && (dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysql2://")) && !dbUrl.includes("infinityfree") && !dbUrl.includes("epizy") && !dbUrl.includes("byetcluster")) {
    try {
      const url = new URL(dbUrl);
      const isSsl = url.searchParams.get("ssl") === "true" || url.searchParams.get("sslaccept") === "strict" || dbUrl.includes("tidbcloud.com");
      return {
        host: url.hostname,
        port: parseInt(url.port || "3306", 10),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, "") || "fuelflow",
        ssl: isSsl ? { rejectUnauthorized: false } : void 0,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 1e4,
        connectTimeout: 7e3
      };
    } catch (e) {
      console.error("[MySQL] Error parsing DATABASE_URL:", e);
    }
  }
  let host = process.env.MYSQL_HOST?.trim();
  let user = process.env.MYSQL_USER?.trim();
  let password = process.env.MYSQL_PASSWORD?.trim() ?? "";
  let database = process.env.MYSQL_DATABASE?.trim() || "test";
  let port = parseInt(process.env.MYSQL_PORT?.trim() || "4000", 10);
  const sslEnv = process.env.MYSQL_SSL?.trim().toLowerCase();
  if (!host || host.includes("infinityfree") || host.includes("epizy") || host.includes("byetcluster") || host.includes("tidbcloud")) {
    host = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com";
    user = "3vs45pD8HohQ35M.root";
    port = 4e3;
    database = "test";
    if (!password || password === "MashudAlone420" || host.includes("tidbcloud")) {
      password = process.env.MYSQL_PASSWORD && process.env.MYSQL_PASSWORD !== "MashudAlone420" ? process.env.MYSQL_PASSWORD : "FaiamIkyLcN3kABc";
    }
  }
  if (!host || !user) {
    return null;
  }
  const useSsl = sslEnv === "true" || sslEnv === "1" || host.includes("tidbcloud.com") || host.includes("aivencloud.com") || !sslEnv;
  return {
    host,
    port,
    user,
    password,
    database,
    ssl: useSsl ? { rejectUnauthorized: false } : void 0,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 1e4,
    connectTimeout: 7e3
  };
}
async function initMySQLDatabase(forceRetry = false) {
  if (forceRetry) {
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
      }
      pool = null;
    }
    initPromise = null;
    isInitialized = false;
  }
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const config = getMySQLConfig();
    if (!config) {
      console.log("[MySQL] No MySQL environment variables set. Running in Local File Storage mode.");
      lastStatus = {
        configured: false,
        connected: false,
        provider: "Local File Storage",
        error: "MySQL environment variables (MYSQL_HOST, MYSQL_USER) not set.",
        lastChecked: (/* @__PURE__ */ new Date()).toISOString()
      };
      return false;
    }
    const hostStr = String(config.host || "").toLowerCase();
    if (!config.password) {
      const notice = "TiDB Cloud cluster detected (3vs45pD8HohQ35M.root @ gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000). Please click 'Generate Password' in your TiDB Cloud tab, then set MYSQL_PASSWORD in Settings > Secrets to activate live cloud database storage.";
      console.warn(`[MySQL Setup] ${notice}`);
      lastStatus = {
        configured: true,
        connected: false,
        provider: "TiDB Cloud Serverless (Pending Password)",
        host: config.host,
        port: config.port,
        database: config.database,
        error: notice,
        lastChecked: (/* @__PURE__ */ new Date()).toISOString()
      };
      initPromise = null;
      return false;
    }
    if (hostStr.includes("infinityfree") || hostStr.includes("epizy") || hostStr.includes("byetcluster")) {
      const friendlyNotice = `InfinityFree does not support Remote MySQL connections (incoming connections from external cloud platforms like Google Cloud Run are blocked by InfinityFree firewall). To use free cloud MySQL, please use TiDB Cloud Serverless (tidbcloud.com - 5GB free forever with remote access) or Aiven MySQL. Running in safe local file mode.`;
      console.warn(`[MySQL Fallback Mode] ${friendlyNotice}`);
      lastStatus = {
        configured: true,
        connected: false,
        provider: "Local Storage (Fallback Active)",
        host: config.host,
        port: config.port,
        database: config.database,
        error: friendlyNotice,
        lastChecked: (/* @__PURE__ */ new Date()).toISOString()
      };
      initPromise = null;
      return false;
    }
    try {
      console.log(`[MySQL] Connecting to ${config.host}:${config.port}/${config.database} as ${config.user}...`);
      pool = import_promise.default.createPool(config);
      const t0 = Date.now();
      const [rows] = await pool.query("SELECT 1 + 1 AS pingResult");
      const pingMs = Date.now() - t0;
      console.log(`[MySQL] Connected successfully! Ping latency: ${pingMs}ms`);
      let provider = "MySQL";
      if (String(config.host).includes("tidbcloud.com")) provider = "TiDB Cloud Serverless";
      else if (String(config.host).includes("aivencloud.com")) provider = "Aiven MySQL";
      else if (String(config.host).includes("clever-cloud.com")) provider = "Clever Cloud";
      else if (String(config.host).includes("localhost") || String(config.host) === "127.0.0.1") provider = "Local MySQL";
      lastStatus = {
        configured: true,
        connected: true,
        provider,
        host: config.host,
        port: config.port,
        database: config.database,
        pingMs,
        error: null,
        lastChecked: (/* @__PURE__ */ new Date()).toISOString()
      };
      await runMigrations(pool);
      await seedInitialDataIfEmpty(pool);
      isInitialized = true;
      updateTableCounts().catch((err) => console.warn("[MySQL] Error counting tables:", err));
      return true;
    } catch (err) {
      if (pool) {
        try {
          await pool.end();
        } catch (e) {
        }
        pool = null;
      }
      initPromise = null;
      let friendlyError = err?.message || "Failed to connect to MySQL database";
      if (hostStr.includes("infinityfree") || hostStr.includes("epizy") || hostStr.includes("byetcluster")) {
        friendlyError = "InfinityFree does not support Remote MySQL connections (connections outside InfinityFree are blocked). Use TiDB Cloud Serverless (5GB free forever) or Aiven MySQL.";
      } else if (err?.code === "EAI_AGAIN" || err?.code === "ENOTFOUND") {
        friendlyError = `Host '${config.host}' could not be resolved (DNS lookup failed). Remote MySQL might be blocked or hostname is incorrect. Safe local storage fallback active.`;
      } else if (err?.code === "ETIMEDOUT") {
        friendlyError = `Connection to '${config.host}:${config.port}' timed out. The server firewall may be blocking port ${config.port}. Safe local storage fallback active.`;
      } else if (err?.code === "ECONNREFUSED") {
        friendlyError = `Connection refused by '${config.host}:${config.port}'. Check if MySQL is running. Safe local storage fallback active.`;
      } else if (err?.code === "ER_ACCESS_DENIED_ERROR") {
        friendlyError = `Access denied for user '${config.user}'. Check your password. Safe local storage fallback active.`;
      }
      console.warn(`[MySQL Fallback Mode] Remote connection to ${config.host} unavailable: ${friendlyError}. Safe local storage fallback active.`);
      lastStatus = {
        configured: true,
        connected: false,
        provider: "Local Storage (Fallback Active)",
        host: config.host,
        port: config.port,
        database: config.database,
        error: friendlyError,
        lastChecked: (/* @__PURE__ */ new Date()).toISOString()
      };
      return false;
    }
  })();
  return initPromise;
}
async function runMigrations(p) {
  const schemaFile = import_path.default.join(process.cwd(), "fuelflow_schema.sql");
  if (import_fs.default.existsSync(schemaFile)) {
    try {
      const rawSql = import_fs.default.readFileSync(schemaFile, "utf-8");
      const cleanSql = rawSql.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").filter((line) => !line.trim().startsWith("--")).join("\n");
      const statements = cleanSql.split(";").map((s) => s.trim()).filter((s) => s.length > 0 && !s.toUpperCase().startsWith("CREATE DATABASE") && !s.toUpperCase().startsWith("USE "));
      for (const statement of statements) {
        try {
          await p.query(statement);
        } catch (stmtErr) {
          if (!stmtErr.message.includes("already exists")) {
            console.warn("[MySQL Migration Warning]:", stmtErr.message);
          }
        }
      }
      console.log("[MySQL] Schema migration completed.");
    } catch (err) {
      console.error("[MySQL] Error reading fuelflow_schema.sql:", err);
    }
  }
}
async function seedInitialDataIfEmpty(p) {
  try {
    const [rows] = await p.query("SELECT COUNT(*) as c FROM `tenants`");
    if (rows?.[0]?.c === 0) {
      const tenantsFile = import_path.default.join(process.cwd(), "data", "tenants.json");
      const usersFile = import_path.default.join(process.cwd(), "data", "users.json");
      if (import_fs.default.existsSync(tenantsFile)) {
        const tenants = JSON.parse(import_fs.default.readFileSync(tenantsFile, "utf-8"));
        for (const t of tenants) {
          await upsertTenantInDB(t);
        }
        console.log(`[MySQL] Auto-seeded ${tenants.length} tenants into database.`);
      }
      if (import_fs.default.existsSync(usersFile)) {
        const users = JSON.parse(import_fs.default.readFileSync(usersFile, "utf-8"));
        for (const u of users) {
          await upsertUserInDB(u);
        }
        console.log(`[MySQL] Auto-seeded ${users.length} users into database.`);
      }
    }
  } catch (err) {
    console.warn("[MySQL] Auto-seed error:", err);
  }
}
async function updateTableCounts() {
  if (!pool) return {};
  const counts = {};
  const tables = ["tenants", "users", "vehicles", "fuel_entries", "fuel_pumps", "pump_payments", "companies", "vendors"];
  for (const table of tables) {
    try {
      const [rows] = await pool.query(`SELECT COUNT(*) as count FROM \`${table}\``);
      counts[table] = rows?.[0]?.count ?? 0;
    } catch {
      counts[table] = 0;
    }
  }
  lastStatus.tableCounts = counts;
  return counts;
}
async function getMySQLStatus(forceRetry = false) {
  const config = getMySQLConfig();
  if (!config) {
    return {
      configured: false,
      connected: false,
      provider: "Local File Storage",
      error: null,
      lastChecked: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  if (forceRetry || !pool && !lastStatus.connected) {
    await initMySQLDatabase(forceRetry);
  }
  if (pool) {
    try {
      const t0 = Date.now();
      await pool.query("SELECT 1");
      lastStatus.pingMs = Date.now() - t0;
      lastStatus.connected = true;
      lastStatus.error = null;
      await updateTableCounts();
    } catch (err) {
      lastStatus.connected = false;
      lastStatus.error = err?.message || "Database ping failed";
    }
  }
  lastStatus.lastChecked = (/* @__PURE__ */ new Date()).toISOString();
  return lastStatus;
}
async function fetchTenantsFromDB() {
  if (!pool || !lastStatus.connected) return null;
  try {
    const [rows] = await pool.query("SELECT * FROM `tenants` ORDER BY `created_at` DESC");
    return rows.map((r) => {
      let sub = null;
      try {
        if (r.subscription_raw) {
          sub = typeof r.subscription_raw === "string" ? JSON.parse(r.subscription_raw) : r.subscription_raw;
        }
      } catch (e) {
      }
      if (!sub) {
        sub = {
          plan: r.subscription_plan || "starter",
          status: r.subscription_status || "active",
          start_date: r.subscription_start_date,
          end_date: r.subscription_end_date,
          price_bdt: Number(r.subscription_price) || 0
        };
      }
      return {
        id: r.id,
        name: r.name,
        code: r.code,
        currency: r.currency || "BDT",
        phone: r.phone || "",
        address: r.address || "",
        contact_person: r.contact_person || "",
        email: r.email || "",
        status: r.status || "active",
        deleted_at: r.deleted_at,
        created_at: r.created_at,
        subscription: sub
      };
    });
  } catch (err) {
    console.error("[MySQL] Error fetching tenants:", err);
    return null;
  }
}
async function upsertTenantInDB(tenant) {
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
    const sub = tenant.subscription || {};
    const values = [
      tenant.id,
      tenant.name,
      tenant.code,
      tenant.currency || "BDT",
      tenant.phone || "",
      tenant.address || "",
      tenant.contact_person || "",
      tenant.email || "",
      tenant.status || "active",
      tenant.deleted_at || null,
      tenant.created_at || (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " "),
      sub.plan || "starter",
      sub.status || "active",
      sub.start_date || null,
      sub.end_date || null,
      Number(sub.price_bdt) || 0,
      JSON.stringify(sub)
    ];
    await pool.query(query, values);
    return true;
  } catch (err) {
    console.error("[MySQL] Error upserting tenant:", err);
    return false;
  }
}
async function updateTenantStatusInDB(id, status) {
  if (!pool || !lastStatus.connected) return false;
  try {
    await pool.query("UPDATE `tenants` SET `status` = ?, `subscription_status` = ? WHERE `id` = ?", [status, status, id]);
    return true;
  } catch (err) {
    console.error("[MySQL] Error updating tenant status:", err);
    return false;
  }
}
async function softDeleteTenantInDB(id) {
  if (!pool || !lastStatus.connected) return false;
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ");
    await pool.query("UPDATE `tenants` SET `deleted_at` = ?, `status` = ?, `subscription_status` = ? WHERE `id` = ?", [now, "inactive", "suspended", id]);
    return true;
  } catch (err) {
    console.error("[MySQL] Error soft-deleting tenant:", err);
    return false;
  }
}
async function fetchUsersFromDB() {
  if (!pool || !lastStatus.connected) return null;
  try {
    const [rows] = await pool.query("SELECT * FROM `users` ORDER BY `created_at` DESC");
    return rows.map((u) => {
      let allowedCats = ["all"];
      let allowedPumps = ["all"];
      let perms = null;
      try {
        if (u.allowed_categories) allowedCats = typeof u.allowed_categories === "string" ? JSON.parse(u.allowed_categories) : u.allowed_categories;
        if (u.allowed_pumps) allowedPumps = typeof u.allowed_pumps === "string" ? JSON.parse(u.allowed_pumps) : u.allowed_pumps;
        if (u.permissions) perms = typeof u.permissions === "string" ? JSON.parse(u.permissions) : u.permissions;
      } catch (e) {
      }
      return {
        id: u.id,
        tenant_id: u.tenant_id,
        name: u.name,
        email: u.email,
        username: u.username,
        password: u.password_hash,
        phone: u.phone || "",
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
    console.error("[MySQL] Error fetching users:", err);
    return null;
  }
}
async function upsertUserInDB(user) {
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
      user.password || "",
      user.phone || "",
      user.role || "operator",
      user.role_title_bn || "",
      user.company_id || null,
      user.status || "active",
      JSON.stringify(user.allowed_category_ids || ["all"]),
      JSON.stringify(user.allowed_pump_ids || ["all"]),
      JSON.stringify(user.permissions || {}),
      user.created_at || (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
    ];
    await pool.query(query, values);
    return true;
  } catch (err) {
    console.error("[MySQL] Error upserting user:", err);
    return false;
  }
}
async function syncAllDataToMySQL(data) {
  if (!pool || !lastStatus.connected) {
    return { success: false, synced: {}, error: "MySQL is not connected" };
  }
  const synced = { tenants: 0, users: 0, vehicles: 0, fuelEntries: 0, pumps: 0, payments: 0 };
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
            v.id,
            v.tenant_id,
            v.user_id || null,
            v.vehicle_number,
            v.category_id,
            v.ownership || "owned",
            v.vendor_id || null,
            v.company_id,
            v.fuel_type_id,
            v.expected_benchmark || 10,
            v.current_odometer || 0,
            v.driver_name || "",
            v.driver_phone || "",
            v.status || "active",
            v.created_at || (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
          ]);
          synced.vehicles++;
        } catch (e) {
          console.warn("[MySQL] Vehicle sync item skipped:", e);
        }
      }
    }
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
            f.id,
            f.tenant_id,
            f.user_id || null,
            f.entry_date,
            f.slip_no || "",
            f.vehicle_id,
            f.company_id,
            f.source_type || "pump",
            f.pump_id || null,
            f.tanker_id || null,
            f.previous_meter || 0,
            f.current_meter || 0,
            f.distance_traveled || 0,
            f.fuel_liters || 0,
            f.unit_price || 0,
            f.total_amount || 0,
            f.calculated_mileage || 0,
            f.benchmark_mileage || 0,
            f.is_anomaly ? 1 : 0,
            f.anomaly_diff_percent || 0,
            f.anomaly_reason || "",
            f.receipt_image_url || "",
            f.notes || "",
            f.created_by_name || "System",
            f.created_at || (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
          ]);
          synced.fuelEntries++;
        } catch (e) {
          console.warn("[MySQL] Fuel entry sync item skipped:", e);
        }
      }
    }
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
            p.id,
            p.tenant_id,
            p.user_id || null,
            p.name,
            p.location || "",
            p.contact_person || "",
            p.phone || "",
            p.credit_limit || 0,
            p.opening_balance || 0,
            p.current_balance || 0,
            p.status || "active",
            p.created_at || (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
          ]);
          synced.pumps++;
        } catch (e) {
          console.warn("[MySQL] Pump sync item skipped:", e);
        }
      }
    }
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
            pm.id,
            pm.tenant_id,
            pm.user_id || null,
            pm.pump_id,
            pm.payment_date,
            pm.amount || 0,
            pm.payment_method || "bank_transfer",
            pm.transaction_ref || "",
            pm.receipt_url || "",
            pm.notes || "",
            pm.recorded_by || "Admin",
            pm.created_at || (/* @__PURE__ */ new Date()).toISOString().slice(0, 19).replace("T", " ")
          ]);
          synced.payments++;
        } catch (e) {
          console.warn("[MySQL] Payment sync item skipped:", e);
        }
      }
    }
    await updateTableCounts();
    return { success: true, synced };
  } catch (err) {
    return { success: false, synced, error: err?.message || "Sync failed" };
  }
}

// server.ts
var DEFAULT_TENANTS = [
  {
    id: "tenant_1",
    name: "Padma Multipurpose Fleet Services Ltd",
    code: "PMFS",
    currency: "BDT",
    phone: "+880 1711-892341",
    address: "Plot 14, Commercial Area, Ishwardi, Pabna",
    contact_person: "M. A. Rahman",
    email: "admin@padmafleet.com",
    status: "active",
    deleted_at: null,
    created_at: "2026-08-01",
    subscription: {
      plan: "enterprise",
      plan_name_bn: "\u098F\u09A8\u09CD\u099F\u09BE\u09B0\u09AA\u09CD\u09B0\u09BE\u0987\u099C \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8 (Enterprise)",
      status: "active",
      start_date: "2026-08-01",
      end_date: "2026-11-01",
      duration_type: "months",
      duration_val: 3,
      price_bdt: 25e3,
      payment_status: "paid",
      max_vehicles: 100,
      max_users: 25,
      max_pumps: 15,
      super_admin_username: "padma_admin",
      super_admin_password: "padma#pass123",
      features: {
        tanker_bowzer: true,
        anomaly_ai: true,
        reports_export: true,
        qr_scanner: true,
        custom_categories: true
      },
      notes: "Ruppur Mega Project Fleet Vendor - Paid via Bank Cheque"
    }
  },
  {
    id: "tenant_2",
    name: "Bengal Infra Logistics & Transport",
    code: "BILT",
    currency: "BDT",
    phone: "+880 1819-445566",
    address: "Tejgaon Industrial Area, Dhaka",
    contact_person: "Shafiqul Alam",
    email: "shafiq@bengalinfra.com",
    status: "active",
    deleted_at: null,
    created_at: "2026-08-15",
    subscription: {
      plan: "professional",
      plan_name_bn: "\u09AA\u09CD\u09B0\u09AB\u09C7\u09B6\u09A8\u09BE\u09B2 \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8 (Professional)",
      status: "active",
      start_date: "2026-08-15",
      end_date: "2026-09-30",
      duration_type: "months",
      duration_val: 1,
      price_bdt: 12e3,
      payment_status: "paid",
      max_vehicles: 40,
      max_users: 10,
      max_pumps: 5,
      super_admin_username: "bengal_admin",
      super_admin_password: "bengal#2026",
      features: {
        tanker_bowzer: true,
        anomaly_ai: true,
        reports_export: true,
        qr_scanner: true,
        custom_categories: false
      },
      notes: "Dhaka - Chittagong Highway Logistics Division"
    }
  },
  {
    id: "tenant_3",
    name: "Jamuna Mega Cargo & Haulage Ltd",
    code: "JMCH",
    currency: "BDT",
    phone: "+880 1712-998877",
    address: "Bangabandhu Bridge West Link, Sirajganj",
    contact_person: "Md. Tariqul Islam",
    email: "info@jamunacargo.com",
    status: "active",
    deleted_at: null,
    created_at: "2026-09-01",
    subscription: {
      plan: "enterprise",
      plan_name_bn: "\u098F\u09A8\u09CD\u099F\u09BE\u09B0\u09AA\u09CD\u09B0\u09BE\u0987\u099C \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u09A8 (Enterprise)",
      status: "active",
      start_date: "2026-09-01",
      end_date: "2027-09-01",
      duration_type: "years",
      duration_val: 1,
      price_bdt: 9e4,
      payment_status: "paid",
      max_vehicles: 80,
      max_users: 20,
      max_pumps: 10,
      super_admin_username: "jamuna_admin",
      super_admin_password: "jamuna#pass2026",
      features: {
        tanker_bowzer: true,
        anomaly_ai: true,
        reports_export: true,
        qr_scanner: true,
        custom_categories: true
      },
      notes: "National Highway Fuel Network Client"
    }
  }
];
var DATA_DIR = import_path2.default.join(process.cwd(), "data");
var TENANTS_FILE = import_path2.default.join(DATA_DIR, "tenants.json");
var USERS_FILE = import_path2.default.join(DATA_DIR, "users.json");
var DEFAULT_USERS = [
  {
    id: "usr_super_admin",
    tenant_id: "tenant_1",
    name: "M. A. Rahman (Super Admin)",
    email: "admin@padma-fleet.com",
    username: "padma_admin",
    password: "padma#pass123",
    phone: "+880 1711-001122",
    role: "super_admin",
    role_title_bn: "\u0995\u09CB\u09AE\u09CD\u09AA\u09BE\u09A8\u09BF \u09B8\u09C1\u09AA\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 (Super Admin)",
    status: "active",
    allowed_category_ids: ["all"],
    allowed_pump_ids: ["all"],
    permissions: {
      can_add_fuel: true,
      can_manage_vehicles: true,
      can_manage_pumps: true,
      can_view_reports: true,
      can_manage_users: true,
      can_edit_settings: true
    },
    created_at: "2026-08-01"
  },
  {
    id: "usr_supervisor",
    tenant_id: "tenant_1",
    name: "Kamal Hossain (Fuel In-charge)",
    email: "kamal.entry@padma-fleet.com",
    username: "kamal_entry",
    password: "user1234",
    phone: "+880 1712-334455",
    role: "data_entry",
    role_title_bn: "\u09A1\u09BE\u099F\u09BE \u098F\u09A8\u09CD\u099F\u09CD\u09B0\u09BF \u0985\u09AA\u09BE\u09B0\u09C7\u099F\u09B0 (Fuel Operator)",
    status: "active",
    allowed_category_ids: ["all"],
    allowed_pump_ids: ["all"],
    permissions: {
      can_add_fuel: true,
      can_manage_vehicles: false,
      can_manage_pumps: false,
      can_view_reports: true,
      can_manage_users: false,
      can_edit_settings: false
    },
    created_at: "2026-08-05"
  },
  {
    id: "usr_bengal_admin",
    tenant_id: "tenant_2",
    name: "Shafiqul Alam (Admin)",
    email: "shafiq@bengalinfra.com",
    username: "bengal_admin",
    password: "bengal#2026",
    phone: "+880 1819-445566",
    role: "super_admin",
    role_title_bn: "\u0995\u09CB\u09AE\u09CD\u09AA\u09BE\u09A8\u09BF \u09B8\u09C1\u09AA\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 (Super Admin)",
    status: "active",
    allowed_category_ids: ["all"],
    allowed_pump_ids: ["all"],
    permissions: {
      can_add_fuel: true,
      can_manage_vehicles: true,
      can_manage_pumps: true,
      can_view_reports: true,
      can_manage_users: true,
      can_edit_settings: true
    },
    created_at: "2026-08-15"
  },
  {
    id: "usr_jamuna_admin",
    tenant_id: "tenant_3",
    name: "Kabir Chowdhury (Admin)",
    email: "kabir@jamunapower.com",
    username: "jamuna_admin",
    password: "jamuna#pass2026",
    phone: "+880 1912-887766",
    role: "super_admin",
    role_title_bn: "\u0995\u09CB\u09AE\u09CD\u09AA\u09BE\u09A8\u09BF \u09B8\u09C1\u09AA\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 (Super Admin)",
    status: "active",
    allowed_category_ids: ["all"],
    allowed_pump_ids: ["all"],
    permissions: {
      can_add_fuel: true,
      can_manage_vehicles: true,
      can_manage_pumps: true,
      can_view_reports: true,
      can_manage_users: true,
      can_edit_settings: true
    },
    created_at: "2026-09-01"
  }
];
function ensureDataDir() {
  if (!import_fs2.default.existsSync(DATA_DIR)) {
    import_fs2.default.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!import_fs2.default.existsSync(TENANTS_FILE)) {
    import_fs2.default.writeFileSync(TENANTS_FILE, JSON.stringify(DEFAULT_TENANTS, null, 2), "utf-8");
  }
  if (!import_fs2.default.existsSync(USERS_FILE)) {
    import_fs2.default.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), "utf-8");
  }
}
function loadTenants() {
  try {
    ensureDataDir();
    const raw = import_fs2.default.readFileSync(TENANTS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("Error reading tenants file:", err);
  }
  return DEFAULT_TENANTS;
}
function saveTenants(tenants) {
  try {
    ensureDataDir();
    import_fs2.default.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving tenants file:", err);
  }
}
function loadUsers() {
  try {
    ensureDataDir();
    const raw = import_fs2.default.readFileSync(USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error("Error reading users file:", err);
  }
  return DEFAULT_USERS;
}
function saveUsers(usersList) {
  try {
    ensureDataDir();
    import_fs2.default.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving users file:", err);
  }
}
var activeTenants = loadTenants();
var activeUsers = loadUsers();
var app = (0, import_express.default)();
initMySQLDatabase().catch((err) => {
  console.warn("[MySQL] Auto-initialization error (running fallback mode):", err?.message || err);
});
app.use(import_express.default.json());
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
var checkTenantStatusMiddleware = (req, res, next) => {
  const tenantIdOrCode = req.headers["x-tenant-id"] || req.headers["x-tenant-code"] || req.query.tenant_id || req.body?.tenant_id;
  if (tenantIdOrCode) {
    const tenant = activeTenants.find(
      (t) => t.id === tenantIdOrCode || t.code?.toUpperCase() === String(tenantIdOrCode).toUpperCase()
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
      if (tenant.status === "suspended" || tenant.status === "inactive" || tenant.subscription?.status === "suspended") {
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
app.use("/api/fleet", checkTenantStatusMiddleware);
app.get("/api/tenants", async (req, res) => {
  const dbTenants = await fetchTenantsFromDB();
  if (dbTenants && dbTenants.length > 0) {
    activeTenants = dbTenants;
  } else {
    activeTenants = loadTenants();
  }
  const publicCompanies = activeTenants.filter((t) => !t.deleted_at && (t.status === "active" || !t.status && t.subscription?.status === "active")).map((t) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    status: t.status || t.subscription?.status || "active",
    currency: t.currency || "BDT",
    phone: t.phone,
    address: t.address,
    created_at: t.created_at,
    subscription_plan: t.subscription?.plan,
    subscription_status: t.subscription?.status || "active"
  }));
  res.json({
    success: true,
    data: publicCompanies,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/tenants/all", async (req, res) => {
  const dbTenants = await fetchTenantsFromDB();
  if (dbTenants && dbTenants.length > 0) {
    activeTenants = dbTenants;
  } else {
    activeTenants = loadTenants();
  }
  res.json({
    success: true,
    data: activeTenants,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/tenants", async (req, res) => {
  try {
    const newTenant = req.body;
    if (!newTenant.id || !newTenant.name || !newTenant.code) {
      res.status(400).json({ success: false, message: "Missing required tenant fields: id, name, code" });
      return;
    }
    activeTenants = loadTenants();
    const existingIdx = activeTenants.findIndex((t) => t.id === newTenant.id || t.code.toUpperCase() === newTenant.code.toUpperCase());
    const tenantRecord = {
      ...newTenant,
      status: newTenant.status || "active",
      deleted_at: null,
      created_at: newTenant.created_at || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    if (existingIdx >= 0) {
      activeTenants[existingIdx] = tenantRecord;
    } else {
      activeTenants.unshift(tenantRecord);
    }
    saveTenants(activeTenants);
    await upsertTenantInDB(tenantRecord).catch((e) => console.warn("[MySQL] Background tenant save error:", e));
    res.status(201).json({
      success: true,
      message: "Subscriber created and synchronized across all sessions successfully.",
      tenant: tenantRecord
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || "Server error creating tenant" });
  }
});
app.patch("/api/tenants/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  activeTenants = loadTenants();
  const tenant = activeTenants.find((t) => t.id === id);
  if (!tenant) {
    res.status(404).json({ success: false, message: "Tenant not found." });
    return;
  }
  tenant.status = status;
  if (tenant.subscription) {
    tenant.subscription.status = status;
  }
  saveTenants(activeTenants);
  await updateTenantStatusInDB(id, status).catch((e) => console.warn("[MySQL] Status update error:", e));
  res.json({
    success: true,
    message: `Tenant ${tenant.name} status updated to ${status}.`,
    tenant
  });
});
app.delete("/api/tenants/:id", async (req, res) => {
  const { id } = req.params;
  activeTenants = loadTenants();
  const tenant = activeTenants.find((t) => t.id === id);
  if (!tenant) {
    res.status(404).json({ success: false, message: "Tenant not found." });
    return;
  }
  tenant.deleted_at = (/* @__PURE__ */ new Date()).toISOString();
  tenant.status = "inactive";
  if (tenant.subscription) {
    tenant.subscription.status = "suspended";
  }
  saveTenants(activeTenants);
  await softDeleteTenantInDB(id).catch((e) => console.warn("[MySQL] Soft delete error:", e));
  res.json({
    success: true,
    message: `Tenant ${tenant.name} soft-deleted successfully.`
  });
});
app.get("/api/users", async (req, res) => {
  const dbUsers = await fetchUsersFromDB();
  if (dbUsers && dbUsers.length > 0) {
    activeUsers = dbUsers;
  } else {
    activeUsers = loadUsers();
  }
  res.json({
    success: true,
    data: activeUsers,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/users", async (req, res) => {
  try {
    const newUser = req.body;
    if (!newUser.id || !newUser.username || !newUser.tenant_id) {
      res.status(400).json({ success: false, message: "Missing user fields: id, username, tenant_id" });
      return;
    }
    activeUsers = loadUsers();
    const existingIdx = activeUsers.findIndex((u) => u.id === newUser.id || u.tenant_id === newUser.tenant_id && u.username.toLowerCase() === newUser.username.toLowerCase());
    if (existingIdx >= 0) {
      activeUsers[existingIdx] = { ...activeUsers[existingIdx], ...newUser };
    } else {
      activeUsers.unshift(newUser);
    }
    saveUsers(activeUsers);
    await upsertUserInDB(newUser).catch((e) => console.warn("[MySQL] User save error:", e));
    res.status(201).json({
      success: true,
      message: "User synchronized successfully across all browser sessions.",
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err?.message || "Server error syncing user" });
  }
});
app.get("/api/database/status", async (req, res) => {
  try {
    const retry = req.query.retry === "true";
    const status = await getMySQLStatus(retry);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Error checking database status" });
  }
});
app.post("/api/database/sync", async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Sync failed" });
  }
});
app.get("/api/database/schema-sql", (req, res) => {
  try {
    const schemaPath = import_path2.default.join(process.cwd(), "fuelflow_schema.sql");
    if (import_fs2.default.existsSync(schemaPath)) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="fuelflow_mysql_schema.sql"');
      res.sendFile(schemaPath);
    } else {
      res.status(404).send("Schema file not found");
    }
  } catch (err) {
    res.status(500).send(err?.message || "Error reading schema file");
  }
});
app.get("/api/database/guide", (req, res) => {
  res.json({
    success: true,
    recommendation: {
      provider: "TiDB Cloud Serverless",
      url: "https://tidbcloud.com",
      benefits: [
        "100% MySQL 8.0 wire-compatible",
        "5 GB storage FREE forever (no credit card required)",
        "High availability, automatic backups, and SSL encryption",
        "Scale-to-zero with zero cold-start delay"
      ],
      steps: [
        "1. Go to https://tidbcloud.com and sign up for free (Google Login supported).",
        '2. Click "Create Cluster" -> Select "Serverless" (Free Tier).',
        "3. Choose region nearest to you (e.g., Singapore or Mumbai).",
        "4. Create cluster (takes 5-10 seconds).",
        '5. Click "Connect" -> Note Host, Port (4000), User, Password, and Database name (test or fuelflow).',
        "6. Set MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_SSL=true in your environment variables.",
        "7. Run fuelflow_schema.sql in TiDB SQL Editor or let FuelNest auto-migrate!"
      ]
    },
    alternatives: [
      {
        name: "Aiven MySQL",
        url: "https://aiven.io",
        info: "Free trial & cloud instances available."
      },
      {
        name: "FreeDB",
        url: "https://freedb.tech",
        info: "Free remote MySQL databases."
      },
      {
        name: "Local / cPanel MySQL",
        url: "localhost / cPanel phpMyAdmin",
        info: "Self-hosted MySQL or standard web hosting MySQL."
      }
    ]
  });
});
app.post("/api/auth/login", (req, res) => {
  const { tenant_id, tenant_code, username, password } = req.body;
  activeTenants = loadTenants();
  activeUsers = loadUsers();
  const cleanUser = String(username || "").trim().toLowerCase();
  const cleanPass = String(password || "").trim();
  let targetTenant = activeTenants.find(
    (t) => tenant_id && t.id === tenant_id || tenant_code && t.code.toUpperCase() === String(tenant_code).toUpperCase()
  );
  if (!targetTenant) {
    targetTenant = activeTenants.find(
      (t) => t.subscription?.super_admin_username?.toLowerCase() === cleanUser || activeUsers.some((u) => u.tenant_id === t.id && (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser))
    );
  }
  if (!targetTenant) {
    res.status(404).json({ success: false, message: "Company / Tenant not found." });
    return;
  }
  if (targetTenant.deleted_at || targetTenant.status === "suspended" || targetTenant.status === "inactive" || targetTenant.subscription?.status === "suspended" || targetTenant.subscription?.status === "inactive") {
    res.status(403).json({
      success: false,
      suspended: true,
      message: "This account is suspended. Please contact the support team."
    });
    return;
  }
  let matchedUser = activeUsers.find(
    (u) => u.tenant_id === targetTenant.id && (u.username.toLowerCase() === cleanUser || u.email?.toLowerCase() === cleanUser)
  );
  if (!matchedUser && targetTenant.subscription?.super_admin_username) {
    if (targetTenant.subscription.super_admin_username.toLowerCase() === cleanUser) {
      matchedUser = {
        id: "usr_sa_" + targetTenant.id,
        tenant_id: targetTenant.id,
        name: targetTenant.contact_person || `${targetTenant.name} Admin`,
        email: targetTenant.email || `${cleanUser}@example.com`,
        username: targetTenant.subscription.super_admin_username,
        password: targetTenant.subscription.super_admin_password,
        phone: targetTenant.phone || "",
        role: "super_admin",
        role_title_bn: "\u0995\u09CB\u09AE\u09CD\u09AA\u09BE\u09A8\u09BF \u09B8\u09C1\u09AA\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 (Super Admin)",
        status: "active",
        allowed_category_ids: ["all"],
        allowed_pump_ids: ["all"],
        permissions: {
          can_add_fuel: true,
          can_manage_vehicles: true,
          can_manage_pumps: true,
          can_view_reports: true,
          can_manage_users: true,
          can_edit_settings: true
        },
        created_at: targetTenant.created_at || "2026-08-01"
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
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
var isBundled = Boolean(true);
var isDev = !isBundled && process.env.NODE_ENV === "development";
var isProduction = !isDev;
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"), (err) => {
        if (err && !res.headersSent) {
          res.status(500).send("FuelNest application index could not be loaded.");
        }
      });
    });
  }
  const PORT = 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FuelNest Server running on http://0.0.0.0:${PORT} (${isProduction ? "production" : "development"})`);
  });
}
if (!process.env.VERCEL) {
  startServer();
}
var server_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
//# sourceMappingURL=server.cjs.map
