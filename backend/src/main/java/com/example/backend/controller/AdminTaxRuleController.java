package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.TaxRuleRequest;
import com.example.backend.entity.TaxRule;
import com.example.backend.service.TaxRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tax/rules")
@RequiredArgsConstructor
public class AdminTaxRuleController {

    private final TaxRuleService taxRuleService;

    @GetMapping("/calculate")
    public Result<Map<String, Object>> calculate(
            @RequestParam String country_code,
            @RequestParam(required = false) String region_code,
            @RequestParam BigDecimal subtotal,
            @RequestParam(defaultValue = "0") BigDecimal shipping_fee) {
        List<TaxRule> rules = taxRuleService.list(country_code, true);
        BigDecimal totalTax = BigDecimal.ZERO;
        List<Map<String, Object>> appliedRules = new ArrayList<>();
        for (TaxRule rule : rules) {
            BigDecimal taxableAmount = subtotal;
            if (rule.getIsShippingTaxable()) {
                taxableAmount = taxableAmount.add(shipping_fee);
            }
            BigDecimal tax = taxableAmount.multiply(BigDecimal.valueOf(rule.getTaxRate())).divide(BigDecimal.valueOf(100));
            totalTax = totalTax.add(tax);
            Map<String, Object> applied = new HashMap<>();
            applied.put("name", rule.getName());
            applied.put("rate", rule.getTaxRate());
            applied.put("tax", tax);
            appliedRules.add(applied);
        }
        BigDecimal total = subtotal.add(shipping_fee).add(totalTax);
        Map<String, Object> result = new HashMap<>();
        result.put("subtotal", subtotal);
        result.put("shipping_fee", shipping_fee);
        result.put("tax_amount", totalTax);
        result.put("total", total);
        result.put("applied_rules", appliedRules);
        return Result.success(result);
    }

    @GetMapping
    public Result<List<TaxRule>> list(
            @RequestParam(required = false) String countryCode,
            @RequestParam(required = false) Boolean enabled) {
        return Result.success(taxRuleService.list(countryCode, enabled));
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody TaxRuleRequest req) {
        TaxRule rule = taxRuleService.create(req);
        return Result.success(Map.of("id", rule.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody TaxRuleRequest req) {
        taxRuleService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        taxRuleService.delete(id);
        return Result.success(null, "删除成功");
    }
}
