import React, { useState, useEffect } from 'react'
import { getUserInfo } from '../../lib/auth'
import { hasPermission } from '../../lib/rbac'
import { authFetch } from '../../lib/auth'

interface DashboardStats {
  totals: {
    cves: number
    curations: number
    published_curations: number
    draft_curations: number
    review_curations: number
    alerts: number
    published_alerts: number
    draft_alerts: number
    review_alerts: number
    critical: number
  }
  severity_distribution: {
    [key: string]: {
      count: number
      percentage: number
    }
  }
  recent_cves: Array<{
    cve_id: string
    title: string
    severity: string
    published_at: string
    cve_published: string
    is_kev: boolean
  }>
}

export default function DashboardPage() {
  const user = getUserInfo()
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check if user has admin permissions
  if (!hasPermission(user, 'ADMIN_FUNCTIONS')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h1>
          <p className="text-red-700">You don't have permission to access the dashboard.</p>
        </div>
      </div>
    )
  }

  // Fetch dashboard data
  useEffect(() => {
    let mounted = true
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        console.log("=== Fetching Dashboard Stats ===")
        
        const response = await authFetch('/admin/dashboard/stats', {
          headers: { accept: 'application/json' }
        })
        
        console.log("Dashboard response status:", response.status, response.statusText)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        console.log("Dashboard data received:", data)
        
        if (mounted) {
          setDashboardData(data)
        }
      } catch (e) {
        console.error("Dashboard fetch error:", e)
        if (mounted) {
          setError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    fetchDashboardData()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Error Loading Dashboard</h1>
          <p className="text-red-700">Failed to load dashboard data: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">System overview and key metrics</p>
        </div>
        <button
          onClick={() => {
            setLoading(true)
            setError(null)
            let mounted = true
            const fetchData = async () => {
              try {
                const response = await authFetch('/admin/dashboard/stats')
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`)
                }
                const data = await response.json()
                if (mounted) {
                  setDashboardData(data)
                }
              } catch (e) {
                if (mounted) {
                  setError(e instanceof Error ? e.message : String(e))
                }
              } finally {
                if (mounted) {
                  setLoading(false)
                }
              }
            }
            fetchData()
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total CVEs</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {dashboardData?.totals.cves.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Curations</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {dashboardData?.totals.curations.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Alerts</h3>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {dashboardData?.totals.alerts.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Critical</h3>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {dashboardData?.totals.critical.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid mb-8">
        {/* CVE Severity Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">CVE Severity Distribution</h2>
          <div className="space-y-3">
            {dashboardData?.severity_distribution && Object.entries(dashboardData.severity_distribution).map(([severity, data]) => {
              const getSeverityColor = (sev: string) => {
                switch (sev.toLowerCase()) {
                  case 'critical': return 'bg-red-600'
                  case 'high': return 'bg-orange-600'
                  case 'medium': return 'bg-yellow-600'
                  case 'low': return 'bg-blue-600'
                  default: return 'bg-gray-600'
                }
              }
              
              return (
                <div key={severity} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{severity}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`${getSeverityColor(severity)} h-2 rounded-full`}
                        style={{ width: `${Math.min(data.percentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                      {data.percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-500 w-16 text-right">
                      ({data.count.toLocaleString()})
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">New CVE processed</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">2 minutes ago</div>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Curation published</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">15 minutes ago</div>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Alert created</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">1 hour ago</div>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">System update</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">3 hours ago</div>
            </div>
          </div>
        </div> */}
      </div>

      {/* Recent CVEs */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent CVEs</h2>
          <button 
            onClick={() => window.location.href = '/vulnerabilities'}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
          >
            View all →
          </button>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading recent CVEs...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p>Error loading recent CVEs: {error}</p>
          </div>
        ) : dashboardData?.recent_cves && dashboardData.recent_cves.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.recent_cves.map((cve) => (
              <div 
                key={cve.cve_id} 
                className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => window.location.href = `/admin/curation/edit/${cve.cve_id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{cve.cve_id}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        cve.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        cve.severity === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                        cve.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        cve.severity === 'LOW' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {cve.severity}
                      </span>
                      {cve.is_kev && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          KEV
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {cve.title || 'No title available'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Published: {new Date(cve.published_at).toLocaleDateString()}</span>
                      <span>CVE Published: {new Date(cve.cve_published).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No recent CVEs available</p>
          </div>
        )}
      </div>
    </div>
  )
}
