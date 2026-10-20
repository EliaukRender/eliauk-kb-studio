import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'

import { useAdminStore } from '@/stores/admin'

export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const http = axios.create({ baseURL: '/api', timeout: 120_000 })

http.interceptors.request.use((config) => {
  const { token } = useAdminStore()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** FastAPI 的 detail 可能是字符串，也可能是参数校验错误数组 */
function extractDetail(data: unknown): string | undefined {
  const detail = (data as { detail?: unknown } | undefined)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d: { msg?: string }) => d.msg).join('；')
  return undefined
}

function toApiError(error: unknown): ApiError {
  if (!isAxiosError(error)) return new ApiError(String(error))
  const status = error.response?.status
  if (status === 401) useAdminStore().clear()
  return new ApiError(extractDetail(error.response?.data) ?? error.message, status)
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    return (await http.request<T>(config)).data
  } catch (error) {
    throw toApiError(error)
  }
}

export const get = <T>(url: string) => request<T>({ method: 'GET', url })
export const post = <T>(url: string, data?: unknown) => request<T>({ method: 'POST', url, data })
export const put = <T>(url: string, data?: unknown) => request<T>({ method: 'PUT', url, data })
export const del = <T>(url: string) => request<T>({ method: 'DELETE', url })
