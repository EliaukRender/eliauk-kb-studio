// 零宽字符、BOM，以及除 \t \n 以外的 C0/C1 控制字符
const INVISIBLE_CHARS =
  // eslint-disable-next-line no-control-regex
  /[\u200B-\u200D\u2060\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g
// 推理模型可能输出思考过程；流式期间只有开标签时，丢弃其后的全部内容
const THINK_BLOCK = /<think>[\s\S]*?(<\/think>|$)/g

/** 渲染前的文本规范化。只用于展示派生，不修改原文；对同一输入幂等 */
export function normalizeAnswer(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(INVISIBLE_CHARS, '')
    .replace(THINK_BLOCK, '')
    .trimStart()
}
