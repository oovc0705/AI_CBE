package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.EmailTemplateRequest;
import com.example.backend.entity.EmailTemplate;
import com.example.backend.service.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/email/templates")
@RequiredArgsConstructor
public class AdminEmailTemplateController {

    private final EmailTemplateService emailTemplateService;

    @GetMapping
    public Result<List<EmailTemplate>> list() {
        return Result.success(emailTemplateService.list());
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody EmailTemplateRequest req) {
        EmailTemplate template = emailTemplateService.create(req);
        return Result.success(Map.of("id", template.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody EmailTemplateRequest req) {
        emailTemplateService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        emailTemplateService.delete(id);
        return Result.success(null, "删除成功");
    }
}
