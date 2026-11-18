# AGENT-INDEX.md

> **先读根目录 [`agent.md`](../agent.md)**：那里记录了项目现状、鉴权模型、必填环境变量、
> 「文档与实现偏差表」以及最近一次交付前审查（2026-09-12）的结论与待办。
> 本索引侧重目录结构与「改 X 看哪里」，两者配合使用；若两者冲突，以 `agent.md` 的偏差表为准。

> **本文件用途**：本仓库功能越来越多，AI Agent 在执行新指令前应**优先**完整阅读本文件，避免反复打开大量源文件。
> 建议：每轮只精读本索引 + 任务直接命中的 1~3 个文件，其他文件**不要**主动展开。
> （每次执行完任务更新这个索引文档，方便后续新对话能够快速定位到相关文件）

> **最近一次联调（2026-06-30 20:38）**：所有服务（PostgreSQL/Java 后端 8081/AI 服务 8000/Admin 8080）真实启动，无 mock，跑完 81 个 admin 接口 **81/81 全部 2xx 通过**。详见 [ADMIN-TEST-REPORT.md](file:///d:/ai_cbe/docs/ADMIN-TEST-REPORT.md)。

---

## 0. 仓库一句话

`ai_cbe` 是 AI 驱动的跨境电商平台代码库，包含 **Java 后端**（`backend/`，Spring Boot 4 + MyBatis + Flyway + PostgreSQL）、**Python AI 服务**（`ai-service/`，FastAPI + LiteLLM + RAG）、**admin 后台**（`admin/`，Ant Design Pro + Umi Max）、**storefront 消费者端**（`storefront/`，Next.js 16）。所有服务在本地通过 `d:\ai_cbe\` 下的子目录管理。

---

## 1. 仓库结构与文件职责

```
d:\ai_cbe\
├── .env                       # 根 .env（Postgres / Dify 等，当前未被 ai-service 读取）
├── .env.example               # 根环境变量模板
├── README.md                  # 项目总览
├── AGENT-INDEX.md             # ★ 本文件：Agent 优先读此
│
├── backend/                   # ★★★ Java 后端（Spring Boot 4.0.6 + Java 23 + MyBatis 4.0.1）
│   ├── .env                   # ★ 数据库/Redis 连接
│   ├── pom.xml                # Maven 配置（Spring Boot 4 + Flyway 11 + JJWT 0.12 + commons-csv）
│   ├── mvnw.cmd               # Maven wrapper
│   ├── src/main/java/com/example/backend/
│   │   ├── BackendApplication.java
│   │   ├── common/            # Result<T> 统一响应封装
│   │   ├── config/            # SecurityConfig / GlobalExceptionHandler / JsonNodeTypeHandler / RequestLoggingFilter
│   │   ├── controller/        # REST 控制器（AdminXxxController 在 /api/admin/ 下）
│   │   ├── service/           # 业务逻辑层（注意修复：见 §9）
│   │   ├── mapper/            # MyBatis Mapper 接口
│   │   ├── entity/            # 实体（多语言字段通常用 JSONB，name_i18n/title_i18n）
│   │   ├── dto/               # DTO（admin/ 子包是后台管理专用）
│   │   ├── repository/        # 部分 JPA 风格仓储
│   │   ├── graphql/           # GraphQL schema 与 resolver（面向 storefront）
│   │   ├── security/          # JWT + 鉴权
│   │   └── util/              # SlugUtils 等
│   ├── src/main/resources/
│   │   ├── application.properties # 服务端口 8081 / datasource / jpa / flyway / multipart
│   │   ├── db/migration/      # Flyway 迁移（V1__init_core_ecommerce_tables.sql 起）
│   │   └── mapper/*.xml       # MyBatis XML
│   ├── src/main/resources/graphql/schema.graphqls
│   └── logs/                  # backend.out / backend.err（启动后才有）
│
├── ai-service/                # ★★★ Python AI 服务
│   ├── .env                   # ★ AI 服务真实运行配置（含 STEPFUN_API_KEY 等）
│   ├── .env.example           # AI 服务环境变量模板（含每个 key 注释）
│   ├── main.py                # FastAPI 入口；lifespan 中调用 register_all() 注册工具
│   ├── demo_copilot.py        # 命令行交互演示（无前端也可跑通 Copilot 全流程）
│   ├── demo_customer.py       # 命令行演示智能客服
│   ├── pyproject.toml         # 依赖与元数据
│   ├── requirements.txt       # pip 依赖列表
│   ├── Dockerfile             # 容器化
│   ├── README.md              # AI 服务独立说明
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py        # ★ 全局配置：从 .env 读取，frozen dataclass，模块级单例 settings
│   │
│   ├── core/                  # 核心能力层
│   │   ├── model_router.py    # ★ LiteLLM 统一调用；chat/stream_chat/embed；自动注入 API Key
│   │   ├── session_manager.py # ★ Redis 会话存储 + 超过 20 条自动压缩（保留最近 6 条 + 摘要）
│   │   ├── rag_engine.py      # ★ RAG 引擎：Chroma HTTP 客户端 + BGE-m3 embedding
│   │   └── language_detector.py # 多语言检测（Unicode→拉丁特征词→模型兜底）
│   │
│   ├── agents/                # ★★ Agent 编排层
│   │   ├── agent_orchestrator.py  # ★★★ 通用编排器：思考→工具调用→人工确认→执行→总结
│   │   ├── copilot_agent.py   # Admin Copilot：含 SYSTEM_PROMPT 与 ALLOWED_TOOLS 白名单
│   │   └── customer_agent.py  # 智能客服：多语言 + 订单按 user_id 隔离 + 强制 RAG
│   │
│   ├── tools/                 # ★ 业务工具层（Function Calling）
│   │   ├── __init__.py        # register_all() 总入口
│   │   ├── base.py            # ToolResult / ToolEntry / ToolRegistry / http_client
│   │   ├── product_tools.py   # query_products / update_product_price / set_product_status
│   │   ├── order_tools.py     # query_orders / process_refund（按 user_id 过滤）
│   │   ├── analytics_tools.py # query_business_data（NL2SQL，强制只读）
│   │   ├── content_tools.py   # generate_marketing_copy / translate_text（纯 LLM，不走 Java）
│   │   ├── faq_tools.py       # search_faq（客服 RAG）
│   │   └── cart_tools.py      # query_cart / query_promotions（客服专属）
│   │
│   ├── rag/                   # 向量库底层封装
│   │   ├── embeddings.py      # 本地 BGE-m3（sentence-transformers），失败回退 LiteLLM
│   │   ├── vectorstore.py     # Chroma HTTP 客户端单例
│   │   └── ingest.py          # 文档入库脚本：python -m rag.ingest --demo | --source xxx.jsonl
│   │
│   ├── services/              # AI 服务自身辅助（migrations 等）
│   │   └── migrations.py      # ★ 启动时自动补齐 copilot_operations 等表的列
│   │
│   ├── api/                   # FastAPI 路由层
│   │   ├── copilot.py         # POST /api/copilot/chat、POST /api/copilot/confirm（SSE）
│   │   ├── customer.py        # POST /api/customer/chat（SSE，要求 user_id 必填）
│   │   └── health.py
│   │
│   └── data/                  # 本地数据/缓存（gitignore，Chroma 持久化等）
│
├── admin/                     # Ant Design Pro 后台前端（Umi Max + antd v6）
│   ├── AGENTS.md              # admin 端 Agent 指引（指向 CLAUDE.md）
│   ├── CLAUDE.md              # ★ admin 端最详细文档：框架、命令、约定、Gotchas
│   ├── package.json           # 脚本：start / dev / build / lint / test / e2e
│   ├── config/
│   │   ├── config.ts          # Umi 全局配置（utoopack、antd 主题、插件开关）
│   │   ├── routes.ts          # ★ 路由表（含 access 权限）：/products /orders /settings ...
│   │   ├── proxy.ts           # ★ 跨域代理：`/api/` → http://localhost:8081
│   │   ├── defaultSettings.ts # ProLayout 主题设置
│   │   └── theme.ts
│   ├── src/
│   │   ├── app.tsx            # getInitialState / layout / request 全局配置
│   │   ├── access.ts          # 权限定义（canAdmin / canView）
│   │   ├── requestErrorConfig.ts # 请求错误处理 + 拦截器
│   │   ├── utils/request.ts   # axios 二次封装
│   │   ├── services/          # ★ 自动生成，禁止手改；要改则 npm run openapi
│   │   ├── types/contract.ts  # 跨端 TypeScript 契约（Product/Order/... 与 Java 对齐）
│   │   ├── pages/             # 页面（每个目录内含 index.tsx 与可选 service.ts / _mock.ts）
│   │   │   ├── products/        # 商品管理（多语言 Tab + 导入导出 + 变体）
│   │   │   ├── orders/          # 订单列表 + orders/[id] 详情
│   │   │   ├── categories/      # 品类管理（canAdmin）
│   │   │   ├── brands/          # 品牌管理（canAdmin）
│   │   │   ├── coupons/         # 优惠券（canAdmin）
│   │   │   ├── users/           # 用户管理（canAdmin）
│   │   │   ├── settings/        # 系统设置（canAdmin）
│   │   │   ├── translations/    # 多语言翻译键（ProFormText 字段名 `key`）
│   │   │   ├── knowledge/       # 知识库管理
│   │   │   ├── support/         # 客户支持
│   │   │   ├── promotions/      # 促销活动
│   │   │   ├── reviews/         # 评价管理
│   │   │   ├── subscribers/     # 邮件订阅
│   │   │   ├── taxes/           # 税率
│   │   │   ├── shipping/        # 物流
│   │   │   ├── payment/         # 支付
│   │   │   ├── currencies/      # 货币
│   │   │   ├── rbac/            # 角色权限
│   │   │   ├── audit/           # 审计日志
│   │   │   ├── notifications/   # 通知
│   │   │   ├── dashboard/       # 仪表盘
│   │   │   └── user/login/      # 登录
│   │   └── locales/           # 8 语言（zh-CN/en-US/zh-TW/ja-JP/pt-BR/id-ID/fa-IR/bn-BD）
│   ├── e2e/                   # Playwright 测试
│   ├── mock/                  # Umi 全局 mock
│   └── cloudflare-worker/     # 独立子项目：Hono 实现的演示后端（非 npm workspace）
│
├── storefront/                # ★ Next.js 16 消费者前端（面向终端用户）
│   ├── AGENTS.md              # storefront 端 Agent 指引
│   ├── CLAUDE.md              # ★ storefront 端最详细文档（指向 AGENTS.md）
│   ├── package.json           # 脚本：dev / build / start / lint
│   ├── next.config.ts         # Next.js 配置
│   ├── tsconfig.json          # TypeScript 配置
│   ├── eslint.config.mjs      # ESLint 配置
│   ├── postcss.config.mjs     # PostCSS 配置（Tailwind CSS）
│   ├── Dockerfile             # 容器化
│   ├── README.md              # Storefront 独立说明
│   │
│   ├── public/                # 静态资源（favicon、SVG 图标等）
│   │
│   └── src/
│       ├── app/               # Next.js App Router 页面
│       │   ├── layout.tsx     # 根布局（全局）
│       │   ├── globals.css    # 全局样式（Tailwind CSS）
│       │   ├── robots.ts      # robots.txt 生成
│       │   ├── sitemap.ts     # sitemap.xml 生成
│       │   ├── favicon.ico
│       │   │
│       │   ├── (store)/       # ★ 主路由组（消费者页面）
│       │   │   ├── layout.tsx           # 店铺布局（Header + Footer + AI 客服组件）
│       │   │   ├── page.tsx             # 首页（Hero + 分类展示 + 滚动动画）
│       │   │   ├── error.tsx            # 错误边界
│       │   │   │
│       │   │   ├── Header.tsx           # 顶部导航（用户菜单 + 购物车 + 搜索 + 货币选择）
│       │   │   ├── Footer.tsx           # 页脚（链接 + 订阅）
│       │   │   ├── HeroCarousel.tsx     # 首页轮播图
│       │   │   ├── ScrollHero.tsx       # 滚动视差效果
│       │   │   ├── CategoryShowcase.tsx # 分类展示组件
│       │   │   ├── ScrollReveal.tsx     # 滚动显示组件
│       │   │   ├── SearchBox.tsx        # 搜索框组件
│       │   │   ├── CurrencySelector.tsx # 货币选择组件
│       │   │   ├── SubscribeForm.tsx    # 订阅表单
│       │   │   │
│       │   │   ├── AuthProvider.tsx     # ★ 认证上下文（登录状态管理）
│       │   │   ├── AuthModal.tsx        # 登录/注册模态框
│       │   │   ├── CustomerServiceWidget.tsx # ★ AI 智能客服浮窗组件
│       │   │   ├── MobileCartBar.tsx    # 移动端购物车悬浮条
│       │   │   ├── CookieConsent.tsx    # Cookie 同意横幅
│       │   │   ├── AnalyticsProvider.tsx # 分析追踪上下文
│       │   │   ├── ErrorBoundary.tsx    # 错误边界组件
│       │   │   │
│       │   │   ├── products/            # 商品相关页面
│       │   │   │   └── [id]/            # 商品详情页（动态路由）
│       │   │   │       ├── page.tsx           # 商品详情主页面
│       │   │   │       ├── AddToCartBar.tsx   # 加入购物车条（数量选择 + 加购按钮）
│       │   │   │       ├── AddToCartButton.tsx # 加购按钮组件
│       │   │   │       ├── RelatedProducts.tsx # 相关商品推荐
│       │   │   │       ├── ShareButtons.tsx   # 分享按钮
│       │   │   │       ├── TrustBadges.tsx    # 信任徽章（安全支付等）
│       │   │   │       ├── ViewItemTracker.tsx # 浏览历史追踪
│       │   │   │       └── not-found.tsx      # 商品未找到页面
│       │   │   │
│       │   │   ├── cart/                # 购物车页面
│       │   │   │   └── page.tsx         # 购物车（支持单个商品结账）
│       │   │   │
│       │   │   ├── checkout/            # 结账页面
│       │   │   │   └── page.tsx         # 结账流程（地址 + 支付 + 订单确认）
│       │   │   │
│       │   │   ├── order/               # 订单相关
│       │   │   │   └── result/          # 订单结果页
│       │   │   │       └── page.tsx     # 支付成功/失败结果展示
│       │   │   │
│       │   │   ├── account/             # 用户账户页面
│       │   │   │   └── orders/          # 我的订单
│       │   │   │       ├── page.tsx         # 订单列表
│       │   │   │       └── [id]/            # 订单详情
│       │   │   │           └── page.tsx
│       │   │   │
│       │   │   ├── search/              # 搜索页面
│       │   │   │   └── page.tsx         # 商品搜索结果
│       │   │   │
│       │   │   ├── about/               # 关于我们
│       │   │   │   └── page.tsx
│       │   │   │
│       │   │   ├── policies/            # 政策页面（动态路由）
│       │   │   │   └── [slug]/
│       │   │   │       └── page.tsx
│       │   │   │
│       │   │   ├── refund-policy/       # 退款政策
│       │   │   │   └── page.tsx
│       │   │   │
│       │   │   ├── shipping-policy/     # 配送政策
│       │   │   │   └── page.tsx
│       │   │   │
│       │   │   └── terms-of-service/    # 服务条款
│       │   │       └── page.tsx
│       │   │
│       │   └── test-health/         # 健康检查测试页面
│       │       └── page.tsx
│       │
│       └── lib/                 # ★ 核心库文件
│           ├── auth.ts              # 认证工具（登录/登出/获取当前用户）
│           ├── user-store.ts        # ★ 用户数据存储（购物车/订单/地址，按用户 ID 隔离）
│           ├── cart.ts              # 购物车工具（兼容层，实际调用 user-store）
│           ├── chat-history.ts      # ★ AI 客服聊天历史管理（按用户 ID 隔离）
│           ├── ai-customer.ts       # ★ AI 客服 API 调用（SSE 流式对话）
│           ├── api.ts               # API 请求工具
│           ├── analytics.ts         # 分析追踪工具
│           ├── currency.ts          # 货币转换工具
│           ├── CurrencyPrice.tsx    # 货币价格显示组件
│           ├── payment-methods.ts   # 支付方式配置
│           ├── seo.ts               # SEO 元数据工具
│           ├── trust-badges.ts      # 信任徽章配置
│           ├── policies.json        # 政策内容数据
│           └── web-vitals.ts        # Core Web Vitals 性能追踪
│
├── docs/                       # ★ 项目级文档
│   ├── AGENT-INDEX.md          # ★ 本文件
│   ├── admin-test.ps1          # ★ Admin 后台全量接口联调脚本（PowerShell）
│   ├── ADMIN-TEST-REPORT.md    # ★ 最近一次 admin 联调报告（81/81 通过）
│   └── ...
│
├── docker-compose.yml          # 基础设施（postgres + redis；chroma/ollama 未编排）
└── README.md                   # 顶层 README
```

---

## 2. 仓库级约定（不要违反）

| 约定 | 适用范围 | 说明 |
|------|---------|------|
| 后端服务从各自目录启动 | `backend/`（Java）、`ai-service/`（Python） | 不要在 `d:\ai_cbe\` 顶层跑 `java -jar backend/...`（会找不到 classpath），必须 `cd` 到 `backend/` |
| 端口固定 | `backend=8081`、`ai-service=8000`、`storefront=3000`、`admin=8000`（dev）/ `8080`（preview） | 详见 §3 |
| Flyway 迁移脚本 | `backend/src/main/resources/db/migration/V{N}__{name}.sql` | 修改已应用的脚本需用 `flyway repair` 修复 checksum |
| Admin 前缀 | 后台 API 一律 `/api/admin/...`；公开认证（login/currentUser/outLogin）在 `/api/...` 根下 | 见 `admin/config/proxy.ts` |
| 跨端契约 | 后端 DTO ↔ `admin/src/types/contract.ts` ↔ `storefront` | 改 DTO 后要重新生成 `admin/src/services/` |
| PowerShell `Invoke-WebRequest` 不支持 `-Form` | 多部分上传用 `docs/admin-test.ps1` 中的 `Send-MultipartForm`（基于 .NET HttpClient） | 不要用 `Invoke-WebRequest -Form`（会报 `A parameter cannot be found that matches parameter name 'Form'`） |
| 货币 `code` 列 | `currencies.code` 是 `varchar(8)` | 测试/创建时长度 ≤ 8 |

---

## 3. 本地服务运行状态（最近一次）

| 服务 | 端口 | 启动命令（从各自目录） | 状态 |
|------|------|---------------------|------|
| PostgreSQL | 5432 | `docker compose up -d` 或系统服务 | ✅ |
| Redis | 6379 | 同上 | ✅ |
| Chroma | 8001 | 同上（可选） | ✅ |
| Java 后端 | 8081 | `cd backend && mvnw.cmd package && java -jar target\backend-0.0.1-SNAPSHOT.jar` | ✅ PID=36972 |
| AI 服务 | 8000 | `cd ai-service && uvicorn main:app --port 8000` | ✅ |
| Admin 前端 | 8000（与 ai 冲突！实际跑 8080/其他） | `cd admin && npm run dev` | ✅ |
| Storefront | 3000 | `cd storefront && pnpm dev` | ✅ |

**Admin 端 `proxy.ts` 已配置**：`/api/` → `http://localhost:8081`（Java 后端在 8081，因为 8080 之前被 Node 占用）。

---

## 4. Admin 后台 API 联调

**测试脚本**：[admin-test.ps1](file:///d:/ai_cbe/docs/admin-test.ps1)
**最近报告**：[ADMIN-TEST-REPORT.md](file:///d:/ai_cbe/docs/ADMIN-TEST-REPORT.md)（2026-06-30 20:50:58，本轮 **105/113 通过，8 个 seed POST 因 JsonNode 反序列化失败 500**，已修代码待用户重启后端后重跑即可全部 2xx）
**留档快照**：[ADMIN-TEST-REPORT-20260630-2038.md](file:///d:/ai_cbe/docs/ADMIN-TEST-REPORT-20260630-2038.md)

### 4.1 跑测试

```powershell
powershell -ExecutionPolicy Bypass -File d:\ai_cbe\docs\admin-test.ps1 -BaseUrl 'http://localhost:8081' -OutputMd 'd:\ai_cbe\docs\ADMIN-TEST-REPORT.md'
```

### 4.2 测试覆盖范围

- **Auth**：`/api/currentUser`、`/api/login/outLogin`
- **Dashboard**：`overview`、`sales-trend`、`top-products`、`stats`
- **Products**：列表、详情、改价、改状态、补货、批量、**导入（真实 multipart CSV）**、**模板下载**
- **Orders**：列表、详情、改状态、payments
- **Categories / Brands**：CRUD（PUT 用 PATCH 风格，只送变更字段）
- **Coupons**：CRUD + toggle
- **Promotions / Reviews / Subscribers / Email / Support / Notifications**：完整
- **KnowledgeBase**：列表、**上传（multipart）**、train（基于已存在 doc）
- **Translations**：keys 列表/CRUD、values 列表/CRUD、stats、export
- **Currencies / TaxRules / Shipping / Payment**：完整
- **RBAC / Audit**：列表
- **Export**：products/orders/users/reviews/transactions（CSV）
- **SiteConfig / StorefrontSiteConfig**
- **AI Service**：`/health`、`/api/copilot/sessions`、`/api/copilot/operations`

### 4.3 关键 bug 修复记录（2026-06-30）

| Bug | 文件 | 修复 |
|-----|------|------|
| `ProductReviewService.list` 产生 `OFFSET must not be negative` | `service/ProductReviewService.java` | `page * size`（0-based） |
| `SystemNotificationService.list` 同样 | `service/SystemNotificationService.java` | 同上 |
| `AuditLogService.list` 同样 | `service/AuditLogService.java` | 同上 |
| `PaymentTransactionService.list` 同样（snapshot 走 `page=0`） | `service/PaymentTransactionService.java` | `Math.max(0, page) * size` |
| `CategoryService.create` 没把 `name` 装进 `name_i18n` JSONB → null not-null | `service/CategoryService.java` + `entity/Category.java` | 新增 `name`（`@JsonProperty(WRITE_ONLY)`）并在 service 内构 `ObjectNode{en:name}`；`update` 补齐 slug/parentId |
| `BrandService.update` 把缺失字段写 NULL | `service/BrandService.java` | 只覆盖非 null 字段（`name/slug/logoUrl`） |
| `CouponService.update` 同上 | `service/CouponService.java` | 只覆盖非 null 字段（`code/type/value/minOrderAmount/usageLimit/usedCount/status/expiresAt`） |
| `CouponMapper.insert` `min_order_amount`/`usage_limit` 不允许 null | `mapper/CouponMapper.xml` | 加 `COALESCE(#{minOrderAmount}, 0)` / `COALESCE(#{usageLimit}, 0)` |
| `TranslationService.updateKey` 把缺失 `key` 当成 null | `service/TranslationService.java` | 只在 `req.getKey()` 非空时改 key；description 允许 null（不覆盖） |
| `EmailTemplateRequest.variables` 是 `JsonNode`，POST 数组 500 | `dto/admin/EmailTemplateRequest.java` + `service/EmailTemplateService.java` | 改为 `List<String>`；service 内 `objectMapper.createArrayNode()` 转换 |
| `AdminRoleRequest.permissions` 同样 | `dto/admin/AdminRoleRequest.java` + `service/AdminRoleService.java` | 同上 |
| `admin-test.ps1` 用 `Invoke-WebRequest -Form`（不存在） | `docs/admin-test.ps1` | 新增 `Send-MultipartForm`（基于 .NET HttpClient） |
| `admin-test.ps1` 发 `keyName`/`keyId` 等错误字段名 | 同上 | 与 `TranslationKeyRequest`/`TranslationValueRequest` 对齐（`key`、`key_id`） |
| `admin-test.ps1` 货币 code > 8 字符 | 同上 | 缩短为 `TC$ts`（≤ 8 字符） |
| `admin-test.ps1` 用 `Get-Json 'data[0]'`（PowerShell 不支持） | 同上 | 直接 `ConvertFrom-Json` + `Select-Object -First 1` |
| **测试数据全部保留**（用户 2026-06-30 20:50 要求） | `docs/admin-test.ps1` | 移除 4 处 `DELETE`（Category/Brand/Coupon/TranslationKey）；新增 seed 数据块为 Promotions/EmailCampaigns/EmailTemplates/Faq/TaxRules/ShippingCarriers/PaymentGateways/Currencies/RBAC Roles 9 类空模块填数据；不再有清理逻辑 |
| 报告新增"Module data snapshot"节 | `docs/admin-test.ps1` 末尾 | 跑完 23 个模块的 GET 列出 totalElements，便于用户一眼看到每个 admin 页面有数据 |

---

## 5. ai-service 核心架构

### 5.1 一句话流程

```
HTTP → api/*.py (SSE) → agents/*_agent.py → AgentOrchestrator.run()
                                            ├─ pre_hook（客服：语言检测注入 system prompt）
                                            ├─ model_router.chat()   # LiteLLM
                                            ├─ 解析 tool_calls
                                            │   ├─ 读操作 → tools/*.execute() → Java API（失败按配置回退 mock）
                                            │   └─ 写操作 → confirm 事件 → 挂起到 Redis pending
                                            └─ 结构化确认（按钮/接口 + token）→ 写执行 → 让 LLM 总结
```

### 5.2 关键设计原则

| 原则 | 实现位置 |
|------|----------|
| 业务代码不关心模型厂商 | `core/model_router.py`（LiteLLM provider 前缀） |
| 工具 schema 与执行器分离 | `tools/base.py: ToolRegistry` |
| 写操作必须人工确认 | `ToolEntry.require_confirm` + Redis `pending` |
| 客服无写权限 | `agents/customer_agent.py: ALLOWED_TOOLS` 只列只读工具 |
| 顾客订单按 user_id 隔离 | `agent_orchestrator` 在 `caller_user_id` 存在时注入 `query_orders.args.user_id` |
| Java 后端不可用时直接报错 | `tools/base.py: propagate_error()`（`mock_or_error` 仅保留旧签名，已无 MOCK 回退） |
| 切换模型零代码 | `.env` 改 `MODEL_CHAT/MODEL_TOOL` |
| 启动时自动迁移 | `services/migrations.py` 补齐 `copilot_operations.message_id/error_message/duration_ms` 等列 |

### 5.3 工具全表（重要：所有 Function Calling 都列在这里）

> ⚠️ 下表「后端」列的 `/api/tools/*` 路径**在 Java 后端并不存在**（历史目标契约）。
> 实际调用路径见 [docs/java-api-contract.md](java-api-contract.md) 顶部的对照表：
> 读操作走 `/api/products`、`/api/orders`，写操作走 `/api/admin/**`（需 ADMIN/OPERATOR 角色）。

| 工具名 | 读/写 | 谁用 | 后端 | 入参要点 |
|--------|------|------|------|---------|
| `query_products` | 读 | Copilot | `GET /api/tools/products` | `keyword`, `low_stock_threshold` |
| `update_product_price` | **写** | Copilot | `POST /api/tools/products/{id}/price` | `product_id`, `new_price`, `currency` |
| `set_product_status` | **写** | Copilot | `POST /api/tools/products/{id}/status` | `product_id`, `online` |
| `query_orders` | 读 | 双 Agent | `GET /api/tools/orders` | `order_id`, `status`, `days`, `user_id`（自动注入） |
| `process_refund` | **写** | Copilot | `POST /api/tools/orders/{id}/refund` | `order_id`, `amount`, `reason` |
| `query_business_data` | 读 | Copilot | `POST /api/tools/query` | `sql`（强制 SELECT/WITH） |
| `generate_marketing_copy` | 读 | Copilot | 不走 Java | `product_name`, `features`, `language`, `style` |
| `translate_text` | 读 | Copilot | 不走 Java | `text`, `target_language` |
| `search_faq` | 读 | 客服 | RAG 引擎 | `query`, `top_k` |
| `query_cart` | 读 | 客服 | 会话上下文 | `session_id`（编排器强制注入） |
| `query_promotions` | 读 | 客服 | `GET /api/tools/promotions` | 无 |

---

## 6. Agent 系统关键事实

### 6.1 `agents/agent_orchestrator.py`（必读）

- **类**：`AgentOrchestrator`，被 `CopilotAgent` 与 `CustomerAgent` 继承
- **方法**：
  - `run(session_id, user_input, enable_tools, caller_user_id, operator_info, pre_hook)` → 异步生成器
  - `resume_after_confirm(session_id, confirmed, operator_info, confirm_token)` → 结构化确认入口
- **常量**：`MAX_ITERATIONS = 6`（单轮最多 6 步工具循环）
- **事件类型**（SSE 推给前端）：
  - `session` / `tool_call` / `confirm` / `tool_result` / `final` / `error`
- **挂起存储**：Redis `ai:session:{id}:pending`（**服务重启仍可恢复**）；`confirm` 事件下发 `confirm_token`，前端按钮/接口提交令牌后才执行
- **执行期白名单**：工具调用执行前再次校验 `ALLOWED_TOOLS`，防止模型被诱导调用未暴露的工具
- **权限注入**：`caller_user_id` 存在时自动给 `query_orders` 注入 `user_id`；`query_cart` 强制覆盖 `session_id`

### 6.2 `agents/copilot_agent.py`

- `ALLOWED_TOOLS` 列出 8 个工具（含写操作）
- 使用 `settings.models.tool`（默认 StepFun，`.env` 可切）
- 系统提示词约束：**只用 SELECT/WITH**、**写操作必须先解释**、**数字必须精确**、**mock 数据要标注**

### 6.3 `agents/customer_agent.py`

- `ALLOWED_TOOLS` 只有 4 个**只读**工具
- 使用 `settings.models.chat`
- `pre_hook` 每轮做语言检测（Unicode → 拉丁特征词 → LLM 兜底），结果回填到 system prompt
- 同会话语言缓存（`self._session_lang`），避免每轮重复检测
- 把检测到的语言附加到 `final` 事件 `event["language"]`，前端可切 UI 语言

---

## 7. 配置（.env 速查）

### 7.1 ai-service .env（最小运行）

```env
APP_ENV=local
APP_PORT=8000
STEPFUN_API_KEY=<your-key>             # 或 DEEPSEEK_API_KEY / OLLAMA_BASE_URL
MODEL_CHAT=openai/step-3.7-flash       # 当前 .env 已配置
MODEL_TOOL=openai/step-3.7-flash
MODEL_EMBEDDING=BAAI/bge-m3
JAVA_API_BASE_URL=http://localhost:8081
REDIS_URL=redis://localhost:6379/0
DATABASE_URL=postgresql+asyncpg://admin:admin@localhost:5432/ai_cbe
CHROMA_BASE_URL=http://localhost:8001
REQUIRE_HUMAN_CONFIRM_WRITE=true
ENABLE_MOCK_FALLBACK=true          # 已失效：工具层改为直接报错，不再回退 MOCK
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

> **backend/.env 新增必填项**：`JWT_SECRET`（≥32 字节，不能是历史默认值，否则启动 fail-fast）、
> `DEV_LOGIN_FALLBACK`（演示口令 `admin/ant.design` 开关，默认 false，生产必须 false）、
> `API_DOCS_ENABLED`（false 时 swagger / api-docs / actuator info+prometheus 转为需鉴权）。

LiteLLM provider 前缀示例：`openai/...`(StepFun)、`deepseek/...`、`zhipu/...`、`dashscope/...`、`ollama/qwen2.5:7b`。

**StepFun 特别说明**（`core/model_router.py`）：会自动把 `STEPFUN_API_KEY` 注入 `OPENAI_API_KEY`，并设置 `OPENAI_API_BASE=https://api.stepfun.com/step_plan/v1`。

### 7.2 backend .env / application.properties

- 端口：`server.port=8081`
- PostgreSQL：`jdbc:postgresql://localhost:5432/ecommerce`（库名 `ecommerce`，用户 `admin` / `ykfpostgres`）
- Flyway：自动迁移
- multipart：`spring.servlet.multipart.max-file-size=20MB`

---

## 8. API 契约（外部接口）

### 8.1 ai-service（端口 8000）

| 方法 | 路径 | 入参 | 用途 |
|------|------|------|------|
| GET  | `/health` | — | 健康检查 |
| POST | `/api/copilot/chat` | `{message, session_id?, enable_tools?}` | Admin Copilot 流式对话 |
| POST | `/api/copilot/confirm` | `{session_id, confirmed, confirm_token}` | 写操作结构化确认/拒绝 |
| GET  | `/api/copilot/sessions` | `limit?, offset?` | 当前用户会话历史 |
| GET  | `/api/copilot/sessions/{id}/messages` | — | 指定会话的消息记录 |
| GET  | `/api/copilot/operations` | `limit?, offset?` | 当前用户写操作历史 |
| POST | `/api/customer/chat` | `{message, session_id?, user_id!, cart_context?}` | 智能客服（user_id 必填） |

SSE 事件统一为 `data: <json>\n\n`。详细 schema 见 [ai-service/api/copilot.py](file:///d:/ai_cbe/ai-service/api/copilot.py) 与 [ai-service/api/customer.py](file:///d:/ai_cbe/ai-service/api/customer.py)。

### 8.2 backend（端口 8081）

- **公开认证**（无需 /api/admin 前缀）：`/api/login/account`、`/api/login/outLogin`、`/api/currentUser`、`/api/tools/...`（被 ai-service 调用）
- **Admin 后台**（需 Bearer Token）：`/api/admin/...`，完整列表见 [docs/ADMIN-TEST-REPORT.md](file:///d:/ai_cbe/docs/ADMIN-TEST-REPORT.md)
- **Storefront GraphQL**：`/graphql`
- **健康检查**：`/actuator/health`

---

## 9. 常见任务索引（"改 X 看哪里"）

| 任务 | 优先打开的文件（按顺序） |
|------|------------------------|
| 新增一个业务工具 | [tools/base.py](file:///d:/ai_cbe/ai-service/tools/base.py) → 新建 `tools/xxx_tools.py`（仿 product_tools）→ [tools/__init__.py](file:///d:/ai_cbe/ai-service/tools/__init__.py) 注册 → 需要的 Agent `ALLOWED_TOOLS` 加白名单 |
| 调整 Copilot 系统提示词/工具集 | [agents/copilot_agent.py](file:///d:/ai_cbe/ai-service/agents/copilot_agent.py) |
| 调整客服系统提示词/工具集/语言策略 | [agents/customer_agent.py](file:///d:/ai_cbe/ai-service/agents/customer_agent.py) + [core/language_detector.py](file:///d:/ai_cbe/ai-service/core/language_detector.py) |
| 改编排主循环/事件流/确认流程 | [agents/agent_orchestrator.py](file:///d:/ai_cbe/ai-service/agents/agent_orchestrator.py) |
| 切换 LLM 厂商/调整模型 | [.env](file:///d:/ai_cbe/ai-service/.env) + [core/model_router.py](file:///d:/ai_cbe/ai-service/core/model_router.py) |
| 调整会话压缩策略/TTL | [core/session_manager.py](file:///d:/ai_cbe/ai-service/core/session_manager.py)（`COMPRESSION_THRESHOLD=20`, `KEEP_RECENT=6`） |
| 改 RAG 检索/入库 | [core/rag_engine.py](file:///d:/ai_cbe/ai-service/core/rag_engine.py) + [rag/ingest.py](file:///d:/ai_cbe/ai-service/rag/ingest.py) |
| 改 SSE 协议/请求体 | [api/copilot.py](file:///d:/ai_cbe/ai-service/api/copilot.py) 或 [api/customer.py](file:///d:/ai_cbe/ai-service/api/customer.py) |
| 加 admin 页面 | [admin/config/routes.ts](file:///d:/ai_cbe/admin/config/routes.ts) + 在 [admin/src/pages/](file:///d:/ai_cbe/admin/src/pages) 新建目录 |
| 改 admin 跨端类型 | [admin/src/types/contract.ts](file:///d:/ai_cbe/admin/src/types/contract.ts)（与 Java 对齐） |
| 排查 admin 端 | 直接看 [admin/CLAUDE.md](file:///d:/ai_cbe/admin/CLAUDE.md)，不要再扫文件 |
| 改 CORS/安全/启动 | [ai-service/main.py](file:///d:/ai_cbe/ai-service/main.py) + [ai-service/config/settings.py](file:///d:/ai_cbe/ai-service/config/settings.py) |
| **修改后端 CRUD 字段映射** | [backend/src/main/java/com/example/backend/entity/](file:///d:/ai_cbe/backend/src/main/java/com/example/backend/entity) + `service/XxxService.java` |
| **修改后端 SQL 行为** | [backend/src/main/resources/mapper/](file:///d:/ai_cbe/backend/src/main/resources/mapper) |
| **新增 Flyway 迁移** | `backend/src/main/resources/db/migration/V{N}__{name}.sql`；修改已应用脚本需 `mvnw flyway:repair` |
| **排查后端 500** | `backend/logs/backend.out`（启动时把 stdout/stderr 重定向到这里） |
| **重跑 admin 联调** | `powershell -ExecutionPolicy Bypass -File d:\ai_cbe\docs\admin-test.ps1` |

---

## 10. 关键约定（不要违反）

1. **写操作必须 `require_confirm=True`**（Copilot 默认拦截；客服 Agent 根本不被授予定义写操作）
2. **客服 Agent 永远不应拿到写操作**（修改 `ALLOWED_TOOLS` 时核对）
3. **Java 后端失败直接报错**：每个走 Java 的工具都要 `try/except`，通过 `tools/base.py: propagate_error()` 统一处理；**已无 MOCK 回退**（`ENABLE_MOCK_FALLBACK` 不再生效），不要把假数据返回给用户
4. **新增工具的 schema 用 OpenAI Function Calling 格式**（`type: function` + `function.{name, description, parameters}`）
5. **新页面访问控制**：admin 端在 `config/routes.ts` 用 `access: 'canAdmin' | 'canView'`
6. **`admin/src/services/` 禁止手改**，要改用 `npm run openapi` 重新生成
7. **admin 用 Biome 而非 ESLint/Prettier**（`npm run lint` = biome + tsc）
8. **不安装/启用 LangGraph**（`agent_orchestrator` 是纯 async 循环，刻意降低依赖）
9. **.env 不要 commit**；模板提交到 `.env.example`
10. **Agent 修改代码前先看本索引；只在必要时才打开具体源文件**
11. **后端 `service.update` 必须做 partial update**：只覆盖入参中非 null 字段（参见 §4.3 修复记录）
12. **PowerShell 多部分上传用 `Send-MultipartForm`**，不要用 `Invoke-WebRequest -Form`
13. **Spring Boot `OFFSET` 不可负**：0-based 分页用 `page * size`，不要用 `(page - 1) * size`
14. **鉴权规则只集中在 `config/SecurityConfig.java`**（全仓无 `@PreAuthorize`）：新增管理接口若不在 `/api/admin/**` 下，必须同步补 `requestMatchers` 规则，否则默认只要求「已登录」
15. **JWT `role` 是小写**：`JwtAuthenticationFilter` 会 `toUpperCase()` 后授予 `ROLE_ADMIN` 等权限；principal 是 `security/AuthUser(id, username, role)`，取当前用户 ID 用 `AuthUser.resolveId(...)`
16. **订单列表不信任前端 `userId`**：`OrderController.list` 按 token 身份强制过滤（管理角色除外），未认证请求返回空；`createOrder` 的 `userId` 也只从 token 取

---

## 11. 快速命令

```bash
# AI 服务
cd ai-service
pip install -e .
cp .env.example .env  # 然后填 API Key
uvicorn main:app --reload --port 8000
python demo_copilot.py   # 无前端跑通 Copilot

# Java 后端（务必先 cd 到 backend/）
cd backend
mvnw.cmd -DskipTests package
java -jar target\backend-0.0.1-SNAPSHOT.jar     # 端口 8081

# 基础设施（项目根目录）
docker compose up -d mysql redis chroma
# 可选：本地模型
docker compose up -d ollama
docker exec cbe-ollama ollama pull qwen2.5:7b

# RAG 入库
python -m rag.ingest --demo

# admin 端
cd admin
npm start                # 带 mock 跑 dev
npm run dev              # 不带 mock
npm run lint             # biome + tsc
npm run test             # Jest
npm run e2e              # Playwright

# Admin 后台联调（需后端在跑）
powershell -ExecutionPolicy Bypass -File d:\ai_cbe\docs\admin-test.ps1
```

（每次执行完任务更新这个索引文档）
