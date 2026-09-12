package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.AdminUserRequest;
import com.example.backend.entity.AdminUser;
import com.example.backend.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/rbac/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public Result<List<AdminUser>> list() {
        return Result.success(adminUserService.list());
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody AdminUserRequest req) {
        AdminUser user = adminUserService.create(req);
        return Result.success(Map.of("id", user.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody AdminUserRequest req) {
        adminUserService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        adminUserService.delete(id);
        return Result.success(null, "删除成功");
    }
}
