import { useAdminSessionStore } from '@/apps/admin/stores/session'
import { createHttpClient } from '@/shared/api/http-client'

// 管理端请求统一携带登录 token，401 时清除本地登录态
export const { get, post, put, del } = createHttpClient({
  getToken: () => useAdminSessionStore().token,
  onUnauthorized: () => useAdminSessionStore().clear(),
})
