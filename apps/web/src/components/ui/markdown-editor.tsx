'use client';

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
  height?: number | string;
  preview?: 'live' | 'edit' | 'preview';
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Enter your content here...',
  height = 400,
  preview: _preview = 'live',
  className,
}: MarkdownEditorProps) {

  return (
    <div className={className} data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={height}
        preview={_preview}
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

