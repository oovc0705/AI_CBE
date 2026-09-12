package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.AdminRoleRequest;
import com.example.backend.entity.AdminRole;
import com.example.backend.service.AdminRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/rbac/roles")
@RequiredArgsConstructor
public class AdminRoleController {

    private final AdminRoleService adminRoleService;

    @GetMapping
    public Result<List<AdminRole>> list() {
        return Result.success(adminRoleService.list());
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody AdminRoleRequest req) {
        AdminRole role = adminRoleService.create(req);
        return Result.success(Map.of("id", role.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody AdminRoleRequest req) {
        adminRoleService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        adminRoleService.delete(id);
        return Result.success(null, "删除成功");
    }
}
