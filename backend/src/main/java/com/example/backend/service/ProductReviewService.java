package com.example.backend.service;

import com.example.backend.dto.admin.PageResponse;
import com.example.backend.dto.admin.ProductReviewRequest;
import com.example.backend.entity.ProductReview;
import com.example.backend.mapper.ProductReviewMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private final ProductReviewMapper productReviewMapper;

    public PageResponse<ProductReview> list(String productId, String status, int page, int size) {
        long total = productReviewMapper.countAll(productId, status);
        int offset = page * size;
        List<ProductReview> items = productReviewMapper.findAll(productId, status, offset, size);
        return PageResponse.of(items, total, page, size);
    }

    public ProductReview getById(String id) {
        ProductReview review = productReviewMapper.findById(id);
        if (review == null) {
            throw new RuntimeException("评价不存在");
        }
        return review;
    }

    @Transactional
    public ProductReview moderate(String id, ProductReviewRequest req) {
        ProductReview review = productReviewMapper.findById(id);
        if (review == null) {
            throw new RuntimeException("评价不存在");
        }
        if (req.getStatus() != null) {
            review.setStatus(req.getStatus());
        }
        if (req.getMerchantReply() != null) {
            review.setMerchantReply(req.getMerchantReply());
            review.setRepliedAt(Instant.now());
            review.setRepliedBy("admin");
        }
        review.setUpdatedAt(Instant.now());
        productReviewMapper.update(review);
        return review;
    }

    @Transactional
    public void delete(String id) {
        if (productReviewMapper.findById(id) == null) {
            throw new RuntimeException("评价不存在");
        }
        productReviewMapper.deleteById(id);
    }

    public Map<String, Object> stats() {
        long total = productReviewMapper.countAll(null, null);
        long pending = productReviewMapper.countAll(null, "pending");
        long approved = productReviewMapper.countAll(null, "approved");
        long rejected = productReviewMapper.countAll(null, "rejected");
        // 计算平均评分
        double avgRating = 0.0;
        List<ProductReview> all = productReviewMapper.findAll(null, null, 0, 1000);
        if (!all.isEmpty()) {
            avgRating = all.stream().mapToInt(ProductReview::getRating).average().orElse(0.0);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("pending", pending);
        result.put("approved", approved);
        result.put("rejected", rejected);
        result.put("average_rating", Math.round(avgRating * 10) / 10.0);
        return result;
    }
}
