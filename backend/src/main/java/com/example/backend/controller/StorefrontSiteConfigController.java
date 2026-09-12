package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.entity.SiteConfig;
import com.example.backend.service.SiteConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * C端站点配置接口 - 供前端动态读取 GA4 ID、Twitter Handle 等公共配置
 */
@RestController
@RequestMapping("/api/storefront/site-config")
@RequiredArgsConstructor
public class StorefrontSiteConfigController {

    private final SiteConfigService siteConfigService;

    @GetMapping
    public Result<SiteConfig> getPublicConfig() {
        return Result.success(siteConfigService.getConfig());
    }
}
