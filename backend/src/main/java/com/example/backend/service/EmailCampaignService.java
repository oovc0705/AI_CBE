package com.example.backend.service;

import com.example.backend.dto.admin.EmailCampaignRequest;
import com.example.backend.entity.EmailCampaign;
import com.example.backend.mapper.EmailCampaignMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailCampaignService {

    private final EmailCampaignMapper emailCampaignMapper;

    public List<EmailCampaign> list(String status) {
        return emailCampaignMapper.findAll(status);
    }

    public EmailCampaign getById(String id) {
        EmailCampaign campaign = emailCampaignMapper.findById(id);
        if (campaign == null) {
            throw new RuntimeException("邮件活动不存在");
        }
        return campaign;
    }

    @Transactional
    public EmailCampaign create(EmailCampaignRequest req, String createdBy) {
        EmailCampaign campaign = toCampaign(req, null);
        campaign.setId(UUID.randomUUID().toString());
        campaign.setStatus("draft");
        campaign.setSentCount(0);
        campaign.setCreatedBy(createdBy);
        campaign.setCreatedAt(Instant.now());
        campaign.setUpdatedAt(Instant.now());
        emailCampaignMapper.insert(campaign);
        return campaign;
    }

    @Transactional
    public EmailCampaign update(String id, EmailCampaignRequest req) {
        EmailCampaign existing = emailCampaignMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("邮件活动不存在");
        }
        EmailCampaign campaign = toCampaign(req, existing);
        campaign.setUpdatedAt(Instant.now());
        emailCampaignMapper.update(campaign);
        return campaign;
    }

    @Transactional
    public EmailCampaign send(String id) {
        EmailCampaign campaign = emailCampaignMapper.findById(id);
        if (campaign == null) {
            throw new RuntimeException("邮件活动不存在");
        }
        campaign.setStatus("sent");
        campaign.setSentAt(Instant.now());
        campaign.setSentCount(campaign.getRecipientCount() == null ? 0 : campaign.getRecipientCount());
        campaign.setUpdatedAt(Instant.now());
        emailCampaignMapper.update(campaign);
        return campaign;
    }

    @Transactional
    public void delete(String id) {
        if (emailCampaignMapper.findById(id) == null) {
            throw new RuntimeException("邮件活动不存在");
        }
        emailCampaignMapper.deleteById(id);
    }

    private EmailCampaign toCampaign(EmailCampaignRequest req, EmailCampaign existing) {
        EmailCampaign campaign = existing == null ? new EmailCampaign() : existing;
        campaign.setName(req.getName());
        campaign.setTemplateId(req.getTemplateId());
        campaign.setSubject(req.getSubject());
        campaign.setBodyHtml(req.getBodyHtml());
        campaign.setScheduledAt(req.getScheduledAt());
        campaign.setRecipientCount(req.getRecipientCount() == null ? 0 : req.getRecipientCount());
        return campaign;
    }
}
