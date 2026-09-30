import { useEffect, useMemo, useState } from 'react'
import { fetchSubmissions } from '../api/client'
import { useAuth } from '../context/useAuth'
import UploadModal from './UploadModal'

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
    pending: 'Pending Review',
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

export default function SubmitterDashboard() {
  const { currentUser, logout } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  async function loadSubmissions() {
    setLoading(true)
    setErrorMessage('')
    try {
      const data = await fetchSubmissions()
      setSubmissions(data)
    } catch {
      setErrorMessage('Failed to load documents. Please check your network.')
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
          setErrorMessage('Failed to load documents. Please check your network.')
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

  function handleUploadSuccess(newSubmission) {
    setSubmissions((prev) => [newSubmission, ...prev])
    setIsUploadModalOpen(false)
  }

  const metrics = useMemo(() => {
    const total = submissions.length
    const pending = submissions.filter((item) => item.status === 'pending').length
    const approved = submissions.filter((item) => item.status === 'approved').length
    const rejected = submissions.filter((item) => item.status === 'rejected').length
    return { total, pending, approved, rejected }
  }, [submissions])

  const filteredSubmissions = useMemo(() => {
    if (selectedStatusFilter === 'all') return submissions
    return submissions.filter((item) => item.status === selectedStatusFilter)
  }, [submissions, selectedStatusFilter])

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
                strokeLinecap="round"
                strokeLinejoin="round"
                width="22"
                height="22"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <span className="brand-title">DocuFlow</span>
              <span className="brand-tag">Approval Portal</span>
            </div>
          </div>

          <div className="user-profile-controls">
            <div className="user-info-chip">
              <div className="user-avatar">
                {currentUser?.name
                  ? currentUser.name.charAt(0).toUpperCase()
                  : currentUser?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {currentUser?.name || currentUser?.username}
                </span>
                <span className="user-role-tag submitter">Submitter</span>
              </div>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={logout}
              title="Sign out of your account"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="content-container">
          <div className="page-header-row">
            <div>
              <h1 className="page-title">My Document Submissions</h1>
              <p className="page-description">
                Upload new documents for review and track their status in real time
              </p>
            </div>

            <button
              type="button"
              className="button-primary-upload"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                width="18"
                height="18"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Upload Document</span>
            </button>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Total Submissions</span>
              <span className="metric-value">{metrics.total}</span>
            </div>
            <div className="metric-card metric-pending">
              <span className="metric-label">Pending Review</span>
              <span className="metric-value">{metrics.pending}</span>
            </div>
            <div className="metric-card metric-approved">
              <span className="metric-label">Approved</span>
              <span className="metric-value">{metrics.approved}</span>
            </div>
            <div className="metric-card metric-rejected">
              <span className="metric-label">Rejected</span>
              <span className="metric-value">{metrics.rejected}</span>
            </div>
          </div>

          <div className="table-card">
            <div className="table-toolbar">
              <div className="filter-tabs">
                <button
                  type="button"
                  className={`filter-tab ${selectedStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedStatusFilter('all')}
                >
                  All ({metrics.total})
                </button>
                <button
                  type="button"
                  className={`filter-tab ${selectedStatusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setSelectedStatusFilter('pending')}
                >
                  Pending ({metrics.pending})
                </button>
                <button
                  type="button"
                  className={`filter-tab ${selectedStatusFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => setSelectedStatusFilter('approved')}
                >
                  Approved ({metrics.approved})
                </button>
                <button
                  type="button"
                  className={`filter-tab ${selectedStatusFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => setSelectedStatusFilter('rejected')}
                >
                  Rejected ({metrics.rejected})
                </button>
              </div>

              <button
                type="button"
                className="button-refresh"
                onClick={loadSubmissions}
                disabled={loading}
                title="Refresh list"
              >
                <svg
                  className={`refresh-icon ${loading ? 'spinning' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="16"
                  height="16"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
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
                <p>Loading your documents...</p>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-state-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    width="44"
                    height="44"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 className="empty-state-title">
                  {selectedStatusFilter === 'all'
                    ? 'No documents submitted yet'
                    : `No ${selectedStatusFilter} documents found`}
                </h3>
                <p className="empty-state-description">
                  {selectedStatusFilter === 'all'
                    ? 'Submit your first document to start the approval workflow.'
                    : 'Try selecting a different status filter or upload a new document.'}
                </p>
                {selectedStatusFilter === 'all' && (
                  <button
                    type="button"
                    className="button-primary-upload"
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    Upload Document
                  </button>
                )}
              </div>
            ) : (
              <div className="table-responsive">
                <table className="submissions-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Submitted On</th>
                      <th>File</th>
                      <th>Status</th>
                      <th>Review Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((doc) => (
                      <tr key={doc.id}>
                        <td className="doc-main-cell">
                          <span className="doc-title">{doc.title}</span>
                          {doc.description && (
                            <span className="doc-desc">{doc.description}</span>
                          )}
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
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="15"
                                height="15"
                              >
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                <polyline points="13 2 13 9 20 9" />
                              </svg>
                              <span>View File</span>
                            </a>
                          ) : (
                            <span className="empty-file-cell">—</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="review-meta-cell">
                          {doc.reviewed_by ? (
                            <div>
                              <span className="reviewer-name">
                                By: {doc.reviewed_by}
                              </span>
                              <span className="reviewed-date">
                                {formatDate(doc.reviewed_at)}
                              </span>
                            </div>
                          ) : (
                            <span className="awaiting-review">Awaiting Review</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
