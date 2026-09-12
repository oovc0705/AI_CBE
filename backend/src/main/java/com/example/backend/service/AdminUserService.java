package com.example.backend.service;

import com.example.backend.dto.admin.AdminUserRequest;
import com.example.backend.entity.AdminUser;
import com.example.backend.exception.DuplicateResourceException;
import com.example.backend.mapper.AdminUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final AdminUserMapper adminUserMapper;
    private final PasswordEncoder passwordEncoder;

    public List<AdminUser> list() {
        return adminUserMapper.findAll();
    }

    public AdminUser getById(String id) {
        AdminUser user = adminUserMapper.findById(id);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }
        return user;
    }

    @Transactional
    public AdminUser create(AdminUserRequest req) {
        if (adminUserMapper.findByEmail(req.getEmail()) != null) {
            throw new DuplicateResourceException("邮箱已存在");
        }
        AdminUser user = toUser(req, null);
        user.setId(UUID.randomUUID().toString());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        adminUserMapper.insert(user);
        return user;
    }

    @Transactional
    public AdminUser update(String id, AdminUserRequest req) {
        AdminUser existing = adminUserMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("用户不存在");
        }
        AdminUser byEmail = adminUserMapper.findByEmail(req.getEmail());
        if (byEmail != null && !byEmail.getId().equals(id)) {
            throw new DuplicateResourceException("邮箱已存在");
        }
        AdminUser user = toUser(req, existing);
        if (req.getPassword() != null && !req.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        user.setUpdatedAt(Instant.now());
        adminUserMapper.update(user);
        return user;
    }

    @Transactional
    public void delete(String id) {
        if (adminUserMapper.findById(id) == null) {
            throw new RuntimeException("用户不存在");
        }
        adminUserMapper.deleteById(id);
    }

    private AdminUser toUser(AdminUserRequest req, AdminUser existing) {
        AdminUser user = existing == null ? new AdminUser() : existing;
        user.setEmail(req.getEmail());
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setAvatarUrl(req.getAvatarUrl());
        user.setRoleId(req.getRoleId());
        user.setIsActive(req.getIsActive() == null ? true : req.getIsActive());
        return user;
    }
}
