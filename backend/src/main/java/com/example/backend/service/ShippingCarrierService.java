package com.example.backend.service;

import com.example.backend.dto.admin.ShippingCarrierRequest;
import com.example.backend.entity.ShippingCarrier;
import com.example.backend.exception.DuplicateResourceException;
import com.example.backend.mapper.ShippingCarrierMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShippingCarrierService {

    private final ShippingCarrierMapper shippingCarrierMapper;

    public List<ShippingCarrier> list(Boolean enabled) {
        return shippingCarrierMapper.findAll(enabled);
    }

    public ShippingCarrier getById(String id) {
        ShippingCarrier carrier = shippingCarrierMapper.findById(id);
        if (carrier == null) {
            throw new RuntimeException("物流商不存在");
        }
        return carrier;
    }

    @Transactional
    public ShippingCarrier create(ShippingCarrierRequest req) {
        if (shippingCarrierMapper.findByCode(req.getCode()) != null) {
            throw new DuplicateResourceException("物流商代码已存在");
        }
        ShippingCarrier carrier = toCarrier(req, null);
        carrier.setId(UUID.randomUUID().toString());
        carrier.setCreatedAt(Instant.now());
        carrier.setUpdatedAt(Instant.now());
        shippingCarrierMapper.insert(carrier);
        return carrier;
    }

    @Transactional
    public ShippingCarrier update(String id, ShippingCarrierRequest req) {
        ShippingCarrier existing = shippingCarrierMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("物流商不存在");
        }
        ShippingCarrier byCode = shippingCarrierMapper.findByCode(req.getCode());
        if (byCode != null && !byCode.getId().equals(id)) {
            throw new DuplicateResourceException("物流商代码已存在");
        }
        ShippingCarrier carrier = toCarrier(req, existing);
        carrier.setUpdatedAt(Instant.now());
        shippingCarrierMapper.update(carrier);
        return carrier;
    }

    @Transactional
    public void delete(String id) {
        if (shippingCarrierMapper.findById(id) == null) {
            throw new RuntimeException("物流商不存在");
        }
        shippingCarrierMapper.deleteById(id);
    }

    private ShippingCarrier toCarrier(ShippingCarrierRequest req, ShippingCarrier existing) {
        ShippingCarrier carrier = existing == null ? new ShippingCarrier() : existing;
        carrier.setName(req.getName());
        carrier.setCode(req.getCode());
        carrier.setLogoUrl(req.getLogoUrl());
        carrier.setContactPhone(req.getContactPhone());
        carrier.setWebsite(req.getWebsite());
        carrier.setTrackingUrlTemplate(req.getTrackingUrlTemplate());
        carrier.setApiType(req.getApiType() == null ? "manual" : req.getApiType());
        carrier.setApiConfig(req.getApiConfig());
        carrier.setEnabled(req.getEnabled() == null ? true : req.getEnabled());
        carrier.setSortOrder(req.getSortOrder() == null ? 0 : req.getSortOrder());
        return carrier;
    }
}
