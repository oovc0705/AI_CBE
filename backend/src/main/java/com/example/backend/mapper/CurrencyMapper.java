package com.example.backend.mapper;

import com.example.backend.entity.Currency;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CurrencyMapper {

    Currency findById(@Param("id") String id);

    Currency findByCode(@Param("code") String code);

    List<Currency> findAll(@Param("enabled") Boolean enabled);

    int insert(Currency currency);

    int update(Currency currency);

    int deleteById(@Param("id") String id);

    int clearDefault();
}
