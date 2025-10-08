import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const companyProfileRouter = router({
  get: adminProcedure.query(async () => {
    throw new TRPCError({ code: 'NOT_IMPLEMENTED' });
  }),
  update: adminProcedure.mutation(async () => {
    throw new TRPCError({ code: 'NOT_IMPLEMENTED' });
  }),
});

