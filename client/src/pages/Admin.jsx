import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { adminAPI, masterAPI } from '../api'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, Music, Calendar, LogOut,
  Search, Filter, ChevronDown, CheckCircle, XCircle,
  Clock, Eye, RefreshCw, Menu, X, Shield, Loader2,
  TrendingUp, ArrowLeft, MessageSquare, MessageCircle
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_MAP = {
  menunggu:     { label:'Menunggu',     color:'text-yellow-300', bg:'bg-yellow-900/30', border:'border-yellow-700/40', dot:'bg-yellow-400' },
  diterima:     { label:'Diterima',     color:'text-green-300',  bg:'bg-green-900/30',  border:'border-green-700/40',  dot:'bg-green-400'  },
  ditolak:      { label:'Ditolak',      color:'text-red-300',    bg:'bg-red-900/30',    border:'border-red-700/40',    dot:'bg-red-400'    },
  perlu_review: { label:'Perlu Review', color:'text-blue-300',   bg:'bg-blue-900/30',   border:'border-blue-700/40',   dot:'bg-blue-400'   },
}

// Template pesan WhatsApp otomatis, disesuaikan status pelamar
const WA_TEMPLATE = {
  menunggu: (p) =>
    `Halo ${p.nama_lengkap}, saya dari Admin Florence Connect. 👋\n\nTerima kasih sudah mendaftar di divisi ${p.nama_divisi} (${p.nama_jadwal}). Kami ingin mengonfirmasi jadwal interview kamu, apakah kamu tersedia dalam waktu dekat ini?`,
  perlu_review: (p) =>
    `Halo ${p.nama_lengkap}, saya dari Admin Florence Connect. 👋\n\nPendaftaran kamu di divisi ${p.nama_divisi} sedang kami review lebih lanjut. Kami akan menghubungi kamu kembali segera ya!`,
  diterima: (p) =>
    `Halo ${p.nama_lengkap}, selamat! 🎉\n\nKamu dinyatakan LOLOS bergabung dengan Florence di divisi ${p.nama_divisi} (${p.nama_jadwal}). Selamat bergabung bersama kami!`,
  ditolak: (p) =>
    `Halo ${p.nama_lengkap}, terima kasih sudah mengikuti proses seleksi Florence di divisi ${p.nama_divisi}.\n\nMohon maaf, saat ini kami belum bisa meloloskan kamu. Tetap semangat dan jangan patah semangat ya! 🙏`,
}

// Bangun link wa.me dari nomor HP + pesan otomatis sesuai status
function buildWaLink(p) {
  if (!p?.no_hp) return null
  const nomor = `62${p.no_hp.replace(/^0/, '')}`
  const pesan = (WA_TEMPLATE[p.status] || WA_TEMPLATE.menunggu)(p)
  return `https://wa.me/${nomor}?text=${encodeURIComponent(pesan)}`
}

const NAV_ITEMS = [
  { id:'dashboard', label:'Dashboard',    icon:<LayoutDashboard size={17}/> },
  { id:'pendaftar', label:'Pendaftar',    icon:<Users size={17}/> },
  { id:'divisi',    label:'Divisi',       icon:<Music size={17}/> },
  { id:'jadwal',    label:'Jadwal',       icon:<Calendar size={17}/> },
]

export default function Admin() {
  const navigate  = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab]   = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats]           = useState(null)
  const [pendaftar, setPendaftar]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDivisi, setFilterDivisi] = useState('')
  const [modalData, setModalData]   = useState(null)
  const [modalStatus, setModalStatus] = useState('')
  const [modalCatatan, setModalCatatan] = useState('')
  const [saving, setSaving]         = useState(false)
  const [divisiOptions, setDivisiOptions] = useState([])   // master divisi (id, nama, emoji) buat filter

  useEffect(() => {
    masterAPI.getDivisi().then(res => setDivisiOptions(res.data)).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, pRes] = await Promise.all([
        adminAPI.dashboard(),
        adminAPI.getPendaftar({ status: filterStatus || undefined, divisi_id: filterDivisi || undefined }),
      ])
      setStats(sRes.data)
      setPendaftar(pRes.data)
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Akses ditolak — hanya admin')
        navigate('/')
      } else {
        toast.error('Gagal memuat data')
      }
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterDivisi])

  useEffect(() => { load() }, [load])

  const filtered = pendaftar.filter(p => {
    const q = search.toLowerCase()
    return !q || p.nama_lengkap.toLowerCase().includes(q) || p.nim.includes(q)
  })

  const openModal = (p) => {
    setModalData(p)
    setModalStatus(p.status)
    setModalCatatan(p.catatan_admin || '')
  }

  const saveStatus = async () => {
    if (!modalData) return
    setSaving(true)
    try {
      await adminAPI.updateStatus(modalData.pendaftaran_id || modalData.user_id, { status: modalStatus, catatan: modalCatatan })
      toast.success('Status berhasil diperbarui!')
      // Buka WhatsApp otomatis dengan pesan sesuai status terbaru
      const waLink = buildWaLink({ ...modalData, status: modalStatus })
      if (waLink) window.open(waLink, '_blank')
      setModalData(null)
      await load()
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="min-h-screen bg-brown-950 flex">

      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full z-50 w-60 bg-brown-900 border-r border-brown-800 flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0 lg:static lg:z-auto'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-brown-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brown-600 rounded-lg flex items-center justify-center text-sm">𝄞</div>
            <div>
              <p className="font-playfair font-bold text-white text-sm leading-none">Florence</p>
              <p className="text-brown-500 text-[10px] uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-brown-500 hover:text-white">
            <X size={18}/>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          <p className="text-brown-600 text-[10px] uppercase tracking-widest font-bold px-3 py-2">Menu Utama</p>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
              className={clsx('nav-link w-full', activeTab === item.id && 'active')}
            >
              {item.icon}
              {item.label}
              {item.id === 'pendaftar' && stats && (
                <span className="ml-auto bg-brown-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {stats.summary?.menunggu || 0}
                </span>
              )}
            </button>
          ))}
          <div className="pt-4">
            <p className="text-brown-600 text-[10px] uppercase tracking-widest font-bold px-3 py-2">Aksi</p>
            <button onClick={() => navigate('/dashboard')} className="nav-link w-full">
              <ArrowLeft size={17}/> Ke Halaman User
            </button>
          </div>
        </nav>

        {/* Profile */}
        <div className="p-3 border-t border-brown-800">
          <div className="flex items-center gap-3 bg-brown-800/50 rounded-xl p-3">
            <div className="w-8 h-8 bg-brown-600 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.nama_lengkap?.[0] || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.nama_lengkap}</p>
              <p className="text-brown-500 text-[10px] flex items-center gap-1"><Shield size={9}/> Administrator</p>
            </div>
            <button onClick={handleLogout} className="text-brown-500 hover:text-red-400 transition-colors">
              <LogOut size={15}/>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-brown-950/90 backdrop-blur-md border-b border-brown-800/60 flex items-center gap-4 px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-brown-400 hover:text-white">
            <Menu size={20}/>
          </button>
          <h1 className="font-playfair font-bold text-white text-lg">
            {NAV_ITEMS.find(n=>n.id===activeTab)?.label || 'Dashboard'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={load} className="flex items-center gap-1.5 btn-ghost text-xs py-1.5 px-3">
              <RefreshCw size={13} className={loading ? 'animate-spin':''}/> Refresh
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-auto">

          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={30} className="animate-spin text-brown-500"/>
            </div>
          )}

          {!loading && activeTab === 'dashboard' && stats && (
            <DashboardTab stats={stats} onNavigate={setActiveTab} />
          )}

          {!loading && activeTab === 'pendaftar' && (
            <PendaftarTab
              data={filtered}
              search={search} setSearch={setSearch}
              filterStatus={filterStatus} setFilterStatus={setFilterStatus}
              filterDivisi={filterDivisi} setFilterDivisi={setFilterDivisi}
              onEdit={openModal}
              divisiList={divisiOptions}
            />
          )}

          {!loading && activeTab === 'divisi' && stats && (
            <DivisiTab data={stats.byDivisi || []} />
          )}

          {!loading && activeTab === 'jadwal' && stats && (
            <JadwalTab data={stats.byJadwal || []} />
          )}

        </main>
      </div>

      {/* Modal */}
      {modalData && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setModalData(null)}>
          <div className="bg-brown-900 border border-brown-700 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-bounce-in" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-playfair font-bold text-white text-lg">Update Status</h2>
              <button onClick={() => setModalData(null)} className="text-brown-500 hover:text-white"><X size={18}/></button>
            </div>

            <div className="bg-brown-800/50 rounded-2xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-brown-400">Nama</span><span className="text-white font-medium">{modalData.nama_lengkap}</span></div>
              <div className="flex justify-between"><span className="text-brown-400">NIM</span><span className="text-brown-200 font-mono">{modalData.nim}</span></div>
              <div className="flex justify-between"><span className="text-brown-400">Divisi</span><span className="text-white">{modalData.emoji} {modalData.nama_divisi}</span></div>
              <div className="flex justify-between"><span className="text-brown-400">Jadwal</span><span className="text-brown-200">{modalData.nama_jadwal}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-brown-400">Video</span>
                {modalData.video_url ? (
                  <a href={modalData.video_url} target="_blank" rel="noopener noreferrer"
                     className="text-brown-200 hover:text-white underline underline-offset-2 flex items-center gap-1">
                    <Eye size={13}/> Tonton
                  </a>
                ) : (
                  <span className="text-brown-600 text-xs">Tidak ada</span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 mb-5 bg-green-900/20 border border-green-800/30 rounded-xl px-3 py-2.5">
              <MessageCircle size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-300/90 text-xs leading-relaxed">
                WhatsApp akan terbuka otomatis dengan pesan sesuai status yang kamu pilih, begitu kamu tekan <span className="font-semibold">Simpan</span>.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-brown-400 uppercase tracking-wider mb-2">Ubah Status</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_MAP).map(([val, cfg]) => (
                  <button
                    key={val}
                    onClick={() => setModalStatus(val)}
                    className={clsx('flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all',
                      modalStatus === val
                        ? clsx(cfg.bg, cfg.border, cfg.color)
                        : 'bg-brown-800/40 border-brown-700/40 text-brown-400 hover:border-brown-600/40')}
                  >
                    <span className={clsx('w-2 h-2 rounded-full', cfg.dot)}/>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-brown-400 uppercase tracking-wider mb-2">
                <MessageSquare size={11} className="inline mr-1"/>Catatan Admin
              </label>
              <textarea
                className="w-full bg-brown-950 border border-brown-700 rounded-xl px-4 py-3 text-brown-200 text-sm resize-none outline-none focus:border-brown-500 transition-colors"
                rows={3}
                placeholder="Tulis catatan untuk pelamar (opsional)..."
                value={modalCatatan}
                onChange={e => setModalCatatan(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModalData(null)} className="btn-secondary flex-1 py-2.5 text-sm">Batal</button>
              <button onClick={saveStatus} disabled={saving} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={15} className="animate-spin"/>Menyimpan...</> : <><CheckCircle size={15}/>Simpan & Kirim WA</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──────────────────────

function DashboardTab({ stats, onNavigate }) {
  const cards = [
    { label:'Total Pendaftar', value: stats.summary?.total_pendaftar || 0, icon:'👥', color:'from-brown-700 to-brown-800', change:'+'+( stats.summary?.total_pendaftar||0) },
    { label:'Menunggu Review', value: stats.summary?.menunggu || 0,         icon:'⏳', color:'from-yellow-900 to-brown-900', change:'Perlu aksi' },
    { label:'Diterima',        value: stats.summary?.diterima || 0,         icon:'✅', color:'from-green-900 to-brown-900',  change:'Berhasil' },
    { label:'Ditolak',         value: stats.summary?.ditolak || 0,          icon:'❌', color:'from-red-900 to-brown-900',    change:'Tidak lolos' },
  ]

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c,i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} border border-brown-700/40 p-5 hover:scale-[1.02] transition-transform cursor-default`}>
            <div className="absolute top-3 right-3 text-2xl opacity-60">{c.icon}</div>
            <p className="text-brown-400 text-xs font-medium mb-1">{c.label}</p>
            <p className="font-playfair font-black text-3xl text-white mb-1">{c.value}</p>
            <p className="text-brown-500 text-xs">{c.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar chart divisi */}
        <div className="card-brown p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Music size={16} className="text-brown-400"/> Pendaftar per Divisi</h3>
          <div className="space-y-3">
            {(stats.byDivisi || []).map((d,i) => {
              const max = Math.max(...(stats.byDivisi||[]).map(x=>x.jumlah), 1)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base w-6">{d.emoji}</span>
                  <span className="text-brown-300 text-xs w-28 truncate">{d.nama_divisi}</span>
                  <div className="flex-1 h-2 bg-brown-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-brown-600 to-brown-400 rounded-full transition-all duration-700"
                      style={{width:`${(d.jumlah/max)*100}%`}}/>
                  </div>
                  <span className="text-brown-400 text-xs font-mono w-5 text-right">{d.jumlah}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Jadwal */}
        <div className="card-brown p-5">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Calendar size={16} className="text-brown-400"/> Sebaran Jadwal</h3>
          <div className="space-y-3">
            {(stats.byJadwal || []).map((j,i) => {
              const total = (stats.byJadwal||[]).reduce((s,x)=>s+x.jumlah,0) || 1
              const pct   = Math.round((j.jumlah/total)*100)
              return (
                <div key={i} className="bg-brown-800/40 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-brown-200 text-sm font-medium">{j.nama_jadwal}</span>
                    <span className="text-brown-400 text-sm font-mono">{j.jumlah} orang</span>
                  </div>
                  <div className="h-2 bg-brown-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brown-500 rounded-full" style={{width:`${pct}%`}}/>
                  </div>
                  <p className="text-brown-500 text-xs mt-1">{pct}% dari total</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card-brown p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2"><TrendingUp size={16} className="text-brown-400"/> Aksi Cepat</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:'Lihat Semua Pendaftar', icon:'👥', tab:'pendaftar', color:'bg-brown-700/40' },
            { label:'Filter Menunggu',        icon:'⏳', tab:'pendaftar', color:'bg-yellow-900/30' },
            { label:'Data Divisi',            icon:'🎸', tab:'divisi',    color:'bg-brown-700/40' },
            { label:'Data Jadwal',            icon:'📅', tab:'jadwal',    color:'bg-brown-700/40' },
          ].map((a,i) => (
            <button key={i} onClick={() => onNavigate(a.tab)}
              className={`${a.color} border border-brown-700/40 rounded-xl p-4 text-left hover:scale-[1.02] transition-all`}>
              <span className="text-2xl block mb-2">{a.icon}</span>
              <span className="text-brown-200 text-xs font-medium leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PendaftarTab({ data, search, setSearch, filterStatus, setFilterStatus, filterDivisi, setFilterDivisi, onEdit, divisiList }) {
  return (
    <div className="space-y-4 animate-fade-up">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-500"/>
          <input className="input-field pl-9 py-2.5 text-sm" placeholder="Cari nama atau NIM..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="input-field w-auto py-2.5 text-sm bg-brown-800 text-brown-200" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
          <option value="">Semua Status</option>
          {Object.entries(STATUS_MAP).map(([v,c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select className="input-field w-auto py-2.5 text-sm bg-brown-800 text-brown-200" value={filterDivisi} onChange={e=>setFilterDivisi(e.target.value)}>
          <option value="">Semua Divisi</option>
          {divisiList.map(d => <option key={d.id} value={d.id}>{d.emoji} {d.nama_divisi}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card-brown overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brown-800">
                {['#','Nama & NIM','No. HP','Divisi','Jadwal','Status','Aksi'].map(h => (
                  <th key={h} className="text-left text-[11px] font-bold text-brown-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-brown-600 py-12 text-sm">Tidak ada data ditemukan</td></tr>
              ) : data.map((p,i) => {
                const sc = STATUS_MAP[p.status] || STATUS_MAP.menunggu
                return (
                  <tr key={p.user_id} className="border-b border-brown-800/60 hover:bg-brown-800/30 transition-colors">
                    <td className="px-4 py-3 text-brown-600 text-xs font-mono">{i+1}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-semibold text-sm">{p.nama_lengkap}</p>
                      <p className="text-brown-500 text-xs font-mono">{p.nim}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a
                        href={buildWaLink(p)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-brown-300 hover:text-green-400 text-xs font-mono transition-colors group"
                        title="Chat via WhatsApp"
                      >
                        <MessageCircle size={13} className="text-green-500/70 group-hover:text-green-400" />
                        +62{p.no_hp?.replace(/^0/,'')}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 bg-brown-800 border border-brown-700/40 px-2.5 py-1 rounded-lg text-xs text-brown-200 whitespace-nowrap">
                        {p.emoji} {p.nama_divisi}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brown-400 text-xs whitespace-nowrap">{p.nama_jadwal}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap', sc.bg, sc.border, sc.color)}>
                        <span className={clsx('w-1.5 h-1.5 rounded-full', sc.dot)}/>{sc.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => onEdit(p)} className="flex items-center gap-1.5 bg-brown-700/60 hover:bg-brown-600/60 border border-brown-600/40 text-brown-200 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                        <Eye size={12}/> Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-brown-800 text-brown-600 text-xs">
          {data.length} pendaftar ditemukan
        </div>
      </div>
    </div>
  )
}

function DivisiTab({ data }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-fade-up">
      {data.map((d,i) => (
        <div key={i} className="card-brown p-6 flex flex-col items-center text-center hover:scale-[1.02] transition-transform">
          <span className="text-5xl mb-3">{d.emoji}</span>
          <p className="font-playfair font-bold text-white text-xl mb-1">{d.jumlah}</p>
          <p className="text-brown-400 text-sm">{d.nama_divisi}</p>
          <p className="text-brown-600 text-xs mt-1">pendaftar</p>
        </div>
      ))}
    </div>
  )
}

function JadwalTab({ data }) {
  const total = data.reduce((s,j)=>s+j.jumlah,0) || 1
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-up">
      {data.map((j,i) => (
        <div key={i} className="card-brown p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-playfair font-bold text-white text-2xl">{j.jumlah}</p>
              <p className="text-brown-400 text-sm">{j.nama_jadwal}</p>
            </div>
            <span className="text-4xl">📅</span>
          </div>
          <div className="h-3 bg-brown-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brown-600 to-brown-400 rounded-full"
              style={{width:`${(j.jumlah/total)*100}%`}}/>
          </div>
          <p className="text-brown-500 text-xs mt-2">{Math.round((j.jumlah/total)*100)}% dari total pendaftar</p>
        </div>
      ))}
    </div>
  )
}