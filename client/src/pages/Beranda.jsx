import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Music, Users, Calendar, ChevronRight, Shield } from 'lucide-react'

const INSTRUMENTS = ['🎸','🎹','🥁','🎤','🎵','🎼']

export default function Beranda() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-brown-950 relative overflow-hidden">

      {/* Background decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brown-700/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-brown-800/30 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brown-600/5 blur-[150px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brown-600 rounded-xl flex items-center justify-center text-lg shadow-lg">
            𝄞
          </div>
          <span className="font-playfair font-bold text-white tracking-wide">FLORENCE</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/alur-pendaftaran')} className="btn-ghost text-sm hidden sm:block">
            Alur Pendaftaran
          </button>
          {user ? (
            <>
              <button onClick={() => navigate('/dashboard')} className="btn-ghost text-sm">
                Dashboard
              </button>
              {user.role === 'admin' && (
                <button onClick={() => navigate('/admin')} className="btn-primary text-sm py-2 px-4">
                  Admin Panel
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')}    className="btn-ghost text-sm">Masuk</button>
              <button onClick={() => navigate('/register')} className="btn-primary text-sm py-2 px-4">Daftar</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-24 md:pt-24">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brown-800/60 border border-brown-600/40 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-brown-300 font-medium">Pendaftaran Anggota Dibuka</span>
        </div>

        {/* Logo */}
        <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-brown-700 to-brown-900 rounded-3xl flex items-center justify-center text-5xl md:text-6xl shadow-2xl glow-brown mb-8 animate-bounce-in border border-brown-600/30">
          𝄞
        </div>

        {/* Title */}
        <h1 className="font-playfair font-black text-5xl md:text-7xl text-white mb-3 animate-fade-up" style={{animationDelay:'.1s'}}>
          FLORENCE
        </h1>
        <p className="text-brown-400 tracking-[6px] text-xs md:text-sm uppercase font-semibold mb-6 animate-fade-up" style={{animationDelay:'.15s'}}>
          Connect
        </p>
        <p className="text-brown-300 max-w-md text-base md:text-lg leading-relaxed mb-10 animate-fade-up" style={{animationDelay:'.2s'}}>
          Jadilah bagian dari keluarga Florence — komunitas musik kampus yang penuh semangat, kreativitas, dan harmoni.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-up" style={{animationDelay:'.25s'}}>
          <button
            onClick={() => navigate(user ? '/dashboard' : '/register')}
            className="btn-primary flex items-center gap-2 text-base px-8 py-3.5"
          >
            {user ? 'Buka Dashboard' : 'Daftar Sekarang'}
            <ChevronRight size={18} />
          </button>
          {!user && (
            <button onClick={() => navigate('/login')} className="btn-secondary text-base px-8 py-3.5">
              Sudah Punya Akun
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/alur-pendaftaran')}
          className="mt-5 text-brown-500 hover:text-brown-300 text-xs underline underline-offset-4 transition-colors animate-fade-up"
          style={{animationDelay:'.3s'}}
        >
          Lihat alur pendaftarannya dulu →
        </button>

        {/* Floating instruments */}
        <div className="flex gap-3 mt-14 animate-fade-up" style={{animationDelay:'.35s'}}>
          {INSTRUMENTS.map((e,i) => (
            <div
              key={i}
              className="w-12 h-12 md:w-14 md:h-14 bg-brown-800/60 border border-brown-700/50 rounded-2xl flex items-center justify-center text-xl md:text-2xl hover:scale-110 hover:bg-brown-700/60 transition-all duration-300 cursor-default"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {e}
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg w-full animate-fade-up" style={{animationDelay:'.4s'}}>
          {[
            { icon: <Users size={20}/>,    label: 'Divisi', value: '6+' },
            { icon: <Music size={20}/>,    label: 'Tahun Berdiri', value: '2018' },
            { icon: <Calendar size={20}/>, label: 'Event / Tahun', value: '12+' },
          ].map((s,i) => (
            <div key={i} className="card-brown p-4 flex flex-col items-center gap-1">
              <div className="text-brown-400">{s.icon}</div>
              <div className="font-playfair font-bold text-2xl text-white">{s.value}</div>
              <div className="text-brown-500 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Admin shortcut */}
        <button
          onClick={() => navigate('/admin')}
          className="mt-8 flex items-center gap-2 text-brown-600 hover:text-brown-400 text-xs transition-colors animate-fade-up"
          style={{animationDelay:'.45s'}}
        >
          <Shield size={13} /> Masuk sebagai Admin
        </button>
      </main>
    </div>
  )
}
