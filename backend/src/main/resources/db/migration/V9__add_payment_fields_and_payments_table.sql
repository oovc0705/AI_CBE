-- ============================================
-- Flyway V9: 跨境电商支付字段与支付流水表
-- 不对接真实网关，仅模拟支付通道选择 / 交易号 / 支付时间
-- ============================================

-- 1) orders 增加支付方式 / 交易号 / 支付时间 / 收件人邮箱 / 备注
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS payment_method   VARCHAR(20),
    ADD COLUMN IF NOT EXISTS payment_status   VARCHAR(20) NOT NULL DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'PAID', 'REFUNDED', 'FAILED')),
    ADD COLUMN IF NOT EXISTS transaction_no   VARCHAR(100),
    ADD COLUMN IF NOT EXISTS paid_at          TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS customer_email   VARCHAR(255),
    ADD COLUMN IF NOT EXISTS customer_note    TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS shipping_fee     DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS tax_amount       DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- 支付方式取值约束（跨境电商常见通道）
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
    CHECK (payment_method IS NULL OR payment_method IN
        ('CARD', 'PAYPAL', 'WECHAT', 'ALIPAY', 'STRIPE'));

CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_no ON orders(transaction_no);

-- 2) 支付流水表（每次支付尝试一条记录，便于追溯）
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL
        CHECK (payment_method IN ('CARD', 'PAYPAL', 'WECHAT', 'ALIPAY', 'STRIPE')),
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    transaction_no VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    provider_message TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_no ON payments(transaction_no);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
