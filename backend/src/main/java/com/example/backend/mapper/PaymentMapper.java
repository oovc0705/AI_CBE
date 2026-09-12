package com.example.backend.mapper;

import com.example.backend.entity.Payment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PaymentMapper {
    Payment findById(@Param("id") Long id);
    List<Payment> findByOrderId(@Param("orderId") Long orderId);
    int insert(Payment payment);
    int updateStatus(@Param("id") Long id,
                     @Param("status") String status,
                     @Param("transactionNo") String transactionNo,
                     @Param("providerMessage") String providerMessage);
}
