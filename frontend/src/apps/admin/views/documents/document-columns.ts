import { type DataTableColumns, NButton, NSpace, NTag, NTooltip } from 'naive-ui'
import { h } from 'vue'

import { DOCUMENT_STATUS_META } from '@/apps/admin/constants/status'
import type { KbDocument } from '@/apps/admin/types'
import { formatTime } from '@/shared/utils/format'

type RowActions = {
  versions: (doc: KbDocument) => void
  reindex: (doc: KbDocument) => void
  remove: (doc: KbDocument) => void
}

function renderStatus(doc: KbDocument) {
  const meta = DOCUMENT_STATUS_META[doc.status]
  const tag = h(NTag, { type: meta.type, size: 'small', bordered: false }, () => meta.label)
  if (!doc.error) return tag
  return h(NTooltip, null, { trigger: () => tag, default: () => doc.error })
}

export function createDocumentColumns(actions: RowActions): DataTableColumns<KbDocument> {
  return [
    { type: 'selection' },
    { title: '文件名', key: 'filename', ellipsis: { tooltip: true } },
    { title: '版本', key: 'current_version', width: 70, render: (d) => `v${d.current_version}` },
    { title: '状态', key: 'status', width: 90, render: renderStatus },
    { title: '块数', key: 'chunk_count', width: 70 },
    { title: '更新时间', key: 'updated_at', width: 170, render: (d) => formatTime(d.updated_at) },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (d) =>
        h(NSpace, { size: 'small' }, () => [
          h(NButton, { size: 'tiny', onClick: () => actions.versions(d) }, () => '版本'),
          h(NButton, { size: 'tiny', onClick: () => actions.reindex(d) }, () => '重新入库'),
          h(
            NButton,
            { size: 'tiny', type: 'error', ghost: true, onClick: () => actions.remove(d) },
            () => '删除',
          ),
        ]),
    },
  ]
}
