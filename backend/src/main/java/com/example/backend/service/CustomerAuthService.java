package com.example.backend.service;

import com.example.backend.dto.customer.CustomerAuthResponse;
import com.example.backend.dto.customer.CustomerLoginRequest;
import com.example.backend.dto.customer.CustomerRegisterRequest;
import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import com.example.backend.exception.DuplicateResourceException;
import com.example.backend.mapper.UserMapper;
import com.example.backend.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * C 端顾客认证：注册 / 登录，签发与 B 端同源的 JWT（role=customer）。
 *
 * 身份一律以 token 的 subject（users.id）为准，任何接口都不接受前端自报 userId。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerAuthService {

    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public CustomerAuthResponse register(CustomerRegisterRequest req) {
        String email = normalizeEmail(req.getEmail());
        if (userMapper.findByEmail(email) != null) {
            throw new DuplicateResourceException("该邮箱已注册");
        }

        User user = new User();
        user.setEmail(email);
        // username 有唯一约束，C 端以邮箱作为登录名
        user.setUsername(email);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(UserRole.CUSTOMER);
        user.setFirstName(trimToNull(req.getFirstName()));
        user.setLastName(trimToNull(req.getLastName()));
        user.setLanguage(firstNonBlank(req.getLanguage(), "en"));
        user.setCurrency(firstNonBlank(req.getCurrency(), "USD"));
        user.setMemberLevel("regular");
        user.setPoints(0);
        userMapper.insert(user);

        log.info("Customer registered: id={}", user.getId());
        return toResponse(user, issueToken(user));
    }

    /** 凭证无效时返回 null，由控制器统一给 401，避免暴露「邮箱是否存在」 */
    public CustomerAuthResponse login(CustomerLoginRequest req) {
        String email = normalizeEmail(req.getEmail());
        User user = userMapper.findByEmail(email);
        if (user == null || user.getPasswordHash() == null
                || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return null;
        }
        return toResponse(user, issueToken(user));
    }

    private String issueToken(User user) {
        return jwtUtil.generateToken(
                String.valueOf(user.getId()),
                user.getEmail(),
                user.getRole() == null ? UserRole.CUSTOMER.name().toLowerCase() : user.getRole().name().toLowerCase()
        );
    }

    private CustomerAuthResponse toResponse(User user, String token) {
        return CustomerAuthResponse.builder()
                .token(token)
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
                .build();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String firstNonBlank(String value, String fallback) {
        String trimmed = trimToNull(value);
        return trimmed == null ? fallback : trimmed;
    }
}
