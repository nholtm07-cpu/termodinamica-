import React, { useMemo } from 'react';
import katex from 'katex';

interface MathBlockProps {
  latex: string;
  display?: boolean;
  className?: string;
}

export const MathBlock: React.FC<MathBlockProps> = ({
  latex,
  display = false,
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return null;
    }
  }, [latex, display]);

  if (!html) {
    return (
      <code className={`font-mono-num text-[#F2F6FC] ${className}`}>{latex}</code>
    );
  }

  return (
    <span
      className={display ? `block overflow-x-auto ${className}` : `inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
