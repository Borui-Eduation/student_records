import { router } from '../trpc';
import { clientsRouter } from './clients';
import { ratesRouter } from './rates';
import { sessionsRouter } from './sessions';
import { invoicesRouter } from './invoices';
import { knowledgeBaseRouter } from './knowledgeBase';
import { sharingLinksRouter } from './sharingLinks';
import { companyProfileRouter } from './companyProfile';
import { healthRouter } from './health';

/**
 * Main tRPC application router
 * All feature routers are combined here
 */
export const appRouter = router({
  health: healthRouter,
  clients: clientsRouter,
  rates: ratesRouter,
  sessions: sessionsRouter,
  invoices: invoicesRouter,
  knowledgeBase: knowledgeBaseRouter,
  sharingLinks: sharingLinksRouter,
  companyProfile: companyProfileRouter,
});

export type AppRouter = typeof appRouter;

