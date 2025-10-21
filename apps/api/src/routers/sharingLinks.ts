import { router, adminProcedure, auditedProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CreateSharingLinkSchema } from '@professional-workspace/shared';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { cleanUndefinedValues } from '../services/firestoreHelpers';

export const sharingLinksRouter = router({
  /**
   * Create a sharing link for a session
   */
  create: auditedProcedure.input(CreateSharingLinkSchema).mutation(async ({ ctx, input }) => {
    const now = admin.firestore.Timestamp.now();

    // Verify session exists and user owns it
    const sessionDoc = await ctx.db.collection('sessions').doc(input.sessionId).get();
    if (!sessionDoc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Session not found',
      });
    }

    const sessionData = sessionDoc.data();

    // Check ownership (unless superadmin)
    if (ctx.userRole !== 'superadmin' && sessionData?.userId !== ctx.user.uid) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to share this session',
      });
    }

    // Generate secure token
    const token = nanoid(32); // 32-character random string

    // Calculate expiration date (default 90 days)
    const expiresInDays = input.expiresInDays || 90;
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiresInDays);

    const linkData = {
      userId: ctx.user.uid,
      token,
      sessionId: input.sessionId,
      createdAt: now,
      expiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
      revoked: false,
      accessCount: 0,
      createdBy: ctx.user.uid,
    };

    const docRef = await ctx.db.collection('sharingLinks').add(cleanUndefinedValues(linkData));

    return {
      id: docRef.id,
      ...linkData,
      url: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/share/${token}`,
    };
  }),

  /**
   * Get sharing link by token (public access)
   */
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      // Find sharing link by token
      const snapshot = await ctx.db
        .collection('sharingLinks')
        .where('token', '==', input.token)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sharing link not found',
        });
      }

      const linkDoc = snapshot.docs[0];
      const linkData = linkDoc.data();

      // Check if revoked
      if (linkData.revoked) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This sharing link has been revoked',
        });
      }

      // Check if expired
      const now = new Date();
      if (linkData.expiresAt.toDate() < now) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This sharing link has expired',
        });
      }

      // Update access tracking
      await linkDoc.ref.update(cleanUndefinedValues({
        lastAccessedAt: admin.firestore.Timestamp.now(),
        accessCount: admin.firestore.FieldValue.increment(1),
      }));

      // Get session data
      const sessionDoc = await ctx.db.collection('sessions').doc(linkData.sessionId).get();
      if (!sessionDoc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      const sessionData = sessionDoc.data()!;

      // Return session data (without sensitive billing info)
      return {
        session: {
          id: sessionDoc.id,
          clientName: sessionData.clientName,
          date: sessionData.date,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          durationHours: sessionData.durationHours,
          sessionType: sessionData.sessionType,
          contentBlocks: sessionData.contentBlocks,
        },
        link: {
          accessCount: linkData.accessCount + 1,
          expiresAt: linkData.expiresAt,
        },
      };
    }),

  /**
   * List all sharing links (admin)
   */
  list: adminProcedure
    .input(
      z.object({
        sessionId: z.string().optional(),
        includeRevoked: z.boolean().optional().default(false),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().optional(),
        viewAllUsers: z.boolean().optional(), // Super admin only
      })
    )
    .query(async ({ ctx, input }) => {
      let query: admin.firestore.Query = ctx.db.collection('sharingLinks');

      // Apply userId filter (unless superadmin with viewAllUsers flag)
      if (ctx.userRole !== 'superadmin' || !input.viewAllUsers) {
        query = query.where('userId', '==', ctx.user.uid);
      }

      // Filter by sessionId
      if (input.sessionId) {
        query = query.where('sessionId', '==', input.sessionId);
      }

      // Filter out revoked links unless requested
      if (!input.includeRevoked) {
        query = query.where('revoked', '==', false);
      }

      // Order by creation date descending
      query = query.orderBy('createdAt', 'desc');

      // Pagination
      if (input.cursor) {
        const cursorDoc = await ctx.db.collection('sharingLinks').doc(input.cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      }

      query = query.limit(input.limit || 50);

      const snapshot = await query.get();

      const items = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Get session info
          const sessionDoc = await ctx.db.collection('sessions').doc(data.sessionId).get();
          const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

          return {
            id: doc.id,
            ...data,
            url: `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/share/${data.token}`,
            sessionClientName: sessionData?.clientName || 'Unknown',
            sessionDate: sessionData?.date || null,
          };
        })
      );

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
   * Revoke a sharing link
   */
  revoke: auditedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const docRef = ctx.db.collection('sharingLinks').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sharing link not found',
        });
      }

      const data = doc.data();

      // Check ownership (unless superadmin)
      if (ctx.userRole !== 'superadmin' && data?.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to revoke this sharing link',
        });
      }

      await docRef.update(cleanUndefinedValues({
        revoked: true,
        revokedAt: admin.firestore.Timestamp.now(),
        revokedBy: ctx.user.uid,
      }));

      return { success: true };
    }),

  /**
   * Extend expiration of a sharing link
   */
  extend: adminProcedure
    .input(
      z.object({
        id: z.string(),
        additionalDays: z.number().min(1).max(365),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const docRef = ctx.db.collection('sharingLinks').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sharing link not found',
        });
      }

      const data = doc.data()!;

      // Check ownership (unless superadmin)
      if (ctx.userRole !== 'superadmin' && data.userId !== ctx.user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to extend this sharing link',
        });
      }

      const currentExpiration = data.expiresAt.toDate();
      const newExpiration = new Date(currentExpiration);
      newExpiration.setDate(newExpiration.getDate() + input.additionalDays);

      await docRef.update(cleanUndefinedValues({
        expiresAt: admin.firestore.Timestamp.fromDate(newExpiration),
        updatedAt: admin.firestore.Timestamp.now(),
      }));

      return {
        success: true,
        newExpiresAt: admin.firestore.Timestamp.fromDate(newExpiration),
      };
    }),

  /**
   * Delete a sharing link
   */
  delete: auditedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const docRef = ctx.db.collection('sharingLinks').doc(input.id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Sharing link not found',
        });
      }

      await docRef.delete();

      return { success: true };
    }),
});

