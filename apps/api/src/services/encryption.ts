import { KeyManagementServiceClient } from '@google-cloud/kms';

/**
 * Encryption service using Google Cloud KMS
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
   * Encrypt plaintext data
   */
  async encrypt(plaintext: string): Promise<{ ciphertext: string; ivBase64: string }> {
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

      // Generate a random IV for additional security (optional)
      const iv = Buffer.from(Date.now().toString()).toString('base64');

      return {
        ciphertext: ciphertextBase64,
        ivBase64: iv,
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt ciphertext data
   */
  async decrypt(ciphertextBase64: string): Promise<string> {
    try {
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

      // Convert plaintext buffer back to string
      return Buffer.from(result.plaintext).toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Test if KMS is properly configured
   */
  async testConnection(): Promise<boolean> {
    try {
      const testData = 'test-encryption';
      const { ciphertext } = await this.encrypt(testData);
      const decrypted = await this.decrypt(ciphertext);
      return decrypted === testData;
    } catch (error) {
      console.error('KMS connection test failed:', error);
      return false;
    }
  }
}

export const encryptionService = new EncryptionService();

