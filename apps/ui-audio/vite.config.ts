import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import configData from '../../config/config.json' with { type: 'json' }

const isDev = process.env.NODE_ENV !== 'production'
const audioPort = isDev
  ? configData.services.BACKEND_AUDIO.dev
  : configData.services.BACKEND_AUDIO.prod

// Build menu config for runtime injection
const menuConfig = configData.menu.map((group) => ({
  title: group.title,
  icon: group.icon,
  items: group.items.map((item) => {
    const ui = configData.uis[item.ui as keyof typeof configData.uis]
    return {
      title: ui.name,
      icon: item.icon,
      devUrl: `http://localhost:${ui.vitePort}/`,
      prodUrl: ui.basePath + '/',
    }
  }),
}))

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
    'import.meta.env.VITE_MENU_CONFIG': JSON.stringify(JSON.stringify(menuConfig)),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@magik/ui-shared': fileURLToPath(new URL('../../packages/ui-shared/src', import.meta.url)),
    },
  },
})
