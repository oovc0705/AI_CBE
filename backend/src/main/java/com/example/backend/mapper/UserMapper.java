package com.example.backend.mapper;

import com.example.backend.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

@Mapper
public interface UserMapper {
    User findById(@Param("id") Long id);
    User findByEmail(@Param("email") String email);
    User findByUsername(@Param("username") String username);
    List<User> findAll(@Param("offset") int offset, @Param("limit") int limit);
    long countAll();
    int insert(User user);
    int update(User user);
    int updateProfile(User user);
    int deleteById(@Param("id") Long id);

    List<Map<String, Object>> findAllForExport();
}
