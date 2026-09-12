package com.example.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * 最小化订单实体（用于 storefront / API 输出）
 * 适配现有的 orders 表结构（含 V9 跨境支付字段）
 */
@Data
public class SimpleOrder {
    private Long id;
    private String orderNo;
    private Long userId;
    private BigDecimal totalAmount;
    private String currency = "USD";
    private SimpleOrderStatus status = SimpleOrderStatus.PENDING;
    private JsonNode shippingAddress;
    private Long couponId;
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private String stripeSessionId;

    // 跨境支付扩展字段（V9）
    private String paymentMethod;
    private String paymentStatus = "UNPAID";
    private String transactionNo;
    private Instant paidAt;
    private String customerEmail;
    private String customerNote;
    private BigDecimal shippingFee = BigDecimal.ZERO;
    private BigDecimal taxAmount = BigDecimal.ZERO;

    private Instant createdAt;
    private Instant updatedAt;

    /** 订单明细（GET /orders/{id} 时返回） */
    private List<OrderItem> items;
}
