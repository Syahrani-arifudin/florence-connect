import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'

import Beranda    from './pages/Beranda'
import Register   from './pages/Register'
import Login      from './pages/Login'
import Landing    from './pages/Landing'
import Admin      from './pages/Admin'
import AlurPendaftaran from './pages/AlurPendaftaran'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullLoader />
  if (!user)   return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  return children
}

function FullLoader() {
  return (
    <div className="min-h-screen bg-brown-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brown-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-brown-400 text-sm font-dm">Memuat...</p>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<Beranda />} />
      <Route path="/alur-pendaftaran" element={<AlurPendaftaran />} />
      <Route path="/register"  element={<Register />} />
      <Route path="/login"     element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute><Landing /></PrivateRoute>} />
      <Route path="/admin"     element={<AdminRoute><Admin /></AdminRoute>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  )
}


export default function App() {
  return (

    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#3d1f0a',
              color: '#f0d8c0',
              border: '1px solid #6b3310',
              borderRadius: '12px',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#4ade80', secondary: '#3d1f0a' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#3d1f0a' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
