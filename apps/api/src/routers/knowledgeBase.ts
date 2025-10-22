import { router, adminProcedure, auditedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  CreateKnowledgeEntrySchema,
  UpdateKnowledgeEntrySchema,
  SearchKnowledgeSchema,
} from '@professional-workspace/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { encryptionService } from '../services/encryption';
import { cleanUndefinedValues } from '../services/firestoreHelpers';
import { sanitizeKnowledgeEntry } from '../services/dataSanitizers';

export const knowledgeBaseRouter = router({
  /**
   * Create a knowledge entry (with optional encryption)
   */
  create: auditedProcedure.input(CreateKnowledgeEntrySchema).mutation(async ({ ctx, input }) => {
    const now = admin.firestore.Timestamp.now();

    let content = input.content;
    let isEncrypted = false;
    let kmsKeyId: string | undefined;
    let encryptionMetadata: any | undefined;

    // Encrypt if required or if type is sensitive
    const sensitiveTypes = ['api-key', 'ssh-record', 'password'];
    const shouldEncrypt =
      input.requireEncryption || sensitiveTypes.includes(input.type);

    if (shouldEncrypt) {
      try {
        const encrypted = await encryptionService.encrypt(input.content);
        content = encrypted.ciphertext;
        isEncrypted = true;
        kmsKeyId = `${process.env.KMS_KEY_RING}/${process.env.KMS_KEY_NAME}`;
        encryptionMetadata = {
          algorithm: 'AES-256-GCM',
          ivBase64: encrypted.ivBase64,
        };
      } catch (error) {
        console.error('Encryption failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to encrypt sensitive data',
        });
      }
    }

    const entryData: any = {
      userId: ctx.user.uid,
      title: input.title,
      type: input.type,
      content,
      isEncrypted,
      tags: input.tags || [],
      category: input.category,
      attachments: [],
      accessCount: 0,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.user.uid,
    };

    // Only add encryption fields if encrypted
    if (isEncrypted) {
      entryData.kmsKeyId = kmsKeyId;
      entryData.encryptionMetadata = encryptionMetadata;
    }

    const docRef = await ctx.db.collection('knowledgeBase').add(cleanUndefinedValues(entryData));

    return {
      id: docRef.id,
      userId: entryData.userId,
      title: entryData.title,
      type: entryData.type,
      content: isEncrypted ? '[ENCRYPTED]' : content,
      isEncrypted: entryData.isEncrypted,
      tags: entryData.tags,
      category: entryData.category,
      attachments: entryData.attachments,
      accessCount: entryData.accessCount,
      createdAt: now.toDate().toISOString(),
      updatedAt: now.toDate().toISOString(),
      createdBy: entryData.createdBy,
      kmsKeyId: entryData.kmsKeyId,
      encryptionMetadata: entryData.encryptionMetadata,
    };
  }),

  /**
   * Get a knowledge entry by ID (with decryption)
   */
  get: auditedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const doc = await ctx.db.collection('knowledgeBase').doc(input.id).get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Knowledge entry not found',
      });
    }

    const data = doc.data()!;

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && data.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this entry',
      });
    }

    // Update access tracking
    await doc.ref.update(cleanUndefinedValues({
      accessedAt: admin.firestore.Timestamp.now(),
      accessCount: admin.firestore.FieldValue.increment(1),
    }));

    // Re-fetch to get the updated accessCount
    const updatedDoc = await doc.ref.get();
    const updatedData = updatedDoc.data()!;

    // Decrypt if encrypted
    let content = updatedData.content;
    if (updatedData.isEncrypted) {
      try {
        content = await encryptionService.decrypt(updatedData.content);
      } catch (error) {
        console.error('Decryption failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to decrypt data',
        });
      }
    }

    // Sanitize and return with decrypted content
    const sanitized = sanitizeKnowledgeEntry(updatedData, updatedDoc.id);
    return {
      ...sanitized,
      content, // Use decrypted content
    };
  }),

  /**
   * List knowledge entries (without decrypting content)
   */
  list: adminProcedure
    .input(
      z.object({
        type: z.enum(['note', 'api-key', 'ssh-record', 'password', 'memo']).optional(),
        tags: z.array(z.string()).optional(),
        category: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
        viewAllUsers: z.boolean().optional(), // Super admin only
      })
    )
    .query(async ({ ctx, input }) => {
      let query: admin.firestore.Query = ctx.db.collection('knowledgeBase');

      // Apply userId filter (unless superadmin with viewAllUsers flag)
      if (ctx.userRole !== 'superadmin' || !input.viewAllUsers) {
        query = query.where('userId', '==', ctx.user.uid);
      }

      // Filter by type
      if (input.type) {
        query = query.where('type', '==', input.type);
      }

      // Filter by tags (array-contains only supports single value)
      if (input.tags && input.tags.length > 0) {
        query = query.where('tags', 'array-contains', input.tags[0]);
      }

      // Filter by category
      if (input.category) {
        query = query.where('category', '==', input.category);
      }

      // Order by most recently updated
      query = query.orderBy('updatedAt', 'desc');

      // Pagination
      if (input.cursor) {
        const cursorDoc = await ctx.db.collection('knowledgeBase').doc(input.cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      query = query.limit(input.limit || 50);

      const snapshot = await query.get();

      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        const sanitized = sanitizeKnowledgeEntry(data, doc.id);
        
        // Truncate content for list view
        return {
          ...sanitized,
          content: sanitized.isEncrypted ? '[ENCRYPTED]' : sanitized.content.substring(0, 100),
        };
      });

      return {
        items,
        nextCursor:
          snapshot.docs.length === input.limit
            ? snapshot.docs[snapshot.docs.length - 1].id
            : undefined,
        hasMore: snapshot.docs.length === input.limit,
        total: items.length,
      };
    }),

  /**
   * Update a knowledge entry
   */
  update: auditedProcedure.input(UpdateKnowledgeEntrySchema).mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;

    const docRef = ctx.db.collection('knowledgeBase').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Knowledge entry not found',
      });
    }

    const data = doc.data()!;

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && data.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this entry',
      });
    }

    const updateData: any = {
      ...updates,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    // If updating content and entry was encrypted, re-encrypt
    if (updates.content && data.isEncrypted) {
      try {
        const encrypted = await encryptionService.encrypt(updates.content);
        updateData.content = encrypted.ciphertext;
        updateData.encryptionMetadata = {
          algorithm: 'AES-256-GCM',
          ivBase64: encrypted.ivBase64,
        };
      } catch (error) {
        console.error('Re-encryption failed:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to re-encrypt data',
        });
      }
    }

    await docRef.update(cleanUndefinedValues(updateData));

    const updated = await docRef.get();
    const updatedData = updated.data()!;

    // Sanitize and return
    const sanitized = sanitizeKnowledgeEntry(updatedData, updated.id);
    return {
      ...sanitized,
      content: sanitized.isEncrypted ? '[ENCRYPTED]' : sanitized.content,
    };
  }),

  /**
   * Delete a knowledge entry
   */
  delete: auditedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const docRef = ctx.db.collection('knowledgeBase').doc(input.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Knowledge entry not found',
      });
    }

    const data = doc.data();

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this entry',
      });
    }

    await docRef.delete();

    return { success: true };
  }),

  /**
   * Search knowledge base
   */
  search: adminProcedure.input(SearchKnowledgeSchema.extend({
    viewAllUsers: z.boolean().optional(), // Super admin only
  })).query(async ({ ctx, input }) => {
    let query: admin.firestore.Query = ctx.db.collection('knowledgeBase');

    // Apply userId filter (unless superadmin with viewAllUsers flag)
    if (ctx.userRole !== 'superadmin' || !input.viewAllUsers) {
      query = query.where('userId', '==', ctx.user.uid);
    }

    // Filter by type if provided
    if (input.type) {
      query = query.where('type', '==', input.type);
    }

    // Filter by tags if provided
    if (input.tags && input.tags.length > 0) {
      query = query.where('tags', 'array-contains-any', input.tags);
    }

    // Get all matching documents
    const snapshot = await query.get();

    // Filter by search query in title (Firestore doesn't support full-text search)
    const items = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        const sanitized = sanitizeKnowledgeEntry(data, doc.id);
        
        // Truncate content for search results
        return {
          ...sanitized,
          content: sanitized.isEncrypted ? '[ENCRYPTED]' : sanitized.content.substring(0, 100),
        };
      })
      .filter((item: any) =>
        item.title.toLowerCase().includes(input.query.toLowerCase())
      );

    return {
      items,
      total: items.length,
    };
  }),

  /**
   * Get all categories (for filtering)
   */
  getCategories: adminProcedure.query(async ({ ctx }) => {
    let query: admin.firestore.Query = ctx.db.collection('knowledgeBase');

    // Apply userId filter (unless superadmin)
    if (ctx.userRole !== 'superadmin') {
      query = query.where('userId', '==', ctx.user.uid);
    }

    const snapshot = await query.get();

    const categories = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const category = doc.data().category;
      if (category) {
        categories.add(category);
      }
    });

    return Array.from(categories).sort();
  }),

  /**
   * Get all tags (for filtering)
   */
  getTags: adminProcedure.query(async ({ ctx }) => {
    let query: admin.firestore.Query = ctx.db.collection('knowledgeBase');

    // Apply userId filter (unless superadmin)
    if (ctx.userRole !== 'superadmin') {
      query = query.where('userId', '==', ctx.user.uid);
    }

    const snapshot = await query.get();

    const tagsSet = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const tags = doc.data().tags || [];
      tags.forEach((tag: string) => tagsSet.add(tag));
    });

    return Array.from(tagsSet).sort();
  }),
});

