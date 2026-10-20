import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { useSecretEntry } from '@/apps/chat/composables/useSecretEntry'
import { LOGO_CLICK_TARGET, LOGO_CLICK_WINDOW_MS } from '@/apps/chat/constants/secret-entry'

function setup() {
  const onTrigger = vi.fn()
  let api!: ReturnType<typeof useSecretEntry>
  const wrapper = mount(
    defineComponent({
      setup() {
        api = useSecretEntry(onTrigger)
        return () => null
      },
    }),
  )
  return { onTrigger, api, wrapper }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('useSecretEntry', () => {
  it('Cmd/Ctrl + Shift + A 触发', () => {
    const { onTrigger, wrapper } = setup()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', metaKey: true, shiftKey: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, shiftKey: true }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true }))
    expect(onTrigger).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('组件卸载后不再监听快捷键', () => {
    const { onTrigger, wrapper } = setup()
    wrapper.unmount()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true, shiftKey: true }))
    expect(onTrigger).not.toHaveBeenCalled()
  })

  it('时间窗口内连点 Logo 达到次数才触发', () => {
    vi.useFakeTimers()
    const { onTrigger, api, wrapper } = setup()
    for (let i = 0; i < LOGO_CLICK_TARGET - 1; i++) api.handleLogoClick()
    expect(onTrigger).not.toHaveBeenCalled()
    api.handleLogoClick()
    expect(onTrigger).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('点击间隔超过时间窗口会重新计数', () => {
    vi.useFakeTimers()
    const { onTrigger, api, wrapper } = setup()
    for (let i = 0; i < LOGO_CLICK_TARGET - 1; i++) api.handleLogoClick()
    vi.advanceTimersByTime(LOGO_CLICK_WINDOW_MS + 1)
    api.handleLogoClick()
    expect(onTrigger).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('/admin 命令被拦截，普通问题放行', () => {
    const { onTrigger, api, wrapper } = setup()
    expect(api.interceptCommand('  /Admin ')).toBe(true)
    expect(api.interceptCommand('年假有几天？')).toBe(false)
    expect(onTrigger).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
