import React, { useState } from 'react'
import { getUserInfo } from '../../lib/auth'
import { hasPermission } from '../../lib/rbac'

export default function ReportPage() {
  const user = getUserInfo()
  const [selectedReport, setSelectedReport] = useState('summary')
  const [dateRange, setDateRange] = useState('last30days')
  const [isGenerating, setIsGenerating] = useState(false)

  // Check if user has admin permissions
  if (!hasPermission(user, 'ADMIN_FUNCTIONS')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h1>
          <p className="text-red-700">You don't have permission to access reports.</p>
        </div>
      </div>
    )
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false)
      alert('Report generated successfully! (This is a placeholder)')
    }, 2000)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Generate comprehensive reports and analytics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Configuration */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Report Configuration</h2>
            
            {/* Report Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Report Type</label>
              <select 
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="summary">Security Summary</option>
                <option value="vulnerability">Vulnerability Analysis</option>
                <option value="curation">Curation Report</option>
                <option value="alert">Alert Activity</option>
                <option value="compliance">Compliance Report</option>
                <option value="trends">Trend Analysis</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="last7days">Last 7 days</option>
                <option value="last30days">Last 30 days</option>
                <option value="last90days">Last 90 days</option>
                <option value="last6months">Last 6 months</option>
                <option value="lastyear">Last year</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className={`w-full px-4 py-2 rounded-md font-medium ${
                isGenerating 
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {/* Quick Export */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Export</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                Export CVE list (CSV)
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                Export Curations (JSON)
              </button>
              <button className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                Export Alerts (PDF)
              </button>
            </div>
          </div>
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Report Preview</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  PDF
                </button>
                <button className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                  Excel
                </button>
                <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  CSV
                </button>
              </div>
            </div>

            {/* Report Content */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              {selectedReport === 'summary' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Security Summary Report</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">-</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total CVEs</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">-</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Critical</div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    This report provides an overview of the security posture for the selected time period.
                  </p>
                </div>
              )}

              {selectedReport === 'vulnerability' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Vulnerability Analysis Report</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Detailed analysis of vulnerabilities including severity distribution, trends, and impact assessment.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Report will include:</div>
                    <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                      <li>Vulnerability discovery trends</li>
                      <li>Severity distribution analysis</li>
                      <li>CVSS score analytics</li>
                      <li>Top affected vendors/products</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedReport === 'curation' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Curation Report</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Analysis of curation activities, quality metrics, and enrichment statistics.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Report will include:</div>
                    <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                      <li>Curation completion rates</li>
                      <li>Quality metrics</li>
                      <li>Analyst productivity</li>
                      <li>Enrichment coverage</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedReport === 'alert' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Alert Activity Report</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Overview of alert generation, distribution, and response metrics.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Report will include:</div>
                    <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                      <li>Alert volume trends</li>
                      <li>Alert type distribution</li>
                      <li>Response time metrics</li>
                      <li>False positive rates</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedReport === 'compliance' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Compliance Report</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Compliance status against security frameworks and regulatory requirements.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Report will include:</div>
                    <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                      <li>Framework compliance scores</li>
                      <li>Gap analysis</li>
                      <li>Remediation recommendations</li>
                      <li>Audit trail summary</li>
                    </ul>
                  </div>
                </div>
              )}

              {selectedReport === 'trends' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Trend Analysis Report</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Historical trends and predictive analytics for security metrics.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Report will include:</div>
                    <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 list-disc list-inside">
                      <li>Vulnerability discovery patterns</li>
                      <li>Severity trend analysis</li>
                      <li>Seasonal variations</li>
                      <li>Predictive forecasting</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
