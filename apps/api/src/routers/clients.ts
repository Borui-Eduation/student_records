import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import {
  CreateClientSchema,
  UpdateClientSchema,
  ListClientsSchema,
} from '@student-record/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { cleanUndefinedValues } from '../services/firestoreHelpers';

export const clientsRouter = router({
  /**
   * Create a new client
   */
  create: adminProcedure
    .input(CreateClientSchema)
    .mutation(async ({ ctx, input }) => {
      const now = admin.firestore.Timestamp.now();

      const clientData = {
        ...input,
        userId: ctx.user.uid,
        active: true,
        defaultRateIds: [],
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.user.uid,
      };

      const docRef = await ctx.db.collection('clients').add(cleanUndefinedValues(clientData));

      return {
        id: docRef.id,
        ...clientData,
      };
    }),

  /**
   * Get a client by ID
   */
  get: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const doc = await ctx.db.collection('clients').doc(input.id).get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      const data = doc.data();

      // Check ownership (unless superadmin)
      if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this client',
        });
      }

      return {
        id: doc.id,
        ...data,
      };
    }),

  /**
   * List clients with filtering
   */
  list: adminProcedure
    .input(ListClientsSchema.extend({
      viewAllUsers: z.boolean().optional(), // Super admin only
    }))
    .query(async ({ ctx, input }) => {
      let query: admin.firestore.Query = ctx.db.collection('clients');

      // Apply userId filter (unless superadmin with viewAllUsers flag)
      if (ctx.userRole !== 'superadmin' || !input.viewAllUsers) {
        query = query.where('userId', '==', ctx.user.uid);
      }

      // Apply filters
      if (input.clientTypeId) {
        query = query.where('clientTypeId', '==', input.clientTypeId);
      }

      if (input.active !== undefined) {
        query = query.where('active', '==', input.active);
      }

      // Search by name (case-insensitive prefix match)
      if (input.search) {
        const searchUpper = input.search.charAt(0).toUpperCase() + input.search.slice(1);
        query = query
          .where('name', '>=', searchUpper)
          .where('name', '<=', searchUpper + '\uf8ff');
      }

      // Order by name
      query = query.orderBy('name', 'asc');

      // Pagination
      if (input.cursor) {
        const cursorDoc = await ctx.db.collection('clients').doc(input.cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      query = query.limit(input.limit || 50);

      const snapshot = await query.get();

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        items,
        nextCursor: snapshot.docs.length === input.limit ? snapshot.docs[snapshot.docs.length - 1].id : undefined,
        hasMore: snapshot.docs.length === input.limit,
        total: items.length,
      };
    }),

  /**
   * Update a client
   */
  update: adminProcedure
    .input(UpdateClientSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const docRef = ctx.db.collection('clients').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      const data = doc.data();

      // Check ownership (unless superadmin)
      if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this client',
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
   * Delete (deactivate) a client
   */
  delete: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const docRef = ctx.db.collection('clients').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Client not found',
        });
      }

      const data = doc.data();

      // Check ownership (unless superadmin)
      if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this client',
        });
      }

      // CASCADE DELETE: Soft delete client and all related entities
      const batch = ctx.db.batch();
      const now = admin.firestore.Timestamp.now();
      
      // 1. Soft delete the client
      batch.update(docRef, cleanUndefinedValues({
        active: false,
        updatedAt: now,
      }));

      // 2. Cascade delete: Soft delete all related sessions
      const sessionsSnapshot = await ctx.db
        .collection('sessions')
        .where('clientId', '==', input.id)
        .where('active', '==', true)
        .get();
      
      sessionsSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, cleanUndefinedValues({
          active: false,
          updatedAt: now,
        }));
      });

      // 3. Cascade delete: Soft delete all related rates
      const ratesSnapshot = await ctx.db
        .collection('rates')
        .where('clientId', '==', input.id)
        .where('active', '==', true)
        .get();
      
      ratesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, cleanUndefinedValues({
          active: false,
          updatedAt: now,
        }));
      });

      // 4. Cascade delete: Soft delete all related expenses (if linked to client)
      const expensesSnapshot = await ctx.db
        .collection('expenses')
        .where('clientId', '==', input.id)
        .where('active', '==', true)
        .get();
      
      expensesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, cleanUndefinedValues({
          active: false,
          updatedAt: now,
        }));
      });

      // 5. Cascade delete: Soft delete invoices that reference this client
      const invoicesSnapshot = await ctx.db
        .collection('invoices')
        .where('clientId', '==', input.id)
        .where('active', '==', true)
        .get();
      
      invoicesSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, cleanUndefinedValues({
          active: false,
          updatedAt: now,
        }));
      });

      // Commit all changes atomically
      await batch.commit();

      return { 
        success: true,
        cascadeDeleted: {
          sessions: sessionsSnapshot.size,
          rates: ratesSnapshot.size,
          expenses: expensesSnapshot.size,
          invoices: invoicesSnapshot.size,
        }
      };
    }),
});


