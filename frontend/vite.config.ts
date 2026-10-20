/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'

// 与 backend/src/kb_studio/settings.py 的默认端口一致：问答 8765、管理 8766
const CHAT_API = 'http://127.0.0.1:8765'
const ADMIN_API = 'http://127.0.0.1:8766'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      dts: 'src/components.d.ts',
      // 图标组件用法：<i-ri-send-plane-fill />，构建期内联 SVG，离线可用
      resolvers: [NaiveUiResolver(), IconsResolver({ prefix: 'i', enabledCollections: ['ri'] })],
    }),
    Icons({ compiler: 'vue3', autoInstall: false }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    // 按前缀分流到两个后端应用；更具体的前缀必须写在前面
    proxy: { '/api/admin': ADMIN_API, '/api': CHAT_API },
  },
  // 两个入口分别构建，对应后端两个应用；共享代码会被拆成公共 chunk
  build: {
    rollupOptions: {
      input: {
        chat: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
  },
})
