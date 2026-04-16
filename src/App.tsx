import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useLang } from './context/LanguageContext'
import Navbar from './components/Navbar'
import ModulePage from './pages/ModulePage'
import UnitPage from './pages/UnitPage'
import LessonPage from './pages/LessonPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import RatingPage from './pages/RatingPage'
import ChatPage from './pages/ChatPage'
import GoogleAuthSuccess from './pages/GoogleAuthSuccess'
import OnboardingPage from './pages/OnboardingPage'
import ReviewWordsPage from './pages/ReviewWordsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLevels from './pages/admin/AdminLevels'
import AdminModules from './pages/admin/AdminModules'
import AdminUnits from './pages/admin/AdminUnits'
import AdminLessons from './pages/admin/AdminLessons'
import AdminExercises from './pages/admin/AdminExercises'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading, user } = useAuth()
  const { t } = useLang()
  const location = useLocation()
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>{t('app.loading')}</div>
  if (!token) return <Navigate to="/login" />
  if (user && user.onboarding_completed === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { token, user, loading } = useAuth()
  const { t } = useLang()
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>{t('app.loading')}</div>
  if (!token) return <Navigate to="/login" />
  return user?.is_admin ? <>{children}</> : <Navigate to="/" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const { t } = useLang()
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>{t('app.loading')}</div>
  return !token ? <>{children}</> : <Navigate to="/" />
}

function App() {
  const { token, user } = useAuth()
  const { setLangChoice } = useLang()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const hideNavbar = isAdmin || location.pathname === '/onboarding'

  useEffect(() => {
    if (!user?.language_pair) return
    setLangChoice(user.language_pair === 'en-kz' ? 'en' : 'ru')
  }, [setLangChoice, user?.language_pair])

  return (
    <>
      {token && !hideNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><ModulePage /></PrivateRoute>} />
        <Route path="/module/:moduleId" element={<PrivateRoute><ModulePage /></PrivateRoute>} />
        <Route path="/unit/:unitId" element={<PrivateRoute><UnitPage /></PrivateRoute>} />
        <Route path="/lesson/:lessonId" element={<PrivateRoute><LessonPage /></PrivateRoute>} />
        <Route path="/onboarding" element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
        <Route path="/review-words" element={<PrivateRoute><ReviewWordsPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/rating" element={<PrivateRoute><RatingPage /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/levels" element={<AdminRoute><AdminLevels /></AdminRoute>} />
        <Route path="/admin/modules" element={<AdminRoute><AdminModules /></AdminRoute>} />
        <Route path="/admin/units" element={<AdminRoute><AdminUnits /></AdminRoute>} />
        <Route path="/admin/lessons" element={<AdminRoute><AdminLessons /></AdminRoute>} />
        <Route path="/admin/exercises" element={<AdminRoute><AdminExercises /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
