import { useEffect, useState } from 'react'
import {
  clearStoredTokens,
  fetchCurrentUser,
  getStoredAccessToken,
  loginUser,
  logoutUser,
  setStoredTokens,
} from '../api/client'
import { AuthContext } from './authContextInstance'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function checkAuthStatus() {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        const userData = await fetchCurrentUser()
        setCurrentUser(userData)
      } catch {
        clearStoredTokens()
        setCurrentUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  async function login(username, password) {
    setError(null)
    try {
      const authData = await loginUser(username, password)
      setStoredTokens(authData.access, authData.refresh)
      setCurrentUser(authData)
      return authData
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || 'Unable to log in. Please check your credentials.'
      setError(errorMessage)
      throw new Error(errorMessage, { cause: err })
    }
  }

  async function logout() {
    try {
      await logoutUser()
    } finally {
      clearStoredTokens()
      setCurrentUser(null)
      setError(null)
    }
  }

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    clearError: () => setError(null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
