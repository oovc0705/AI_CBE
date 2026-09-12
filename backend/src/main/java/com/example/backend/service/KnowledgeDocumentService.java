package com.example.backend.service;

import com.example.backend.dto.admin.KnowledgeDocumentRequest;
import com.example.backend.entity.KnowledgeDocument;
import com.example.backend.mapper.KnowledgeDocumentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KnowledgeDocumentService {

    private final KnowledgeDocumentMapper knowledgeDocumentMapper;

    public List<KnowledgeDocument> list(String collection, String status) {
        return knowledgeDocumentMapper.findAll(collection, status);
    }

    public KnowledgeDocument getById(String id) {
        KnowledgeDocument document = knowledgeDocumentMapper.findById(id);
        if (document == null) {
            throw new RuntimeException("知识库文档不存在");
        }
        return document;
    }

    @Transactional
    public KnowledgeDocument create(KnowledgeDocumentRequest req, String uploadedBy) {
        KnowledgeDocument document = toDocument(req, null);
        document.setId(UUID.randomUUID().toString());
        document.setStatus("pending");
        document.setChunkCount(0);
        document.setUploadedBy(uploadedBy);
        document.setCreatedAt(Instant.now());
        document.setUpdatedAt(Instant.now());
        knowledgeDocumentMapper.insert(document);
        return document;
    }

    @Transactional
    public KnowledgeDocument update(String id, KnowledgeDocumentRequest req) {
        KnowledgeDocument existing = knowledgeDocumentMapper.findById(id);
        if (existing == null) {
            throw new RuntimeException("知识库文档不存在");
        }
        KnowledgeDocument document = toDocument(req, existing);
        document.setUpdatedAt(Instant.now());
        knowledgeDocumentMapper.update(document);
        return document;
    }

    @Transactional
    public void delete(String id) {
        if (knowledgeDocumentMapper.findById(id) == null) {
            throw new RuntimeException("知识库文档不存在");
        }
        knowledgeDocumentMapper.deleteById(id);
    }

    @Transactional
    public KnowledgeDocument upload(MultipartFile file, String uploadedBy) {
        try {
            KnowledgeDocument document = new KnowledgeDocument();
            document.setId(UUID.randomUUID().toString());
            document.setTitle(file.getOriginalFilename());
            document.setCollection("copilot_kb");
            document.setDocumentType(getDocumentType(file.getOriginalFilename()));
            document.setFileName(file.getOriginalFilename());
            document.setFileSize((int) file.getSize());
            document.setContent(new String(file.getBytes(), "UTF-8"));
            document.setStatus("pending");
            document.setChunkCount(0);
            document.setUploadedBy(uploadedBy);
            document.setCreatedAt(Instant.now());
            document.setUpdatedAt(Instant.now());
            knowledgeDocumentMapper.insert(document);
            return document;
        } catch (IOException e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }

    @Transactional
    public void train(String id) {
        KnowledgeDocument document = knowledgeDocumentMapper.findById(id);
        if (document == null) {
            throw new RuntimeException("知识库文档不存在");
        }
        document.setStatus("processing");
        document.setUpdatedAt(Instant.now());
        knowledgeDocumentMapper.update(document);
        // TODO: 实际训练逻辑需要与AI服务集成
    }

    private String getDocumentType(String filename) {
        if (filename == null) return "txt";
        String ext = filename.toLowerCase();
        if (ext.endsWith(".pdf")) return "pdf";
        if (ext.endsWith(".docx")) return "docx";
        if (ext.endsWith(".md")) return "md";
        if (ext.endsWith(".html")) return "html";
        return "txt";
    }

    private KnowledgeDocument toDocument(KnowledgeDocumentRequest req, KnowledgeDocument existing) {
        KnowledgeDocument document = existing == null ? new KnowledgeDocument() : existing;
        document.setTitle(req.getTitle());
        document.setCollection(req.getCollection() == null ? "copilot_kb" : req.getCollection());
        document.setDocumentType(req.getDocumentType() == null ? "txt" : req.getDocumentType());
        document.setFileUrl(req.getFileUrl());
        document.setFileName(req.getFileName());
        document.setFileSize(req.getFileSize());
        document.setContent(req.getContent());
        document.setSource(req.getSource());
        document.setMetadata(req.getMetadata());
        return document;
    }
}
