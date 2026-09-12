package com.example.backend.service;

import com.example.backend.dto.admin.CurrencyRequest;
import com.example.backend.entity.Currency;
import com.example.backend.exception.DuplicateResourceException;
import com.example.backend.mapper.CurrencyMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CurrencyService {

    private final CurrencyMapper currencyMapper;

    public List<Currency> list(Boolean enabled) {
        return currencyMapper.findAll(enabled);
    }

    public Currency getById(String id) {
        Currency currency = currencyMapper.findById(id);
        if (currency == null) {
            throw new RuntimeException("货币不存在");
        }
        return currency;
    }

    @Transactional
    public Currency create(CurrencyRequest req) {
        if (currencyMapper.findByCode(req.getCode()) != null) {
            throw new DuplicateResourceException("货币代码已存在");
        }
        Currency currency = toCurrency(req, null);
        currency.setId(UUID.randomUUID().toString());
        currency.setCreatedAt(Instant.now());
        currency.setUpdatedAt(Instant.now());
        if (Boolean.TRUE.equals(currency.getIsDefault())) {
            currencyMapper.clearDefault();
        }
        currencyMapper.insert(currency);
        return currency;
    }

    @Transactional
    public Currency update(String id, CurrencyRequest req) {
        Currency existing = currencyMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("货币不存在");
        }
        Currency byCode = currencyMapper.findByCode(req.getCode());
        if (byCode != null && !byCode.getId().equals(id)) {
            throw new DuplicateResourceException("货币代码已存在");
        }
        Currency currency = toCurrency(req, existing);
        currency.setUpdatedAt(Instant.now());
        if (Boolean.TRUE.equals(currency.getIsDefault())) {
            currencyMapper.clearDefault();
        }
        currencyMapper.update(currency);
        return currency;
    }

    @Transactional
    public void delete(String id) {
        Currency existing = currencyMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("货币不存在");
        }
        if (Boolean.TRUE.equals(existing.getIsDefault())) {
            throw new RuntimeException("默认货币不可删除");
        }
        currencyMapper.deleteById(id);
    }

    private Currency toCurrency(CurrencyRequest req, Currency existing) {
        Currency currency = existing == null ? new Currency() : existing;
        currency.setCode(req.getCode());
        currency.setName(req.getName());
        currency.setSymbol(req.getSymbol());
        currency.setExchangeRate(req.getExchangeRate() == null ? 1.0 : req.getExchangeRate());
        currency.setDecimals(req.getDecimals() == null ? 2 : req.getDecimals());
        currency.setIsDefault(req.getIsDefault() != null && req.getIsDefault());
        currency.setEnabled(req.getEnabled() == null ? true : req.getEnabled());
        return currency;
    }
}
