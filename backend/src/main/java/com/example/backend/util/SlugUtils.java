package com.example.backend.util;

import java.text.Normalizer;
import java.util.UUID;
import java.util.regex.Pattern;

public final class SlugUtils {
    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9]+");

    private SlugUtils() {
    }

    public static String slugify(String input) {
        if (input == null || input.isBlank()) {
            return UUID.randomUUID().toString();
        }
        String normalized = Normalizer.normalize(input.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String slug = NON_ALPHANUMERIC.matcher(normalized).replaceAll("-").replaceAll("^-|-$", "");
        return slug.isBlank() ? UUID.randomUUID().toString() : slug;
    }
}
