package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.PageResponse;
import com.example.backend.entity.SimpleOrder;
import com.example.backend.entity.SimpleOrderStatus;
import com.example.backend.service.OrderService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 管理员订单操作 API
 */
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public Result<PageResponse<SimpleOrder>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SimpleOrder> orderPage;
        if (status != null && !status.isEmpty()) {
            SimpleOrderStatus orderStatus = SimpleOrderStatus.valueOf(status.toUpperCase());
            orderPage = orderService.listByStatus(orderStatus, pageable);
        } else {
            orderPage = orderService.list(pageable);
        }
        PageResponse<SimpleOrder> response = new PageResponse<>();
        response.setContent(orderPage.getContent());
        response.setTotalElements(orderPage.getTotalElements());
        response.setTotalPages(orderPage.getTotalPages());
        response.setNumber(orderPage.getNumber());
        response.setSize(orderPage.getSize());
        return Result.success(response);
    }

    @GetMapping("/{id}")
    public Result<SimpleOrder> getById(@PathVariable Long id) {
        SimpleOrder order = orderService.getById(id);
        if (order == null) {
            return Result.error(404, "订单不存在");
        }
        return Result.success(order);
    }

    @PostMapping("/{id}/ship")
    public Result<SimpleOrder> ship(@PathVariable Long id) {
        try {
            SimpleOrder order = orderService.shipOrder(id);
            return Result.success(order, "发货成功");
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/{id}/complete")
    public Result<SimpleOrder> complete(@PathVariable Long id) {
        try {
            SimpleOrder order = orderService.completeOrder(id);
            return Result.success(order, "完成成功");
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    public Result<SimpleOrder> cancel(@PathVariable Long id) {
        try {
            SimpleOrder order = orderService.cancelOrder(id);
            return Result.success(order, "取消成功");
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/{id}/refund")
    public Result<SimpleOrder> refund(@PathVariable Long id, @RequestBody RefundRequest body) {
        try {
            SimpleOrder order = orderService.refundOrder(id, body.getAmount(), body.getReason());
            return Result.success(order, "退款成功");
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        }
    }

    @PostMapping("/{id}/status")
    public Result<SimpleOrder> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest body) {
        try {
            SimpleOrderStatus status = SimpleOrderStatus.valueOf(body.getStatus().toUpperCase());
            SimpleOrder order = orderService.updateStatus(id, status);
            return Result.success(order, "状态更新成功");
        } catch (IllegalArgumentException e) {
            return Result.error(400, "无效状态");
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    @GetMapping("/{id}/payments")
    public Result<List<?>> listPayments(@PathVariable Long id) {
        return Result.success(orderService.listPayments(id));
    }

    @Data
    public static class RefundRequest {
        private BigDecimal amount;
        private String reason;
    }

    @Data
    public static class StatusUpdateRequest {
        private String status;
    }
}