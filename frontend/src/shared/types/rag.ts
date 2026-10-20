/** 检索命中的片段，问答接口与回归测试结果共用同一结构 */
export type Source = {
  source: string
  section: string
  version: number | null
  score: number
  content: string
}
