package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.PromotionRequest;
import com.example.backend.entity.Promotion;
import com.example.backend.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/promotions")
@RequiredArgsConstructor
public class AdminPromotionController {

    private final PromotionService promotionService;

    @GetMapping
    public Result<List<Promotion>> list(@RequestParam(required = false) Boolean enabled) {
        return Result.success(promotionService.list(enabled));
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody PromotionRequest req) {
        Promotion promotion = promotionService.create(req);
        return Result.success(Map.of("id", promotion.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody PromotionRequest req) {
        promotionService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        promotionService.delete(id);
        return Result.success(null, "删除成功");
    }

    @PutMapping("/{id}/toggle")
    public Result<Void> toggle(@PathVariable String id) {
        promotionService.toggle(id);
        return Result.success(null, "状态切换成功");
    }
}
