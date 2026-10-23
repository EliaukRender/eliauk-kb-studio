import { del, get, post, put } from '@/apps/admin/api/http'
import type {
  DocumentPage,
  DocumentQuery,
  DocumentVersion,
  EvalCase,
  EvalReport,
  IndexList,
  IndexVersion,
  KbDocument,
  RuntimeSettings,
  UploadResult,
} from '@/apps/admin/types'

type TokenResponse = { token: string }

export const authApi = {
  status: () => get<{ initialized: boolean }>('/admin/auth/status'),
  setup: (password: string) => post<TokenResponse>('/admin/auth/setup', { password }),
  login: (password: string) => post<TokenResponse>('/admin/auth/login', { password }),
  logout: () => post<void>('/admin/auth/logout'),
}

export const documentsApi = {
  list: ({ page, pageSize, keyword }: DocumentQuery) => {
    const query = new URLSearchParams({ page: String(page), page_size: String(pageSize), keyword })
    return get<DocumentPage>(`/admin/documents?${query}`)
  },
  upload: (files: File[]) => {
    const form = new FormData()
    files.forEach((f) => form.append('files', f))
    return post<UploadResult[]>('/admin/documents', form)
  },
  versions: (id: number) => get<DocumentVersion[]>(`/admin/documents/${id}/versions`),
  rollback: (id: number, version: number) =>
    post<KbDocument>(`/admin/documents/${id}/rollback`, { version }),
  reindex: (id: number) => post<KbDocument>(`/admin/documents/${id}/reindex`),
  remove: (id: number) => del<void>(`/admin/documents/${id}`),
  batchRemove: (ids: number[]) =>
    post<{ deleted: number[] }>('/admin/documents/batch-delete', { ids }),
}

export const indexesApi = {
  list: () => get<IndexList>('/admin/indexes'),
  rebuild: () => post<IndexVersion>('/admin/indexes/rebuild'),
  activate: (id: number) => post<IndexVersion>(`/admin/indexes/${id}/activate`),
  remove: (id: number) => del<void>(`/admin/indexes/${id}`),
}

export const evalApi = {
  cases: () => get<EvalCase[]>('/admin/eval/cases'),
  createCase: (data: Omit<EvalCase, 'id'>) => post<{ id: number }>('/admin/eval/cases', data),
  removeCase: (id: number) => del<void>(`/admin/eval/cases/${id}`),
  run: (indexId?: number) => post<EvalReport>('/admin/eval/run', { index_id: indexId ?? null }),
}

export const settingsApi = {
  get: () => get<RuntimeSettings>('/admin/settings'),
  update: (data: RuntimeSettings) => put<RuntimeSettings>('/admin/settings', data),
}
