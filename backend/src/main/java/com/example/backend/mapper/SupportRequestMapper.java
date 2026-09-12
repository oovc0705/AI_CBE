package com.example.backend.mapper;

import com.example.backend.entity.SupportRequest;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.Instant;
import java.util.List;

@Mapper
public interface SupportRequestMapper {
    SupportRequest findById(@Param("id") Long id);

    SupportRequest findDetailById(@Param("id") Long id);

    List<SupportRequest> findByOrderId(@Param("orderId") Long orderId);

    List<SupportRequest> findAll(
            @Param("status") String status,
            @Param("type") String type,
            @Param("priority") String priority,
            @Param("offset") int offset,
            @Param("limit") int limit
    );

    long countAll(
            @Param("status") String status,
            @Param("type") String type,
            @Param("priority") String priority
    );

    int insert(SupportRequest supportRequest);

    int updateStatus(@Param("id") Long id, @Param("status") String status, @Param("closedAt") Instant closedAt);

    int reply(
            @Param("id") Long id,
            @Param("adminReply") String adminReply,
            @Param("repliedBy") Long repliedBy,
            @Param("repliedAt") Instant repliedAt
    );

    int updateAiSuggestedReply(@Param("id") Long id, @Param("aiSuggestedReply") String aiSuggestedReply);

    long countByStatus(@Param("status") String status);
}
