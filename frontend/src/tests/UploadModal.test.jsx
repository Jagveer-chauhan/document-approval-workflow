import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import UploadModal from '../components/UploadModal'

vi.mock('../api/client', () => ({
  uploadSubmission: vi.fn(),
}))

describe('UploadModal', () => {
  const mockOnClose = vi.fn()
  const mockOnUploadSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <UploadModal isOpen={false} onClose={mockOnClose} onUploadSuccess={mockOnUploadSuccess} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal elements when isOpen is true', () => {
    render(
      <UploadModal isOpen={true} onClose={mockOnClose} onUploadSuccess={mockOnUploadSuccess} />
    )

    expect(screen.getByRole('heading', { name: /upload document/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/document title/i)).toBeInTheDocument()
    expect(screen.getByText(/choose a file/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit for review/i })).toBeInTheDocument()
  })

  it('validates that title is required before submit', async () => {
    render(
      <UploadModal isOpen={true} onClose={mockOnClose} onUploadSuccess={mockOnUploadSuccess} />
    )

    fireEvent.click(screen.getByRole('button', { name: /submit for review/i }))

    expect(
      await screen.findByText(/please provide a document title/i)
    ).toBeInTheDocument()
  })

  it('validates that file is required if title is filled but file is missing', async () => {
    render(
      <UploadModal isOpen={true} onClose={mockOnClose} onUploadSuccess={mockOnUploadSuccess} />
    )

    const titleInput = screen.getByLabelText(/document title/i)
    fireEvent.change(titleInput, { target: { value: 'Annual Report' } })

    fireEvent.click(screen.getByRole('button', { name: /submit for review/i }))

    expect(
      await screen.findByText(/please select a document file to upload/i)
    ).toBeInTheDocument()
  })
})
