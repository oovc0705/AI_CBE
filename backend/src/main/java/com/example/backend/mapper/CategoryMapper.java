package com.example.backend.mapper;

import com.example.backend.entity.Category;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CategoryMapper {
    Category findById(@Param("id") Long id);
    Category findBySlug(@Param("slug") String slug);
    List<Category> findAll(@Param("offset") int offset, @Param("limit") int limit);
    long countAll();
    List<Category> findByParentId(@Param("parentId") Long parentId);
    int insert(Category category);
    int update(Category category);
    int deleteById(@Param("id") Long id);
}
