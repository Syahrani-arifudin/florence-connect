# Florence Connect — Setup Guide

## Struktur Project
```
Florence-connect/
├── client/                  ← React frontend (GANTI dengan folder ini)
│   ├── src/
│   │   ├── api/index.js
│   │   ├── hooks/useAuth.jsx
│   │   ├── pages/
│   │   │   ├── Beranda.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Landing.jsx
│   │   │   └── Admin.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── florence-connect-backend/
    ├── .env                 ← Isi dulu!
    ├── db.js
    ├── routes.js            ← Ganti dengan versi baru
    ├── server.js            ← Ganti dengan versi baru
    └── schema.sql
```

---

## STEP 1 — Persiapan Backend

### Masuk ke folder backend
```bash
cd florence-connect-backend
```

### Ganti routes.js dan server.js dengan file baru dari ZIP

### Pastikan .env sudah diisi
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql_kamu
DB_NAME=florence_connect
JWT_SECRET=florence-rahasia-super-panjang-2024
PORT=3000
```

### Jalankan backend
```bash
npm run dev
# Output: 🎸 Florence Connect API → http://localhost:3000
```

---

## STEP 2 — Setup Frontend React

### Buat folder client baru (atau ganti isi folder client yang sudah ada)
```bash
# Hapus isi folder client lama dulu
cd Florence-connect/client
```

### Copy semua file dari ZIP ke folder client

### Install dependencies
```bash
npm install
```

### Jalankan React
```bash
npm run dev
# Buka: http://localhost:5173
```

---

## STEP 3 — Buat Akun Admin

Di HeidiSQL atau terminal MySQL, jalankan:
```sql
USE florence_connect;

-- Lihat dulu akun yang ada
SELECT id, nama_lengkap, nim, role FROM users;

-- Update user jadi admin (ganti id sesuai user kamu)
UPDATE users SET role = 'admin' WHERE nim = 'ADMIN001';
```

Atau insert admin baru langsung:
```sql
-- Password: admin123 (bcrypt hash)
INSERT INTO users (nama_lengkap, nim, password, role) VALUES
('Admin Florence', 'ADMIN001', '$2b$10$YourHashHere', 'admin');
```

Cara termudah — register dulu lewat web, lalu update role-nya di HeidiSQL:
```sql
UPDATE users SET role = 'admin' WHERE nim = 'nim_kamu';
```

---

## Halaman & URL

| URL | Halaman | Akses |
|-----|---------|-------|
| `/` | Beranda | Publik |
| `/register` | Daftar akun | Publik |
| `/login` | Login | Publik |
| `/dashboard` | Form pendaftaran | Login required |
| `/admin` | Admin panel | Admin only |

---

## Fitur yang Ada

### Frontend (React + Tailwind)
- ✅ Beranda dengan animasi dan responsive
- ✅ Register dengan validasi real-time
- ✅ Login dengan JWT
- ✅ Pilih 6 hari latihan (Senin-Sabtu)
- ✅ Pilih divisi dari database
- ✅ Status pendaftaran real-time
- ✅ Admin dashboard dengan chart
- ✅ Filter & search pendaftar
- ✅ Update status modal
- ✅ Responsive mobile & desktop
- ✅ Dark theme brown

### Backend (Node.js + MySQL)
- ✅ JWT Authentication
- ✅ Role-based access (member/admin)
- ✅ CORS configured untuk React
- ✅ Transaksi database
- ✅ Audit log admin
