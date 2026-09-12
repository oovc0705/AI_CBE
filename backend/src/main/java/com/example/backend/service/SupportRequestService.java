package com.example.backend.service;

import com.example.backend.entity.SupportRequest;
import com.example.backend.mapper.SupportRequestMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SupportRequestService {

    private final SupportRequestMapper mapper;

    public SupportRequest create(Long orderId, Long userId, String type, String subject, String message, String priority, String contactEmail) {
        SupportRequest req = new SupportRequest();
        req.setOrderId(orderId);
        req.setUserId(userId);
        req.setType(normalizeType(type));
        req.setSubject(subject != null ? subject : "");
        req.setMessage(message != null ? message : "");
        req.setPriority(normalizePriority(priority));
        req.setContactEmail(contactEmail);
        mapper.insert(req);
        return req;
    }

    /** 与 support_requests_type_check 约束保持一致，非法值应在入口就拒绝（400）而不是撞库（500） */
    private static final Set<String> ALLOWED_TYPES = Set.of("GENERAL", "REFUND", "EXCHANGE", "COMPLAINT");
    private static final Set<String> ALLOWED_PRIORITIES = Set.of("LOW", "NORMAL", "HIGH", "URGENT");

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return "GENERAL";
        }
        String upper = type.trim().toUpperCase();
        if (!ALLOWED_TYPES.contains(upper)) {
            throw new IllegalArgumentException("无效的工单类型: " + type);
        }
        return upper;
    }

    private String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return "NORMAL";
        }
        String upper = priority.trim().toUpperCase();
        if (!ALLOWED_PRIORITIES.contains(upper)) {
            throw new IllegalArgumentException("无效的优先级: " + priority);
        }
        return upper;
    }

    public SupportRequest create(Long orderId, String type, String message) {
        return create(orderId, null, type, null, message, null, null);
    }

    public List<SupportRequest> listByOrderId(Long orderId) {
        return mapper.findByOrderId(orderId);
    }

    public Page<SupportRequest> list(String status, String type, String priority, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<SupportRequest> list = mapper.findAll(status, type, priority, offset, limit);
        long total = mapper.countAll(status, type, priority);
        return new PageImpl<>(list, pageable, total);
    }

    public SupportRequest getDetailById(Long id) {
        return mapper.findDetailById(id);
    }

    public SupportRequest updateStatus(Long id, String status) {
        Instant closedAt = ("RESOLVED".equals(status) || "CLOSED".equals(status)) ? Instant.now() : null;
        mapper.updateStatus(id, status, closedAt);
        return mapper.findDetailById(id);
    }

    public SupportRequest reply(Long id, String adminReply, Long repliedBy) {
        mapper.reply(id, adminReply, repliedBy, Instant.now());
        return mapper.findDetailById(id);
    }

    public void updateAiSuggestedReply(Long id, String aiReply) {
        mapper.updateAiSuggestedReply(id, aiReply);
    }

    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("open", mapper.countByStatus("OPEN"));
        stats.put("inProgress", mapper.countByStatus("IN_PROGRESS"));
        stats.put("resolved", mapper.countByStatus("RESOLVED"));
        stats.put("closed", mapper.countByStatus("CLOSED"));
        stats.put("total", mapper.countAll(null, null, null));
        return stats;
    }
}
