# Implementation Plan: Multi-Business Management Platform
# 实施计划:教育与技术服务多业务管理平台

**Project:** Multi-Business Management Platform (Education & Technical Services)  
**Date Created:** 2025-10-08  
**Last Updated:** 2025-10-08  
**Version:** 1.0.0  
**Status:** In Planning  
**Based on Spec:** SPEC-001 v1.1.0

---

## Overview

**Objective:**  
Implement a unified backend management platform that automates multi-rate invoicing, provides rich media course logging, and maintains an encrypted knowledge base for sensitive work assets. The system prioritizes cost-effectiveness by maximizing free tier offerings from Vercel and Google Cloud while maintaining modern development practices.

**Scope:**  
This plan covers the complete implementation of 22 functional requirements including:
- Client and rate management
- Session time tracking with rich media content (block editor, whiteboard, audio recording)
- Automated invoice generation with professional PDF output
- Encrypted private knowledge base
- Financial reporting and analytics
- Secure content sharing

**Timeline:**  
- Start Date: 2025-10-08
- Phase 1 (Foundation): 4-6 weeks
- Phase 2 (Core Features): 6-8 weeks  
- Phase 3 (Polish & Security): 3-4 weeks
- Target Completion: ~14-18 weeks (3.5-4.5 months)

**Key Milestones:**
1. Development environment setup & architecture finalized (Week 1)
2. Authentication & basic client management live (Week 4)
3. Session recording & rich media editor functional (Week 8)
4. Invoice generation & PDF export working (Week 10)
5. Knowledge base & encryption implemented (Week 12)
6. Beta testing complete (Week 16)
7. Production deployment (Week 18)

---

## Constitution Alignment Check

### Pre-Implementation Verification

- [x] **Principle 1 - Light Minimalist Design**: Tailwind CSS + clean component structure ensures minimalist UI; mobile-responsive design maintained
- [x] **Principle 2 - Code Clarity & Readability**: TypeScript for type safety, ESLint/Prettier for consistency, comprehensive code comments
- [x] **Principle 3 - Multi-Rate Financial Automation**: Firestore flexible schema supports multiple rate configurations; automated invoice generation via Cloud Run
- [x] **Principle 4 - Rich Media Course Logging**: Tiptap/ProseMirror for block editing, Excalidraw for whiteboard, browser Audio API for recording
- [x] **Principle 5 - Security & Encryption First**: Google Cloud KMS for encryption, Firebase Auth for authentication, HTTPS everywhere
- [x] **Principle 6 - Efficient Operations**: Serverless architecture scales to zero, admin-only reduces complexity, optimized workflows
- [x] **Principle 7 - Professional Service Delivery**: PDF generation with professional templates, secure sharing links, client-ready exports

**Gate Status:** ✅ All principles addressed in architecture

---

## Technology Stack

### Frontend Stack (Modern, Cost-Effective)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Framework** | **Next.js 14+ (React 18+)** | Modern React framework with SSR/SSG support, excellent DX, perfect Vercel integration, TypeScript first-class support |
| **Language** | **TypeScript** | Type safety for maintainability, better IDE support, reduces runtime errors |
| **Styling** | **Tailwind CSS 3+** | Utility-first CSS for rapid UI development, built-in design system, tree-shaking for minimal bundle size |
| **UI Components** | **shadcn/ui + Radix UI** | Accessible, customizable components, aligns with minimalist design principle |
| **Block Editor** | **Tiptap (ProseMirror)** | Modern rich text editor, extensible block system, excellent TypeScript support |
| **Whiteboard** | **Excalidraw React** | Embedded whiteboard component, intuitive drawing experience, export to PNG/SVG |
| **Audio Recording** | **Browser MediaRecorder API** | Native browser API, no dependencies, good browser support |
| **State Management** | **React Context + Zustand** | Lightweight state management, avoids Redux complexity for admin-only app |
| **Forms** | **React Hook Form + Zod** | Type-safe form validation, excellent DX, minimal re-renders |
| **Data Fetching** | **TanStack Query (React Query)** | Intelligent caching, automatic refetching, optimistic updates |
| **Deployment** | **Vercel** | **Free tier**: 100GB bandwidth/month, automatic HTTPS, edge CDN, perfect Next.js integration |

### Backend Stack (Serverless, Cost-Optimized)

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Runtime** | **Node.js 20+ (TypeScript)** | Unified language with frontend, excellent ecosystem, async-first |
| **Framework** | **Express.js + tRPC** | Lightweight HTTP server + end-to-end type safety with frontend |
| **Deployment** | **Google Cloud Run** | **Free tier**: 2M requests/month, 360K vCPU-seconds, containerized serverless, scales to zero |
| **Database** | **Google Firestore (Native Mode)** | **Free tier**: 50K reads/20K writes/day, NoSQL flexibility for diverse data models, real-time sync |
| **File Storage** | **Google Cloud Storage** | **Free tier**: 5GB storage, 1GB network egress/month, perfect for audio files and PDFs |
| **Cache (Optional)** | **Firestore Caching / Redis (Memorystore)** | Start with Firestore caching, add Redis only if needed for performance |
| **PDF Generation** | **Puppeteer / PDFKit** | Puppeteer for HTML-to-PDF (complex layouts), PDFKit for programmatic generation (invoices) |
| **Encryption** | **Google Cloud KMS + Crypto** | Hardware-backed encryption keys, automatic rotation, audit logging |

### Authentication & Services

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Authentication** | **Firebase Authentication** | **Free tier**: Unlimited users, Google OAuth built-in, admin SDK for backend verification |
| **Email Service** | **SendGrid** | **Free tier**: 100 emails/day, professional templates, delivery tracking |
| **Monitoring** | **Google Cloud Logging + Sentry** | Cloud Logging (free tier), Sentry free tier for error tracking |
| **Analytics** | **Google Analytics 4 / Plausible** | Usage analytics for admin insights |

---

## Technical Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Next.js 14 App Router + React 18 + TypeScript             │ │
│  │  - Pages: Clients, Sessions, Invoices, Knowledge Base     │ │
│  │  - Components: Tiptap Editor, Excalidraw, Forms           │ │
│  │  - Auth: Firebase Auth SDK                                 │ │
│  │  - Styling: Tailwind CSS + shadcn/ui                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTPS/API Calls (tRPC)
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Cloud Run)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Express + tRPC API (TypeScript)                           │ │
│  │  - Routes: /clients, /sessions, /invoices, /knowledge     │ │
│  │  - Middleware: Auth verification, error handling           │ │
│  │  - Services: Invoice PDF, Audio processing, Encryption    │ │
│  └────────────────────────────────────────────────────────────┘ │
└──┬──────────────┬───────────────┬──────────────┬───────────────┘
   │              │               │              │
   ▼              ▼               ▼              ▼
┌────────┐  ┌──────────┐   ┌──────────┐   ┌──────────┐
│Firebase│  │Firestore │   │  Cloud   │   │Cloud KMS │
│  Auth  │  │(Database)│   │ Storage  │   │(Encrypt.)│
│        │  │          │   │ (Files)  │   │          │
└────────┘  └──────────┘   └──────────┘   └──────────┘
```

### Data Flow Examples

**1. Creating a Session with Rich Media:**
```
User Input → Next.js Form → tRPC Mutation → Cloud Run API
  → Firestore (session metadata) 
  → Cloud Storage (audio file)
  → Firestore (content blocks with references)
  → Response → UI Update
```

**2. Generating Invoice:**
```
User Request → tRPC Query (session IDs) → Cloud Run
  → Firestore (fetch sessions, rates, client info, company profile)
  → PDFKit (generate invoice PDF)
  → Cloud Storage (save PDF)
  → Firestore (save invoice record)
  → Return PDF URL → UI Download
```

**3. Storing Encrypted Sensitive Data:**
```
User Input (API Key) → Frontend → tRPC Mutation
  → Cloud Run → Cloud KMS (encrypt plaintext)
  → Firestore (store encrypted blob + metadata)
  → Audit Log → Response
```

---

## Data Model Design

### Core Collections (Firestore)

#### 1. **clients** Collection
```typescript
interface Client {
  id: string;                    // Auto-generated doc ID
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
  active: boolean;               // For soft delete
  defaultRateIds: string[];      // References to rates
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. **rates** Collection
```typescript
interface Rate {
  id: string;
  clientId?: string;             // If client-specific, else null for type-wide
  clientType?: 'institution' | 'individual' | 'project';
  amount: number;                // Hourly rate in CNY
  currency: string;              // Default: 'CNY'
  effectiveDate: Timestamp;
  endDate?: Timestamp;           // null = still active
  description?: string;
  createdAt: Timestamp;
}
```

#### 3. **sessions** Collection
```typescript
interface Session {
  id: string;
  clientId: string;              // Reference to client
  date: Timestamp;
  startTime: string;             // "HH:mm" format
  endTime: string;
  durationHours: number;         // Calculated
  sessionType: 'education' | 'technical';
  rateId: string;                // Rate applied (frozen at creation)
  rateAmount: number;            // Frozen amount
  totalAmount: number;           // durationHours * rateAmount
  billingStatus: 'unbilled' | 'billed' | 'paid';
  invoiceId?: string;            // Set when invoiced
  
  // Content references
  contentBlocks: ContentBlock[]; // Embedded or subcollection
  whiteboardUrls: string[];      // Cloud Storage URLs
  audioUrls: string[];           // Cloud Storage URLs
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'image' | 'link';
  content: any;                  // JSON content from Tiptap
  order: number;
}
```

#### 4. **invoices** Collection
```typescript
interface Invoice {
  id: string;
  invoiceNumber: string;         // "INV-001", "INV-002"
  clientId: string;
  issueDate: Timestamp;
  billingPeriodStart: Timestamp;
  billingPeriodEnd: Timestamp;
  
  lineItems: InvoiceLineItem[];
  
  subtotal: number;
  taxAmount: number;             // Manual, not calculated
  totalAmount: number;
  
  status: 'draft' | 'sent' | 'paid';
  pdfUrl?: string;               // Cloud Storage URL
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface InvoiceLineItem {
  sessionId: string;
  serviceDate: Timestamp;
  description: string;
  hours: number;
  hourlyRate: number;
  subtotal: number;
}
```

#### 5. **knowledgeBase** Collection
```typescript
interface KnowledgeEntry {
  id: string;
  title: string;
  type: 'note' | 'api-key' | 'ssh-record' | 'password' | 'memo';
  content: string;               // Encrypted if sensitive
  isEncrypted: boolean;
  kmsKeyId?: string;             // Cloud KMS key used
  
  tags: string[];
  category?: string;
  
  attachments: string[];         // Cloud Storage URLs (voice memos, etc.)
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  accessedAt: Timestamp;         // Track last access for audit
}
```

#### 6. **sharingLinks** Collection
```typescript
interface SharingLink {
  id: string;
  token: string;                 // Random cryptographic token (UUID v4)
  sessionId: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;          // Default: createdAt + 90 days
  revoked: boolean;
  accessCount: number;
  createdBy: string;             // Admin user ID
}
```

#### 7. **companyProfile** Collection (Single Document)
```typescript
interface CompanyProfile {
  id: 'default';                 // Single doc
  companyName: string;
  taxId: string;
  address: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  contactInfo: {
    email: string;
    phone: string;
  };
  logoUrl?: string;
  updatedAt: Timestamp;
}
```

#### 8. **auditLogs** Collection
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: string;                // 'ACCESS_SENSITIVE', 'DECRYPT_KEY', etc.
  resourceType: string;          // 'knowledge_entry', 'api_key'
  resourceId: string;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}
```

---

## API Contracts (tRPC Routes)

### Client Management Routes
```typescript
// src/server/routers/clients.ts
export const clientsRouter = router({
  // Create client
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(['institution', 'individual', 'project']),
      contactInfo: z.object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      }).optional(),
      billingAddress: z.string().optional(),
      taxId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
  
  // List clients
  list: protectedProcedure
    .input(z.object({
      type: z.enum(['institution', 'individual', 'project']).optional(),
      active: z.boolean().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Implementation
    }),
  
  // Get client by ID
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input, ctx }) => {
      // Implementation
    }),
  
  // Update client
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      // ... update fields
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
  
  // Archive client (soft delete)
  archive: protectedProcedure
    .input(z.string())
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
});
```

### Session Management Routes
```typescript
// src/server/routers/sessions.ts
export const sessionsRouter = router({
  // Create session
  create: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      date: z.string(), // ISO date
      startTime: z.string(), // "HH:mm"
      endTime: z.string(),
      sessionType: z.enum(['education', 'technical']),
      contentBlocks: z.array(z.any()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Calculate duration, fetch rate, create session
    }),
  
  // Upload audio
  uploadAudio: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      audioData: z.string(), // Base64 or presigned URL approach
    }))
    .mutation(async ({ input, ctx }) => {
      // Upload to Cloud Storage, link to session
    }),
  
  // Upload whiteboard
  uploadWhiteboard: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      whiteboardData: z.string(), // Excalidraw JSON
    }))
    .mutation(async ({ input, ctx }) => {
      // Convert to PNG, upload to Cloud Storage
    }),
  
  // List sessions
  list: protectedProcedure
    .input(z.object({
      clientId: z.string().optional(),
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }).optional(),
      billingStatus: z.enum(['unbilled', 'billed', 'paid']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Implementation
    }),
  
  // Get session timeline for client
  getTimeline: protectedProcedure
    .input(z.string()) // clientId
    .query(async ({ input, ctx }) => {
      // Fetch all sessions, return chronological with thumbnails
    }),
  
  // Generate sharing link
  createSharingLink: protectedProcedure
    .input(z.object({
      sessionId: z.string(),
      expiresInDays: z.number().default(90),
    }))
    .mutation(async ({ input, ctx }) => {
      // Generate token, create sharing link
    }),
});
```

### Invoice Management Routes
```typescript
// src/server/routers/invoices.ts
export const invoicesRouter = router({
  // Generate invoice
  generate: protectedProcedure
    .input(z.object({
      clientId: z.string(),
      sessionIds: z.array(z.string()),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Fetch sessions, company profile, generate PDF, create invoice record
    }),
  
  // List invoices
  list: protectedProcedure
    .input(z.object({
      clientId: z.string().optional(),
      status: z.enum(['draft', 'sent', 'paid']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Implementation
    }),
  
  // Update invoice status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['draft', 'sent', 'paid']),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
  
  // Get revenue report
  getRevenue: protectedProcedure
    .input(z.object({
      dateRange: z.object({
        start: z.string(),
        end: z.string(),
      }),
      clientId: z.string().optional(),
      sessionType: z.enum(['education', 'technical']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Aggregate sessions, calculate totals
    }),
});
```

### Knowledge Base Routes
```typescript
// src/server/routers/knowledge.ts
export const knowledgeRouter = router({
  // Create entry (with encryption if needed)
  create: protectedProcedure
    .input(z.object({
      title: z.string(),
      type: z.enum(['note', 'api-key', 'ssh-record', 'password', 'memo']),
      content: z.string(),
      requireEncryption: z.boolean(),
      tags: z.array(z.string()).optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // If requireEncryption, use Cloud KMS to encrypt content
    }),
  
  // Search knowledge base
  search: protectedProcedure
    .input(z.object({
      query: z.string(),
      type: z.enum(['note', 'api-key', 'ssh-record', 'password', 'memo']).optional(),
      tags: z.array(z.string()).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Full-text search on title/tags, return masked sensitive content
    }),
  
  // Decrypt and reveal sensitive content
  reveal: protectedProcedure
    .input(z.string()) // entryId
    .mutation(async ({ input, ctx }) => {
      // Decrypt with Cloud KMS, log to audit trail, return plaintext
    }),
  
  // Storage management
  getStorageStats: protectedProcedure
    .query(async ({ ctx }) => {
      // Calculate total audio storage, breakdown by month/year
    }),
  
  archiveRecordings: protectedProcedure
    .input(z.object({
      sessionIds: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      // Move audio files to archive storage class
    }),
});
```

---

## Implementation Strategy

### Phase 0: Foundation & Setup (Week 1-2)

**Goals:** Establish development environment, project structure, and core infrastructure

**Tasks:**
- [x] Create repository structure (monorepo or separate frontend/backend)
- [ ] Set up Next.js 14 project with TypeScript, Tailwind CSS, ESLint, Prettier
- [ ] Initialize Cloud Run backend with Express + tRPC
- [ ] Configure Firebase project (Authentication, Firestore, Storage)
- [ ] Set up Google Cloud KMS for encryption
- [ ] Configure Vercel deployment for frontend
- [ ] Set up Cloud Run deployment with Docker
- [ ] Install and configure development tools (VS Code extensions, Git hooks)
- [ ] Create initial Firestore security rules
- [ ] Set up environment variables and secrets management

**Deliverables:**
- Working development environment
- Deployed "Hello World" frontend on Vercel
- Deployed "Hello World" backend on Cloud Run
- Firebase project configured
- CI/CD pipeline basic setup

**Duration:** 1-2 weeks

---

### Phase 1: Authentication & Client Management (Week 3-4)

**Goals:** Implement authentication and basic client/rate CRUD operations

**Tasks:**
- [ ] Implement Firebase Authentication integration (Google OAuth + Email)
- [ ] Create admin role verification middleware
- [ ] Build client management UI (list, create, edit, archive)
- [ ] Implement client tRPC routes (create, list, getById, update, archive)
- [ ] Build rate management UI and API routes
- [ ] Create company profile settings page
- [ ] Implement search and filtering for clients
- [ ] Add form validation with React Hook Form + Zod
- [ ] Write unit tests for client services
- [ ] Create responsive layouts with Tailwind CSS

**Deliverables:**
- Functional authentication flow
- Complete client management module
- Rate configuration system
- Company profile management

**Duration:** 2 weeks

---

### Phase 2: Session Recording & Rich Media (Week 5-8)

**Goals:** Build core session recording features with rich media support

**Tasks:**
- [ ] Implement Tiptap/ProseMirror block editor component
- [ ] Integrate Excalidraw whiteboard component
- [ ] Implement browser audio recording with MediaRecorder API
- [ ] Build session creation form with time tracking
- [ ] Implement automatic duration calculation
- [ ] Create Cloud Storage upload utilities for audio/images
- [ ] Build session list view with filtering
- [ ] Implement session detail view with all content
- [ ] Create session timeline view for clients
- [ ] Add content block reordering (drag-and-drop)
- [ ] Implement auto-save functionality
- [ ] Build audio playback controls
- [ ] Add whiteboard thumbnail generation
- [ ] Write integration tests for session workflows

**Deliverables:**
- Complete session recording interface
- Block-based content editor
- Whiteboard integration
- Audio recording and playback
- Session timeline view

**Duration:** 4 weeks

---

### Phase 3: Invoicing & PDF Generation (Week 9-10)

**Goals:** Implement automated invoice generation and professional PDF output

**Tasks:**
- [ ] Design invoice PDF template (HTML/CSS)
- [ ] Implement PDFKit or Puppeteer for PDF generation
- [ ] Build invoice generation wizard (select sessions, preview)
- [ ] Create invoice number auto-increment system
- [ ] Implement invoice tRPC routes
- [ ] Build invoice list view with status filters
- [ ] Create invoice detail view with PDF preview
- [ ] Implement invoice status management (draft/sent/paid)
- [ ] Add company banking details to invoice template
- [ ] Include course material links in invoice PDF
- [ ] Build revenue reporting dashboard
- [ ] Implement financial analytics (charts with Recharts)
- [ ] Add CSV export for financial reports
- [ ] Test PDF generation performance and quality

**Deliverables:**
- Professional invoice PDF generation
- Invoice management interface
- Revenue reporting dashboard
- Financial analytics

**Duration:** 2 weeks

---

### Phase 4: Knowledge Base & Encryption (Week 11-12)

**Goals:** Implement encrypted knowledge base for sensitive information

**Tasks:**
- [ ] Set up Google Cloud KMS integration
- [ ] Implement encryption/decryption service
- [ ] Build knowledge base UI (list, create, edit, search)
- [ ] Create sensitive information input forms
- [ ] Implement full-text search for knowledge base
- [ ] Add tag and category management
- [ ] Build audio memo recording for knowledge base
- [ ] Implement "reveal" functionality for encrypted content
- [ ] Add audit logging for sensitive data access
- [ ] Create audit log viewer (admin only)
- [ ] Implement storage usage dashboard
- [ ] Add audio recording management (keep/archive/delete)
- [ ] Test encryption/decryption performance
- [ ] Security audit of knowledge base module

**Deliverables:**
- Encrypted knowledge base
- Sensitive information storage
- Audit logging system
- Storage management tools

**Duration:** 2 weeks

---

### Phase 5: Sharing & Export (Week 13-14)

**Goals:** Implement secure sharing links and content export

**Tasks:**
- [ ] Implement sharing link generation with crypto tokens
- [ ] Build public session view (no auth required)
- [ ] Create sharing link management interface
- [ ] Implement link expiration logic (90-day default)
- [ ] Add link expiration notifications
- [ ] Build session export to PDF functionality
- [ ] Include whiteboard images in exported PDFs
- [ ] Add audio access links in exported content
- [ ] Implement bulk session export
- [ ] Create shareable link preview cards
- [ ] Test sharing link security (token randomness)
- [ ] Add access tracking for sharing links

**Deliverables:**
- Secure sharing link system
- Session export to PDF
- Link management interface
- Public session viewer

**Duration:** 2 weeks

---

### Phase 6: Polish, Testing & Deployment (Week 15-18)

**Goals:** Final polish, comprehensive testing, and production deployment

**Tasks:**
- [ ] UI/UX polish and consistency review
- [ ] Mobile responsiveness testing and fixes
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] SEO optimization for public pages
- [ ] Comprehensive error handling and user feedback
- [ ] Write end-to-end tests with Playwright
- [ ] Load testing for Cloud Run backend
- [ ] Security penetration testing
- [ ] Accessibility audit (WCAG AA compliance)
- [ ] Browser compatibility testing
- [ ] Documentation: user guide, admin guide
- [ ] Set up monitoring and alerting (Sentry, Cloud Monitoring)
- [ ] Configure production Firestore indexes
- [ ] Set up automated backups
- [ ] Production deployment to Vercel + Cloud Run
- [ ] Beta testing with real data
- [ ] Bug fixes from beta testing
- [ ] Final production launch

**Deliverables:**
- Production-ready application
- Comprehensive test suite
- User documentation
- Monitoring and alerting setup
- Live production deployment

**Duration:** 4 weeks

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|-------------------|
| **Exceeded free tier costs** | Medium | Medium | Implement usage monitoring early; Cloud Run scales to zero; set billing alerts at $5, $10, $20 thresholds; optimize Firestore queries |
| **Audio file storage costs** | Medium | High | Implement compression (Opus codec); provide storage usage dashboard; enable admin to archive/delete old recordings; consider cheaper storage classes for archives |
| **PDF generation performance** | Medium | Medium | Use PDFKit for simple invoices (faster); Cache generated PDFs in Cloud Storage; Implement background job queue if needed |
| **Firestore query limits** | Low | Medium | Design efficient queries; Create proper indexes; Implement pagination; Monitor query performance |
| **Cloud KMS encryption latency** | Low | Low | Cache decrypted keys briefly in memory (with caution); Batch encryption operations where possible |
| **Browser audio API compatibility** | Low | Medium | Test across browsers; Provide fallback UI for unsupported browsers; Document browser requirements |
| **Whiteboard data size** | Low | Medium | Limit canvas size; Compress Excalidraw JSON; Store as files instead of in Firestore |
| **tRPC type safety breakage** | Low | High | Comprehensive TypeScript strict mode; Automated type checking in CI/CD; Thorough testing of API contracts |
| **Single point of failure (admin device)** | Medium | High | Implement secure backup codes; Multi-device Firebase Auth support; Document recovery procedures |
| **Data loss during development** | Medium | Critical | Automated Firestore backups; Version control all code; Document restore procedures; Test restores regularly |

---

## Testing Strategy

### Unit Testing
- **Framework:** Vitest (fast, Vite-compatible)
- **Coverage:** All business logic, utility functions, encryption/decryption
- **Target:** 80%+ code coverage for critical paths

### Integration Testing
- **Framework:** Jest + React Testing Library
- **Focus:** Component integration, tRPC route handlers, Firestore operations
- **Scope:** Client management, session workflows, invoice generation

### End-to-End Testing
- **Framework:** Playwright
- **Scenarios:** 
  - Complete session recording workflow
  - Invoice generation and PDF download
  - Knowledge base encryption/decryption
  - Sharing link creation and access
- **Frequency:** Run on every deployment to staging

### Security Testing
- **Tools:** OWASP ZAP, manual penetration testing
- **Focus:**
  - Authentication bypass attempts
  - Encryption strength verification
  - Sharing link security (token guessing)
  - SQL injection (via Firestore)
  - XSS and CSRF protection
- **Frequency:** Before production launch, quarterly thereafter

### Performance Testing
- **Tools:** Lighthouse, WebPageTest, k6 (load testing)
- **Metrics:**
  - Page load time < 2 seconds
  - Time to Interactive < 3 seconds
  - Cloud Run cold start < 2 seconds
  - Invoice PDF generation < 5 seconds
- **Frequency:** Weekly during development, continuous in production

### User Acceptance Testing
- **Approach:** Beta testing with real workflows
- **Duration:** 2 weeks before launch
- **Feedback:** Collect via forms, direct observation

---

## Dependencies

### External Services
- [x] Google Cloud Platform account with billing enabled
- [x] Firebase project created
- [ ] Vercel account linked to GitHub repository
- [ ] SendGrid account and API key configured
- [ ] Domain name for custom URL (optional but recommended)

### Development Tools
- [ ] Node.js 20+ installed
- [ ] Docker installed (for Cloud Run local testing)
- [ ] Google Cloud SDK (`gcloud` CLI) installed
- [ ] Firebase CLI installed
- [ ] VS Code with recommended extensions

### Third-Party Libraries
- [ ] All npm packages installed and compatible versions verified
- [ ] Excalidraw React component version tested
- [ ] Tiptap extensions selected and configured
- [ ] PDF generation library chosen (Puppeteer vs PDFKit decision)

### Infrastructure Prerequisites
- [ ] Firestore database created in Native mode
- [ ] Cloud Storage buckets created (production, staging)
- [ ] Cloud KMS keyring and keys created
- [ ] Firebase Authentication providers enabled (Google, Email)
- [ ] Cloud Run service created with proper IAM roles
- [ ] Vercel project connected to GitHub repository

---

## Success Criteria

### Functional Completeness
- [ ] All 15 P0 (Must Have) requirements fully implemented and tested
- [ ] All 4 P1 (Should Have) requirements implemented
- [ ] Invoice PDF generation produces professional, client-ready output
- [ ] Encryption/decryption works reliably with 100% success rate
- [ ] Audio recording functions across Chrome, Firefox, Safari (latest versions)

### Performance Targets
- [ ] Page load time under 2 seconds on broadband connection
- [ ] Session creation completes in under 3 seconds
- [ ] Invoice PDF generation completes in under 5 seconds
- [ ] Search returns results in under 1 second for 1000+ entries
- [ ] No errors during 100 concurrent API requests (load test)

### Security Validation
- [ ] All sensitive data encrypted at rest (verified via Firestore inspection)
- [ ] Authentication required for all admin endpoints (penetration test passed)
- [ ] Sharing links use cryptographically secure tokens (entropy > 128 bits)
- [ ] Audit logs capture 100% of sensitive data access
- [ ] No secrets exposed in frontend code or network traffic

### Cost Efficiency
- [ ] Monthly costs stay within free tiers during first 3 months (<100 sessions/month)
- [ ] Billing alerts configured and tested
- [ ] Storage usage dashboard shows accurate consumption
- [ ] Cloud Run scales to zero when inactive (verified)

### User Experience
- [ ] All workflows completable without documentation (intuitive UI)
- [ ] Mobile-responsive design works on iPhone and Android tablets
- [ ] No more than 3 clicks required for common tasks
- [ ] Error messages are clear and actionable
- [ ] UI follows minimalist design principle (verified by design review)

### Code Quality
- [ ] TypeScript strict mode with zero `any` types in critical paths
- [ ] ESLint passes with zero warnings
- [ ] 80%+ test coverage on business logic
- [ ] All tRPC routes have input validation with Zod schemas
- [ ] Code review checklist completed for all PRs

---

## Post-Launch Monitoring

### Metrics to Track
1. **Usage Metrics:**
   - Sessions created per week
   - Invoices generated per month
   - Knowledge base entries added
   - Audio storage consumed

2. **Performance Metrics:**
   - Average page load time (P95)
   - API response times (P95)
   - Cloud Run cold start frequency
   - Firestore read/write counts

3. **Cost Metrics:**
   - Monthly Google Cloud bill
   - Vercel bandwidth usage
   - SendGrid email quota usage
   - Cloud Storage GB-months

4. **Error Metrics:**
   - Frontend errors (via Sentry)
   - Backend 5xx errors
   - Failed authentication attempts
   - PDF generation failures

### Alerting Thresholds
- Billing alert at $10/month
- Error rate > 1% of requests
- API latency P95 > 3 seconds
- Firestore free tier 80% consumed
- Cloud Storage > 4GB used

---

## Sign-off

**Prepared By:** AI Development Assistant  
**Reviewed By:** [Pending]  
**Approved By:** [Pending]  
**Approval Date:** [Pending]

---

## Next Steps

1. **Review this plan** and provide feedback on:
   - Technology stack choices (Next.js vs Nuxt.js, Node.js vs Python)
   - Timeline feasibility
   - Any missing requirements or concerns

2. **Proceed to Phase 0** (Foundation & Setup) once approved

3. **Generate detailed task breakdown** using `/speckit.tasks` for each phase

4. **Create development environment setup guide** (quickstart.md)

5. **Begin implementation** following phase sequence
