import * as admin from 'firebase-admin';
import { nanoid } from 'nanoid';

export interface UploadResult {
  fullImageUrl: string;
  thumbnailUrl: string;
  filePath: string;
  thumbnailPath: string;
}

/**
 * 上传费用图片到Firebase Storage
 * @param userId 用户ID
 * @param expenseId 费用ID
 * @param fullImage 完整图片buffer
 * @param thumbnail 缩略图buffer
 * @param contentType 内容类型
 */
export async function uploadExpenseImages(
  userId: string,
  expenseId: string,
  fullImage: Buffer,
  thumbnail: Buffer,
  contentType: string = 'image/webp'
): Promise<UploadResult> {
  const bucket = admin.storage().bucket();
  
  // 验证 bucket 是否正确初始化
  if (!bucket || !bucket.name) {
    console.error('❌ Storage bucket not initialized!');
    console.error('Available storage:', admin.storage());
    throw new Error('Storage bucket is not properly configured. Please check Firebase Admin initialization.');
  }
  const fileId = nanoid(10);
  
  // 文件路径
  const fullImagePath = `expenses/${userId}/${expenseId}/full_${fileId}.webp`;
  const thumbnailPath = `expenses/${userId}/${expenseId}/thumb_${fileId}.webp`;

  try {
    console.log('☁️  Uploading to Firebase Storage...', {
      bucketName: bucket.name,
      fullImagePath,
      thumbnailPath,
      fullImageSize: fullImage.length,
      thumbnailSize: thumbnail.length,
    });
    
    // 上传完整图片
    const fullImageFile = bucket.file(fullImagePath);
    await fullImageFile.save(fullImage, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        metadata: {
          userId,
          expenseId,
          type: 'full',
        },
      },
    });

    // 上传缩略图
    const thumbnailFile = bucket.file(thumbnailPath);
    await thumbnailFile.save(thumbnail, {
      contentType: 'image/webp',
      metadata: {
        cacheControl: 'public, max-age=31536000',
        metadata: {
          userId,
          expenseId,
          type: 'thumbnail',
        },
      },
    });

    console.log('✅ Images uploaded successfully, generating signed URLs...');
    
    // 生成签名URL（7天有效期）- 安全的私有访问
    const [fullImageSignedUrl] = await fullImageFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    const [thumbnailSignedUrl] = await thumbnailFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    console.log('✅ Signed URLs generated (secure, private access)');

    return {
      fullImageUrl: fullImageSignedUrl,
      thumbnailUrl: thumbnailSignedUrl,
      filePath: fullImagePath,
      thumbnailPath,
    };
  } catch (error) {
    console.error('❌ Error uploading images to Storage:', error);
    console.error('Storage error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack',
      code: (error as any)?.code,
      details: (error as any)?.details,
    });
    throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 删除费用图片
 * @param filePath 完整图片路径
 * @param thumbnailPath 缩略图路径
 */
export async function deleteExpenseImages(
  filePath?: string,
  thumbnailPath?: string
): Promise<void> {
  if (!filePath && !thumbnailPath) {
    return;
  }

  const bucket = admin.storage().bucket();

  try {
    const deletePromises: Promise<void>[] = [];

    if (filePath) {
      const file = bucket.file(filePath);
      deletePromises.push(file.delete().then(() => {}));
    }

    if (thumbnailPath) {
      const thumb = bucket.file(thumbnailPath);
      deletePromises.push(thumb.delete().then(() => {}));
    }

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting images from Storage:', error);
    // 不抛出错误，因为图片可能已经被删除
  }
}

/**
 * 删除用户的所有费用图片（用于清理）
 * @param userId 用户ID
 * @param expenseId 费用ID
 */
export async function deleteAllExpenseImages(
  userId: string,
  expenseId: string
): Promise<void> {
  const bucket = admin.storage().bucket();
  const prefix = `expenses/${userId}/${expenseId}/`;

  try {
    const [files] = await bucket.getFiles({ prefix });
    
    if (files.length === 0) {
      return;
    }

    await Promise.all(files.map(file => file.delete()));
  } catch (error) {
    console.error('Error deleting all expense images:', error);
    // 不抛出错误
  }
}

