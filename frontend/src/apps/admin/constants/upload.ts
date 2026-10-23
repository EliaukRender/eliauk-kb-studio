import type { UploadPhase } from '@/apps/admin/composables/useUploadQueue'

// 与后端 settings.UPLOAD_MAX_FILES / UPLOAD_MAX_FILE_BYTES / SUPPORTED_SUFFIXES 保持一致
export const UPLOAD_MAX_FILES = 10
export const UPLOAD_MAX_FILE_BYTES = 10 * 1024 * 1024
export const UPLOAD_ACCEPT_SUFFIXES = ['.md', '.txt']

type TagType = 'default' | 'info' | 'success' | 'warning' | 'error'

export const UPLOAD_PHASE_META: Record<UploadPhase, { label: string; type: TagType }> = {
  waiting: { label: '等待中', type: 'default' },
  uploading: { label: '上传中', type: 'info' },
  ingesting: { label: '入库中', type: 'info' },
  done: { label: '完成', type: 'success' },
  failed: { label: '失败', type: 'error' },
  canceled: { label: '已取消', type: 'warning' },
}

export const UPLOAD_ACTION_LABEL = {
  created: '新增',
  updated: '新版本',
  skipped: '内容未变，已跳过',
  rejected: '已拒绝',
} as const
