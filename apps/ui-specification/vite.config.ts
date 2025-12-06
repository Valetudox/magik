// eslint-disable-next-line import/no-unresolved
import vue from '@vitejs/plugin-vue'
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    port: 5003,
    proxy: {
      '/api': {
        target: 'http://localhost:4002',
        changeOrigin: true,
      },
    },
  },
})
