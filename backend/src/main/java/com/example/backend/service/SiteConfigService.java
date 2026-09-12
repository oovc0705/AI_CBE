package com.example.backend.service;

import com.example.backend.entity.SiteConfig;
import com.example.backend.mapper.SiteConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class SiteConfigService {

    private static final Long SINGLETON_ID = 1L;

    private final SiteConfigMapper siteConfigMapper;

    /**
     * 获取站点全局配置（单行记录）
     */
    public SiteConfig getConfig() {
        SiteConfig config = siteConfigMapper.findById(SINGLETON_ID);
        return config != null ? config : createDefault();
    }

    /**
     * 更新站点全局配置
     */
    public SiteConfig updateConfig(SiteConfig incoming) {
        SiteConfig existing = siteConfigMapper.findById(SINGLETON_ID);
        if (existing == null) {
            return createDefault();
        }
        existing.setTitleSuffix(incoming.getTitleSuffix());
        existing.setDescriptionTemplate(incoming.getDescriptionTemplate());
        existing.setOgImageUrl(incoming.getOgImageUrl());
        existing.setGaMeasurementId(incoming.getGaMeasurementId());
        existing.setTwitterHandle(incoming.getTwitterHandle());
        existing.setUpdatedAt(Instant.now());
        siteConfigMapper.update(existing);
        return existing;
    }

    private SiteConfig createDefault() {
        SiteConfig config = new SiteConfig();
        config.setId(SINGLETON_ID);
        config.setTitleSuffix("MyStore");
        config.setDescriptionTemplate("Premium quality products at affordable prices. Shop now at MyStore.");
        config.setOgImageUrl("/og-default.png");
        config.setGaMeasurementId("");
        config.setTwitterHandle("");
        config.setUpdatedAt(Instant.now());
        siteConfigMapper.insert(config);
        return config;
    }
}
