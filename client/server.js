// ============================================================
//  server.js — Florence Connect Backend (Updated for React)
// ============================================================
require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const routes  = require('./routes')

const app  = express()
const PORT = process.env.PORT || 3000

// ── CORS — allow React dev server ──────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ],
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ──────────────────────────────────────────────────
app.use('/api', routes)

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', app: 'Florence Connect API', version: '2.0.0' })
})

// 404
app.use((_req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan' }))

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🎸  Florence Connect API  →  http://localhost:${PORT}`)
})
