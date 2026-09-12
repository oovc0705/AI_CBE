package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.FaqEntryRequest;
import com.example.backend.entity.FaqEntry;
import com.example.backend.service.FaqEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/kb/faq")
@RequiredArgsConstructor
public class AdminFaqController {

    private final FaqEntryService faqEntryService;

    @GetMapping
    public Result<List<FaqEntry>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String locale) {
        return Result.success(faqEntryService.list(category, locale));
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody FaqEntryRequest req) {
        FaqEntry entry = faqEntryService.create(req);
        return Result.success(Map.of("id", entry.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody FaqEntryRequest req) {
        faqEntryService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        faqEntryService.delete(id);
        return Result.success(null, "删除成功");
    }
}
