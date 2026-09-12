package com.example.backend.mapper;

import com.example.backend.entity.SystemNotification;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SystemNotificationMapper {

    SystemNotification findById(@Param("id") String id);

    List<SystemNotification> findAll(
            @Param("recipientId") String recipientId,
            @Param("isRead") Boolean isRead,
            @Param("offset") int offset,
            @Param("limit") int limit);

    long countAll(@Param("recipientId") String recipientId, @Param("isRead") Boolean isRead);

    int insert(SystemNotification notification);

    int update(SystemNotification notification);

    int markAllRead(@Param("recipientId") String recipientId);
}
