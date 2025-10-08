# Clients Router API Contract

**Router Path:** `/trpc/clients`  
**Purpose:** Manage clients and their associated rates

---

## Procedures

### 1. Create Client

**Type:** Mutation  
**Path:** `clients.create`

#### Input Schema

```typescript
{
  name: string;                    // 1-200 characters, required
  type: 'institution' | 'individual' | 'project';  // required
  contactInfo?: {
    email?: string;                // Valid email format
    phone?: string;                // 10-20 characters
    address?: string;              // Max 500 characters
  };
  billingAddress?: string;         // Max 500 characters
  taxId?: string;                  // Max 50 characters
  notes?: string;                  // Max 1000 characters
}
```

#### Output Schema

```typescript
{
  id: string;
  name: string;
  type: 'institution' | 'individual' | 'project';
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
  billingAddress?: string;
  taxId?: string;
  notes?: string;
  active: boolean;                // Always true for new clients
  defaultRateIds: string[];       // Empty array initially
  createdAt: string;              // ISO 8601 timestamp
  updatedAt: string;              // ISO 8601 timestamp
  createdBy: string;              // Admin user ID
}
```

#### Example Request

```typescript
const client = await trpc.clients.create.mutate({
  name: '北京XX教育机构',
  type: 'institution',
  contactInfo: {
    email: 'contact@xxedu.com',
    phone: '+86 010-1234-5678',
    address: '北京市朝阳区某某路123号'
  },
  billingAddress: '北京市朝阳区某某路123号',
  taxId: '91110000XXXXXXXXXX',
  notes: '大型教育机构,每月固定课时'
});
```

#### Example Response

```typescript
{
  "id": "client_abc123xyz",
  "name": "北京XX教育机构",
  "type": "institution",
  "contactInfo": {
    "email": "contact@xxedu.com",
    "phone": "+86 010-1234-5678",
    "address": "北京市朝阳区某某路123号"
  },
  "billingAddress": "北京市朝阳区某某路123号",
  "taxId": "91110000XXXXXXXXXX",
  "notes": "大型教育机构,每月固定课时",
  "active": true,
  "defaultRateIds": [],
  "createdAt": "2025-10-08T10:30:00.000Z",
  "updatedAt": "2025-10-08T10:30:00.000Z",
  "createdBy": "admin_uid_123"
}
```

#### Errors

| Code | Condition | Message |
|------|-----------|---------|
| `BAD_REQUEST` | Invalid input | Zod validation error details |
| `CONFLICT` | Duplicate client name | "Client with this name already exists for this type" |
| `UNAUTHORIZED` | Not authenticated | "Authentication required" |

---

### 2. List Clients

**Type:** Query  
**Path:** `clients.list`

#### Input Schema

```typescript
{
  type?: 'institution' | 'individual' | 'project';  // Filter by type
  active?: boolean;                // Filter by active status (default: true)
  search?: string;                 // Search in name and email
  limit?: number;                  // Items per page (default: 50, max: 100)
  cursor?: string;                 // Pagination cursor
}
```

#### Output Schema

```typescript
{
  items: Client[];               // Array of client objects
  nextCursor?: string;           // Cursor for next page (undefined if last page)
  hasMore: boolean;              // Whether there are more items
  total?: number;                // Total count (optional, may be slow)
}
```

#### Example Request

```typescript
const result = await trpc.clients.list.query({
  type: 'institution',
  active: true,
  search: '教育',
  limit: 20
});
```

#### Example Response

```typescript
{
  "items": [
    {
      "id": "client_abc123",
      "name": "北京XX教育机构",
      "type": "institution",
      "contactInfo": {
        "email": "contact@xxedu.com"
      },
      "active": true,
      "defaultRateIds": ["rate_def456"],
      "createdAt": "2025-10-08T10:30:00.000Z",
      "updatedAt": "2025-10-08T10:30:00.000Z"
    },
    // ... more clients
  ],
  "nextCursor": "eyJpZCI6ImNsaWVudF94eXo3ODkiLCJ0cyI6MTY5Njc2MDQwMH0=",
  "hasMore": true,
  "total": 45
}
```

#### Errors

| Code | Condition | Message |
|------|-----------|---------|
| `BAD_REQUEST` | Invalid limit | "Limit must be between 1 and 100" |
| `UNAUTHORIZED` | Not authenticated | "Authentication required" |

---

### 3. Get Client by ID

**Type:** Query  
**Path:** `clients.getById`

#### Input Schema

```typescript
string  // Client ID
```

#### Output Schema

```typescript
Client  // Full client object
```

#### Example Request

```typescript
const client = await trpc.clients.getById.query('client_abc123');
```

#### Example Response

```typescript
{
  "id": "client_abc123",
  "name": "北京XX教育机构",
  "type": "institution",
  "contactInfo": {
    "email": "contact@xxedu.com",
    "phone": "+86 010-1234-5678",
    "address": "北京市朝阳区某某路123号"
  },
  "billingAddress": "北京市朝阳区某某路123号",
  "taxId": "91110000XXXXXXXXXX",
  "notes": "大型教育机构,每月固定课时",
  "active": true,
  "defaultRateIds": ["rate_def456"],
  "createdAt": "2025-10-08T10:30:00.000Z",
  "updatedAt": "2025-10-08T10:30:00.000Z",
  "createdBy": "admin_uid_123"
}
```

#### Errors

| Code | Condition | Message |
|------|-----------|---------|
| `NOT_FOUND` | Client doesn't exist | "Client not found" |
| `BAD_REQUEST` | Invalid ID format | "Invalid client ID format" |
| `UNAUTHORIZED` | Not authenticated | "Authentication required" |

---

### 4. Update Client

**Type:** Mutation  
**Path:** `clients.update`

#### Input Schema

```typescript
{
  id: string;                      // Required
  name?: string;                   // Optional fields to update
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  billingAddress?: string;
  taxId?: string;
  notes?: string;
}
```

**Note:** `type` and `active` cannot be changed via this endpoint. Use `clients.archive` to set `active = false`.

#### Output Schema

```typescript
Client  // Updated client object
```

#### Example Request

```typescript
const updated = await trpc.clients.update.mutate({
  id: 'client_abc123',
  contactInfo: {
    phone: '+86 010-9999-8888'  // Update phone number
  },
  notes: '已调整联系方式'
});
```

#### Example Response

```typescript
{
  "id": "client_abc123",
  "name": "北京XX教育机构",
  "contactInfo": {
    "email": "contact@xxedu.com",
    "phone": "+86 010-9999-8888",  // Updated
    "address": "北京市朝阳区某某路123号"
  },
  "notes": "已调整联系方式",  // Updated
  "updatedAt": "2025-10-09T14:20:00.000Z",  // Updated timestamp
  // ... rest of fields
}
```

#### Errors

| Code | Condition | Message |
|------|-----------|---------|
| `NOT_FOUND` | Client doesn't exist | "Client not found" |
| `BAD_REQUEST` | Invalid input | Zod validation error details |
| `CONFLICT` | Name already exists | "Client with this name already exists" |
| `UNAUTHORIZED` | Not authenticated | "Authentication required" |

---

### 5. Archive Client

**Type:** Mutation  
**Path:** `clients.archive`

**Purpose:** Soft delete a client (set `active = false`). Hard deletion not allowed if client has sessions.

#### Input Schema

```typescript
string  // Client ID
```

#### Output Schema

```typescript
{
  success: boolean;
  message: string;
}
```

#### Example Request

```typescript
const result = await trpc.clients.archive.mutate('client_abc123');
```

#### Example Response

```typescript
{
  "success": true,
  "message": "Client archived successfully"
}
```

#### Errors

| Code | Condition | Message |
|------|-----------|---------|
| `NOT_FOUND` | Client doesn't exist | "Client not found" |
| `CONFLICT` | Client has active sessions | "Cannot archive client with active sessions. Invoice all sessions first." |
| `UNAUTHORIZED` | Not authenticated | "Authentication required" |

---

### 6. Restore Client

**Type:** Mutation  
**Path:** `clients.restore`

**Purpose:** Restore an archived client (set `active = true`).

#### Input Schema

```typescript
string  // Client ID
```

#### Output Schema

```typescript
Client  // Restored client object
```

#### Example Request

```typescript
const client = await trpc.clients.restore.mutate('client_abc123');
```

#### Example Response

```typescript
{
  "id": "client_abc123",
  "name": "北京XX教育机构",
  "active": true,  // Restored
  "updatedAt": "2025-10-10T09:15:00.000Z",
  // ... rest of fields
}
```

#### Errors

| Code | Condition | Message |
|------|-----------|---------|
| `NOT_FOUND` | Client doesn't exist | "Client not found" |
| `BAD_REQUEST` | Client already active | "Client is already active" |
| `UNAUTHORIZED` | Not authenticated | "Authentication required" |

---

### 7. Get Client Sessions

**Type:** Query  
**Path:** `clients.getSessions`

**Purpose:** Get all sessions for a specific client (for timeline view).

#### Input Schema

```typescript
{
  clientId: string;                // Required
  limit?: number;                  // Default: 50, max: 100
  cursor?: string;                 // Pagination cursor
}
```

#### Output Schema

```typescript
{
  items: SessionSummary[];         // Array of session summaries
  nextCursor?: string;
  hasMore: boolean;
}

interface SessionSummary {
  id: string;
  date: string;                    // ISO date
  sessionType: 'education' | 'technical';
  durationHours: number;
  totalAmount: number;
  hasWhiteboard: boolean;          // Whether session has whiteboards
  hasAudio: boolean;               // Whether session has audio
  billingStatus: 'unbilled' | 'billed' | 'paid';
  contentPreview?: string;         // First 100 chars of content
}
```

#### Example Request

```typescript
const sessions = await trpc.clients.getSessions.query({
  clientId: 'client_abc123',
  limit: 20
});
```

#### Example Response

```typescript
{
  "items": [
    {
      "id": "session_xyz789",
      "date": "2025-10-08",
      "sessionType": "education",
      "durationHours": 2.0,
      "totalAmount": 600.00,
      "hasWhiteboard": true,
      "hasAudio": true,
      "billingStatus": "unbilled",
      "contentPreview": "今天我们学习了二次方程的求解方法..."
    },
    // ... more sessions
  ],
  "nextCursor": "eyJpZCI6InNlc3Npb25fYWJjMTIzIiwidHMiOjE2OTY3NjA0MDB9",
  "hasMore": true
}
```

#### Errors

| Code | Condition | Message |
|------|-----------|---------|
| `NOT_FOUND` | Client doesn't exist | "Client not found" |
| `UNAUTHORIZED` | Not authenticated | "Authentication required" |

---

### 8. Get Client Stats

**Type:** Query  
**Path:** `clients.getStats`

**Purpose:** Get financial and session statistics for a client.

#### Input Schema

```typescript
{
  clientId: string;
  dateRange?: {
    start: string;                 // ISO date
    end: string;                   // ISO date
  };
}
```

#### Output Schema

```typescript
{
  totalSessions: number;
  totalHours: number;
  totalRevenue: number;
  currency: string;
  bySessionType: {
    education: {
      sessions: number;
      hours: number;
      revenue: number;
    };
    technical: {
      sessions: number;
      hours: number;
      revenue: number;
    };
  };
  byBillingStatus: {
    unbilled: { sessions: number; amount: number; };
    billed: { sessions: number; amount: number; };
    paid: { sessions: number; amount: number; };
  };
  averageSessionDuration: number;
  averageSessionAmount: number;
}
```

#### Example Request

```typescript
const stats = await trpc.clients.getStats.query({
  clientId: 'client_abc123',
  dateRange: {
    start: '2025-10-01',
    end: '2025-10-31'
  }
});
```

#### Example Response

```typescript
{
  "totalSessions": 10,
  "totalHours": 20.0,
  "totalRevenue": 6000.00,
  "currency": "CNY",
  "bySessionType": {
    "education": {
      "sessions": 10,
      "hours": 20.0,
      "revenue": 6000.00
    },
    "technical": {
      "sessions": 0,
      "hours": 0,
      "revenue": 0
    }
  },
  "byBillingStatus": {
    "unbilled": { "sessions": 2, "amount": 1200.00 },
    "billed": { "sessions": 5, "amount": 3000.00 },
    "paid": { "sessions": 3, "amount": 1800.00 }
  },
  "averageSessionDuration": 2.0,
  "averageSessionAmount": 600.00
}
```

#### Errors

| Code | Condition | Message |
|------|-----------|---------|
| `NOT_FOUND` | Client doesn't exist | "Client not found" |
| `BAD_REQUEST` | Invalid date range | "End date must be after start date" |
| `UNAUTHORIZED` | Not authenticated | "Authentication required" |

---

## Zod Schemas (Implementation Reference)

```typescript
// packages/shared/src/schemas/client.ts

import { z } from 'zod';

export const ClientTypeSchema = z.enum(['institution', 'individual', 'project']);

export const ContactInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  address: z.string().max(500).optional(),
});

export const CreateClientSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  type: ClientTypeSchema,
  contactInfo: ContactInfoSchema.optional(),
  billingAddress: z.string().max(500).optional(),
  taxId: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateClientSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(200).trim().optional(),
  contactInfo: ContactInfoSchema.optional(),
  billingAddress: z.string().max(500).optional(),
  taxId: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

export const ListClientsSchema = z.object({
  type: ClientTypeSchema.optional(),
  active: z.boolean().optional().default(true),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

// Export TypeScript types from schemas
export type ClientType = z.infer<typeof ClientTypeSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;
export type ListClientsInput = z.infer<typeof ListClientsSchema>;
```

---

## Usage Examples

### React Component

```typescript
'use client';

import { trpc } from '@/lib/trpc';
import { useState } from 'react';

export function ClientList() {
  const [search, setSearch] = useState('');
  
  // Query with TanStack Query integration
  const { data, isLoading, error } = trpc.clients.list.useQuery({
    search,
    limit: 20
  });
  
  // Mutation
  const archiveMutation = trpc.clients.archive.useMutation({
    onSuccess: () => {
      // Invalidate and refetch
      trpc.useContext().clients.list.invalidate();
    }
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <input 
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clients..."
      />
      
      {data?.items.map((client) => (
        <div key={client.id}>
          <h3>{client.name}</h3>
          <p>{client.type}</p>
          <button onClick={() => archiveMutation.mutate(client.id)}>
            Archive
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Backend Implementation

```typescript
// apps/api/src/routers/clients.ts

import { router, protectedProcedure } from '../trpc';
import { 
  CreateClientSchema, 
  UpdateClientSchema, 
  ListClientsSchema 
} from '@student-record/shared/schemas';
import { clientService } from '../services/clientService';

export const clientsRouter = router({
  create: protectedProcedure
    .input(CreateClientSchema)
    .mutation(async ({ input, ctx }) => {
      return await clientService.createClient(input, ctx.userId);
    }),
  
  list: protectedProcedure
    .input(ListClientsSchema)
    .query(async ({ input, ctx }) => {
      return await clientService.listClients(input, ctx.userId);
    }),
  
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      return await clientService.getClientById(input, ctx.userId);
    }),
  
  // ... other procedures
});
```

---

## Related Routers

- [Rates Router](./rates-router.md) - Manage billing rates for clients
- [Sessions Router](./sessions-router.md) - Sessions associated with clients
- [Invoices Router](./invoices-router.md) - Invoices generated for clients

