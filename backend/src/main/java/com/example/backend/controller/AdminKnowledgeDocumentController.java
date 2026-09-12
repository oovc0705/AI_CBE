package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.KnowledgeDocumentRequest;
import com.example.backend.entity.KnowledgeDocument;
import com.example.backend.service.KnowledgeDocumentService;
import com.example.backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/kb/documents")
@RequiredArgsConstructor
public class AdminKnowledgeDocumentController {

    private final KnowledgeDocumentService knowledgeDocumentService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public Result<List<KnowledgeDocument>> list(
            @RequestParam(required = false) String collection,
            @RequestParam(required = false) String status) {
        return Result.success(knowledgeDocumentService.list(collection, status));
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody KnowledgeDocumentRequest req, HttpServletRequest request) {
        String username = resolveUsername(request);
        KnowledgeDocument document = knowledgeDocumentService.create(req, username);
        return Result.success(Map.of("id", document.getId()), "上传成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody KnowledgeDocumentRequest req) {
        knowledgeDocumentService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        knowledgeDocumentService.delete(id);
        return Result.success(null, "删除成功");
    }

    @PostMapping("/upload")
    public Result<Map<String, String>> upload(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        String username = resolveUsername(request);
        KnowledgeDocument document = knowledgeDocumentService.upload(file, username);
        return Result.success(Map.of("id", document.getId()), "上传成功");
    }

    @PostMapping("/{id}/train")
    public Result<Void> train(@PathVariable String id) {
        knowledgeDocumentService.train(id);
        return Result.success(null, "已开始训练");
    }

    private String resolveUsername(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return jwtUtil.parseToken(bearer.substring(7)).get("username", String.class);
        }
        return "admin";
    }
}
