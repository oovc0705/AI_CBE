package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.TranslationKeyRequest;
import com.example.backend.dto.admin.TranslationValueRequest;
import com.example.backend.entity.TranslationKey;
import com.example.backend.entity.TranslationValue;
import com.example.backend.service.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/translations")
@RequiredArgsConstructor
public class AdminTranslationController {

    private final TranslationService translationService;

    @GetMapping
    public Result<Map<String, Object>> listTranslations(
            @RequestParam(required = false) String namespace,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        Page<TranslationKey> result = translationService.listTranslations(namespace, keyword, page, size);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("content", result.getContent());
        data.put("totalElements", result.getTotalElements());
        data.put("totalPages", result.getTotalPages());
        data.put("number", result.getNumber());
        data.put("size", result.getSize());
        data.put("locales", translationService.listLocales());
        return Result.success(data);
    }

    @GetMapping("/stats")
    public Result<Map<String, Object>> getStats() {
        return Result.success(translationService.getStats());
    }

    @GetMapping("/export")
    public Map<String, String> exportTranslations(@RequestParam(required = false) String locale) {
        return translationService.exportTranslations(locale);
    }

    @GetMapping("/keys")
    public Result<List<TranslationKey>> listKeys(@RequestParam(required = false) String namespace) {
        return Result.success(translationService.listKeys(namespace));
    }

    @PostMapping("/keys")
    public Result<Map<String, String>> createKey(@RequestBody TranslationKeyRequest req) {
        TranslationKey key = translationService.createKey(req);
        return Result.success(Map.of("id", key.getId()), "创建成功");
    }

    @PutMapping("/keys/{id}")
    public Result<Void> updateKey(@PathVariable String id, @RequestBody TranslationKeyRequest req) {
        translationService.updateKey(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/keys/{id}")
    public Result<Void> deleteKey(@PathVariable String id) {
        translationService.deleteKey(id);
        return Result.success(null, "删除成功");
    }

    @GetMapping("/keys/{keyId}/values")
    public Result<List<TranslationValue>> listValues(@PathVariable String keyId) {
        return Result.success(translationService.listValues(keyId));
    }

    @PostMapping("/values")
    public Result<Void> saveValue(@RequestBody TranslationValueRequest req) {
        translationService.saveValue(req);
        return Result.success(null, "保存成功");
    }

    @PutMapping("/keys/{id}/values/{locale}")
    public Result<Void> saveValueByLocale(
            @PathVariable String id,
            @PathVariable String locale,
            @RequestBody Map<String, String> body) {
        translationService.saveValueByLocale(id, locale, body.get("value"));
        return Result.success(null, "保存成功");
    }
}
