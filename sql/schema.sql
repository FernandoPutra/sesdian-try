-- ============================================================
-- SESDIAN - Sistem Digital Inventarisasi Aset Negara
-- Schema v2 | TiDB Cloud / MySQL 8.0 Compatible
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = '+07:00';

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nip         VARCHAR(30)  NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  phone       VARCHAR(20)  NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin','user') NOT NULL DEFAULT 'user',
  status      ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending',
  avatar_url  VARCHAR(500) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nip    (nip),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ROOMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rooms (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(30)  NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  floor       VARCHAR(20)  NULL,
  building    VARCHAR(100) NULL,
  pic_user_id BIGINT UNSIGNED NULL COMMENT 'Person In Charge (FK users)',
  qr_token    VARCHAR(100) NOT NULL UNIQUE COMMENT 'Token for public QR URL',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_qr_token (qr_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- ASSETS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assets (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  asset_code      VARCHAR(50)  NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL,
  category        VARCHAR(100) NULL,
  brand           VARCHAR(100) NULL,
  model           VARCHAR(100) NULL,
  serial_number   VARCHAR(150) NULL,
  room_id         BIGINT UNSIGNED NULL,
  is_consumable   TINYINT(1)   NOT NULL DEFAULT 0  COMMENT '1=consumable(no return), 0=fixed asset',
  condition       ENUM('baik','rusak_ringan','rusak_berat') NOT NULL DEFAULT 'baik',
  status          ENUM('available','borrowed','under_repair','disposed') NOT NULL DEFAULT 'available',
  purchase_date   DATE NULL,
  purchase_price  DECIMAL(15,2) NULL,
  notes           TEXT NULL,
  image_url       VARCHAR(500) NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  INDEX idx_status      (status),
  INDEX idx_room        (room_id),
  INDEX idx_consumable  (is_consumable)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- LOAN REQUESTS (Peminjaman)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_requests (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  batch_code      VARCHAR(50)  NOT NULL COMMENT 'Groups batch items together',
  user_id         BIGINT UNSIGNED NOT NULL,
  purpose         TEXT NOT NULL,
  borrow_date     DATE NOT NULL,
  return_due_date DATE NULL COMMENT 'NULL for consumables',
  status          ENUM('pending','approved','rejected','borrowed','returned','overdue') NOT NULL DEFAULT 'pending',
  approved_by     BIGINT UNSIGNED NULL,
  approved_at     DATETIME NULL,
  rejected_reason TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_batch   (batch_code),
  INDEX idx_user    (user_id),
  INDEX idx_status  (status),
  INDEX idx_due     (return_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- LOAN ITEMS (Detail per asset in a batch)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS loan_items (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  loan_request_id      BIGINT UNSIGNED NOT NULL,
  asset_id             BIGINT UNSIGNED NOT NULL,
  quantity             INT UNSIGNED NOT NULL DEFAULT 1,
  condition_before     ENUM('baik','rusak_ringan','rusak_berat') NOT NULL DEFAULT 'baik',
  condition_after      ENUM('baik','rusak_ringan','rusak_berat') NULL COMMENT 'Filled on checkin',
  checked_in_by        BIGINT UNSIGNED NULL,
  checked_in_at        DATETIME NULL,
  notes_return         TEXT NULL,
  FOREIGN KEY (loan_request_id) REFERENCES loan_requests(id),
  FOREIGN KEY (asset_id)        REFERENCES assets(id),
  FOREIGN KEY (checked_in_by)   REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_loan  (loan_request_id),
  INDEX idx_asset (asset_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- AUDIT TRAIL
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id    BIGINT UNSIGNED NULL COMMENT 'NULL = system',
  action      VARCHAR(100) NOT NULL COMMENT 'e.g. LOAN_APPROVED, ASSET_UPDATED',
  entity_type VARCHAR(50)  NOT NULL COMMENT 'e.g. loan_requests, assets, users',
  entity_id   BIGINT UNSIGNED NOT NULL,
  old_value   JSON NULL,
  new_value   JSON NULL,
  ip_address  VARCHAR(45) NULL,
  user_agent  VARCHAR(300) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_actor      (actor_id),
  INDEX idx_entity     (entity_type, entity_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- WHATSAPP NOTIFICATION LOGS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_logs (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  loan_request_id BIGINT UNSIGNED NULL,
  recipient_user_id BIGINT UNSIGNED NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  template_type   ENUM('approval','h1_reminder','overdue','rejection','checkin_confirm') NOT NULL,
  message_body    TEXT NOT NULL,
  wa_message_id   VARCHAR(100) NULL COMMENT 'ID returned by WA provider',
  status          ENUM('pending','sent','delivered','failed') NOT NULL DEFAULT 'pending',
  error_detail    TEXT NULL,
  sent_at         DATETIME NULL,
  delivered_at    DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_request_id)   REFERENCES loan_requests(id) ON DELETE SET NULL,
  FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_loan_request (loan_request_id),
  INDEX idx_status       (status),
  INDEX idx_created_at   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- MONTHLY PDF REPORT SNAPSHOTS (optional archival)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reports (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  period_year YEAR NOT NULL,
  period_month TINYINT UNSIGNED NOT NULL,
  generated_by BIGINT UNSIGNED NULL,
  file_url    VARCHAR(500) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_period (period_year, period_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;