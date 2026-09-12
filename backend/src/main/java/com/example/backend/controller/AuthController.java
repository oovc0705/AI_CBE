package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.CurrentUserResponse;
import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.LoginResult;
import com.example.backend.entity.User;
import com.example.backend.entity.UserRole;
import com.example.backend.mapper.UserMapper;
import com.example.backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /** 开发环境演示口令兜底，默认关闭；生产严禁开启 */
    @Value("${app.dev-login-fallback:false}")
    private boolean devLoginFallback;

    private static final int LOGIN_WINDOW_MS = 60_000;
    private static final int LOGIN_MAX_ATTEMPTS = 10;
    private final Map<String, LoginAttempt> loginAttempts = new ConcurrentHashMap<>();

    private record LoginAttempt(AtomicInteger count, long windowStart) {}

    private boolean isRateLimited(String ip) {
        long now = System.currentTimeMillis();
        LoginAttempt attempt = loginAttempts.compute(ip, (key, existing) -> {
            if (existing == null || now - existing.windowStart() > LOGIN_WINDOW_MS) {
                return new LoginAttempt(new AtomicInteger(0), now);
            }
            return existing;
        });
        return attempt.count().incrementAndGet() > LOGIN_MAX_ATTEMPTS;
    }

    @PostMapping("/api/login/account")
    public ResponseEntity<Result<LoginResult>> login(@RequestBody LoginRequest req, HttpServletRequest request) {
        if (isRateLimited(clientIp(request))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Result.error(429, "登录尝试过于频繁，请稍后再试"));
        }
        String username = req.getUsername();
        String password = req.getPassword();

        User user = userMapper.findByUsername(username);
        if (user == null) {
            user = userMapper.findByEmail(username);
        }

        String role;
        String userId;
        boolean valid;

        // 开发兜底：仅在 app.dev-login-fallback=true 时允许演示口令登录
        if (devLoginFallback && "ant.design".equals(password)
                && ("admin".equals(username) || "user".equals(username))) {
            valid = true;
            role = "admin".equals(username) ? "admin" : "user";
            userId = user != null ? String.valueOf(user.getId()) : "fallback-" + username;
        } else if (user != null) {
            role = user.getRole().name().toLowerCase();
            userId = String.valueOf(user.getId());
            valid = passwordEncoder.matches(password, user.getPasswordHash());
        } else {
            valid = false;
            role = "user";
            userId = "unknown";
        }

        if (!valid) {
            return ResponseEntity.ok(Result.error(401, "账户或密码错误"));
        }

        // B 端管理员角色映射为前端认识的值
        String frontendRole = mapRoleForFrontend(role);

        String token = jwtUtil.generateToken(userId, username, role);
        LoginResult result = new LoginResult(
                "ok",
                req.getType(),
                frontendRole,
                token
        );
        return ResponseEntity.ok(Result.success(result));
    }

    @GetMapping("/api/currentUser")
    public Result<CurrentUserResponse> currentUser(HttpServletRequest request) {
        String token = extractToken(request);
        if (token == null || !jwtUtil.validateToken(token)) {
            return Result.error(401, "请先登录");
        }

        var claims = jwtUtil.parseToken(token);
        String username = claims.get("username", String.class);
        String role = claims.get("role", String.class);

        User user = userMapper.findByUsername(username);
        if (user == null) {
            user = userMapper.findByEmail(username);
        }

        String frontendRole = mapRoleForFrontend(role);
        String name;
        String email;
        String avatar;
        if (user != null) {
            name = user.getFirstName() != null ? user.getFirstName() : username;
            email = user.getEmail() != null ? user.getEmail() : username + "@example.com";
            avatar = user.getAvatarUrl();
        } else {
            name = username;
            email = username + "@example.com";
            avatar = null;
        }

        CurrentUserResponse resp = CurrentUserResponse.builder()
                .name(name)
                .avatar(avatar)
                .userid(username)
                .email(email)
                .access(frontendRole)
                .build();
        return Result.success(resp);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @PostMapping("/api/login/outLogin")
    public Result<Void> outLogin() {
        return Result.success();
    }

    private String mapRoleForFrontend(String role) {
        return switch (role.toLowerCase()) {
            case "admin" -> "admin";
            case "operator" -> "operator";
            case "viewer", "user", "customer" -> "user"; // 前端用 user 表示只读
            default -> "user";
        };
    }
}
