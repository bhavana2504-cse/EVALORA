
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://evalora-oxg9.vercel.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})

