package com.example.backend.service;

import com.example.backend.dto.ProductSitemapDto;
import com.example.backend.entity.Brand;
import com.example.backend.entity.Category;
import com.example.backend.entity.Product;
import com.example.backend.mapper.BrandMapper;
import com.example.backend.mapper.CategoryMapper;
import com.example.backend.mapper.ProductMapper;
import com.example.backend.mapper.ProductSkuMapper;
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
class ProductServiceTest {

    @Mock
    private ProductMapper productMapper;

    @Mock
    private ProductSkuMapper productSkuMapper;

    @Mock
    private BrandMapper brandMapper;

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private ProductService productService;

    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleProduct = new Product();
        sampleProduct.setId(1L);
        sampleProduct.setName("Test Product");
        sampleProduct.setDescription("A great product");
        sampleProduct.setPrice(new BigDecimal("29.99"));
        sampleProduct.setImageUrl("https://example.com/img.jpg");
        sampleProduct.setCategory("Electronics");
        sampleProduct.setCreatedAt(Instant.now());
        sampleProduct.setUpdatedAt(Instant.now());
    }

    @Test
    void create_shouldInsertAndReturnProduct() {
        when(productMapper.findBySlug("test-product")).thenReturn(null);
        when(productMapper.insert(any(Product.class))).thenReturn(1);

        Product result = productService.create(sampleProduct);

        assertEquals("Test Product", result.getName());
        verify(productMapper).insert(sampleProduct);
    }

    @Test
    void update_existingProduct_shouldUpdateAndReturn() {
        when(productMapper.findById(1L)).thenReturn(sampleProduct);
        when(productMapper.update(any(Product.class))).thenReturn(1);
        when(categoryMapper.findBySlug("home")).thenReturn(null);
        doAnswer(invocation -> {
            Category category = invocation.getArgument(0);
            category.setId(5L);
            return 1;
        }).when(categoryMapper).insert(any(Category.class));
        when(productSkuMapper.deleteByProductId(1L)).thenReturn(0);

        Product updated = new Product();
        updated.setName("Updated Name");
        updated.setDescription("Updated desc");
        updated.setPrice(new BigDecimal("39.99"));
        updated.setImageUrl("https://example.com/new.jpg");
        updated.setCategory("Home");

        Product result = productService.update(1L, updated);

        assertEquals("Updated Name", result.getName());
        assertEquals(new BigDecimal("39.99"), result.getPrice());
        verify(productMapper).update(any(Product.class));
    }

    @Test
    void update_nonExisting_shouldThrow() {
        when(productMapper.findById(999L)).thenReturn(null);

        assertThrows(RuntimeException.class, () ->
                productService.update(999L, new Product()));
    }

    @Test
    void getById_existing_shouldReturnProduct() {
        when(productMapper.findById(1L)).thenReturn(sampleProduct);
        when(productSkuMapper.findByProductId(1L)).thenReturn(List.of());

        Product result = productService.getById(1L);

        assertEquals(1L, result.getId());
        assertEquals("Test Product", result.getName());
    }

    @Test
    void getById_nonExisting_shouldThrow() {
        when(productMapper.findById(999L)).thenReturn(null);

        assertThrows(RuntimeException.class, () ->
                productService.getById(999L));
    }

    @Test
    void list_withoutKeyword_shouldReturnAllPaginated() {
        PageRequest pageable = PageRequest.of(0, 10);
        when(productMapper.findAll(0, 10)).thenReturn(List.of(sampleProduct));
        when(productMapper.countAll()).thenReturn(1L);

        Page<Product> result = productService.list(null, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("Test Product", result.getContent().get(0).getName());
    }

    @Test
    void list_withKeyword_shouldFilterAndPaginate() {
        PageRequest pageable = PageRequest.of(0, 10);
        when(productMapper.findByNameKeyword("Test", 0, 10)).thenReturn(List.of(sampleProduct));
        when(productMapper.countByNameKeyword("Test")).thenReturn(1L);

        Page<Product> result = productService.list("Test", pageable);

        assertEquals(1, result.getTotalElements());
        verify(productMapper).findByNameKeyword("Test", 0, 10);
    }

    @Test
    void getSitemapData_shouldReturnDtoList() {
        ProductSitemapDto dto = new ProductSitemapDto(1L, Instant.now());
        when(productMapper.findAllSitemapData()).thenReturn(List.of(dto));

        List<ProductSitemapDto> result = productService.getSitemapData();

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }
}
