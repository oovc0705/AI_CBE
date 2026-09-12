package com.example.backend.mapper;

import com.example.backend.entity.TranslationValue;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface TranslationValueMapper {

    TranslationValue findById(@Param("id") String id);

    List<TranslationValue> findByKeyId(@Param("keyId") String keyId);

    List<TranslationValue> findAll();

    TranslationValue findByKeyIdAndLocale(
            @Param("keyId") String keyId,
            @Param("locale") String locale);

    int insert(TranslationValue value);

    int update(TranslationValue value);

    int deleteById(@Param("id") String id);

    List<Map<String, Object>> countByLocale();
}
