// ============================================================
//  server.js — Entry Point Florence Connect Backend
// ============================================================

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware Global ───────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', app: 'Florence Connect API', version: '1.0.0' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎸  Florence Connect API berjalan di http://localhost:${PORT}`);
});
