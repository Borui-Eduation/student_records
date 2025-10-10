import { router, adminProcedure, auditedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { GenerateInvoiceSchema, UpdateInvoiceStatusSchema, GetRevenueReportSchema } from '@student-record/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';

export const invoicesRouter = router({
  /**
   * Generate invoice from selected sessions
   */
  generate: auditedProcedure.input(GenerateInvoiceSchema).mutation(async ({ ctx, input }) => {
    const now = admin.firestore.Timestamp.now();

    // Fetch all selected sessions
    const sessionRefs = input.sessionIds.map((id) => ctx.db.collection('sessions').doc(id));
    const sessionDocs = await Promise.all(sessionRefs.map((ref) => ref.get()));

    // Validate all sessions exist and belong to same client
    const sessions = sessionDocs.map((doc) => {
      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Session ${doc.id} not found`,
        });
      }
      return { id: doc.id, ...doc.data() };
    });

    // Check all sessions belong to same client
    const clientIds = new Set(sessions.map((s: any) => s.clientId));
    if (clientIds.size !== 1) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'All sessions must belong to the same client',
      });
    }

    const clientId = (sessions[0] as any).clientId;
    const clientName = (sessions[0] as any).clientName;

    // Check all sessions are unbilled
    const billedSessions = sessions.filter(
      (s: any) => s.billingStatus !== 'unbilled'
    );
    if (billedSessions.length > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Some sessions have already been billed',
      });
    }

    // Get next invoice number
    const counterRef = ctx.db.collection('_counters').doc('invoices');
    const counterDoc = await counterRef.get();
    let nextNumber = 1;

    if (counterDoc.exists) {
      nextNumber = (counterDoc.data()?.current || 0) + 1;
    }

    // Create invoice number (INV-001 format)
    const invoiceNumber = `INV-${String(nextNumber).padStart(3, '0')}`;

    // Calculate billing period
    const sessionDates = sessions.map((s: any) => s.date.toDate());
    const billingPeriodStart = new Date(Math.min(...sessionDates.map((d: Date) => d.getTime())));
    const billingPeriodEnd = new Date(Math.max(...sessionDates.map((d: Date) => d.getTime())));

    // Create line items
    const lineItems = sessions.map((session: any) => ({
      sessionId: session.id,
      serviceDate: session.date,
      description: `${session.sessionType === 'education' ? 'Education' : 'Technical'} Session - ${session.durationHours}h`,
      hours: session.durationHours,
      hourlyRate: session.rateAmount,
      subtotal: session.totalAmount,
    }));

    // Calculate totals
    const subtotal = sessions.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
    const taxAmount = 0; // Tax calculation can be added later
    const totalAmount = subtotal + taxAmount;
    const currency = (sessions[0] as any).currency || 'CNY';

    // Create invoice
    const invoiceData = {
      userId: ctx.user.uid,
      invoiceNumber,
      clientId,
      clientName,
      issueDate: now,
      billingPeriodStart: admin.firestore.Timestamp.fromDate(billingPeriodStart),
      billingPeriodEnd: admin.firestore.Timestamp.fromDate(billingPeriodEnd),
      lineItems,
      subtotal,
      taxAmount,
      totalAmount,
      currency,
      status: 'draft' as const,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.user.uid,
    };

    const invoiceRef = await ctx.db.collection('invoices').add(invoiceData);

    // Update counter
    await counterRef.set({ current: nextNumber }, { merge: true });

    // Update all sessions to billed status
    const batch = ctx.db.batch();
    sessionRefs.forEach((ref) => {
      batch.update(ref, {
        billingStatus: 'billed',
        invoiceId: invoiceRef.id,
        updatedAt: now,
      });
    });
    await batch.commit();

    return {
      id: invoiceRef.id,
      ...invoiceData,
    };
  }),

  /**
   * Get an invoice by ID
   */
  get: adminProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const doc = await ctx.db.collection('invoices').doc(input.id).get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invoice not found',
      });
    }

    const data = doc.data();

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this invoice',
      });
    }

    return {
      id: doc.id,
      ...data,
    };
  }),

  /**
   * List invoices with filtering
   */
  list: adminProcedure
    .input(
      z.object({
        clientId: z.string().optional(),
        status: z.enum(['draft', 'sent', 'paid']).optional(),
        dateRange: z
          .object({
            start: z.string().or(z.date()),
            end: z.string().or(z.date()),
          })
          .optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
        viewAllUsers: z.boolean().optional(), // Super admin only
      })
    )
    .query(async ({ ctx, input }) => {
      let query: admin.firestore.Query = ctx.db.collection('invoices');

      // Apply userId filter (unless superadmin with viewAllUsers flag)
      if (ctx.userRole !== 'superadmin' || !input.viewAllUsers) {
        query = query.where('userId', '==', ctx.user.uid);
      }

      // Filter by clientId
      if (input.clientId) {
        query = query.where('clientId', '==', input.clientId);
      }

      // Filter by status
      if (input.status) {
        query = query.where('status', '==', input.status);
      }

      // Filter by date range
      if (input.dateRange) {
        query = query
          .where('issueDate', '>=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.start)))
          .where('issueDate', '<=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.end)));
      }

      // Order by issue date descending
      query = query.orderBy('issueDate', 'desc');

      // Pagination
      if (input.cursor) {
        const cursorDoc = await ctx.db.collection('invoices').doc(input.cursor).get();
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
   * Update invoice status
   */
  updateStatus: auditedProcedure
    .input(UpdateInvoiceStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status, paidDate, paymentNotes } = input;

      const docRef = ctx.db.collection('invoices').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      const invoiceData = doc.data();

      // Check ownership (unless superadmin)
      if (ctx.userRole !== 'superadmin' && invoiceData?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this invoice',
        });
      }

      const updateData: any = {
        status,
        updatedAt: admin.firestore.Timestamp.now(),
      };

      if (paidDate) {
        updateData.paidDate = admin.firestore.Timestamp.fromDate(new Date(paidDate));
      }

      if (paymentNotes) {
        updateData.paymentNotes = paymentNotes;
      }

      // If marking as paid, update all associated sessions
      if (status === 'paid') {
        const sessionIds = invoiceData?.lineItems.map((item: any) => item.sessionId) || [];

        const batch = ctx.db.batch();
        for (const sessionId of sessionIds) {
          const sessionRef = ctx.db.collection('sessions').doc(sessionId);
          batch.update(sessionRef, {
            billingStatus: 'paid',
            updatedAt: admin.firestore.Timestamp.now(),
          });
        }
        await batch.commit();
      }

      await docRef.update(updateData);

      const updated = await docRef.get();
      return {
        id: updated.id,
        ...updated.data(),
      };
    }),

  /**
   * Delete an invoice (only if draft)
   */
  delete: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const docRef = ctx.db.collection('invoices').doc(input.id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Invoice not found',
      });
    }

    const invoiceData = doc.data();

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && invoiceData?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this invoice',
      });
    }

    // Only allow deletion if draft
    if (invoiceData?.status !== 'draft') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Can only delete draft invoices',
      });
    }

    // Revert sessions to unbilled
    const sessionIds = invoiceData.lineItems.map((item: any) => item.sessionId);
    const batch = ctx.db.batch();
    for (const sessionId of sessionIds) {
      const sessionRef = ctx.db.collection('sessions').doc(sessionId);
      batch.update(sessionRef, {
        billingStatus: 'unbilled',
        invoiceId: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }
    await batch.commit();

    await docRef.delete();

    return { success: true };
  }),

  /**
   * Get revenue report
   */
  getRevenueReport: adminProcedure
    .input(GetRevenueReportSchema.extend({
      viewAllUsers: z.boolean().optional(), // Super admin only
    }))
    .query(async ({ ctx, input }) => {
      let query: admin.firestore.Query = ctx.db.collection('sessions');

      // Apply userId filter (unless superadmin with viewAllUsers flag)
      if (ctx.userRole !== 'superadmin' || !input.viewAllUsers) {
        query = query.where('userId', '==', ctx.user.uid);
      }

      // Filter by date range
      query = query
        .where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.start)))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(input.dateRange.end)));

      // Filter by clientId if provided
      if (input.clientId) {
        query = query.where('clientId', '==', input.clientId);
      }

      // Filter by sessionType if provided
      if (input.sessionType) {
        query = query.where('sessionType', '==', input.sessionType);
      }

      const snapshot = await query.get();
      const sessions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Calculate statistics
      const totalRevenue = sessions.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
      const totalHours = sessions.reduce((sum: number, s: any) => sum + s.durationHours, 0);
      const sessionCount = sessions.length;

      const unbilledRevenue = sessions
        .filter((s: any) => s.billingStatus === 'unbilled')
        .reduce((sum: number, s: any) => sum + s.totalAmount, 0);

      const billedRevenue = sessions
        .filter((s: any) => s.billingStatus === 'billed')
        .reduce((sum: number, s: any) => sum + s.totalAmount, 0);

      const paidRevenue = sessions
        .filter((s: any) => s.billingStatus === 'paid')
        .reduce((sum: number, s: any) => sum + s.totalAmount, 0);

      // Group by client
      const byClient: Record<string, any> = {};
      sessions.forEach((session: any) => {
        if (!byClient[session.clientId]) {
          byClient[session.clientId] = {
            clientId: session.clientId,
            clientName: session.clientName,
            revenue: 0,
            hours: 0,
            sessionCount: 0,
          };
        }
        byClient[session.clientId].revenue += session.totalAmount;
        byClient[session.clientId].hours += session.durationHours;
        byClient[session.clientId].sessionCount += 1;
      });

      return {
        totalRevenue,
        totalHours,
        sessionCount,
        unbilledRevenue,
        billedRevenue,
        paidRevenue,
        averageRate: totalHours > 0 ? totalRevenue / totalHours : 0,
        byClient: Object.values(byClient),
      };
    }),
});

