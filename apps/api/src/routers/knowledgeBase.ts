import { router, adminProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

export const knowledgeBaseRouter = router({
  create: adminProcedure.mutation(async () => {
    throw new TRPCError({ code: 'NOT_IMPLEMENTED' });
  }),
  list: adminProcedure.query(async () => {
    return { items: [], hasMore: false };
  }),
});

