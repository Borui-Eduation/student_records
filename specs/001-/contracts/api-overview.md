# API Contracts Overview

**API Type:** tRPC (Type-Safe RPC)  
**Base URL:** `http://localhost:8080/trpc` (dev) | `https://your-api.run.app/trpc` (prod)  
**Authentication:** Firebase ID Token (Bearer token in headers)

---

## Authentication

All API calls require Firebase Authentication ID token:

```typescript
// Client-side (automatically handled by tRPC client)
const token = await firebase.auth().currentUser?.getIdToken();

// Included in headers
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## tRPC Routers

The API is organized into the following routers:

| Router | Path | Purpose |
|--------|------|---------|
| `clients` | `/trpc/clients.*` | Client management (CRUD operations) |
| `rates` | `/trpc/rates.*` | Rate configuration |
| `sessions` | `/trpc/sessions.*` | Session recording and management |
| `invoices` | `/trpc/invoices.*` | Invoice generation and financial reporting |
| `knowledge` | `/trpc/knowledge.*` | Knowledge base and encryption |
| `sharing` | `/trpc/sharing.*` | Sharing link management |
| `company` | `/trpc/company.*` | Company profile management |

---

## Detailed Router Documentation

- [Clients Router](./clients-router.md) - Client and rate management
- [Sessions Router](./sessions-router.md) - Session recording with rich media
- [Invoices Router](./invoices-router.md) - Invoicing and financial reports
- [Knowledge Router](./knowledge-router.md) - Encrypted knowledge base
- [Sharing Router](./sharing-router.md) - Secure sharing links

---

## Type Safety

All requests and responses are fully typed:

```typescript
// Frontend usage (fully typed)
import { trpc } from '@/lib/trpc';

// Create client - TypeScript knows exact input/output types
const client = await trpc.clients.create.mutate({
  name: '王小明',
  type: 'individual',  // Type-checked: must be 'individual' | 'institution' | 'project'
  contactInfo: {
    email: 'wang@example.com',  // Type-checked: must be valid email format
  }
});

// client.id is string
// client.name is string
// client.type is 'individual' | 'institution' | 'project'
// etc. - all fully typed!
```

---

## Error Handling

### Error Response Format

```typescript
interface TRPCError {
  code: string;        // 'UNAUTHORIZED', 'BAD_REQUEST', 'NOT_FOUND', etc.
  message: string;     // Human-readable error message
  data?: {
    zodError?: any;    // Zod validation errors if input validation failed
  };
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated or invalid token |
| `FORBIDDEN` | 403 | Authenticated but not authorized (not admin) |
| `BAD_REQUEST` | 400 | Invalid input (Zod validation failed) |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

### Example Error Handling

```typescript
try {
  const client = await trpc.clients.getById.query('invalid-id');
} catch (error) {
  if (error.data?.code === 'NOT_FOUND') {
    console.log('Client not found');
  } else if (error.data?.code === 'UNAUTHORIZED') {
    console.log('Please log in');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

---

## Pagination

List endpoints support cursor-based pagination:

```typescript
interface PaginationInput {
  limit?: number;      // Items per page (default: 50, max: 100)
  cursor?: string;     // Cursor for next page
}

interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string; // Cursor for next page (null if last page)
  hasMore: boolean;    // Whether there are more items
}

// Example usage
const result = await trpc.clients.list.query({
  limit: 20,
  cursor: undefined  // First page
});

// Get next page
const nextPage = await trpc.clients.list.query({
  limit: 20,
  cursor: result.nextCursor
});
```

---

## File Uploads

File uploads use presigned URLs:

### Upload Flow

1. **Request upload URL:**
   ```typescript
   const { uploadUrl, fileUrl } = await trpc.sessions.getAudioUploadUrl.mutate({
     sessionId: 'session_123',
     fileName: 'recording.m4a',
     contentType: 'audio/m4a'
   });
   ```

2. **Upload file directly to Cloud Storage:**
   ```typescript
   await fetch(uploadUrl, {
     method: 'PUT',
     headers: { 'Content-Type': 'audio/m4a' },
     body: audioBlob
   });
   ```

3. **Link file to session:**
   ```typescript
   await trpc.sessions.linkAudio.mutate({
     sessionId: 'session_123',
     audioUrl: fileUrl
   });
   ```

---

## Subscriptions (Future)

tRPC supports subscriptions for real-time updates (not implemented in v1):

```typescript
// Example: Subscribe to invoice status changes
trpc.invoices.onStatusChange.subscribe(
  { invoiceId: 'invoice_123' },
  {
    onData: (invoice) => {
      console.log('Invoice updated:', invoice.status);
    }
  }
);
```

---

## Rate Limiting

### Limits (Per Admin User)

| Endpoint Category | Limit |
|------------------|-------|
| Read operations | 1000 requests/minute |
| Write operations | 100 requests/minute |
| PDF generation | 20 requests/minute |
| File uploads | 50 requests/minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1633024800
```

---

## Testing

### Development Tools

- **tRPC Panel:** http://localhost:8080/trpc-panel (dev only)
  - Interactive API explorer
  - Test endpoints without writing code
  - View request/response shapes

### Example Test

```typescript
import { createCaller } from '@/server/routers/_app';

describe('Clients Router', () => {
  it('should create a client', async () => {
    const caller = createCaller({ userId: 'admin_123' });
    
    const client = await caller.clients.create({
      name: 'Test Client',
      type: 'individual'
    });
    
    expect(client.id).toBeDefined();
    expect(client.name).toBe('Test Client');
  });
});
```

---

## OpenAPI Spec (Optional)

While tRPC provides type safety, you can generate OpenAPI spec for external tools:

```bash
pnpm trpc-openapi generate \
  --input ./src/server/routers/_app.ts \
  --output ./openapi.json
```

This allows integration with tools like Postman, Swagger UI, etc.

---

## GraphQL Comparison

| Feature | tRPC | GraphQL |
|---------|------|---------|
| Type Safety | End-to-end TypeScript | Requires codegen |
| Learning Curve | Minimal (just TypeScript) | Steep (SDL, resolvers) |
| Bundle Size | Small (~5KB) | Large (~100KB+) |
| Real-time | WebSockets (subscriptions) | WebSockets (subscriptions) |
| Ecosystem | Growing | Mature |
| Best For | TypeScript monorepos | Multi-platform APIs |

---

## Next Steps

1. Review individual router documentation
2. Set up tRPC client in frontend
3. Implement authentication middleware
4. Add input validation with Zod
5. Test API endpoints with tRPC Panel


