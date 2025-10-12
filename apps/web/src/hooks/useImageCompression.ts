'use client';

import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: string;
  initialQuality?: number;
  onProgress?: (progress: number) => void;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  base64: string;
}

/**
 * Hook for image compression
 */
export function useImageCompression() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const compressImage = useCallback(
    async (
      file: File,
      options: CompressionOptions = {}
    ): Promise<CompressionResult | null> => {
      const {
        maxSizeMB = 2,
        maxWidthOrHeight = 1920,
        useWebWorker = true,
        fileType,
        initialQuality,
        onProgress,
      } = options;

      setIsCompressing(true);
      setProgress(0);
      setError(null);

      try {
        const originalSize = file.size;

        // Compression options
        const compressionOptions: any = {
          maxSizeMB,
          maxWidthOrHeight,
          useWebWorker,
          onProgress: (progressPercent: number) => {
            setProgress(progressPercent);
            onProgress?.(progressPercent);
          },
        };

        // Add fileType if specified (e.g., 'image/webp')
        if (fileType) {
          compressionOptions.fileType = fileType;
        }

        // Add initialQuality if specified
        if (initialQuality !== undefined) {
          compressionOptions.initialQuality = initialQuality;
        }

        // Compress the image
        const compressedFile = await imageCompression(file, compressionOptions);
        const compressedSize = compressedFile.size;

        // Convert to base64
        const base64 = await fileToBase64(compressedFile);

        setIsCompressing(false);
        setProgress(100);

        return {
          compressedFile,
          originalSize,
          compressedSize,
          base64,
        };
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Image compression error:', err);
        setError(err instanceof Error ? err.message : 'Compression failed');
        setIsCompressing(false);
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsCompressing(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    compressImage,
    isCompressing,
    progress,
    error,
    reset,
  };
}

/**
 * Convert File to Base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload JPG, PNG, WEBP or GIF images',
    };
  }

  // Check file size (max 10MB before compression)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Image file is too large. Please select an image under 10MB',
    };
  }

  return { valid: true };
}

