package com.example.backend.mapper;

import com.example.backend.entity.EmailTemplate;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmailTemplateMapper {

    EmailTemplate findById(@Param("id") String id);

    EmailTemplate findByCode(@Param("code") String code);

    List<EmailTemplate> findAll();

    int insert(EmailTemplate template);

    int update(EmailTemplate template);

    int deleteById(@Param("id") String id);
}
