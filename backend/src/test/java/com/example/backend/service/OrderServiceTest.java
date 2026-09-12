package com.example.backend.service;

import com.example.backend.dto.OrderRequest;
import com.example.backend.entity.*;
import com.example.backend.mapper.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderMapper orderMapper;
    @Mock private OrderItemMapper orderItemMapper;
    @Mock private PaymentMapper paymentMapper;
    @Mock private ProductMapper productMapper;

    @InjectMocks
    private OrderService orderService;

    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        sampleOrder = new Order();
        sampleOrder.setId(1L);
        sampleOrder.setOrderNo("ORD12345");
        sampleOrder.setUserId(10L);
        sampleOrder.setTotalAmount(new BigDecimal("99.99"));
        sampleOrder.setCurrency("USD");
        sampleOrder.setStatus(OrderStatus.PENDING);
        sampleOrder.setPaymentStatus("UNPAID");
        sampleOrder.setShippingFee(BigDecimal.ZERO);
        sampleOrder.setTaxAmount(BigDecimal.ZERO);
        sampleOrder.setCreatedAt(Instant.now());
        sampleOrder.setUpdatedAt(Instant.now());
    }

    @Test
    void createOrder_shouldInsertAndReturnSimpleOrder() {
        // Arrange: mock product lookup
        Product product = new Product();
        product.setId(100L);
        product.setName("Test Product");
        product.setPrice(new BigDecimal("50.00"));
        when(productMapper.findByIds(anyList())).thenReturn(List.of(product));
        when(orderMapper.insert(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(1L);
            return 1;
        });
        when(orderItemMapper.insert(any(OrderItem.class))).thenReturn(1);

        // Build request
        OrderRequest req = new OrderRequest();
        OrderRequest.OrderLineItem line = new OrderRequest.OrderLineItem();
        line.setProductId(100L);
        line.setQuantity(1);
        req.setItems(List.of(line));
        req.setCustomerEmail("test@example.com");

        // Act
        SimpleOrder result = orderService.createOrder(req);

        // Assert
        assertNotNull(result);
        assertTrue(result.getTotalAmount().compareTo(BigDecimal.ZERO) > 0);
        assertEquals(SimpleOrderStatus.PENDING, result.getStatus());
        assertTrue(result.getOrderNo().startsWith("ORD"));
        verify(orderMapper).insert(any(Order.class));
        verify(orderItemMapper).insert(any(OrderItem.class));
    }

    @Test
    void createOrder_emptyItems_shouldThrow() {
        OrderRequest req = new OrderRequest();
        req.setItems(List.of());
        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(req));
    }

    @Test
    void createOrder_nullItems_shouldThrow() {
        OrderRequest req = new OrderRequest();
        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(req));
    }

    @Test
    void getById_existingOrder_shouldReturnSimpleOrder() {
        when(orderMapper.findById(1L)).thenReturn(sampleOrder);
        when(orderItemMapper.findByOrderId(1L)).thenReturn(List.of());

        SimpleOrder result = orderService.getById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("ORD12345", result.getOrderNo());
        assertEquals(SimpleOrderStatus.PENDING, result.getStatus());
    }

    @Test
    void getById_nonExisting_shouldReturnNull() {
        when(orderMapper.findById(999L)).thenReturn(null);

        SimpleOrder result = orderService.getById(999L);

        assertNull(result);
    }

    @Test
    void list_shouldReturnPaginatedResults() {
        PageRequest pageable = PageRequest.of(0, 10);
        when(orderMapper.findAllOrderByCreatedAtDesc(0, 10)).thenReturn(List.of(sampleOrder));
        when(orderMapper.countAll()).thenReturn(1L);

        Page<SimpleOrder> result = orderService.list(pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals("ORD12345", result.getContent().get(0).getOrderNo());
    }

    @Test
    void listByStatus_shouldFilterAndPaginate() {
        PageRequest pageable = PageRequest.of(0, 10);
        when(orderMapper.findByStatusOrderByCreatedAtDesc(eq(OrderStatus.PAID), eq(0), eq(10)))
                .thenReturn(List.of(sampleOrder));
        when(orderMapper.countByStatus(OrderStatus.PAID)).thenReturn(1L);

        Page<SimpleOrder> result = orderService.listByStatus(SimpleOrderStatus.PAID, pageable);

        assertEquals(1, result.getTotalElements());
        verify(orderMapper).findByStatusOrderByCreatedAtDesc(eq(OrderStatus.PAID), eq(0), eq(10));
    }

    @Test
    void updateStatus_existingOrder_shouldUpdateAndReturn() {
        when(orderMapper.findById(1L)).thenReturn(sampleOrder);
        when(orderMapper.updateStatus(1L, "PAID")).thenReturn(1);

        SimpleOrder result = orderService.updateStatus(1L, SimpleOrderStatus.PAID);

        assertNotNull(result);
        assertEquals(SimpleOrderStatus.PAID, result.getStatus());
        verify(orderMapper).updateStatus(1L, "PAID");
    }

    @Test
    void updateStatus_nonExisting_shouldReturnNull() {
        when(orderMapper.findById(999L)).thenReturn(null);

        SimpleOrder result = orderService.updateStatus(999L, SimpleOrderStatus.PAID);

        assertNull(result);
        verify(orderMapper, never()).updateStatus(anyLong(), anyString());
    }

    @Test
    void payOrder_shouldMarkPaidAndWritePayment() {
        // Set order to PENDING so payOrder can proceed
        sampleOrder.setStatus(OrderStatus.PENDING);
        sampleOrder.setPaymentStatus("UNPAID");
        when(orderMapper.findById(1L)).thenReturn(sampleOrder);
        when(orderMapper.markPaid(eq(1L), anyString(), anyString())).thenReturn(1);
        // Return updated order for getById inside payOrder
        Order paidOrder = new Order();
        paidOrder.setId(1L);
        paidOrder.setStatus(OrderStatus.PAID);
        paidOrder.setPaymentStatus("PAID");
        paidOrder.setPaymentMethod("CARD");
        paidOrder.setTransactionNo("TXN123");
        when(orderMapper.findById(1L)).thenReturn(sampleOrder).thenReturn(paidOrder);
        when(paymentMapper.insert(any(Payment.class))).thenReturn(1);
        when(orderItemMapper.findByOrderId(1L)).thenReturn(List.of());

        SimpleOrder result = orderService.payOrder(1L, "CARD");

        assertNotNull(result);
        assertEquals(SimpleOrderStatus.PAID, result.getStatus());
        assertEquals("CARD", result.getPaymentMethod());
        verify(paymentMapper).insert(any(Payment.class));
    }

    @Test
    void payOrder_alreadyPaid_shouldThrow() {
        sampleOrder.setStatus(OrderStatus.PAID);
        sampleOrder.setPaymentStatus("PAID");
        when(orderMapper.findById(1L)).thenReturn(sampleOrder);

        assertThrows(IllegalStateException.class, () -> orderService.payOrder(1L, "CARD"));
    }

    @Test
    void cancelOrder_shouldCancelAndRefundIfPaid() {
        sampleOrder.setStatus(OrderStatus.PENDING);
        sampleOrder.setPaymentStatus("PAID");
        sampleOrder.setPaymentMethod("PAYPAL");
        when(orderMapper.findById(1L)).thenReturn(sampleOrder);
        when(orderMapper.updateStatus(1L, "CANCELLED")).thenReturn(1);
        when(paymentMapper.insert(any(Payment.class))).thenReturn(1);

        SimpleOrder result = orderService.cancelOrder(1L);

        assertNotNull(result);
        assertEquals(SimpleOrderStatus.CANCELLED, result.getStatus());
        // Should create a refund payment record
        verify(paymentMapper).insert(argThat(p -> "REFUNDED".equals(p.getStatus())));
    }
}
