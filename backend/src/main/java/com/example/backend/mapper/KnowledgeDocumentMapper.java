package com.example.backend.mapper;

import com.example.backend.entity.KnowledgeDocument;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface KnowledgeDocumentMapper {

    KnowledgeDocument findById(@Param("id") String id);

    List<KnowledgeDocument> findAll(
            @Param("collection") String collection,
            @Param("status") String status);

    int insert(KnowledgeDocument document);

    int update(KnowledgeDocument document);

    int deleteById(@Param("id") String id);
}
