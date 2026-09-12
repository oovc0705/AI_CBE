package com.example.backend.mapper;

import com.example.backend.entity.AdminRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AdminRoleMapper {

    AdminRole findById(@Param("id") String id);

    AdminRole findByName(@Param("name") String name);

    List<AdminRole> findAll();

    int insert(AdminRole role);

    int update(AdminRole role);

    int deleteById(@Param("id") String id);
}
