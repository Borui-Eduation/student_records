import sharp from 'sharp';

export interface ProcessedImage {
  fullImage: Buffer;
  thumbnail: Buffer;
  contentType: string;
}

export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  thumbnailWidth?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * 处理图片：压缩、调整大小、生成缩略图
 * @param imageBuffer 原始图片buffer
 * @param options 处理选项
 */
export async function processImage(
  imageBuffer: Buffer,
  options: ImageProcessOptions = {}
): Promise<ProcessedImage> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    thumbnailWidth = 300,
    quality = 80,
    format = 'webp',
  } = options;

  try {
    console.log('📸 Starting image processing...', {
      bufferSize: imageBuffer.length,
      format: options.format || 'webp',
    });
    
    // 使用sharp处理图片
    const image = sharp(imageBuffer);
    
    // 获取图片元数据
    const metadata = await image.metadata();
    
    console.log('📊 Image metadata:', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      size: metadata.size,
    });
    
    // 自动旋转图片（处理EXIF方向）
    image.rotate();

    // 处理完整图片
    let fullImagePipeline = image.clone();
    
    // 如果图片尺寸超过最大值，则调整大小
    if (metadata.width && metadata.width > maxWidth) {
      fullImagePipeline = fullImagePipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // 转换为指定格式并压缩
    let fullImage: Buffer;
    if (format === 'webp') {
      fullImage = await fullImagePipeline
        .webp({ quality })
        .toBuffer();
    } else if (format === 'jpeg') {
      fullImage = await fullImagePipeline
        .jpeg({ quality })
        .toBuffer();
    } else {
      fullImage = await fullImagePipeline
        .png({ quality })
        .toBuffer();
    }

    // 生成缩略图
    const thumbnail = await image
      .clone()
      .resize(thumbnailWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 70 })
      .toBuffer();

    return {
      fullImage,
      thumbnail,
      contentType: `image/${format}`,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * 将Base64字符串转换为Buffer
 * @param base64String Base64编码的图片数据
 */
export function base64ToBuffer(base64String: string): Buffer {
  // 移除data URL前缀（如果存在）
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * 验证图片大小
 * @param buffer 图片buffer
 * @param maxSizeInMB 最大允许大小（MB）
 */
export function validateImageSize(buffer: Buffer, maxSizeInMB: number = 10): boolean {
  const sizeInMB = buffer.length / (1024 * 1024);
  return sizeInMB <= maxSizeInMB;
}

/**
 * 验证图片格式
 * @param buffer 图片buffer
 */
export async function validateImageFormat(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif'];
    return metadata.format ? validFormats.includes(metadata.format) : false;
  } catch {
    return false;
  }
}

