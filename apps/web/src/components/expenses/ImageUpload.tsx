'use client';

import { useState, useRef } from 'react';
import { Upload, X, Camera, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useImageCompression, validateImageFile } from '@/hooks/useImageCompression';
import { useMobileDetect } from '@/hooks/useMobileDetect';

interface ImageUploadProps {
  value?: string; // Base64 or URL
  onChange: (base64: string | null) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, onError, className }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { compressImage, isCompressing, progress } = useImageCompression();
  const { isMobile } = useMobileDetect();

  const handleFile = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      onError?.(validation.error || 'Invalid file');
      return;
    }

    // Compress image aggressively (convert to WebP, reduce size)
    const result = await compressImage(file, {
      maxSizeMB: 0.5,          // 压缩到500KB以下
      maxWidthOrHeight: 1200,  // 最大宽高1200px
      useWebWorker: true,      // 使用Web Worker以免阻塞UI
      fileType: 'image/webp',  // 转换为WebP格式（更小）
      initialQuality: 0.8,     // 初始质量80%
    });

    if (result) {
      setPreview(result.base64);
      onChange(result.base64);
    } else {
      onError?.('Image processing failed');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        // Mobile: support camera
        capture={isMobile ? 'environment' : undefined}
      />

      {preview ? (
        // Preview
        <div className="relative rounded-lg border-2 border-gray-200 overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          {isCompressing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-sm">Compressing...</div>
                <div className="text-xs mt-1">{Math.round(progress)}%</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Upload Area
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            'hover:border-blue-500 hover:bg-blue-50/50',
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300',
            isCompressing && 'pointer-events-none opacity-50'
          )}
        >
          <div className="flex flex-col items-center gap-3">
            {isMobile ? (
              <>
                <div className="flex gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Camera className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <ImageIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="text-sm font-medium">Take photo or select image</div>
                <div className="text-xs text-gray-500">JPG, PNG, WEBP (auto-compress to ~500KB)</div>
              </>
            ) : (
              <>
                <div className="p-3 bg-gray-100 rounded-full">
                  <Upload className="h-6 w-6 text-gray-600" />
                </div>
                <div className="text-sm font-medium">
                  Drag image here or click to upload
                </div>
                <div className="text-xs text-gray-500">JPG, PNG, WEBP (auto-compress to ~500KB)</div>
              </>
            )}
          </div>
          {isCompressing && (
            <div className="mt-4 text-sm text-blue-600">
              Compressing... {Math.round(progress)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}

