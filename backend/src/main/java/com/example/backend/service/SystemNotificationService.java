package com.example.backend.service;

import com.example.backend.dto.admin.PageResponse;
import com.example.backend.dto.admin.SystemNotificationRequest;
import com.example.backend.entity.SystemNotification;
import com.example.backend.mapper.SystemNotificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SystemNotificationService {

    private final SystemNotificationMapper systemNotificationMapper;

    public PageResponse<SystemNotification> list(String recipientId, Boolean isRead, int page, int size) {
        long total = systemNotificationMapper.countAll(recipientId, isRead);
        int offset = page * size;
        List<SystemNotification> items = systemNotificationMapper.findAll(recipientId, isRead, offset, size);
        return PageResponse.of(items, total, page, size);
    }

    public SystemNotification getById(String id) {
        SystemNotification notification = systemNotificationMapper.findById(id);
        if (notification == null) {
            throw new RuntimeException("通知不存在");
        }
        return notification;
    }

    @Transactional
    public SystemNotification create(SystemNotification notification) {
        notification.setId(UUID.randomUUID().toString());
        notification.setIsRead(false);
        notification.setCreatedAt(Instant.now());
        systemNotificationMapper.insert(notification);
        return notification;
    }

    @Transactional
    public SystemNotification update(String id, SystemNotificationRequest req) {
        SystemNotification existing = systemNotificationMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("通知不存在");
        }
        if (req.getIsRead() != null) {
            existing.setIsRead(req.getIsRead());
        }
        systemNotificationMapper.update(existing);
        return existing;
    }

    @Transactional
    public void markAllRead(String recipientId) {
        systemNotificationMapper.markAllRead(recipientId);
    }

    public Map<String, Long> stats() {
        long total = systemNotificationMapper.countAll(null, null);
        long unread = systemNotificationMapper.countAll(null, false);
        Map<String, Long> result = new HashMap<>();
        result.put("total", total);
        result.put("unread", unread);
        return result;
    }
}
