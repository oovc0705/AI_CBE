-- Admin 管理模块核心表
-- 从 ai-service 迁移到 Java backend 的 ecommerce 数据库
-- 主键统一使用 UUID String，避免与业务核心表 Long 主键冲突

-- ==================== 运费模板 ====================
CREATE TABLE IF NOT EXISTS shipping_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    billing_type VARCHAR(32) NOT NULL DEFAULT 'weight',
    free_shipping_threshold DOUBLE PRECISION,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipping_templates_enabled ON shipping_templates(enabled);
CREATE INDEX IF NOT EXISTS idx_shipping_templates_is_default ON shipping_templates(is_default);

CREATE TABLE IF NOT EXISTS shipping_rules (
    id VARCHAR(64) PRIMARY KEY,
    template_id VARCHAR(64) NOT NULL,
    region VARCHAR(128) NOT NULL,
    country_code VARCHAR(16) NOT NULL,
    first_unit DOUBLE PRECISION NOT NULL DEFAULT 0,
    first_unit_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
    additional_unit DOUBLE PRECISION NOT NULL DEFAULT 0,
    additional_unit_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipping_rules_template_id ON shipping_rules(template_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rules_country_code ON shipping_rules(country_code);

-- ==================== 物流商 ====================
CREATE TABLE IF NOT EXISTS shipping_carriers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    logo_url VARCHAR(1000),
    contact_phone VARCHAR(32),
    website VARCHAR(500),
    tracking_url_template VARCHAR(1000),
    api_type VARCHAR(32) NOT NULL DEFAULT 'manual',
    api_config JSONB,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipping_carriers_enabled ON shipping_carriers(enabled);
CREATE INDEX IF NOT EXISTS idx_shipping_carriers_code ON shipping_carriers(code);

-- ==================== 支付方式 ====================
CREATE TABLE IF NOT EXISTS payment_gateways (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    connected BOOLEAN NOT NULL DEFAULT FALSE,
    config JSONB,
    last_four_digits VARCHAR(8),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_gateways_enabled ON payment_gateways(enabled);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    gateway_id VARCHAR(64) NOT NULL,
    gateway_transaction_id VARCHAR(255),
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'USD',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    raw_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON payment_transactions(gateway_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_txn_order_created ON payment_transactions(order_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

-- ==================== 商品评价 ====================
CREATE TABLE IF NOT EXISTS product_reviews (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL,
    product_name VARCHAR(255),
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(255),
    order_id VARCHAR(64),
    rating INTEGER NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    images JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    merchant_reply TEXT,
    replied_at TIMESTAMPTZ,
    replied_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_id ON product_reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at);

-- ==================== 营销活动 ====================
CREATE TABLE IF NOT EXISTS promotions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    discount_type VARCHAR(32) NOT NULL DEFAULT 'percentage',
    discount_value DOUBLE PRECISION NOT NULL,
    min_order_amount DOUBLE PRECISION,
    max_discount DOUBLE PRECISION,
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    applicable_product_ids JSONB,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions(type);
CREATE INDEX IF NOT EXISTS idx_promotions_starts_at ON promotions(starts_at);
CREATE INDEX IF NOT EXISTS idx_promotions_ends_at ON promotions(ends_at);
CREATE INDEX IF NOT EXISTS idx_promotions_enabled ON promotions(enabled);

-- ==================== 邮件模板与邮件营销 ====================
CREATE TABLE IF NOT EXISTS email_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(128) NOT NULL UNIQUE,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    variables JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_templates_code ON email_templates(code);

CREATE TABLE IF NOT EXISTS email_campaigns (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_id VARCHAR(64),
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'draft',
    recipient_count INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_template_id ON email_campaigns(template_id);

-- ==================== RBAC 角色权限 ====================
CREATE TABLE IF NOT EXISTS admin_roles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_name ON admin_roles(name);

CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512),
    first_name VARCHAR(128),
    last_name VARCHAR(128),
    avatar_url VARCHAR(500),
    role_id VARCHAR(64),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON admin_users(role_id);

-- ==================== 系统通知 ====================
CREATE TABLE IF NOT EXISTS system_notifications (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    recipient_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_notifications_type ON system_notifications(type);
CREATE INDEX IF NOT EXISTS idx_system_notifications_is_read ON system_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_system_notifications_recipient_id ON system_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON system_notifications(recipient_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_system_notifications_created_at ON system_notifications(created_at);

-- ==================== AI 知识库管理 ====================
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    collection VARCHAR(64) NOT NULL DEFAULT 'copilot_kb',
    document_type VARCHAR(32) NOT NULL DEFAULT 'txt',
    file_url VARCHAR(1000),
    file_name VARCHAR(500),
    file_size INTEGER,
    content TEXT NOT NULL DEFAULT '',
    source VARCHAR(255),
    metadata JSONB,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    chunk_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    trained_at TIMESTAMPTZ,
    uploaded_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_collection ON knowledge_documents(collection);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON knowledge_documents(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_created_at ON knowledge_documents(created_at);

CREATE TABLE IF NOT EXISTS faq_entries (
    id VARCHAR(64) PRIMARY KEY,
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(128),
    locale VARCHAR(16) NOT NULL DEFAULT 'en',
    sort_order INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faq_entries_category ON faq_entries(category);
CREATE INDEX IF NOT EXISTS idx_faq_entries_locale ON faq_entries(locale);
CREATE INDEX IF NOT EXISTS idx_faq_entries_enabled ON faq_entries(enabled);

-- ==================== 多货币管理 ====================
CREATE TABLE IF NOT EXISTS currencies (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(8) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    symbol VARCHAR(8) NOT NULL DEFAULT '$',
    exchange_rate DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    decimals INTEGER NOT NULL DEFAULT 2,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rate_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);
CREATE INDEX IF NOT EXISTS idx_currencies_is_default ON currencies(is_default);

-- ==================== 多语言翻译管理 ====================
CREATE TABLE IF NOT EXISTS translation_keys (
    id VARCHAR(64) PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    namespace VARCHAR(64) NOT NULL DEFAULT 'common',
    description VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_translation_keys_namespace ON translation_keys(namespace);

CREATE TABLE IF NOT EXISTS translation_values (
    id VARCHAR(64) PRIMARY KEY,
    key_id VARCHAR(64) NOT NULL,
    locale VARCHAR(16) NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    is_translated BOOLEAN NOT NULL DEFAULT FALSE,
    updated_by VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_translation_values_key_locale UNIQUE (key_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_translation_values_key_id ON translation_values(key_id);
CREATE INDEX IF NOT EXISTS idx_translation_values_locale ON translation_values(locale);

-- ==================== 税费设置 ====================
CREATE TABLE IF NOT EXISTS tax_rules (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country_code VARCHAR(8) NOT NULL,
    region_code VARCHAR(32),
    tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tax_type VARCHAR(32) NOT NULL DEFAULT 'vat',
    is_shipping_taxable BOOLEAN NOT NULL DEFAULT FALSE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tax_rules_country_code ON tax_rules(country_code);
CREATE INDEX IF NOT EXISTS idx_tax_rules_region_code ON tax_rules(region_code);
CREATE INDEX IF NOT EXISTS idx_tax_rules_enabled ON tax_rules(enabled);

-- ==================== 审计日志 ====================
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(128) NOT NULL,
    resource_type VARCHAR(128) NOT NULL,
    resource_id VARCHAR(255),
    user_id VARCHAR(64),
    user_name VARCHAR(255),
    details JSONB,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ==================== 更新时间触发器 ====================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shipping_templates_updated_at'
    ) THEN
        CREATE TRIGGER trg_shipping_templates_updated_at
        BEFORE UPDATE ON shipping_templates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_shipping_carriers_updated_at'
    ) THEN
        CREATE TRIGGER trg_shipping_carriers_updated_at
        BEFORE UPDATE ON shipping_carriers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payment_gateways_updated_at'
    ) THEN
        CREATE TRIGGER trg_payment_gateways_updated_at
        BEFORE UPDATE ON payment_gateways
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_payment_transactions_updated_at'
    ) THEN
        CREATE TRIGGER trg_payment_transactions_updated_at
        BEFORE UPDATE ON payment_transactions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_product_reviews_updated_at'
    ) THEN
        CREATE TRIGGER trg_product_reviews_updated_at
        BEFORE UPDATE ON product_reviews
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_promotions_updated_at'
    ) THEN
        CREATE TRIGGER trg_promotions_updated_at
        BEFORE UPDATE ON promotions
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_email_templates_updated_at'
    ) THEN
        CREATE TRIGGER trg_email_templates_updated_at
        BEFORE UPDATE ON email_templates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_email_campaigns_updated_at'
    ) THEN
        CREATE TRIGGER trg_email_campaigns_updated_at
        BEFORE UPDATE ON email_campaigns
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admin_roles_updated_at'
    ) THEN
        CREATE TRIGGER trg_admin_roles_updated_at
        BEFORE UPDATE ON admin_roles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admin_users_updated_at'
    ) THEN
        CREATE TRIGGER trg_admin_users_updated_at
        BEFORE UPDATE ON admin_users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_knowledge_documents_updated_at'
    ) THEN
        CREATE TRIGGER trg_knowledge_documents_updated_at
        BEFORE UPDATE ON knowledge_documents
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_faq_entries_updated_at'
    ) THEN
        CREATE TRIGGER trg_faq_entries_updated_at
        BEFORE UPDATE ON faq_entries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_currencies_updated_at'
    ) THEN
        CREATE TRIGGER trg_currencies_updated_at
        BEFORE UPDATE ON currencies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_translation_keys_updated_at'
    ) THEN
        CREATE TRIGGER trg_translation_keys_updated_at
        BEFORE UPDATE ON translation_keys
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_translation_values_updated_at'
    ) THEN
        CREATE TRIGGER trg_translation_values_updated_at
        BEFORE UPDATE ON translation_values
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_tax_rules_updated_at'
    ) THEN
        CREATE TRIGGER trg_tax_rules_updated_at
        BEFORE UPDATE ON tax_rules
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
