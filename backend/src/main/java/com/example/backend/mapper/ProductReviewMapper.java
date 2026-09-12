package com.example.backend.mapper;

import com.example.backend.entity.ProductReview;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ProductReviewMapper {

    ProductReview findById(@Param("id") String id);

    List<ProductReview> findAll(
            @Param("productId") String productId,
            @Param("status") String status,
            @Param("offset") int offset,
            @Param("limit") int limit);

    long countAll(@Param("productId") String productId, @Param("status") String status);

    int insert(ProductReview review);

    int update(ProductReview review);

    int deleteById(@Param("id") String id);

    List<Map<String, Object>> findAllForExport();
}
