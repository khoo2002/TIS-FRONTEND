import React, { useState, useEffect } from 'react'
import { getUserInfo } from '../../lib/auth'
import { hasPermission } from '../../lib/rbac'
import { authFetch } from '../../lib/auth'

interface UserSettings {
  user_id: string
  email: string
  gemini_apikey?: string
}

export default function SettingsPage() {
  const currentUser = getUserInfo()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [formData, setFormData] = useState({
    gemini_apikey: ''
  })

  // Check if user has admin permissions
  if (!currentUser?.sub || !hasPermission(currentUser, 'ADMIN_FUNCTIONS')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h1>
          <p className="text-red-700">You don't have permission to access admin settings.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    let mounted = true
    
    const fetchUserSettings = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log("Fetching settings for user:", currentUser.sub)
        
        const response = await authFetch(`/admin/users/${currentUser.sub}`)
        
        console.log("Settings response status:", response.status, response.statusText)
        
        if (response.status === 404) {
          // User doesn't exist in settings yet, create empty settings
          if (mounted) {
            setUserSettings({
              user_id: currentUser.sub || '',
              email: currentUser.email || '',
              gemini_apikey: ''
            })
            setFormData({ gemini_apikey: '' })
          }
          return
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        console.log("Settings data received:", data)
        
        if (mounted) {
          setUserSettings(data)
          setFormData({
            gemini_apikey: data.gemini_apikey || ''
          })
        }
      } catch (e) {
        console.error("Settings fetch error:", e)
        if (mounted) {
          setError(e instanceof Error ? e.message : String(e))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchUserSettings()
    return () => { mounted = false }
  }, [currentUser.sub, currentUser.email])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const payload = {
        user_id: currentUser.sub || '',
        email: currentUser.email || '',
        gemini_apikey: formData.gemini_apikey.trim() || undefined
      }

      console.log("Saving settings:", payload)

      const response = await authFetch('/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const updatedData = await response.json()
      console.log("Settings saved:", updatedData)

      setUserSettings(updatedData)
      setSuccess('Settings saved successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      console.error("Settings save error:", e)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleClearApiKey = () => {
    setFormData({ gemini_apikey: '' })
  }

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
          <h1 className="text-xl font-semibold text-red-800 mb-2">Error Loading Settings</h1>
          <p className="text-red-700">Failed to load your settings: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your personal settings and API keys</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={currentUser.sub || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={currentUser.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">API Configuration</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gemini API Key
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Your Gemini API key will be used for AI-powered CVE analysis. Keep this secure and don't share it with others.
            </p>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={formData.gemini_apikey}
                onChange={(e) => setFormData({ gemini_apikey: e.target.value })}
                placeholder="Enter your Gemini API key (e.g., AIza...)"
                className="w-full px-3 py-2 pr-20 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showApiKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.414 10.364l1.414-1.414M9.878 9.878l-1.414-1.414m1.414 1.414l4.242 4.242m0 0L16.536 15.464m-1.414 1.414l1.414 1.414" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Current API Key Status */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center">
                {userSettings?.gemini_apikey ? (
                  <>
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-green-600 dark:text-green-400">API key configured</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01" />
                    </svg>
                    <span className="text-sm text-gray-500 dark:text-gray-400">No API key configured</span>
                  </>
                )}
              </div>
              
              {formData.gemini_apikey && (
                <button
                  type="button"
                  onClick={handleClearApiKey}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => setFormData({ gemini_apikey: userSettings?.gemini_apikey || '' })}
            disabled={saving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* API Key Help */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          How to get a Gemini API Key:
        </h3>
        <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
          <li>Visit <a href="https://ai.google.dev" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">Google AI Studio</a></li>
          <li>Sign in with your Google account</li>
          <li>Navigate to "Get API Key" section</li>
          <li>Create a new API key for your project</li>
          <li>Copy the key and paste it above</li>
        </ol>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
          <strong>Note:</strong> Your API key is stored securely and only used for CVE analysis within this system.
        </p>
      </div>
    </div>
  )
}
