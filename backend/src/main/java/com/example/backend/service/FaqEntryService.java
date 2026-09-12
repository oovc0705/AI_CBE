package com.example.backend.service;

import com.example.backend.dto.admin.FaqEntryRequest;
import com.example.backend.entity.FaqEntry;
import com.example.backend.mapper.FaqEntryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FaqEntryService {

    private final FaqEntryMapper faqEntryMapper;

    public List<FaqEntry> list(String category, String locale) {
        return faqEntryMapper.findAll(category, locale);
    }

    public FaqEntry getById(String id) {
        FaqEntry entry = faqEntryMapper.findById(id);
        if (entry == null) {
            throw new RuntimeException("FAQ 不存在");
        }
        return entry;
    }

    @Transactional
    public FaqEntry create(FaqEntryRequest req) {
        FaqEntry entry = toFaqEntry(req, null);
        entry.setId(UUID.randomUUID().toString());
        entry.setCreatedAt(Instant.now());
        entry.setUpdatedAt(Instant.now());
        faqEntryMapper.insert(entry);
        return entry;
    }

    @Transactional
    public FaqEntry update(String id, FaqEntryRequest req) {
        FaqEntry existing = faqEntryMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("FAQ 不存在");
        }
        FaqEntry entry = toFaqEntry(req, existing);
        entry.setUpdatedAt(Instant.now());
        faqEntryMapper.update(entry);
        return entry;
    }

    @Transactional
    public void delete(String id) {
        if (faqEntryMapper.findById(id) == null) {
            throw new RuntimeException("FAQ 不存在");
        }
        faqEntryMapper.deleteById(id);
    }

    private FaqEntry toFaqEntry(FaqEntryRequest req, FaqEntry existing) {
        FaqEntry entry = existing == null ? new FaqEntry() : existing;
        entry.setQuestion(req.getQuestion());
        entry.setAnswer(req.getAnswer());
        entry.setCategory(req.getCategory());
        entry.setLocale(req.getLocale() == null ? "en" : req.getLocale());
        entry.setSortOrder(req.getSortOrder() == null ? 0 : req.getSortOrder());
        entry.setEnabled(req.getEnabled() == null ? true : req.getEnabled());
        return entry;
    }
}
