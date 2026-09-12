# Java 后端工具 API 契约

> ⚠️ **状态：本文档描述的 `/api/tools/*` 契约尚未在 Java 后端实现（2026-09-12 审查确认）。**
> 下方内容保留作为**目标契约**参考，排查问题时不要按它找端点。
>
> **ai-service 工具当前实际调用的路径**（见 `ai-service/tools/*.py`）：
>
> | 工具 | 实际路径 |
> |------|----------|
> | `query_products` / `get_product_detail` | `GET /api/products`、`GET /api/products/{id}` |
> | 商品写操作（改价/改状态/补货/批量） | `POST /api/admin/products/...` |
> | `query_orders` | `GET /api/orders`（支持 `userId`/`orderId`/`orderNo`/`status` 过滤） |
> | `ship_order` / `process_refund` | `POST /api/admin/orders/{id}/ship`、`POST /api/admin/orders/{id}/refund` |
> | Dashboard / 用户 / 优惠券 / 工单 / 导出 | `GET|POST /api/admin/dashboard/*`、`/api/admin/users`、`/api/admin/coupons`、`/api/admin/support`、`/api/admin/*/export` |
>
> 鉴权：工具层透传前端登录用户的 Bearer token（`tools/base.py` 的 `auth_token_context`，**按请求动态取值**），无 token 时回落到 `JAVA_API_TOKEN`。管理端路径要求 `ADMIN`/`OPERATOR` 角色。

> Python AI 服务通过这些 REST 接口调用业务能力。
> Java 侧实现 Spring Boot Controller 时，请严格遵循本文档的路径、方法、入参与返回结构。
> 全部接口走服务间鉴权：请求头 `Authorization: Bearer <JAVA_API_TOKEN>`。

---

## 鉴权与通用约定

| 项 | 值 |
|----|----|
| Base URL | `JAVA_API_BASE_URL`（默认 `http://localhost:8081`） |
| 鉴权头 | `Authorization: Bearer <token>` |
| 内容类型 | `application/json; charset=utf-8` |
| 金额单位 | 浮点数，币种由 `currency` 字段标明（USD/CNY/JPY...） |
| 错误响应 | HTTP 4xx/5xx，body：`{"code": "...", "message": "..."}` |

写操作接口（POST 类）**必须**记录审计日志（操作人、时间、参数、结果）。

---

## 1. 商品查询

`GET /api/tools/products`

**Query 参数**

| 名 | 类型 | 说明 |
|----|------|------|
| keyword | string | 商品名/关键词，模糊匹配 |
| lowStock | int | 库存 ≤ 此值的商品 |

**返回**

```json
{
  "items": [
    {"id": "P1001", "name": "无线降噪耳机 Pro", "stock": 8,
     "price": 79.99, "currency": "USD", "online": true}
  ],
  "total": 1
}
```

---

## 2. 修改商品价格（写操作）

`POST /api/tools/products/{productId}/price`

**Body**

```json
{"price": 89.99, "currency": "USD"}
```

**返回** 更新后的商品对象。

---

## 3. 商品上下架（写操作）

`POST /api/tools/products/{productId}/status`

**Body**

```json
{"online": false}
```

**返回** 更新后的商品对象。

---

## 4. 订单查询

`GET /api/tools/orders`

**Query 参数**

| 名 | 类型 | 说明 |
|----|------|------|
| orderId | string | 精确订单号 |
| userId | string | **C 端用户ID**（客服场景必传，Java 侧据此过滤，确保顾客只能查自己的订单） |
| status | string | pending / paid / shipped / delivered / refunded |
| days | int | 最近 N 天 |

**返回**

```json
{
  "items": [
    {"id": "ORD20240601001", "customer": "user_8421",
     "amount": 159.98, "currency": "USD", "status": "shipped",
     "createdAt": "2024-06-01T10:23:00Z"}
  ],
  "total": 1
}
```

> 安全要求：客服场景下，必须结合调用方用户身份过滤，只返回该用户的订单。

---

## 5. 处理退款（写操作 · 高风险）

`POST /api/tools/orders/{orderId}/refund`

**Body**

```json
{"amount": 159.98, "reason": "商品质量问题"}
```

`amount` 缺省为全额退款。

**返回**

```json
{"orderId": "ORD20240601001", "amount": 159.98, "currency": "USD",
 "status": "refunded", "refundId": "RF20240602001"}
```

---

## 6. 业务数据 SQL 查询（NL2SQL · 只读）

`POST /api/tools/query`

**Body**

```json
{"sql": "SELECT category, SUM(qty) AS sales FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY category"}
```

**安全要求（Java 侧强制校验）**

1. 仅允许以 `SELECT` / `WITH` 开头的语句（拒绝 DDL/DML）。
2. 强制加只读约束（如设置只读数据库账号）。
3. SQL 超时限制（建议 ≤ 10s）。
4. 行数上限（建议 ≤ 1000 行）。
5. 敏感字段（如用户密码、token）不出现在结果集。

**返回**

```json
{
  "columns": ["category", "sales"],
  "rows": [
    {"category": "数码", "sales": 1280},
    {"category": "服饰", "sales": 980}
  ],
  "rowCount": 2
}
```

---

## 工具与 API 映射表

| Python 工具名 | Java 接口 | 写操作 |
|---------------|-----------|--------|
| `query_products` | `GET /api/tools/products` | 否 |
| `update_product_price` | `POST /api/tools/products/{id}/price` | 是 |
| `set_product_status` | `POST /api/tools/products/{id}/status` | 是 |
| `query_orders` | `GET /api/tools/orders` | 否（客服场景强制带 userId 过滤） |
| `process_refund` | `POST /api/tools/orders/{id}/refund` | 是 |
| `query_business_data` | `POST /api/tools/query` | 否（SQL 只读） |
| `generate_marketing_copy` | （纯 AI，无 Java 调用） | 否 |
| `translate_text` | （纯 AI，无 Java 调用） | 否 |
| `search_faq` | （纯 AI + RAG，无 Java 调用） | 否（客服专属） |

---

## 后续扩展

新增工具时遵循：
1. 在 `tools/` 下新增模块，定义 executor + schema，`require_confirm` 标注写操作。
2. 在对应 Agent 的 `ALLOWED_TOOLS` 白名单中登记。
3. 若需 Java 实现，在本文件补充接口契约。
