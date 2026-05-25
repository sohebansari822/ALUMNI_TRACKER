import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['pound-shudder-exhale.ngrok-free.dev'],
    host: true,
  }
})