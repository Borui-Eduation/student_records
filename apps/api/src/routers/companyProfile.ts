import { router, adminProcedure, auditedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { UpdateCompanyProfileSchema } from '@student-record/shared';
import * as admin from 'firebase-admin';

export const companyProfileRouter = router({
  /**
   * Get company profile
   */
  get: adminProcedure.query(async ({ ctx }) => {
    const doc = await ctx.db.collection('companyProfile').doc('default').get();

    if (!doc.exists) {
      // Return default empty profile
      return {
        id: 'default',
        companyName: '',
        taxId: '',
        address: '',
        bankInfo: {
          bankName: '',
          accountNumber: '',
          accountName: '',
        },
        contactInfo: {
          email: '',
          phone: '',
        },
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
    const docRef = ctx.db.collection('companyProfile').doc('default');

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

