-- 站点配置表新增营销相关字段：GA4 Measurement ID 和 Twitter 账号
ALTER TABLE site_config
    ADD COLUMN IF NOT EXISTS ga_measurement_id VARCHAR(20) DEFAULT '',
    ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(50) DEFAULT '';
