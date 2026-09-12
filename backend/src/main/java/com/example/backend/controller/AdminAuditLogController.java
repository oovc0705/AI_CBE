package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.PageResponse;
import com.example.backend.entity.AuditLog;
import com.example.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/audit/logs")
@RequiredArgsConstructor
public class AdminAuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public Result<PageResponse<AuditLog>> list(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(auditLogService.list(action, resourceType, page, size));
    }
}
