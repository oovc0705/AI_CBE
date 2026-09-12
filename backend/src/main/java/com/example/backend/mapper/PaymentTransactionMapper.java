package com.example.backend.mapper;

import com.example.backend.entity.PaymentTransaction;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PaymentTransactionMapper {

    PaymentTransaction findById(@Param("id") String id);

    List<PaymentTransaction> findAll(
            @Param("gatewayId") String gatewayId,
            @Param("status") String status,
            @Param("offset") int offset,
            @Param("limit") int limit);

    long countAll(@Param("gatewayId") String gatewayId, @Param("status") String status);

    int insert(PaymentTransaction transaction);

    int update(PaymentTransaction transaction);

    List<Map<String, Object>> findAllForExport();
}
