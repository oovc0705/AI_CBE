package com.example.backend.service;

import com.example.backend.dto.ProductDetailDto;
import com.example.backend.dto.ProductSearchDto;
import com.example.backend.dto.ProductSitemapDto;
import com.example.backend.dto.ProductTranslationRequest;
import com.example.backend.dto.ProductVariantRequest;
import com.example.backend.dto.SearchResponse;
import com.example.backend.entity.Brand;
import com.example.backend.entity.Category;
import com.example.backend.entity.Product;
import com.example.backend.entity.ProductSku;
import com.example.backend.entity.ProductStatus;
import com.example.backend.mapper.BrandMapper;
import com.example.backend.mapper.CategoryMapper;
import com.example.backend.mapper.ProductMapper;
import com.example.backend.mapper.ProductSkuMapper;
import com.example.backend.util.SlugUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final ProductMapper productMapper;
    private final ProductSkuMapper productSkuMapper;
    private final BrandMapper brandMapper;
    private final CategoryMapper categoryMapper;

    private final Map<String, CachedResult> searchCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 5 * 60 * 1000L;

    @Transactional
    public Product create(Product product) {
        populateDefaults(product);
        if (product.getBrand() != null) {
            product.setBrandId(resolveBrandId(product.getBrand()));
        }
        if (product.getCategory() != null) {
            product.setCategoryId(resolveCategoryId(product.getCategory()));
        }
        product.setTitleI18n(buildTitleI18n(product, null, product.getName()));
        product.setDescI18n(buildDescI18n(product, null, product.getDescription()));
        product.setMetaSeo(product.getMetaSeo() != null ? product.getMetaSeo() : OBJECT_MAPPER.createObjectNode());
        product.setImages(buildImages(product));
        if (product.getImages() == null) {
            product.setImages(OBJECT_MAPPER.createArrayNode());
        }
        productMapper.insert(product);
        saveSkus(product, product.getId());
        product.setVariants(null);
        product.setTranslations(null);
        product.setSku(null);
        return product;
    }

    @Transactional
    public Product update(Long id, Product product) {
        Product existing = productMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("Product not found");
        }
        if (product.getName() != null) {
            existing.setName(product.getName());
        }
        if (product.getDescription() != null) {
            existing.setDescription(product.getDescription());
        }
        if (product.getPrice() != null) {
            existing.setPrice(product.getPrice());
        }
        if (product.getImageUrl() != null) {
            existing.setImageUrl(product.getImageUrl());
        }
        if (product.getCategory() != null) {
            existing.setCategory(product.getCategory());
            existing.setCategoryId(resolveCategoryId(product.getCategory()));
        }
        if (product.getBrand() != null) {
            existing.setBrand(product.getBrand());
            existing.setBrandId(resolveBrandId(product.getBrand()));
        }
        if (product.getSlug() != null) {
            existing.setSlug(product.getSlug());
        }
        if (product.getStatus() != null) {
            existing.setStatus(product.getStatus());
        }
        String name = product.getName() != null ? product.getName() : existing.getName();
        String description = product.getDescription() != null ? product.getDescription() : existing.getDescription();
        existing.setTitleI18n(buildTitleI18n(product, existing.getTitleI18n(), name));
        existing.setDescI18n(buildDescI18n(product, existing.getDescI18n(), description));
        if (product.getImageUrl() != null || product.getImages() != null) {
            JsonNode images = buildImages(product);
            existing.setImages(images != null ? images : OBJECT_MAPPER.createArrayNode());
        }
        productMapper.update(existing);
        saveSkus(product, id);
        return existing;
    }

    public Product getById(Long id) {
        Product product = productMapper.findById(id);
        if (product == null) {
            throw new RuntimeException("Product not found");
        }
        List<ProductSku> skus = productSkuMapper.findByProductId(id);
        product.setSkus(skus);
        return product;
    }

    public ProductDetailDto getDetailById(Long id) {
        Product product = getById(id);
        List<ProductSku> skus = productSkuMapper.findByProductId(id);
        return ProductDetailDto.from(product, skus);
    }

    public Page<Product> list(String keyword, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();

        if (keyword != null && !keyword.isEmpty()) {
            List<Product> content = productMapper.findByNameKeyword(keyword, offset, limit);
            long total = productMapper.countByNameKeyword(keyword);
            return new PageImpl<>(content, pageable, total);
        }
        List<Product> content = productMapper.findAll(offset, limit);
        long total = productMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    public List<ProductSitemapDto> getSitemapData() {
        return productMapper.findAllSitemapData();
    }

    public List<Map<String, Object>> getAllBrands() {
        return productMapper.findAllBrands();
    }

    public List<String> getAllCategories() {
        return productMapper.findAllCategories();
    }

    @Transactional
    public Product updatePrice(Long id, BigDecimal price) {
        Product product = productMapper.findById(id);
        if (product == null) {
            throw new RuntimeException("Product not found");
        }
        product.setPrice(price);
        productMapper.update(product);
        return product;
    }

    @Transactional
    public Product setStatus(Long id, ProductStatus status) {
        Product product = productMapper.findById(id);
        if (product == null) {
            throw new RuntimeException("Product not found");
        }
        product.setStatus(status);
        productMapper.update(product);
        return product;
    }

    @Transactional
    public void delete(Long id) {
        Product product = productMapper.findById(id);
        if (product == null) {
            throw new RuntimeException("Product not found");
        }
        productSkuMapper.deleteByProductId(id);
        productMapper.deleteById(id);
    }

    @Transactional
    public int deleteByIds(List<Long> ids) {
        int count = 0;
        for (Long id : ids) {
            productSkuMapper.deleteByProductId(id);
            count += productMapper.deleteById(id);
        }
        return count;
    }

    @Transactional
    public Product restock(Long id, int quantity) {
        Product product = productMapper.findById(id);
        if (product == null) {
            throw new RuntimeException("Product not found");
        }
        List<ProductSku> skus = productSkuMapper.findByProductId(id);
        if (skus.isEmpty()) {
            throw new RuntimeException("Product has no SKU");
        }
        // 默认给第一个 SKU 补货
        // 使用 updateStock() 只 SET stock 列，避免整行 update 触发 attributes JSONB
        // 字段被覆盖成"被反序列化修改过的 JsonNode"等边界问题
        ProductSku sku = skus.get(0);
        int newStock = (sku.getStock() != null ? sku.getStock() : 0) + quantity;
        int affected = productSkuMapper.updateStock(sku.getId(), newStock);
        if (affected == 0) {
            throw new RuntimeException("Failed to update SKU stock");
        }
        // 刷新内存中的 sku 状态
        sku.setStock(newStock);
        return product;
    }

    @Transactional
    public List<Product> batchUpdatePrices(List<Map<String, Object>> items) {
        return items.stream().map(item -> {
            Long id = Long.valueOf(String.valueOf(item.get("product_id")));
            BigDecimal price = new BigDecimal(String.valueOf(item.get("new_price")));
            return updatePrice(id, price);
        }).toList();
    }

    @Transactional
    public List<Product> batchSetStatus(List<Long> ids, ProductStatus status) {
        return ids.stream().map(id -> setStatus(id, status)).toList();
    }

    @Transactional
    public List<Product> batchRestock(List<Map<String, Object>> items) {
        return items.stream().map(item -> {
            Long id = Long.valueOf(String.valueOf(item.get("product_id")));
            int quantity = Integer.parseInt(String.valueOf(item.get("quantity")));
            return restock(id, quantity);
        }).toList();
    }

    public SearchResponse search(String q, String category, BigDecimal minPrice,
                                 BigDecimal maxPrice, String brands, String sort, Pageable pageable) {
        List<String> brandList = (brands == null || brands.isBlank()) ? null : Arrays.asList(brands.split(","));
        String cacheKey = buildCacheKey(q, category, minPrice, maxPrice, brandList, sort, pageable);

        CachedResult cached = searchCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            return cached.response;
        }

        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<Product> products = productMapper.fullTextSearch(q, category, minPrice, maxPrice, brandList, sort, offset, limit);
        long total = productMapper.countFullTextSearch(q, category, minPrice, maxPrice, brandList);
        List<ProductSearchDto> dtoList = products.stream()
                .map(ProductSearchDto::from)
                .toList();
        Page<ProductSearchDto> page = new PageImpl<>(dtoList, pageable, total);

        SearchResponse.Facets facets = buildFacets(q, category, minPrice, maxPrice, brandList);

        SearchResponse response = SearchResponse.from(page, facets);

        searchCache.put(cacheKey, new CachedResult(response, System.currentTimeMillis() + CACHE_TTL_MS));

        if (searchCache.size() > 500) {
            searchCache.entrySet().removeIf(e -> e.getValue().isExpired());
        }

        return response;
    }

    private void populateDefaults(Product product) {
        if (product.getStatus() == null) {
            product.setStatus(ProductStatus.ACTIVE);
        }
        if (product.getSlug() == null || product.getSlug().isBlank()) {
            String baseSlug = SlugUtils.slugify(product.getName());
            if (productMapper.findBySlug(baseSlug) != null) {
                baseSlug = baseSlug + "-" + System.currentTimeMillis();
            }
            product.setSlug(baseSlug);
        }
    }

    private Long resolveBrandId(String brandName) {
        if (brandName == null || brandName.isBlank()) {
            return null;
        }
        String slug = SlugUtils.slugify(brandName);
        Brand brand = brandMapper.findBySlug(slug);
        if (brand != null) {
            return brand.getId();
        }
        Brand newBrand = new Brand();
        newBrand.setName(brandName);
        newBrand.setSlug(slug);
        brandMapper.insert(newBrand);
        return newBrand.getId();
    }

    private Long resolveCategoryId(String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            return null;
        }
        String slug = SlugUtils.slugify(categoryName);
        Category category = categoryMapper.findBySlug(slug);
        if (category != null) {
            return category.getId();
        }
        Category newCategory = new Category();
        newCategory.setSlug(slug);
        ObjectNode i18n = OBJECT_MAPPER.createObjectNode();
        i18n.put("en", categoryName);
        newCategory.setNameI18n(i18n);
        categoryMapper.insert(newCategory);
        return newCategory.getId();
    }

    private JsonNode buildTitleI18n(Product product, JsonNode existing, String defaultName) {
        return mergeI18n(existing, defaultName, product.getTranslations(), true);
    }

    private JsonNode buildDescI18n(Product product, JsonNode existing, String defaultDescription) {
        return mergeI18n(existing, defaultDescription, product.getTranslations(), false);
    }

    private JsonNode mergeI18n(JsonNode existing, String defaultValue,
                               List<ProductTranslationRequest> translations, boolean isName) {
        ObjectNode node;
        if (existing instanceof ObjectNode) {
            node = (ObjectNode) existing.deepCopy();
        } else {
            node = OBJECT_MAPPER.createObjectNode();
        }
        if (defaultValue != null) {
            node.put("en", defaultValue);
        }
        if (translations != null) {
            for (ProductTranslationRequest t : translations) {
                String value = isName ? t.getName() : t.getDescription();
                if (value != null) {
                    node.put(t.getLocale(), value);
                }
            }
        }
        return node;
    }

    private JsonNode buildImages(Product product) {
        if (product.getImages() != null) {
            return product.getImages();
        }
        if (product.getImageUrl() != null && !product.getImageUrl().isBlank()) {
            return OBJECT_MAPPER.valueToTree(List.of(product.getImageUrl()));
        }
        return null;
    }

    private void saveSkus(Product product, Long productId) {
        productSkuMapper.deleteByProductId(productId);
        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            for (ProductVariantRequest variant : product.getVariants()) {
                if (Boolean.FALSE.equals(variant.getEnabled())) {
                    continue;
                }
                ProductSku sku = new ProductSku();
                sku.setProductId(productId);
                sku.setSkuCode(variant.getSku());
                sku.setAttributes(OBJECT_MAPPER.valueToTree(variant.getAttributes() != null ? variant.getAttributes() : Map.of()));
                sku.setPrice(variant.getPrice() != null ? variant.getPrice() : product.getPrice());
                sku.setStock(variant.getStock() != null ? variant.getStock() : 0);
                productSkuMapper.insert(sku);
            }
        } else if (product.getSku() != null && !product.getSku().isBlank()) {
            ProductSku sku = new ProductSku();
            sku.setProductId(productId);
            sku.setSkuCode(product.getSku());
            sku.setAttributes(OBJECT_MAPPER.valueToTree(Map.of()));
            sku.setPrice(product.getPrice());
            sku.setStock(product.getStock() != null ? product.getStock() : 0);
            productSkuMapper.insert(sku);
        }
    }

    private SearchResponse.Facets buildFacets(String q, String category,
                                              BigDecimal minPrice, BigDecimal maxPrice,
                                              List<String> brands) {
        SearchResponse.Facets facets = new SearchResponse.Facets();

        List<Map<String, Object>> catRows = productMapper.categoryFacets(q, minPrice, maxPrice, brands);
        facets.setCategories(catRows.stream()
                .map(row -> new SearchResponse.FacetItem(
                        (String) row.get("name"),
                        ((Number) row.get("count")).longValue()))
                .toList());

        List<Map<String, Object>> priceRows = productMapper.priceRangeFacets(q, category, brands);
        facets.setPriceRanges(priceRows.stream()
                .map(row -> {
                    String range = (String) row.get("name");
                    long count = ((Number) row.get("count")).longValue();
                    return parsePriceRange(range, count);
                })
                .toList());

        return facets;
    }

    private SearchResponse.PriceRange parsePriceRange(String range, long count) {
        if (range.endsWith("+")) {
            BigDecimal min = new BigDecimal(range.replace("+", ""));
            return new SearchResponse.PriceRange(min, null, count);
        }
        String[] parts = range.split("-");
        return new SearchResponse.PriceRange(
                new BigDecimal(parts[0]), new BigDecimal(parts[1]), count);
    }

    private String buildCacheKey(String q, String category, BigDecimal minPrice,
                                 BigDecimal maxPrice, List<String> brands, String sort, Pageable pageable) {
        return String.join("|",
                q == null ? "" : q,
                category == null ? "" : category,
                minPrice == null ? "" : minPrice.toPlainString(),
                maxPrice == null ? "" : maxPrice.toPlainString(),
                brands == null ? "" : String.join(",", brands),
                sort == null ? "relevance" : sort,
                String.valueOf(pageable.getPageNumber()),
                String.valueOf(pageable.getPageSize()));
    }

    private record CachedResult(SearchResponse response, long expiresAt) {
        boolean isExpired() {
            return System.currentTimeMillis() > expiresAt;
        }
    }
}
