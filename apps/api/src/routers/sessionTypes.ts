import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CreateSessionTypeSchema, UpdateSessionTypeSchema } from '@student-record/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { cleanUndefinedValues } from '../services/firestoreHelpers';

export const sessionTypesRouter = router({
  /**
   * Create a new session type
   */
  create: adminProcedure
    .input(CreateSessionTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const now = admin.firestore.Timestamp.now();

      const sessionTypeData = {
        ...input,
        userId: ctx.user.uid,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await ctx.db.collection('sessionTypes').add(cleanUndefinedValues(sessionTypeData));

      return {
        id: docRef.id,
        ...sessionTypeData,
      };
    }),

  /**
   * List all session types for the current user
   */
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query: admin.firestore.Query = ctx.db.collection('sessionTypes');

      // Filter by userId
      query = query.where('userId', '==', ctx.user.uid);

      // Get all documents (we'll sort in memory)
      const snapshot = await query.get();

      // Sort by createdAt descending in memory
      const allItems = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });

      // Apply pagination
      const startIdx = 0;
      const items = allItems.slice(startIdx, startIdx + (input.limit || 50));

      return {
        items,
        nextCursor: items.length === (input.limit || 50) ? items[items.length - 1].id : undefined,
        hasMore: allItems.length > startIdx + (input.limit || 50),
        total: items.length,
      };
    }),

  /**
   * Get a session type by ID
   */
  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.collection('sessionTypes').doc(input.id).get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session type not found',
        });
      }

      const data = doc.data();

      // Check ownership
      if (data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this session type',
        });
      }

      return {
        id: doc.id,
        ...data,
      };
    }),

  /**
   * Update a session type
   */
  update: adminProcedure
    .input(UpdateSessionTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const docRef = ctx.db.collection('sessionTypes').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session type not found',
        });
      }

      const data = doc.data();

      // Check ownership
      if (data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this session type',
        });
      }

      await docRef.update(cleanUndefinedValues({
        ...updates,
        updatedAt: admin.firestore.Timestamp.now(),
      }));

      const updated = await docRef.get();
      return {
        id: updated.id,
        ...updated.data(),
      };
    }),

  /**
   * Delete a session type
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const docRef = ctx.db.collection('sessionTypes').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session type not found',
        });
      }

      const data = doc.data();

      // Check ownership
      if (data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this session type',
        });
      }

      // CASCADE DELETE: Delete session type and soft delete all related sessions
      const batch = ctx.db.batch();
      const now = admin.firestore.Timestamp.now();
      
      // Get all sessions using this type
      const sessionsSnapshot = await ctx.db
        .collection('sessions')
        .where('sessionTypeId', '==', input.id)
        .where('active', '==', true)
        .get();

      // Soft delete all related sessions
      sessionsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, cleanUndefinedValues({
          active: false,
          updatedAt: now,
        }));
      });

      // Delete the session type itself
      batch.delete(docRef);

      // Commit all changes atomically
      await batch.commit();

      return { 
        success: true,
        cascadeDeleted: {
          sessions: sessionsSnapshot.size,
        }
      };
    }),
});
