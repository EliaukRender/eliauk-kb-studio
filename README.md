# KB Studio

本地知识库客户端，用来在一台电脑上完整体验工程化 RAG 的全链路：文档管理、增量入库、索引版本与回退、回归评估。

- 默认界面是知识库问答，答案带来源和检索片段的相关度分数
- 通过“暗门”进入管理后台，后台有管理员密码保护
- 不依赖任何服务器：SQLite 充当元数据库，本地目录充当对象存储，Chroma 充当向量库

## 快速开始

需要 Python 3.12+（用 [uv](https://docs.astral.sh/uv/) 管理）、Node 22+、pnpm。

```bash
# 1. 配置密钥：DeepSeek（回答）+ 阿里百炼（向量化）
cp backend/.env.example backend/.env   # 填写 DEEPSEEK_API_KEY、DASHSCOPE_API_KEY

# 2. 启动后端（监听 127.0.0.1:8765）
cd backend && uv run kb-studio
```

前端有两种运行方式：

| 方式 | 命令 | 访问地址 |
| --- | --- | --- |
| 开发模式（热更新） | `cd frontend && pnpm install && pnpm dev` | <http://127.0.0.1:5174> |
| 生产模式 | `cd frontend && pnpm build`，然后重启后端 | <http://127.0.0.1:8765> |

生产模式下由后端直接托管 `frontend/dist`，只需要启动一个进程。

## 进入管理后台

三个隐藏入口，任选其一：

- 在问答框输入 `/admin` 后回车
- 连续点击左上角 Logo 5 次（2 秒内）
- 按 `Cmd + Shift + A`（Windows 为 `Ctrl + Shift + A`）

第一次进入需要设置管理员密码，之后每次输入密码登录。登录状态保存在浏览器标签页里，关闭标签页或重启后端后需要重新登录。直接访问 `#/admin` 地址会被退回问答页。

> 暗门只是把入口藏起来，真正起保护作用的是密码。后端只监听本机回环地址，局域网内其他设备无法访问。

## 后台功能

| 页面 | 功能 |
| --- | --- |
| 文档管理 | 上传 `.md` / `.txt`；同名文件内容有变化时生成新版本，**只重新入库这一个文档**；内容没变直接跳过；查看版本历史并回退；软删除 |
| 索引版本 | 用当前参数重建一个新索引（新 collection），自动跑回归测试；手动“设为当前”；切回旧版本即可回退 |
| 回归测试 | 维护“问题 + 期望关键词 / 期望拒答”用例，对任意索引版本运行并查看每条结果和命中的片段 |
| 参数设置 | Embedding 模型、分块大小与重叠（重建索引后生效）；Top K、相关度阈值（立即生效） |

## 架构：本地如何对应工程化方案

完整的模块划分、数据模型、状态机、核心流程和设计取舍见 [docs/架构设计.md](docs/架构设计.md)。

```
原始数据（真相源）          元数据库                        向量库（派生索引）
data/raw/<doc_id>/v<n>/  →  data/app.db（SQLite）       →  data/chroma/（Chroma）
每个版本单独保存，可回退      文档登记、版本、索引版本、       每个索引版本一个 collection：
                            运行参数、回归用例              kb_v1、kb_v2 …
```

| 工程化角色 | 生产常见选型 | 本项目 |
| --- | --- | --- |
| 对象存储 | OSS / S3 | `data/raw/` 目录 |
| 元数据库 | MySQL / PostgreSQL | SQLite |
| 向量库 | Milvus / Qdrant | Chroma 本地持久化 |
| 索引别名切换 | collection alias | `kv.current_index_id` 指针 |
| 入库任务队列 | Celery / MQ | FastAPI BackgroundTasks |
| 质量门槛 | 评估流水线 | 回归测试用例 + 关键词判定 |

### 关键设计

- **增量入库**：按 SHA-256 内容哈希判断是否变化；块 ID 固定为 `{doc_id}:{序号}`，更新时先按 `doc_id` 删除旧块再写入新块。
- **蓝绿切换**：重建索引不影响线上正在用的版本，确认回归通过率后再切换；旧版本保留，可随时切回。
- **增量更新只作用于当前索引**：其他索引版本相当于快照。切换到旧快照后，之后新增或修改过的文档会显示为“待同步”，点“重新入库”即可补齐。
- **相关度阈值**：低于阈值的片段不交给模型；阈值和 Embedding 模型绑定，换模型后要重新校准。

## 目录结构

```
backend/src/kb_studio/
  api/           路由：问答（SSE 流式）、鉴权、文档、索引、回归测试、设置
  db/            SQLite 表结构与各表的读写
  storage/       原文件按版本落盘
  rag/           模型工厂、切分、向量库、检索与回答
  ingest/        增量入库、索引版本状态、全量重建
  evaluation/    回归测试与判定规则
  auth.py        管理员密码（scrypt）与登录 token
frontend/src/
  api/           后端接口封装；chat.ts 用 fetch 读取 SSE 流
  composables/   useSecretEntry（暗门）、useChatStream（流式问答）
  views/chat/    问答页
  views/admin/   后台四个页面
data/            运行时数据（已 gitignore），删掉即恢复到初始状态
```

## 文档

| 文档 | 内容 |
| --- | --- |
| [CHANGELOG.md](CHANGELOG.md) | 各版本的变更，每条带模块标签 |
| [docs/架构设计.md](docs/架构设计.md) | 当前架构：模块、数据模型、流程、取舍 |
| [docs/adr/](docs/adr/README.md) | 架构决策记录：每个关键决策的背景与理由 |
| [docs/变更管理.md](docs/变更管理.md) | 模块标签、changelog 书写规范、版本号与发版流程 |

## 开发命令

```bash
# 后端
cd backend
uv run pytest                 # 单元测试

# 前端
cd frontend
pnpm test                     # 单元测试
pnpm typecheck                # 类型检查
pnpm lint                     # ESLint（单文件 250 行上限）+ Prettier
```
