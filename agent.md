# agent.md — ai_cbe 项目现状与 Agent 工作指引

> 本文件由 2026-09-12 交付前审查（vibe-audit）产出，用途有两个：
> 1. 让大模型/新协作者在**不翻阅源码**的情况下知道项目当前真实状态；
> 2. 记录本轮审查发现、已修复内容与剩余待办，作为后续工作的基线。
>
> 更细的目录级索引见 [`docs/AGENT-INDEX.md`](docs/AGENT-INDEX.md)（其中部分描述已过时，见下方「已知文档偏差」）。

---

## 1. 项目一句话

`ai_cbe` 是 AI 驱动的跨境电商平台**参考实现/演示项目**，四端同仓：Java 电商后端、Python AI 服务、Admin 后台、Storefront 消费者端。当前处于「阶段三进行中」（智能选品/报表/推荐），**尚未达到生产可发布状态**。

## 2. 技术栈与端口

| 层 | 选型 | 端口 | 目录 |
| --- | --- | --- | --- |
| 电商后端 | Java 23 + Spring Boot 4.0.6 + MyBatis 4.0.1 + Flyway 11 | 8081 | `backend/` |
| AI 服务 | Python 3.11 + FastAPI + LiteLLM + Chroma | 8000 | `ai-service/` |
| Admin 后台 | Umi Max + Ant Design Pro v6 + Biome | 8000(dev) / 8080(preview) | `admin/` |
| Storefront | Next.js 16 + Tailwind + marked 15 | 3000 | `storefront/` |
| 数据库 | PostgreSQL 16（pgvector 镜像） | 5432 | docker |
| 缓存 | Redis 7 | 6379 | docker |

**端口冲突已知**：Admin dev 与 AI 服务都默认 8000，Admin 实际跑 8080。

## 3. 当前真实运行状态（2026-09-13 更新）

- **版本管理**：仓库已建立三轮提交（初始导入 → 审查修复 → C 端账户体系与上线前置）；`storefront/` 已**平铺纳入根仓**（不再是 submodule），嵌套 `.git` 备份在仓库外 `D:\storefront-nested-git-backup-20260912`；`.dbg/`、`.trae/`、`.audit-tmp/` 已加入 `.gitignore`；
- **基础设施**：`ai_cbe_postgres` / `ai_cbe_redis` 容器 healthy（数据卷为本次审查新建，含 Flyway 迁移 + `DataInitializer` 种子数据 + 联调脚本写入的数据）；postgres 内含 `ecommerce`（业务）与 `ai_cbe`（Copilot 历史）两个库；
- **后端**：可启动于 8081（`Environment validation passed`，`JWT_SECRET`/`DEV_LOGIN_FALLBACK=true` 读自 `backend/.env`）；`mvnw test` → **24 项单元测试全绿**；
- **AI 服务**：`ai-service/.venv`（Python 3.12）已装**完整运行依赖**（fastapi/uvicorn/httpx/litellm/sqlalchemy/asyncpg/redis/chromadb…；**未装** sentence-transformers/torch——embedding 走云端）；服务可启动于 8000，**真实 LLM + RAG 链路均已验证通过**——模型走阿里云百炼 Model Studio（对话 `dashscope/qwen3.8-flash`，向量化 `dashscope/text-embedding-v4`，key 在 `ai-service/.env` 的 `DASHSCOPE_API_KEY`）。⚠️ `MODEL_CHAT/MODEL_TOOL/MODEL_EMBEDDING` 必须带 LiteLLM 提供商前缀（`dashscope/`），裸模型名会报 "LLM Provider NOT provided"；RAG 依赖本机 Chroma 服务（8001，未入 compose，需自行起，见 §8.9）；
- **Admin / Storefront**：均已启动并做**浏览器实测**——Admin 走通登录→仪表盘→订单→商品→Copilot 历史（数据与后端一致）；Storefront 已完成 XSS 正反对照 + 注册→下单→查单端到端；
- 后端安全修复已通过**运行时验证**（鉴权矩阵、角色隔离、订单身份过滤、userId 落库、登录限流、404/409 语义、actuator 收敛、启动 fail-fast）。

启动顺序（基础设施必须先起）：

```bash
docker compose up -d postgres redis      # 需先在根 .env 填 POSTGRES_PASSWORD
cd backend && ./mvnw.cmd -DskipTests package && java -jar target/backend-0.0.1-SNAPSHOT.jar
cd ai-service && uvicorn main:app --port 8000
```

## 4. 关键事实（改动前必须知道）

### 4.1 鉴权模型（本轮刚收紧，2026-09-12）

`backend/src/main/java/com/example/backend/config/SecurityConfig.java` 现为**按 HTTP 方法 + 路径**分级：

| 路径 | 规则 |
| --- | --- |
| `/api/login/account`、`/api/storefront/**`、`/api/health`、`/api/cart/**`、`/api/policies/**`、`/api/sitemap.xml`、`/api/subscribers`、actuator health/info/prometheus、swagger | 公开 |
| `GET /api/products/**` | 公开（C 端浏览） |
| `POST/PUT/PATCH/DELETE /api/products/**` | 需 `ROLE_ADMIN` 或 `ROLE_OPERATOR` |
| `GET /api/orders/**`、`POST /api/orders`、`POST /api/orders/*/pay`、`POST /api/orders/*/support-requests` | 公开（游客结账） |
| 其余 `/api/orders/**`（ship / complete / cancel / status / refund） | 需 `ROLE_ADMIN` 或 `ROLE_OPERATOR` |
| `GET /api/admin/**` | 需 `ADMIN` / `OPERATOR` / `VIEWER` |
| 写操作 `/api/admin/**` | 需 `ADMIN` / `OPERATOR` |
| 其它 | 需登录 |

**注意**：后端全局没有 `@PreAuthorize`/方法级权限，角色只在这一处路径规则里表达；新增管理接口若落在 `/api/admin/**` 之外，必须同步补规则，否则默认只要求「已登录」。角色来自 JWT `role` claim，由 `JwtAuthenticationFilter` 加 `ROLE_` 前缀。

两个易踩的实现细节：

- JWT 里的 `role` 是**小写**（`admin`/`operator`/`viewer`/`customer`），`JwtAuthenticationFilter` 会 `toUpperCase()` 后授予 `ROLE_ADMIN` 等权限——`hasAnyRole("ADMIN")` 匹配的是大写形式，改这里时别把大小写弄丢，否则合法管理员会被 403；
- 未登录 → `authenticationEntryPoint` 返回 **401「请先登录」**；已登录但角色不足 → `accessDeniedHandler` 返回 **403「无权访问该资源」**。两者分开，前端才能区分「跳登录页」和「提示无权限」。

### 4.2 必填环境变量（不配则后端启动直接失败）

`StartupEnvValidator` 启动校验：`DATABASE_URL` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` / `REDIS_HOST` / `JWT_SECRET`。

- `JWT_SECRET` 必须 ≥ 32 字节，且**不能**是历史默认值 `change-me-in-production-32-char-secret`（该值曾硬编码在源码里，已移除）；
- `application.properties` 已加 `spring.config.import=optional:file:.env[.properties]`，所以 `backend/.env` **现在才真正生效**（此前 Spring 根本不读它，全靠属性默认值，README 的「cp .env.example .env」是无效步骤）；
- 数据库密码不再有任何硬编码默认值。

### 4.3 登录演示口令是开关控制的

`AuthController` 中 `admin/ant.design`、`user/ant.design` 恒通过的兜底，现由 `app.dev-login-fallback`（env `DEV_LOGIN_FALLBACK`）控制，**默认 false**。本地联调需在 `backend/.env` 设 `DEV_LOGIN_FALLBACK=true`（当前已设为 true）。生产必须 false，README 里公开的默认账户不可用于生产。

登录接口另有按 IP 的内存限流：每分钟 10 次，超限返回 429（单实例内存实现，多实例部署需换 Redis）。

### 4.4 订单过滤 / 顾客隔离

- `GET /api/orders` 支持 `userId`、`orderId`、`orderNo`、`status` 组合过滤（`OrderMapper.findByFilter`），但**用户维度的过滤只信服务端身份**：
  - 管理角色（`ADMIN`/`OPERATOR`/`VIEWER`）→ 可自由传 `userId`，不传则查全量；
  - 普通登录用户 → **强制**用 token 里的用户 ID，前端传的 `userId` 被忽略；
  - 未认证请求 → 返回空结果（不回落到全量）；
- `createOrder(request, userId)` 会把 userId 落库，**只从已验证 JWT 的 principal 取**（`AuthUser.resolveId`），请求体里传 userId 无效；游客下单为 NULL；
- AI 客服的 `query_orders` 工具会注入 `userId`，**此前该参数被 Java 端直接忽略**（等于隔离失效），且 `customer.py` 不透传 token；两处均已修；
- ⚠️ **行为变更**：`storefront/src/app/(store)/account/orders/page.tsx` 原先不带 userId 调用列表接口，实际展示的是**全站订单**；现在未认证请求返回空，该页在 C 端账户体系落地前会显示为空列表。这是安全上的正确结果（fail-closed），不要为了「让页面有数据」而放开过滤。

### 4.5 C 端账户体系（2026-09-12 第二轮已落地）

- **现状**：注册/登录走后端 `/api/storefront/auth/*`，口令 bcrypt 存 `users` 表（`role=CUSTOMER`），签发与 B 端同源的 JWT；前端 `lib/auth.ts` 只保存 token 与档案，**不再保存明文口令**；
- **身份使用规则**：一切需要归属的接口（订单列表/详情/支付/工单、个人资料）只从 token 取身份，前端传 `userId` 一律忽略；管理角色（ADMIN/OPERATOR/VIEWER）可跨用户查询；
- **仍缺失（上线前需产品决策）**：邮箱验证、忘记密码流程；token 存 localStorage，因此前端任何 XSS 都会泄露会话——渲染外部文本必须走已转义组件（§6 Storefront 约定）；
- **历史包袱**：`user-store.ts` 的购物车/地址/本地订单快照仍按"设备 + 用户 ID"存 localStorage，跨设备不同步；登录时会把访客数据合并进账户（`mergeGuestIntoUser`）。

### 4.6 AI 服务侧约定（未变更）

- Copilot（运营侧）有鉴权：`ai-service/api/copilot.py: verify_admin_token` 会拿 Bearer token 回查 Java `/api/currentUser`，`guest`/空角色拒绝，写操作还需 `POST /api/copilot/confirm` 人工确认；
- 客服接口（`api/customer.py`）**自身不强制鉴权**（访客可用），但带 `Authorization: Bearer` 时会把 token 透传给工具层，Java 端据此强制按身份过滤订单；只读工具白名单不变；
- 工具层 `tools/base.py` 通过 contextvar 传递 token，**必须按请求动态取头**（`_auth_headers()`）——客户端是复用的，固化 token 会造成跨用户串用（P0-5）；`mock_or_error()` 已改为 `propagate_error`，**不再回退假数据**；
- 工具实际直连 `/api/admin/**`、`/api/orders`、`/api/products` 等真实端点。

## 5. 已知文档偏差（本轮已修正，保留作复核清单）

> 下列偏差在 2026-09-12 审查中已修正。保留此表是因为「文档说得和代码不一样」曾是本仓最大的排查陷阱，日后新增文档请对照检查。

| 原说法 | 实际情况 | 修正 |
| --- | --- | --- |
| `docs/java-api-contract.md`、`AGENT-INDEX.md §5.3`：AI 工具走 `GET/POST /api/tools/...` | **后端不存在任何 `/api/tools` 端点**，工具直连 `/api/admin/**`、`/api/products`、`/api/orders` | 已在契约文档顶部加「未实现」警示 + 工具→真实路径对照表；AGENT-INDEX §5.3 加同样提示 |
| `README.md`：`docker compose up -d postgres redis chroma` | `docker-compose.yml` 只有 postgres + redis，**无 chroma 服务** | README 命令已改，并注明 Chroma 需自行启动 |
| `README.md`：`ENABLE_MOCK_FALLBACK=true` 可回退 mock | 代码已改为直接报错（`propagate_error`），无 mock 回退 | AGENT-INDEX §5.2/§10-3 已更新；`.env` 注释标注该变量已失效 |
| `README.md`：默认账户 `admin/ant.design` | 现受 `DEV_LOGIN_FALLBACK` 开关控制，默认关闭 | README 已加「仅本地开发、生产必须关闭」警示 |
| `README.md`：`cp .env.example .env` 填数据库连接 | 修复前 Spring **不读** `backend/.env`，该步骤无效 | 已加 `spring.config.import`，README 补充 `.env` 生效方式与 `JWT_SECRET` 必填 |
| `AGENT-INDEX.md`：docker-compose 含 mysql | 实际是 PostgreSQL | 结构说明已改为 postgres + redis |
| `AGENT-INDEX.md §7.1`：`JAVA_API_BASE_URL=http://localhost:8080` | 后端实际 8081 | 已改为 8081，并补充 backend/.env 三个新配置项说明 |

## 6. Agent 工作指引

- **改代码前先读本文件 + `docs/AGENT-INDEX.md`**，只在任务直接命中时打开源文件；
- **后端约定**：Flyway 迁移 `V{N}__{name}.sql`（改已应用脚本需 `flyway:repair`）；分页 0-based（`OFFSET = page * size`）；`service.update` 必须 partial update（只覆盖非 null 字段）；JSONB 用 `JsonNodeTypeHandler`；MyBatis XML 一律 `#{}`，禁止 `${}`；
- **新增后端接口时的安全动作**：判断它属于公开只读 / C 端写 / 管理写，并在 `SecurityConfig` 补对应规则——**不要依赖前端隐藏按钮做权限**；
- **Admin 端**：`src/services/` 是 openapi 自动生成，禁止手改（改 DTO 后跑 `npm run openapi`）；lint 用 Biome 而非 ESLint；新页面在 `config/routes.ts` 配 `access`；
- **Storefront 端**：渲染任何后端/AI 文本前先看本文件 §4.5 与审查报告 P1-3/P1-4；JSON-LD 序列化必须转义 `<`；AI 输出走 `components/MarkdownText.tsx`（解析前已转义 HTML），**不要**另起 `dangerouslySetInnerHTML`；
- **AI 服务**：新增工具走 `tools/base.py` 注册 + 对应 Agent 的 `ALLOWED_TOOLS` 白名单；写操作必须 `require_confirm=True`；**永远不要给客服 Agent 加写工具**；不引入 LangGraph；工具层鉴权头必须**按请求**取（`_auth_headers()`），绝不要固化到复用的 `AsyncClient` 上（见 P0-5）；
- **提交前**：`.env` 不得提交（已在 `.gitignore`）；`.dbg/`、`.trae/`、`.audit-tmp/` 已忽略；暂存后用 `git diff --cached --name-only | grep -E '\.env$|\.pem$|\.key$'` 复查一遍有无密钥文件混入。

## 8. 第二轮实现与验证（2026-09-12 晚，"上线前仍需做的"全部落地）

### 8.1 C 端账户体系（取代 localStorage 明文口令）

- **后端**：新增 `/api/storefront/auth/register|login|me`（`StorefrontAuthController` + `CustomerAuthService`），口令 bcrypt 存 `users` 表，签发与 B 端同源的 JWT（`role=customer`）；注册校验邮箱格式/密码 8–72 位；重复邮箱 409、弱密码 400、凭证错误统一 401（不泄露邮箱是否存在）；
- **`/api/profile` 越权修复**：原先身份取自 `?userId=` 查询参数，任何登录用户可读写他人资料；现只从 token 取身份，参数被忽略；
- **订单归属校验**：`GET /api/orders/{id}`、`/{id}/payments`、`/{id}/support-requests`、`POST /{id}/pay`、`POST /{id}/support-requests` 全部加 `canAccess`（管理角色放行，普通用户仅限本人），不通过统一按 404/空列表处理，避免 ID 枚举探针；工单的 `userId` 也只取自 token；
- **Storefront**：`lib/auth.ts` 重写为后端 JWT 实现（token 存 `storefront-token`，档案存 `storefront-current-user`，**不再存明文口令**）；注册表单移除"邮箱验证码"（后端无邮件服务，原验证码是纯装饰）；结账/订单页/订单详情/售后/AI 客服请求统一带 `Authorization`；删除无消费方且使用越权模式的 `lib/profile-api.ts`；i18n 中"账户存 localStorage/验证码模拟"的过时文案与失效键已清理；
- **验证**：浏览器实测注册→登录→下单→「我的订单」只显示本人订单；`/me` 无 token 401；顾客 token 访问 `/api/admin/**` 403；他人订单 404。

### 8.2 登录限流改 Redis

`security/LoginRateLimiter`：Redis `INCR + EXPIRE`，key 形如 `rate:login:customer:<ip>`，多副本共享窗口；Redis 不可用时降级为单实例内存计数并记 warn。B 端登录、C 端登录、C 端注册分别用独立 key；登录成功后清计数。阈值可配：`LOGIN_RATE_LIMIT_MAX_ATTEMPTS` / `LOGIN_RATE_LIMIT_WINDOW_SECONDS`。
**验证**：连续错误口令第 9 次起 429；`redis-cli KEYS 'rate:*'` 可见计数键（验证后已清理）。

### 8.3 生产配置基线

新增 `backend/.env.production.example`：`DEV_LOGIN_FALLBACK=false`、`API_DOCS_ENABLED=false`、独立 `JWT_SECRET`、CORS 收敛、DB 口令走密钥管理，并附 6 条上线自检清单。
**验证**（以 `--app.dev-login-fallback=false --springdoc.*=false` 启动）：`admin/ant.design` 被拒（body code 401）；匿名访问 `/actuator/prometheus`、`/swagger-ui.html`、`/v3/api-docs` 均 401；`/actuator/health` 200 且不含组件详情；C 端登录与公开商品浏览不受影响。
> 注意：B 端登录失败返回 **HTTP 200 + body code=401**（既有 `Result` 信封行为，未改动以免破坏 Admin 前端错误处理），监控不要只看状态码判断认证失败。

### 8.4 异常语义补强

- `HttpMessageNotReadableException` → 400（畸形/非法编码请求体不再污染 5xx）；
- 工单 `type`/`priority` 在入口校验白名单（与 DB CHECK 约束一致），非法值 400 而非撞库 500。

### 8.5 AI 服务验证

- 新建 `ai-service/.venv`（Python 3.12，原 `venv` 是 3.9 且为空壳）；安装**轻量依赖集**（fastapi/uvicorn/httpx/litellm/sqlalchemy/asyncpg/redis…），**未装** chromadb 与 sentence-transformers（二者在代码中为惰性导入，RAG 功能调用时才会需要，含 torch 约 2.5GB）；
- 服务可正常启动（`/health` 200）；
- **工具层端到端 PASS**（`auth_token_context` 置顾客 token 后调 `query_orders`）：伪造 `user_id=999` 被服务端忽略、只返回本人 1 条订单；无 token 返回 0 条；
- **2026-09-13 更新：真实 LLM 链路已验证通过**（模型换成阿里云百炼 `dashscope/qwen3.8-flash`）。客服与 Copilot 两条链路均跑通真实对话 + 工具调用——详见 §8.9；RAG 仍待装 chromadb + embedding 模型（§8.8-1）。

### 8.6 浏览器实测（Storefront XSS 修复）

- **JSON-LD**：在真实 DOM 中做正反对照——未转义写法会解析出 `<img>` 并触发 `onerror`（证明漏洞真实存在），修复写法（`JSON.stringify(...).replace(/</g,'\u003c')`）解析 0 个危险元素、无原始 `</script>`；
- **MarkdownText**：7 个攻击载荷（无引号 `onerror`、`<script>`、`<svg onload>`、`<iframe src=javascript:>`、markdown `javascript:`/`data:` 链接、大小写混写协议）经组件同款逻辑渲染后注入 DOM，**全部为惰性文本**：0 危险元素、0 事件属性、0 危险 href，无 handler 触发；正常 markdown 结构（标题/加粗/链接）保留；
- 未覆盖：AI 客服真实会话中的 Markdown 渲染（依赖 LLM，见 8.5）。

### 8.7 回归与清理

- `mvnw test` 24 项全绿；`docs/admin-test.ps1` 第三轮：113 项 / 94 通过 / 16 个 409（种子数据冲突，语义正确）/ 3 个 AI 服务未启动，**无新增失败**；
- Storefront `tsc --noEmit` 通过；
- 已清理：全部测试进程、`.audit-tmp/`、Redis 限流键、本轮创建的测试账户与订单（库恢复 8 用户 / 6 订单）、ai-service `__pycache__`；postgres/redis 容器与 `ai-service/.venv` **保留**（后者是运行 AI 服务所需）。

### 8.8 仍未完成（按优先级，2026-09-13 更新）

1. **C 端账户的体验项**：忘记密码 / 邮箱验证仍未实现（注册即可用，无验证环节，也无邮件服务）——**已按产品决策「暂缓，接受现状」**，上线后再补；
2. **会话/订单页本地缓存**：`user-store` 的 localStorage 仍按设备隔离，跨设备不同步（设计如此，需知晓，非阻塞）；
3. **生产配置落地**：按 `backend/.env.production.example` 基线切换生产配置并复跑自检（`DEV_LOGIN_FALLBACK=false` 下复验演示口令登录被拒、`API_DOCS_ENABLED=false`、独立 `JWT_SECRET`、CORS 收敛、DB 口令走密钥管理）——属上线当天动作，非代码缺陷；
4. RAG 已跑通（§8.9），但 **Chroma 服务未进 compose**：多机/CI 部署需自行确保 8001 的 Chroma 可用，或后续把 Chroma 补进 `docker-compose.yml`。

### 8.9 第三轮验证（2026-09-13：LLM 全链路 + RAG + Admin 浏览器实测）

- **前提**：用户已在 `ai-service/.env` 填入模型凭据（阿里云百炼 Model Studio 工作空间，`DASHSCOPE_API_KEY=sk-ws-...`，工作空间 base `https://ws-0vj2yxa270d4mvm9.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`，模型 `qwen3.8-flash`）；
- **修配置**：原 `MODEL_CHAT/MODEL_TOOL=qwen3.8-flash` 缺 LiteLLM 提供商前缀，litellm 报 `LLM Provider NOT provided`；已改为 `dashscope/qwen3.8-flash`（`.env` 属本地文件，未提交；`dashscope/` 前缀按 `.env.example` 约定）。经探测：`dashscope/qwen3.8-flash` 与 `openai/qwen3.8-flash`（显式 api_base）均可用；
- **客服链路 PASS**（`POST /api/customer/chat`）：英文问候 → 英文回复；中文「查我的订单」→ 语言检测 zh(0.99) → 工具调用 `query_orders` → Java 后端按身份返回空（访客 0 条）→ LLM 依工具结果生成中文回复；（RAG 未启用时）中文「退货政策」→ `search_faq` 空转 → LLM **拒绝编造政策**并引导人工客服——启用后见下方 RAG 链路；
- **Copilot 链路 PASS**（`POST /api/copilot/chat`，admin Bearer token 回查 `/api/currentUser` 通过）：「列出最近的订单」→ 工具调用 `query_orders(days=7)` → 返回 6 条真实订单 → LLM 生成 markdown 表格汇总（含订单号/金额/状态/支付方式），数据与库一致；
- **Admin 后台浏览器实测 PASS**：`npm run start:no-mock`（8080，MOCK=none 直连后端）→ 登录页渲染 → `admin/ant.design`（`DEV_LOGIN_FALLBACK=true`）登录 → 重定向 `/dashboard`，仪表盘显示真实后端数据（累计 6 单、商品 52、库存预警 3、待处理工单 2；近 7 日销售/热销为「暂无数据」是因为种子订单日期在 2026-06，属正常）→ `/orders` 列出 6 笔订单（金额/状态/履约一致）→ `/products` 列出 52 件商品（编辑/删除/导出/CSV 导入/新建可用）→ `/copilot-history` 读取 ai-service 会话（含本文刚产生的会话，证明 Admin↔ai-service↔Postgres 全链路）；
- **顺手修复**：`api/copilot_admin.py:147` `list_copilot_operations` 的 `auth_token_context.reset` 少了调用括号（token context 从未 reset），已改为与兄弟 handler 一致的 `reset(token_ctx)` + try/except，`py_compile` 通过；
- **RAG 链路 PASS**（按用户决策「云端 embedding + 轻量 Chroma」）：
  - `MODEL_EMBEDDING` 改为 `dashscope/text-embedding-v4`（探测返回 1024 维）；`.venv` 新增 `chromadb 1.5.9`（含 onnxruntime/numpy/grpc 等，**无 torch**）；
  - 本机起 Chroma 服务：`.venv/Scripts/chroma.exe run --path ai-service/.chroma_data --host localhost --port 8001`（heartbeat 200；数据目录已加 `.gitignore`）;
  - 入库：`python -m rag.ingest --customer-demo` → 10 条客服 FAQ（退货/物流/关税/支付/尺码/退款/保修，多语言）写入 `customer_kb`；
  - 验证：「退货政策是什么？」→ `search_faq` 命中 4 条（中/英/日/韩返回政策）→ LLM 依检索结果用中文给出**准确**的 7 天无理由/30 天质量退货/不可退品类/退货流程（数字与入库文档一致，不再空转）；`.tmp_msg.json` 等临时文件已删；
- **清理**：本轮测试写入的 2 条 Copilot 大会话已通过 `DELETE /copilot/sessions/{id}` 删除；临时脚本（`.tmp_msg.json`/`.tmp_copilot.py`/`llm_probe.py` 等）已删除。

## 7. 提交记录（本轮）

| commit | 内容 |
| --- | --- |
| 1（初始导入） | 审查前的四端代码基线快照，`storefront` 此时仍是 submodule 指针；`.dbg/`、`.trae/` 已先移出暂存区，未进入历史 |
| 2（审查修复） | 第一轮全部 P0/P1/P2 修复 + `agent.md`；同时把 `storefront/` 平铺纳入根仓（解除 gitlink，91 个文件入库） |
| 3（上线前置） | 第二轮实现：C 端账户体系（后端接口 + Storefront 接入）、订单/资料归属校验、Redis 限流、生产配置基线、异常语义补强、i18n 文案修正 |

`.gitignore` 新增：`.dbg/`、`.trae/`、`.audit-tmp/`（本地调试与审查临时产物）。
`.env` 系列仍按原规则忽略；`backend/.env` 含本地 `JWT_SECRET` 与数据库口令，**不得提交**。

---

## 审查报告：ai_cbe（2026-09-12）

### 审查范围

全仓四端：后端核心链路（登录 → 商品/订单读写 → 管理接口）、AI 服务鉴权与工具链、Admin/Storefront 前端安全面、交付完整性。加载清单：security + frontend + backend + delivery + 语言专项（Java/Spring、Python/FastAPI、TS/Next.js、PostgreSQL）。跳过项：`admin/node_modules`、`ai-service/venv`（第三方依赖产物，扫描命中已判定误报）；GraphQL 层未展开（`/graphql` 不在 permitAll 列表内，默认需登录）。

### P0 致命 — 5 项

| # | 问题 | 位置 | 风险 | 修复内容/状态 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| 1 | 鉴权矩阵失守：`/api/products/**`、`/api/orders/**`、`/api/admin/products/import` 全部 permitAll | `backend/.../config/SecurityConfig.java:31-51`、`controller/ProductController.java:29,34,39,45`、`controller/OrderController.java:95-154` | 未登录者可直接 POST/PUT/DELETE 商品、POST `/api/orders/{id}/refund` 退款、`/cancel` 取消、`/ship` 发货、POST `/api/admin/products/import` 灌入商品数据 | 已修复：按方法+路径分级，写操作要求 `ADMIN`/`OPERATOR`；公开面只留只读与游客结账 | **运行时已验证**：匿名 `POST /api/products`、`PUT/DELETE /api/products/1`、`POST /api/orders/1/{refund,cancel,ship,status}`、`POST /api/admin/products/import`、`GET /api/admin/orders` 全部 401；`GET /api/products`、`GET /api/orders`、`POST /api/cart/calculate` 仍 200；admin token 改价 200 |
| 2 | `/api/admin/**` 只校验「已登录」，不校验角色；全局无 `@PreAuthorize` | `SecurityConfig.java:51`；grep 全仓 `@PreAuthorize\|hasRole` 无命中 | 任意注册用户（`role=customer`）拿到 JWT 即可调用全部管理接口：改价、退款、用户管理、RBAC、数据导出 | 已修复：`GET /api/admin/**` 需 ADMIN/OPERATOR/VIEWER，写操作需 ADMIN/OPERATOR。**验证中发现并追加两处修复**：① `JwtAuthenticationFilter.java:43` 原授予 `ROLE_admin`（小写）与 `hasAnyRole("ADMIN")` 不匹配，导致合法管理员也被拒 → 角色统一大写；② 原只配 `authenticationEntryPoint`，角色不足也返回 401「请先登录」→ 补 `accessDeniedHandler` 返回真实 403 | **运行时已验证**：自签 `role=customer` 的合法 JWT 访问 `GET /api/admin/orders`、`POST /api/admin/coupons`、`POST /api/products`、`POST /api/orders/1/refund` 全部 **403**（响应体 `无权访问该资源`），同时 `GET /api/products` 仍 200；admin token 访问 4 个管理接口均 200 |
| 3 | 登录后门：`admin/ant.design` 无条件放行，且口令已写进 README | `backend/.../controller/AuthController.java:44-47`、`README.md:136-142` | 任何人照 README 用公开口令即可以 admin 身份登录后台，绕过数据库密码 | 已修复：改由 `app.dev-login-fallback`（env `DEV_LOGIN_FALLBACK`，默认 false）控制；`backend/.env` 本地置 true 保留联调体验 | 代码路径已验证（本地 `DEV_LOGIN_FALLBACK=true` 时登录成功、签发 role=admin token）；**关闭开关后的拒绝路径未实测**——发布前需在 `DEV_LOGIN_FALLBACK=false` 下复验 |
| 4 | JWT 密钥硬编码公开默认值，启动无校验 | `backend/.../util/JwtUtil.java:15`、`config/StartupEnvValidator.java`（原无 jwt 检查） | 密钥随源码公开，任何人可离线签发 `role=admin` 的合法 token，绕过全部鉴权 | 已修复：`jwt.secret=${JWT_SECRET:}` 无默认值；Validator 强制非空、≥32 字节、且不等于历史默认值；`backend/.env`/`.env.example` 补 `JWT_SECRET` | **运行时已验证**：`java -jar ... --jwt.secret=` 启动**失败退出**（exit=1，日志列出 `JWT_SECRET (jwt.secret)`）；正常配置下启动日志 `Environment validation passed` |
| 5 | ai-service 工具层跨用户凭据串用：`HttpClient` 把**首个请求**的 `Authorization` 固化进复用的 `AsyncClient` | `ai-service/tools/base.py:55-69`（原 `get()` 只在 `_client is None` 时读一次 `auth_token_context`） | 服务启动后第一个运营用户的 token 被永久缓存；此后**所有人**（含其他运营、客服会话）的工具调用都以第一个用户的身份打到 Java 后端——写操作（改价/退款）记在错误的人头上，审计日志失真，且低权限用户可借高权限 token 越权 | 已修复：客户端只保留 `Content-Type`，新增 `_auth_headers()` 在**每次请求**从 contextvar 动态取值（无动态 token 时回落 `JAVA_API_TOKEN`），四个 `*_json` 方法统一传 per-request headers | **隔离验证 PASS**：桩件替代 httpx 后依次以 TOKEN_A / TOKEN_B / 无 token 发三次请求，断言各自携带自己的头、客户端级无固化、访客请求不含用户 token（脚本 `.audit-tmp/verify_http_client_auth.py`，验证后已删除）。注：ai-service 依赖未安装（venv 仅有 pip/setuptools），**未做真实端到端运行** |

### P1 严重 — 9 项

| # | 问题 | 位置 | 风险 | 修复内容/状态 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| 1 | 客服「按 user_id 隔离订单」实际失效：ai-service 传的 `userId` 过滤参数被 Java 忽略 | `ai-service/tools/order_tools.py:21-39` → `OrderController.java:65-73`（原 list 只接受 status） | 任意 `user_id`（甚至不存在的）都会返回**全量订单**，含收货地址、客户邮箱、金额 | 已修复：`OrderController.list` 支持 userId/orderId/orderNo/status；新增 `OrderMapper.findByFilter/countByFilter` + XML 动态 where + `OrderService.listFiltered`；非数字 userId 返回空结果 | **运行时已验证**：`GET /api/orders?userId=u_x` → total=0，`?userId=999999` → total=0，无参数 → total=6（修复前三种情况都返回 6）。**但见 P1-9：`user_id` 从不落库，隔离修好后 C 端查自己订单必为空** |
| 2 | 数据库口令硬编码在源码，且 `backend/.env` 从未被 Spring 读取 | `backend/src/main/resources/application.properties:5-8`（原 `${DATABASE_PASSWORD:ykfpostgres}`） | 真实 DB 口令进仓库；README 指导的 `.env` 配置形同虚设，改 `.env` 不生效导致排查方向错误 | 已修复：移除默认值改为必填；新增 `spring.config.import=optional:file:.env[.properties]` 让 `.env` 生效 | **运行时已验证**：仅靠 `backend/.env`（不设任何 shell 环境变量）启动成功，日志 `Environment validation passed`，Hikari 连上 `jdbc:postgresql://localhost:5432/ecommerce` |
| 3 | JSON-LD 结构化数据未转义 `<`，可提前闭合 script 标签 | `storefront/src/app/(store)/products/[id]/page.tsx:148`、`policies/[slug]/page.tsx:64`、`(store)/page.tsx:72` | 商品名/描述含 `</script><img src=x onerror=...>` 时，在 C 端商品详情页对**任意访客**执行脚本（写入渠道：管理端录入或 CSV 导入） | 已修复：三处统一 `JSON.stringify(...).replace(/</g,'\\u003c')` | `npx tsc --noEmit` 通过；重读改动处 |
| 4 | AI 客服 Markdown 渲染净化可绕过 | `storefront/src/components/MarkdownText.tsx:23-28`（原黑名单正则） | 无引号属性 `onerror=alert(1)`、未闭合 `<script src=...>`、`<svg>/<object>` 均绕过黑名单；配合提示词注入可在消费者浏览器执行脚本 | 已修复：解析前对原始文本 HTML 转义（不再渲染内联 HTML），解析后中和 `javascript:`/`data:`/`vbscript:` 链接 | `npx tsc --noEmit` 通过；重读改动处（未做浏览器实测） |
| 5 | 登录接口无速率限制 | `AuthController.java:29`（原 login 方法） | 可无限爆破后台口令 | 已修复：按 IP 内存滑动窗口限流，60s 内 >10 次拒绝。**验证中追加修复**：项目 `Result` 信封会让限流响应仍是 HTTP 200（只有 body.code=429），网关/WAF/监控识别不到 → 改为返回真实 **HTTP 429**（口令错误分支保持既有 HTTP 200 + code=401 信封，避免影响 Admin 前端） | **运行时已验证**：连续错误口令，第 10 次起 HTTP **429**（body `登录尝试过于频繁，请稍后再试`）；正常登录仍 HTTP 200 并返回 token。多实例部署需换 Redis 计数（§4.3） |
| 6 | `/api/customer/chat` 的 `user_id` 客户端自报，无服务端身份校验 | `ai-service/api/customer.py:29-31,47-50` | 攻击者枚举数字 user_id 即可让客服代为查询他人订单；与 P1-1 叠加时曾返回全量订单 | **已做服务端半修**：① `customer.py` 提取 Bearer token 并通过 `auth_token_context` 透传给工具层（在 SSE 生成器内 set/reset）；② Java `OrderController.list` 按 token 身份强制过滤，**忽略前端自报 userId**，未认证请求一律返回空。根治（访客也能安全查单）仍需 C 端账户体系（§4.5） | **运行时已验证**：`role=customer&sub=1` token → 只看到自己的 1 条订单；同一 token 伪造 `?userId=999` → 仍只返回自己的 1 条；匿名 `GET /api/orders` → 0 条（修复前为全量 6 条） |
| 7 | actuator 详情、Prometheus、Swagger 匿名公开 | `application.properties:49-55`（原 `show-details=always`）、`SecurityConfig.java` permitAll 列表 | 匿名可读到组件级健康详情（DB/Redis 主机、磁盘）、全量指标与 API 文档，便于踩点 | 已修复：`show-details`/`show-components` 改 `when-authorized`；permitAll 只留 `/actuator/health`；`info`/`prometheus`/swagger/api-docs 由 `API_DOCS_ENABLED`（默认 true，生产设 false）控制，关闭后落到鉴权分支 | **运行时已验证**：匿名 `GET /actuator/health` → 200 且响应中 `components` 计数为 0（详情已隐藏）；`/actuator/prometheus` 在 dev 默认开关下 200，生产设 `API_DOCS_ENABLED=false` 后需鉴权（该分支未实测，属配置项） |
| 8 | Storefront 代码实际未纳入版本管理：根仓以 submodule 记录，指向仅含脚手架的初始提交 | 根仓 `git ls-files -s storefront` → `160000 9e39b7c`（"Initial commit from Create Next App"）；嵌套仓 `storefront/` 中 `src/app/(store)/`、`src/components/`、`src/lib/` 均为 `??` 未跟踪 | 克隆根仓后 `storefront/` 只有 Create Next App 空壳，C 端全部业务代码（含本轮 4 处 XSS 修复）不会随仓库分发；协作/CI/回滚全部失效 | **已修复（按用户决策平铺到根仓）**：嵌套 `.git` 已备份到仓库外 `D:\storefront-nested-git-backup-20260912`（确认无误后可删），`git rm --cached storefront` 解除 gitlink，storefront 作为普通目录纳入根仓 | `git diff --cached --name-only -- storefront` → 91 个文件；`git ls-files -s storefront` 不再是 160000 模式 |
| 9 | 订单从未写入 `user_id`：`OrderRequest` 无该字段，`createOrder` 也不 set | `backend/.../dto/OrderRequest.java:13-39`、`service/OrderService.java:92-105`；连带发现 `storefront/src/app/(store)/account/orders/page.tsx:54` 调 `/api/orders` **不带任何 userId**，等于把全站订单（含收货地址、邮箱）当「我的订单」展示给任意访客 | 全部订单 `user_id` 为 NULL，C 端无法按人查单；而公开列表接口又把所有订单暴露给未登录访客 | 已修复：① 新增 `security/AuthUser(id, username, role)` 作为 JWT principal，`JwtAuthenticationFilter` 写入；② `createOrder(request, userId)` 落库 userId，**只从已验证 token 取**，不接受请求体自报；③ `OrderController.list` 按身份强制过滤（管理角色可自由查，普通用户强制自己的 ID，未认证返回空） | **运行时已验证**：带 admin token 下单 → DB `user_id=1`；匿名下单 → `user_id=NULL`；`role=customer&sub=1` 查列表 → 1 条，伪造 `?userId=999` → 仍 1 条，匿名 → 0 条。**单元测试**：`OrderServiceTest` 新增断言校验 userId 落库，`mvnw test` 24 项全绿。验证用的 2 条测试订单已从库中删除 |

### P2 建议 — 9 项

| # | 问题 | 位置 | 风险 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | 文档与实现不符：`/api/tools/*` 契约不存在 | `docs/java-api-contract.md:13`、`docs/AGENT-INDEX.md:377-392` | 新 Agent 按文档找端点会找不到，误判为「后端挂了」 | **已修复**：`java-api-contract.md` 顶部加「未实现」警示 + 工具→真实路径对照表，Base URL 改 8081；`AGENT-INDEX.md` §5.3 表格前加同样提示并指向对照表 |
| 2 | README 启动命令含不存在的 `chroma` 服务 | `README.md:88`、`docker-compose.yml` | 照文档执行会报 service not found | **已修复**：改为 `docker compose up -d postgres redis`，并注明 Chroma 未编排、需自行启动 |
| 3 | README 公开默认账户口令 | `README.md:136-142` | 与 P0-3 叠加形成完整攻击路径 | **已修复**：代码侧开关默认关（P0-3）；README 补「仅本地开发可用 / 生产必须 `DEV_LOGIN_FALLBACK=false`」警示，并说明 `/api/admin/*` 的角色要求与 `JWT_SECRET` 必填 |
| 4 | Storefront 端口默认值与实际不一致 | `storefront/next.config.ts:3`、`src/app/sitemap.ts:12`、`products/[id]/page.tsx:46`（默认 8080，实际 8081） | 未配 `.env.local` 时前端请求打到空端口，sitemap 生成失败 | **已修复**：三处默认值统一改为 8081 |
| 5 | 前端 console 打印用户信息、购物车与登录响应 | `storefront/src/app/(store)/CustomerServiceWidget.tsx:66,80,82,355-366`、`lib/ai-customer.ts:48`、`admin/src/pages/user/login/index.tsx:157,178,186` | 浏览器控制台泄露用户 ID、登录用户档案、购物车内容；`console.log(msg)` 会把**含 JWT 的登录响应**打进控制台，`console.log(error)` 可能带含口令的请求配置 | **已修复**：删除客服组件整段调试 `console.group`（连带移除随之失效的 `getCart` 导入）、删除 ai-customer 的说明性日志、删除 admin 登录页打印响应体与异常对象的两处 `console.log`（异常提示保留 `message.error`，`fetchUserInfo` 失败降级为 `console.warn`） |
| 6 | 调试文件已进暂存区；仓库 0 commit | `.dbg/dashboard-copilot-subscriber.env`、`.dbg/trae-debug-log-*.ndjson`、`.trae/documents/*.md` | 内容仅调试 URL/会话 ID（无密钥），但属噪音；一旦提交会长期留在历史里 | **已修复**：三者 `git rm --cached` 移出暂存区，`.gitignore` 新增 `.dbg/`、`.trae/`、`.audit-tmp/`；仓库已建立首个 commit（见 §7） |
| 7 | 路由不存在被兜底成 HTTP 500 | `exception/GlobalExceptionHandler.java:35-40` 捕获 `Exception`，把 `NoResourceFoundException` 也变成 500 | 监控里 5xx 告警被无效请求污染，真实故障被淹没 | **已修复**：新增 `NoResourceFoundException` handler → 404 `{"code":404,"message":"接口不存在"}`。**运行时已验证**：`GET /api/policies` 由 500 变 404；未匹配路径若落在 `anyRequest().authenticated()` 则仍返回 401（不泄露路由存在性，符合预期） |
| 8 | 业务冲突返回 HTTP 500 而非 409 | 6 个 service 共 12 处 `throw new RuntimeException("...已存在")`（AdminRole/AdminUser/Currency/EmailTemplate/ShippingCarrier/Translation） | 幂等重试与前端错误提示拿不到正确语义；联调报告长期显示 5xx，掩盖真实故障 | **已修复**：新增 `exception/DuplicateResourceException` + handler → 409，12 处全部替换。**运行时已验证**：重复 `POST /api/admin/currencies`（code=USD）→ 409 `货币代码已存在`；全量联调中原 16 个 500 已变为 16 个 409 |
| 9 | `GET /api/policies` 列表路由不存在 | `controller/PolicyController.java:10,31,55`（只有 `/{slug}` 与 `/trust-badges`） | 该路径在 SecurityConfig 中 permitAll 但无处理器 | **已确认为不需要**：Storefront 政策页读本地 `lib/policies.json`，无调用方需要列表接口；症状已由 P2-7 修正为 404，permitAll 规则保留以覆盖 `/{slug}` 与 `/trust-badges` |

### 扫描误报说明（quick_scan 高/中危命中，已逐条判定）

- `admin/public/scripts/loading.js:7-8` innerHTML：赋值为构建期静态模板字符串，无用户可控输入 → 误报；
- `admin/scripts/i18n-remove.js`、`admin/src/pages/DataExport/index.tsx` 的 `exec`：均为 `RegExp.prototype.exec`，非命令执行 → 误报；
- admin 各页 `request.delete(\`/admin/xxx/${id}\`)` 判为「SQL 拼接」：是 URL 路径插值，参数由后端 `@PathVariable Long` 强类型接收 → 误报；
- `node_modules/**/test_*.pem`、`venv/**/cacert.pem`：第三方包自带测试证书，且 `node_modules`/`venv` 已被 `.gitignore` 忽略、未被 git 跟踪 → 误报；
- `.env.example` 被 git 跟踪：属模板文件（值为占位符），README 明确要求提交 → 非问题；
- 根 `.env`、`ai-service/.env`、`backend/.env` 含真实密钥：三者均被 `.gitignore` 覆盖且 `git ls-files` 确认未跟踪（仓库 0 commit，无历史泄露）→ 无需处理；
- `StartupEnvValidator.java:37` 判为硬编码密钥：该常量是「禁用值黑名单」，用于拒绝历史默认密钥 → 误报；
- Storefront 4 处 `dangerouslySetInnerHTML` 仍被扫描命中：已在源头转义（JSON-LD 转 `<`、Markdown 解析前转义），属**已缓解**而非未处理。

### 运行时验证记录（2026-09-12，基础设施：postgres + redis 容器 healthy）

- **启动**：仅靠 `backend/.env` 启动成功，`Environment validation passed`，Flyway 16 迁移通过；`--jwt.secret=` 空值启动 exit=1（fail-fast 生效）；
- **鉴权矩阵**：匿名访问 11 个写/管理端点全部 401；`role=customer` 合法 token 访问管理端点全部 403；admin token 访问管理端点与改价全部 200；公开只读（`/api/products`、`/api/orders`、`/api/cart/calculate`）保持 200；
- **订单过滤**：`?userId=u_x` / `?userId=999999` → 0 条，无过滤 → 6 条（修复前三种都是 6 条）；
- **登录限流**：连续错误口令第 10 次起返回真实 HTTP 429，正常登录仍 200；
- **安全响应头**：CSP / X-Frame-Options / X-Content-Type-Options 三项均在响应中；
- **全量联调回归**：`docs/admin-test.ps1` → **Total 113 / OK 94 / 4xx 0 / 5xx 19**。19 个失败全部归因、**与本轮改动无关**：16 个是种子数据与 `DataInitializer` 撞唯一键的「已存在」500（见 P2-8），3 个是 AI 服务未启动的连接失败。**4xx 为 0 说明鉴权收紧没有打断任何既有联调链路**；
- 验证用的后端进程已停止，临时日志与令牌文件（`.audit-tmp/`）已删除；postgres/redis 容器保留运行。

**第二轮（「全部修复」后复验）**

- **单元测试**：`mvnw test` → Tests run 24, Failures 0, Errors 0（含 `OrderServiceTest` 新增的 userId 落库断言）；
- **异常语义**：`GET /api/policies` → **404**（原 500）；重复 `POST /api/admin/currencies` → **409 `货币代码已存在`**（原 500）；
- **actuator 收敛**：匿名 `/actuator/health` → 200 且响应不含 `components`（详情已隐藏）；
- **订单身份强制过滤**：匿名 → 0 条；`role=customer&sub=1` → 1 条；同 token 伪造 `?userId=999` → 仍 1 条；admin → 全量 8 条、`?userId=1` → 1 条；
- **userId 落库**：带 token 下单 → DB `user_id=1`；匿名下单 → `NULL`（两条验证订单已删除，库中恢复 6 条）；
- **ai-service 鉴权头**：桩件隔离验证 PASS——A/B 两个 token 各自独立、客户端无固化、访客请求不含用户 token；
- **全量联调复跑**：`docs/admin-test.ps1` → **Total 113 / OK 94 / 4xx 16 / 5xx 3**。与修复前 OK 数一致（94），原先 16 个 500 已变为语义正确的 **409**，3 个 5xx 仍是 AI 服务未启动的连接失败。

### 发布就绪状态

- **结论（2026-09-13 更新）：四端全部跑通实测——后端、C 端、AI 服务（对话 + 工具 + RAG）、Admin 后台均已验证；剩余阻塞只剩「C 端账户体验项（已决策暂缓）」与「生产配置落地」两项上线当天动作，代码层面无未修复的交付硬伤。

- 两轮共修复 **P0×5、P1×9、P2×9**，并额外落地 C 端账户体系、订单/资料归属校验、Redis 限流、生产配置基线；
- 第三轮（2026-09-13）补齐全部验证盲区：**LLM 全链路**（客服 + Copilot 真实对话与工具调用，`dashscope/qwen3.8-flash`）、**RAG 检索**（`dashscope/text-embedding-v4` + 轻量 Chroma，`search_faq` 命中真实 FAQ 并据此作答）、**Admin 后台浏览器实测**（登录→仪表盘→订单→商品→Copilot 历史），另修复 `copilot_admin` 一处 token context 未 reset 的小 bug——详见 §8.9；
- 验证覆盖：后端 24 项单元测试全绿、113 项接口联调无新增失败、生产配置自检 6 项全过、Storefront 注册→下单→查单浏览器端到端、两处 XSS 修复的真实 DOM 正反对照、AI 服务工具层 token 透传端到端、客服/Copilot 真实 LLM 对话、RAG 政策问答、Admin 后台 UI 全链路。
- **上线前必须完成（均为上线当天动作，非代码缺陷）**：
  1. 按 `backend/.env.production.example` 基线执行生产配置并复跑自检：`DEV_LOGIN_FALLBACK=false`（并复验演示口令登录被拒）、`API_DOCS_ENABLED=false`、独立 `JWT_SECRET`、CORS 收敛、DB 口令走密钥管理；
  2. 部署侧补齐 Chroma 服务（8001，未入 compose，多机/CI 需自行起或补进 compose）+ 按真实 FAQ/政策文档重新入库（当前 `customer_kb` 是 10 条演示文档）；
  3. C 端账户体验项（邮箱验证/忘记密码）已按产品决策**暂缓**；如需上线再补邮件服务闭环；
  4. 多副本部署确认（登录限流已共享 Redis；会话/订单本地缓存的跨设备不同步为已知设计）。
- **遗留清理项**：
  - `D:\storefront-nested-git-backup-20260912`：平铺前的嵌套仓备份，确认根仓 storefront 文件完整后可删除；
  - `docs/ADMIN-TEST-REPORT.md` 仍是 2026-06-30 的旧报告，本轮联调结果只写在本文（未覆盖历史报告）；
  - 本次审查新建的 postgres 数据卷含联调脚本写入的测试数据，若要干净环境需 `docker compose down -v` 重建；
  - `ai-service/.venv`（Python 3.12）为运行 AI 服务所建，保留；旧的 `ai-service/venv`（3.9 空壳）可删除。
