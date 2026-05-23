// ============================================================
//  db.js — Koneksi MySQL + Query Helpers
//  Jalankan: npm install mysql2 bcrypt jsonwebtoken dotenv
// ============================================================

const mysql = require('mysql2/promise');

// ── Connection Pool ─────────────────────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'florence_connect',
  port:               process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',
});

// Test koneksi saat startup
pool.getConnection()
  .then(conn => {
    console.log('✅  MySQL terhubung — florence_connect');
    conn.release();
  })
  .catch(err => {
    console.error('❌  Gagal konek MySQL:', err.message);
    process.exit(1);
  });


// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════

/**
 * Daftarkan user baru
 * @param {string} namaLengkap
 * @param {string} nim
 * @param {string} passwordHash  — sudah di-hash bcrypt
 */
async function registerUser(namaLengkap, nim, passwordHash) {
  const [result] = await pool.execute(
    `INSERT INTO users (nama_lengkap, nim, password)
     VALUES (?, ?, ?)`,
    [namaLengkap, nim, passwordHash]
  );
  return result.insertId;
}

/**
 * Cari user berdasarkan NIM (untuk login)
 */
async function getUserByNim(nim) {
  const [rows] = await pool.execute(
    `SELECT id, nama_lengkap, nim, password, role
     FROM users WHERE nim = ? LIMIT 1`,
    [nim]
  );
  return rows[0] || null;
}

/**
 * Ambil data user + status pendaftaran sekaligus
 */
async function getUserProfile(userId) {
  const [rows] = await pool.execute(
    `SELECT
       u.id, u.nama_lengkap, u.nim, u.no_hp, u.role,
       p.id            AS pendaftaran_id,
       j.nama_jadwal,
       d.nama_divisi,
       d.emoji,
       sp.status
     FROM users u
     LEFT JOIN pendaftaran    p  ON p.user_id   = u.id
     LEFT JOIN jadwal_perekrutan j ON j.id = p.jadwal_id
     LEFT JOIN divisi          d  ON d.id        = p.divisi_id
     LEFT JOIN status_pelamar  sp ON sp.pendaftaran_id = p.id
     WHERE u.id = ?`,
    [userId]
  );
  return rows[0] || null;
}


// ════════════════════════════════════════════════════════════
//  MASTER DATA
// ════════════════════════════════════════════════════════════

/** Ambil semua jadwal aktif */
async function getJadwal() {
  const [rows] = await pool.execute(
    `SELECT id, nama_jadwal, keterangan
     FROM jadwal_perekrutan WHERE is_active = 1`
  );
  return rows;
}

/** Ambil semua divisi aktif */
async function getDivisi() {
  const [rows] = await pool.execute(
    `SELECT id, nama_divisi, emoji, deskripsi
     FROM divisi WHERE is_active = 1`
  );
  return rows;
}


// ════════════════════════════════════════════════════════════
//  PENDAFTARAN
// ════════════════════════════════════════════════════════════

/**
 * Simpan pendaftaran + buat status awal dalam 1 transaksi
 */
async function submitPendaftaran(userId, jadwalId, divisiId, noHp) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Simpan data pendaftaran
    const [p] = await conn.execute(
      `INSERT INTO pendaftaran (user_id, jadwal_id, divisi_id, no_hp)
       VALUES (?, ?, ?, ?)`,
      [userId, jadwalId, divisiId, noHp]
    );
    const pendaftaranId = p.insertId;

    // 2. Update no_hp di tabel users
    await conn.execute(
      `UPDATE users SET no_hp = ? WHERE id = ?`,
      [noHp, userId]
    );

    // 3. Buat status awal 'menunggu'
    await conn.execute(
      `INSERT INTO status_pelamar (pendaftaran_id, status)
       VALUES (?, 'menunggu')`,
      [pendaftaranId]
    );

    await conn.commit();
    return pendaftaranId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Cek apakah user sudah pernah daftar
 */
async function cekSudahDaftar(userId) {
  const [rows] = await pool.execute(
    `SELECT id FROM pendaftaran WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
}

/**
 * Ambil detail pendaftaran milik user
 */
async function getPendaftaranByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT
       p.id, p.submitted_at,
       j.nama_jadwal,
       d.nama_divisi, d.emoji,
       p.no_hp,
       sp.status, sp.catatan_admin
     FROM pendaftaran p
     JOIN jadwal_perekrutan  j  ON j.id  = p.jadwal_id
     JOIN divisi             d  ON d.id  = p.divisi_id
     JOIN status_pelamar     sp ON sp.pendaftaran_id = p.id
     WHERE p.user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}


// ════════════════════════════════════════════════════════════
//  PANEL ADMIN
// ════════════════════════════════════════════════════════════

/**
 * Ambil semua pendaftar + filter opsional
 * @param {{ status?, divisiId?, jadwalId? }} filter
 */
async function getAllPendaftar(filter = {}) {
  let where = ['1=1'];
  const params = [];

  if (filter.status) {
    where.push('sp.status = ?');
    params.push(filter.status);
  }
  if (filter.divisiId) {
    where.push('p.divisi_id = ?');
    params.push(filter.divisiId);
  }
  if (filter.jadwalId) {
    where.push('p.jadwal_id = ?');
    params.push(filter.jadwalId);
  }

  const [rows] = await pool.execute(
    `SELECT
       p.id AS pendaftaran_id,
       u.id AS user_id, u.nama_lengkap, u.nim, u.no_hp,
       j.nama_jadwal,
       d.nama_divisi, d.emoji,
       sp.status, sp.catatan_admin,
       p.submitted_at
     FROM pendaftaran p
     JOIN users              u  ON u.id   = p.user_id
     JOIN jadwal_perekrutan  j  ON j.id   = p.jadwal_id
     JOIN divisi             d  ON d.id   = p.divisi_id
     JOIN status_pelamar     sp ON sp.pendaftaran_id = p.id
     WHERE ${where.join(' AND ')}
     ORDER BY p.submitted_at DESC`,
    params
  );
  return rows;
}

/**
 * Update status pelamar (oleh admin)
 * @param {number} pendaftaranId
 * @param {'diterima'|'ditolak'|'menunggu'|'perlu_review'} status
 * @param {string} catatan
 * @param {number} adminId
 */
async function updateStatusPelamar(pendaftaranId, status, catatan, adminId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Update status
    await conn.execute(
      `UPDATE status_pelamar
       SET status = ?, catatan_admin = ?,
           diproses_oleh = ?, diproses_pada = NOW()
       WHERE pendaftaran_id = ?`,
      [status, catatan, adminId, pendaftaranId]
    );

    // 2. Catat di audit log
    await conn.execute(
      `INSERT INTO admin_log (admin_id, aksi, target_id, keterangan)
       VALUES (?, 'UPDATE_STATUS', ?, ?)`,
      [adminId, pendaftaranId, `Status diubah ke: ${status}`]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Statistik ringkas untuk dashboard admin
 */
async function getDashboardStats() {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*)                                        AS total_pendaftar,
       SUM(sp.status = 'menunggu')                    AS menunggu,
       SUM(sp.status = 'diterima')                    AS diterima,
       SUM(sp.status = 'ditolak')                     AS ditolak,
       SUM(sp.status = 'perlu_review')                AS perlu_review
     FROM pendaftaran p
     JOIN status_pelamar sp ON sp.pendaftaran_id = p.id`
  );

  const [byDivisi] = await pool.execute(
    `SELECT d.nama_divisi, d.emoji, COUNT(*) AS jumlah
     FROM pendaftaran p
     JOIN divisi d ON d.id = p.divisi_id
     GROUP BY d.id ORDER BY jumlah DESC`
  );

  const [byJadwal] = await pool.execute(
    `SELECT j.nama_jadwal, COUNT(*) AS jumlah
     FROM pendaftaran p
     JOIN jadwal_perekrutan j ON j.id = p.jadwal_id
     GROUP BY j.id`
  );

  return {
    summary:   rows[0],
    byDivisi,
    byJadwal,
  };
}


// ════════════════════════════════════════════════════════════
//  EXPORTS
// ════════════════════════════════════════════════════════════
module.exports = {
  pool,
  // Auth
  registerUser,
  getUserByNim,
  getUserProfile,
  // Master
  getJadwal,
  getDivisi,
  // Pendaftaran
  submitPendaftaran,
  cekSudahDaftar,
  getPendaftaranByUser,
  // Admin
  getAllPendaftar,
  updateStatusPelamar,
  getDashboardStats,
};
