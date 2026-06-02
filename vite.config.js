import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Ini memastikan asset dimuat secara relatif saat di GitHub Pages
  plugins: [react()],
  server: {
    allowedHosts: true, // Mengizinkan semua host termasuk URL ngrok yang berubah-ubah
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
