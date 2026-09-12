package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.OrderRequest;
import com.example.backend.entity.Payment;
import com.example.backend.entity.SimpleOrder;
import com.example.backend.entity.SimpleOrderStatus;
import com.example.backend.entity.SupportRequest;
import com.example.backend.security.AuthUser;
import com.example.backend.service.OrderService;
import com.example.backend.service.SupportRequestService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 订单控制器（含跨境支付完整流程）
 * 不对接真实支付网关，但提供支付方式选择 + 模拟交易号
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final SupportRequestService supportRequestService;

    /**
     * 创建订单（待支付）。前端 checkout 提交：商品 + 收货信息 + 邮箱
     */
    @PostMapping
    public Result<Map<String, Object>> createOrder(@RequestBody OrderRequest request,
                                                  Authentication authentication) {
        try {
            // userId 只取自已验证的 token，游客下单为 null
            Long userId = authentication == null ? null : AuthUser.resolveId(authentication.getPrincipal());
            SimpleOrder order = orderService.createOrder(request, userId);
            Map<String, Object> result = new HashMap<>();
            result.put("orderId", order.getId());
            result.put("orderNo", order.getOrderNo());
            result.put("totalAmount", order.getTotalAmount());
            result.put("currency", order.getCurrency());
            result.put("shippingFee", order.getShippingFee());
            result.put("taxAmount", order.getTaxAmount());
            return Result.success(result);
        } catch (IllegalArgumentException e) {
            return Result.error(400, e.getMessage());
        } catch (Exception e) {
            return Result.error(500, "创建订单失败: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public Result<SimpleOrder> getById(@PathVariable Long id) {
        SimpleOrder order = orderService.getById(id);
        if (order == null) {
            return Result.error(404, "订单不存在");
        }
        return Result.success(order);
    }

    @GetMapping
    public Result<Page<SimpleOrder>> list(
            @RequestParam(required = false) SimpleOrderStatus status,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) Long orderId,
            @RequestParam(required = false) String orderNo,
            Pageable pageable,
            Authentication authentication) {
        return Result.success(orderService.listFiltered(
                resolveUserIdFilter(userId, authentication), orderId, orderNo, status, pageable));
    }

    /**
     * 订单列表的用户过滤只信服务端身份：
     * 管理角色可自由查询；普通登录用户强制用自己的 ID（忽略前端自报值）；未登录返回空结果。
     */
    private Long resolveUserIdFilter(String userIdParam, Authentication authentication) {
        if (isPrivileged(authentication)) {
            if (userIdParam == null || userIdParam.isBlank()) {
                return null;
            }
            return userIdParam.matches("\\d+") ? Long.parseLong(userIdParam) : NO_USER_MATCH;
        }
        Long principalId = authentication == null ? null : AuthUser.resolveId(authentication.getPrincipal());
        // 未登录或身份不可解析（如开发兜底账号）时不做全量返回
        return principalId != null ? principalId : NO_USER_MATCH;
    }

    private boolean isPrivileged(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(Object::toString)
                .anyMatch(a -> a.equals("ROLE_ADMIN") || a.equals("ROLE_OPERATOR") || a.equals("ROLE_VIEWER"));
    }

    /** 非法/不存在的 userId 哨兵值：不会命中任何订单 */
    private static final Long NO_USER_MATCH = -1L;

    /**
     * 支付订单（模拟网关）
     * body: { "paymentMethod": "CARD" | "PAYPAL" | "WECHAT" | "ALIPAY" | "STRIPE" }
     * 不调用真实网关：直接写流水 + 标记 PAID + 生成交易号
     */
    @PostMapping("/{id}/pay")
    public Result<SimpleOrder> pay(@PathVariable Long id, @RequestBody(required = false) PayRequest body) {
        try {
            String method = body == null ? null : body.getPaymentMethod();
            SimpleOrder updated = orderService.payOrder(id, method);
            return Result.success(updated);
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        } catch (Exception e) {
            return Result.error(500, "支付失败: " + e.getMessage());
        }
    }

    /** 标记发货（管理端） */
    @PostMapping("/{id}/ship")
    public Result<SimpleOrder> ship(@PathVariable Long id) {
        try {
            return Result.success(orderService.shipOrder(id));
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /** 标记完成（管理端 / 系统自动） */
    @PostMapping("/{id}/complete")
    public Result<SimpleOrder> complete(@PathVariable Long id) {
        try {
            return Result.success(orderService.completeOrder(id));
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /** 取消订单（含已支付退款流水） */
    @PostMapping("/{id}/cancel")
    public Result<SimpleOrder> cancel(@PathVariable Long id) {
        try {
            return Result.success(orderService.cancelOrder(id));
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /** 更新订单状态（管理端） */
    @PostMapping("/{id}/status")
    public Result<SimpleOrder> updateStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest body) {
        try {
            SimpleOrderStatus status = SimpleOrderStatus.valueOf(body.getStatus().toUpperCase());
            return Result.success(orderService.updateStatus(id, status));
        } catch (IllegalArgumentException e) {
            return Result.error(400, "无效状态");
        } catch (Exception e) {
            return Result.error(400, e.getMessage());
        }
    }

    /** 订单退款（管理端） */
    @PostMapping("/{id}/refund")
    public Result<SimpleOrder> refund(@PathVariable Long id, @RequestBody RefundRequest body) {
        try {
            return Result.success(orderService.refundOrder(id, body.getAmount(), body.getReason()));
        } catch (IllegalArgumentException e) {
            return Result.error(404, e.getMessage());
        } catch (IllegalStateException e) {
            return Result.error(400, e.getMessage());
        }
    }

    /** 订单支付流水 */
    @GetMapping("/{id}/payments")
    public Result<List<Payment>> listPayments(@PathVariable Long id) {
        return Result.success(orderService.listPayments(id));
    }

    /** 兼容字段 */
    @Data
    public static class PayRequest {
        private String paymentMethod;
    }

    @Data
    public static class StatusUpdateRequest {
        private String status;
    }

    @Data
    public static class RefundRequest {
        private BigDecimal amount;
        private String reason;
    }

    /** 提交售后/客服请求 */
    @PostMapping("/{id}/support-requests")
    public Result<SupportRequest> createSupportRequest(
            @PathVariable Long id,
            @RequestBody SupportRequestBody body) {
        SimpleOrder order = orderService.getById(id);
        if (order == null) {
            return Result.error(404, "Order not found");
        }
        SupportRequest req = supportRequestService.create(
                id,
                body.getUserId(),
                body.getType(),
                body.getSubject(),
                body.getMessage(),
                body.getPriority(),
                body.getContactEmail()
        );
        return Result.success(req);
    }

    @GetMapping("/{id}/support-requests")
    public Result<List<SupportRequest>> listSupportRequests(@PathVariable Long id) {
        return Result.success(supportRequestService.listByOrderId(id));
    }

    @Data
    public static class SupportRequestBody {
        private Long userId;
        private String type;
        private String subject;
        private String message;
        private String priority;
        private String contactEmail;
    }

    /** 兼容旧调用（仅 totalAmount），保留但实际逻辑走 createOrder */
    @Data
    public static class CreateOrderRequest {
        private List<OrderItemRequest> items;
        private BigDecimal totalAmount;
    }

    @Data
    public static class OrderItemRequest {
        private Long productId;
        private Integer quantity;
    }
}
