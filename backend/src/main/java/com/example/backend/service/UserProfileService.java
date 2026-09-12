package com.example.backend.service;

import com.example.backend.dto.customer.UserProfileRequest;
import com.example.backend.entity.User;
import com.example.backend.mapper.UserMapper;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserMapper userMapper;

    /**
     * 获取用户个人资料（隐藏密码）
     */
    public User getProfile(Long userId) {
        User user = userMapper.findById(userId);
        if (user != null) {
            user.setPasswordHash(null);
        }
        return user;
    }

    /**
     * 更新用户个人资料（仅允许修改非敏感字段）
     */
    @Transactional
    public User updateProfile(Long userId, UserProfileRequest request) {
        User existing = userMapper.findById(userId);
        if (existing == null) {
            return null;
        }

        // 只更新提供的字段
        if (request.getFirstName() != null) {
            existing.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            existing.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            existing.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) {
            existing.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getLanguage() != null) {
            existing.setLanguage(request.getLanguage());
        }
        if (request.getCurrency() != null) {
            existing.setCurrency(request.getCurrency());
        }
        if (request.getPreferences() != null) {
            existing.setPreferences(request.getPreferences());
        }

        userMapper.updateProfile(existing);
        User updated = userMapper.findById(userId);
        if (updated != null) {
            updated.setPasswordHash(null);
        }
        return updated;
    }

    /**
     * 更新用户偏好设置
     */
    @Transactional
    public User updatePreferences(Long userId, JsonNode preferences) {
        User existing = userMapper.findById(userId);
        if (existing == null) {
            return null;
        }
        existing.setPreferences(preferences);
        userMapper.updateProfile(existing);
        User updated = userMapper.findById(userId);
        if (updated != null) {
            updated.setPasswordHash(null);
        }
        return updated;
    }

    /**
     * 获取用户偏好设置
     */
    public JsonNode getPreferences(Long userId) {
        User user = userMapper.findById(userId);
        return user != null ? user.getPreferences() : null;
    }
}