import { initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  // Use US-WEST1 bucket for best performance in Vancouver
  const projectId = process.env.FIREBASE_PROJECT_ID || 'borui-education-c6666';
  const storageBucket = 'borui-education-c6666-storage-usw1'; // US-WEST1 region
  
  // For local development with signed URLs, use service account key
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const serviceAccountKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
    (isDevelopment ? require('path').join(__dirname, '../../../service-account-key.json') : undefined);
  
  console.log('🔥 Initializing Firebase Admin with:', {
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
      console.error('Token verification failed:', error);
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
async function getUserRole(uid: string, db: admin.firestore.Firestore): Promise<'user' | 'superadmin'> {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    return userDoc.data()?.role || 'user';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'user';
  }
}

/**
 * Admin procedure - requires authentication + admin check
 */
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // Check if user is admin (whitelist by email)
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim());

  if (!adminEmails.includes(ctx.user.email || '')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }

  // Get user role from Firestore
  const role = await getUserRole(ctx.user.uid, ctx.db);

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
    console.error('Audit log failed:', error);
  });

  return result;
});


