package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * 订单主表
 * shipping_address 使用 JSONB 快照，防止用户后续修改地址影响历史订单
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Order {
    private Long id;
    private String orderNo;
    private Long userId;
    private BigDecimal totalAmount;
    private String currency;
    private OrderStatus status;
    private JsonNode shippingAddress;
    private Long couponId;
    private BigDecimal discountAmount;
    private String stripeSessionId;

    // 跨境支付扩展字段（V9）
    private String paymentMethod;
    private String paymentStatus;
    private String transactionNo;
    private Instant paidAt;
    private String customerEmail;
    private String customerNote;
    private BigDecimal shippingFee;
    private BigDecimal taxAmount;

    private Instant createdAt;
    private Instant updatedAt;

    private User user;
    private List<OrderItem> items;
}
