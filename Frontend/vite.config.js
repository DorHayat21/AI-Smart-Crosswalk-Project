import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'node:process'

// https://vite.dev/config/
const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:3000'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/crosswalks': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/alerts': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/ai': {
        target: backendTarget,
        changeOrigin: true,
      }
    }
  }
})
