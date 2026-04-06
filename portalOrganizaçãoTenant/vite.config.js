import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    force: true, // Força a re-otimização das dependências
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4003', // Porta correta do backend
        changeOrigin: true,
      },
    },
  },
})
