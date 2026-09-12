package com.example.backend.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 创建订单请求 DTO（storefront checkout 提交）
 */
@Data
public class OrderRequest {
    private List<OrderLineItem> items;
    private String customerEmail;
    private String customerNote;
    private ShippingInfo shippingAddress;

    /** 优惠券代码（可选） */
    private String couponCode;

    @Data
    public static class OrderLineItem {
        private Long productId;
        private Integer quantity;
    }

    @Data
    public static class ShippingInfo {
        private String fullName;
        private String street;
        private String city;
        private String state;
        private String postalCode;
        private String country;
        private String phone;
    }

    /** 兼容旧调用（仅 totalAmount 时使用） */
    private BigDecimal totalAmount;
}
