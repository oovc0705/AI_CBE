package com.example.backend.mapper;

import com.example.backend.entity.OrderItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface OrderItemMapper {
    OrderItem findById(@Param("id") Long id);
    List<OrderItem> findByOrderId(@Param("orderId") Long orderId);
    int insert(OrderItem item);
    int insertBatch(@Param("items") List<OrderItem> items);
    int deleteById(@Param("id") Long id);
}
