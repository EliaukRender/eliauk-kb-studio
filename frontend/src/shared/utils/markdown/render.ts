import DOMPurify from 'dompurify'
import MarkdownIt from 'markdown-it'
import cjkFriendly from 'markdown-it-cjk-friendly'
import remend from 'remend'

import { normalizeAnswer } from './normalize'

// html:false 与 DOMPurify 是两层独立防护，任一层被误改另一层仍然兜底
const md = new MarkdownIt({ html: false, linkify: true, breaks: true, typographer: false })
  .use(cjkFriendly)
  // 模型输出的图片可把检索内容拼进 URL 外带出去，统一不渲染
  .disable('image')

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  'del',
  's',
  'code',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'a',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
]

const purify = DOMPurify()
purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer nofollow')
  }
})

export type RenderOptions = { streaming?: boolean }

// remend 无法补全后面还没有内容的开标记（如文本以 `每年 **` 结尾），会短暂显示为裸符号。
// 先去掉末尾的强调标记；即使它是闭标记，去掉后也会由 remend 重新补上，结果不变
const DANGLING_MARKER = /(\*{1,3}|_{1,3}|~{1,2})\s*$/

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/** 原文 → 规范化 →（流式时）补全未闭合语法 → 解析 → 消毒，返回可直接 v-html 的 HTML */
export function renderMarkdown(text: string, { streaming = false }: RenderOptions = {}): string {
  try {
    const normalized = normalizeAnswer(text)
    // 只在流式期间补全，结束后的原文按原样解析，避免把合法文本改坏
    const source = streaming
      ? remend(normalized.replace(DANGLING_MARKER, ''), { linkMode: 'text-only', images: false })
      : normalized
    return purify.sanitize(md.render(source), {
      ALLOWED_TAGS,
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    })
  } catch {
    return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`
  }
}
