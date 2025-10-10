import * as admin from 'firebase-admin';

/**
 * Google Cloud Storage service for file uploads
 */
export class StorageService {
  private bucket: any;

  constructor() {
    const bucketName = process.env.GCS_BUCKET_NAME || 'student-record-prod';
    this.bucket = admin.storage().bucket(bucketName);
  }

  /**
   * Upload a file buffer to GCS
   */
  async uploadFile(
    buffer: Buffer,
    destination: string,
    contentType: string
  ): Promise<string> {
    const file = this.bucket.file(destination);

    await file.save(buffer, {
      contentType,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Make file publicly readable (for audio/whiteboard files)
    await file.makePublic();

    // Return public URL
    return `https://storage.googleapis.com/${this.bucket.name}/${destination}`;
  }

  /**
   * Upload audio recording
   */
  async uploadAudio(
    buffer: Buffer,
    sessionId: string,
    fileName: string
  ): Promise<string> {
    const destination = `sessions/${sessionId}/audio/${fileName}`;
    return this.uploadFile(buffer, destination, 'audio/webm');
  }

  /**
   * Upload whiteboard image
   */
  async uploadWhiteboard(
    buffer: Buffer,
    sessionId: string,
    fileName: string
  ): Promise<string> {
    const destination = `sessions/${sessionId}/whiteboards/${fileName}`;
    return this.uploadFile(buffer, destination, 'image/png');
  }

  /**
   * Delete a file from GCS
   */
  async deleteFile(url: string): Promise<void> {
    // Extract file path from URL
    const urlObj = new URL(url);
    const path = urlObj.pathname.split(`/${this.bucket.name}/`)[1];

    if (path) {
      await this.bucket.file(path).delete();
    }
  }

  /**
   * Get signed URL for temporary access (if needed for private files)
   */
  async getSignedUrl(filePath: string, expiresInMinutes: number = 60): Promise<string> {
    const [url] = await this.bucket.file(filePath).getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return url;
  }
}

export const storageService = new StorageService();


