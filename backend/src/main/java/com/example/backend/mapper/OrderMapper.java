package com.example.backend.mapper;

import com.example.backend.entity.Order;
import com.example.backend.entity.OrderStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Mapper
public interface OrderMapper {
    Order findById(@Param("id") Long id);
    Order findByOrderNo(@Param("orderNo") String orderNo);
    List<Order> findByUserId(@Param("userId") Long userId);
    List<Order> findByStatus(@Param("status") String status);

    // Pagination methods
    List<Order> findAllOrderByCreatedAtDesc(@Param("offset") int offset, @Param("limit") int limit);
    long countAll();
    List<Order> findByStatusOrderByCreatedAtDesc(@Param("status") OrderStatus status, @Param("offset") int offset, @Param("limit") int limit);
    long countByStatus(@Param("status") OrderStatus status);

    int insert(Order order);
    int update(Order order);
    int updateStatus(@Param("id") Long id, @Param("status") String status);
    int markPaid(@Param("id") Long id,
                 @Param("paymentMethod") String paymentMethod,
                 @Param("transactionNo") String transactionNo);
    int deleteById(@Param("id") Long id);

    // Dashboard stats - 时间计算在SQL中完成，避免时区问题
    BigDecimal sumTotalAmountByStatusInAndCreatedAtAfterDays(@Param("statuses") List<String> statuses, @Param("days") int days);
    long countByStatusInAndCreatedAtAfterDays(@Param("statuses") List<String> statuses, @Param("days") int days);
    List<Map<String, Object>> getDailySalesTrend(@Param("days") int days);
    List<Map<String, Object>> getTopSellingProducts(@Param("days") int days, @Param("limit") int limit);

    List<Map<String, Object>> findAllForExport();
}
