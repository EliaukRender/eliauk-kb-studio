import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type HttpClientOptions = {
  /** 每次请求时读取，返回空字符串表示不带 Authorization */
  getToken?: () => string
  onUnauthorized?: () => void
}

/** FastAPI 的 detail 可能是字符串，也可能是参数校验错误数组 */
function extractDetail(data: unknown): string | undefined {
  const detail = (data as { detail?: unknown } | undefined)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d: { msg?: string }) => d.msg).join('；')
  return undefined
}

/**
 * 各应用各自创建客户端：共享层不感知鉴权状态，token 与 401 处理由使用方注入，
 * 这样问答端不会间接依赖管理端的登录逻辑。
 */
export function createHttpClient(options: HttpClientOptions = {}) {
  const instance = axios.create({ baseURL: '/api', timeout: 120_000 })

  instance.interceptors.request.use((config) => {
    const token = options.getToken?.()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  async function request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      return (await instance.request<T>(config)).data
    } catch (error) {
      if (!isAxiosError(error)) throw new ApiError(String(error))
      const status = error.response?.status
      if (status === 401) options.onUnauthorized?.()
      throw new ApiError(extractDetail(error.response?.data) ?? error.message, status)
    }
  }

  return {
    get: <T>(url: string) => request<T>({ method: 'GET', url }),
    post: <T>(url: string, data?: unknown) => request<T>({ method: 'POST', url, data }),
    put: <T>(url: string, data?: unknown) => request<T>({ method: 'PUT', url, data }),
    del: <T>(url: string) => request<T>({ method: 'DELETE', url }),
  }
}
