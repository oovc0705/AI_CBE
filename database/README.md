# DTC 跨境电商独立站数据库设计

## 技术栈
- **PostgreSQL 16** + **pgvector** (AI 向量检索)
- **JSONB** (多语言 / 动态规格 / 快照)
- **Prisma ORM** (可选，schema 已提供)

## 目录结构
```
database/
├── init/
│   ├── 01_extensions.sql      # 启用 pgvector 等扩展
│   ├── 02_schema.sql          # 核心表结构 (users, products, orders, coupons...)
│   └── 03_triggers.sql        # updated_at 自动更新触发器
├── prisma/
│   ├── schema.prisma          # Prisma Schema 定义
│   ├── seed.ts                # 示例种子数据
│   └── vector-queries.sql     # AI 向量检索示例 SQL
└── README.md
```

## 核心设计亮点

### 1. JSONB 多语言支持
- `categories.name_i18n` -> `{"en": "Shoes", "zh": "鞋靴", "es": "Zapatos"}`
- `products.title_i18n` / `desc_i18n` -> 多语言标题与 AI 生成描述
- 配合 GIN 索引加速 JSONB 查询

### 2. JSONB 动态规格与快照
- `product_skus.attributes` -> `{"Color": "Black", "Size": "42"}`
- `orders.shipping_address` -> 下单时地址快照
- `order_items.product_snapshot` -> 下单时商品信息快照

### 3. pgvector AI 向量检索
- `products.embedding VECTOR(1536)` -> 商品文本向量
- HNSW 索引 (`vector_cosine_ops`) -> 毫秒级相似度搜索
- 支持 AI 导购、相似商品推荐

### 4. SPU + SKU 模型
- `products` 表决定"是什么" (SPU)
- `product_skus` 表决定"卖多少钱、有多少货" (SKU)

## 快速开始

### 使用 Docker Compose (已包含在根目录)
根目录 `docker-compose.yml` 已配置 `pgvector/pgvector:pg16` 镜像：

```bash
docker-compose up -d postgres
```

### 手动执行初始化 SQL
```bash
psql -U admin -d ecommerce -f database/init/01_extensions.sql
psql -U admin -d ecommerce -f database/init/02_schema.sql
psql -U admin -d ecommerce -f database/init/03_triggers.sql
```

### 使用 Prisma (可选)
```bash
cd database/prisma
# 配置 DATABASE_URL 后
npx prisma migrate dev --name init
npx prisma db seed
npx prisma studio
```

## 关键索引说明
| 索引名 | 类型 | 用途 |
|--------|------|------|
| `idx_products_embedding` | HNSW (vector_cosine_ops) | AI 相似商品推荐 |
| `idx_categories_name_i18n` | GIN | 多语言分类名检索 |
| `idx_products_title_i18n` | GIN | 多语言商品标题检索 |
| `idx_product_skus_attributes` | GIN | SKU 规格属性过滤 |
