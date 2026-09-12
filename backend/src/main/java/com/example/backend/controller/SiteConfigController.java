package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.entity.SiteConfig;
import com.example.backend.service.SiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/site-config")
@RequiredArgsConstructor
public class SiteConfigController {

    private final SiteConfigService siteConfigService;

    @GetMapping
    public Result<SiteConfig> getConfig() {
        return Result.success(siteConfigService.getConfig());
    }

    @PutMapping
    public Result<SiteConfig> updateConfig(@RequestBody SiteConfig siteConfig) {
        return Result.success(siteConfigService.updateConfig(siteConfig));
    }
}
