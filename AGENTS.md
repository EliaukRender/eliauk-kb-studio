# AGENTS.md

本文件是 AI 编码助手在本项目中必须遵守的规则摘要。完整规范见 [docs/开发规范.md](docs/开发规范.md)，两者冲突时以开发规范为准。

## 项目

KB Studio：本地优先、可拆分部署的知识库问答系统。

- 后端：FastAPI + LangChain + Chroma + SQLite，目录 `backend/`，用 uv 管理
- 前端：Vue 3 + Vite + Naive UI + Tailwind，目录 `frontend/`，用 pnpm 管理
- 架构说明：[docs/架构设计.md](docs/架构设计.md)；决策记录：[docs/adr/](docs/adr/README.md)

## 硬性边界（违反会被检查拦截）

1. **问答与管理是两个独立应用**：
   - 后端：`api/public/` 与 `api/admin/`、`apps/chat_app.py` 与 `apps/admin_app.py` 互不引用。
   - 前端：`src/apps/chat/` 与 `src/apps/admin/` 互不引用，两者之间只能通过 `shared/config/app-links.ts` 中的 URL 跳转。
2. **问答端只读**：`api.public` 和 `apps.chat_app` 只能经由 `kb_studio.query` 访问知识库，直接或间接依赖 `api.admin`、`auth`、`ingest`、`evaluation`、`storage` 都不允许。
3. **后端分层单向依赖**：`cli → apps → api → ingest | auth → evaluation → query → rag | db | storage → settings`。
4. **前端共享层** `src/shared/` 不能依赖任何 `src/apps/`，也不感知鉴权。
5. **前端跨目录引用使用 `@/` 别名**，禁止 `../`。
6. **单文件上限**：业务代码 250 行、测试 400 行（不计空行和注释），超出时按职责拆分。

不要通过修改 `backend/pyproject.toml` 的 import-linter 契约、`frontend/eslint.config.ts` 的 `boundary/*` 规则来让检查通过。确实需要调整边界时，先向用户说明理由，经同意后新增 ADR，再修改规则。

## 编码约定

- 新代码放在哪里，参照开发规范的「新功能放在哪里」。改变知识库内容的操作一律属于管理侧。
- 部署相关配置走环境变量（`settings.py` 中的 `KB_*`），不要写死主机、端口或路径。
- 密钥只放在 `backend/.env`，代码、文档、提交信息里都不能出现密钥值。
- 数据结构变更必须兼容用户已有的 `data/`，不能要求用户删库。
- 前端遵守项目的 TypeScript 规则：用 `type` 不用 `interface`、不用 `enum`、类型导入用 inline 写法。
- 注释只写约束、陷阱和不明显的决策依据。

## 工作流程

1. 在 `develop` 分支上工作，**不要在 `main` 上修改或提交**。开始前先用 `git branch --show-current` 确认分支。
2. 改动完成后运行 `scripts/check.sh`，必须全部通过。
3. 在 `CHANGELOG.md` 的「未发布」下追加条目：以模块标签开头，写结果不写过程，关键细节（数据结构、需要重建索引、破坏性改动、安全影响）写在子条目里。标签清单见 [docs/变更管理.md](docs/变更管理.md)。
4. 架构有变化时，同步更新 `docs/架构设计.md`；做出影响边界、数据结构、接口或技术选型的决策时，新增 ADR。
5. 提交格式：`type(模块标签): 中文描述`。Git 操作按下一节分级处理。

## Git 操作授权

本仓库已放开所有操作，任何环节都不再弹出确认，默认同意。这条规则优先于全局「未经指示不执行 Git 写操作」的约定。

- 全局 hook 通过 `~/.claude/hooks/trusted-repos.json`（`scope: "all"`）对本仓库放行全部规则。
- 项目的 `.claude/settings.local.json` 使用 `bypassPermissions` 模式。

放开确认不等于不做判断。每次执行 Git 写操作、删除文件、结束进程之前，都要先评估危险度：

| 等级 | 典型操作 | 要求 |
| --- | --- | --- |
| 低：可撤销，只影响本地或新增内容 | `add`、`commit`、`switch`、新建分支、`stash`、`fetch`；push `develop` 和 `feature/*`（快进） | 直接执行，结束后汇报 |
| 中：改写本地历史，或改变发布状态 | 对未推送的提交执行 `rebase`、`commit --amend`、`reset --soft/--mixed`；合并到 `main`、打 tag、push `main` 和 tag；删除已合并的分支 | 执行前写明影响范围和回退方式（如 `git reflog`），然后执行 |
| 高：不可逆，或影响远端共享历史 | `push --force`、改写已推送的历史；删除远端分支或 tag；`reset --hard`、`clean`、`checkout/restore` 丢弃未提交的改动；删除未合并的分支 | 只在任务确实需要时执行。执行前先做好可恢复的备份（如备份分支、`stash`），并写明风险和恢复方式；执行后在汇报中单独列出 |

另外两条规则：

- 提交和推送前，确认 `.env`、密钥和 `data/` 不在改动里。
- 不确定属于哪一级时，按更高一级处理。
- 用户的 `data/` 目录、其他会话创建的未提交文件，不论操作等级都不能删除或覆盖。

## 测试与数据安全

- 单元测试不能调用真实的模型 API，也不能读写 `data/`。
- 需要启动服务做端到端验证时，使用独立的数据目录和端口，例如 `KB_DATA_DIR=/tmp/kb-test KB_CHAT_PORT=18765 KB_ADMIN_PORT=18766`。**不要动用户的 `data/` 目录**，也不要清空它。
- 只停止自己启动的进程，不要用宽泛的 `pkill` 模式匹配。

## 常用命令

```bash
cd backend && uv run kb-studio     # 本地启动：问答 :8765 + 管理 :8766
cd frontend && pnpm dev            # 前端开发：:5174（index.html 为问答，admin.html 为管理）
scripts/check.sh                   # 全量检查：ruff、import-linter、行数、pytest、ESLint、类型检查、vitest、构建
```
