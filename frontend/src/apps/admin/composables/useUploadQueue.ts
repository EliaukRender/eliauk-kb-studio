import { computed, ref } from 'vue'

import { documentsApi } from '@/apps/admin/api/admin'
import type { UploadResult } from '@/apps/admin/types'
import { validateSelection } from '@/apps/admin/utils/upload-validate'
import { errorMessage } from '@/shared/utils/format'

export type UploadPhase = 'waiting' | 'uploading' | 'ingesting' | 'done' | 'failed' | 'canceled'

export type UploadItem = {
  id: number
  file: File
  phase: UploadPhase
  /** 传输进度 0–100；传完后进入入库阶段，入库耗时无法预估，不再细分 */
  percent: number
  result?: UploadResult
  error?: string
}

const FINISHED: UploadPhase[] = ['done', 'failed', 'canceled']
let nextId = 0

/** 单个文件在总进度中的完成度：传输占前一半，入库占后一半 */
export function itemProgress(item: Pick<UploadItem, 'phase' | 'percent'>): number {
  if (FINISHED.includes(item.phase)) return 1
  if (item.phase === 'uploading') return (item.percent / 100) * 0.5
  if (item.phase === 'ingesting') return 0.5
  return 0
}

export function useUploadQueue(onFinished?: () => void) {
  const items = ref<UploadItem[]>([])
  const running = ref(false)
  let controller: AbortController | null = null

  const finishedCount = computed(() => items.value.filter((i) => FINISHED.includes(i.phase)).length)
  const waitingCount = computed(() => items.value.filter((i) => i.phase === 'waiting').length)
  const totalPercent = computed(() => {
    if (!items.value.length) return 0
    const sum = items.value.reduce((acc, i) => acc + itemProgress(i), 0)
    return Math.round((sum / items.value.length) * 100)
  })

  function add(files: File[]): string[] {
    const { accepted, errors } = validateSelection(
      items.value.map((i) => i.file.name),
      files,
    )
    for (const file of accepted) {
      items.value.push({ id: nextId++, file, phase: 'waiting', percent: 0 })
    }
    return errors
  }

  function remove(id: number) {
    if (!running.value) items.value = items.value.filter((i) => i.id !== id)
  }

  function clear() {
    if (!running.value) items.value = []
  }

  async function uploadOne(item: UploadItem, signal: AbortSignal) {
    item.phase = 'uploading'
    try {
      const [result] = await documentsApi.upload([item.file], {
        signal,
        onUploadProgress: (e) => {
          item.percent = e.total ? Math.round((e.loaded / e.total) * 100) : item.percent
          if (e.loaded === e.total) item.phase = 'ingesting'
        },
      })
      item.result = result
      item.error = result.error ?? result.document?.error ?? undefined
      item.phase = result.action === 'rejected' || item.error ? 'failed' : 'done'
    } catch (e) {
      item.phase = signal.aborted ? 'canceled' : 'failed'
      if (!signal.aborted) item.error = errorMessage(e)
    }
  }

  // 逐个上传：入库会调用 Embedding 接口并写 SQLite / Chroma，串行可避免限流和写冲突
  async function start() {
    if (running.value) return
    running.value = true
    controller = new AbortController()
    try {
      for (const item of items.value) {
        if (controller.signal.aborted) break
        // 必须通过响应式数组取元素再修改，才能触发进度更新
        if (item.phase === 'waiting') await uploadOne(item, controller.signal)
      }
    } finally {
      for (const item of items.value) if (item.phase === 'waiting') item.phase = 'canceled'
      running.value = false
      controller = null
      onFinished?.()
    }
  }

  /** 取消正在传输的文件和后面排队的文件；已经进入入库阶段的文件后端仍会处理完 */
  function cancel() {
    controller?.abort()
  }

  return {
    items,
    running,
    finishedCount,
    waitingCount,
    totalPercent,
    add,
    remove,
    clear,
    start,
    cancel,
  }
}
