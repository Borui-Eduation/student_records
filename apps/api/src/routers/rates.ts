import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CreateRateSchema, UpdateRateSchema } from '@student-record/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';

export const ratesRouter = router({
  /**
   * Create a new rate
   */
  create: adminProcedure.input(CreateRateSchema).mutation(async ({ ctx, input }) => {
    const now = admin.firestore.Timestamp.now();

    const rateData = {
      ...input,
      userId: ctx.user.uid,
      currency: input.currency || 'CNY',
      effectiveDate:
        typeof input.effectiveDate === 'string'
          ? admin.firestore.Timestamp.fromDate(new Date(input.effectiveDate))
          : admin.firestore.Timestamp.fromDate(input.effectiveDate),
      endDate: input.endDate
        ? typeof input.endDate === 'string'
          ? admin.firestore.Timestamp.fromDate(new Date(input.endDate))
          : admin.firestore.Timestamp.fromDate(input.endDate)
        : null,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.user.uid,
    };

    const docRef = await ctx.db.collection('rates').add(rateData);

    // If clientId is provided, add this rate to client's defaultRateIds
    if (input.clientId) {
      const clientRef = ctx.db.collection('clients').doc(input.clientId);
      const clientDoc = await clientRef.get();

      if (clientDoc.exists) {
        const defaultRateIds = clientDoc.data()?.defaultRateIds || [];
        await clientRef.update({
          defaultRateIds: [...defaultRateIds, docRef.id],
          updatedAt: now,
        });
      }
    }

    return {
      id: docRef.id,
      ...rateData,
    };
  }),

  /**
   * List rates with optional filtering
   */
  list: adminProcedure
    .input(
      z.object({
        clientId: z.string().optional(),
        clientTypeId: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
        viewAllUsers: z.boolean().optional(), // Super admin only
      })
    )
    .query(async ({ ctx, input }) => {
      let query: admin.firestore.Query = ctx.db.collection('rates');

      // Apply userId filter (unless superadmin with viewAllUsers flag)
      if (ctx.userRole !== 'superadmin' || !input.viewAllUsers) {
        query = query.where('userId', '==', ctx.user.uid);
      }

      // Filter by clientId
      if (input.clientId) {
        query = query.where('clientId', '==', input.clientId);
      }

      // Filter by clientTypeId
      if (input.clientTypeId) {
        query = query.where('clientTypeId', '==', input.clientTypeId);
      }

      // Order by effectiveDate descending (most recent first)
      query = query.orderBy('effectiveDate', 'desc');

      // Pagination
      if (input.cursor) {
        const cursorDoc = await ctx.db.collection('rates').doc(input.cursor).get();
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
        nextCursor:
          snapshot.docs.length === input.limit
            ? snapshot.docs[snapshot.docs.length - 1].id
            : undefined,
        hasMore: snapshot.docs.length === input.limit,
        total: items.length,
      };
    }),

  /**
   * Get rates for a specific client
   */
  getByClient: adminProcedure.input(z.object({ clientId: z.string() })).query(async ({ ctx, input }) => {
    let query: admin.firestore.Query = ctx.db
      .collection('rates')
      .where('clientId', '==', input.clientId);

    // Apply userId filter (unless superadmin)
    if (ctx.userRole !== 'superadmin') {
      query = query.where('userId', '==', ctx.user.uid);
    }

    const snapshot = await query.orderBy('effectiveDate', 'desc').get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }),

  /**
   * Update a rate
   */
  update: adminProcedure.input(UpdateRateSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;

    const docRef = ctx.db.collection('rates').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Rate not found',
      });
    }

    const data = doc.data();

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this rate',
      });
    }

    const updateData: any = {
      ...updates,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    if (updates.endDate) {
      updateData.endDate =
        typeof updates.endDate === 'string'
          ? admin.firestore.Timestamp.fromDate(new Date(updates.endDate))
          : admin.firestore.Timestamp.fromDate(updates.endDate);
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    return {
      id: updated.id,
      ...updated.data(),
    };
  }),

  /**
   * Delete a rate (soft delete by setting end date)
   */
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const docRef = ctx.db.collection('rates').doc(input.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Rate not found',
      });
    }

    const data = doc.data();

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this rate',
      });
    }

    // Soft delete by setting end date to now
    await docRef.update({
      endDate: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return { success: true };
  }),
});

