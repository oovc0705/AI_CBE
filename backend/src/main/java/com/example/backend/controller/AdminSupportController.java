package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.entity.SupportRequest;
import com.example.backend.service.SupportRequestService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/support")
@RequiredArgsConstructor
public class AdminSupportController {

    private final SupportRequestService supportRequestService;

    @GetMapping("/stats")
    public Result<Map<String, Long>> getStats() {
        return Result.success(supportRequestService.getStats());
    }

    @GetMapping
    public Result<Page<SupportRequest>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return Result.success(supportRequestService.list(status, type, priority, pageable));
    }

    @GetMapping("/{id}")
    public Result<SupportRequest> getDetail(@PathVariable Long id) {
        SupportRequest req = supportRequestService.getDetailById(id);
        if (req == null) {
            return Result.error(404, "Ticket not found");
        }
        return Result.success(req);
    }

    @PutMapping("/{id}/status")
    public Result<SupportRequest> updateStatus(@PathVariable Long id, @RequestBody StatusRequest body) {
        try {
            SupportRequest updated = supportRequestService.updateStatus(id, body.getStatus());
            return Result.success(updated);
        } catch (Exception e) {
            return Result.error(400, "Update failed: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/reply")
    public Result<SupportRequest> reply(@PathVariable Long id, @RequestBody ReplyRequest body) {
        try {
            // replied_by 允许为 NULL：当前 admin 账号是内存认证，users 表无对应记录。
            // Copilot/前端可省略 adminId，或显式传 null，数据库外键会自动满足。
            SupportRequest updated = supportRequestService.reply(id, body.getReply(), body.getAdminId());
            return Result.success(updated);
        } catch (Exception e) {
            return Result.error(400, "Reply failed: " + e.getMessage());
        }
    }

    @Data
    public static class StatusRequest {
        private String status;
    }

    @Data
    public static class ReplyRequest {
        private String reply;
        private Long adminId;
    }
}
