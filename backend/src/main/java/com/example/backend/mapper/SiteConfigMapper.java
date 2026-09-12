package com.example.backend.mapper;

import com.example.backend.entity.SiteConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface SiteConfigMapper {
    SiteConfig findById(@Param("id") Long id);
    int insert(SiteConfig siteConfig);
    int update(SiteConfig siteConfig);
}
