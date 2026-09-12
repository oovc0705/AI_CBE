# AI-CBE · AI 驱动的跨境电商平台

> 跨境电商 · 多品牌 · 面向全球 · AI 驱动
>
> 仓库代号 **ai\_cbe**（AI Cross-Border E-commerce），整合 **Java 后端 + Python AI 服务 + Admin 后台 + Storefront 消费者端** 四端联动。

## 项目简介

`ai_cbe` 是一个面向跨境电商业务场景的全栈参考实现，覆盖 **商品 / 订单 / 支付 / 物流 / 营销 / 多语言 / 审计** 等完整电商领域能力，并把 **LLM 智能体** 深度嵌入到日常运营和消费者购物链路中：

- **Admin Copilot**（运营侧）：自然语言完成查商品、查订单、改价、改状态、NL2SQL 数据问答；写操作走"先解释 → 人工确认 → 执行"的安全流程。
- **Storefront 智能客服**（消费者侧）：多语言接入（Unicode → 拉丁特征词 → LLM 兜底三级检测），强制 RAG 知识库检索，按 `user_id` 隔离订单与购物车。
- **可插拔模型层**：通过 LiteLLM 统一接入 StepFun / DeepSeek / 智谱 / Ollama 等，`.env` 改一行即可切换。

## 技术栈

| 层          | 选型                                                      | 备注                                        |
| ---------- | ------------------------------------------------------- | ----------------------------------------- |
| 电商核心后端     | Java 23 + Spring Boot 4.0.6 + MyBatis 4.0.1 + Flyway 11 | 端口 `8081`                                 |
| AI 服务      | Python 3.11 + FastAPI + LiteLLM                         | 端口 `8000`                                 |
| Admin 后台   | Umi Max + Ant Design Pro v6                             | 端口 `8000/8080`                            |
| Storefront | Next.js 16 + Tailwind CSS                               | 端口 `3000`                                 |
| 关系数据库      | PostgreSQL 16                                           | 端口 `5432`                                 |
| 缓存 / 会话    | Redis 7                                                 | 端口 `6379`                                 |
| 向量库        | Chroma（HTTP 客户端 + BGE-m3）                               | 端口 `8001`                                 |
| 鉴权         | JWT (JJWT 0.12) + Spring Security                       | Bearer Token                              |
| API 文档     | OpenAPI 自动生成 + PowerShell 联调脚本                          | 见 `docs/admin-test.ps1`                   |
| Agent 编排   | 自研 async 循环（非 LangGraph）                                | `ai-service/agents/agent_orchestrator.py` |

## 仓库结构

```
ai_cbe/
├── backend/                # Java 电商后端（Spring Boot + MyBatis + Flyway）
├── ai-service/             # Python AI 服务（FastAPI + LiteLLM + RAG + Agent）
├── admin/                  # Ant Design Pro 后台（Umi Max）
├── storefront/             # Next.js 16 消费者端
├── docs/                   # 项目级文档（架构 / API 契约 / Agent 索引 / 测试报告）
├── database/               # 数据库初始化脚本（PostgreSQL）
├── nginx/                  # 反向代理配置
├── docker-compose.yml      # 基础设施一键启动（postgres / redis / chroma）
├── .env.example            # 根环境变量模板
├── .gitignore
└── README.md
```

> 详细的子目录职责见 [`docs/AGENT-INDEX.md`](docs/AGENT-INDEX.md)。

## 核心特性

### 1. Admin Copilot（运营智能体）

- 工具白名单 + 系统提示词约束（[agents/copilot\_agent.py](ai-service/agents/copilot_agent.py)）
- 写操作走"人工确认"流程：LLM 给出执行计划 → 前端弹出确认卡片 → 用户确认后落库
- 工具结果通过 SSE 增量推送（`session` / `tool_call` / `confirm` / `tool_result` / `final` / `error`）

### 2. Storefront 智能客服

- 多语言自动检测与切换（[core/language\_detector.py](ai-service/core/language_detector.py)）
- 强制 RAG 检索（[core/rag\_engine.py](ai-service/core/rag_engine.py)）
- 按 `user_id` 隔离订单与购物车数据
- 客服 Agent **不持有任何写操作工具**（`ALLOWED_TOOLS` 限定为只读）

### 3. 通用 Agent 编排

- 单轮最多 6 步工具循环（`MAX_ITERATIONS`）
- 挂起状态存 Redis（`ai:session:{id}:pending`），服务重启后可恢复
- 会话超过 20 条自动压缩（保留最近 6 条 + 摘要）

### 4. 多端契约

- 后端 DTO ↔ `admin/src/types/contract.ts` ↔ storefront 三端对齐
- 改 DTO 后通过 `admin` 的 `npm run openapi` 重新生成前端 services

### 5. 后端工程规范

- Flyway 迁移脚本命名 `V{N}__{name}.sql`；修改已应用脚本需 `mvnw flyway:repair`
- 所有 JSONB 字段统一使用 `JsonNodeTypeHandler`
- 枚举字段（如 `UserRole`）使用 `UserRoleTypeHandler` 自定义处理器
- 分页 0-based：`OFFSET = page * size`，禁止 `(page - 1) * size`
- `service.update` 必须 partial update：只覆盖入参中非 null 字段

## 快速开始

### 1. 启动基础设施

```bash
docker compose up -d postgres redis
```

> `docker-compose.yml` 只编排 postgres 与 redis；**Chroma（向量库，RAG 用）未在 compose 中**，需要时自行启动并配置 `CHROMA_BASE_URL`。

### 2. 启动 Java 后端

```bash
cd backend
cp .env.example .env       # 填数据库 / Redis 连接，并设置 JWT_SECRET（必填）
mvnw.cmd -DskipTests package
java -jar target\backend-0.0.1-SNAPSHOT.jar
# → http://localhost:8081
```

> `backend/.env` 由 `spring.config.import` 加载，改完需重启生效。
> **`JWT_SECRET` 必填**：不少于 32 字节，且不能是历史默认值 `change-me-in-production-32-char-secret`，否则启动直接失败（`StartupEnvValidator` fail-fast）。

### 3. 启动 AI 服务

```bash
cd ai-service
cp .env.example .env       # 填模型 API Key（STEPFUN / DEEPSEEK / OPENAI ...）
pip install -e .
uvicorn main:app --reload --port 8000
# → http://localhost:8000
```

### 4. 启动 Admin 后台

```bash
cd admin
npm install
npm run dev                # 默认端口 8000
# → http://localhost:8000（代理 /api → http://localhost:8081）
```

### 5. 启动 Storefront

```bash
cd storefront
pnpm install
pnpm dev
# → http://localhost:3000
```

### 6. RAG 入库（可选）

```bash
cd ai-service
python -m rag.ingest --demo
```

## 默认账户

| 端     | 用户名     | 密码           |
| ----- | ------- | ------------ |
| Admin | `admin` | `ant.design` |

> ⚠️ **仅本地开发可用**：该演示口令由 `backend/.env` 的 `DEV_LOGIN_FALLBACK=true` 开启，**默认关闭**。
> 生产环境必须保持 `DEV_LOGIN_FALLBACK=false`，否则任何人都能用上表公开口令以 admin 身份登录后台。
> 生产账户请走 `users` 表 + bcrypt 口令，并配置独立的 `JWT_SECRET`。

> Admin 登录走 `/api/login/account`，返回 JWT，存于 `localStorage`。所有 `/api/admin/*` 请求需带 `Authorization: Bearer <token>`，且要求 `ADMIN`/`OPERATOR` 角色（只读查询额外允许 `VIEWER`）。

## 常用命令

```bash
# 跑通 Admin 后台全量接口联调（需后端 + AI 服务都在跑）
powershell -ExecutionPolicy Bypass -File d:\ai_cbe\docs\admin-test.ps1

# 命令行体验 Copilot（无前端）
cd ai-service && python demo_copilot.py

# 命令行体验智能客服
cd ai-service && python demo_customer.py

# Admin 代码质量
cd admin && npm run lint          # biome + tsc
cd admin && npm run test          # Jest
cd admin && npm run e2e           # Playwright
```

## 文档索引

| 文档                                                     | 用途                        |
| ------------------------------------------------------ | ------------------------- |
| [docs/AGENT-INDEX.md](docs/AGENT-INDEX.md)             | AI Agent 优先阅读的仓库结构与约定索引   |
| [docs/architecture.md](docs/architecture.md)           | 整体架构与分层设计                 |
| [docs/java-api-contract.md](docs/java-api-contract.md) | AI 服务 ↔ Java 后端工具 REST 契约 |
| [docs/admin-test.ps1](docs/admin-test.ps1)             | Admin 后台全量接口联调脚本          |
| [docs/ADMIN-TEST-REPORT.md](docs/ADMIN-TEST-REPORT.md) | 最近一次联调报告                  |
| [backend/README.md](backend/README.md)                 | Java 后端独立说明               |
| [ai-service/README.md](ai-service/README.md)           | AI 服务独立说明                 |
| [admin/README.md](admin/README.md)                     | Admin 后台独立说明              |
| [storefront/README.md](storefront/README.md)           | Storefront 独立说明           |
| [storefront/CLAUDE.md](storefront/CLAUDE.md)           | Storefront 详细开发规范         |
| [admin/CLAUDE.md](admin/CLAUDE.md)                     | Admin 详细开发规范              |

## 关键约定

1. **写操作必须** **`require_confirm=True`**（Copilot 默认拦截；客服 Agent 根本不被授予写操作）
2. **Java 后端失败的兜底**：每个走 Java 的工具都要 `try/except`，通过 `tools/base.py: mock_or_error()` 统一处理；生产环境应设 `ENABLE_MOCK_FALLBACK=false` 直接报错
3. **`admin/src/services/`** **禁止手改**，要改用 `npm run openapi` 重新生成
4. **后端服务从各自目录启动**（`backend/`、`ai-service/`），不要在仓库根目录跑 `java -jar`
5. **.env 不要 commit**，模板提交到 `.env.example`
6. **不安装 LangGraph**：`agent_orchestrator` 是纯 async 循环，刻意降低依赖

## 阶段规划

- **阶段一（已完成）**：骨架 + Admin Copilot 最小闭环（数据问答、运营操作、人工确认）
- **阶段二（已完成）**：Storefront 智能客服 + 多语言 + RAG
- **阶段三（进行中）**：智能选品、自动报表、个性化推荐

