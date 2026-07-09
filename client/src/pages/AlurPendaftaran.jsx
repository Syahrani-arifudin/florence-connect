import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  FileText, MessageCircle, Mic, Trophy, ArrowLeft, ArrowRight, Shield
} from 'lucide-react'

const STEPS = [
  {
    icon: <FileText size={26} />,
    title: 'Isi Formulir',
    desc: 'Lengkapi data diri, pilih hari latihan & divisi yang kamu minati, lalu kirim pendaftaran.',
  },
  {
    icon: <MessageCircle size={26} />,
    title: 'Menunggu Konfirmasi',
    desc: 'Admin Florence akan menghubungi kamu lewat WhatsApp untuk konfirmasi jadwal interview.',
  },
  {
    icon: <Mic size={26} />,
    title: 'Interview',
    desc: 'Datang sesuai jadwal yang disepakati untuk sesi interview/wawancara singkat bersama tim.',
  },
  {
    icon: <Trophy size={26} />,
    title: 'Hasil: Lolos / Tidak',
    desc: 'Hasil interview akan diinfokan melalui WhatsApp dan bisa dicek juga di halaman status kamu.',
  },
]

export default function AlurPendaftaran() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-brown-950">
      {/* Navbar sederhana */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-brown-800/50">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-brown-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={16} /> Kembali
        </button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brown-600 rounded-lg flex items-center justify-center text-base">𝄞</div>
          <span className="font-playfair font-bold text-white text-sm hidden sm:block">Florence Connect</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-14">

        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 bg-brown-800/60 border border-brown-600/40 rounded-full px-4 py-1.5 mb-5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-brown-300 font-medium">Info Pendaftaran</span>
          </div>
          <h1 className="font-playfair font-black text-3xl md:text-4xl text-white mb-3">
            Alur Pendaftaran Anggota
          </h1>
          <p className="text-brown-400 max-w-lg mx-auto leading-relaxed">
            Begini tahapan yang akan kamu lalui setelah mengirim formulir pendaftaran ke Florence.
          </p>
        </div>

        {/* Stepper */}
        <div className="relative">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-5 animate-fade-up" style={{ animationDelay: `${i * 0.08}s` }}>
              {/* Icon + connecting line */}
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-brown-600/30 border border-brown-500/40 flex items-center justify-center text-brown-200 flex-shrink-0">
                  {step.icon}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-[2.5rem] bg-brown-700/60 my-1" />
                )}
              </div>

              {/* Text */}
              <div className={`pb-10 ${i === STEPS.length - 1 ? 'pb-0' : ''}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-full bg-brown-700 text-brown-200 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <h2 className="font-playfair font-bold text-white text-lg">{step.title}</h2>
                </div>
                <p className="text-brown-400 text-sm leading-relaxed max-w-md">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Catatan tambahan */}
        <div className="card-brown p-5 mt-4 flex gap-3 items-start">
          <Shield size={18} className="text-brown-400 flex-shrink-0 mt-0.5" />
          <p className="text-brown-400 text-sm leading-relaxed">
            Pastikan nomor WhatsApp yang kamu daftarkan aktif ya, karena semua konfirmasi jadwal dan hasil interview akan dikirim lewat sana.
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/register')}
            className="btn-primary flex items-center gap-2 text-sm px-6 py-3"
          >
            {user ? 'Cek Status Pendaftaran' : 'Daftar Sekarang'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
