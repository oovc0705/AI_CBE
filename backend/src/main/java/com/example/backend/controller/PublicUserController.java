package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.customer.UserProfileRequest;
import com.example.backend.entity.User;
import com.example.backend.service.UserProfileService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * C端用户个人中心 API（无需 admin 权限）
 * 
 * 路径：/api/profile
 * 所有接口需要用户登录（通过 user_id 参数传递）
 */
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class PublicUserController {

    private final UserProfileService userProfileService;

    /**
     * 获取当前用户个人资料
     * @param userId 用户ID（从 localStorage 传递）
     */
    @GetMapping
    public Result<User> getProfile(@RequestParam Long userId) {
        User user = userProfileService.getProfile(userId);
        if (user == null) {
            return Result.error(404, "User not found");
        }
        return Result.success(user);
    }

    /**
     * 更新当前用户个人资料
     * @param userId 用户ID
     * @param request 更新内容
     */
    @PutMapping
    public Result<User> updateProfile(@RequestParam Long userId, @RequestBody UserProfileRequest request) {
        User updated = userProfileService.updateProfile(userId, request);
        if (updated == null) {
            return Result.error(404, "User not found");
        }
        return Result.success(updated);
    }

    /**
     * 更新用户偏好设置（单独接口）
     * @param userId 用户ID
     * @param preferences 偏好设置 JSON
     */
    @PutMapping("/preferences")
    public Result<User> updatePreferences(@RequestParam Long userId, @RequestBody JsonNode preferences) {
        User updated = userProfileService.updatePreferences(userId, preferences);
        if (updated == null) {
            return Result.error(404, "User not found");
        }
        return Result.success(updated);
    }

    /**
     * 获取用户偏好设置
     * @param userId 用户ID
     */
    @GetMapping("/preferences")
    public Result<JsonNode> getPreferences(@RequestParam Long userId) {
        JsonNode prefs = userProfileService.getPreferences(userId);
        if (prefs == null) {
            return Result.error(404, "User not found");
        }
        return Result.success(prefs);
    }
}