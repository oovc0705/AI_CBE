package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.PageResponse;
import com.example.backend.dto.admin.SystemNotificationRequest;
import com.example.backend.entity.SystemNotification;
import com.example.backend.service.SystemNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
public class AdminNotificationController {

    private final SystemNotificationService systemNotificationService;

    @GetMapping
    public Result<PageResponse<SystemNotification>> list(
            @RequestParam(required = false) String recipientId,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(systemNotificationService.list(recipientId, isRead, page, size));
    }

    @PutMapping("/{id}/read")
    public Result<Void> markRead(@PathVariable String id) {
        SystemNotificationRequest req = new SystemNotificationRequest();
        req.setIsRead(true);
        systemNotificationService.update(id, req);
        return Result.success(null, "已标记已读");
    }

    @PutMapping("/read-all")
    public Result<Void> markAllRead(@RequestParam(required = false) String recipientId) {
        systemNotificationService.markAllRead(recipientId);
        return Result.success(null, "全部已读");
    }

    @GetMapping("/stats")
    public Result<Map<String, Long>> stats() {
        return Result.success(systemNotificationService.stats());
    }
}
