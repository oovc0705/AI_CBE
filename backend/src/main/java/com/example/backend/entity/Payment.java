package com.example.backend.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * 支付流水实体（payments 表）
 * 每次支付尝试一条记录，便于追溯（不对接真实网关，仅记录）
 */
@Data
public class Payment {
    private Long id;
    private Long orderId;
    private String paymentMethod;
    private BigDecimal amount;
    private String currency = "USD";
    private String transactionNo;
    private String status = "PENDING";
    private String providerMessage;
    private Instant createdAt;
    private Instant updatedAt;
}
