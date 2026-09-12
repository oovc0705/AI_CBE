package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.PageResponse;
import com.example.backend.dto.admin.ShippingTemplateRequest;
import com.example.backend.entity.ShippingTemplate;
import com.example.backend.service.ShippingTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/shipping/templates")
@RequiredArgsConstructor
public class AdminShippingTemplateController {

    private final ShippingTemplateService shippingTemplateService;

    @GetMapping
    public Result<PageResponse<ShippingTemplate>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(shippingTemplateService.list(page, size));
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody ShippingTemplateRequest req) {
        ShippingTemplate template = shippingTemplateService.create(req);
        return Result.success(Map.of("id", template.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody ShippingTemplateRequest req) {
        shippingTemplateService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        shippingTemplateService.delete(id);
        return Result.success(null, "删除成功");
    }
}
