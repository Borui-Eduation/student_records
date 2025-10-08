import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../api/src/routers/_app';
import { getAuth } from 'firebase/auth';

export const trpc = createTRPCReact<AppRouter>();

/**
 * Create tRPC client with Firebase auth token injection
 */
export function getTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        async headers() {
          const auth = getAuth();
          const user = auth.currentUser;

          if (user) {
            const token = await user.getIdToken();
            return {
              authorization: `Bearer ${token}`,
            };
          }

          return {};
        },
      }),
    ],
  });
}

