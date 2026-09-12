package com.example.backend.dto.customer;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * C 端顾客登录请求。
 */
@Data
public class CustomerLoginRequest {

    @NotBlank(message = "邮箱不能为空")
    private String email;

    @NotBlank(message = "密码不能为空")
    private String password;
}
