package com.example.backend.service;

import com.example.backend.entity.User;
import com.example.backend.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    public Page<User> list(Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        List<User> content = userMapper.findAll(offset, limit);
        // Strip passwordHash from list results
        content.forEach(u -> u.setPasswordHash(null));
        long total = userMapper.countAll();
        return new PageImpl<>(content, pageable, total);
    }

    public User getById(Long id) {
        User user = userMapper.findById(id);
        if (user != null) {
            user.setPasswordHash(null);
        }
        return user;
    }

    public User create(User user) {
        userMapper.insert(user);
        user.setPasswordHash(null);
        return user;
    }

    public User update(Long id, User incoming) {
        User existing = userMapper.findById(id);
        if (existing == null) {
            return null;
        }
        incoming.setId(id);
        // Preserve passwordHash if not provided
        if (incoming.getPasswordHash() == null || incoming.getPasswordHash().isBlank()) {
            incoming.setPasswordHash(existing.getPasswordHash());
        }
        userMapper.update(incoming);
        User updated = userMapper.findById(id);
        if (updated != null) {
            updated.setPasswordHash(null);
        }
        return updated;
    }

    public boolean delete(Long id) {
        return userMapper.deleteById(id) > 0;
    }
}
