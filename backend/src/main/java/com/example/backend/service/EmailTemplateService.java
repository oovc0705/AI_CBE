package com.example.backend.service;

import com.example.backend.dto.admin.EmailTemplateRequest;
import com.example.backend.entity.EmailTemplate;
import com.example.backend.exception.DuplicateResourceException;
import com.example.backend.mapper.EmailTemplateMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final EmailTemplateMapper emailTemplateMapper;

    public List<EmailTemplate> list() {
        return emailTemplateMapper.findAll();
    }

    public EmailTemplate getById(String id) {
        EmailTemplate template = emailTemplateMapper.findById(id);
        if (template == null) {
            throw new RuntimeException("邮件模板不存在");
        }
        return template;
    }

    @Transactional
    public EmailTemplate create(EmailTemplateRequest req) {
        if (emailTemplateMapper.findByCode(req.getCode()) != null) {
            throw new DuplicateResourceException("模板代码已存在");
        }
        EmailTemplate template = toTemplate(req, null);
        template.setId(UUID.randomUUID().toString());
        template.setCreatedAt(Instant.now());
        template.setUpdatedAt(Instant.now());
        emailTemplateMapper.insert(template);
        return template;
    }

    @Transactional
    public EmailTemplate update(String id, EmailTemplateRequest req) {
        EmailTemplate existing = emailTemplateMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("邮件模板不存在");
        }
        EmailTemplate byCode = emailTemplateMapper.findByCode(req.getCode());
        if (byCode != null && !byCode.getId().equals(id)) {
            throw new DuplicateResourceException("模板代码已存在");
        }
        EmailTemplate template = toTemplate(req, existing);
        template.setUpdatedAt(Instant.now());
        emailTemplateMapper.update(template);
        return template;
    }

    @Transactional
    public void delete(String id) {
        if (emailTemplateMapper.findById(id) == null) {
            throw new RuntimeException("邮件模板不存在");
        }
        emailTemplateMapper.deleteById(id);
    }

    private EmailTemplate toTemplate(EmailTemplateRequest req, EmailTemplate existing) {
        EmailTemplate template = existing == null ? new EmailTemplate() : existing;
        template.setName(req.getName());
        template.setCode(req.getCode());
        template.setSubject(req.getSubject());
        template.setBodyHtml(req.getBodyHtml());
        if (req.getVariables() != null) {
            ArrayNode arr = OBJECT_MAPPER.createArrayNode();
            req.getVariables().forEach(arr::add);
            template.setVariables(arr);
        }
        return template;
    }
}
