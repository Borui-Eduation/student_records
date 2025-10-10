import { router, adminProcedure, auditedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { UpdateCompanyProfileSchema } from '@student-record/shared';
import * as admin from 'firebase-admin';

export const companyProfileRouter = router({
  /**
   * Get company profile
   */
  get: adminProcedure.query(async ({ ctx }) => {
    // Each user has their own company profile (document ID is userId)
    const doc = await ctx.db.collection('companyProfile').doc(ctx.user.uid).get();

    if (!doc.exists) {
      // Return default empty profile (simplified - all fields optional)
      return {
        id: ctx.user.uid,
        companyName: '',
        address: '',
        email: ctx.user.email || '',
        phone: '',
        website: '',
      };
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  }),

  /**
   * Update company profile
   */
  update: auditedProcedure.input(UpdateCompanyProfileSchema).mutation(async ({ ctx, input }) => {
    // Each user has their own company profile (document ID is userId)
    const docRef = ctx.db.collection('companyProfile').doc(ctx.user.uid);

    const updateData = {
      ...input,
      updatedAt: admin.firestore.Timestamp.now(),
      updatedBy: ctx.user.uid,
    };

    await docRef.set(updateData, { merge: true });

    const updated = await docRef.get();
    return {
      id: updated.id,
      ...updated.data(),
    };
  }),
});

