import type { Source } from '@/shared/types/rag'

export const DocumentStatus = {
  Pending: 'pending',
  Indexed: 'indexed',
  Failed: 'failed',
  Deleted: 'deleted',
} as const
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus]

export type KbDocument = {
  id: number
  filename: string
  current_version: number
  content_hash: string
  status: DocumentStatus
  chunk_count: number
  error: string | null
  updated_at: string
}

export type DocumentVersion = {
  doc_id: number
  version: number
  content_hash: string
  raw_path: string
  created_at: string
}

export type UploadResult = {
  filename: string
  action: 'created' | 'updated' | 'skipped' | 'rejected'
  document?: KbDocument
  error?: string
}

export const IndexStatus = {
  Building: 'building',
  Evaluating: 'evaluating',
  Ready: 'ready',
  Failed: 'failed',
} as const
export type IndexStatus = (typeof IndexStatus)[keyof typeof IndexStatus]

export type IndexVersion = {
  id: number
  collection: string
  embedding_model: string
  chunk_size: number
  chunk_overlap: number
  status: IndexStatus
  doc_count: number
  chunk_count: number
  eval_pass_rate: number | null
  error: string | null
  created_at: string
}

export type IndexList = {
  current_id: number | null
  items: IndexVersion[]
}

export type EvalCase = {
  id: number
  question: string
  expected_keywords: string[]
  should_refuse: boolean
}

export type EvalResult = {
  case_id: number
  question: string
  expected_keywords: string[]
  should_refuse: boolean
  answer: string
  passed: boolean
  sources: Source[]
}

export type EvalReport = {
  index_id: number
  pass_rate: number | null
  passed: number
  total: number
  results: EvalResult[]
}

export type RuntimeSettings = {
  embedding_model: string
  chunk_size: number
  chunk_overlap: number
  top_k: number
  score_threshold: number
}
