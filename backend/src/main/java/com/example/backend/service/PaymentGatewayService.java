package com.example.backend.service;

import com.example.backend.dto.admin.PaymentGatewayRequest;
import com.example.backend.entity.PaymentGateway;
import com.example.backend.mapper.PaymentGatewayMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentGatewayService {

    private final PaymentGatewayMapper paymentGatewayMapper;

    public List<PaymentGateway> list() {
        return paymentGatewayMapper.findAll();
    }

    public PaymentGateway getById(String id) {
        PaymentGateway gateway = paymentGatewayMapper.findById(id);
        if (gateway == null) {
            throw new RuntimeException("支付网关不存在");
        }
        return gateway;
    }

    @Transactional
    public PaymentGateway create(PaymentGatewayRequest req) {
        PaymentGateway gateway = toGateway(req, null);
        gateway.setId(UUID.randomUUID().toString());
        gateway.setCreatedAt(Instant.now());
        gateway.setUpdatedAt(Instant.now());
        paymentGatewayMapper.insert(gateway);
        return gateway;
    }

    @Transactional
    public PaymentGateway update(String id, PaymentGatewayRequest req) {
        PaymentGateway existing = paymentGatewayMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("支付网关不存在");
        }
        PaymentGateway gateway = toGateway(req, existing);
        gateway.setUpdatedAt(Instant.now());
        paymentGatewayMapper.update(gateway);
        return gateway;
    }

    @Transactional
    public void delete(String id) {
        if (paymentGatewayMapper.findById(id) == null) {
            throw new RuntimeException("支付网关不存在");
        }
        paymentGatewayMapper.deleteById(id);
    }

    private PaymentGateway toGateway(PaymentGatewayRequest req, PaymentGateway existing) {
        PaymentGateway gateway = existing == null ? new PaymentGateway() : existing;
        gateway.setName(req.getName());
        gateway.setDisplayName(req.getDisplayName());
        gateway.setEnabled(req.getEnabled() == null ? false : req.getEnabled());
        gateway.setConnected(req.getConnected() == null ? false : req.getConnected());
        gateway.setConfig(req.getConfig());
        gateway.setLastFourDigits(req.getLastFourDigits());
        return gateway;
    }
}
