import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { masterAPI, pendaftaranAPI } from '../api'
import toast from 'react-hot-toast'
import {
  LogOut, CheckCircle, Clock, Music, Calendar,
  Phone, Send, ChevronRight, User, Shield, Loader2, X, ArrowLeft
} from 'lucide-react'
import clsx from 'clsx'

const HARI_OPTIONS = [
  { id: 1, label: 'Senin',  short: 'Sen' },
  { id: 2, label: 'Selasa', short: 'Sel' },
  { id: 3, label: 'Rabu',   short: 'Rab' },
  { id: 4, label: 'Kamis',  short: 'Kam' },
  { id: 5, label: "Jum'at", short: 'Jum' },
  { id: 6, label: 'Sabtu',  short: 'Sab' },
]

// Map jadwal dari DB ke hari
const JADWAL_HARI_MAP = {
  'Senin – Rabu':   [1, 3],
  'Kamis – Sabtu':  [4, 6],
}

export default function Landing() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [jadwalList, setJadwalList]     = useState([])
  const [divisiList, setDivisiList]     = useState([])
  const [existingStatus, setExisting]   = useState(null)
  const [loadingData, setLoadingData]   = useState(true)

  const [selectedHari,   setSelectedHari]   = useState([])
  const [confirmedJadwal, setConfirmedJadwal] = useState(null)   // jadwal_id
  const [confirmedJadwalLabel, setConfirmedJadwalLabel] = useState('')
  const [selectedDivisi, setSelectedDivisi] = useState(null)     // divisi object
  const [confirmedDivisi, setConfirmedDivisi] = useState(null)
  const [noHp, setNoHp]                 = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [showSuccess, setShowSuccess]   = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [jRes, dRes] = await Promise.all([masterAPI.getJadwal(), masterAPI.getDivisi()])
      setJadwalList(jRes.data)
      setDivisiList(dRes.data)
      // check existing registration
      try {
        const sRes = await pendaftaranAPI.status()
        setExisting(sRes.data)
      } catch { /* belum daftar */ }
    } catch {
      toast.error('Gagal memuat data')
    } finally {
      setLoadingData(false)
    }
  }

  // Toggle hari — pilih max sesuai jadwal
  const toggleHari = (hariId) => {
    setSelectedHari(prev => {
      if (prev.includes(hariId)) return prev.filter(h => h !== hariId)
      return [...prev, hariId]
    })
    setConfirmedJadwal(null)
    setConfirmedJadwalLabel('')
  }

  const konfirmasiJadwal = () => {
    if (selectedHari.length === 0) { toast.error('Pilih minimal 1 hari'); return }
    // Find matching jadwal from DB
    let matched = null
    let matchedLabel = ''
    for (const [label, hariIds] of Object.entries(JADWAL_HARI_MAP)) {
      if (selectedHari.some(h => hariIds.includes(h))) {
        const jd = jadwalList.find(j => j.nama_jadwal === label)
        if (jd) { matched = jd.id; matchedLabel = jd.nama_jadwal }
      }
    }
    // Fallback: if no exact match, use first jadwal
    if (!matched && jadwalList.length > 0) {
      matched = jadwalList[0].id
      matchedLabel = jadwalList[0].nama_jadwal
    }
    setConfirmedJadwal(matched)
    setConfirmedJadwalLabel(matchedLabel || `Hari terpilih: ${selectedHari.map(h => HARI_OPTIONS.find(o=>o.id===h)?.label).join(', ')}`)
    toast.success('Jadwal dikonfirmasi!')
  }

  const konfirmasiDivisi = () => {
    if (!selectedDivisi) { toast.error('Pilih divisi terlebih dahulu'); return }
    setConfirmedDivisi(selectedDivisi)
    toast.success('Divisi dikonfirmasi!')
  }

  const handleSubmit = async () => {
    if (!confirmedJadwal)  { toast.error('Konfirmasi jadwal dulu'); return }
    if (!confirmedDivisi)  { toast.error('Konfirmasi divisi dulu'); return }
    if (!noHp || noHp.replace(/\D/g,'').length < 8) { toast.error('Masukkan nomor HP yang valid'); return }
    setSubmitting(true)
    try {
      await pendaftaranAPI.submit({
        jadwal_id: confirmedJadwal,
        divisi_id: confirmedDivisi.id,
        no_hp: noHp,
      })
      setShowSuccess(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim pendaftaran')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-brown-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-brown-500" />
          <p className="text-brown-400 text-sm">Memuat data...</p>
        </div>
      </div>
    )
  }

  // Already registered
  if (existingStatus) {
    return <StatusPage data={existingStatus} user={user} onLogout={handleLogout} navigate={navigate} />
  }

  return (
    <div className="min-h-screen bg-brown-950">

      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-brown-950/80 backdrop-blur-md border-b border-brown-800/50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brown-600 rounded-lg flex items-center justify-center text-base">𝄞</div>
            <span className="font-playfair font-bold text-white text-sm hidden sm:block">Florence Connect</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-brown-800/60 rounded-xl px-3 py-1.5 border border-brown-700/40">
              <User size={14} className="text-brown-400" />
              <span className="text-brown-200 text-sm font-medium hidden sm:block">{user?.nama_lengkap}</span>
            </div>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 bg-brown-700/60 border border-brown-600/40 text-brown-200 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brown-600/60 transition-colors">
                <Shield size={13}/> Admin
              </button>
            )}
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-brown-500 hover:text-red-400 text-xs transition-colors px-2 py-1.5">
              <LogOut size={14}/> <span className="hidden sm:block">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Welcome */}
        <div className="mb-8 animate-fade-up">
          <h1 className="font-playfair font-black text-3xl md:text-4xl text-white mb-1">
            Halo, {user?.nama_lengkap?.split(' ')[0]}! 👋
          </h1>
          <p className="text-brown-400">Lengkapi pendaftaran kamu untuk bergabung di Florence</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main form — left 2/3 */}
          <div className="lg:col-span-2 space-y-6">

            {/* STEP 1 — Jadwal */}
            <div className="card-brown p-6 animate-fade-up" style={{animationDelay:'.05s'}}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brown-600/30 border border-brown-500/30 flex items-center justify-center text-brown-300 font-bold text-sm">1</div>
                  <div>
                    <h2 className="font-semibold text-white text-base">Pilih Hari Latihan</h2>
                    <p className="text-brown-500 text-xs">Pilih hari yang sesuai jadwal kamu</p>
                  </div>
                </div>
                {confirmedJadwal && (
                  <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold bg-green-900/30 px-2.5 py-1 rounded-full border border-green-800/40">
                    <CheckCircle size={12}/> Terkonfirmasi
                  </div>
                )}
              </div>

              {/* 6 day buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                {HARI_OPTIONS.map(hari => (
                  <button
                    key={hari.id}
                    onClick={() => toggleHari(hari.id)}
                    className={clsx(
                      'flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all duration-200',
                      selectedHari.includes(hari.id)
                        ? 'bg-brown-600 border-brown-500 text-white shadow-lg shadow-brown-600/30 scale-105'
                        : 'bg-brown-800/40 border-brown-700/40 text-brown-400 hover:bg-brown-700/50 hover:text-brown-200 hover:border-brown-600/40'
                    )}
                  >
                    <span className="text-lg">{['☀️','🌤','⛅','🌥','🌙','🌟'][hari.id-1]}</span>
                    <span>{hari.label}</span>
                  </button>
                ))}
              </div>

              {selectedHari.length > 0 && (
                <p className="text-brown-400 text-xs mb-3">
                  Dipilih: <span className="text-brown-200 font-medium">{selectedHari.map(h => HARI_OPTIONS.find(o=>o.id===h)?.label).join(', ')}</span>
                </p>
              )}

              <button
                onClick={konfirmasiJadwal}
                disabled={selectedHari.length === 0}
                className={clsx('btn-primary w-full sm:w-auto px-6 py-2.5 text-sm flex items-center gap-2',
                  selectedHari.length === 0 && 'opacity-50 cursor-not-allowed hover:scale-100')}
              >
                <CheckCircle size={15}/> Konfirmasi Jadwal
              </button>
            </div>

            {/* STEP 2 — Divisi */}
            <div className="card-brown p-6 animate-fade-up" style={{animationDelay:'.1s'}}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brown-600/30 border border-brown-500/30 flex items-center justify-center text-brown-300 font-bold text-sm">2</div>
                  <div>
                    <h2 className="font-semibold text-white text-base">Pilih Divisi</h2>
                    <p className="text-brown-500 text-xs">Pilih satu divisi yang ingin kamu ikuti</p>
                  </div>
                </div>
                {confirmedDivisi && (
                  <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold bg-green-900/30 px-2.5 py-1 rounded-full border border-green-800/40">
                    <CheckCircle size={12}/> Terkonfirmasi
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {divisiList.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDivisi(d); setConfirmedDivisi(null) }}
                    className={clsx(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200',
                      selectedDivisi?.id === d.id
                        ? 'bg-brown-600/30 border-brown-500 text-white shadow-lg shadow-brown-600/20 scale-[1.02]'
                        : 'bg-brown-800/40 border-brown-700/40 text-brown-400 hover:bg-brown-700/40 hover:text-brown-200 hover:border-brown-600/40'
                    )}
                  >
                    <span className="text-3xl">{d.emoji}</span>
                    <span className="text-xs font-semibold text-center leading-tight">{d.nama_divisi}</span>
                    {selectedDivisi?.id === d.id && confirmedDivisi?.id === d.id && (
                      <CheckCircle size={14} className="text-green-400" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={konfirmasiDivisi}
                disabled={!selectedDivisi}
                className={clsx('btn-primary w-full sm:w-auto px-6 py-2.5 text-sm flex items-center gap-2',
                  !selectedDivisi && 'opacity-50 cursor-not-allowed hover:scale-100')}
              >
                <CheckCircle size={15}/> Konfirmasi Divisi
              </button>
            </div>

            {/* STEP 3 — No HP */}
            <div className="card-brown p-6 animate-fade-up" style={{animationDelay:'.15s'}}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg bg-brown-600/30 border border-brown-500/30 flex items-center justify-center text-brown-300 font-bold text-sm">3</div>
                <div>
                  <h2 className="font-semibold text-white text-base">Nomor HP / WhatsApp</h2>
                  <p className="text-brown-500 text-xs">Admin akan menghubungi kamu melalui nomor ini</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="bg-brown-700/60 border border-brown-600/40 rounded-xl px-4 py-3 text-brown-300 font-mono text-sm flex-shrink-0 flex items-center">
                  <Phone size={14} className="mr-2 text-brown-400"/><span>+62</span>
                </div>
                <input
                  type="tel"
                  className="input-field flex-1"
                  placeholder="8xx xxxx xxxx"
                  value={noHp}
                  onChange={e => setNoHp(e.target.value.replace(/[^0-9]/g,''))}
                  maxLength={13}
                />
              </div>
            </div>

          </div>

          {/* Right — Summary */}
          <div className="lg:col-span-1">
            <div className="card-brown p-5 sticky top-24 animate-fade-up" style={{animationDelay:'.2s'}}>
              <h3 className="font-playfair font-bold text-white text-lg mb-4">Status Pendaftaran</h3>

              <div className="space-y-3 mb-6">
                {/* Jadwal */}
                <div className={clsx('flex items-center gap-3 p-3 rounded-xl border text-sm transition-all',
                  confirmedJadwal
                    ? 'bg-green-900/20 border-green-800/40 text-green-300'
                    : 'bg-brown-800/40 border-brown-700/30 text-brown-500')}>
                  <Calendar size={16} className={confirmedJadwal ? 'text-green-400' : 'text-brown-600'}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brown-500 mb-0.5">Jadwal</p>
                    <p className="font-semibold truncate">
                      {confirmedJadwal
                        ? (confirmedJadwalLabel || `Hari: ${selectedHari.map(h=>HARI_OPTIONS.find(o=>o.id===h)?.label).join(', ')}`)
                        : 'Belum dipilih'}
                    </p>
                  </div>
                  {confirmedJadwal && <CheckCircle size={14} className="text-green-400 flex-shrink-0"/>}
                </div>

                {/* Divisi */}
                <div className={clsx('flex items-center gap-3 p-3 rounded-xl border text-sm transition-all',
                  confirmedDivisi
                    ? 'bg-green-900/20 border-green-800/40 text-green-300'
                    : 'bg-brown-800/40 border-brown-700/30 text-brown-500')}>
                  <Music size={16} className={confirmedDivisi ? 'text-green-400' : 'text-brown-600'}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brown-500 mb-0.5">Divisi</p>
                    <p className="font-semibold truncate">
                      {confirmedDivisi ? `${confirmedDivisi.emoji} ${confirmedDivisi.nama_divisi}` : 'Belum dipilih'}
                    </p>
                  </div>
                  {confirmedDivisi && <CheckCircle size={14} className="text-green-400 flex-shrink-0"/>}
                </div>

                {/* No HP */}
                <div className={clsx('flex items-center gap-3 p-3 rounded-xl border text-sm transition-all',
                  noHp.length >= 8
                    ? 'bg-green-900/20 border-green-800/40 text-green-300'
                    : 'bg-brown-800/40 border-brown-700/30 text-brown-500')}>
                  <Phone size={16} className={noHp.length >= 8 ? 'text-green-400' : 'text-brown-600'}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-brown-500 mb-0.5">Nomor HP</p>
                    <p className="font-semibold font-mono truncate">
                      {noHp ? `+62 ${noHp}` : 'Belum diisi'}
                    </p>
                  </div>
                  {noHp.length >= 8 && <CheckCircle size={14} className="text-green-400 flex-shrink-0"/>}
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-brown-500 mb-1.5">
                  <span>Progress</span>
                  <span>{[confirmedJadwal, confirmedDivisi, noHp.length>=8].filter(Boolean).length}/3 langkah</span>
                </div>
                <div className="h-2 bg-brown-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brown-600 to-brown-400 rounded-full transition-all duration-500"
                    style={{width: `${([confirmedJadwal,confirmedDivisi,noHp.length>=8].filter(Boolean).length/3)*100}%`}}
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !confirmedJadwal || !confirmedDivisi || noHp.length < 8}
                className={clsx('btn-primary w-full flex items-center justify-center gap-2 py-3',
                  (submitting || !confirmedJadwal || !confirmedDivisi || noHp.length < 8)
                    && 'opacity-50 cursor-not-allowed hover:scale-100')}
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin"/>Mengirim...</>
                  : <><Send size={15}/>Kirim Pendaftaran</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSuccess(false)}>
          <div className="bg-brown-900 border border-brown-700 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="w-20 h-20 bg-green-900/40 border border-green-700/40 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={40} className="text-green-400"/>
            </div>
            <h2 className="font-playfair font-bold text-2xl text-white mb-2">Terima Kasih!</h2>
            <p className="text-brown-300 text-sm leading-relaxed mb-6">
              Pendaftaran kamu telah diterima. Admin Florence akan menghubungi kamu di nomor <span className="text-white font-semibold">+62 {noHp}</span> untuk pemberitahuan lanjutan.
            </p>
            <div className="bg-brown-800/60 rounded-2xl p-4 text-left mb-6 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-brown-400">Divisi</span><span className="text-white font-medium">{confirmedDivisi?.emoji} {confirmedDivisi?.nama_divisi}</span></div>
              <div className="flex justify-between"><span className="text-brown-400">Jadwal</span><span className="text-white font-medium text-right max-w-[60%]">{confirmedJadwalLabel}</span></div>
            </div>
            <button
              onClick={() => { setShowSuccess(false); loadData() }}
              className="btn-primary w-full py-3"
            >
              Oke, Siap! 🎸
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusPage({ data, user, onLogout, navigate }) {
  const statusColor = {
    menunggu:     { bg:'bg-yellow-900/30', border:'border-yellow-700/40', text:'text-yellow-300', dot:'bg-yellow-400' },
    diterima:     { bg:'bg-green-900/30',  border:'border-green-700/40',  text:'text-green-300',  dot:'bg-green-400' },
    ditolak:      { bg:'bg-red-900/30',    border:'border-red-700/40',    text:'text-red-300',    dot:'bg-red-400'  },
    perlu_review: { bg:'bg-blue-900/30',   border:'border-blue-700/40',   text:'text-blue-300',   dot:'bg-blue-400' },
  }
  const sc = statusColor[data.status] || statusColor.menunggu
  const labelMap = { menunggu:'Menunggu Review', diterima:'Diterima 🎉', ditolak:'Tidak Diterima', perlu_review:'Perlu Review' }

  return (
    <div className="min-h-screen bg-brown-950 flex flex-col">
      <header className="sticky top-0 z-40 bg-brown-950/80 backdrop-blur-md border-b border-brown-800/50">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brown-600 rounded-lg flex items-center justify-center">𝄞</div>
            <span className="font-playfair font-bold text-white text-sm hidden sm:block">Florence Connect</span>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 bg-brown-700/60 border border-brown-600/40 text-brown-200 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-brown-600/60 transition-colors">
                <Shield size={13}/> Admin
              </button>
            )}
            <button onClick={onLogout} className="flex items-center gap-1.5 text-brown-500 hover:text-red-400 text-xs transition-colors px-2 py-1.5">
              <LogOut size={14}/> Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full animate-fade-up">
          <div className="card-brown p-8 text-center">
            <div className={clsx('w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border', sc.bg, sc.border)}>
              <span className="text-4xl">
                {data.status==='diterima' ? '🎉' : data.status==='ditolak' ? '😔' : data.status==='perlu_review' ? '🔍' : '⏳'}
              </span>
            </div>
            <h1 className="font-playfair font-bold text-2xl text-white mb-1">Status Pendaftaran</h1>
            <p className="text-brown-400 text-sm mb-6">Hai, {user?.nama_lengkap}</p>

            <div className={clsx('inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 border', sc.bg, sc.border, sc.text)}>
              <span className={clsx('w-2 h-2 rounded-full', sc.dot)} />
              {labelMap[data.status]}
            </div>

            <div className="bg-brown-800/40 rounded-2xl p-5 text-left space-y-3 mb-6">
              <InfoRow icon="📅" label="Jadwal"  value={data.nama_jadwal} />
              <InfoRow icon="🎸" label="Divisi"  value={`${data.emoji} ${data.nama_divisi}`} />
              <InfoRow icon="📱" label="No. HP"  value={`+62 ${data.no_hp}`} />
              <InfoRow icon="🕐" label="Daftar"  value={new Date(data.submitted_at).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})} />
              {data.catatan_admin && <InfoRow icon="💬" label="Catatan" value={data.catatan_admin} />}
            </div>

            {data.status === 'menunggu' && (
              <p className="text-brown-500 text-xs mb-4">Admin akan segera menghubungi kamu. Pantau nomor WhatsApp kamu ya!</p>
            )}
            <button
              onClick={() => navigate('/')}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-brown-800/60 hover:bg-brown-700/60 border border-brown-700/40 text-brown-300 hover:text-white rounded-xl py-3 text-sm font-medium transition-all"
            >
              <ArrowLeft size={15}/> Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-brown-500 text-xs">{label}</p>
        <p className="text-brown-200 text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
