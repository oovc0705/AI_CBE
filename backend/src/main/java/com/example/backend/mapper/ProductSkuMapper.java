package com.example.backend.mapper;

import com.example.backend.entity.ProductSku;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ProductSkuMapper {
    ProductSku findById(@Param("id") Long id);
    ProductSku findBySkuCode(@Param("skuCode") String skuCode);
    List<ProductSku> findByProductId(@Param("productId") Long productId);
    int insert(ProductSku sku);
    int update(ProductSku sku);
    int updateStock(@Param("id") Long id, @Param("stock") Integer stock);
    int deleteById(@Param("id") Long id);
    int deleteByProductId(@Param("productId") Long productId);
}
