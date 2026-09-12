package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.entity.SupportRequest;
import com.example.backend.service.SupportRequestService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportRequestService supportRequestService;

    /**
     * 通用提交客服工单（可关联订单，也可以不关联）
     */
    @PostMapping("/requests")
    public Result<SupportRequest> createRequest(@RequestBody CreateSupportRequest body) {
        SupportRequest req = supportRequestService.create(
                body.getOrderId(),
                body.getUserId(),
                body.getType(),
                body.getSubject(),
                body.getMessage(),
                body.getPriority(),
                body.getContactEmail()
        );
        return Result.success(req);
    }

    /**
     * 查询用户的工单列表
     */
    @GetMapping("/requests")
    public Result<List<SupportRequest>> listUserRequests(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long orderId) {
        if (orderId != null) {
            return Result.success(supportRequestService.listByOrderId(orderId));
        }
        // TODO: 后续可扩展按userId查询
        return Result.success(List.of());
    }

    @Data
    public static class CreateSupportRequest {
        private Long orderId;
        private Long userId;
        private String type;
        private String subject;
        private String message;
        private String priority;
        private String contactEmail;
    }
}
