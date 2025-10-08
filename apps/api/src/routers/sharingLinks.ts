import { router, adminProcedure, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const sharingLinksRouter = router({
  create: adminProcedure.mutation(async () => {
    throw new TRPCError({ code: 'NOT_IMPLEMENTED' });
  }),
  getByToken: publicProcedure.query(async () => {
    throw new TRPCError({ code: 'NOT_IMPLEMENTED' });
  }),
});

