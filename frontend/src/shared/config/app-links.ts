/**
 * 两个应用之间只通过 URL 互相跳转，不共享路由和运行时状态，见 ADR 0007。
 * 开发时由同一个 Vite 服务提供两个入口页；生产默认对应后端的两个端口，部署时用环境变量覆盖。
 */
export const CHAT_URL =
  import.meta.env.VITE_CHAT_URL || (import.meta.env.DEV ? '/' : 'http://127.0.0.1:8765/')

export const ADMIN_URL =
  import.meta.env.VITE_ADMIN_URL || (import.meta.env.DEV ? '/admin.html' : 'http://127.0.0.1:8766/')

/** 生产部署时后台有独立域名，可关闭问答端的隐藏入口 */
export const SECRET_ENTRY_ENABLED = import.meta.env.VITE_SECRET_ENTRY !== 'false'
