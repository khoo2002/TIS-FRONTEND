import React from 'react'
import { getUserInfo } from '../../lib/auth'
import { hasPermission } from '../../lib/rbac'

export default function AdminHomePage() {
  const user = getUserInfo()

  // Check if user has admin permissions
  if (!hasPermission(user, 'ADMIN_FUNCTIONS')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h1>
          <p className="text-red-700">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Admin Home</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome to the TIS administration panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Vulnerability Management */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-3">Vulnerability Management</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Manage CVE curations, alerts, and vulnerability assessments</p>
          <button 
            onClick={() => window.location.href = '/vulnerabilities'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Manage Vulnerabilities
          </button>
        </div>

        {/* Curation System */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-3">Curation System</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Create and manage vulnerability curations and enrichments</p>
          <button 
            onClick={() => window.location.href = '/curation/edit/new'}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
          >
            Create Curation
          </button>
        </div>

        {/* Analytics & Reports */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-3">Analytics & Reports</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">View analytics, generate reports, and track system metrics</p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
            >
              View Dashboard
            </button>
            <button 
              onClick={() => window.location.href = '/report'}
              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-md"
            >
              Generate Reports
            </button>
          </div>
        </div>

        {/* User Management */}
        {hasPermission(user, 'manageUsers') && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-3">User Management</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Manage user accounts, roles, and permissions</p>
            <button 
              onClick={() => window.location.href = '/auth/admin'}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md"
            >
              Manage Users
            </button>
          </div>
        )}

        {/* System Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 ml-3">System Settings</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Configure system settings and preferences</p>
          <button 
            onClick={() => window.location.href = '/settings'}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
          >
            Open Settings
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">-</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total CVEs</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">-</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Curations</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">-</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending Reviews</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">-</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Critical Alerts</div>
        </div>
      </div>
    </div>
  )
}
