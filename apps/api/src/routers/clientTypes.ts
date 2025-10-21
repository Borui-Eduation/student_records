import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CreateClientTypeSchema, UpdateClientTypeSchema } from '@professional-workspace/shared';
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

      // CASCADE DELETE: Delete client type and all related entities
      const batch = ctx.db.batch();
      const now = admin.firestore.Timestamp.now();
      
      // Get all clients using this type
      const clientsSnapshot = await ctx.db
        .collection('clients')
        .where('clientTypeId', '==', input.id)
        .where('active', '==', true)
        .get();

      // Cascade delete all clients (which will cascade to their sessions, rates, etc.)
      // Note: We need to do this in multiple batches if there are many clients
      const clientIds: string[] = [];
      clientsSnapshot.docs.forEach(doc => {
        clientIds.push(doc.id);
        batch.update(doc.ref, cleanUndefinedValues({
          active: false,
          updatedAt: now,
        }));
      });

      // For each deleted client, also delete their related entities
      let totalSessions = 0;
      let totalRates = 0;
      let totalExpenses = 0;
      let totalInvoices = 0;

      for (const clientId of clientIds) {
        // Delete sessions for this client
        const sessionsSnapshot = await ctx.db
          .collection('sessions')
          .where('clientId', '==', clientId)
          .where('active', '==', true)
          .get();
        
        sessionsSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, cleanUndefinedValues({
            active: false,
            updatedAt: now,
          }));
        });
        totalSessions += sessionsSnapshot.size;

        // Delete rates for this client
        const clientRatesSnapshot = await ctx.db
          .collection('rates')
          .where('clientId', '==', clientId)
          .where('active', '==', true)
          .get();
        
        clientRatesSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, cleanUndefinedValues({
            active: false,
            updatedAt: now,
          }));
        });
        totalRates += clientRatesSnapshot.size;

        // Delete expenses for this client
        const expensesSnapshot = await ctx.db
          .collection('expenses')
          .where('clientId', '==', clientId)
          .where('active', '==', true)
          .get();
        
        expensesSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, cleanUndefinedValues({
            active: false,
            updatedAt: now,
          }));
        });
        totalExpenses += expensesSnapshot.size;

        // Delete invoices for this client
        const invoicesSnapshot = await ctx.db
          .collection('invoices')
          .where('clientId', '==', clientId)
          .where('active', '==', true)
          .get();
        
        invoicesSnapshot.docs.forEach(doc => {
          batch.update(doc.ref, cleanUndefinedValues({
            active: false,
            updatedAt: now,
          }));
        });
        totalInvoices += invoicesSnapshot.size;
      }

      // Delete rates that use this client type directly
      const typeRatesSnapshot = await ctx.db
        .collection('rates')
        .where('clientTypeId', '==', input.id)
        .where('active', '==', true)
        .get();
      
      typeRatesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, cleanUndefinedValues({
          active: false,
          updatedAt: now,
        }));
      });
      totalRates += typeRatesSnapshot.size;

      // Delete the client type itself
      batch.delete(docRef);

      // Commit all changes atomically
      await batch.commit();

      return { 
        success: true,
        cascadeDeleted: {
          clients: clientsSnapshot.size,
          sessions: totalSessions,
          rates: totalRates,
          expenses: totalExpenses,
          invoices: totalInvoices,
        }
      };
    }),
});
