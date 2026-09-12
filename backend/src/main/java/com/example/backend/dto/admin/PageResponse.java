package com.example.backend.dto.admin;

import lombok.Data;

import java.util.List;

@Data
public class PageResponse<T> {

    private List<T> content;
    private long totalElements;
    private int totalPages;
    private int number;
    private int size;
    private boolean first;
    private boolean last;

    public static <T> PageResponse<T> of(List<T> content, long totalElements, int page, int size) {
        PageResponse<T> resp = new PageResponse<>();
        resp.setContent(content);
        resp.setTotalElements(totalElements);
        resp.setTotalPages(size == 0 ? 0 : (int) Math.ceil((double) totalElements / size));
        resp.setNumber(page - 1);
        resp.setSize(size);
        resp.setFirst(page == 1);
        resp.setLast(page * size >= totalElements);
        return resp;
    }
}
