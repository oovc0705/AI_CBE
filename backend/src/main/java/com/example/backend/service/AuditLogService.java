package com.example.backend.service;

import com.example.backend.dto.admin.PageResponse;
import com.example.backend.entity.AuditLog;
import com.example.backend.mapper.AuditLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogMapper auditLogMapper;

    public PageResponse<AuditLog> list(String action, String resourceType, int page, int size) {
        long total = auditLogMapper.countAll(action, resourceType);
        int offset = page * size;
        List<AuditLog> items = auditLogMapper.findAll(action, resourceType, offset, size);
        return PageResponse.of(items, total, page, size);
    }

    public void log(AuditLog log) {
        if (log.getId() == null) {
            log.setId(UUID.randomUUID().toString());
        }
        if (log.getCreatedAt() == null) {
            log.setCreatedAt(Instant.now());
        }
        auditLogMapper.insert(log);
    }
}
