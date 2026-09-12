package com.example.backend.service;

import com.example.backend.entity.Category;
import com.example.backend.mapper.CategoryMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final CategoryMapper categoryMapper;

    public Page<Category> list(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<Category> content = categoryMapper.findAll(offset, limit);
        long total = categoryMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    public Category getById(Long id) {
        return categoryMapper.findById(id);
    }

    public Category create(Category category) {
        if (category.getNameI18n() == null) {
            ObjectNode i18n = OBJECT_MAPPER.createObjectNode();
            i18n.put("en", category.getName() == null ? "" : category.getName());
            category.setNameI18n(i18n);
        }
        categoryMapper.insert(category);
        return category;
    }

    public Category update(Long id, Category incoming) {
        Category existing = categoryMapper.findById(id);
        if (existing == null) {
            return null;
        }
        if (incoming.getNameI18n() == null && incoming.getName() != null) {
            ObjectNode i18n = existing.getNameI18n() instanceof ObjectNode
                    ? (ObjectNode) existing.getNameI18n()
                    : OBJECT_MAPPER.createObjectNode();
            i18n.put("en", incoming.getName());
            incoming.setNameI18n(i18n);
        }
        if (incoming.getNameI18n() == null) {
            incoming.setNameI18n(existing.getNameI18n());
        }
        if (incoming.getSlug() == null) {
            incoming.setSlug(existing.getSlug());
        }
        if (incoming.getParentId() == null) {
            incoming.setParentId(existing.getParentId());
        }
        incoming.setId(id);
        categoryMapper.update(incoming);
        return categoryMapper.findById(id);
    }

    public boolean delete(Long id) {
        return categoryMapper.deleteById(id) > 0;
    }
}
