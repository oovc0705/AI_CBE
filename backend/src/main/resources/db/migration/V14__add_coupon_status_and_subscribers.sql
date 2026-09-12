-- V14: 添加优惠券状态字段 + 订阅者表扩展字段

-- 1. 优惠券启用/停用状态
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
UPDATE coupons SET status = 'ACTIVE' WHERE status IS NULL;

-- 2. 确保订阅者表存在
CREATE TABLE IF NOT EXISTS subscribers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 为已存在的订阅者表补充字段（兼容旧结构）
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'website';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE subscribers SET source = 'website' WHERE source IS NULL;
UPDATE subscribers SET active = TRUE WHERE active IS NULL;

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(active);
CREATE INDEX IF NOT EXISTS idx_subscribers_source ON subscribers(source);
