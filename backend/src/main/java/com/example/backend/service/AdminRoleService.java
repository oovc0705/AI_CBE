package com.example.backend.service;

import com.example.backend.dto.admin.AdminRoleRequest;
import com.example.backend.entity.AdminRole;
import com.example.backend.mapper.AdminRoleMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminRoleService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final AdminRoleMapper adminRoleMapper;

    public List<AdminRole> list() {
        return adminRoleMapper.findAll();
    }

    public AdminRole getById(String id) {
        AdminRole role = adminRoleMapper.findById(id);
        if (role == null) {
            throw new RuntimeException("角色不存在");
        }
        return role;
    }

    @Transactional
    public AdminRole create(AdminRoleRequest req) {
        if (adminRoleMapper.findByName(req.getName()) != null) {
            throw new RuntimeException("角色名已存在");
        }
        AdminRole role = toRole(req, null);
        role.setId(UUID.randomUUID().toString());
        role.setCreatedAt(Instant.now());
        role.setUpdatedAt(Instant.now());
        adminRoleMapper.insert(role);
        return role;
    }

    @Transactional
    public AdminRole update(String id, AdminRoleRequest req) {
        AdminRole existing = adminRoleMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("角色不存在");
        }
        AdminRole byName = adminRoleMapper.findByName(req.getName());
        if (byName != null && !byName.getId().equals(id)) {
            throw new RuntimeException("角色名已存在");
        }
        AdminRole role = toRole(req, existing);
        role.setUpdatedAt(Instant.now());
        adminRoleMapper.update(role);
        return role;
    }

    @Transactional
    public void delete(String id) {
        AdminRole role = adminRoleMapper.findById(id);
        if (role == null) {
            throw new RuntimeException("角色不存在");
        }
        if (Boolean.TRUE.equals(role.getIsSystem())) {
            throw new RuntimeException("系统角色不可删除");
        }
        adminRoleMapper.deleteById(id);
    }

    private AdminRole toRole(AdminRoleRequest req, AdminRole existing) {
        AdminRole role = existing == null ? new AdminRole() : existing;
        role.setName(req.getName());
        role.setDisplayName(req.getDisplayName());
        role.setDescription(req.getDescription());
        role.setIsSystem(req.getIsSystem() != null && req.getIsSystem());
        if (req.getPermissions() != null) {
            ArrayNode arr = OBJECT_MAPPER.createArrayNode();
            req.getPermissions().forEach(arr::add);
            role.setPermissions(arr);
        }
        return role;
    }
}
