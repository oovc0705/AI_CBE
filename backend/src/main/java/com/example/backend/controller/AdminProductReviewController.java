package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.dto.admin.PageResponse;
import com.example.backend.dto.admin.ProductReviewRequest;
import com.example.backend.entity.ProductReview;
import com.example.backend.service.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
public class AdminProductReviewController {

    private final ProductReviewService productReviewService;

    @GetMapping("/stats")
    public Result<Map<String, Object>> stats() {
        return Result.success(productReviewService.stats());
    }

    @GetMapping
    public Result<PageResponse<ProductReview>> list(
            @RequestParam(required = false) String productId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.success(productReviewService.list(productId, status, page, size));
    }

    @PutMapping("/{id}/approve")
    public Result<Void> approve(@PathVariable String id) {
        ProductReviewRequest req = new ProductReviewRequest();
        req.setStatus("approved");
        productReviewService.moderate(id, req);
        return Result.success(null, "审核通过");
    }

    @PutMapping("/{id}/reject")
    public Result<Void> reject(@PathVariable String id) {
        ProductReviewRequest req = new ProductReviewRequest();
        req.setStatus("rejected");
        productReviewService.moderate(id, req);
        return Result.success(null, "已拒绝");
    }

    @PutMapping("/{id}/reply")
    public Result<Void> reply(@PathVariable String id, @RequestBody Map<String, String> body) {
        ProductReviewRequest req = new ProductReviewRequest();
        req.setMerchantReply(body.get("merchant_reply"));
        productReviewService.moderate(id, req);
        return Result.success(null, "回复成功");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable String id) {
        productReviewService.delete(id);
        return Result.success(null, "删除成功");
    }
}
