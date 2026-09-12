package com.example.backend.mapper;

import com.example.backend.entity.ShippingCarrier;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ShippingCarrierMapper {

    ShippingCarrier findById(@Param("id") String id);

    ShippingCarrier findByCode(@Param("code") String code);

    List<ShippingCarrier> findAll(@Param("enabled") Boolean enabled);

    int insert(ShippingCarrier carrier);

    int update(ShippingCarrier carrier);

    int deleteById(@Param("id") String id);
}
