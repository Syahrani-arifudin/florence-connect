import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Eye, EyeOff, User, Hash, Lock, ArrowLeft, Loader2 } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm]       = useState({ nama_lengkap: '', nim: '', password: '', confirm: '' })
  const [show, setShow]       = useState({ pass: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const validate = () => {
    const e = {}
    if (!form.nama_lengkap.trim()) e.nama_lengkap = 'Nama wajib diisi'
    if (!form.nim.trim())          e.nim           = 'NIM wajib diisi'
    if (form.password.length < 6)  e.password      = 'Password minimal 6 karakter'
    if (form.password !== form.confirm) e.confirm   = 'Password tidak cocok'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register(form.nama_lengkap, form.nim, form.password)
      toast.success('Akun berhasil dibuat! Silakan login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mendaftar')
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => { setForm(f => ({...f, [k]: e.target.value})); setErrors(er => ({...er, [k]: ''})) }

  return (
    <div className="min-h-screen bg-brown-950 flex">

      {/* Left panel — desktop */}
      <div className="hidden lg:flex w-[45%] relative flex-col items-center justify-center bg-gradient-to-br from-brown-900 via-brown-800 to-brown-700 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-[-20%] right-[-20%] w-[400px] h-[400px] rounded-full bg-brown-600/20 blur-[100px]" />
          <div className="absolute bottom-[-20%] left-[-20%] w-[350px] h-[350px] rounded-full bg-brown-900/50 blur-[80px]" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 bg-brown-600 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl">𝄞</div>
          <h2 className="font-playfair font-black text-4xl text-white mb-3">Bergabung</h2>
          <p className="text-brown-300 leading-relaxed mb-8">Buat akunmu dan mulai perjalanan musikmu bersama Florence Family.</p>
          <div className="grid grid-cols-3 gap-3">
            {['🎸','🎹','🥁','🎤','🎵','🎼'].map((e,i) => (
              <div key={i} className="bg-brown-800/50 border border-brown-700/40 rounded-2xl p-4 text-3xl flex items-center justify-center hover:scale-105 transition-transform">
                {e}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-brown-700/10 blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md animate-fade-up">
          {/* Back */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-brown-500 hover:text-brown-300 text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Kembali ke Beranda
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-brown-600 rounded-lg flex items-center justify-center text-sm lg:hidden">𝄞</div>
              <h1 className="font-playfair font-black text-3xl text-white">Buat Akun</h1>
            </div>
            <p className="text-brown-400 text-sm">Daftarkan diri kamu sebagai calon anggota Florence</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-brown-400 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-400" />
                <input
                  className={`input-field pl-10 ${errors.nama_lengkap ? 'border-red-500/60' : ''}`}
                  placeholder="Masukkan nama lengkap"
                  value={form.nama_lengkap}
                  onChange={set('nama_lengkap')}
                />
              </div>
              {errors.nama_lengkap && <p className="text-red-400 text-xs mt-1">{errors.nama_lengkap}</p>}
            </div>

            {/* NIM */}
            <div>
              <label className="block text-xs font-semibold text-brown-400 uppercase tracking-wider mb-1.5">NIM</label>
              <div className="relative">
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-400" />
                <input
                  className={`input-field pl-10 ${errors.nim ? 'border-red-500/60' : ''}`}
                  placeholder="Masukkan NIM"
                  value={form.nim}
                  onChange={set('nim')}
                />
              </div>
              {errors.nim && <p className="text-red-400 text-xs mt-1">{errors.nim}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-brown-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-400" />
                <input
                  type={show.pass ? 'text' : 'password'}
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500/60' : ''}`}
                  placeholder="Min. 6 karakter"
                  value={form.password}
                  onChange={set('password')}
                />
                <button type="button" onClick={() => setShow(s=>({...s,pass:!s.pass}))} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-600">
                  {show.pass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-semibold text-brown-400 uppercase tracking-wider mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-400" />
                <input
                  type={show.confirm ? 'text' : 'password'}
                  className={`input-field pl-10 pr-10 ${errors.confirm ? 'border-red-500/60' : ''}`}
                  placeholder="Ulangi password"
                  value={form.confirm}
                  onChange={set('confirm')}
                />
                <button type="button" onClick={() => setShow(s=>({...s,confirm:!s.confirm}))} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-600">
                  {show.confirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {errors.confirm && <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3.5 text-base">
              {loading ? <><Loader2 size={18} className="animate-spin"/> Membuat akun...</> : 'Buat Akun'}
            </button>
          </form>

          <p className="text-center text-brown-500 text-sm mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-brown-300 hover:text-white font-semibold transition-colors">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
