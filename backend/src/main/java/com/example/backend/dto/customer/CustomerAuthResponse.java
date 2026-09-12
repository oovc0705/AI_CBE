package com.example.backend.dto.customer;

import lombok.Builder;
import lombok.Data;

/**
 * C 端认证成功响应：JWT + 用户档案（不含口令哈希）。
 */
@Data
@Builder
public class CustomerAuthResponse {

    private String token;
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private String language;
    private String currency;
    private String memberLevel;
    private Integer points;
}
