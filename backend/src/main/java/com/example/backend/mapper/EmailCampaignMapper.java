package com.example.backend.mapper;

import com.example.backend.entity.EmailCampaign;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface EmailCampaignMapper {

    EmailCampaign findById(@Param("id") String id);

    List<EmailCampaign> findAll(@Param("status") String status);

    int insert(EmailCampaign campaign);

    int update(EmailCampaign campaign);

    int deleteById(@Param("id") String id);
}
