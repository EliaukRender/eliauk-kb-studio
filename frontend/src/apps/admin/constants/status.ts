import { DocumentStatus, IndexStatus } from '@/types/api'

type TagType = 'default' | 'info' | 'success' | 'warning' | 'error'
type StatusMeta = { label: string; type: TagType }

export const DOCUMENT_STATUS_META: Record<DocumentStatus, StatusMeta> = {
  [DocumentStatus.Pending]: { label: '待同步', type: 'warning' },
  [DocumentStatus.Indexed]: { label: '已入库', type: 'success' },
  [DocumentStatus.Failed]: { label: '失败', type: 'error' },
  [DocumentStatus.Deleted]: { label: '已删除', type: 'default' },
}

export const INDEX_STATUS_META: Record<IndexStatus, StatusMeta> = {
  [IndexStatus.Building]: { label: '构建中', type: 'info' },
  [IndexStatus.Evaluating]: { label: '评估中', type: 'info' },
  [IndexStatus.Ready]: { label: '可用', type: 'success' },
  [IndexStatus.Failed]: { label: '失败', type: 'error' },
}
