import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReviewerDashboard from '../components/ReviewerDashboard'
import * as api from '../api/client'

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    currentUser: {
      username: 'rahul.chauhan',
      name: 'Rahul Chauhan',
      role: 'reviewer',
    },
    logout: vi.fn(),
  }),
}))

vi.mock('../api/client', () => ({
  fetchSubmissions: vi.fn(),
  reviewSubmission: vi.fn(),
}))

const mockSubmissions = [
  {
    id: 1,
    title: 'Financial Audit Report',
    description: 'Quarterly review document',
    file: '/media/submissions/audit.pdf',
    file_name: 'audit.pdf',
    submitted_by: 'jagveer.chauhan',
    submitted_by_name: 'Jagveer Chauhan',
    status: 'pending',
    created_at: '2026-03-30T10:00:00Z',
    reviewed_by: null,
    reviewed_at: null,
  },
  {
    id: 2,
    title: 'Offer Letter',
    description: 'Candidate offer',
    file: '/media/submissions/offer.pdf',
    file_name: 'offer.pdf',
    submitted_by: 'jagveer.chauhan',
    submitted_by_name: 'Jagveer Chauhan',
    status: 'approved',
    created_at: '2026-03-29T10:00:00Z',
    reviewed_by: 'rahul.chauhan',
    reviewed_at: '2026-03-29T12:00:00Z',
  },
]

describe('ReviewerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders submissions list after loading', async () => {
    api.fetchSubmissions.mockResolvedValueOnce(mockSubmissions)

    render(<ReviewerDashboard />)

    expect(await screen.findByText('Financial Audit Report')).toBeInTheDocument()
    expect(screen.getByText('Offer Letter')).toBeInTheDocument()
  })

  it('allows approving a pending submission', async () => {
    api.fetchSubmissions.mockResolvedValueOnce(mockSubmissions)
    api.reviewSubmission.mockResolvedValueOnce({
      ...mockSubmissions[0],
      status: 'approved',
      reviewed_by: 'rahul.chauhan',
    })

    render(<ReviewerDashboard />)

    const approveButton = await screen.findByRole('button', { name: /^approve$/i })
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(api.reviewSubmission).toHaveBeenCalledWith(1, 'approved')
    })
  })

  it('filters submissions when filter tabs are clicked', async () => {
    api.fetchSubmissions.mockResolvedValueOnce(mockSubmissions)

    render(<ReviewerDashboard />)

    await screen.findByText('Financial Audit Report')

    // Click Pending filter
    const pendingTab = screen.getByRole('button', { name: /pending \(/i })
    fireEvent.click(pendingTab)

    expect(screen.getByText('Financial Audit Report')).toBeInTheDocument()
    expect(screen.queryByText('Offer Letter')).not.toBeInTheDocument()
  })
})
