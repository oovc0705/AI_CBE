package com.example.backend.mapper;

import com.example.backend.entity.TranslationKey;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface TranslationKeyMapper {

    TranslationKey findById(@Param("id") String id);

    TranslationKey findByKey(@Param("key") String key);

    List<TranslationKey> findAll(@Param("namespace") String namespace);

    List<TranslationKey> findAllPaged(@Param("namespace") String namespace,
                                       @Param("keyword") String keyword,
                                       @Param("offset") int offset,
                                       @Param("limit") int limit);

    long countAll(@Param("namespace") String namespace,
                  @Param("keyword") String keyword);

    int insert(TranslationKey key);

    int update(TranslationKey key);

    int deleteById(@Param("id") String id);
}
