package com.example.backend.service;

import com.example.backend.entity.Subscriber;
import com.example.backend.mapper.SubscriberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SubscriberService {

    private final SubscriberMapper subscriberMapper;

    @Transactional
    public SubscribeResult subscribe(String email) {
        Subscriber existing = subscriberMapper.findByEmail(email);
        if (existing != null) {
            return new SubscribeResult(existing, false);
        }
        Subscriber subscriber = new Subscriber();
        subscriber.setEmail(email);
        subscriber.setSource("website");
        subscriber.setActive(true);
        subscriber.setSubscribedAt(Instant.now());
        subscriberMapper.insert(subscriber);
        return new SubscribeResult(subscriber, true);
    }

    public long getCount() {
        return subscriberMapper.count();
    }

    public Page<Subscriber> list(Boolean active, Pageable pageable) {
        int offset = (int) pageable.getOffset();
        int limit = pageable.getPageSize();
        if (active != null) {
            return new PageImpl<>(
                    subscriberMapper.findByActive(active, offset, limit),
                    pageable,
                    subscriberMapper.countByActive(active)
            );
        }
        return new PageImpl<>(
                subscriberMapper.findAll(offset, limit),
                pageable,
                subscriberMapper.count()
        );
    }

    public Subscriber getById(Long id) {
        return subscriberMapper.findById(id);
    }

    @Transactional
    public Subscriber update(Long id, Subscriber subscriber) {
        Subscriber existing = subscriberMapper.findById(id);
        if (existing == null) return null;
        if (subscriber.getEmail() != null) existing.setEmail(subscriber.getEmail());
        if (subscriber.getSource() != null) existing.setSource(subscriber.getSource());
        if (subscriber.getActive() != null) existing.setActive(subscriber.getActive());
        subscriberMapper.update(existing);
        return existing;
    }

    @Transactional
    public boolean toggleActive(Long id) {
        Subscriber existing = subscriberMapper.findById(id);
        if (existing == null) return false;
        subscriberMapper.updateActive(id, !Boolean.TRUE.equals(existing.getActive()));
        return true;
    }

    public Map<String, Long> stats() {
        return Map.of(
                "total", subscriberMapper.count(),
                "active", subscriberMapper.countByActive(true),
                "inactive", subscriberMapper.countByActive(false)
        );
    }

    public record SubscribeResult(Subscriber subscriber, boolean isNew) {}
}
