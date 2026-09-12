package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.EmailCampaignRequest;
import com.example.backend.entity.EmailCampaign;
import com.example.backend.service.EmailCampaignService;
import com.example.backend.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/email/campaigns")
@RequiredArgsConstructor
public class AdminEmailCampaignController {

    private final EmailCampaignService emailCampaignService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public Result<List<EmailCampaign>> list(@RequestParam(required = false) String status) {
        return Result.success(emailCampaignService.list(status));
    }

    @PostMapping
    public Result<Map<String, String>> create(@RequestBody EmailCampaignRequest req, HttpServletRequest request) {
        String token = resolveToken(request);
        String username = token == null ? "admin" : jwtUtil.parseToken(token).get("username", String.class);
        EmailCampaign campaign = emailCampaignService.create(req, username);
        return Result.success(Map.of("id", campaign.getId()), "创建成功");
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable String id, @RequestBody EmailCampaignRequest req) {
        emailCampaignService.update(id, req);
        return Result.success(null, "更新成功");
    }

    @PostMapping("/{id}/send")
    public Result<Void> send(@PathVariable String id) {
        emailCampaignService.send(id);
        return Result.success(null, "发送成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        emailCampaignService.delete(id);
        return Result.success(null, "删除成功");
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
