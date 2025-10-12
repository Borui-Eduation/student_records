import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import * as admin from 'firebase-admin';
import { createLogger } from '@student-record/shared';

const logger = createLogger('trpc');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  // Use US-WEST1 bucket for best performance in Vancouver
  const projectId = process.env.FIREBASE_PROJECT_ID || 'borui-education-c6666';
  const storageBucket = 'borui-education-c6666-storage-usw1'; // US-WEST1 region
  
  // For local development with signed URLs, use service account key
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const serviceAccountKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    (isDevelopment ? require('path').join(__dirname, '../../../service-account-key.json') : undefined);
  
  logger.info('Initializing Firebase Admin', {
    projectId,
    storageBucket,
    region: 'us-west1',
    usingServiceAccountKey: !!serviceAccountKeyPath,
  });
  
  const credential = serviceAccountKeyPath && isDevelopment
    ? admin.credential.cert(serviceAccountKeyPath)
    : admin.credential.applicationDefault();
  
  admin.initializeApp({
    credential,
    projectId,
    storageBucket,
  });
}

/**
 * Create context for each request
 * This runs for every tRPC request
 */
export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  // Extract Firebase token from Authorization header
  const authHeader = req.headers.authorization;
  let user: admin.auth.DecodedIdToken | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      user = await admin.auth().verifyIdToken(token);
    } catch (error) {
      logger.warn('Token verification failed', { error: error instanceof Error ? error.message : String(error) });
      // Don't throw here, let procedures handle auth
    }
  }

  return {
    req,
    res,
    user,
    db: admin.firestore(),
    storage: admin.storage(),
    auth: admin.auth(),
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Type narrowing
    },
  });
});

/**
 * Helper function to get user role from Firestore
 */
async function getUserRole(uid: string, db: admin.firestore.Firestore): Promise<'user' | 'admin' | 'superadmin'> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.data()?.role || 'user';
  } catch (error) {
    logger.error('Error fetching user role', { uid }, error instanceof Error ? error : new Error(String(error)));
    return 'user';
  }
}

/**
 * Admin procedure - requires authentication + admin/superadmin role
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Get user role from Firestore
  const role = await getUserRole(ctx.user.uid, ctx.db);

  // Only allow admin and superadmin roles
  if (role !== 'admin' && role !== 'superadmin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      userRole: role,
    },
  });
});

/**
 * Middleware for audit logging
 */
export const auditedProcedure = adminProcedure.use(async ({ ctx, path, next }) => {
  const result = await next();

  // Log to Firestore audit logs (async, don't wait)
  ctx.db.collection('auditLogs').add({
    userId: ctx.user.uid,
    userEmail: ctx.user.email,
    action: path,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ipAddress: ctx.req.ip,
    userAgent: ctx.req.headers['user-agent'],
  }).catch((error) => {
    logger.error('Audit log failed', { userId: ctx.user.uid, path }, error instanceof Error ? error : new Error(String(error)));
  });

  return result;
});


