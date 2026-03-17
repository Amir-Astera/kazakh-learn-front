import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ModulePage from './pages/ModulePage'
import UnitPage from './pages/UnitPage'
import LessonPage from './pages/LessonPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RatingPage from './pages/RatingPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLevels from './pages/admin/AdminLevels'
import AdminModules from './pages/admin/AdminModules'
import AdminUnits from './pages/admin/AdminUnits'
import AdminLessons from './pages/admin/AdminLessons'
import AdminExercises from './pages/admin/AdminExercises'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading...</div>
  return token ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '100px' }}>Loading...</div>
  return !token ? <>{children}</> : <Navigate to="/" />
}

function App() {
  const { token } = useAuth()
  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <>
      {token && !isAdmin && <Navbar />}
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><ModulePage /></PrivateRoute>} />
        <Route path="/module/:moduleId" element={<PrivateRoute><ModulePage /></PrivateRoute>} />
        <Route path="/unit/:unitId" element={<PrivateRoute><UnitPage /></PrivateRoute>} />
        <Route path="/lesson/:lessonId" element={<PrivateRoute><LessonPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/rating" element={<PrivateRoute><RatingPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/levels" element={<PrivateRoute><AdminLevels /></PrivateRoute>} />
        <Route path="/admin/modules" element={<PrivateRoute><AdminModules /></PrivateRoute>} />
        <Route path="/admin/units" element={<PrivateRoute><AdminUnits /></PrivateRoute>} />
        <Route path="/admin/lessons" element={<PrivateRoute><AdminLessons /></PrivateRoute>} />
        <Route path="/admin/exercises" element={<PrivateRoute><AdminExercises /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
