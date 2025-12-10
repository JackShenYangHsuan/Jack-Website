import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/visionquest/',
  server: {
    proxy: {
      '/api/whoop': {
        target: 'https://api.prod.whoop.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/whoop/, ''),
        secure: true,
      },
    },
  },
})
