export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** 后端时间是不带时区的 ISO 字符串（本地时间），只做展示层格式化 */
export function formatTime(iso: string): string {
  return iso.replace('T', ' ')
}

export function formatPercent(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)}%`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
