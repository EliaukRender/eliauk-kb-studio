/// <reference types="vite/client" />

import 'vue-router'

declare global {
  interface ImportMetaEnv {
    readonly VITE_CHAT_URL?: string
    readonly VITE_ADMIN_URL?: string
    readonly VITE_SECRET_ENTRY?: string
  }
}

declare module 'vue-router' {
  interface RouteMeta {
    requiresAdmin?: boolean
  }
}
