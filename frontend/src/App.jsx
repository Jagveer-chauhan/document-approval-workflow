import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import LoginPage from './components/LoginPage'
import SubmitterDashboard from './components/SubmitterDashboard'
import ReviewerDashboard from './components/ReviewerDashboard'
import './index.css'

function AppContent() {
  const { currentUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading-screen">
        <div className="spinner large"></div>
        <p className="app-loading-text">Loading application...</p>
      </div>
    )
  }

  if (!currentUser) {
    return <LoginPage />
  }

  if (currentUser.role === 'reviewer') {
    return <ReviewerDashboard />
  }

  return <SubmitterDashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
