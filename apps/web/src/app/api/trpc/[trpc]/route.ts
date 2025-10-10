// This endpoint is not needed - the frontend connects directly to the backend API
// If you need to proxy requests, configure it in next.config.js rewrites
// For now, return a 404 or redirect to the actual API

export async function GET() {
  return new Response('tRPC endpoint not configured. Use NEXT_PUBLIC_API_URL to connect to backend.', {
    status: 404,
  });
}

export async function POST() {
  return new Response('tRPC endpoint not configured. Use NEXT_PUBLIC_API_URL to connect to backend.', {
    status: 404,
  });
}


