import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to FastAPI backend to avoid 404 when running Vite dev
      '/llm': { target: 'http://localhost:8000', changeOrigin: true },
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/catalog': { target: 'http://localhost:8000', changeOrigin: true },
      '/search': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
      '/docs': { target: 'http://localhost:8000', changeOrigin: true },
      '/ingest': { target: 'http://localhost:8000', changeOrigin: true },
      '/idea': { target: 'http://localhost:8000', changeOrigin: true },
      '/jira': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
