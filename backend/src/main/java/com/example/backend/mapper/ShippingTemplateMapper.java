package com.example.backend.mapper;

import com.example.backend.entity.ShippingRule;
import com.example.backend.entity.ShippingTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ShippingTemplateMapper {

    ShippingTemplate findById(@Param("id") String id);

    List<ShippingTemplate> findAll(@Param("offset") int offset, @Param("limit") int limit);

    long countAll();

    int insert(ShippingTemplate template);

    int update(ShippingTemplate template);

    int deleteById(@Param("id") String id);

    int clearDefault();

    List<ShippingRule> findRulesByTemplateId(@Param("templateId") String templateId);

    int insertRule(ShippingRule rule);

    int deleteRulesByTemplateId(@Param("templateId") String templateId);
}
