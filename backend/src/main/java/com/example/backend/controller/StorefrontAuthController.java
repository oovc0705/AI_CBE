package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.customer.CustomerAuthResponse;
import com.example.backend.dto.customer.CustomerLoginRequest;
import com.example.backend.dto.customer.CustomerRegisterRequest;
import com.example.backend.entity.User;
import com.example.backend.mapper.UserMapper;
import com.example.backend.security.AuthUser;
import com.example.backend.security.LoginRateLimiter;
import com.example.backend.service.CustomerAuthService;
import com.example.backend.util.RequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * C 端顾客认证接口（公开路径 /api/storefront/**）。
 *
 * 注册与登录都按 IP 限流；/me 从 token 解析身份，不接受前端传 userId。
 */
@RestController
@RequestMapping("/api/storefront/auth")
@RequiredArgsConstructor
public class StorefrontAuthController {

    private final CustomerAuthService customerAuthService;
    private final LoginRateLimiter rateLimiter;
    private final UserMapper userMapper;

    @PostMapping("/register")
    public ResponseEntity<Result<CustomerAuthResponse>> register(
            @Valid @RequestBody CustomerRegisterRequest req, HttpServletRequest request) {
        String limitKey = "rate:register:" + RequestUtils.clientIp(request);
        if (rateLimiter.isLimited(limitKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Result.error(429, "注册尝试过于频繁，请稍后再试"));
        }
        CustomerAuthResponse response = customerAuthService.register(req);
        rateLimiter.reset(limitKey);
        return ResponseEntity.ok(Result.success(response));
    }

    @PostMapping("/login")
    public ResponseEntity<Result<CustomerAuthResponse>> login(
            @Valid @RequestBody CustomerLoginRequest req, HttpServletRequest request) {
        String limitKey = "rate:login:customer:" + RequestUtils.clientIp(request);
        if (rateLimiter.isLimited(limitKey)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Result.error(429, "登录尝试过于频繁，请稍后再试"));
        }
        CustomerAuthResponse response = customerAuthService.login(req);
        if (response == null) {
            // 统一措辞，避免暴露邮箱是否已注册
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Result.error(401, "邮箱或密码错误"));
        }
        rateLimiter.reset(limitKey);
        return ResponseEntity.ok(Result.success(response));
    }

    /** 当前登录顾客档案。身份只取自 token，路径公开但未带 token 时返回 401。 */
    @GetMapping("/me")
    public ResponseEntity<Result<CustomerAuthResponse>> me(Authentication authentication) {
        Long userId = authentication == null ? null : AuthUser.resolveId(authentication.getPrincipal());
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Result.error(401, "请先登录"));
        }
        User user = userMapper.findById(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Result.error(401, "请先登录"));
        }
        return ResponseEntity.ok(Result.success(CustomerAuthResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .language(user.getLanguage())
                .currency(user.getCurrency())
                .memberLevel(user.getMemberLevel())
                .points(user.getPoints())
                .build()));
    }
}
