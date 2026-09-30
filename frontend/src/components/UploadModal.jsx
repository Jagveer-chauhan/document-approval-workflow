import { useEffect, useState } from 'react'
import { uploadSubmission } from '../api/client'

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
]

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isSubmitting, onClose])

  if (!isOpen) {
    return null
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setSelectedFile(null)
    setErrorMessage('')
    setIsDragging(false)
  }

  function handleModalClose() {
    if (isSubmitting) return
    resetForm()
    onClose()
  }

  function validateAndSetFile(file) {
    setErrorMessage('')

    if (!file) return

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setErrorMessage(
        'Invalid file type. Allowed formats: PDF, DOCX, JPG, and PNG.'
      )
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds the 10 MB limit.')
      return
    }

    setSelectedFile(file)
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0]
    validateAndSetFile(file)
  }

  function handleDragOver(event) {
    event.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(event) {
    event.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    validateAndSetFile(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')

    if (!title.trim()) {
      setErrorMessage('Please provide a document title.')
      return
    }

    if (!selectedFile) {
      setErrorMessage('Please select a document file to upload.')
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('file', selectedFile)

      const createdSubmission = await uploadSubmission(formData)
      resetForm()
      onUploadSuccess(createdSubmission)
    } catch (err) {
      const serverResponseError =
        err.response?.data?.title?.[0] ||
        err.response?.data?.file?.[0] ||
        err.response?.data?.detail ||
        'Failed to upload the document. Please try again.'
      setErrorMessage(serverResponseError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={handleModalClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="upload-modal-title" className="modal-title">
              Upload Document
            </h2>
            <p className="modal-subtitle">
              Submit a new file for reviewer evaluation and approval
            </p>
          </div>
          <button
            type="button"
            className="modal-close-button"
            onClick={handleModalClose}
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
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
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="document-title" className="form-label">
              Document Title <span className="required-star">*</span>
            </label>
            <input
              id="document-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Financial Statement"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="document-description" className="form-label">
              Description <span className="optional-tag">(Optional)</span>
            </label>
            <textarea
              id="document-description"
              className="form-textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any relevant context or notes for the reviewer..."
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Document File <span className="required-star">*</span>
            </label>

            {!selectedFile ? (
              <div
                className={`dropzone-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  className="visually-hidden-input"
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileInputChange}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="file-upload-input"
                  className="dropzone-label"
                >
                  <svg
                    className="dropzone-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="40"
                    height="40"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="dropzone-prompt">
                    <span className="dropzone-link">Choose a file</span> or drag and drop here
                  </p>
                  <p className="dropzone-hint">
                    PDF, DOCX, JPG, or PNG (up to 10 MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="file-preview-card">
                <div className="file-info-group">
                  <div className="file-type-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      width="24"
                      height="24"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="file-meta">
                    <p className="file-name">{selectedFile.name}</p>
                    <p className="file-size">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="file-remove-button"
                  onClick={() => setSelectedFile(null)}
                  disabled={isSubmitting}
                  aria-label="Remove file"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={handleModalClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="button-loading-content">
                  <span className="spinner"></span>
                  <span>Uploading...</span>
                </span>
              ) : (
                <span>Submit for Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
