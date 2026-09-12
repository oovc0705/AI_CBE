package com.example.backend.controller;

import com.example.backend.common.Result;
import com.example.backend.entity.Product;
import com.example.backend.mapper.ProductMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 购物车计算控制器（无持久化，纯计算接口）
 */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final ProductMapper productMapper;

    @PostMapping("/calculate")
    public Result<CartCalculateResponse> calculate(@RequestBody CartCalculateRequest request) {
        List<Long> productIds = request.getItems().stream()
                .map(CartItemRequest::getProductId)
                .collect(Collectors.toList());

        Map<Long, Product> productMap = productMapper.findByIds(productIds)
                .stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItemRequest item : request.getItems()) {
            Product product = productMap.get(item.getProductId());
            if (product != null) {
                totalAmount = totalAmount.add(product.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }

        CartCalculateResponse response = new CartCalculateResponse();
        response.setTotalAmount(totalAmount);
        return Result.success(response);
    }

    @Data
    public static class CartCalculateRequest {
        private List<CartItemRequest> items;
    }

    @Data
    public static class CartItemRequest {
        private Long productId;
        private Integer quantity;
    }

    @Data
    public static class CartCalculateResponse {
        private BigDecimal totalAmount;
    }
}
