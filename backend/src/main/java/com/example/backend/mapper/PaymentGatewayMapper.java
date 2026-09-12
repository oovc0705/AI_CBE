package com.example.backend.mapper;

import com.example.backend.entity.PaymentGateway;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PaymentGatewayMapper {

    PaymentGateway findById(@Param("id") String id);

    PaymentGateway findByName(@Param("name") String name);

    List<PaymentGateway> findAll();

    int insert(PaymentGateway gateway);

    int update(PaymentGateway gateway);

    int deleteById(@Param("id") String id);
}
