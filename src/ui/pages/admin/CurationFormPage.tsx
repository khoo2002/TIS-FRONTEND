import React, { useState } from 'react'
import { authFetch } from '../../lib/auth'

interface CurationFormProps {
  cveId: string
  onClose: () => void
  onSuccess: () => void
}

export default function CurationFormPage({ cveId, onClose, onSuccess }: CurationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    cvssScore: '',
    cvssVector: '',
    impact: '',
    exploitability: '',
    recommendation: '',
    workaround: '',
    patchStatus: 'Not Available',
    vendorResponse: '',
    analysisNotes: '',
    riskRating: 'Medium',
    affectedProducts: '',
    affectedVersions: '',
    tags: '',
    sources: '',
    references: '',
    analyst: '',
    reviewedBy: '',
    approvedBy: '',
    status: 'Draft',
    priority: 'Medium',
    confidenceLevel: 'Medium',
    falsePositive: false,
    requiresAttention: true,
    publicExploit: false,
    activeExploitation: false,
    automatedExploit: false,
    dateAnalyzed: new Date().toISOString().slice(0, 16),
    nextReviewDate: '',
    internalNotes: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await authFetch('/admin/curation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          cveId,
          cvssScore: formData.cvssScore ? parseFloat(formData.cvssScore) : null,
          affectedProducts: formData.affectedProducts.split(',').map(p => p.trim()).filter(Boolean),
          affectedVersions: formData.affectedVersions.split(',').map(v => v.trim()).filter(Boolean),
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          sources: formData.sources.split(',').map(s => s.trim()).filter(Boolean),
          references: formData.references.split(',').map(r => r.trim()).filter(Boolean)
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create curation: ${response.status}`)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create curation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl max-h-[95vh] overflow-y-auto w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Curate Vulnerability: {cveId}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => handleInputChange('severity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    CVSS Score
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.cvssScore}
                    onChange={(e) => handleInputChange('cvssScore', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Risk Rating
                  </label>
                  <select
                    value={formData.riskRating}
                    onChange={(e) => handleInputChange('riskRating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  required
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CVSS Vector
                </label>
                <input
                  type="text"
                  value={formData.cvssVector}
                  onChange={(e) => handleInputChange('cvssVector', e.target.value)}
                  placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>

            {/* Technical Analysis */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Technical Analysis</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Impact Assessment
                  </label>
                  <textarea
                    value={formData.impact}
                    onChange={(e) => handleInputChange('impact', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exploitability Assessment
                  </label>
                  <textarea
                    value={formData.exploitability}
                    onChange={(e) => handleInputChange('exploitability', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Analysis Notes
                  </label>
                  <textarea
                    value={formData.analysisNotes}
                    onChange={(e) => handleInputChange('analysisNotes', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Affected Systems */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Affected Systems</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Affected Products (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.affectedProducts}
                    onChange={(e) => handleInputChange('affectedProducts', e.target.value)}
                    placeholder="Windows Server, Apache HTTP Server"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Affected Versions (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.affectedVersions}
                    onChange={(e) => handleInputChange('affectedVersions', e.target.value)}
                    placeholder="2019, 2022, < 2.4.50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Remediation */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Remediation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Patch Status
                  </label>
                  <select
                    value={formData.patchStatus}
                    onChange={(e) => handleInputChange('patchStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="Not Available">Not Available</option>
                    <option value="Available">Available</option>
                    <option value="Partial">Partial</option>
                    <option value="In Development">In Development</option>
                    <option value="Not Planned">Not Planned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recommendations
                  </label>
                  <textarea
                    value={formData.recommendation}
                    onChange={(e) => handleInputChange('recommendation', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workarounds
                  </label>
                  <textarea
                    value={formData.workaround}
                    onChange={(e) => handleInputChange('workaround', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor Response
                  </label>
                  <textarea
                    value={formData.vendorResponse}
                    onChange={(e) => handleInputChange('vendorResponse', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Threat Intelligence */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Threat Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="publicExploit"
                    checked={formData.publicExploit}
                    onChange={(e) => handleInputChange('publicExploit', e.target.checked)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="publicExploit" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Public Exploit Available
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activeExploitation"
                    checked={formData.activeExploitation}
                    onChange={(e) => handleInputChange('activeExploitation', e.target.checked)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activeExploitation" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Active Exploitation
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="automatedExploit"
                    checked={formData.automatedExploit}
                    onChange={(e) => handleInputChange('automatedExploit', e.target.checked)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="automatedExploit" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Automated Exploit
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="falsePositive"
                    checked={formData.falsePositive}
                    onChange={(e) => handleInputChange('falsePositive', e.target.checked)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="falsePositive" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    False Positive
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confidence Level
                  </label>
                  <select
                    value={formData.confidenceLevel}
                    onChange={(e) => handleInputChange('confidenceLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="requiresAttention"
                    checked={formData.requiresAttention}
                    onChange={(e) => handleInputChange('requiresAttention', e.target.checked)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiresAttention" className="ml-2 block text-sm text-gray-900 dark:text-white">
                    Requires Immediate Attention
                  </label>
                </div>
              </div>
            </div>

            {/* Workflow & Metadata */}
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Workflow & Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Published">Published</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Analyst
                  </label>
                  <input
                    type="text"
                    value={formData.analyst}
                    onChange={(e) => handleInputChange('analyst', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reviewed By
                  </label>
                  <input
                    type="text"
                    value={formData.reviewedBy}
                    onChange={(e) => handleInputChange('reviewedBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Approved By
                  </label>
                  <input
                    type="text"
                    value={formData.approvedBy}
                    onChange={(e) => handleInputChange('approvedBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Analyzed
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dateAnalyzed}
                    onChange={(e) => handleInputChange('dateAnalyzed', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Next Review Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.nextReviewDate}
                    onChange={(e) => handleInputChange('nextReviewDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                    placeholder="network, critical, rce"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sources (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.sources}
                    onChange={(e) => handleInputChange('sources', e.target.value)}
                    placeholder="NVD, CISA, Vendor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    References (comma-separated URLs)
                  </label>
                  <textarea
                    value={formData.references}
                    onChange={(e) => handleInputChange('references', e.target.value)}
                    rows={2}
                    placeholder="https://nvd.nist.gov/..., https://vendor.com/advisory..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Internal Notes
                  </label>
                  <textarea
                    value={formData.internalNotes}
                    onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                    rows={3}
                    placeholder="Internal notes for team coordination..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Curation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
