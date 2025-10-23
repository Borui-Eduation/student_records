import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { createLogger } from '@professional-workspace/shared';

const logger = createLogger('notifications-router');
const db = getFirestore();

/**
 * Notifications Router
 * Handles FCM token management and push notification sending
 */
export const notificationsRouter = router({
  /**
   * Save FCM token for a user
   */
  saveToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1, 'Token is required'),
        deviceInfo: z.object({
          platform: z.enum(['ios', 'android', 'web']).optional(),
          userAgent: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.uid;
      const { token, deviceInfo } = input;

      try {
        // Save token to Firestore
        await db.collection('fcmTokens').doc(userId).set({
          token,
          userId,
          deviceInfo: deviceInfo || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true });

        logger.info('FCM token saved', { userId, tokenPrefix: token.substring(0, 20) });

        return {
          success: true,
          message: 'Token saved successfully',
        };
      } catch (error) {
        logger.error('Failed to save FCM token', error instanceof Error ? error : new Error(String(error)));
        throw new Error('Failed to save token');
      }
    }),

  /**
   * Delete FCM token for a user
   */
  deleteToken: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.uid;

    try {
      await db.collection('fcmTokens').doc(userId).delete();

      logger.info('FCM token deleted', { userId });

      return {
        success: true,
        message: 'Token deleted successfully',
      };
    } catch (error) {
      logger.error('Failed to delete FCM token', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to delete token');
    }
  }),

  /**
   * Get user's FCM token
   */
  getToken: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.uid;

    try {
      const doc = await db.collection('fcmTokens').doc(userId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        token: data?.token || null,
        deviceInfo: data?.deviceInfo || null,
        updatedAt: data?.updatedAt || null,
      };
    } catch (error) {
      logger.error('Failed to get FCM token', error instanceof Error ? error : new Error(String(error)));
      throw new Error('Failed to get token');
    }
  }),

  /**
   * Send push notification to a specific user
   * Only admins can send notifications
   */
  sendToUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().min(1, 'User ID is required'),
        title: z.string().min(1, 'Title is required'),
        body: z.string().min(1, 'Body is required'),
        data: z.record(z.string()).optional(),
        url: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'superadmin') {
        throw new Error('Unauthorized: Only admins can send notifications');
      }

      const { userId, title, body, data, url } = input;

      try {
        // Get user's FCM token
        const tokenDoc = await db.collection('fcmTokens').doc(userId).get();

        if (!tokenDoc.exists) {
          throw new Error('User does not have a registered FCM token');
        }

        const tokenData = tokenDoc.data();
        const token = tokenData?.token;

        if (!token) {
          throw new Error('Invalid FCM token');
        }

        // Send notification via FCM
        const message = {
          token,
          notification: {
            title,
            body,
          },
          data: {
            ...data,
            url: url || '/',
          },
          webpush: {
            fcmOptions: {
              link: url || '/',
            },
          },
        };

        const response = await getMessaging().send(message);

        logger.info('Push notification sent', { 
          userId, 
          title, 
          messageId: response 
        });

        return {
          success: true,
          message: 'Notification sent successfully',
          messageId: response,
        };
      } catch (error) {
        logger.error('Failed to send push notification', error instanceof Error ? error : new Error(String(error)));
        throw new Error(error instanceof Error ? error.message : 'Failed to send notification');
      }
    }),

  /**
   * Send push notification to all users
   * Only superadmins can broadcast
   */
  broadcast: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, 'Title is required'),
        body: z.string().min(1, 'Body is required'),
        data: z.record(z.string()).optional(),
        url: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is superadmin
      if (ctx.user.role !== 'superadmin') {
        throw new Error('Unauthorized: Only superadmins can broadcast notifications');
      }

      const { title, body, data, url } = input;

      try {
        // Get all FCM tokens
        const tokensSnapshot = await db.collection('fcmTokens').get();

        if (tokensSnapshot.empty) {
          return {
            success: true,
            message: 'No users to notify',
            sentCount: 0,
            failedCount: 0,
          };
        }

        const tokens: string[] = [];
        tokensSnapshot.forEach((doc) => {
          const tokenData = doc.data();
          if (tokenData.token) {
            tokens.push(tokenData.token);
          }
        });

        // Send multicast message
        const message = {
          notification: {
            title,
            body,
          },
          data: {
            ...data,
            url: url || '/',
          },
          tokens,
        };

        const response = await getMessaging().sendEachForMulticast(message);

        logger.info('Broadcast notification sent', {
          title,
          successCount: response.successCount,
          failureCount: response.failureCount,
        });

        return {
          success: true,
          message: `Broadcast sent to ${response.successCount} users`,
          sentCount: response.successCount,
          failedCount: response.failureCount,
        };
      } catch (error) {
        logger.error('Failed to broadcast notification', error instanceof Error ? error : new Error(String(error)));
        throw new Error('Failed to broadcast notification');
      }
    }),

  /**
   * Test notification endpoint
   */
  sendTest: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.uid;

    try {
      // Get user's FCM token
      const tokenDoc = await db.collection('fcmTokens').doc(userId).get();

      if (!tokenDoc.exists) {
        throw new Error('You need to enable push notifications first');
      }

      const tokenData = tokenDoc.data();
      const token = tokenData?.token;

      if (!token) {
        throw new Error('Invalid FCM token');
      }

      // Send test notification
      const message = {
        token,
        notification: {
          title: '🎉 Test Notification',
          body: 'If you see this, push notifications are working!',
        },
        data: {
          type: 'test',
          url: '/dashboard',
        },
      };

      const response = await getMessaging().send(message);

      logger.info('Test notification sent', { userId, messageId: response });

      return {
        success: true,
        message: 'Test notification sent successfully',
        messageId: response,
      };
    } catch (error) {
      logger.error('Failed to send test notification', error instanceof Error ? error : new Error(String(error)));
      throw new Error(error instanceof Error ? error.message : 'Failed to send test notification');
    }
  }),
});

