package com.example.backend.service;

import com.example.backend.entity.Subscriber;
import com.example.backend.mapper.SubscriberMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubscriberServiceTest {

    @Mock
    private SubscriberMapper subscriberMapper;

    @InjectMocks
    private SubscriberService subscriberService;

    @Test
    void subscribe_newEmail_shouldCreateAndReturnNew() {
        when(subscriberMapper.findByEmail("test@example.com")).thenReturn(null);
        when(subscriberMapper.insert(any(Subscriber.class))).thenReturn(1);

        SubscriberService.SubscribeResult result = subscriberService.subscribe("test@example.com");

        assertTrue(result.isNew());
        assertEquals("test@example.com", result.subscriber().getEmail());
        verify(subscriberMapper).insert(any(Subscriber.class));
    }

    @Test
    void subscribe_existingEmail_shouldReturnExisting() {
        Subscriber existing = new Subscriber();
        existing.setId(1L);
        existing.setEmail("test@example.com");
        existing.setSubscribedAt(Instant.now());

        when(subscriberMapper.findByEmail("test@example.com")).thenReturn(existing);

        SubscriberService.SubscribeResult result = subscriberService.subscribe("test@example.com");

        assertFalse(result.isNew());
        assertEquals(1L, result.subscriber().getId());
        verify(subscriberMapper, never()).insert(any());
    }

    @Test
    void getCount_shouldReturnTotal() {
        when(subscriberMapper.count()).thenReturn(42L);

        long count = subscriberService.getCount();

        assertEquals(42L, count);
    }
}
