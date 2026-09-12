package com.example.backend.entity;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * 商品规格/库存表 SKU - 决定"卖多少钱、有多少货"
 * attributes 使用 JSONB 存储动态规格属性 {"Color": "Black", "Size": "42"}
 */
@Data
public class ProductSku {
    private Long id;
    private Long productId;
    private String skuCode;
    private JsonNode attributes;
    private BigDecimal price;
    private Integer stock;
    private Instant createdAt;
    private Instant updatedAt;

    private Product product;
    private List<OrderItem> orderItems;
}
