import {
  UPLOAD_ACCEPT_SUFFIXES,
  UPLOAD_MAX_FILE_BYTES,
  UPLOAD_MAX_FILES,
} from '@/apps/admin/constants/upload'

type FileLike = { name: string; size: number }

/** 校验新选择的文件：返回可加入队列的文件和逐条拒绝原因。queued 为队列中已有的文件名 */
export function validateSelection<T extends FileLike>(
  queued: string[],
  files: T[],
): { accepted: T[]; errors: string[] } {
  const accepted: T[] = []
  const errors: string[] = []
  const names = new Set(queued)
  for (const file of files) {
    const suffix = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!UPLOAD_ACCEPT_SUFFIXES.includes(suffix)) {
      errors.push(`${file.name}：只支持 ${UPLOAD_ACCEPT_SUFFIXES.join(' / ')} 文件`)
    } else if (file.size > UPLOAD_MAX_FILE_BYTES) {
      errors.push(`${file.name}：超过 ${UPLOAD_MAX_FILE_BYTES / 1024 / 1024}MB`)
    } else if (names.has(file.name)) {
      errors.push(`${file.name}：已在列表中`)
    } else if (names.size >= UPLOAD_MAX_FILES) {
      errors.push(`${file.name}：一次最多选择 ${UPLOAD_MAX_FILES} 个文件`)
    } else {
      names.add(file.name)
      accepted.push(file)
    }
  }
  return { accepted, errors }
}
