package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.CurrencyRequest;
import com.example.backend.entity.Currency;
import com.example.backend.service.CurrencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/currencies")
@RequiredArgsConstructor
public class AdminCurrencyController {

    private final CurrencyService currencyService;

    @GetMapping
    public Result<List<Currency>> list(@RequestParam(required = false) Boolean enabled) {
        return Result.success(currencyService.list(enabled));
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody CurrencyRequest req) {
        Currency currency = currencyService.create(req);
        return Result.success(Map.of("id", currency.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody CurrencyRequest req) {
        currencyService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        currencyService.delete(id);
        return Result.success(null, "删除成功");
    }

    @PostMapping("/{code}/rates")
    public Result<Void> updateRate(@PathVariable String code, @RequestBody Map<String, Double> body) {
        Double rate = body.get("exchange_rate");
        if (rate == null) {
            throw new RuntimeException("缺少 exchange_rate");
        }
        Currency currency = currencyService.list(null).stream()
                .filter(c -> c.getCode().equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("货币不存在"));
        CurrencyRequest req = new CurrencyRequest();
        req.setCode(currency.getCode());
        req.setName(currency.getName());
        req.setSymbol(currency.getSymbol());
        req.setExchangeRate(rate);
        req.setDecimals(currency.getDecimals());
        req.setIsDefault(currency.getIsDefault());
        req.setEnabled(currency.getEnabled());
        currencyService.update(currency.getId(), req);
        return Result.success(null, "汇率更新成功");
    }
}
