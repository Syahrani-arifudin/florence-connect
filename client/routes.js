// ============================================================
//  routes.js — API Endpoint Florence Connect (Updated)
// ============================================================
const express    = require('express')
const bcrypt     = require('bcrypt')
const jwt        = require('jsonwebtoken')
const db         = require('./db')

const router     = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'florence-secret-key'

// ── Middleware JWT ──────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa' })
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ message: 'Akses ditolak — hanya admin' })
  next()
}

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════

// POST /api/auth/register
router.post('/auth/register', async (req, res) => {
  const { nama_lengkap, nim, password } = req.body
  if (!nama_lengkap?.trim() || !nim?.trim() || !password)
    return res.status(400).json({ message: 'Semua field wajib diisi' })
  if (password.length < 6)
    return res.status(400).json({ message: 'Password minimal 6 karakter' })
  try {
    const existing = await db.getUserByNim(nim.trim())
    if (existing) return res.status(409).json({ message: 'NIM sudah terdaftar' })
    const hash   = await bcrypt.hash(password, 10)
    const userId = await db.registerUser(nama_lengkap.trim(), nim.trim(), hash)
    res.status(201).json({ message: 'Akun berhasil dibuat', userId })
  } catch (err) {
    console.error('[register]', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { nim, password } = req.body
  if (!nim?.trim() || !password)
    return res.status(400).json({ message: 'NIM dan password wajib diisi' })
  try {
    const user = await db.getUserByNim(nim.trim())
    if (!user) return res.status(401).json({ message: 'NIM atau password salah' })
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'NIM atau password salah' })
    const token = jwt.sign(
      { id: user.id, nim: user.nim, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({
      message: 'Login berhasil',
      token,
      user: { id: user.id, nama_lengkap: user.nama_lengkap, nim: user.nim, role: user.role }
    })
  } catch (err) {
    console.error('[login]', err)
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

// GET /api/auth/me
router.get('/auth/me', auth, async (req, res) => {
  try {
    const profile = await db.getUserProfile(req.user.id)
    if (!profile) return res.status(404).json({ message: 'User tidak ditemukan' })
    res.json(profile)
  } catch (err) {
    res.status(500).json({ message: 'Terjadi kesalahan server' })
  }
})

// ════════════════════════════════════════════════════════════
//  MASTER DATA
// ════════════════════════════════════════════════════════════

router.get('/jadwal', async (_req, res) => {
  try { res.json(await db.getJadwal()) }
  catch { res.status(500).json({ message: 'Gagal mengambil data jadwal' }) }
})

router.get('/divisi', async (_req, res) => {
  try { res.json(await db.getDivisi()) }
  catch { res.status(500).json({ message: 'Gagal mengambil data divisi' }) }
})

// ════════════════════════════════════════════════════════════
//  PENDAFTARAN
// ════════════════════════════════════════════════════════════

router.post('/pendaftaran', auth, async (req, res) => {
  const { jadwal_id, divisi_id, no_hp } = req.body
  if (!jadwal_id || !divisi_id || !no_hp)
    return res.status(400).json({ message: 'Jadwal, divisi, dan nomor HP wajib diisi' })
  try {
    const sudah = await db.cekSudahDaftar(req.user.id)
    if (sudah) return res.status(409).json({ message: 'Kamu sudah pernah mendaftar' })
    const pendaftaranId = await db.submitPendaftaran(req.user.id, jadwal_id, divisi_id, no_hp)
    res.status(201).json({
      message: 'Pendaftaran berhasil! Admin akan menghubungi kamu segera.',
      pendaftaran_id: pendaftaranId
    })
  } catch (err) {
    console.error('[pendaftaran]', err)
    res.status(500).json({ message: 'Gagal menyimpan pendaftaran' })
  }
})

router.get('/pendaftaran/status', auth, async (req, res) => {
  try {
    const data = await db.getPendaftaranByUser(req.user.id)
    if (!data) return res.status(404).json({ message: 'Belum ada pendaftaran' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil status pendaftaran' })
  }
})

// ════════════════════════════════════════════════════════════
//  ADMIN
// ════════════════════════════════════════════════════════════

router.get('/admin/dashboard', auth, adminOnly, async (_req, res) => {
  try { res.json(await db.getDashboardStats()) }
  catch (err) {
    console.error('[dashboard]', err)
    res.status(500).json({ message: 'Gagal mengambil data dashboard' })
  }
})

// GET /api/admin/pendaftar?status=menunggu&divisi_id=1
router.get('/admin/pendaftar', auth, adminOnly, async (req, res) => {
  try {
    const filter = {
      status:   req.query.status    || null,
      divisiId: req.query.divisi_id || null,
      jadwalId: req.query.jadwal_id || null,
    }
    res.json(await db.getAllPendaftar(filter))
  } catch (err) {
    console.error('[pendaftar list]', err)
    res.status(500).json({ message: 'Gagal mengambil data pendaftar' })
  }
})

// PATCH /api/admin/pendaftar/:id/status
router.patch('/admin/pendaftar/:id/status', auth, adminOnly, async (req, res) => {
  const VALID = ['menunggu', 'diterima', 'ditolak', 'perlu_review']
  const { status, catatan } = req.body
  if (!VALID.includes(status))
    return res.status(400).json({ message: `Status harus: ${VALID.join(', ')}` })
  try {
    await db.updateStatusPelamar(parseInt(req.params.id), status, catatan || '', req.user.id)
    res.json({ message: `Status berhasil diubah ke: ${status}` })
  } catch (err) {
    console.error('[update status]', err)
    res.status(500).json({ message: 'Gagal mengubah status' })
  }
})

module.exports = router
