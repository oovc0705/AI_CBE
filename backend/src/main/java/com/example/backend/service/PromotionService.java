package com.example.backend.service;

import com.example.backend.dto.admin.PromotionRequest;
import com.example.backend.entity.Promotion;
import com.example.backend.mapper.PromotionMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionMapper promotionMapper;

    public List<Promotion> list(Boolean enabled) {
        return promotionMapper.findAll(enabled);
    }

    public Promotion getById(String id) {
        Promotion promotion = promotionMapper.findById(id);
        if (promotion == null) {
            throw new RuntimeException("活动不存在");
        }
        return promotion;
    }

    @Transactional
    public Promotion create(PromotionRequest req) {
        Promotion promotion = toPromotion(req, null);
        promotion.setId(UUID.randomUUID().toString());
        promotion.setUsedCount(0);
        promotion.setCreatedAt(Instant.now());
        promotion.setUpdatedAt(Instant.now());
        promotionMapper.insert(promotion);
        return promotion;
    }

    @Transactional
    public Promotion update(String id, PromotionRequest req) {
        Promotion existing = promotionMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("活动不存在");
        }
        Promotion promotion = toPromotion(req, existing);
        promotion.setUpdatedAt(Instant.now());
        promotionMapper.update(promotion);
        return promotion;
    }

    @Transactional
    public void delete(String id) {
        if (promotionMapper.findById(id) == null) {
            throw new RuntimeException("活动不存在");
        }
        promotionMapper.deleteById(id);
    }

    @Transactional
    public Promotion toggle(String id) {
        Promotion promotion = promotionMapper.findById(id);
        if (promotion == null) {
            throw new RuntimeException("活动不存在");
        }
        promotion.setEnabled(!Boolean.TRUE.equals(promotion.getEnabled()));
        promotion.setUpdatedAt(Instant.now());
        promotionMapper.update(promotion);
        return promotion;
    }

    private Promotion toPromotion(PromotionRequest req, Promotion existing) {
        Promotion promotion = existing == null ? new Promotion() : existing;
        promotion.setName(req.getName());
        promotion.setType(req.getType());
        promotion.setDiscountType(req.getDiscountType() == null ? "percentage" : req.getDiscountType());
        promotion.setDiscountValue(req.getDiscountValue() == null ? 0.0 : req.getDiscountValue());
        promotion.setMinOrderAmount(req.getMinOrderAmount());
        promotion.setMaxDiscount(req.getMaxDiscount());
        promotion.setUsageLimit(req.getUsageLimit());
        promotion.setStartsAt(req.getStartsAt());
        promotion.setEndsAt(req.getEndsAt());
        promotion.setApplicableProductIds(req.getApplicableProductIds());
        promotion.setEnabled(req.getEnabled() == null ? true : req.getEnabled());
        return promotion;
    }
}
