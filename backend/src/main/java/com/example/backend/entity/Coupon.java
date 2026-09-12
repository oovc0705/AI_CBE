package com.example.backend.entity;

import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * 优惠券/折扣码表
 */
@Data
public class Coupon {
    private Long id;
    private String code;
    private CouponType type;
    private BigDecimal value;
    private BigDecimal minOrderAmount;
    private Integer usageLimit;
    private Integer usedCount;
    private String status; // ACTIVE / INACTIVE
    private Instant expiresAt;
    private Instant createdAt;
    private Instant updatedAt;
}
