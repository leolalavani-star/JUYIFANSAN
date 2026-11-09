import React from 'react';
import katex from 'katex';

interface MathTextProps {
  content: string;
  className?: string;
  highlightKeywords?: string[];
}

/**
 * Parses a string containing LaTeX ($...$ and $$...$$) and optionally highlights keywords.
 */
export const MathText: React.FC<MathTextProps> = ({
  content,
  className = '',
  highlightKeywords = [],
}) => {
  if (!content) return null;

  // Split into tokens based on LaTeX delimiters: $$...$$ for display math, $...$ for inline math
  const parts: React.ReactNode[] = [];
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Function to render text with keyword highlights
  const renderTextWithHighlights = (text: string, keyPrefix: string) => {
    if (!highlightKeywords || highlightKeywords.length === 0 || !text.trim()) {
      return text;
    }

    // Filter valid keywords and escape for regex
    const validKeywords = highlightKeywords
      .filter((k) => k && k.trim().length > 0)
      .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (validKeywords.length === 0) return text;

    const highlightRegex = new RegExp(`(${validKeywords.join('|')})`, 'gi');
    const segments = text.split(highlightRegex);

    return segments.map((seg, i) => {
      const isMatch = validKeywords.some(
        (kw) => kw.toLowerCase() === seg.toLowerCase()
      );
      if (isMatch) {
        return (
          <span
            key={`${keyPrefix}-hl-${i}`}
            className="inline-block px-1 py-0.5 mx-0.5 rounded font-semibold text-rose-800 bg-rose-100/90 border border-rose-300 shadow-xs"
            title="易错重点提醒"
          >
            {seg}
          </span>
        );
      }
      return seg;
    });
  };

  while ((match = regex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {renderTextWithHighlights(textBefore, `before-${lastIndex}`)}
        </span>
      );
    }

    const matchedStr = match[0];
    const isBlock = matchedStr.startsWith('$$') && matchedStr.endsWith('$$');
    const math = isBlock
      ? matchedStr.substring(2, matchedStr.length - 2)
      : matchedStr.substring(1, matchedStr.length - 1);

    try {
      const html = katex.renderToString(math, {
        displayMode: isBlock,
        throwOnError: false,
      });

      parts.push(
        <span
          key={`math-${match.index}`}
          className={isBlock ? 'block my-2 text-center overflow-x-auto' : 'inline-block px-0.5'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch {
      // Fallback if KaTeX fails
      parts.push(
        <code key={`math-fallback-${match.index}`} className="px-1 py-0.5 bg-slate-100 rounded text-sm text-indigo-700">
          {matchedStr}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  const remainingText = content.substring(lastIndex);
  if (remainingText) {
    parts.push(
      <span key={`text-end-${lastIndex}`}>
        {renderTextWithHighlights(remainingText, `end-${lastIndex}`)}
      </span>
    );
  }

  return (
    <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {parts}
    </div>
  );
};
