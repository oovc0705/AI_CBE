package com.example.backend.mapper;

import com.example.backend.entity.Brand;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface BrandMapper {
    Brand findById(@Param("id") Long id);
    Brand findBySlug(@Param("slug") String slug);
    List<Brand> findAll(@Param("offset") int offset, @Param("limit") int limit);
    long countAll();
    int insert(Brand brand);
    int update(Brand brand);
    int deleteById(@Param("id") Long id);
}
