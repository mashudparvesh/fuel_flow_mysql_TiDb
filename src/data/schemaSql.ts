export const FUELNEST_MYSQL_SCHEMA_SQL = `-- ============================================================
-- FuelNest Enterprise Fleet & Fuel Management System
-- MySQL 5.7+ / 8.0+ / TiDB Cloud Serverless Database Schema
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- Host: gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000
-- ============================================================

CREATE DATABASE IF NOT EXISTS \`fuelflow\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`fuelflow\`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. Table: tenants (SaaS Multi-tenant Subscribers)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`tenants\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`code\` VARCHAR(32) NOT NULL,
  \`currency\` VARCHAR(10) DEFAULT 'BDT',
  \`phone\` VARCHAR(64) DEFAULT NULL,
  \`address\` TEXT DEFAULT NULL,
  \`contact_person\` VARCHAR(128) DEFAULT NULL,
  \`email\` VARCHAR(128) DEFAULT NULL,
  \`status\` ENUM('active', 'expired', 'suspended', 'trial') DEFAULT 'active',
  \`deleted_at\` DATETIME DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`subscription_plan\` VARCHAR(64) DEFAULT 'starter',
  \`subscription_status\` VARCHAR(32) DEFAULT 'active',
  \`subscription_start_date\` DATE DEFAULT NULL,
  \`subscription_end_date\` DATE DEFAULT NULL,
  \`subscription_price\` DECIMAL(12,2) DEFAULT 0.00,
  \`subscription_raw\` JSON DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_tenants_code\` (\`code\`),
  KEY \`idx_tenants_status\` (\`status\`, \`deleted_at\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Table: users (Tenant Users & Super Admins)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`tenant_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(128) NOT NULL,
  \`email\` VARCHAR(128) NOT NULL,
  \`username\` VARCHAR(64) NOT NULL,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`phone\` VARCHAR(64) DEFAULT NULL,
  \`role\` VARCHAR(64) NOT NULL DEFAULT 'operator',
  \`role_title_bn\` VARCHAR(128) DEFAULT NULL,
  \`company_id\` VARCHAR(64) DEFAULT NULL,
  \`status\` ENUM('active', 'suspended') DEFAULT 'active',
  \`allowed_categories\` JSON DEFAULT NULL,
  \`allowed_pumps\` JSON DEFAULT NULL,
  \`permissions\` JSON DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_tenant_username\` (\`tenant_id\`, \`username\`),
  KEY \`idx_users_tenant\` (\`tenant_id\`),
  KEY \`idx_users_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Table: vehicles (Fleet Vehicles & Equipment)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`vehicles\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`tenant_id\` VARCHAR(64) NOT NULL,
  \`company_id\` VARCHAR(64) DEFAULT NULL,
  \`registration_no\` VARCHAR(64) NOT NULL,
  \`vehicle_type\` VARCHAR(64) NOT NULL,
  \`fuel_type\` VARCHAR(32) NOT NULL DEFAULT 'diesel',
  \`tank_capacity\` DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  \`benchmark_kmpl\` DECIMAL(6,2) DEFAULT NULL,
  \`current_odometer\` DECIMAL(12,2) DEFAULT 0.00,
  \`driver_name\` VARCHAR(128) DEFAULT NULL,
  \`driver_phone\` VARCHAR(64) DEFAULT NULL,
  \`status\` ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  \`qr_code_token\` VARCHAR(128) DEFAULT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_vehicles_tenant\` (\`tenant_id\`),
  KEY \`idx_vehicles_reg\` (\`registration_no\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. Table: fuel_entries (Fuel Dispense & Refuel Logs)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`fuel_entries\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`tenant_id\` VARCHAR(64) NOT NULL,
  \`vehicle_id\` VARCHAR(64) NOT NULL,
  \`source_type\` ENUM('pump', 'tanker', 'external_vendor') DEFAULT 'pump',
  \`pump_id\` VARCHAR(64) DEFAULT NULL,
  \`tanker_id\` VARCHAR(64) DEFAULT NULL,
  \`fuel_type\` VARCHAR(32) NOT NULL,
  \`quantity_liters\` DECIMAL(10,2) NOT NULL,
  \`price_per_liter\` DECIMAL(10,2) NOT NULL,
  \`total_cost\` DECIMAL(12,2) NOT NULL,
  \`odometer_reading\` DECIMAL(12,2) DEFAULT NULL,
  \`hour_meter_reading\` DECIMAL(10,2) DEFAULT NULL,
  \`calculated_mileage\` DECIMAL(8,2) DEFAULT NULL,
  \`is_anomaly\` TINYINT(1) DEFAULT 0,
  \`anomaly_reason\` VARCHAR(255) DEFAULT NULL,
  \`receipt_no\` VARCHAR(64) DEFAULT NULL,
  \`dispensed_by\` VARCHAR(128) DEFAULT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`entry_date\` DATETIME NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_fuel_entries_tenant\` (\`tenant_id\`),
  KEY \`idx_fuel_entries_vehicle\` (\`vehicle_id\`),
  KEY \`idx_fuel_entries_date\` (\`entry_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. Table: fuel_pumps (Vendor Pumps & Credit Tracking)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`fuel_pumps\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`tenant_id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(128) NOT NULL,
  \`vendor_name\` VARCHAR(128) DEFAULT NULL,
  \`location\` VARCHAR(255) DEFAULT NULL,
  \`contact_number\` VARCHAR(64) DEFAULT NULL,
  \`credit_limit\` DECIMAL(12,2) DEFAULT 500000.00,
  \`current_balance\` DECIMAL(12,2) DEFAULT 0.00,
  \`payment_terms_days\` INT DEFAULT 30,
  \`status\` ENUM('active', 'inactive') DEFAULT 'active',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_fuel_pumps_tenant\` (\`tenant_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. Table: pump_payments (Credit Clearance & Bank Payments)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS \`pump_payments\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`tenant_id\` VARCHAR(64) NOT NULL,
  \`pump_id\` VARCHAR(64) NOT NULL,
  \`amount\` DECIMAL(12,2) NOT NULL,
  \`payment_method\` VARCHAR(64) DEFAULT 'bank_transfer',
  \`reference_no\` VARCHAR(128) DEFAULT NULL,
  \`notes\` TEXT DEFAULT NULL,
  \`payment_date\` DATE NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`idx_pump_payments_tenant\` (\`tenant_id\`),
  KEY \`idx_pump_payments_pump\` (\`pump_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
`;
