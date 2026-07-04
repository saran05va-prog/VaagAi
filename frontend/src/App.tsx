import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { Toaster } from 'sonner'
import { AuthModalProvider } from './contexts/AuthModalContext'
import { AuthProvider } from './contexts/AuthContext'

// Layout
import AppLayout from './components/AppLayout'

// Landing page
import Landing from './pages/Landing'

// Auth Modal (legacy fallback for guest visitors from older flows)
import AuthModal from './components/AuthModal'

// Auth (Supabase — Phase 1.5a)
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import AuthCallback from './pages/auth/AuthCallback'
import VerifyEmail from './pages/auth/VerifyEmail'
import ProtectedRoute from './components/ProtectedRoute'

// Main pages
import Recommendations from './pages/Recommendations'
import PlotDetails from './pages/PlotDetails'
import Market from './pages/Market'
import Weather from './pages/Weather'
import Settings from './pages/Settings'
import CropCalendar from './pages/CropCalendar'
import FarmCalendar from './pages/FarmCalendar'
import CropDoctor from './pages/CropDoctor'
import DiseaseHistory from './pages/DiseaseHistory'
import Assistant from './pages/Assistant'
import Economics from './pages/Economics'

// Farm 3D Page
import FarmPage from './components/farm3d/FarmPage'

// Main pages
function ProtectedLayout({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <AppLayout title={title} subtitle={subtitle}>
      {children}
    </AppLayout>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton />
      <AuthProvider>
      <AuthModalProvider>
      <AuthModal />
      <BrowserRouter>
        <Routes>
          {/* Public auth routes (Supabase — Phase 1.5a) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Landing page */}
          <Route path="/" element={<Landing />} />

          {/* Protected routes - 3D Farm is default after login */}
          <Route path="/dashboard" element={<Navigate to="/farm" replace />} />
          <Route path="/signin" element={<Navigate to="/login" replace />} />

          {/* 3D Farm - Main page for farmers */}
          <Route path="/farm" element={<ProtectedRoute><FarmPage /></ProtectedRoute>} />

          <Route path="/farms" element={<Navigate to="/recommendations" replace />} />
          <Route path="/recommendations" element={<ProtectedRoute><ProtectedLayout title="Crop Recommendations" subtitle="Season-aware crop guidance and weather outlook"><Recommendations /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/plot-details" element={<ProtectedRoute><ProtectedLayout title="Plot Details" subtitle="Detailed view of your 3D farm plots"><PlotDetails /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/market" element={<ProtectedRoute><ProtectedLayout title="Market Prices" subtitle="Live crop price trends across markets"><Market /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><ProtectedLayout title="Weather" subtitle="Real-time weather forecasts"><Weather /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><ProtectedLayout title="Settings" subtitle="Configure your SmartFarm AI environment"><Settings /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><ProtectedLayout title="Crop Calendar" subtitle="Daily tasks and stage guidance"><FarmCalendar /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/crop-doctor" element={<ProtectedRoute><ProtectedLayout title="Crop Doctor" subtitle="AI-powered plant disease detection"><CropDoctor /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/disease-history" element={<ProtectedRoute><ProtectedLayout title="Disease History" subtitle="Track your past diagnoses"><DiseaseHistory /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/assistant" element={<ProtectedRoute><ProtectedLayout title="VAAGAI Assistant" subtitle="AI-powered farming advisor"><Assistant /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/economics" element={<ProtectedRoute><ProtectedLayout title="Economics" subtitle="Calculate your crop profits and costs"><Economics /></ProtectedLayout></ProtectedRoute>} />
          <Route path="/crop-dashboard" element={<Navigate to="/calendar" replace />} />

          {/* Fallback to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </AuthModalProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
