import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginPage from '../components/LoginPage'

const mockLogin = vi.fn()
const mockClearError = vi.fn()

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    error: '',
    clearError: mockClearError,
  }),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form elements and demo quick-fill buttons', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()

    expect(screen.getByText('jagveer.chauhan')).toBeInTheDocument()
    expect(screen.getByText('rahul.chauhan')).toBeInTheDocument()
  })

  it('shows error message if username or password is missing on submit', async () => {
    render(<LoginPage />)

    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(
      await screen.findByText(/please enter both username and password/i)
    ).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('fills inputs when demo user button is clicked', () => {
    render(<LoginPage />)

    const submitterButton = screen.getByText('jagveer.chauhan').closest('button')
    fireEvent.click(submitterButton)

    const usernameInput = screen.getByLabelText(/username/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(usernameInput).toHaveValue('jagveer.chauhan')
    expect(passwordInput).toHaveValue('123456')
  })
})
