package com.example.backend.service;

import com.example.backend.dto.admin.TaxRuleRequest;
import com.example.backend.entity.TaxRule;
import com.example.backend.mapper.TaxRuleMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaxRuleService {

    private final TaxRuleMapper taxRuleMapper;

    public List<TaxRule> list(String countryCode, Boolean enabled) {
        return taxRuleMapper.findAll(countryCode, enabled);
    }

    public TaxRule getById(String id) {
        TaxRule rule = taxRuleMapper.findById(id);
        if (rule == null) {
            throw new RuntimeException("税率规则不存在");
        }
        return rule;
    }

    @Transactional
    public TaxRule create(TaxRuleRequest req) {
        TaxRule rule = toTaxRule(req, null);
        rule.setId(UUID.randomUUID().toString());
        rule.setCreatedAt(Instant.now());
        rule.setUpdatedAt(Instant.now());
        taxRuleMapper.insert(rule);
        return rule;
    }

    @Transactional
    public TaxRule update(String id, TaxRuleRequest req) {
        TaxRule existing = taxRuleMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("税率规则不存在");
        }
        TaxRule rule = toTaxRule(req, existing);
        rule.setUpdatedAt(Instant.now());
        taxRuleMapper.update(rule);
        return rule;
    }

    @Transactional
    public void delete(String id) {
        if (taxRuleMapper.findById(id) == null) {
            throw new RuntimeException("税率规则不存在");
        }
        taxRuleMapper.deleteById(id);
    }

    private TaxRule toTaxRule(TaxRuleRequest req, TaxRule existing) {
        TaxRule rule = existing == null ? new TaxRule() : existing;
        rule.setName(req.getName());
        rule.setCountryCode(req.getCountryCode());
        rule.setRegionCode(req.getRegionCode());
        rule.setTaxRate(req.getTaxRate() == null ? 0.0 : req.getTaxRate());
        rule.setTaxType(req.getTaxType() == null ? "vat" : req.getTaxType());
        rule.setIsShippingTaxable(req.getIsShippingTaxable() != null && req.getIsShippingTaxable());
        rule.setEnabled(req.getEnabled() == null ? true : req.getEnabled());
        rule.setPriority(req.getPriority() == null ? 0 : req.getPriority());
        return rule;
    }
}
