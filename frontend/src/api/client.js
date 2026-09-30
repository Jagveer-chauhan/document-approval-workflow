import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export const ACCESS_TOKEN_KEY = 'document_workflow_access_token'
export const REFRESH_TOKEN_KEY = 'document_workflow_refresh_token'

export function getStoredAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setStoredTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getStoredAccessToken()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export async function loginUser(username, password) {
  const response = await apiClient.post('/api/auth/login/', {
    username,
    password,
  })
  return response.data
}

export async function logoutUser() {
  try {
    const response = await apiClient.post('/api/auth/logout/')
    return response.data
  } finally {
    clearStoredTokens()
  }
}

export async function fetchCurrentUser() {
  const response = await apiClient.get('/api/auth/me/')
  return response.data
}

export async function fetchSubmissions() {
  const response = await apiClient.get('/api/submissions/')
  return response.data
}

export async function uploadSubmission(formData) {
  const response = await apiClient.post('/api/submissions/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export async function reviewSubmission(submissionId, status) {
  const response = await apiClient.patch(`/api/submissions/${submissionId}/review/`, {
    status,
  })
  return response.data
}

export default apiClient
