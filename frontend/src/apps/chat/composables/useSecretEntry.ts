import { useEventListener } from '@vueuse/core'

import {
  ADMIN_COMMAND,
  LOGO_CLICK_TARGET,
  LOGO_CLICK_WINDOW_MS,
} from '@/apps/chat/constants/secret-entry'
import { SECRET_ENTRY_ENABLED } from '@/shared/config/app-links'

/**
 * 后台的三个隐藏入口：Cmd/Ctrl+Shift+A、连点 Logo、问答框输入 /admin。
 * 入口只是不显眼，真正的访问控制在后端的管理员密码。
 */
export function useSecretEntry(onTrigger: () => void, enabled = SECRET_ENTRY_ENABLED) {
  let clickCount = 0
  let firstClickAt = 0

  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (!enabled) return
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
      e.preventDefault()
      onTrigger()
    }
  })

  function handleLogoClick() {
    if (!enabled) return
    const now = Date.now()
    if (now - firstClickAt > LOGO_CLICK_WINDOW_MS) {
      clickCount = 0
      firstClickAt = now
    }
    clickCount += 1
    if (clickCount >= LOGO_CLICK_TARGET) {
      clickCount = 0
      onTrigger()
    }
  }

  /** 是暗门命令时触发并返回 true，调用方据此跳过正常提问 */
  function interceptCommand(text: string): boolean {
    if (!enabled || text.trim().toLowerCase() !== ADMIN_COMMAND) return false
    onTrigger()
    return true
  }

  return { handleLogoClick, interceptCommand }
}
