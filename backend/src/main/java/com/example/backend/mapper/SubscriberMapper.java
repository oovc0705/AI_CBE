package com.example.backend.mapper;

import com.example.backend.entity.Subscriber;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SubscriberMapper {
    Subscriber findById(@Param("id") Long id);
    Subscriber findByEmail(@Param("email") String email);
    List<Subscriber> findAll(@Param("offset") int offset, @Param("limit") int limit);
    List<Subscriber> findByActive(@Param("active") boolean active, @Param("offset") int offset, @Param("limit") int limit);
    long count();
    long countByActive(@Param("active") boolean active);
    int insert(Subscriber subscriber);
    int update(Subscriber subscriber);
    int updateActive(@Param("id") Long id, @Param("active") boolean active);
}
