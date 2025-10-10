import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CreateSessionSchema, UpdateSessionSchema, ListSessionsSchema } from '@student-record/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';

export const sessionsRouter = router({
  /**
   * Create a new session
   */
  create: adminProcedure.input(CreateSessionSchema).mutation(async ({ ctx, input }) => {
    const now = admin.firestore.Timestamp.now();

    // Get client info
    const clientDoc = await ctx.db.collection('clients').doc(input.clientId).get();
    if (!clientDoc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client not found',
      });
    }

    const clientData = clientDoc.data();
    const clientName = clientData?.name || 'Unknown Client';

    // Calculate duration in hours
    const start = new Date(`2000-01-01T${input.startTime}`);
    const end = new Date(`2000-01-01T${input.endTime}`);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'End time must be after start time',
      });
    }

    // Get applicable rate for this client and session type
    // Priority: client-specific > client-type > general
    let applicableRate: any = null;

    // 1. Try client-specific rate
    const clientRates = await ctx.db
      .collection('rates')
      .where('clientId', '==', input.clientId)
      .where('effectiveDate', '<=', admin.firestore.Timestamp.fromDate(new Date(input.date)))
      .orderBy('effectiveDate', 'desc')
      .limit(1)
      .get();

    if (!clientRates.empty) {
      const rate = clientRates.docs[0];
      const rateData = rate.data();
      if (!rateData.endDate || rateData.endDate.toDate() >= new Date(input.date)) {
        applicableRate = { id: rate.id, ...rateData };
      }
    }

    // 2. Try client-type rate
    if (!applicableRate) {
      const typeRates = await ctx.db
        .collection('rates')
        .where('clientType', '==', clientData?.type)
        .where('effectiveDate', '<=', admin.firestore.Timestamp.fromDate(new Date(input.date)))
        .orderBy('effectiveDate', 'desc')
        .limit(1)
        .get();

      if (!typeRates.empty) {
        const rate = typeRates.docs[0];
        const rateData = rate.data();
        if (!rateData.endDate || rateData.endDate.toDate() >= new Date(input.date)) {
          applicableRate = { id: rate.id, ...rateData };
        }
      }
    }

    // 3. Try general rate (rates without clientId or clientType)
    if (!applicableRate) {
      const allRates = await ctx.db
        .collection('rates')
        .where('effectiveDate', '<=', admin.firestore.Timestamp.fromDate(new Date(input.date)))
        .orderBy('effectiveDate', 'desc')
        .get();

      // Filter for general rates (no clientId and no clientType)
      const generalRates = allRates.docs.filter((doc) => {
        const data = doc.data();
        return !data.clientId && !data.clientType;
      });

      if (generalRates.length > 0) {
        const rate = generalRates[0];
        const rateData = rate.data();
        if (!rateData.endDate || rateData.endDate.toDate() >= new Date(input.date)) {
          applicableRate = { id: rate.id, ...rateData };
        }
      }
    }

    if (!applicableRate) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No applicable rate found for this client and date',
      });
    }

    const totalAmount = durationHours * applicableRate.amount;

    const sessionData = {
      userId: ctx.user.uid,
      clientId: input.clientId,
      clientName,
      date: admin.firestore.Timestamp.fromDate(new Date(input.date)),
      startTime: input.startTime,
      endTime: input.endTime,
      durationHours,
      sessionType: input.sessionType,
      rateId: applicableRate.id,
      rateAmount: applicableRate.amount,
      totalAmount,
      currency: applicableRate.currency || 'CNY',
      billingStatus: 'unbilled' as const,
      contentBlocks: input.contentBlocks || [],
      notes: input.notes || '',
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.user.uid,
    };

    const docRef = await ctx.db.collection('sessions').add(sessionData);

    return {
      id: docRef.id,
      ...sessionData,
    };
  }),

  /**
   * Get a session by ID
   */
  get: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const doc = await ctx.db.collection('sessions').doc(input.id).get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    }

    const data = doc.data();

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this session',
      });
    }

    return {
      id: doc.id,
      ...data,
    };
  }),

  /**
   * List sessions with filtering
   */
  list: adminProcedure.input(ListSessionsSchema.extend({
    viewAllUsers: z.boolean().optional(), // Super admin only
  })).query(async ({ ctx, input }) => {
    let query: admin.firestore.Query = ctx.db.collection('sessions');

    // Apply userId filter (unless superadmin with viewAllUsers flag)
    if (ctx.userRole !== 'superadmin' || !input.viewAllUsers) {
      query = query.where('userId', '==', ctx.user.uid);
    }

    // Filter by clientId
    if (input.clientId) {
      query = query.where('clientId', '==', input.clientId);
    }

    // Filter by billingStatus
    if (input.billingStatus) {
      query = query.where('billingStatus', '==', input.billingStatus);
    }

    // Filter by sessionType
    if (input.sessionType) {
      query = query.where('sessionType', '==', input.sessionType);
    }

    // Filter by date range
    if (input.dateRange) {
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.start)))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.end)));
    }

    // Order by date descending
    query = query.orderBy('date', 'desc');

    // Pagination
    if (input.cursor) {
      const cursorDoc = await ctx.db.collection('sessions').doc(input.cursor).get();
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
   * Update a session
   */
  update: adminProcedure.input(UpdateSessionSchema).mutation(async ({ ctx, input }) => {
    const { id, ...updates } = input;

    const docRef = ctx.db.collection('sessions').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    }

    const sessionData = doc.data();

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && sessionData?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this session',
      });
    }

    const updateData: any = {
      ...updates,
      updatedAt: admin.firestore.Timestamp.now(),
    };

    // Recalculate duration if times changed
    if (updates.startTime || updates.endTime) {
      const sessionData = doc.data();
      const startTime = updates.startTime || sessionData?.startTime;
      const endTime = updates.endTime || sessionData?.endTime;

      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      if (durationHours <= 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'End time must be after start time',
        });
      }

      updateData.durationHours = durationHours;
      updateData.totalAmount = durationHours * sessionData?.rateAmount;
    }

    if (updates.date) {
      updateData.date = admin.firestore.Timestamp.fromDate(new Date(updates.date));
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    return {
      id: updated.id,
      ...updated.data(),
    };
  }),

  /**
   * Delete a session
   */
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const docRef = ctx.db.collection('sessions').doc(input.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    }

    const sessionData = doc.data();

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && sessionData?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this session',
      });
    }

    // Don't allow deletion if already billed
    if (sessionData?.billingStatus === 'billed' || sessionData?.billingStatus === 'paid') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot delete a session that has been billed or paid',
      });
    }

    await docRef.delete();

    return { success: true };
  }),

});

