package com.example.backend.service;

import com.example.backend.dto.admin.PageResponse;
import com.example.backend.dto.admin.ShippingRuleRequest;
import com.example.backend.dto.admin.ShippingTemplateRequest;
import com.example.backend.entity.ShippingRule;
import com.example.backend.entity.ShippingTemplate;
import com.example.backend.mapper.ShippingTemplateMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShippingTemplateService {

    private final ShippingTemplateMapper shippingTemplateMapper;

    public PageResponse<ShippingTemplate> list(int page, int size) {
        long total = shippingTemplateMapper.countAll();
        int offset = Math.max(0, page) * size;
        List<ShippingTemplate> items = shippingTemplateMapper.findAll(offset, size);
        return PageResponse.of(items, total, page, size);
    }

    public ShippingTemplate getById(String id) {
        ShippingTemplate template = shippingTemplateMapper.findById(id);
        if (template == null) {
            throw new RuntimeException("模板不存在");
        }
        return template;
    }

    @Transactional
    public ShippingTemplate create(ShippingTemplateRequest req) {
        ShippingTemplate template = new ShippingTemplate();
        template.setId(UUID.randomUUID().toString());
        template.setName(req.getName());
        template.setBillingType(req.getBillingType() == null ? "weight" : req.getBillingType());
        template.setFreeShippingThreshold(req.getFreeShippingThreshold());
        template.setIsDefault(Boolean.TRUE.equals(req.getIsDefault()));
        template.setEnabled(req.getEnabled() == null ? true : req.getEnabled());
        template.setCreatedAt(Instant.now());
        template.setUpdatedAt(Instant.now());

        if (template.getIsDefault()) {
            shippingTemplateMapper.clearDefault();
        }
        shippingTemplateMapper.insert(template);
        saveRules(template.getId(), req.getRules());

        return shippingTemplateMapper.findById(template.getId());
    }

    @Transactional
    public ShippingTemplate update(String id, ShippingTemplateRequest req) {
        ShippingTemplate existing = shippingTemplateMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("模板不存在");
        }

        existing.setName(req.getName());
        existing.setBillingType(req.getBillingType() == null ? "weight" : req.getBillingType());
        existing.setFreeShippingThreshold(req.getFreeShippingThreshold());
        existing.setIsDefault(Boolean.TRUE.equals(req.getIsDefault()));
        existing.setEnabled(req.getEnabled() == null ? true : req.getEnabled());
        existing.setUpdatedAt(Instant.now());

        if (existing.getIsDefault()) {
            shippingTemplateMapper.clearDefault();
        }
        shippingTemplateMapper.update(existing);

        shippingTemplateMapper.deleteRulesByTemplateId(id);
        saveRules(id, req.getRules());

        return shippingTemplateMapper.findById(id);
    }

    @Transactional
    public void delete(String id) {
        ShippingTemplate existing = shippingTemplateMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("模板不存在");
        }
        if (Boolean.TRUE.equals(existing.getIsDefault())) {
            throw new RuntimeException("默认模板不可删除");
        }
        shippingTemplateMapper.deleteRulesByTemplateId(id);
        shippingTemplateMapper.deleteById(id);
    }

    private void saveRules(String templateId, List<ShippingRuleRequest> rules) {
        if (rules == null) {
            return;
        }
        for (ShippingRuleRequest r : rules) {
            ShippingRule rule = new ShippingRule();
            rule.setId(UUID.randomUUID().toString());
            rule.setTemplateId(templateId);
            rule.setRegion(r.getRegion());
            rule.setCountryCode(r.getCountryCode());
            rule.setFirstUnit(r.getFirstUnit() == null ? 0.0 : r.getFirstUnit());
            rule.setFirstUnitFee(r.getFirstUnitFee() == null ? 0.0 : r.getFirstUnitFee());
            rule.setAdditionalUnit(r.getAdditionalUnit() == null ? 0.0 : r.getAdditionalUnit());
            rule.setAdditionalUnitFee(r.getAdditionalUnitFee() == null ? 0.0 : r.getAdditionalUnitFee());
            rule.setCreatedAt(Instant.now());
            shippingTemplateMapper.insertRule(rule);
        }
    }
}
