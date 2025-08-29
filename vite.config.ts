import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const AUTH_BASE = env.VITE_AUTH_BASE_URL || 'http://localhost:8001'
  const API_BASE = env.VITE_API_BASE_URL || 'http://localhost:8000'
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/auth': { target: AUTH_BASE, changeOrigin: true, secure: false },
        '/cves': { target: API_BASE, changeOrigin: true, secure: false },
        '/cve': { target: API_BASE, changeOrigin: true, secure: false },
      }
    }
  }
})
