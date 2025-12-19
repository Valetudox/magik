import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import configData from '../../config/config.json' with { type: 'json' }

const isDev = process.env.NODE_ENV !== 'production'
const specificationPort = isDev
  ? configData.services.BACKEND_SPECIFICATION.dev
  : configData.services.BACKEND_SPECIFICATION.prod

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
  base: process.env.VITE_BASE_PATH ?? '/',
  server: {
    port: 5003,
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(`http://localhost:${specificationPort}/api`),
    'import.meta.env.VITE_MENU_CONFIG': JSON.stringify(JSON.stringify(menuConfig)),
  },
})
