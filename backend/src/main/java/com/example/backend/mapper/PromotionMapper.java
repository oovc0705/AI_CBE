package com.example.backend.mapper;

import com.example.backend.entity.Promotion;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PromotionMapper {

    Promotion findById(@Param("id") String id);

    List<Promotion> findAll(@Param("enabled") Boolean enabled);

    int insert(Promotion promotion);

    int update(Promotion promotion);

    int deleteById(@Param("id") String id);
}
