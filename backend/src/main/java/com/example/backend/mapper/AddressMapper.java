package com.example.backend.mapper;

import com.example.backend.entity.Address;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface AddressMapper {
    Address findById(@Param("id") Long id);
    List<Address> findByUserId(@Param("userId") Long userId);
    int insert(Address address);
    int update(Address address);
    int deleteById(@Param("id") Long id);
}
