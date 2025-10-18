import { router } from '../trpc';
import { usersRouter } from './users';
import { clientsRouter } from './clients';
import { clientTypesRouter } from './clientTypes';
import { ratesRouter } from './rates';
import { sessionsRouter } from './sessions';
import { sessionTypesRouter } from './sessionTypes';
import { invoicesRouter } from './invoices';
import { knowledgeBaseRouter } from './knowledgeBase';
import { sharingLinksRouter } from './sharingLinks';
import { companyProfileRouter } from './companyProfile';
import { healthRouter } from './health';
import { expensesRouter } from './expenses';
import { expenseCategoriesRouter } from './expenseCategories';
import { expenseExportRouter } from './expenseExport';
import { aiRouter } from './ai';

/**
 * Main tRPC application router
 * All feature routers are combined here
 */
export const appRouter = router({
  health: healthRouter,
  users: usersRouter,
  clients: clientsRouter,
  clientTypes: clientTypesRouter,
  rates: ratesRouter,
  sessions: sessionsRouter,
  sessionTypes: sessionTypesRouter,
  invoices: invoicesRouter,
  knowledgeBase: knowledgeBaseRouter,
  sharingLinks: sharingLinksRouter,
  companyProfile: companyProfileRouter,
  expenses: expensesRouter,
  expenseCategories: expenseCategoriesRouter,
  expenseExport: expenseExportRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;


