package com.example.backend.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.Data;
import java.time.Instant;
import java.util.List;

/**
 * 用户表 (C端消费者和B端管理员共用)
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class User {
    private Long id;
    private String email;
    private String passwordHash;
    private UserRole role;
    private String username;
    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private String language;        // 语言偏好：en/zh/ja 等
    private String currency;        // 货币偏好：USD/CNY 等
    private String memberLevel;     // 会员等级：regular/silver/gold/platinum
    private Integer points;         // 积分余额
    private JsonNode preferences;   // 用户偏好设置（JSONB）
    private Instant createdAt;
    private Instant updatedAt;

    private List<Address> addresses;
    private List<Order> orders;
}
