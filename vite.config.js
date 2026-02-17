import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  assetsInclude: ['**/*.ttf'],
  proxy: {
    '/api': {
      target: 'https://mandapam-backend-97mi.onrender.com',
      changeOrigin: true,
      secure: true
    },
    '/uploads': {
      target: 'https://mandapam-backend-97mi.onrender.com',
      changeOrigin: true,
      secure: true
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // Add this for SPA routing support
  preview: {
    port: 3000
  }
  
})




