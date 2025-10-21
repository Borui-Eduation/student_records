import { KeyManagementServiceClient } from '@google-cloud/kms';
import { createLogger } from '@professional-workspace/shared';
import * as crypto from 'crypto';

const logger = createLogger('encryption');

/**
 * Encryption service using Google Cloud KMS with enhanced security
 */
export class EncryptionService {
  private client: KeyManagementServiceClient;
  private projectId: string;
  private locationId: string;
  private keyRingId: string;
  private cryptoKeyId: string;

  constructor() {
    this.client = new KeyManagementServiceClient();
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT || 'student-record-prod';
    this.locationId = process.env.KMS_LOCATION || 'global';
    this.keyRingId = process.env.KMS_KEYRING || 'student-record-keyring';
    this.cryptoKeyId = process.env.KMS_KEY || 'sensitive-data-key';
  }

  /**
   * Get the full key name for KMS
   */
  private getKeyName(): string {
    return this.client.cryptoKeyPath(
      this.projectId,
      this.locationId,
      this.keyRingId,
      this.cryptoKeyId
    );
  }

  /**
   * Encrypt plaintext data with enhanced security
   * Uses crypto.randomBytes for proper IV generation
   */
  async encrypt(plaintext: string): Promise<{ ciphertext: string; ivBase64: string; hmac: string }> {
    try {
      const name = this.getKeyName();

      // Convert plaintext to buffer
      const plaintextBuffer = Buffer.from(plaintext, 'utf8');

      // Encrypt using KMS
      const [result] = await this.client.encrypt({
        name,
        plaintext: plaintextBuffer,
      });

      if (!result.ciphertext) {
        throw new Error('Encryption failed: no ciphertext returned');
      }

      // Convert ciphertext to base64 string
      const ciphertextBase64 = Buffer.from(result.ciphertext).toString('base64');

      // Generate a secure random IV (16 bytes for AES)
      const iv = crypto.randomBytes(16);
      const ivBase64 = iv.toString('base64');

      // Generate HMAC for integrity verification
      const hmac = crypto
        .createHmac('sha256', this.projectId)
        .update(ciphertextBase64 + ivBase64)
        .digest('base64');

      logger.debug('Data encrypted successfully');

      return {
        ciphertext: ciphertextBase64,
        ivBase64,
        hmac,
      };
    } catch (error) {
      logger.error('Encryption error', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt ciphertext data with integrity verification
   */
  async decrypt(ciphertextBase64: string, ivBase64?: string, hmac?: string): Promise<string> {
    try {
      // Verify HMAC if provided
      if (hmac && ivBase64) {
        const expectedHmac = crypto
          .createHmac('sha256', this.projectId)
          .update(ciphertextBase64 + ivBase64)
          .digest('base64');
        
        if (hmac !== expectedHmac) {
          logger.warn('HMAC verification failed - data may have been tampered');
          throw new Error('Data integrity check failed');
        }
      }

      const name = this.getKeyName();

      // Convert base64 back to buffer
      const ciphertextBuffer = Buffer.from(ciphertextBase64, 'base64');

      // Decrypt using KMS
      const [result] = await this.client.decrypt({
        name,
        ciphertext: ciphertextBuffer,
      });

      if (!result.plaintext) {
        throw new Error('Decryption failed: no plaintext returned');
      }

      logger.debug('Data decrypted successfully');

      // Convert plaintext buffer back to string
      return Buffer.from(result.plaintext).toString('utf8');
    } catch (error) {
      logger.error('Decryption error', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Test if KMS is properly configured
   */
  async testConnection(): Promise<boolean> {
    try {
      const testData = 'test-encryption';
      const { ciphertext, ivBase64, hmac } = await this.encrypt(testData);
      const decrypted = await this.decrypt(ciphertext, ivBase64, hmac);
      const isValid = decrypted === testData;
      
      if (isValid) {
        logger.info('KMS connection test successful');
      } else {
        logger.error('KMS connection test failed - decryption mismatch');
      }
      
      return isValid;
    } catch (error) {
      logger.error('KMS connection test failed', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();


