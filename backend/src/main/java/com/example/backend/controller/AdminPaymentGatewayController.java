package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.PaymentGatewayRequest;
import com.example.backend.entity.PaymentGateway;
import com.example.backend.service.PaymentGatewayService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/payment/gateways")
@RequiredArgsConstructor
public class AdminPaymentGatewayController {

    private final PaymentGatewayService paymentGatewayService;

    @GetMapping
    public Result<List<PaymentGateway>> list() {
        return Result.success(paymentGatewayService.list());
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody PaymentGatewayRequest req) {
        PaymentGateway gateway = paymentGatewayService.create(req);
        return Result.success(Map.of("id", gateway.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody PaymentGatewayRequest req) {
        paymentGatewayService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        paymentGatewayService.delete(id);
        return Result.success(null, "删除成功");
    }
}
