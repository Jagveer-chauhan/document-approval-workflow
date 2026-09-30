import { useState } from 'react'
import { useAuth } from '../context/useAuth'

export default function LoginPage() {
  const { login, error, clearError } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localError, setLocalError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLocalError('')

    if (!username.trim() || !password) {
      setLocalError('Please enter both username and password.')
      return
    }

    setIsSubmitting(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setLocalError(err.message || 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleDemoFill(demoUsername) {
    setUsername(demoUsername)
    setPassword('123456')
    setLocalError('')
    clearError()
  }

  const activeError = localError || error

  return (
    <div className="login-page-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Log in</h1>
          <p className="login-subtitle">to start managing documents</p>
        </div>

        {activeError && (
          <div className="error-alert" role="alert">
            <svg
              className="alert-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="18"
              height="18"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            <span>{activeError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <div className="input-wrapper">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  if (activeError) setLocalError('')
                }}
                placeholder="e.g. jagveer.chauhan"
                className="form-input"
                autoComplete="username"
                disabled={isSubmitting}
              />
              {username.trim().length > 0 && (
                <span className="input-valid-indicator" aria-hidden="true">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    width="18"
                    height="18"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (activeError) setLocalError('')
                }}
                placeholder="••••••••••••"
                className="form-input"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="button-loading-content">
                <span className="spinner"></span>
                <span>Logging in...</span>
              </span>
            ) : (
              <span className="button-text-content">
                <span>Log in</span>
                <span className="button-arrow">→</span>
              </span>
            )}
          </button>
        </form>

        <div className="demo-credentials-card">
          <p className="demo-credentials-title">Demo User Quick Fill</p>
          <div className="demo-buttons-group">
            <button
              type="button"
              className="demo-chip-button"
              onClick={() => handleDemoFill('jagveer.chauhan')}
            >
              <span className="demo-role-badge submitter">Submitter</span>
              <span className="demo-username">jagveer.chauhan</span>
            </button>
            <button
              type="button"
              className="demo-chip-button"
              onClick={() => handleDemoFill('rahul.chauhan')}
            >
              <span className="demo-role-badge reviewer">Reviewer</span>
              <span className="demo-username">rahul.chauhan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
