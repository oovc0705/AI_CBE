# AI Service · 跨境电商 AI 服务

Admin Copilot + 智能客服，Python（FastAPI + LiteLLM）实现。

## 目录结构

```
ai-service/
├── api/            # FastAPI 路由（SSE 流式）
├── core/           # 模型路由 / 会话 / RAG 引擎
├── agents/         # Copilot Agent、客服 Agent、编排器
├── tools/          # 业务工具（HTTP 调 Java）
├── rag/            # 向量检索
├── config/         # 配置
├── data/           # 本地数据（向量库/缓存，已 gitignore）
├── main.py         # FastAPI 入口
├── demo_copilot.py # 命令行演示
├── pyproject.toml
└── .env.example
```

## 快速开始

### 1. 安装依赖（见根目录汇总）

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -e .
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 按需填写 API Key 或保持 Ollama 本地模式
```

**模型配置示例（按场景二选一）**：

离线本地（推荐本地测试）：
```env
MODEL_CHAT=ollama/qwen2.5:7b
MODEL_TOOL=ollama/qwen2.5:7b
OLLAMA_BASE_URL=http://localhost:11434
# 先拉模型：docker exec cbe-ollama ollama pull qwen2.5:7b
```

云端 API（国内可直连）：
```env
DEEPSEEK_API_KEY=sk-xxx
MODEL_CHAT=deepseek/deepseek-chat
MODEL_TOOL=deepseek/deepseek-chat
```

### 3. 启动基础设施

在项目根目录：
```bash
docker compose up -d mysql redis chroma
# 可选：启动本地模型
docker compose up -d ollama
docker exec cbe-ollama ollama pull qwen2.5:7b
```

> 仅做 AI 部分本地测试、不连 Java 后端时，工具会返回 `[MOCK]` 数据。

### 4. 运行服务

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

访问 `http://localhost:8000/docs` 查看 OpenAPI 文档。

### 5. 命令行演示（无需前端）

```bash
python demo_copilot.py
```

支持对话式交互，写操作会在终端询问确认。示例问题：
- 上周哪些品类销量跌了？
- 帮我把库存低于10的商品下架
- 给无线降噪耳机 Pro 写一份英文营销文案

## API 速览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/api/copilot/chat` | Copilot 流式对话（SSE） |
| POST | `/api/copilot/confirm` | 对写操作确认/拒绝（SSE） |
| POST | `/api/customer/chat` | 客服流式对话（SSE，阶段二完善） |

SSE 事件类型：`session` / `tool_call` / `confirm` / `tool_result` / `final` / `error`。

## RAG 入库

```bash
# 内置演示文档
python -m rag.ingest --demo

# 自定义 JSONL
python -m rag.ingest --source data/copilot_kb.jsonl
```

JSONL 格式：
```json
{"content": "...", "metadata": {"type": "sop", "category": "运营"}}
```

## 配置项说明

见 [`.env.example`](./.env.example)，全部配置项有注释。

关键项：
- `MODEL_CHAT` / `MODEL_TOOL`：对话与工具调用用的模型（LiteLLM provider 前缀）。
- `JAVA_API_BASE_URL` / `JAVA_API_TOKEN`：电商后端地址与服务间鉴权。
- `REQUIRE_HUMAN_CONFIRM_WRITE`：写操作是否强制人工确认（默认 true）。

## 相关文档

- [架构设计](../docs/architecture.md)
- [Java 工具 API 契约](../docs/java-api-contract.md)
