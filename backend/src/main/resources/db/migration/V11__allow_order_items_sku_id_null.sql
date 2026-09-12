-- ============================================
-- Flyway V11: 允许 order_items.sku_id 为 NULL
-- storefront 当前仅按 productId 下单，无 SKU 选择功能
-- ============================================

ALTER TABLE order_items
    ALTER COLUMN sku_id DROP NOT NULL;