/// <reference types="vite/client" />

// Type for runtime menu config (injected by Vite at build time)
export interface MenuItemConfig {
  title: string
  icon: string
  devUrl: string
  prodUrl: string
}

export interface MenuGroupConfig {
  title: string
  icon: string
  items: MenuItemConfig[]
}

// Augment ImportMetaEnv for type safety
declare global {
  interface ImportMetaEnv {
    VITE_MENU_CONFIG: string
  }
}

/**
 * Get the menu configuration that was injected at build time by Vite.
 * Falls back to an empty array if not configured.
 */
export function getMenuConfig(): MenuGroupConfig[] {
  const config = import.meta.env.VITE_MENU_CONFIG
  if (!config) {
    return []
  }
  try {
    return JSON.parse(config)
  } catch {
    console.warn('Failed to parse VITE_MENU_CONFIG')
    return []
  }
}
