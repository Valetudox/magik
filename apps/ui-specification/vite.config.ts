import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import configData from '../../config/config.json' with { type: 'json' }

const isDev = process.env.NODE_ENV !== 'production'
const specificationPort = isDev
  ? configData.services.BACKEND_SPECIFICATION.dev
  : configData.services.BACKEND_SPECIFICATION.prod

export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    port: 5003,
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(`http://localhost:${specificationPort}/api`),
  },
})
