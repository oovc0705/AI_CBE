package com.example.backend.mapper;

import com.example.backend.dto.ProductSitemapDto;
import com.example.backend.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface ProductMapper {
    Product findById(@Param("id") Long id);
    Product findBySlug(@Param("slug") String slug);
    List<Product> findByIds(@Param("ids") List<Long> ids);
    List<Product> findAll(@Param("offset") int offset, @Param("limit") int limit);
    long countAll();

    List<Product> findByNameKeyword(@Param("keyword") String keyword,
                                    @Param("offset") int offset, @Param("limit") int limit);
    long countByNameKeyword(@Param("keyword") String keyword);

    int insert(Product product);
    int update(Product product);
    int deleteById(@Param("id") Long id);
    int deleteByIds(@Param("ids") List<Long> ids);

    List<ProductSitemapDto> findAllSitemapData();

    // Full-text search using PostgreSQL tsvector + GIN index
    List<Product> fullTextSearch(@Param("q") String q,
                                 @Param("category") String category,
                                 @Param("minPrice") BigDecimal minPrice,
                                 @Param("maxPrice") BigDecimal maxPrice,
                                 @Param("brands") List<String> brands,
                                 @Param("sort") String sort,
                                 @Param("offset") int offset,
                                 @Param("limit") int limit);
    long countFullTextSearch(@Param("q") String q,
                             @Param("category") String category,
                             @Param("minPrice") BigDecimal minPrice,
                             @Param("maxPrice") BigDecimal maxPrice,
                             @Param("brands") List<String> brands);

    // Category facet counts
    List<Map<String, Object>> categoryFacets(@Param("q") String q,
                                                        @Param("minPrice") BigDecimal minPrice,
                                                        @Param("maxPrice") BigDecimal maxPrice,
                                                        @Param("brands") List<String> brands);

    // Price range facet counts
    List<Map<String, Object>> priceRangeFacets(@Param("q") String q,
                                                          @Param("category") String category,
                                                          @Param("brands") List<String> brands);

    // All distinct categories
    List<String> findAllCategories();

    // All distinct brands that have active products
    List<Map<String, Object>> findAllBrands();

    // Dashboard stats
    long countLowStock(@Param("threshold") int threshold);

    List<Map<String, Object>> findAllForExport();
}
