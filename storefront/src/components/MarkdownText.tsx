'use client';

import { useMemo } from 'react';
import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
  async: false,
});

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export default function MarkdownText({ content, className }: MarkdownTextProps) {
  const html = useMemo(() => {
    if (!content) return '';
    try {
      // AI 输出按纯 Markdown 文本处理：先转义再解析，内联 HTML 一律不会被渲染
      const raw = marked.parse(escapeHtml(content)) as string;
      // 中和协议型危险链接（javascript: / data: / vbscript:）
      return raw.replace(
        /(\bhref|\bsrc)\s*=\s*(["']?)\s*(?:javascript|data|vbscript)\s*:/gi,
        '$1=$2#blocked:',
      );
    } catch {
      return escapeHtml(content);
    }
  }, [content]);

  return (
    <div
      className={className}
      // 内容来自 AI 模型输出，解析前已转义 HTML，仅渲染 Markdown 结构
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
