package com.example.backend.entity;

import lombok.Data;
import java.time.Instant;

/**
 * 站点全局配置 (单行实体，用于 SEO 元数据管理)
 */
@Data
public class SiteConfig {
    private Long id = 1L;
    private String titleSuffix;
    private String descriptionTemplate;
    private String ogImageUrl;
    private String gaMeasurementId;
    private String twitterHandle;
    private Instant updatedAt;
}
