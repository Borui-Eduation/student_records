# Data Model Specification
# 数据模型规格说明

**Version:** 1.0.0  
**Created:** 2025-10-08  
**Database:** Google Firestore (Native Mode)  
**Purpose:** Define all data structures, relationships, and validation rules for the Multi-Business Management Platform

---

## Overview

This document defines the complete data model for the system. All data is stored in **Google Firestore** using a NoSQL document-based structure. The model is designed for:

- **Read efficiency:** Denormalized where appropriate
- **Admin-only access:** Single-user simplicity
- **Audit compliance:** Immutable financial records
- **Type safety:** TypeScript interfaces for all documents

---

## Collection Structure

```
firestore (root)
├── clients/                # Client records
├── rates/                  # Billing rate configurations
├── sessions/               # Service session records
├── invoices/               # Invoice records
├── knowledgeBase/          # Private knowledge base entries
├── sharingLinks/           # Secure sharing links
├── companyProfile/         # Company information (single document)
└── auditLogs/              # Access audit trail
```

---

## 1. Clients Collection

**Collection Path:** `/clients`

### Document Structure

```typescript
interface Client {
  // Identity
  id: string;                    // Firestore document ID (auto-generated)
  name: string;                  // Client full name or company name
  type: ClientType;              // 'institution' | 'individual' | 'project'
  
  // Contact Information
  contactInfo: {
    email?: string;              // Primary email
    phone?: string;              // Primary phone
    address?: string;            // Physical address
  };
  
  // Billing Details
  billingAddress?: string;       // Billing address if different from contactInfo.address
  taxId?: string;                // Tax ID / company registration number
  
  // Administrative
  notes?: string;                // Internal notes (max 1000 chars)
  active: boolean;               // false = archived (soft delete)
  defaultRateIds: string[];      // Array of rate document IDs
  
  // Metadata
  createdAt: Timestamp;          // Creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  createdBy: string;             // Admin user ID
}

type ClientType = 'institution' | 'individual' | 'project';
```

### Indexes

```
Composite Indexes:
- type ASC, active ASC, name ASC
- active ASC, updatedAt DESC
```

### Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| `name` | Yes | 1-200 characters, non-empty after trim |
| `type` | Yes | Must be one of: 'institution', 'individual', 'project' |
| `contactInfo.email` | No | Valid email format if provided |
| `contactInfo.phone` | No | 10-20 characters if provided |
| `billingAddress` | No | Max 500 characters |
| `taxId` | No | Max 50 characters |
| `notes` | No | Max 1000 characters |
| `active` | Yes | Boolean, default: true |
| `defaultRateIds` | No | Array of valid rate document IDs |

### Business Rules

1. **Soft Delete Only:** Clients with associated sessions cannot be hard-deleted; set `active = false` instead
2. **Unique Names:** Client names should be unique per type (enforced at application level, not database)
3. **Rate Inheritance:** If no client-specific rate exists, system uses rate for client's type
4. **Search:** Full-text search on `name` and `contactInfo.email`

### Example Document

```json
{
  "id": "client_abc123",
  "name": "王小明",
  "type": "individual",
  "contactInfo": {
    "email": "wang@example.com",
    "phone": "+86 138 1234 5678",
    "address": "北京市朝阳区xxx路123号"
  },
  "billingAddress": "北京市朝阳区xxx路123号",
  "notes": "数学辅导学生,每周二四晚上7点",
  "active": true,
  "defaultRateIds": ["rate_def456"],
  "createdAt": "2025-10-01T10:00:00Z",
  "updatedAt": "2025-10-05T15:30:00Z",
  "createdBy": "admin_uid_123"
}
```

---

## 2. Rates Collection

**Collection Path:** `/rates`

### Document Structure

```typescript
interface Rate {
  // Identity
  id: string;                    // Firestore document ID
  
  // Association (one of these must be set)
  clientId?: string;             // If rate is for specific client
  clientType?: ClientType;       // If rate is for all clients of this type
  
  // Rate Information
  amount: number;                // Hourly rate amount (positive number)
  currency: string;              // Currency code (e.g., 'CNY', 'USD')
  
  // Validity Period
  effectiveDate: Timestamp;      // When this rate becomes active
  endDate?: Timestamp;           // When this rate expires (null = still active)
  
  // Administrative
  description?: string;          // Rate description (e.g., "Premium rate for advanced topics")
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

### Indexes

```
Composite Indexes:
- clientId ASC, effectiveDate DESC
- clientType ASC, effectiveDate DESC
- effectiveDate DESC
```

### Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| `amount` | Yes | Positive number, max 2 decimal places |
| `currency` | Yes | Valid ISO 4217 currency code (default: 'CNY') |
| `effectiveDate` | Yes | Must be valid timestamp |
| `endDate` | No | Must be after effectiveDate if provided |
| `description` | No | Max 200 characters |
| `clientId` / `clientType` | One required | Exactly one must be set (XOR) |

### Business Rules

1. **Rate Selection:** When creating session, find rate where `effectiveDate <= session.date` and (`endDate` is null OR `endDate > session.date`)
2. **Priority:** Client-specific rate takes precedence over client-type rate
3. **Immutability:** Rates are never modified after sessions use them; create new rate with different effectiveDate instead
4. **Historical Tracking:** All rate changes preserved with date ranges for audit trail

### Example Documents

```json
// Client-specific rate
{
  "id": "rate_def456",
  "clientId": "client_abc123",
  "amount": 300.00,
  "currency": "CNY",
  "effectiveDate": "2025-09-01T00:00:00Z",
  "endDate": null,
  "description": "个人学生高级课程费率",
  "createdAt": "2025-09-01T09:00:00Z",
  "updatedAt": "2025-09-01T09:00:00Z",
  "createdBy": "admin_uid_123"
}

// Client-type rate
{
  "id": "rate_ghi789",
  "clientType": "institution",
  "amount": 500.00,
  "currency": "CNY",
  "effectiveDate": "2025-01-01T00:00:00Z",
  "endDate": null,
  "description": "机构客户标准费率",
  "createdAt": "2024-12-15T10:00:00Z",
  "updatedAt": "2024-12-15T10:00:00Z",
  "createdBy": "admin_uid_123"
}
```

---

## 3. Sessions Collection

**Collection Path:** `/sessions`

### Document Structure

```typescript
interface Session {
  // Identity
  id: string;                    // Firestore document ID
  
  // Association
  clientId: string;              // Reference to client document
  clientName: string;            // Denormalized for quick display
  
  // Timing
  date: Timestamp;               // Session date
  startTime: string;             // Start time in "HH:mm" format (24-hour)
  endTime: string;               // End time in "HH:mm" format
  durationHours: number;         // Calculated duration in decimal hours
  
  // Classification
  sessionType: SessionType;      // 'education' | 'technical'
  
  // Financial (frozen at creation)
  rateId: string;                // Reference to rate used
  rateAmount: number;            // Rate amount (frozen)
  totalAmount: number;           // durationHours * rateAmount (frozen)
  currency: string;              // Currency (frozen)
  
  // Billing Status
  billingStatus: BillingStatus;  // 'unbilled' | 'billed' | 'paid'
  invoiceId?: string;            // Set when session is invoiced
  
  // Content References
  contentBlocks: ContentBlock[]; // Embedded array of content blocks
  whiteboardUrls: string[];      // Cloud Storage URLs for whiteboard images
  audioUrls: string[];           // Cloud Storage URLs for audio recordings
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

type SessionType = 'education' | 'technical';
type BillingStatus = 'unbilled' | 'billed' | 'paid';

interface ContentBlock {
  id: string;                    // Unique block ID (UUID)
  type: BlockType;               // Block type
  content: any;                  // JSON content from Tiptap (varies by type)
  order: number;                 // Display order (0, 1, 2, ...)
}

type BlockType = 'heading' | 'paragraph' | 'bulletList' | 'orderedList' | 
                 'codeBlock' | 'image' | 'link';
```

### Indexes

```
Composite Indexes:
- clientId ASC, date DESC
- billingStatus ASC, date DESC
- sessionType ASC, date DESC
- invoiceId ASC, date DESC
- date DESC, createdAt DESC
```

### Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| `clientId` | Yes | Must be valid client document ID |
| `date` | Yes | Valid timestamp, not future date |
| `startTime` | Yes | Format: "HH:mm", valid 24-hour time |
| `endTime` | Yes | Format: "HH:mm", must be after startTime |
| `durationHours` | Yes | Positive number, calculated from start/end |
| `sessionType` | Yes | Must be 'education' or 'technical' |
| `rateAmount` | Yes | Positive number, matches rate at session date |
| `totalAmount` | Yes | durationHours * rateAmount |
| `billingStatus` | Yes | Default: 'unbilled' |
| `contentBlocks` | No | Array of ContentBlock objects |
| `whiteboardUrls` | No | Array of valid Cloud Storage URLs |
| `audioUrls` | No | Array of valid Cloud Storage URLs |

### Business Rules

1. **Financial Immutability:** Once `billingStatus = 'billed'`, the `rateAmount`, `totalAmount`, and `durationHours` are frozen and cannot be changed
2. **Rate Freezing:** Rate amount is copied to session at creation time; changes to rate collection do not affect existing sessions
3. **Deletion Protection:** Sessions with `billingStatus != 'unbilled'` cannot be deleted
4. **Content Auto-Save:** Content blocks auto-save every 30 seconds during editing
5. **Media File Naming:** Audio files: `audio/{sessionId}/{timestamp}.m4a`, Whiteboards: `whiteboards/{sessionId}/{uuid}.png`

### Example Document

```json
{
  "id": "session_jkl012",
  "clientId": "client_abc123",
  "clientName": "王小明",
  "date": "2025-10-08T00:00:00Z",
  "startTime": "19:00",
  "endTime": "21:00",
  "durationHours": 2.0,
  "sessionType": "education",
  "rateId": "rate_def456",
  "rateAmount": 300.00,
  "totalAmount": 600.00,
  "currency": "CNY",
  "billingStatus": "unbilled",
  "contentBlocks": [
    {
      "id": "block_001",
      "type": "heading",
      "content": {"text": "二次方程复习", "level": 1},
      "order": 0
    },
    {
      "id": "block_002",
      "type": "paragraph",
      "content": {"text": "今天我们复习了二次方程的求解方法..."},
      "order": 1
    },
    {
      "id": "block_003",
      "type": "codeBlock",
      "content": {"language": "math", "code": "ax² + bx + c = 0"},
      "order": 2
    }
  ],
  "whiteboardUrls": [
    "https://storage.googleapis.com/student-record-prod/whiteboards/session_jkl012/whiteboard_001.png"
  ],
  "audioUrls": [
    "https://storage.googleapis.com/student-record-prod/audio/session_jkl012/recording_20251008_190000.m4a"
  ],
  "createdAt": "2025-10-08T19:00:00Z",
  "updatedAt": "2025-10-08T21:15:00Z",
  "createdBy": "admin_uid_123"
}
```

---

## 4. Invoices Collection

**Collection Path:** `/invoices`

### Document Structure

```typescript
interface Invoice {
  // Identity
  id: string;                    // Firestore document ID
  invoiceNumber: string;         // Sequential number: "INV-001", "INV-002", etc.
  
  // Association
  clientId: string;              // Reference to client
  clientName: string;            // Denormalized
  
  // Dates
  issueDate: Timestamp;          // Invoice issue date
  billingPeriodStart: Timestamp; // Start of billing period
  billingPeriodEnd: Timestamp;   // End of billing period
  
  // Line Items
  lineItems: InvoiceLineItem[];  // Array of line items (embedded)
  
  // Totals
  subtotal: number;              // Sum of all line item subtotals
  taxAmount: number;             // Manual tax amount (not calculated)
  totalAmount: number;           // subtotal + taxAmount
  currency: string;              // Currency code
  
  // Status
  status: InvoiceStatus;         // 'draft' | 'sent' | 'paid'
  pdfUrl?: string;               // Cloud Storage URL for generated PDF
  
  // Payment
  paidDate?: Timestamp;          // When payment received (if status = 'paid')
  paymentNotes?: string;         // Payment details or notes
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

type InvoiceStatus = 'draft' | 'sent' | 'paid';

interface InvoiceLineItem {
  sessionId: string;             // Reference to session
  serviceDate: Timestamp;        // Date service was performed
  description: string;           // Service description
  hours: number;                 // Duration in decimal hours
  hourlyRate: number;            // Rate applied
  subtotal: number;              // hours * hourlyRate
}
```

### Indexes

```
Composite Indexes:
- clientId ASC, issueDate DESC
- status ASC, issueDate DESC
- invoiceNumber ASC
- issueDate DESC
```

### Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| `invoiceNumber` | Yes | Format: "INV-XXX" where XXX is zero-padded number |
| `clientId` | Yes | Valid client document ID |
| `issueDate` | Yes | Valid timestamp |
| `billingPeriodStart` | Yes | Valid timestamp, <= billingPeriodEnd |
| `billingPeriodEnd` | Yes | Valid timestamp, >= billingPeriodStart |
| `lineItems` | Yes | Non-empty array, at least 1 item |
| `subtotal` | Yes | Sum of lineItem subtotals |
| `taxAmount` | No | Non-negative number, default: 0 |
| `totalAmount` | Yes | subtotal + taxAmount |
| `status` | Yes | Default: 'draft' |

### Business Rules

1. **Sequential Numbering:** Invoice numbers auto-increment (INV-001, INV-002, ...) maintained via Firestore transaction
2. **Immutability:** Once `status = 'sent'`, invoice data (line items, amounts) cannot be changed; only status can be updated to 'paid'
3. **Session Status Update:** When invoice created, all associated sessions set to `billingStatus = 'billed'` and `invoiceId = <this invoice ID>`
4. **PDF Generation:** PDF generated when status changes from 'draft' to 'sent'
5. **No Deletion:** Invoices cannot be deleted after creation; can only be voided (set status to 'void' - future feature)

### Example Document

```json
{
  "id": "invoice_mno345",
  "invoiceNumber": "INV-042",
  "clientId": "client_abc123",
  "clientName": "王小明",
  "issueDate": "2025-10-31T00:00:00Z",
  "billingPeriodStart": "2025-10-01T00:00:00Z",
  "billingPeriodEnd": "2025-10-31T23:59:59Z",
  "lineItems": [
    {
      "sessionId": "session_jkl012",
      "serviceDate": "2025-10-08T00:00:00Z",
      "description": "数学辅导 - 二次方程",
      "hours": 2.0,
      "hourlyRate": 300.00,
      "subtotal": 600.00
    },
    {
      "sessionId": "session_pqr678",
      "serviceDate": "2025-10-15T00:00:00Z",
      "description": "数学辅导 - 三角函数",
      "hours": 2.0,
      "hourlyRate": 300.00,
      "subtotal": 600.00
    }
  ],
  "subtotal": 1200.00,
  "taxAmount": 0.00,
  "totalAmount": 1200.00,
  "currency": "CNY",
  "status": "sent",
  "pdfUrl": "https://storage.googleapis.com/student-record-prod/pdfs/invoices/invoice_mno345.pdf",
  "createdAt": "2025-10-31T10:00:00Z",
  "updatedAt": "2025-10-31T10:30:00Z",
  "createdBy": "admin_uid_123"
}
```

---

## 5. Knowledge Base Collection

**Collection Path:** `/knowledgeBase`

### Document Structure

```typescript
interface KnowledgeEntry {
  // Identity
  id: string;                    // Firestore document ID
  
  // Content
  title: string;                 // Entry title
  type: KnowledgeType;           // Entry type
  content: string;               // Content (encrypted if isEncrypted = true)
  
  // Encryption
  isEncrypted: boolean;          // Whether content is encrypted
  kmsKeyId?: string;             // Cloud KMS key ID if encrypted
  encryptionMetadata?: {         // Metadata for decryption
    algorithm: string;           // e.g., "AES-256-GCM"
    ivBase64: string;            // Initialization vector (base64)
  };
  
  // Organization
  tags: string[];                // Array of tags for filtering/search
  category?: string;             // Optional category
  
  // Attachments
  attachments: string[];         // Cloud Storage URLs (voice memos, etc.)
  
  // Access Tracking
  accessedAt?: Timestamp;        // Last time content was decrypted/viewed
  accessCount: number;           // Number of times accessed
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

type KnowledgeType = 'note' | 'api-key' | 'ssh-record' | 'password' | 'memo';
```

### Indexes

```
Composite Indexes:
- type ASC, updatedAt DESC
- tags ARRAY_CONTAINS, updatedAt DESC
- category ASC, updatedAt DESC
```

### Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| `title` | Yes | 1-200 characters |
| `type` | Yes | Must be one of defined KnowledgeType values |
| `content` | Yes | Max 10,000 characters (encrypted or plain) |
| `isEncrypted` | Yes | Boolean, required for sensitive types |
| `tags` | No | Array of strings, max 20 tags, each max 30 chars |
| `category` | No | Max 50 characters |

### Business Rules

1. **Auto-Encryption:** Types 'api-key', 'ssh-record', 'password' automatically encrypted using Cloud KMS
2. **Audit Logging:** Every decrypt operation (reveal) logged to auditLogs collection
3. **Search Indexing:** Only title and tags indexed for full-text search; encrypted content not searchable
4. **Access Tracking:** `accessedAt` and `accessCount` updated every time sensitive content is decrypted
5. **Retention:** No automatic deletion; admin manually archives or deletes entries

### Example Documents

```json
// Encrypted API Key
{
  "id": "kb_stu901",
  "title": "OpenAI API Key - Production",
  "type": "api-key",
  "content": "AQICAHj8eX2...<encrypted base64>...==",
  "isEncrypted": true,
  "kmsKeyId": "projects/PROJECT_ID/locations/global/keyRings/student-record-keyring/cryptoKeys/sensitive-data-key",
  "encryptionMetadata": {
    "algorithm": "AES-256-GCM",
    "ivBase64": "randomIVbase64=="
  },
  "tags": ["api-key", "openai", "production"],
  "category": "API Keys",
  "attachments": [],
  "accessedAt": "2025-10-05T14:22:00Z",
  "accessCount": 3,
  "createdAt": "2025-09-15T10:00:00Z",
  "updatedAt": "2025-09-15T10:00:00Z",
  "createdBy": "admin_uid_123"
}

// Plain Note
{
  "id": "kb_vwx234",
  "title": "Website Deployment Checklist",
  "type": "note",
  "content": "1. Run tests\n2. Build production bundle\n3. Deploy to Vercel\n4. Verify DNS...",
  "isEncrypted": false,
  "tags": ["deployment", "checklist", "website"],
  "category": "Procedures",
  "attachments": [],
  "accessCount": 12,
  "createdAt": "2025-08-10T09:00:00Z",
  "updatedAt": "2025-10-01T11:30:00Z",
  "createdBy": "admin_uid_123"
}
```

---

## 6. Sharing Links Collection

**Collection Path:** `/sharingLinks`

### Document Structure

```typescript
interface SharingLink {
  // Identity
  id: string;                    // Firestore document ID
  token: string;                 // Random cryptographic token (UUID v4)
  
  // Association
  sessionId: string;             // Reference to session being shared
  
  // Expiration
  createdAt: Timestamp;
  expiresAt: Timestamp;          // Default: createdAt + 90 days
  
  // Status
  revoked: boolean;              // Manual revocation flag
  
  // Analytics
  accessCount: number;           // Number of times link was accessed
  lastAccessedAt?: Timestamp;    // Last access time
  
  // Metadata
  createdBy: string;             // Admin user ID who created link
}
```

### Indexes

```
Composite Indexes:
- token ASC (for quick lookup by token)
- sessionId ASC, createdAt DESC
- expiresAt ASC, revoked ASC (for cleanup queries)
```

### Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| `token` | Yes | UUID v4 format, cryptographically random |
| `sessionId` | Yes | Valid session document ID |
| `expiresAt` | Yes | Must be after createdAt |
| `revoked` | Yes | Boolean, default: false |

### Business Rules

1. **Token Security:** Tokens generated using `crypto.randomUUID()` (128-bit entropy)
2. **Access Control:** Links checked: `revoked = false` AND `expiresAt > now()`
3. **Expiration Notification:** System notifies admin 7 days before expiration (cron job or Cloud Scheduler)
4. **Immediate Revocation:** Setting `revoked = true` instantly denies access
5. **Analytics:** `accessCount` incremented on each successful access (not on failed attempts)

### Example Document

```json
{
  "id": "link_yza567",
  "token": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "sessionId": "session_jkl012",
  "createdAt": "2025-10-08T21:30:00Z",
  "expiresAt": "2026-01-06T21:30:00Z",
  "revoked": false,
  "accessCount": 5,
  "lastAccessedAt": "2025-10-12T15:45:00Z",
  "createdBy": "admin_uid_123"
}
```

---

## 7. Company Profile Collection

**Collection Path:** `/companyProfile`

**Note:** This collection contains a single document with ID `default`.

### Document Structure

```typescript
interface CompanyProfile {
  // Fixed ID
  id: 'default';                 // Always "default"
  
  // Company Information
  companyName: string;           // Legal company name
  taxId: string;                 // Tax registration number
  address: string;               // Registered address
  
  // Banking Details
  bankInfo: {
    bankName: string;            // Bank name
    accountNumber: string;       // Account number
    accountName: string;         // Account holder name
    swiftCode?: string;          // SWIFT/BIC code (for international)
  };
  
  // Contact Information
  contactInfo: {
    email: string;               // Business email
    phone: string;               // Business phone
    website?: string;            // Company website
  };
  
  // Branding
  logoUrl?: string;              // Cloud Storage URL for company logo
  
  // Metadata
  updatedAt: Timestamp;
  updatedBy: string;
}
```

### Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| `companyName` | Yes | 1-200 characters |
| `taxId` | Yes | 1-50 characters |
| `address` | Yes | 1-500 characters |
| `bankInfo.bankName` | Yes | 1-100 characters |
| `bankInfo.accountNumber` | Yes | 1-50 characters |
| `bankInfo.accountName` | Yes | 1-100 characters |
| `contactInfo.email` | Yes | Valid email format |
| `contactInfo.phone` | Yes | 10-20 characters |

### Business Rules

1. **Single Document:** Only one company profile exists (multi-company support is out of scope)
2. **Required for Invoicing:** Invoice generation requires complete company profile
3. **Logo Optional:** Logo displayed on invoices if provided, otherwise text-only header

### Example Document

```json
{
  "id": "default",
  "companyName": "北京某某教育科技有限公司",
  "taxId": "91110000XXXXXXXXXX",
  "address": "北京市朝阳区某某路123号",
  "bankInfo": {
    "bankName": "中国工商银行北京分行",
    "accountNumber": "6222 0123 4567 8901",
    "accountName": "北京某某教育科技有限公司"
  },
  "contactInfo": {
    "email": "contact@example.com",
    "phone": "+86 010-1234-5678",
    "website": "https://www.example.com"
  },
  "logoUrl": "https://storage.googleapis.com/student-record-prod/branding/logo.png",
  "updatedAt": "2025-09-20T10:00:00Z",
  "updatedBy": "admin_uid_123"
}
```

---

## 8. Audit Logs Collection

**Collection Path:** `/auditLogs`

### Document Structure

```typescript
interface AuditLog {
  // Identity
  id: string;                    // Firestore document ID (auto-generated)
  
  // User Information
  userId: string;                // Admin user ID who performed action
  userEmail?: string;            // User email (denormalized for quick view)
  
  // Action Details
  action: AuditAction;           // Type of action performed
  resourceType: string;          // Type of resource accessed
  resourceId: string;            // ID of resource accessed
  
  // Context
  description: string;           // Human-readable description
  ipAddress?: string;            // IP address of request
  userAgent?: string;            // Browser user agent
  
  // Metadata
  timestamp: Timestamp;          // When action occurred
}

type AuditAction = 
  | 'ACCESS_SENSITIVE'           // Viewed sensitive info
  | 'DECRYPT_KEY'                // Decrypted API key / password
  | 'CREATE_SHARING_LINK'        // Created sharing link
  | 'REVOKE_SHARING_LINK'        // Revoked sharing link
  | 'GENERATE_INVOICE'           // Generated invoice
  | 'EXPORT_SESSION'             // Exported session to PDF
  | 'DELETE_RECORDING'           // Deleted audio recording
  | 'UPDATE_COMPANY_PROFILE';    // Modified company info
```

### Indexes

```
Composite Indexes:
- userId ASC, timestamp DESC
- action ASC, timestamp DESC
- resourceType ASC, resourceId ASC, timestamp DESC
- timestamp DESC
```

### Validation Rules

| Field | Required | Validation |
|-------|----------|------------|
| `userId` | Yes | Valid user ID |
| `action` | Yes | Must be valid AuditAction |
| `resourceType` | Yes | 1-50 characters |
| `resourceId` | Yes | 1-100 characters |
| `description` | Yes | 1-500 characters |
| `timestamp` | Yes | Auto-set to current time |

### Business Rules

1. **Immutable:** Audit logs cannot be modified or deleted (append-only)
2. **Automatic Logging:** Critical actions automatically trigger audit log creation
3. **Retention:** Audit logs retained indefinitely for compliance
4. **Privacy:** No sensitive content stored in logs (only metadata)

### Example Document

```json
{
  "id": "audit_bcd890",
  "userId": "admin_uid_123",
  "userEmail": "admin@example.com",
  "action": "DECRYPT_KEY",
  "resourceType": "knowledge_entry",
  "resourceId": "kb_stu901",
  "description": "Admin decrypted API key: OpenAI API Key - Production",
  "ipAddress": "123.45.67.89",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "timestamp": "2025-10-05T14:22:15Z"
}
```

---

## State Transitions

### Session Billing Status

```
unbilled → billed → paid
    ↓         ↓
 (can edit) (frozen, can only change status)
```

**Rules:**
- `unbilled`: Session created, not yet invoiced (can edit all fields)
- `billed`: Included in invoice (financial fields frozen, only status can change)
- `paid`: Invoice marked as paid (fully immutable except archival)

### Invoice Status

```
draft → sent → paid
  ↓
(can edit)  (frozen except status)
```

**Rules:**
- `draft`: Invoice created, not sent (can edit all fields)
- `sent`: Invoice sent to client, PDF generated (only status can change)
- `paid`: Payment received (fully immutable)

### Sharing Link Lifecycle

```
active → (expired OR revoked)
  ↓              ↓
(accessible)  (denied)
```

**Rules:**
- `active`: `revoked = false` AND `expiresAt > now()`
- `expired`: `expiresAt <= now()`
- `revoked`: `revoked = true` (manual)
- Expired links can be extended by updating `expiresAt`
- Revoked links cannot be un-revoked (must create new link)

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function: Check if user is admin
    function isAdmin() {
      return request.auth != null && 
             request.auth.token.email == 'admin@example.com'; // Replace with actual admin email
    }
    
    // All collections: admin-only access
    match /{document=**} {
      allow read, write: if isAdmin();
    }
    
    // Exception: Public sharing link access (read-only)
    match /sessions/{sessionId} {
      allow read: if resource != null && 
                     exists(/databases/$(database)/documents/sharingLinks/$(request.query.token)) &&
                     get(/databases/$(database)/documents/sharingLinks/$(request.query.token)).data.sessionId == sessionId &&
                     get(/databases/$(database)/documents/sharingLinks/$(request.query.token)).data.revoked == false &&
                     get(/databases/$(database)/documents/sharingLinks/$(request.query.token)).data.expiresAt > request.time;
    }
    
    // Audit logs: append-only (no delete)
    match /auditLogs/{logId} {
      allow create: if isAdmin();
      allow read: if isAdmin();
      allow update, delete: if false; // Immutable
    }
  }
}
```

---

## TypeScript Type Definitions

All interfaces above should be exported from a shared types package:

```typescript
// packages/shared/src/types/index.ts
export type { Client, ClientType } from './client';
export type { Rate } from './rate';
export type { Session, ContentBlock, SessionType, BillingStatus } from './session';
export type { Invoice, InvoiceLineItem, InvoiceStatus } from './invoice';
export type { KnowledgeEntry, KnowledgeType } from './knowledge';
export type { SharingLink } from './sharingLink';
export type { CompanyProfile } from './companyProfile';
export type { AuditLog, AuditAction } from './auditLog';
```

---

## Database Indexes Summary

### Required Composite Indexes

```
clients:
  - type ASC, active ASC, name ASC
  - active ASC, updatedAt DESC

rates:
  - clientId ASC, effectiveDate DESC
  - clientType ASC, effectiveDate DESC

sessions:
  - clientId ASC, date DESC
  - billingStatus ASC, date DESC
  - sessionType ASC, date DESC
  - invoiceId ASC, date DESC
  - date DESC, createdAt DESC

invoices:
  - clientId ASC, issueDate DESC
  - status ASC, issueDate DESC
  - invoiceNumber ASC

knowledgeBase:
  - type ASC, updatedAt DESC
  - tags ARRAY_CONTAINS, updatedAt DESC
  - category ASC, updatedAt DESC

sharingLinks:
  - token ASC
  - sessionId ASC, createdAt DESC
  - expiresAt ASC, revoked ASC

auditLogs:
  - userId ASC, timestamp DESC
  - action ASC, timestamp DESC
  - resourceType ASC, resourceId ASC, timestamp DESC
  - timestamp DESC
```

**Note:** These indexes must be created via Firebase Console or `firebase deploy --only firestore:indexes`.

---

## Conclusion

This data model provides:

✅ **Complete type safety** with TypeScript interfaces  
✅ **Audit compliance** with immutable financial records  
✅ **Security** with encrypted sensitive data  
✅ **Performance** through denormalization and proper indexing  
✅ **Flexibility** with NoSQL document structure  
✅ **Clarity** with comprehensive documentation

All collections are designed for **single-administrator use** and prioritize **read efficiency** for fast UI rendering.

**Next Step:** Implement these interfaces in `packages/shared/src/types/` and begin API route development.


