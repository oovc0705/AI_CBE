# 架构设计文档

> AI 驱动的跨境电商平台 · AI 部分总览

## 1. 三端职责

| 端 | 角色 | 技术栈 |
|----|------|--------|
| storefront | C 端用户 | 前端 + 内嵌智能客服 |
| admin | 运营/管理员 | 前端 + AI Copilot |
| ai-service | AI 能力提供方 | Python（FastAPI） |
| (电商核心) | 业务后端 | Java（Spring Boot） |

## 2. 分层架构

```
┌─ 前端 (storefront / admin) ──────────────────────────┐
│   Chat Widget  ←→  HTTP/SSE                           │
└──────────────┬────────────────────────────────────────┘
               │
┌──────────────▼─────────────────┐   ┌──────────────────┐
│  Java 后端 (Spring Boot)        │   │  AI 服务 (FastAPI)│
│  ├─ 业务：商品/订单/库存/支付    │◄─►│  ├─ Copilot Agent │
│  └─ 暴露工具 REST API           │   │  ├─ 客服 Agent    │
│      (供 AI 通过工具调用)        │   │  ├─ 模型路由层    │
└──────────────┬─────────────────┘   │  ├─ RAG 引擎      │
               │                      │  └─ 会话管理      │
┌──────────────▼──────────────────────▼──────────────────┐
│  MySQL · Redis · Chroma(向量) · Ollama(本地模型)        │
└────────────────────────────────────────────────────────┘
```

**核心思想**：Java 管业务与交易，Python 管智能。Java 把业务能力封装成「工具 REST API」，AI 服务通过 Function Calling 调用，从而实现「AI 操作业务」。

## 3. AI 服务内部结构

```
ai-service/
├── api/                # FastAPI 路由（SSE 流式）
│   ├── copilot.py      # POST /api/copilot/chat、/confirm
│   ├── customer.py     # POST /api/customer/chat
│   └── health.py
├── core/               # 核心引擎
│   ├── model_router.py # LiteLLM 多模型统一入口 ★
│   ├── session_manager.py # Redis 会话 + 上下文压缩
│   └── rag_engine.py   # 向量检索编排
├── agents/             # 智能体
│   ├── agent_orchestrator.py # 编排循环（思考→工具→确认→执行）★
│   ├── copilot_agent.py # Admin Copilot（含工具白名单+系统提示）
│   └── customer_agent.py# 智能客服
├── tools/              # 业务工具
│   ├── base.py         # 工具注册表 + HTTP 客户端 ★
│   ├── product_tools.py
│   ├── order_tools.py
│   ├── analytics_tools.py # NL2SQL 数据查询
│   └── content_tools.py   # 文案/翻译（纯AI）
├── rag/
│   ├── embeddings.py   # BGE-m3 本地 embedding
│   ├── vectorstore.py  # Chroma 客户端
│   └── ingest.py       # 文档入库脚本
├── config/settings.py  # 环境变量配置 ★
├── main.py             # FastAPI 入口
├── demo_copilot.py     # 命令行演示
└── pyproject.toml
```

## 4. 关键设计决策

### 4.1 模型路由（LiteLLM）
- 业务代码只调 `model_router.chat()`，不关心是 DeepSeek / 智谱 / Ollama。
- 切换模型只改 `.env`，零代码改动。
- 本地测试可全离线（Ollama 拉本地模型），生产可换云端 API。

### 4.2 Agent 编排（自研轻量循环）
当前用纯 async 循环实现「思考→工具→确认→执行→总结」，**不依赖** LangGraph，
降低本地调试门槛。已预留 `pyproject.toml` 的 `graph` 可选依赖，后续如需更复杂的
状态机/分支/人工审批流，可平滑切到 LangGraph。

循环上限 `MAX_ITERATIONS=6`，防止单轮无限调用工具。

### 4.3 写操作人工确认（安全核心）
- 工具注册时 `require_confirm=True` 标记写操作（改价、下架、退款）。
- 编排器遇到写操作时：
  1. yield `tool_call` 事件（前端展示「即将做什么」）
  2. yield `confirm` 事件，挂起循环
  3. 前端弹窗让运营确认 → `POST /api/copilot/confirm`
  4. 编排器恢复执行或取消
- 受 `REQUIRE_HUMAN_CONFIRM_WRITE` 全局开关控制。

### 4.4 NL2SQL 数据问答
- Copilot 把运营自然语言转成 SQL。
- Python 侧做白名单（只允许 SELECT/WITH）。
- Java 侧再做只读账号 + 超时 + 行数上限兜底（纵深防御）。
- LLM 对结果做解读（涨跌、异常、建议），不只甩表格。

### 4.5 会话与上下文压缩
- Redis 存多轮历史，TTL 24h。
- 消息超过 20 条触发摘要压缩：早期消息被 LLM 浓缩成「历史摘要」system 消息，
  只保留最近 6 条原文，避免 Token 爆炸。

### 4.6 RAG
- Chroma（本地 HTTP 服务）+ BGE-m3（多语言 embedding，契合跨境）。
- Copilot 检索 SOP/政策/历史决策给模型补背景。
- 客服检索 FAQ/退货政策/物流时效。
- 入库脚本 `rag/ingest.py`，支持 JSONL 或 `--demo` 内置示例。

## 5. 阶段路线

| 阶段 | 内容 | 状态 |
|------|------|------|
| 一 | 骨架 + Copilot 最小闭环（数据问答/操作/确认/文案） | ✅ 本仓库 |
| 二 | Storefront 智能客服（多语言、订单权限隔离、RAG FAQ） | 骨架已留 |
| 三 | 智能选品、自动报表、个性化推荐、A/B 文案优化 | 待启动 |
