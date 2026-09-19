var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
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
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var TENANTS_FILE = import_path.default.join(DATA_DIR, "tenants.json");
var USERS_FILE = import_path.default.join(DATA_DIR, "users.json");
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
  if (!import_fs.default.existsSync(DATA_DIR)) {
    import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!import_fs.default.existsSync(TENANTS_FILE)) {
    import_fs.default.writeFileSync(TENANTS_FILE, JSON.stringify(DEFAULT_TENANTS, null, 2), "utf-8");
  }
  if (!import_fs.default.existsSync(USERS_FILE)) {
    import_fs.default.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), "utf-8");
  }
}
function loadTenants() {
  try {
    ensureDataDir();
    const raw = import_fs.default.readFileSync(TENANTS_FILE, "utf-8");
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
    import_fs.default.writeFileSync(TENANTS_FILE, JSON.stringify(tenants, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving tenants file:", err);
  }
}
function loadUsers() {
  try {
    ensureDataDir();
    const raw = import_fs.default.readFileSync(USERS_FILE, "utf-8");
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
    import_fs.default.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving users file:", err);
  }
}
var activeTenants = loadTenants();
var activeUsers = loadUsers();
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json());
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });
  const checkTenantStatusMiddleware = (req, res, next) => {
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
  app.get("/api/tenants", (req, res) => {
    activeTenants = loadTenants();
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
  app.get("/api/tenants/all", (req, res) => {
    activeTenants = loadTenants();
    res.json({
      success: true,
      data: activeTenants,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/tenants", (req, res) => {
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
      res.status(201).json({
        success: true,
        message: "Subscriber created and synchronized across all sessions successfully.",
        tenant: tenantRecord
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err?.message || "Server error creating tenant" });
    }
  });
  app.patch("/api/tenants/:id/status", (req, res) => {
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
    res.json({
      success: true,
      message: `Tenant ${tenant.name} status updated to ${status}.`,
      tenant
    });
  });
  app.delete("/api/tenants/:id", (req, res) => {
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
    res.json({
      success: true,
      message: `Tenant ${tenant.name} soft-deleted successfully.`
    });
  });
  app.get("/api/users", (req, res) => {
    activeUsers = loadUsers();
    res.json({
      success: true,
      data: activeUsers,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  app.post("/api/users", (req, res) => {
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
      res.status(201).json({
        success: true,
        message: "User synchronized successfully across all browser sessions.",
        user: newUser
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err?.message || "Server error syncing user" });
    }
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
  const isBundled = Boolean(true);
  const isDev = !isBundled && process.env.NODE_ENV === "development";
  const isProduction = !isDev;
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"), (err) => {
        if (err && !res.headersSent) {
          res.status(500).send("FuelFlow application index could not be loaded.");
        }
      });
    });
  }
  const PORT = isProduction ? Number(process.env.PORT) || 3e3 : 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FuelFlow Server running on http://0.0.0.0:${PORT} (${isProduction ? "production" : "development"})`);
  });
  if (isProduction && PORT !== 3e3) {
    try {
      const backupServer = app.listen(3e3, "0.0.0.0", () => {
        console.log(`FuelFlow Server also listening on http://0.0.0.0:3000`);
      });
      backupServer.on("error", () => {
      });
    } catch {
    }
  }
}
startServer();
//# sourceMappingURL=server.cjs.map
