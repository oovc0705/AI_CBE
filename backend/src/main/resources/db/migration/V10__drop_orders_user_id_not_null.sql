-- ============================================
-- Flyway V10: 允许 user_id 为空（支持匿名/未登录下单）
-- 当前 storefront 无登录态，user_id 一定为 null
-- ============================================
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
