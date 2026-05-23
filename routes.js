// ============================================================
//  routes.js — Semua API Endpoint Florence Connect
//  Jalankan: npm install express bcrypt jsonwebtoken dotenv
// ============================================================

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('./db');

const router  = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'florence-secret-key';

// ── Middleware: Verifikasi Token JWT ────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
}

// ── Middleware: Hanya Admin ─────────────────────────────────
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin')
    return res.status(403).json({ message: 'Akses ditolak — hanya admin' });
  next();
}


// ════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  const { nama_lengkap, nim, password } = req.body;

  if (!nama_lengkap || !nim || !password)
    return res.status(400).json({ message: 'Semua field wajib diisi' });

  if (password.length < 6)
    return res.status(400).json({ message: 'Password minimal 6 karakter' });

  try {
    const existing = await db.getUserByNim(nim);
    if (existing)
      return res.status(409).json({ message: 'NIM sudah terdaftar' });

    const hash   = await bcrypt.hash(password, 10);
    const userId = await db.registerUser(nama_lengkap, nim, hash);

    res.status(201).json({
      message: 'Akun berhasil dibuat',
      userId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});


// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { nim, password } = req.body;

  if (!nim || !password)
    return res.status(400).json({ message: 'NIM dan password wajib diisi' });

  try {
    const user = await db.getUserByNim(nim);
    if (!user)
      return res.status(401).json({ message: 'NIM atau password salah' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: 'NIM atau password salah' });

    const token = jwt.sign(
      { id: user.id, nim: user.nim, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id:           user.id,
        nama_lengkap: user.nama_lengkap,
        nim:          user.nim,
        role:         user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});


// GET /api/auth/me  — profil user yang sedang login
router.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const profile = await db.getUserProfile(req.user.id);
    if (!profile) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});


// ════════════════════════════════════════════════════════════
//  MASTER DATA
// ════════════════════════════════════════════════════════════

// GET /api/jadwal
router.get('/jadwal', async (_req, res) => {
  try {
    res.json(await db.getJadwal());
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data jadwal' });
  }
});

// GET /api/divisi
router.get('/divisi', async (_req, res) => {
  try {
    res.json(await db.getDivisi());
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data divisi' });
  }
});


// ════════════════════════════════════════════════════════════
//  PENDAFTARAN
// ════════════════════════════════════════════════════════════

// POST /api/pendaftaran  — submit pendaftaran
router.post('/pendaftaran', authMiddleware, async (req, res) => {
  const { jadwal_id, divisi_id, no_hp } = req.body;

  if (!jadwal_id || !divisi_id || !no_hp)
    return res.status(400).json({ message: 'Jadwal, divisi, dan nomor HP wajib diisi' });

  try {
    const sudahDaftar = await db.cekSudahDaftar(req.user.id);
    if (sudahDaftar)
      return res.status(409).json({ message: 'Kamu sudah pernah mendaftar' });

    const pendaftaranId = await db.submitPendaftaran(
      req.user.id, jadwal_id, divisi_id, no_hp
    );

    res.status(201).json({
      message: 'Pendaftaran berhasil! Admin akan menghubungi kamu segera.',
      pendaftaran_id: pendaftaranId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menyimpan pendaftaran' });
  }
});


// GET /api/pendaftaran/status  — cek status pendaftaran milik user
router.get('/pendaftaran/status', authMiddleware, async (req, res) => {
  try {
    const data = await db.getPendaftaranByUser(req.user.id);
    if (!data)
      return res.status(404).json({ message: 'Belum ada pendaftaran' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil status pendaftaran' });
  }
});


// ════════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ════════════════════════════════════════════════════════════

// GET /api/admin/dashboard
router.get('/admin/dashboard', authMiddleware, adminOnly, async (_req, res) => {
  try {
    res.json(await db.getDashboardStats());
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data dashboard' });
  }
});


// GET /api/admin/pendaftar?status=menunggu&divisi_id=1
router.get('/admin/pendaftar', authMiddleware, adminOnly, async (req, res) => {
  try {
    const filter = {
      status:   req.query.status    || null,
      divisiId: req.query.divisi_id || null,
      jadwalId: req.query.jadwal_id || null,
    };
    res.json(await db.getAllPendaftar(filter));
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data pendaftar' });
  }
});


// PATCH /api/admin/pendaftar/:id/status  — ubah status
router.patch('/admin/pendaftar/:id/status', authMiddleware, adminOnly, async (req, res) => {
  const { status, catatan } = req.body;
  const VALID = ['menunggu', 'diterima', 'ditolak', 'perlu_review'];

  if (!VALID.includes(status))
    return res.status(400).json({ message: `Status harus salah satu: ${VALID.join(', ')}` });

  try {
    await db.updateStatusPelamar(
      parseInt(req.params.id),
      status,
      catatan || '',
      req.user.id
    );
    res.json({ message: `Status berhasil diubah ke: ${status}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah status' });
  }
});


module.exports = router;
