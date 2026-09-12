-- 创建站点配置表 (单行记录，用于 SEO 全局配置)
CREATE TABLE IF NOT EXISTS site_config (
    id              BIGINT PRIMARY KEY DEFAULT 1,
    title_suffix    VARCHAR(255) NOT NULL DEFAULT 'MyStore',
    description_template TEXT NOT NULL DEFAULT 'Premium quality products at affordable prices. Shop now at MyStore.',
    og_image_url    VARCHAR(500) NOT NULL DEFAULT '/og-default.png',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 确保只有一行记录
    CONSTRAINT single_row CHECK (id = 1)
);

-- 插入默认配置
INSERT INTO site_config (id, title_suffix, description_template, og_image_url)
VALUES (1, 'MyStore', 'Premium quality products at affordable prices. Shop now at MyStore.', '/og-default.png')
ON CONFLICT (id) DO NOTHING;
