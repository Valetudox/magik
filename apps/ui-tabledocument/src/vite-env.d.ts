/// <reference types="vite/client" />

type ImportMetaEnv = {
  readonly VITE_API_URL?: string
  readonly VITE_SOCKET_URL?: string
  readonly BASE_URL: string
}

type ImportMeta = {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>
  export default component
}
