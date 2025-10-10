import { Timestamp } from './common';

export type KnowledgeType = 'note' | 'api-key' | 'ssh-record' | 'password' | 'memo';

export interface EncryptionMetadata {
  algorithm: string;
  ivBase64: string;
}

export interface KnowledgeEntry {
  id: string;
  userId: string; // Owner of this entry
  title: string;
  type: KnowledgeType;
  content: string;
  isEncrypted: boolean;
  kmsKeyId?: string;
  encryptionMetadata?: EncryptionMetadata;
  tags: string[];
  category?: string;
  attachments: string[];
  accessedAt?: Timestamp;
  accessCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}


