package com.example.backend.service;

import com.example.backend.entity.Brand;
import com.example.backend.mapper.BrandMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandMapper brandMapper;

    public Page<Brand> list(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<Brand> content = brandMapper.findAll(offset, limit);
        long total = brandMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    public Brand getById(Long id) {
        return brandMapper.findById(id);
    }

    public Brand create(Brand brand) {
        brandMapper.insert(brand);
        return brand;
    }

    public Brand update(Long id, Brand incoming) {
        Brand existing = brandMapper.findById(id);
        if (existing == null) {
            return null;
        }
        if (incoming.getName() != null) {
            existing.setName(incoming.getName());
        }
        if (incoming.getSlug() != null) {
            existing.setSlug(incoming.getSlug());
        }
        if (incoming.getLogoUrl() != null) {
            existing.setLogoUrl(incoming.getLogoUrl());
        }
        brandMapper.update(existing);
        return brandMapper.findById(id);
    }

    public boolean delete(Long id) {
        return brandMapper.deleteById(id) > 0;
    }
}
