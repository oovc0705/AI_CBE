package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * 订单明细表
 * product_snapshot 使用 JSONB 快照，商品下架或改名不影响历史订单
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrderItem {
    private Long id;
    private Long orderId;
    private Long skuId;
    private JsonNode productSnapshot;
    private BigDecimal price;
    private Integer quantity;
    private Instant createdAt;

    private Order order;
    private ProductSku sku;
}
