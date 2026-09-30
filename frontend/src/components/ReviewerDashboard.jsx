import { useEffect, useMemo, useState } from 'react'
import { fetchSubmissions, reviewSubmission } from '../api/client'
import { useAuth } from '../context/useAuth'

function formatDate(isoString) {
  if (!isoString) return '—'
  const dateObj = new Date(isoString)
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }) {
  const normalizedStatus = (status || 'pending').toLowerCase()
  const statusLabels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  }

  return (
    <span className={`status-badge ${normalizedStatus}`}>
      <span className="status-dot"></span>
      {statusLabels[normalizedStatus] || normalizedStatus}
    </span>
  )
}

export default function ReviewerDashboard() {
  const { currentUser, logout } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [processingId, setProcessingId] = useState(null)

  async function loadSubmissions() {
    setLoading(true)
    setErrorMessage('')
    try {
      const data = await fetchSubmissions()
      setSubmissions(data)
    } catch {
      setErrorMessage('Failed to load submissions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isCurrent = true

    async function fetchInitialSubmissions() {
      try {
        const data = await fetchSubmissions()
        if (isCurrent) {
          setSubmissions(data)
        }
      } catch {
        if (isCurrent) {
          setErrorMessage('Failed to load submissions. Please try again.')
        }
      } finally {
        if (isCurrent) {
          setLoading(false)
        }
      }
    }

    fetchInitialSubmissions()

    return () => {
      isCurrent = false
    }
  }, [])

  async function handleStatusUpdate(submissionId, newStatus) {
    setProcessingId(submissionId)
    setActionError('')
    try {
      const updated = await reviewSubmission(submissionId, newStatus)
      setSubmissions((prev) =>
        prev.map((item) => (item.id === submissionId ? updated : item))
      )
    } catch (err) {
      const message =
        err.response?.data?.status?.[0] ||
        err.response?.data?.detail ||
        'Failed to update status. Please try again.'
      setActionError(message)
    } finally {
      setProcessingId(null)
    }
  }

  const filteredSubmissions = useMemo(() => {
    if (selectedFilter === 'all') return submissions
    return submissions.filter((item) => item.status === selectedFilter)
  }, [submissions, selectedFilter])

  const counts = useMemo(() => {
    return {
      all: submissions.length,
      pending: submissions.filter((s) => s.status === 'pending').length,
      approved: submissions.filter((s) => s.status === 'approved').length,
      rejected: submissions.filter((s) => s.status === 'rejected').length,
    }
  }, [submissions])

  return (
    <div className="dashboard-layout">
      <header className="navbar">
        <div className="navbar-container">
          <div className="brand-group">
            <div className="brand-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="20"
                height="20"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <span className="brand-title">DocuFlow</span>
              <span className="brand-tag">Reviewer Portal</span>
            </div>
          </div>

          <div className="user-profile-controls">
            <div className="user-info-chip">
              <div className="user-avatar">
                {currentUser?.name?.charAt(0) || currentUser?.username?.charAt(0) || 'R'}
              </div>
              <div className="user-details">
                <span className="user-name">{currentUser?.name || currentUser?.username}</span>
                <span className="user-role-tag reviewer">Reviewer</span>
              </div>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={logout}
            >
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="content-container">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">Submitted Documents</h1>
              <p className="page-description">
                Review and approve or reject submissions from team members
              </p>
            </div>
          </div>

          {actionError && (
            <div className="error-alert" role="alert">
              <span>{actionError}</span>
            </div>
          )}

          <div className="table-card">
            <div className="table-toolbar">
              <div className="filter-tabs">
                <button
                  type="button"
                  className={`filter-tab ${selectedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('all')}
                >
                  All ({counts.all})
                </button>
                <button
                  type="button"
                  className={`filter-tab ${selectedFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('pending')}
                >
                  Pending ({counts.pending})
                </button>
                <button
                  type="button"
                  className={`filter-tab ${selectedFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('approved')}
                >
                  Approved ({counts.approved})
                </button>
                <button
                  type="button"
                  className={`filter-tab ${selectedFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('rejected')}
                >
                  Rejected ({counts.rejected})
                </button>
              </div>

              <button
                type="button"
                className="button-refresh"
                onClick={loadSubmissions}
                disabled={loading}
              >
                <span>Refresh</span>
              </button>
            </div>

            {errorMessage && (
              <div className="table-error-banner">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  className="retry-button"
                  onClick={loadSubmissions}
                >
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading-state-container">
                <span className="spinner large"></span>
                <p>Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="empty-state-container">
                <h3 className="empty-state-title">No documents found</h3>
                <p className="empty-state-description">
                  {selectedFilter === 'all'
                    ? 'No document submissions have been made yet.'
                    : `No documents currently marked as ${selectedFilter}.`}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Submitter</th>
                      <th>Submitted On</th>
                      <th>File</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((doc) => {
                      const isRowProcessing = processingId === doc.id

                      return (
                        <tr key={doc.id}>
                          <td className="doc-main-cell">
                            <span className="doc-title">{doc.title}</span>
                            {doc.description && (
                              <span className="doc-desc">{doc.description}</span>
                            )}
                          </td>
                          <td>
                            <span className="submitter-cell">{doc.submitted_by}</span>
                          </td>
                          <td className="date-cell">{formatDate(doc.created_at)}</td>
                          <td>
                            {doc.file ? (
                              <a
                                href={doc.file}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="file-download-link"
                              >
                                View File
                              </a>
                            ) : (
                              <span className="empty-file-cell">—</span>
                            )}
                          </td>
                          <td>
                            <StatusBadge status={doc.status} />
                          </td>
                          <td>
                            {doc.status === 'pending' ? (
                              <div className="reviewer-actions-group">
                                <button
                                  type="button"
                                  className="button-approve"
                                  onClick={() => handleStatusUpdate(doc.id, 'approved')}
                                  disabled={isRowProcessing}
                                >
                                  {isRowProcessing ? '...' : 'Approve'}
                                </button>
                                <button
                                  type="button"
                                  className="button-reject"
                                  onClick={() => handleStatusUpdate(doc.id, 'rejected')}
                                  disabled={isRowProcessing}
                                >
                                  {isRowProcessing ? '...' : 'Reject'}
                                </button>
                              </div>
                            ) : (
                              <span className="action-finalized-label">Reviewed</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
