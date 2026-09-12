-- ============================================
-- pgvector AI 向量检索示例查询
-- ============================================

-- 1. 插入/更新商品向量 (由 AI 服务生成 1536 维向量后写入)
-- UPDATE products SET embedding = '[0.1, 0.2, ...]'::vector(1536) WHERE id = 1;

-- 2. 基于余弦相似度的相似商品推荐 (AI 导购)
-- 给定一个查询向量，找出最相似的 10 个商品
SELECT
    id,
    slug,
    title_i18n->>'en' AS title_en,
    1 - (embedding <=> :query_vector) AS similarity
FROM products
WHERE status = 'ACTIVE'
    AND embedding IS NOT NULL
ORDER BY embedding <=> :query_vector
LIMIT 10;

-- 3. 基于内积的相似商品推荐 (如果向量已归一化，内积等价于余弦相似度)
SELECT
    id,
    slug,
    title_i18n->>'en' AS title_en,
    embedding <#> :query_vector AS similarity
FROM products
WHERE status = 'ACTIVE'
    AND embedding IS NOT NULL
ORDER BY embedding <#> :query_vector
LIMIT 10;

-- 4. 计算两个商品之间的相似度
SELECT
    p1.id AS product_a,
    p2.id AS product_b,
    1 - (p1.embedding <=> p2.embedding) AS cosine_similarity
FROM products p1
CROSS JOIN products p2
WHERE p1.id = 1 AND p2.id = 2;

-- 5. 按分类过滤的相似商品推荐
SELECT
    p.id,
    p.slug,
    p.title_i18n->>'en' AS title_en,
    1 - (p.embedding <=> :query_vector) AS similarity
FROM products p
WHERE p.status = 'ACTIVE'
    AND p.category_id = :category_id
    AND p.embedding IS NOT NULL
ORDER BY p.embedding <=> :query_vector
LIMIT 10;
