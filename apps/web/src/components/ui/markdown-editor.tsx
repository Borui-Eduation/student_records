'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  preview?: 'live' | 'edit' | 'preview';
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter your content here...',
  height = 400,
  preview = 'live',
  className,
}: MarkdownEditorProps) {
  const [previewMode, setPreviewMode] = useState<'live' | 'edit' | 'preview'>(preview);

  return (
    <div className={className} data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={height}
        preview={previewMode}
        hideToolbar={false}
        enableScroll={true}
        visibleDragbar={false}
        textareaProps={{
          placeholder: placeholder,
        }}
        previewOptions={{
          rehypePlugins: [],
        }}
      />
    </div>
  );
}

