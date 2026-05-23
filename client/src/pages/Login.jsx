import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Hash, Lock, ArrowLeft, Loader2, Shield } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm]       = useState({ nim: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [errors, setErrors]     = useState({})

  const validate = () => {
    const e = {}
    if (!form.nim.trim())      e.nim      = 'NIM wajib diisi'
    if (!form.password.trim()) e.password = 'Password wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = await login(form.nim, form.password)
      toast.success(`Selamat datang, ${data.user.nama_lengkap}! 🎸`)
      if (data.user.role === 'admin') navigate('/admin')
      else navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'NIM atau password salah')
      setErrors({ nim: ' ', password: ' ' })
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:''})) }

  return (
    <div className="min-h-screen bg-brown-950 flex">

      {/* Left panel — desktop */}
      <div className="hidden lg:flex w-[45%] relative flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brown-900 via-brown-800 to-brown-700">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-brown-500/20 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-brown-900/60 blur-[80px]" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-20 h-20 bg-brown-600 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-6 shadow-2xl glow-brown">𝄞</div>
          <h2 className="font-playfair font-black text-4xl text-white mb-3">Selamat Datang</h2>
          <p className="text-brown-300 leading-relaxed mb-6">Masuk dan lanjutkan perjalanan musikmu bersama Florence.</p>
          <div className="bg-brown-800/40 border border-brown-700/40 rounded-2xl p-5 text-left">
            <p className="text-brown-400 text-xs font-semibold uppercase tracking-wider mb-3">Divisi Tersedia</p>
            {['🎸 Gitar','🎹 Piano','🥁 Drum','🎵 Bass','🎤 Vokal','🎼 Manajemen Band'].map((d,i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 text-sm text-brown-200">{d}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 relative">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-brown-700/10 blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md animate-fade-up">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-brown-500 hover:text-brown-300 text-sm mb-8 transition-colors">
            <ArrowLeft size={16} /> Kembali ke Beranda
          </button>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-brown-600 rounded-lg flex items-center justify-center text-sm lg:hidden">𝄞</div>
              <h1 className="font-playfair font-black text-3xl text-white">Login</h1>
            </div>
            <p className="text-brown-400 text-sm">Masuk ke akun Florence Connect kamu</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brown-400 uppercase tracking-wider mb-1.5">NIM</label>
              <div className="relative">
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-400" />
                <input
                  className={`input-field pl-10 ${errors.nim ? 'border-red-500/60' : ''}`}
                  placeholder="Masukkan NIM"
                  value={form.nim}
                  onChange={set('nim')}
                  autoComplete="username"
                />
              </div>
              {errors.nim && errors.nim.trim() && <p className="text-red-400 text-xs mt-1">{errors.nim}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-brown-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brown-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500/60' : ''}`}
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(s=>!s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brown-400 hover:text-brown-600">
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2 py-3.5 text-base">
              {loading ? <><Loader2 size={18} className="animate-spin"/> Masuk...</> : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-brown-500 text-sm mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-brown-300 hover:text-white font-semibold transition-colors">Daftar sekarang</Link>
          </p>

          <div className="mt-6 pt-6 border-t border-brown-800">
            <button onClick={() => navigate('/admin')} className="w-full flex items-center justify-center gap-2 text-brown-600 hover:text-brown-400 text-xs transition-colors py-2">
              <Shield size={13}/> Login sebagai Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
