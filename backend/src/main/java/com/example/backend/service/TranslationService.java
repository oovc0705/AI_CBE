package com.example.backend.service;

import com.example.backend.dto.admin.TranslationKeyRequest;
import com.example.backend.dto.admin.TranslationValueRequest;
import com.example.backend.entity.TranslationKey;
import com.example.backend.entity.TranslationValue;
import com.example.backend.mapper.TranslationKeyMapper;
import com.example.backend.mapper.TranslationValueMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TranslationService {

    private final TranslationKeyMapper translationKeyMapper;
    private final TranslationValueMapper translationValueMapper;

    public List<TranslationKey> listKeys(String namespace) {
        return translationKeyMapper.findAll(namespace);
    }

    public Page<TranslationKey> listTranslations(String namespace, String keyword, int page, int size) {
        int offset = page * size;
        List<TranslationKey> keys = translationKeyMapper.findAllPaged(namespace, keyword, offset, size);
        long total = translationKeyMapper.countAll(namespace, keyword);
        List<TranslationValue> values = translationValueMapper.findAll();
        Map<String, List<TranslationValue>> valuesByKeyId = values.stream()
                .collect(Collectors.groupingBy(TranslationValue::getKeyId));
        for (TranslationKey key : keys) {
            attachValues(key, valuesByKeyId.getOrDefault(key.getId(), List.of()));
        }
        Pageable pageable = PageRequest.of(page, size);
        return new PageImpl<>(keys, pageable, total);
    }

    public List<String> listLocales() {
        return translationValueMapper.findAll().stream()
                .map(TranslationValue::getLocale)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStats() {
        long totalKeys = translationKeyMapper.countAll(null, null);
        List<Map<String, Object>> localeRows = translationValueMapper.countByLocale();
        Map<String, Object> locales = new LinkedHashMap<>();
        for (Map<String, Object> row : localeRows) {
            String locale = (String) row.get("locale");
            long total = ((Number) row.get("total")).longValue();
            long translated = ((Number) row.get("translated")).longValue();
            int progress = total == 0 ? 0 : (int) Math.round(translated * 100.0 / total);
            Map<String, Object> stat = new HashMap<>();
            stat.put("translated", translated);
            stat.put("total", total);
            stat.put("progress", progress);
            locales.put(locale, stat);
        }
        Map<String, Object> stats = new HashMap<>();
        stats.put("total_keys", totalKeys);
        stats.put("locales", locales);
        return stats;
    }

    public TranslationKey getKeyById(String id) {
        TranslationKey key = translationKeyMapper.findById(id);
        if (key == null) {
            throw new RuntimeException("翻译键不存在");
        }
        attachValues(key, translationValueMapper.findByKeyId(id));
        return key;
    }

    @Transactional
    public TranslationKey createKey(TranslationKeyRequest req) {
        if (translationKeyMapper.findByKey(req.getKey()) != null) {
            throw new RuntimeException("翻译键已存在");
        }
        TranslationKey key = new TranslationKey();
        key.setId(UUID.randomUUID().toString());
        key.setKey(req.getKey());
        key.setNamespace(req.getNamespace() == null ? "common" : req.getNamespace());
        key.setDescription(req.getDescription());
        key.setCreatedAt(Instant.now());
        key.setUpdatedAt(Instant.now());
        translationKeyMapper.insert(key);
        return key;
    }

    @Transactional
    public TranslationKey updateKey(String id, TranslationKeyRequest req) {
        TranslationKey existing = translationKeyMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("翻译键不存在");
        }
        if (req.getKey() != null && !req.getKey().isBlank() && !req.getKey().equals(existing.getKey())) {
            TranslationKey byKey = translationKeyMapper.findByKey(req.getKey());
            if (byKey != null && !byKey.getId().equals(id)) {
                throw new RuntimeException("翻译键已存在");
            }
            existing.setKey(req.getKey());
        }
        if (req.getNamespace() != null) {
            existing.setNamespace(req.getNamespace());
        }
        if (req.getDescription() != null) {
            existing.setDescription(req.getDescription());
        }
        existing.setUpdatedAt(Instant.now());
        translationKeyMapper.update(existing);
        return existing;
    }

    @Transactional
    public void deleteKey(String id) {
        if (translationKeyMapper.findById(id) == null) {
            throw new RuntimeException("翻译键不存在");
        }
        translationKeyMapper.deleteById(id);
    }

    public List<TranslationValue> listValues(String keyId) {
        return translationValueMapper.findByKeyId(keyId);
    }

    @Transactional
    public TranslationValue saveValue(TranslationValueRequest req) {
        TranslationValue existing = translationValueMapper.findByKeyIdAndLocale(req.getKeyId(), req.getLocale());
        if (existing != null) {
            existing.setValue(req.getValue());
            existing.setIsTranslated(req.getIsTranslated() != null && req.getIsTranslated());
            existing.setUpdatedBy(req.getUpdatedBy());
            existing.setUpdatedAt(Instant.now());
            translationValueMapper.update(existing);
            return existing;
        }
        TranslationValue value = new TranslationValue();
        value.setId(UUID.randomUUID().toString());
        value.setKeyId(req.getKeyId());
        value.setLocale(req.getLocale());
        value.setValue(req.getValue());
        value.setIsTranslated(req.getIsTranslated() != null && req.getIsTranslated());
        value.setUpdatedBy(req.getUpdatedBy());
        value.setCreatedAt(Instant.now());
        value.setUpdatedAt(Instant.now());
        translationValueMapper.insert(value);
        return value;
    }

    @Transactional
    public TranslationValue saveValueByLocale(String keyId, String locale, String value) {
        TranslationValueRequest req = new TranslationValueRequest();
        req.setKeyId(keyId);
        req.setLocale(locale);
        req.setValue(value);
        req.setIsTranslated(value != null && !value.isBlank());
        return saveValue(req);
    }

    public Map<String, String> exportTranslations(String locale) {
        List<TranslationValue> values = translationValueMapper.findAll();
        return values.stream()
                .filter(v -> locale == null || locale.isBlank() || locale.equals(v.getLocale()))
                .filter(v -> v.getValue() != null && !v.getValue().isBlank())
                .collect(Collectors.toMap(
                        v -> v.getKeyId() + "." + v.getLocale(),
                        TranslationValue::getValue,
                        (a, b) -> a));
    }

    private void attachValues(TranslationKey key, List<TranslationValue> values) {
        Map<String, String> translations = new HashMap<>();
        List<String> translatedLocales = new ArrayList<>();
        for (TranslationValue v : values) {
            translations.put(v.getLocale(), v.getValue());
            if (Boolean.TRUE.equals(v.getIsTranslated()) && v.getValue() != null && !v.getValue().isBlank()) {
                translatedLocales.add(v.getLocale());
            }
        }
        key.setTranslations(translations);
        key.setTranslatedLocales(translatedLocales);
    }
}
