-- ============================================================
-- FuelFlow Enterprise Fleet & Fuel Management System
-- MySQL 5.7+ / 8.0+ / TiDB Cloud / MariaDB Database Schema
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- ============================================================

CREATE DATABASE IF NOT EXISTS `fuelflow` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `fuelflow`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. Table: tenants (SaaS Multi-tenant Subscribers)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'BDT',
  `phone` VARCHAR(64) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `contact_person` VARCHAR(128) DEFAULT NULL,
  `email` VARCHAR(128) DEFAULT NULL,
  `status` ENUM('active', 'expired', 'suspended', 'trial') DEFAULT 'active',
  `deleted_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `subscription_plan` VARCHAR(64) DEFAULT 'starter',
  `subscription_status` VARCHAR(32) DEFAULT 'active',
  `subscription_start_date` DATE DEFAULT NULL,
  `subscription_end_date` DATE DEFAULT NULL,
  `subscription_price` DECIMAL(12,2) DEFAULT 0.00,
  `subscription_raw` JSON DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenants_code` (`code`),
  KEY `idx_tenants_status` (`status`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Table: users (Tenant Users & Super Admins)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(128) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `role` VARCHAR(64) NOT NULL DEFAULT 'operator',
  `role_title_bn` VARCHAR(128) DEFAULT NULL,
  `company_id` VARCHAR(64) DEFAULT NULL,
  `status` ENUM('active', 'suspended') DEFAULT 'active',
  `allowed_categories` JSON DEFAULT NULL,
  `allowed_pumps` JSON DEFAULT NULL,
  `permissions` JSON DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_username` (`tenant_id`, `username`),
  KEY `idx_users_tenant` (`tenant_id`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Table: companies (Sister Concerns / Business Units)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `companies` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(128) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `contact_person` VARCHAR(128) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `email` VARCHAR(128) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_companies_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. Table: vendors (Vehicle Rental / Transport Vendors)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vendors` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(128) NOT NULL,
  `contact_person` VARCHAR(128) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `email` VARCHAR(128) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vendors_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. Table: fuel_pumps (External Fuel Stations & Credit Ledger)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fuel_pumps` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(128) NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `contact_person` VARCHAR(128) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `credit_limit` DECIMAL(14,2) DEFAULT 0.00,
  `opening_balance` DECIMAL(14,2) DEFAULT 0.00,
  `current_balance` DECIMAL(14,2) DEFAULT 0.00,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pumps_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. Table: fuel_types (Diesel, Octane, Petrol, CNG, LPG)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fuel_types` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(64) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `unit` VARCHAR(32) DEFAULT 'Liter',
  `current_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `price_history` JSON DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fuel_types_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. Table: vehicle_categories (Vehicle Classes & Benchmarks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vehicle_categories` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `name` VARCHAR(128) NOT NULL,
  `metric_type` ENUM('kmpl', 'lph') DEFAULT 'kmpl',
  `default_benchmark` DECIMAL(8,2) DEFAULT 10.00,
  `icon_name` VARCHAR(64) DEFAULT 'Truck',
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_categories_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 8. Table: vehicles (Fleet Inventory)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `vehicle_number` VARCHAR(64) NOT NULL,
  `category_id` VARCHAR(64) NOT NULL,
  `ownership` ENUM('owned', 'rented') DEFAULT 'owned',
  `vendor_id` VARCHAR(64) DEFAULT NULL,
  `company_id` VARCHAR(64) NOT NULL,
  `fuel_type_id` VARCHAR(64) NOT NULL,
  `expected_benchmark` DECIMAL(8,2) DEFAULT 10.00,
  `current_odometer` DECIMAL(12,2) DEFAULT 0.00,
  `driver_name` VARCHAR(128) DEFAULT NULL,
  `driver_phone` VARCHAR(64) DEFAULT NULL,
  `status` ENUM('active', 'maintenance', 'idle') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_vehicles_tenant` (`tenant_id`),
  KEY `idx_vehicles_number` (`vehicle_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 9. Table: fuel_entries (Fuel Dispense Logs & Mileage Audits)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `fuel_entries` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `entry_date` DATE NOT NULL,
  `slip_no` VARCHAR(64) DEFAULT NULL,
  `vehicle_id` VARCHAR(64) NOT NULL,
  `company_id` VARCHAR(64) NOT NULL,
  `source_type` ENUM('pump', 'tanker') DEFAULT 'pump',
  `pump_id` VARCHAR(64) DEFAULT NULL,
  `tanker_id` VARCHAR(64) DEFAULT NULL,
  `previous_meter` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `current_meter` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `distance_traveled` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `fuel_liters` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `calculated_mileage` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `benchmark_mileage` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `is_anomaly` TINYINT(1) NOT NULL DEFAULT 0,
  `anomaly_diff_percent` DECIMAL(8,2) DEFAULT 0.00,
  `anomaly_reason` TEXT DEFAULT NULL,
  `receipt_image_url` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_by_name` VARCHAR(128) DEFAULT 'System',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fuel_entries_tenant_date` (`tenant_id`, `entry_date`),
  KEY `idx_fuel_entries_vehicle` (`vehicle_id`),
  KEY `idx_fuel_entries_pump` (`pump_id`),
  KEY `idx_fuel_entries_anomaly` (`tenant_id`, `is_anomaly`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 10. Table: pump_payments (Credit Payments to Pumps)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pump_payments` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `pump_id` VARCHAR(64) NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `payment_method` ENUM('bank_transfer', 'cheque', 'cash', 'mfs') DEFAULT 'bank_transfer',
  `transaction_ref` VARCHAR(128) DEFAULT NULL,
  `receipt_url` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `recorded_by` VARCHAR(128) DEFAULT 'Admin',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_tenant_pump` (`tenant_id`, `pump_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 11. Table: tanker_inventories (Internal Bowzer / Storage Tanks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tanker_inventories` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `tanker_name` VARCHAR(128) NOT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `capacity_liters` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `current_stock_liters` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `fuel_type_id` VARCHAR(64) NOT NULL,
  `min_alert_threshold` DECIMAL(12,2) DEFAULT 1000.00,
  `last_restocked_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tankers_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 12. Table: tanker_logs (Tanker Refill, Dispense, Dip Adjustments)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `tanker_logs` (
  `id` VARCHAR(64) NOT NULL,
  `tenant_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `tanker_id` VARCHAR(64) NOT NULL,
  `log_type` ENUM('stock_in', 'dispense_out', 'dip_adjustment', 'transfer') NOT NULL,
  `date` DATE NOT NULL,
  `liters` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `unit_cost` DECIMAL(10,2) DEFAULT 0.00,
  `source_or_vehicle` VARCHAR(128) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `previous_stock` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `new_stock` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tanker_logs_tenant` (`tenant_id`, `tanker_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 13. Table: saas_moderators (Platform Admins)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `saas_moderators` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(128) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `status` ENUM('active', 'suspended') DEFAULT 'active',
  `permissions` JSON DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_mod_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
