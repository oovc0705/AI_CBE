package com.example.backend.mapper;

import com.example.backend.entity.TaxRule;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TaxRuleMapper {

    TaxRule findById(@Param("id") String id);

    List<TaxRule> findAll(@Param("countryCode") String countryCode, @Param("enabled") Boolean enabled);

    int insert(TaxRule rule);

    int update(TaxRule rule);

    int deleteById(@Param("id") String id);
}
