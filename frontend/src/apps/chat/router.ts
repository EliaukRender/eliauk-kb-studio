import { createRouter, createWebHashHistory } from 'vue-router'

import { useAdminStore } from '@/stores/admin'

// 用 hash 模式：生产环境由 FastAPI 托管静态文件，刷新 /admin/* 不会 404
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'chat', component: () => import('@/views/chat/ChatView.vue') },
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      redirect: { name: 'admin-documents' },
      children: [
        {
          path: 'documents',
          name: 'admin-documents',
          component: () => import('@/views/admin/documents/DocumentsView.vue'),
        },
        {
          path: 'indexes',
          name: 'admin-indexes',
          component: () => import('@/views/admin/indexes/IndexesView.vue'),
        },
        {
          path: 'eval',
          name: 'admin-eval',
          component: () => import('@/views/admin/eval/EvalView.vue'),
        },
        {
          path: 'settings',
          name: 'admin-settings',
          component: () => import('@/views/admin/settings/SettingsView.vue'),
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

// 未登录直接访问后台地址时退回问答页，不暴露后台存在
router.beforeEach((to) => {
  if (to.matched.some((r) => r.meta.requiresAdmin) && !useAdminStore().isLoggedIn) {
    return { name: 'chat' }
  }
})
