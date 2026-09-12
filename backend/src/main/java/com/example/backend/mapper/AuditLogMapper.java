package com.example.backend.mapper;

import com.example.backend.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AuditLogMapper {

    List<AuditLog> findAll(
            @Param("action") String action,
            @Param("resourceType") String resourceType,
            @Param("offset") int offset,
            @Param("limit") int limit);

    long countAll(@Param("action") String action, @Param("resourceType") String resourceType);

    int insert(AuditLog log);
}
