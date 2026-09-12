package com.example.backend.service;

import com.example.backend.dto.admin.PageResponse;
import com.example.backend.entity.PaymentTransaction;
import com.example.backend.mapper.PaymentTransactionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentTransactionService {

    private final PaymentTransactionMapper paymentTransactionMapper;

    public PageResponse<PaymentTransaction> list(String gatewayId, String status, int page, int size) {
        long total = paymentTransactionMapper.countAll(gatewayId, status);
        int offset = Math.max(0, page) * size;
        List<PaymentTransaction> items = paymentTransactionMapper.findAll(gatewayId, status, offset, size);
        return PageResponse.of(items, total, page, size);
    }

    public PaymentTransaction getById(String id) {
        PaymentTransaction transaction = paymentTransactionMapper.findById(id);
        if (transaction == null) {
            throw new RuntimeException("交易记录不存在");
        }
        return transaction;
    }
}
