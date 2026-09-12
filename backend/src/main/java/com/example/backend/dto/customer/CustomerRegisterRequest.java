package com.example.backend.dto.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * C 端顾客注册请求。
 */
@Data
public class CustomerRegisterRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Size(max = 254, message = "邮箱过长")
    private String email;

    /** bcrypt 只取前 72 字节，超长口令会被静默截断，因此在入口就限制 */
    @NotBlank(message = "密码不能为空")
    @Size(min = 8, max = 72, message = "密码长度需在 8-72 位之间")
    private String password;

    @Size(max = 100)
    private String firstName;

    @Size(max = 100)
    private String lastName;

    @Size(max = 10)
    private String language;

    @Size(max = 10)
    private String currency;
}
