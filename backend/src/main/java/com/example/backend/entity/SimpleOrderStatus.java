package com.example.backend.entity;

/**
 * 最小化订单状态枚举（仅用于第四阶段）
 * 必须与数据库 CHECK 约束兼容
 */
public enum SimpleOrderStatus {
    PENDING,    // 待支付
    PAID,       // 已支付
    SHIPPED,    // 已发货
    COMPLETED,  // 已完成
    CANCELLED,  // 已取消
    REFUNDED    // 已退款
}
