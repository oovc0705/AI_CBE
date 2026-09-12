package com.example.backend.service;

import com.example.backend.dto.OrderRequest;
import com.example.backend.entity.*;
import com.example.backend.mapper.OrderItemMapper;
import com.example.backend.mapper.OrderMapper;
import com.example.backend.mapper.PaymentMapper;
import com.example.backend.mapper.ProductMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final PaymentMapper paymentMapper;
    private final ProductMapper productMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** 免运费门槛与基础运费（与前端一致） */
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("99.00");
    private static final BigDecimal BASE_SHIPPING_FEE = new BigDecimal("9.99");
    /** 跨境预估关税/税费（演示用固定 0） */
    private static final BigDecimal TAX_RATE = BigDecimal.ZERO;

    /**
     * 创建订单（含明细、运费、税费、商品快照）
     */
    @Transactional
    public SimpleOrder createOrder(OrderRequest request) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("购物车为空");
        }

        // 1) 拉取商品并校验
        List<Long> productIds = request.getItems().stream()
                .map(OrderRequest.OrderLineItem::getProductId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (productIds.isEmpty()) {
            throw new IllegalArgumentException("购物车商品无效");
        }

        Map<Long, Product> productMap = productMapper.findByIds(productIds).stream()
                .collect(java.util.stream.Collectors.toMap(Product::getId, p -> p));
        if (productMap.isEmpty()) {
            throw new IllegalArgumentException("商品不存在");
        }

        // 2) 计算金额 + 构建明细
        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        for (OrderRequest.OrderLineItem line : request.getItems()) {
            Product product = productMap.get(line.getProductId());
            if (product == null) continue;
            int qty = line.getQuantity() == null || line.getQuantity() <= 0 ? 1 : line.getQuantity();
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(qty));
            subtotal = subtotal.add(lineTotal);

            OrderItem item = new OrderItem();
            item.setSkuId(null); // 当前 storefront 仅按 productId 下单
            item.setPrice(product.getPrice());
            item.setQuantity(qty);
            item.setProductSnapshot(buildProductSnapshot(product));
            items.add(item);
        }

        if (subtotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("订单金额无效");
        }

        BigDecimal shippingFee = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0
                ? BigDecimal.ZERO : BASE_SHIPPING_FEE;
        BigDecimal taxAmount = subtotal.multiply(TAX_RATE).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(shippingFee).add(taxAmount);

        // 3) 写入订单主表
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setTotalAmount(totalAmount);
        order.setCurrency("USD");
        order.setStatus(OrderStatus.PENDING);
        order.setShippingAddress(toJsonNode(request.getShippingAddress()));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setPaymentStatus("UNPAID");
        order.setCustomerEmail(request.getCustomerEmail());
        order.setCustomerNote(request.getCustomerNote() == null ? "" : request.getCustomerNote());
        order.setShippingFee(shippingFee);
        order.setTaxAmount(taxAmount);
        orderMapper.insert(order);

        // 4) 写入订单明细
        for (OrderItem item : items) {
            item.setOrderId(order.getId());
            orderItemMapper.insert(item);
        }
        order.setItems(items);

        SimpleOrder simple = toSimpleOrder(order);
        simple.setItems(items);
        return simple;
    }

    /**
     * 支付订单（模拟网关）
     * 不对接真实支付，直接：写支付流水 + 标记订单 PAID
     */
    @Transactional
    public SimpleOrder payOrder(Long id, String paymentMethod) {
        Order order = orderMapper.findById(id);
        if (order == null) {
            throw new IllegalArgumentException("订单不存在");
        }
        if (order.getStatus() == OrderStatus.PAID
                || order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalStateException("订单已支付");
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("订单已取消，无法支付");
        }

        String method = normalizePaymentMethod(paymentMethod);

        // 1) 生成交易号 & 写流水（SUCCESS）
        String transactionNo = generateTransactionNo(method);
        Payment payment = new Payment();
        payment.setOrderId(id);
        payment.setPaymentMethod(method);
        payment.setAmount(order.getTotalAmount());
        payment.setCurrency(order.getCurrency() == null ? "USD" : order.getCurrency());
        payment.setTransactionNo(transactionNo);
        payment.setStatus("SUCCESS");
        payment.setProviderMessage("Simulated cross-border payment success");
        paymentMapper.insert(payment);

        // 2) 标记订单为 PAID
        orderMapper.markPaid(id, method, transactionNo);

        Order updated = orderMapper.findById(id);
        updated.setItems(orderItemMapper.findByOrderId(id));
        return toSimpleOrder(updated);
    }

    public SimpleOrder getById(Long id) {
        Order order = orderMapper.findById(id);
        if (order == null) return null;
        order.setItems(orderItemMapper.findByOrderId(id));
        return toSimpleOrder(order);
    }

    public Page<SimpleOrder> list(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<Order> orders = orderMapper.findAllOrderByCreatedAtDesc(offset, limit);
        long total = orderMapper.countAll();
        List<SimpleOrder> content = orders.stream().map(this::toSimpleOrder).toList();
        return new PageImpl<>(content, pageable, total);
    }

    public Page<SimpleOrder> listByStatus(SimpleOrderStatus status, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        OrderStatus orderStatus = OrderStatus.valueOf(status.name());
        List<Order> orders = orderMapper.findByStatusOrderByCreatedAtDesc(orderStatus, offset, limit);
        long total = orderMapper.countByStatus(orderStatus);
        List<SimpleOrder> content = orders.stream().map(this::toSimpleOrder).toList();
        return new PageImpl<>(content, pageable, total);
    }

    @Transactional
    public SimpleOrder updateStatus(Long id, SimpleOrderStatus status) {
        Order order = orderMapper.findById(id);
        if (order == null) return null;
        orderMapper.updateStatus(id, status.name());
        order.setStatus(OrderStatus.valueOf(status.name()));
        return toSimpleOrder(order);
    }

    @Transactional
    public SimpleOrder shipOrder(Long id) {
        Order order = orderMapper.findById(id);
        if (order == null) throw new IllegalArgumentException("订单不存在");
        if (order.getStatus() != OrderStatus.PAID) {
            throw new IllegalStateException("仅已支付订单可发货");
        }
        orderMapper.updateStatus(id, OrderStatus.SHIPPED.name());
        order.setStatus(OrderStatus.SHIPPED);
        return toSimpleOrder(order);
    }

    @Transactional
    public SimpleOrder completeOrder(Long id) {
        Order order = orderMapper.findById(id);
        if (order == null) throw new IllegalArgumentException("订单不存在");
        if (order.getStatus() != OrderStatus.SHIPPED) {
            throw new IllegalStateException("仅已发货订单可完成");
        }
        orderMapper.updateStatus(id, OrderStatus.COMPLETED.name());
        order.setStatus(OrderStatus.COMPLETED);
        return toSimpleOrder(order);
    }

    @Transactional
    public SimpleOrder cancelOrder(Long id) {
        Order order = orderMapper.findById(id);
        if (order == null) throw new IllegalArgumentException("订单不存在");
        if (order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.COMPLETED) {
            throw new IllegalStateException("已发货/已完成订单不可取消");
        }
        orderMapper.updateStatus(id, OrderStatus.CANCELLED.name());
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            // 已支付订单取消 → 支付状态置为退款
            Payment p = new Payment();
            p.setOrderId(id);
            p.setPaymentMethod(order.getPaymentMethod() == null ? "CARD" : order.getPaymentMethod());
            p.setAmount(order.getTotalAmount());
            p.setCurrency(order.getCurrency() == null ? "USD" : order.getCurrency());
            p.setTransactionNo(generateTransactionNo(p.getPaymentMethod()));
            p.setStatus("REFUNDED");
            p.setProviderMessage("Order cancelled - refund issued");
            paymentMapper.insert(p);
        }
        order.setStatus(OrderStatus.CANCELLED);
        return toSimpleOrder(order);
    }

    @Transactional
    public SimpleOrder refundOrder(Long id, java.math.BigDecimal amount, String reason) {
        Order order = orderMapper.findById(id);
        if (order == null) throw new IllegalArgumentException("订单不存在");
        if (!"PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            throw new IllegalStateException("仅已支付订单可退款");
        }
        java.math.BigDecimal refundAmount = amount != null ? amount : order.getTotalAmount();
        if (refundAmount.compareTo(order.getTotalAmount()) > 0) {
            throw new IllegalArgumentException("退款金额不能超过订单金额");
        }

        Payment p = new Payment();
        p.setOrderId(id);
        p.setPaymentMethod(order.getPaymentMethod() == null ? "CARD" : order.getPaymentMethod());
        p.setAmount(refundAmount);
        p.setCurrency(order.getCurrency() == null ? "USD" : order.getCurrency());
        p.setTransactionNo(generateTransactionNo(p.getPaymentMethod()));
        p.setStatus("REFUNDED");
        p.setProviderMessage("Refund: " + (reason == null ? "" : reason));
        paymentMapper.insert(p);

        // 全额退款则标记订单为已退款
        if (refundAmount.compareTo(order.getTotalAmount()) >= 0) {
            orderMapper.updateStatus(id, OrderStatus.CANCELLED.name());
            order.setStatus(OrderStatus.CANCELLED);
        }
        order.setPaymentStatus("REFUNDED");
        return toSimpleOrder(order);
    }

    /** 列出订单支付流水 */
    public List<Payment> listPayments(Long orderId) {
        return paymentMapper.findByOrderId(orderId);
    }

    // ============================================================
    // helpers
    // ============================================================

    private String normalizePaymentMethod(String method) {
        if (method == null) return "CARD";
        String upper = method.trim().toUpperCase();
        return switch (upper) {
            case "PAYPAL", "WECHAT", "ALIPAY", "STRIPE", "CARD" -> upper;
            default -> "CARD";
        };
    }

    private JsonNode buildProductSnapshot(Product p) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("productId", p.getId());
        node.put("name", p.getName() == null ? "" : p.getName());
        node.put("slug", p.getSlug() == null ? "" : p.getSlug());
        if (p.getPrice() != null) node.put("price", p.getPrice().doubleValue());
        node.put("imageUrl", p.getImageUrl() == null ? "" : p.getImageUrl());
        node.put("category", p.getCategory() == null ? "" : p.getCategory());
        if (p.getBrand() != null) node.put("brand", p.getBrand());
        return node;
    }

    private JsonNode toJsonNode(Object value) {
        if (value == null) return objectMapper.createObjectNode();
        try {
            return objectMapper.valueToTree(value);
        } catch (Exception e) {
            log.warn("Failed to serialize shipping address", e);
            return objectMapper.createObjectNode();
        }
    }

    private SimpleOrder toSimpleOrder(Order order) {
        SimpleOrder so = new SimpleOrder();
        so.setId(order.getId());
        so.setOrderNo(order.getOrderNo());
        so.setUserId(order.getUserId());
        so.setTotalAmount(order.getTotalAmount());
        so.setCurrency(order.getCurrency());
        so.setStatus(SimpleOrderStatus.valueOf(order.getStatus().name()));
        so.setShippingAddress(order.getShippingAddress());
        so.setCouponId(order.getCouponId());
        so.setDiscountAmount(order.getDiscountAmount());
        so.setStripeSessionId(order.getStripeSessionId());
        so.setPaymentMethod(order.getPaymentMethod());
        so.setPaymentStatus(order.getPaymentStatus());
        so.setTransactionNo(order.getTransactionNo());
        so.setPaidAt(order.getPaidAt());
        so.setCustomerEmail(order.getCustomerEmail());
        so.setCustomerNote(order.getCustomerNote());
        so.setShippingFee(order.getShippingFee());
        so.setTaxAmount(order.getTaxAmount());
        so.setCreatedAt(order.getCreatedAt());
        so.setUpdatedAt(order.getUpdatedAt());
        if (order.getItems() != null) so.setItems(order.getItems());
        return so;
    }

    private String generateOrderNo() {
        return "ORD" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private String generateTransactionNo(String method) {
        String prefix = switch (method) {
            case "PAYPAL" -> "PPL";
            case "WECHAT" -> "WX";
            case "ALIPAY" -> "ALI";
            case "STRIPE" -> "STP";
            default -> "TXN";
        };
        return prefix + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
