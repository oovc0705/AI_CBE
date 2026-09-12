package com.example.backend.mapper;

import com.example.backend.entity.FaqEntry;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FaqEntryMapper {

    FaqEntry findById(@Param("id") String id);

    List<FaqEntry> findAll(
            @Param("category") String category,
            @Param("locale") String locale);

    int insert(FaqEntry entry);

    int update(FaqEntry entry);

    int deleteById(@Param("id") String id);
}
