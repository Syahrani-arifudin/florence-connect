-- ============================================================
--  FLORENCE CONNECT — MySQL Database Schema
--  Tech Stack : Node.js + mysql2
--  Dibuat     : Pertemuan ke-6
-- ============================================================

CREATE DATABASE IF NOT EXISTS florence_connect
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE florence_connect;

-- ────────────────────────────────────────────────────────────
-- 1. TABEL USERS
--    Menyimpan akun calon anggota yang mendaftar
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT          NOT NULL AUTO_INCREMENT,
  nama_lengkap VARCHAR(100) NOT NULL,
  nim          VARCHAR(20)  NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,          -- bcrypt hash
  no_hp        VARCHAR(20)  DEFAULT NULL,
  role         ENUM('member', 'admin')
                            NOT NULL DEFAULT 'member',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_nim (nim)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 2. TABEL JADWAL_PEREKRUTAN
--    Master data pilihan jadwal yang tersedia
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jadwal_perekrutan (
  id          INT         NOT NULL AUTO_INCREMENT,
  nama_jadwal VARCHAR(50) NOT NULL,             -- contoh: "Senin – Rabu"
  keterangan  VARCHAR(100) DEFAULT NULL,
  is_active   TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Data default jadwal
INSERT INTO jadwal_perekrutan (nama_jadwal, keterangan) VALUES
  ('Senin – Rabu',   'Sesi awal minggu'),
  ('Kamis – Sabtu',  'Sesi akhir minggu');

-- ────────────────────────────────────────────────────────────
-- 3. TABEL DIVISI
--    Master data divisi yang bisa dipilih
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS divisi (
  id           INT         NOT NULL AUTO_INCREMENT,
  nama_divisi  VARCHAR(50) NOT NULL,
  deskripsi    TEXT        DEFAULT NULL,
  emoji        VARCHAR(10) DEFAULT NULL,
  is_active    TINYINT(1)  NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Ganti baris INSERT INTO divisi yang lama dengan ini:
INSERT INTO divisi (nama_divisi, emoji, deskripsi)
SELECT * FROM (VALUES
  ROW('Gitar',          '🎸', 'Divisi gitar akustik dan elektrik'),
  ROW('Piano',          '🎹', 'Divisi keyboard dan piano klasik'),
  ROW('Drum',           '🥁', 'Divisi perkusi dan drum kit'),
  ROW('Bass',           '🎵', 'Divisi bass gitar'),
  ROW('Vokal',          '🎤', 'Divisi vokal dan olah suara'),
  ROW('Manajemen Band', '🎼', 'Divisi manajemen dan produksi band')
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM divisi LIMIT 1);

-- Data default divisi
INSERT INTO divisi (nama_divisi, emoji, deskripsi) VALUES
  ('Gitar',          '🎸', 'Divisi gitar akustik dan elektrik'),
  ('Piano',          '🎹', 'Divisi keyboard dan piano klasik'),
  ('Drum',           '🥁', 'Divisi perkusi dan drum kit'),
  ('Bass',           '🎵', 'Divisi bass gitar'),
  ('Vokal',          '🎤', 'Divisi vokal dan olah suara'),
  ('Manajemen Band', '🎼', 'Divisi manajemen dan produksi band');

-- ────────────────────────────────────────────────────────────
-- 4. TABEL PENDAFTARAN
--    Menyimpan data pendaftaran tiap user
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pendaftaran (
  id           INT NOT NULL AUTO_INCREMENT,
  user_id      INT NOT NULL,
  jadwal_id    INT NOT NULL,
  divisi_id    INT NOT NULL,
  no_hp        VARCHAR(20)  NOT NULL,
  submitted_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_pendaftaran (user_id),    -- 1 user hanya 1 pendaftaran
  FOREIGN KEY (user_id)   REFERENCES users(id)             ON DELETE CASCADE,
  FOREIGN KEY (jadwal_id) REFERENCES jadwal_perekrutan(id) ON DELETE RESTRICT,
  FOREIGN KEY (divisi_id) REFERENCES divisi(id)            ON DELETE RESTRICT,
  INDEX idx_jadwal (jadwal_id),
  INDEX idx_divisi (divisi_id)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 5. TABEL STATUS_PELAMAR
--    Melacak status review pendaftaran oleh admin
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS status_pelamar (
  id             INT NOT NULL AUTO_INCREMENT,
  pendaftaran_id INT NOT NULL UNIQUE,
  status         ENUM('menunggu', 'diterima', 'ditolak', 'perlu_review')
                              NOT NULL DEFAULT 'menunggu',
  catatan_admin  TEXT         DEFAULT NULL,
  diproses_oleh  INT          DEFAULT NULL,    -- FK ke users (admin)
  diproses_pada  DATETIME     DEFAULT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (pendaftaran_id) REFERENCES pendaftaran(id) ON DELETE CASCADE,
  FOREIGN KEY (diproses_oleh)  REFERENCES users(id)       ON DELETE SET NULL,
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 6. TABEL ADMIN_LOG
--    Audit trail semua aksi yang dilakukan admin
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_log (
  id         INT          NOT NULL AUTO_INCREMENT,
  admin_id   INT          NOT NULL,
  aksi       VARCHAR(100) NOT NULL,            -- contoh: "UPDATE_STATUS"
  target_id  INT          DEFAULT NULL,        -- ID baris yang diubah
  keterangan TEXT         DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin (admin_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 7. SEED: Akun Admin Default
--    Password: admin123  (bcrypt hash — ganti di production!)
-- ────────────────────────────────────────────────────────────
INSERT INTO users (nama_lengkap, nim, password, role) VALUES
  ('Admin Florence', 'ADMIN001',
   '$2b$10$exampleHashReplaceThisInProduction', 'admin');
