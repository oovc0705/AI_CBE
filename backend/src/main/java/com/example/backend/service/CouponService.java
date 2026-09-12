package com.example.backend.service;

import com.example.backend.entity.Coupon;
import com.example.backend.mapper.CouponMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponMapper couponMapper;

    public Page<Coupon> list(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<Coupon> content = couponMapper.findAll(offset, limit);
        long total = couponMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    public Coupon getById(Long id) {
        return couponMapper.findById(id);
    }

    @Transactional
    public Coupon create(Coupon coupon) {
        if (coupon.getStatus() == null) {
            coupon.setStatus("ACTIVE");
        }
        couponMapper.insert(coupon);
        return coupon;
    }

    @Transactional
    public Coupon update(Long id, Coupon incoming) {
        Coupon existing = couponMapper.findById(id);
        if (existing == null) {
            return null;
        }
        if (incoming.getCode() != null) {
            existing.setCode(incoming.getCode());
        }
        if (incoming.getType() != null) {
            existing.setType(incoming.getType());
        }
        if (incoming.getValue() != null) {
            existing.setValue(incoming.getValue());
        }
        if (incoming.getMinOrderAmount() != null) {
            existing.setMinOrderAmount(incoming.getMinOrderAmount());
        }
        if (incoming.getUsageLimit() != null) {
            existing.setUsageLimit(incoming.getUsageLimit());
        }
        if (incoming.getUsedCount() != null) {
            existing.setUsedCount(incoming.getUsedCount());
        }
        if (incoming.getStatus() != null) {
            existing.setStatus(incoming.getStatus().toUpperCase());
        }
        if (incoming.getExpiresAt() != null) {
            existing.setExpiresAt(incoming.getExpiresAt());
        }
        couponMapper.update(existing);
        return couponMapper.findById(id);
    }

    @Transactional
    public Coupon toggleStatus(Long id) {
        Coupon existing = couponMapper.findById(id);
        if (existing == null) return null;
        String newStatus = "ACTIVE".equalsIgnoreCase(existing.getStatus()) ? "INACTIVE" : "ACTIVE";
        existing.setStatus(newStatus);
        couponMapper.update(existing);
        return existing;
    }

    public boolean delete(Long id) {
        return couponMapper.deleteById(id) > 0;
    }
}
