import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The shared project-root .env is filtered by Vite's default VITE_ prefix.
  // Server-only credentials such as SUPABASE_SERVICE_ROLE_KEY stay private.
  envDir: '..',
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
