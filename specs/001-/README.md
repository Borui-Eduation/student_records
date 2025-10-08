# Feature 001: Multi-Business Management Platform
# 功能001:教育与技术服务多业务管理平台

**Status:** Planning Complete ✅  
**Feature Branch:** `001-`  
**Created:** 2025-10-08

---

## Quick Links

- **[Specification](./spec.md)** - Complete feature requirements (v1.1.0)
- **[Implementation Plan](./plan.md)** - 6-phase implementation strategy (~14-18 weeks)
- **[Data Model](./docs/data-model.md)** - Firestore database schema and TypeScript types
- **[Technology Research](./docs/research.md)** - Technology stack decisions and rationale
- **[Quickstart Guide](./docs/quickstart.md)** - Developer setup instructions (30-45 min)
- **[API Contracts](./contracts/api-overview.md)** - tRPC API documentation

---

## Overview

A unified backend management platform for education teaching and technical services that provides:

1. **Multi-Rate Financial Automation** - Automated invoicing with flexible billing rates
2. **Rich Media Course Logging** - Block editor, whiteboard, and audio recording
3. **Encrypted Knowledge Base** - Secure storage for API keys and sensitive credentials
4. **Professional Invoicing** - PDF generation with banking details
5. **Secure Sharing** - Time-limited links for client access

---

## Technology Stack

### Frontend
- **Framework:** Next.js 14 (React 18 + TypeScript)
- **Deployment:** Vercel (free tier)
- **Styling:** Tailwind CSS + shadcn/ui
- **Block Editor:** Tiptap (ProseMirror)
- **Whiteboard:** Excalidraw React
- **State:** React Context + Zustand
- **Forms:** React Hook Form + Zod

### Backend
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express + tRPC
- **Deployment:** Google Cloud Run (free tier)
- **Database:** Google Firestore Native Mode
- **Storage:** Google Cloud Storage
- **Encryption:** Google Cloud KMS
- **PDF:** PDFKit + Puppeteer

### Services
- **Authentication:** Firebase Authentication
- **Email:** SendGrid (free tier: 100 emails/day)
- **Monitoring:** Google Cloud Logging + Sentry

---

## Project Structure

```
specs/001-/
├── README.md                      # This file
├── spec.md                        # Feature specification (22 requirements)
├── plan.md                        # Implementation plan (6 phases)
│
├── checklists/
│   └── requirements.md            # Quality validation checklist (100% complete)
│
├── docs/
│   ├── research.md                # Technology decisions and alternatives
│   ├── data-model.md              # Complete Firestore schema (8 collections)
│   └── quickstart.md              # Developer setup guide
│
└── contracts/
    ├── api-overview.md            # tRPC API introduction
    └── clients-router.md          # Example: Clients API endpoints
```

---

## Key Features

### Must Have (P0) - 16 Requirements

1. **Client Management** (FR-001 to FR-003)
   - CRUD operations for 3 client types
   - Flexible rate configuration
   - Company profile management

2. **Session Recording** (FR-004 to FR-009)
   - Quick time tracking with auto-calculation
   - Tiptap block editor for rich content
   - Excalidraw whiteboard integration
   - Browser audio recording
   - Secure sharing links (90-day expiration)
   - PDF export functionality

3. **Financial Management** (FR-010 to FR-012)
   - Revenue calculation and reporting
   - Automated invoice generation (INV-001, INV-002...)
   - Professional PDF invoices with banking details

4. **Knowledge Base** (FR-013 to FR-016)
   - Encrypted storage (AES-256 via Cloud KMS)
   - Full-text search with tags
   - Voice memo recording
   - Manual storage management (Keep/Archive/Delete)

### Should Have (P1) - 4 Requirements

- Multi-dimensional financial analytics
- Student course history timeline
- Bulk session operations
- (FR-017 to FR-019)

### Nice to Have (P2) - 3 Requirements

- Session templates
- Dashboard overview
- Advanced global search
- (FR-020 to FR-022)

---

## Implementation Phases

| Phase | Duration | Key Deliverables |
|-------|----------|-----------------|
| **Phase 0: Foundation** | 1-2 weeks | Dev environment, Firebase/Cloud setup, CI/CD |
| **Phase 1: Auth & Clients** | 2 weeks | Authentication, client CRUD, rate management |
| **Phase 2: Sessions & Media** | 4 weeks | Tiptap editor, Excalidraw, audio recording |
| **Phase 3: Invoicing** | 2 weeks | PDF generation, invoice management, reporting |
| **Phase 4: Knowledge Base** | 2 weeks | Encryption, search, audit logging |
| **Phase 5: Sharing & Export** | 2 weeks | Sharing links, session export to PDF |
| **Phase 6: Polish & Launch** | 4 weeks | Testing, optimization, production deployment |
| **Total** | **~14-18 weeks** | Production-ready application |

---

## Data Model Summary

### 8 Firestore Collections

1. **clients** - Client records (institutions, individuals, projects)
2. **rates** - Hourly billing rates with effective dates
3. **sessions** - Service sessions with rich media content
4. **invoices** - Invoice records with line items
5. **knowledgeBase** - Encrypted sensitive information
6. **sharingLinks** - Secure, time-limited sharing tokens
7. **companyProfile** - Single document with company info
8. **auditLogs** - Immutable access logs

See [data-model.md](./docs/data-model.md) for complete schemas.

---

## Success Criteria

### Functional
- ✅ All 16 P0 requirements implemented
- ✅ Invoice PDFs are client-ready and professional
- ✅ 100% encryption success rate for sensitive data
- ✅ Audio recording works across Chrome, Firefox, Safari

### Performance
- ✅ Page load < 2 seconds
- ✅ Session creation < 3 seconds
- ✅ Invoice PDF generation < 5 seconds
- ✅ Search results < 1 second

### Security
- ✅ All sensitive data encrypted at rest
- ✅ Authentication required for all admin endpoints
- ✅ Sharing links use cryptographically secure tokens (128-bit entropy)
- ✅ 100% audit logging for sensitive data access

### Cost Efficiency
- ✅ Monthly costs stay within free tiers for first 3 months
- ✅ Billing alerts configured at $5, $10, $20
- ✅ Cloud Run scales to zero when inactive

---

## Constitutional Principles Alignment

| Principle | How Addressed |
|-----------|--------------|
| **Light Minimalist Design** | Tailwind CSS, clean component structure, light color palette |
| **Code Clarity & Readability** | TypeScript strict mode, ESLint/Prettier, comprehensive comments |
| **Multi-Rate Financial Automation** | Flexible rate system, automated invoice generation |
| **Rich Media Course Logging** | Tiptap block editor, Excalidraw whiteboard, audio recording |
| **Security & Encryption First** | Cloud KMS encryption, Firebase Auth, HTTPS everywhere |
| **Efficient Operations** | Serverless architecture, optimized workflows, admin-only simplicity |
| **Professional Service Delivery** | Professional PDF templates, secure sharing, client-ready exports |

---

## Cost Projections

### Free Tier Usage (First 3 Months)

| Service | Free Tier Limit | Expected Usage | Cost |
|---------|----------------|----------------|------|
| Vercel | 100GB bandwidth | <10GB | **$0** |
| Cloud Run | 2M requests/month | ~10K requests | **$0** |
| Firestore | 50K reads, 20K writes/day | ~5K reads, 1K writes/day | **$0** |
| Cloud Storage | 5GB + 1GB egress | ~2GB storage | **$0** |
| Cloud KMS | 20K operations | ~500 ops | **$0** |
| Firebase Auth | Unlimited | ~100 auth ops | **$0** |
| SendGrid | 100 emails/day | ~5 emails/day | **$0** |
| **Total** | | | **$0/month** |

### At Scale (1,000 sessions/month)
- Estimated cost: **$5-7/month**
- Primary costs: Firestore operations, Cloud Storage

---

## Getting Started

### Prerequisites
- Node.js 20+, pnpm, Docker, Google Cloud SDK, Firebase CLI
- Google Cloud account (billing enabled)
- Vercel account
- SendGrid account

### Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd student-record
git checkout 001-
pnpm install

# 2. Set up Google Cloud (15 min)
# Follow docs/quickstart.md section "Google Cloud Setup"

# 3. Set up Firebase (10 min)
# Follow docs/quickstart.md section "Firebase Setup"

# 4. Configure environment variables (5 min)
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
# Edit both files with your credentials

# 5. Start development servers
pnpm dev        # Starts both frontend and backend

# 6. Open http://localhost:3000
```

Full setup instructions: **[Quickstart Guide](./docs/quickstart.md)**

---

## Next Steps

1. ✅ **Planning complete** - All documents finalized
2. 🔄 **Review & approve** - Review plan and technology choices
3. ⏳ **Phase 0: Setup** - Initialize project structure (Week 1-2)
4. ⏳ **Phase 1: Auth & Clients** - Build foundation (Week 3-4)
5. ⏳ **Continue phases 2-6** - Full implementation (Week 5-18)

---

## Useful Commands

```bash
# Development
pnpm dev              # Start all dev servers
pnpm build            # Build all packages
pnpm lint             # Lint all code
pnpm format           # Format with Prettier
pnpm typecheck        # TypeScript type checking

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode

# Database
firebase firestore:delete --all-collections    # Clear Firestore data
firebase deploy --only firestore:rules         # Deploy security rules

# Cloud Run
gcloud run services list                       # List services
gcloud run deploy <service>                    # Deploy service
```

---

## Documentation Index

### Planning Documents
- [Specification](./spec.md) - What to build (requirements)
- [Implementation Plan](./plan.md) - How to build it (phases, tasks, timeline)
- [Quality Checklist](./checklists/requirements.md) - Validation checklist (100% complete)

### Technical Documents
- [Technology Research](./docs/research.md) - Why these technologies (decisions, alternatives)
- [Data Model](./docs/data-model.md) - Database schema (8 collections, TypeScript interfaces)
- [API Contracts](./contracts/api-overview.md) - tRPC API reference
- [Clients Router](./contracts/clients-router.md) - Example API endpoint documentation

### Developer Guides
- [Quickstart Guide](./docs/quickstart.md) - Setup instructions (30-45 min)
- [Constitution](../../.specify/memory/constitution.md) - Project principles

---

## Support & Resources

- **Specification Questions:** Review [spec.md](./spec.md) and [checklists/requirements.md](./checklists/requirements.md)
- **Technical Questions:** Review [docs/research.md](./docs/research.md) and [docs/data-model.md](./docs/data-model.md)
- **Setup Issues:** Review [docs/quickstart.md](./docs/quickstart.md) - "Common Issues" section
- **API Questions:** Review [contracts/api-overview.md](./contracts/api-overview.md)

---

## License

[To be determined]

---

**Status:** ✅ Planning phase complete. Ready for implementation.  
**Last Updated:** 2025-10-08  
**Next Milestone:** Phase 0 - Development environment setup

