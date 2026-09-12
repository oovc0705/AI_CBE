package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.customer.UserProfileRequest;
import com.example.backend.entity.User;
import com.example.backend.security.AuthUser;
import com.example.backend.service.UserProfileService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * C端用户个人中心 API（需登录）。
 *
 * 路径：/api/profile
 * 身份一律取自 JWT，**不接受** userId 查询参数——否则任何登录用户都能读写他人资料。
 */
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class PublicUserController {

    private final UserProfileService userProfileService;

    /** 获取当前登录用户的个人资料 */
    @GetMapping
    public ResponseEntity<Result<User>> getProfile(Authentication authentication) {
        Long userId = currentUserId(authentication);
        if (userId == null) {
            return unauthorized();
        }
        User user = userProfileService.getProfile(userId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Result.error(404, "User not found"));
        }
        return ResponseEntity.ok(Result.success(user));
    }

    /** 更新当前登录用户的个人资料 */
    @PutMapping
    public ResponseEntity<Result<User>> updateProfile(Authentication authentication,
                                                      @RequestBody UserProfileRequest request) {
        Long userId = currentUserId(authentication);
        if (userId == null) {
            return unauthorized();
        }
        User updated = userProfileService.updateProfile(userId, request);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Result.error(404, "User not found"));
        }
        return ResponseEntity.ok(Result.success(updated));
    }

    /** 更新当前登录用户的偏好设置 */
    @PutMapping("/preferences")
    public ResponseEntity<Result<User>> updatePreferences(Authentication authentication,
                                                          @RequestBody JsonNode preferences) {
        Long userId = currentUserId(authentication);
        if (userId == null) {
            return unauthorized();
        }
        User updated = userProfileService.updatePreferences(userId, preferences);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Result.error(404, "User not found"));
        }
        return ResponseEntity.ok(Result.success(updated));
    }

    /** 获取当前登录用户的偏好设置 */
    @GetMapping("/preferences")
    public ResponseEntity<Result<JsonNode>> getPreferences(Authentication authentication) {
        Long userId = currentUserId(authentication);
        if (userId == null) {
            return unauthorized();
        }
        JsonNode prefs = userProfileService.getPreferences(userId);
        if (prefs == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Result.error(404, "User not found"));
        }
        return ResponseEntity.ok(Result.success(prefs));
    }

    private Long currentUserId(Authentication authentication) {
        return authentication == null ? null : AuthUser.resolveId(authentication.getPrincipal());
    }

    private <T> ResponseEntity<Result<T>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Result.error(401, "请先登录"));
    }
}
