-- Add REFUNDED to orders status CHECK constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING', 'PAID', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED'));

-- Support requests table (after-sales / customer service)
CREATE TABLE support_requests (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL DEFAULT 'GENERAL'
        CHECK (type IN ('GENERAL', 'REFUND', 'EXCHANGE', 'COMPLAINT')),
    message TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_support_requests_order_id ON support_requests(order_id);
CREATE INDEX idx_support_requests_status ON support_requests(status);
