# 更新日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。
每条以模块标签开头，书写规范与标签清单见 [变更管理](./docs/变更管理.md)。

## [未发布]

### 新增

- `server` 问答与管理拆分为两个独立应用：问答 `:8765`（只读）、管理 `:8766`（读写加鉴权），各自只托管自己的前端入口页（[ADR 0007](./docs/adr/0007-应用边界与可拆分部署.md)）
  - `kb-studio` 在同一进程中启动两个应用；`kb-studio-chat`、`kb-studio-admin` 用于分进程部署
  - 部署配置改为环境变量：`KB_HOST`、`KB_CHAT_PORT`、`KB_ADMIN_PORT`、`KB_DATA_DIR`、`KB_CHROMA_URL`、`KB_FRONTEND_DIST`
- `query` 只读查询层：问答端和回归测试共用同一条检索与生成链路
- `rag` 支持 Chroma 服务端（`KB_CHROMA_URL`），分进程部署时必须使用；本地客户端改为按进程缓存
- `web-shared` / `web-chat` / `web-admin` 前端改为多页构建：`index.html`（问答）、`admin.html`（管理）、`src/shared`（共享层）
  - 应用地址可在构建时用 `VITE_CHAT_URL`、`VITE_ADMIN_URL` 配置，`VITE_SECRET_ENTRY=false` 可关闭隐藏入口
- `build` 架构边界自动检查：后端 import-linter（4 条契约）、前端 ESLint `boundary/*` 规则；`scripts/check.sh` 一键执行全部检查
- `build` 后端接入 ruff，并检查单文件行数上限
- `docs` 架构设计、开发规范、变更管理、ADR 0001–0007；`AGENTS.md` / `CLAUDE.md` 约束 AI 辅助开发

### 变更

- **破坏性** `web-admin` 后台地址由 `:8765/#/admin` 改为 `:8766`；登录由问答页内的弹窗改为管理应用的独立登录页，未登录时跳转登录页并保留来源页
- `web-chat` 隐藏入口只负责跳转到后台地址，问答应用不再包含任何管理端代码
- **破坏性** `server` 后端入口由 `kb_studio.main:app` 改为 `kb_studio.cli`（`kb_studio.apps.chat_app:app`、`kb_studio.apps.admin_app:app`）

## [0.1.0] - 2026-10-20

首个版本：本地运行的知识库问答客户端，覆盖问答、文档管理、索引版本与回归测试。

### 新增

- `rag` 问答链路：检索 → 相关度阈值过滤 → DeepSeek 生成回答，答案标注来源（[ADR 0005](./docs/adr/0005-相关度阈值过滤.md)）
  - 切分：先按 Markdown 标题（h1–h3），再按长度递归切分；块元数据包含 `doc_id`、`version`、`source`、`section`
  - Embedding 使用百炼 OpenAI 兼容接口，必须设置 `check_embedding_ctx_length=False`、`chunk_size=10`
- `ingest` 增量入库：按 SHA-256 判断内容是否变化，按 `doc_id` 替换块，只影响变化的文档（[ADR 0003](./docs/adr/0003-增量入库与稳定块ID.md)）
  - 块 ID 固定为 `{doc_id}:{序号}`
- `ingest` 文档版本化：每次内容变化追加版本，支持回退到任意历史版本；删除为软删除
- `ingest` 索引版本：按当前参数构建新的 collection，构建后自动跑回归测试，人工切换，切回旧版本即回退（[ADR 0002](./docs/adr/0002-索引版本蓝绿切换.md)）
  - 索引状态：`building → evaluating → ready`，失败时为 `failed`
  - 构建参数随版本固化，增量入库沿用该版本自己的参数
- `eval` 回归测试：关键词与拒答两类用例，内置 6 条种子用例（[ADR 0006](./docs/adr/0006-回归测试关键词判定.md)）
- `db` / `storage` 本地三层数据：SQLite 元数据库、`data/raw/` 原文件存储、Chroma 向量库（[ADR 0001](./docs/adr/0001-本地三层数据架构.md)）
- `auth` 管理员密码（scrypt 加盐）与内存 token，有效期 8 小时；管理接口统一鉴权（[ADR 0004](./docs/adr/0004-暗门入口与管理员鉴权.md)）
- `api` 问答接口为 SSE 流，事件依次为 `sources` → `token` → `done`，出错时为 `error`；管理接口位于 `/api/admin/*`
- `web-chat` 问答界面：流式输出、可展开查看检索片段与相关度、清空对话
- `web-chat` 三个后台隐藏入口：`Cmd/Ctrl+Shift+A`、连点 Logo 5 次、问答框输入 `/admin`
- `web-admin` 管理后台：文档管理（上传、版本历史、回退、重新入库、删除）、索引版本、回归测试、参数设置
- `build` 后端只监听 `127.0.0.1:8765`；生产模式由后端托管前端构建产物，开发模式由 Vite 代理 `/api`

[未发布]: #未发布
[0.1.0]: #010---2026-10-20
