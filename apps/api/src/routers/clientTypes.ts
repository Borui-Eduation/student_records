import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CreateClientTypeSchema, UpdateClientTypeSchema } from '@student-record/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { cleanUndefinedValues } from '../services/firestoreHelpers';

export const clientTypesRouter = router({
  /**
   * Create a new client type
   */
  create: adminProcedure
    .input(CreateClientTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const now = admin.firestore.Timestamp.now();

      const clientTypeData = {
        ...input,
        userId: ctx.user.uid,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await ctx.db.collection('clientTypes').add(cleanUndefinedValues(clientTypeData));

      return {
        id: docRef.id,
        ...clientTypeData,
      };
    }),

  /**
   * List all client types for the current user
   */
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query: admin.firestore.Query = ctx.db.collection('clientTypes');

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
   * Get a client type by ID
   */
  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.collection('clientTypes').doc(input.id).get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client type not found',
        });
      }

      const data = doc.data();

      // Check ownership
      if (data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this client type',
        });
      }

      return {
        id: doc.id,
        ...data,
      };
    }),

  /**
   * Update a client type
   */
  update: adminProcedure
    .input(UpdateClientTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const docRef = ctx.db.collection('clientTypes').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client type not found',
        });
      }

      const data = doc.data();

      // Check ownership
      if (data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this client type',
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
   * Delete a client type
   */
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const docRef = ctx.db.collection('clientTypes').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client type not found',
        });
      }

      const data = doc.data();

      // Check ownership
      if (data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this client type',
        });
      }

      // Check if client type is in use
      const clientsInUse = await ctx.db
        .collection('clients')
        .where('clientTypeId', '==', input.id)
        .limit(1)
        .get();

      if (!clientsInUse.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete client type that is in use by clients',
        });
      }

      // Check if rates use this client type
      const ratesInUse = await ctx.db
        .collection('rates')
        .where('clientTypeId', '==', input.id)
        .limit(1)
        .get();

      if (!ratesInUse.empty) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot delete client type that is in use by rates',
        });
      }

      await docRef.delete();

      return { success: true };
    }),
});
