package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.PageResponse;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.service.PaymentTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/payment/transactions")
@RequiredArgsConstructor
public class AdminPaymentTransactionController {

    private final PaymentTransactionService paymentTransactionService;

    @GetMapping
    public Result<PageResponse<PaymentTransaction>> list(
            @RequestParam(required = false) String gatewayId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(paymentTransactionService.list(gatewayId, status, page, size));
    }

    @GetMapping("/{id}")
    public Result<PaymentTransaction> getById(@PathVariable String id) {
        return Result.success(paymentTransactionService.getById(id));
    }

    @GetMapping("/reconcile")
    public Result<java.util.Map<String, Object>> reconcile(
            @RequestParam(required = false) String gatewayId,
            @RequestParam(required = false) String status) {
        PageResponse<PaymentTransaction> page = paymentTransactionService.list(gatewayId, status, 1, Integer.MAX_VALUE);
        double totalAmount = page.getContent().stream()
                .mapToDouble(t -> t.getAmount() == null ? 0.0 : t.getAmount())
                .sum();
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("totalTransactions", page.getTotalElements());
        result.put("totalAmount", totalAmount);
        result.put("currency", "USD");
        return Result.success(result);
    }
}
