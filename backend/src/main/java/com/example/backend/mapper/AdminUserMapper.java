package com.example.backend.mapper;

import com.example.backend.entity.AdminUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminUserMapper {

    AdminUser findById(@Param("id") String id);

    AdminUser findByEmail(@Param("email") String email);

    List<AdminUser> findAll();

    int insert(AdminUser user);

    int update(AdminUser user);

    int deleteById(@Param("id") String id);
}
