package com.example.backend.mapper;

import com.example.backend.entity.Coupon;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CouponMapper {
    Coupon findById(@Param("id") Long id);
    Coupon findByCode(@Param("code") String code);
    List<Coupon> findAll(@Param("offset") int offset, @Param("limit") int limit);
    long countAll();
    List<Coupon> findValidCoupons();
    int insert(Coupon coupon);
    int update(Coupon coupon);
    int incrementUsedCount(@Param("id") Long id);
    int deleteById(@Param("id") Long id);
}
