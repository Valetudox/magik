/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_API_URL?: string
  readonly BASE_URL?: string
}

type ImportMeta = {
  readonly env: ImportMetaEnv
}
