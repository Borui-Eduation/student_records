import { router, publicProcedure } from '../trpc';
import * as admin from 'firebase-admin';

export const healthRouter = router({
  /**
   * Health check endpoint
   */
  check: publicProcedure.query(async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }),

  /**
   * Detailed health check with Firebase connectivity
   */
  detailed: publicProcedure.query(async () => {
    const checks: Record<string, boolean> = {
      api: true,
      firestore: false,
      storage: false,
      auth: false,
    };

    try {
      // Check Firestore
      await admin.firestore().collection('_health').doc('check').get();
      checks.firestore = true;
    } catch (error) {
      console.error('Firestore health check failed:', error);
    }

    try {
      // Check Storage
      const bucket = admin.storage().bucket();
      await bucket.exists();
      checks.storage = true;
    } catch (error) {
      console.error('Storage health check failed:', error);
    }

    try {
      // Check Auth
      await admin.auth().listUsers(1);
      checks.auth = true;
    } catch (error) {
      console.error('Auth health check failed:', error);
    }

    const allHealthy = Object.values(checks).every((v) => v === true);

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString(),
    };
  }),
});

