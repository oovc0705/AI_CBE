package com.example.backend.dto;

import lombok.Data;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.util.List;

@Data
public class SearchResponse {
    private List<ProductSearchDto> content;
    private long totalElements;
    private int totalPages;
    private int number;
    private Facets facets;

    @Data
    public static class Facets {
        private List<FacetItem> categories;
        private List<PriceRange> priceRanges;
    }

    @Data
    public static class FacetItem {
        private String name;
        private long count;

        public FacetItem(String name, long count) {
            this.name = name;
            this.count = count;
        }
    }

    @Data
    public static class PriceRange {
        private BigDecimal min;
        private BigDecimal max;
        private long count;

        public PriceRange(BigDecimal min, BigDecimal max, long count) {
            this.min = min;
            this.max = max;
            this.count = count;
        }
    }

    public static SearchResponse from(Page<ProductSearchDto> page, Facets facets) {
        SearchResponse resp = new SearchResponse();
        resp.setContent(page.getContent());
        resp.setTotalElements(page.getTotalElements());
        resp.setTotalPages(page.getTotalPages());
        resp.setNumber(page.getNumber());
        resp.setFacets(facets);
        return resp;
    }
}
