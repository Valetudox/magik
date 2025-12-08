import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import configData from '../../config/config.json' with { type: 'json' }

const isDev = process.env.NODE_ENV !== 'production'
const audioPort = isDev
  ? configData.services.BACKEND_AUDIO.dev
  : configData.services.BACKEND_AUDIO.prod

export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    port: 5174,
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(`http://localhost:${audioPort}`),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@magik/ui-shared': fileURLToPath(new URL('../../packages/ui-shared/src', import.meta.url)),
    },
  },
})
