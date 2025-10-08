# Phase 0: Technology Research & Decisions
# 技术研究与决策

**Created:** 2025-10-08  
**Status:** Complete  
**Purpose:** Document all technology choices, rationale, and alternatives considered for the Multi-Business Management Platform

---

## Executive Summary

This document captures the research and decision-making process for selecting the technology stack. The primary drivers were:
1. **Cost optimization** - Maximize free tier usage (Vercel + Google Cloud)
2. **Modern development practices** - TypeScript, serverless architecture, JAMstack
3. **Admin-only simplicity** - No complex multi-tenant requirements
4. **Code clarity** - Type safety and maintainable codebase

---

## Frontend Technology Decisions

### Decision 1: Framework - Next.js 14 (React)

**Decision:** Use **Next.js 14** with React 18+ and TypeScript

**Rationale:**
- **Perfect Vercel integration:** Next.js is built by Vercel, ensuring optimal performance and deployment experience on their free tier
- **Modern React features:** Server Components, Streaming SSR, and App Router for better performance
- **TypeScript first-class support:** Strong typing reduces errors and improves code clarity
- **File-based routing:** Intuitive project structure
- **Built-in optimizations:** Image optimization, font optimization, code splitting out of the box
- **Large ecosystem:** Extensive library support and community resources

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Nuxt.js (Vue 3)** | Excellent DX, similar to Next.js, Vue's simplicity | Smaller ecosystem than React, fewer UI libraries | React has more mature admin UI components (shadcn/ui, Radix) |
| **SvelteKit** | Fastest performance, minimal bundle size | Smaller ecosystem, fewer developers familiar with Svelte | Less established for complex admin interfaces |
| **Remix** | Modern React framework, great form handling | Younger ecosystem, steeper learning curve | Next.js more proven for admin dashboards |
| **Create React App** | Simple setup | No SSR, no built-in optimizations, maintenance mode | Next.js provides much more value for modern apps |

**Implementation Notes:**
- Use Next.js 14 App Router (not Pages Router) for better performance
- Enable TypeScript strict mode for maximum type safety
- Configure for static generation where possible to minimize serverless function usage

---

### Decision 2: Styling - Tailwind CSS 3+

**Decision:** Use **Tailwind CSS 3+** with **shadcn/ui** component library

**Rationale:**
- **Utility-first approach:** Rapid UI development, no CSS context switching
- **Design consistency:** Built-in design system with spacing, colors, typography scales
- **Tree-shaking:** Unused styles automatically removed, minimal bundle size
- **Mobile-first:** Responsive design is core to Tailwind's approach
- **Minimalist design support:** Easy to create clean, spacious layouts required by constitutional principles
- **shadcn/ui integration:** High-quality, accessible components built on Radix UI

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **CSS Modules** | Scoped styles, no class name conflicts | More verbose, requires separate CSS files | Slower development, less consistent design system |
| **Styled Components** | CSS-in-JS, dynamic styling | Runtime overhead, larger bundle, harder debugging | Performance cost not worth it for admin UI |
| **Chakra UI** | Complete component library, good DX | Larger bundle size, opinionated styling | shadcn/ui provides better control and smaller bundle |
| **Material UI** | Comprehensive components, mature | Heavy bundle, Material Design not minimal aesthetic | Doesn't align with minimalist design principle |

**Implementation Notes:**
- Use shadcn/ui for complex components (forms, modals, dropdowns)
- Custom Tailwind configuration for brand colors and spacing
- Dark mode support disabled (light theme only per requirements)

---

### Decision 3: Block Editor - Tiptap (ProseMirror)

**Decision:** Use **Tiptap** for rich text / block editing

**Rationale:**
- **Modern API:** React hooks-based, TypeScript support
- **Extensible:** Easy to add custom block types
- **Headless:** Full control over UI rendering (aligns with Tailwind CSS)
- **ProseMirror foundation:** Battle-tested, used by Notion, Atlassian
- **Active development:** Regular updates, good documentation
- **Block structure:** Natural fit for course logging requirements

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Slate.js** | React-first, fully customizable | Less documented, harder learning curve | Tiptap has better TypeScript support and ecosystem |
| **Draft.js** | Facebook-backed, mature | Maintenance mode, no longer actively developed | Tiptap is actively maintained |
| **Quill** | Simple, lightweight | jQuery-based, older architecture, less TypeScript support | Not as modern or extensible as Tiptap |
| **EditorJS** | Block-first approach, plugin system | Smaller community, less React integration | Tiptap has better React hooks and TypeScript |
| **Lexical** | Facebook's modern editor, performant | Still evolving, less stable API | Tiptap is more mature and stable |

**Implementation Notes:**
- Extensions needed: Headings, Paragraphs, Lists (bulleted/numbered), Code blocks, Images, Links
- Custom image upload to Cloud Storage
- Auto-save every 30 seconds using debounced mutation
- Undo/redo support built-in

---

### Decision 4: Whiteboard - Excalidraw React Component

**Decision:** Embed **Excalidraw** as React component

**Rationale:**
- **Intuitive UX:** Sketch-like drawing experience, easy for non-technical users
- **React component:** `@excalidraw/excalidraw` npm package provides React integration
- **Feature-rich:** Shapes, arrows, text, freehand drawing, colors
- **Export capabilities:** Can export as PNG or SVG
- **Open source:** MIT licensed, active community
- **No backend required:** All drawing happens in browser, then exported for storage

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Fabric.js** | Powerful canvas library, mature | More low-level, requires custom UI | Too much development effort for whiteboard UI |
| **Konva.js** | React wrapper (react-konva), performant | Requires building entire whiteboard from scratch | Excalidraw provides better out-of-box UX |
| **tldraw** | Modern, React-based, infinite canvas | More complex than needed | Excalidraw simpler and sufficient for use case |
| **Custom Canvas API** | Full control, minimal dependencies | Significant development time, complex interaction logic | Not worth reinventing the wheel |

**Implementation Notes:**
- Embed Excalidraw in modal or side panel
- Save Excalidraw JSON to Firestore (compressed)
- Export to PNG for thumbnail generation
- Multiple whiteboards per session supported

---

### Decision 5: State Management - React Context + Zustand

**Decision:** Use **React Context** for auth state, **Zustand** for global UI state

**Rationale:**
- **Minimal overhead:** Admin-only app doesn't need complex state management
- **React Context sufficient:** For authentication state and user profile
- **Zustand for UI:** Lightweight (1KB), simple API, no boilerplate
- **TypeScript support:** Both have excellent TypeScript integration
- **Avoid Redux complexity:** Redux overkill for this application scope

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Redux Toolkit** | Powerful, well-documented, dev tools | Too much boilerplate for admin-only app | Overengineered for our needs |
| **Jotai / Recoil** | Atomic state management, modern | More concepts to learn | Context + Zustand simpler and sufficient |
| **MobX** | Reactive, minimal boilerplate | Different paradigm, learning curve | Zustand simpler and more React-idiomatic |
| **Context only** | No additional dependencies | Can cause unnecessary re-renders | Zustand optimizes this for complex UI state |

**Implementation Notes:**
- Auth Context: Wrap app with Firebase Auth provider
- Zustand stores: UI state (modals, sidebars), temp form data
- TanStack Query handles all server state (no Zustand needed for API data)

---

### Decision 6: Forms - React Hook Form + Zod

**Decision:** Use **React Hook Form** for forms, **Zod** for validation schemas

**Rationale:**
- **Performance:** Uncontrolled components, minimal re-renders
- **Type-safe validation:** Zod schemas provide TypeScript types
- **DX:** Simple API, less boilerplate than Formik
- **Integration:** Works seamlessly with tRPC (shared Zod schemas)
- **Error handling:** Built-in error management and display

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Formik** | Mature, well-known | More re-renders, larger bundle, maintenance mode | React Hook Form is faster and more modern |
| **Final Form** | Performant, subscription-based rendering | Smaller community than React Hook Form | React Hook Form has better TypeScript + Zod integration |
| **Native HTML forms** | No dependencies, simple | Manual validation, no TypeScript safety | Too limited for complex forms (session creation, invoices) |

**Implementation Notes:**
- Define Zod schemas in shared tRPC contract files
- Use `useForm` hook with Zod resolver
- Error messages displayed inline with form fields
- Form state persisted in session storage for long forms

---

## Backend Technology Decisions

### Decision 7: Runtime - Node.js 20+ with TypeScript

**Decision:** Use **Node.js 20 LTS** with **TypeScript**

**Rationale:**
- **Unified language:** Same TypeScript codebase as frontend
- **Type sharing:** Share types between frontend and backend via tRPC
- **Ecosystem:** Massive npm ecosystem for any requirement
- **Async-first:** Perfect for I/O-heavy operations (Firestore, Cloud Storage)
- **Cloud Run support:** Excellent Node.js runtime support
- **Developer familiarity:** Most web developers know JavaScript/TypeScript

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Python (FastAPI)** | Great for PDF generation (ReportLab), async support | Language mismatch with frontend, type sharing harder | Node.js unifies the stack, tRPC requires TypeScript |
| **Go** | Fast, compiled, small memory footprint | Different language from frontend, less flexible for rapid development | Overkill for admin-only app, slower development |
| **Deno** | Modern, TypeScript-native, secure | Smaller ecosystem, less mature | Node.js has more proven libraries for our needs |

**Implementation Notes:**
- Use TypeScript strict mode
- Target Node.js 20 LTS (latest stable)
- Use ES modules (not CommonJS)
- Compile with `tsc` or `esbuild` for production

---

### Decision 8: API Framework - Express + tRPC

**Decision:** Use **Express.js** for HTTP server, **tRPC** for type-safe API

**Rationale:**
- **tRPC end-to-end type safety:** Frontend and backend share exact same types
- **No API code generation:** Types derived directly from TypeScript
- **Express simplicity:** Lightweight, well-known, easy middleware system
- **Type-safe queries/mutations:** Catch API errors at compile time
- **Zod integration:** Validation schemas shared between frontend and backend
- **React Query integration:** tRPC client uses TanStack Query under the hood

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **REST API (no tRPC)** | Standard, widely understood | No type safety, manual API client code | tRPC provides type safety with zero overhead |
| **GraphQL (Apollo)** | Powerful query language, type-safe | More complex setup, overkill for admin API | tRPC simpler and sufficient for our needs |
| **Fastify** | Faster than Express, modern | Smaller ecosystem, different middleware pattern | Express more familiar, performance difference negligible for our load |
| **Hono** | Ultra-lightweight, edge-optimized | Very new, less proven | Express more stable and proven for Cloud Run |

**Implementation Notes:**
- tRPC router structure: `/clients`, `/sessions`, `/invoices`, `/knowledge`
- Middleware: Firebase Auth token verification, error handling, logging
- Input validation with Zod on all routes
- Procedures: `query` (read), `mutation` (write/delete)

---

### Decision 9: Database - Google Firestore (Native Mode)

**Decision:** Use **Google Firestore** in Native Mode (not Datastore mode)

**Rationale:**
- **Generous free tier:** 50K reads, 20K writes, 20K deletes per day
- **NoSQL flexibility:** Schema-less design accommodates diverse data (sessions, invoices, knowledge base)
- **Real-time capabilities:** Can add live updates to UI in future
- **Managed service:** No database administration overhead
- **Strong consistency:** Native mode provides strong consistency within same region
- **Automatic scaling:** Handles growth without configuration
- **Offline support:** Can add offline capabilities to web app if needed

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **PostgreSQL (Cloud SQL)** | Relational, ACID, complex queries | **No free tier**, costs $10+/month, requires management | Cost-prohibitive for initial launch |
| **MongoDB Atlas** | NoSQL, flexible, generous free tier | Another vendor, less Google Cloud integration | Firestore more integrated with our stack |
| **Supabase (PostgreSQL)** | Generous free tier, PostgreSQL features, real-time | Another vendor dependency, less Google Cloud integration | Firestore aligns better with Google Cloud strategy |
| **Firestore Datastore Mode** | Compatible with older Datastore apps | No real-time, less intuitive data model | Native mode is more modern and feature-rich |
| **Firebase Realtime Database** | Simple, real-time first | Older architecture, less powerful querying | Firestore is newer, more capable |

**Implementation Notes:**
- Use Firestore Native mode (not Datastore mode)
- Create composite indexes for common queries
- Design denormalized data models for read efficiency
- Use subcollections sparingly (prefer embedded arrays for small datasets)
- Implement Firestore security rules (admin-only for all collections)

---

### Decision 10: File Storage - Google Cloud Storage

**Decision:** Use **Google Cloud Storage** for audio files, PDFs, images

**Rationale:**
- **Free tier:** 5GB storage, 1GB network egress per month
- **Serverless:** No infrastructure management
- **Signed URLs:** Secure, time-limited access to files without authentication
- **CDN integration:** Can add Cloud CDN if needed for global performance
- **Lifecycle policies:** Automatically archive or delete old files
- **Multiple storage classes:** Standard, Nearline (archive) for cost optimization
- **Cloud Run integration:** Easy access from backend via SDK

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Vercel Blob Storage** | Integrated with Vercel, simple API | Costs $0.15/GB, no free tier | Cloud Storage free tier is 5GB |
| **Amazon S3** | Industry standard, mature | Another vendor, no Google Cloud integration | Cloud Storage better for Google Cloud ecosystem |
| **Cloudflare R2** | S3-compatible, cheap egress | No free tier, another vendor | Cloud Storage free tier sufficient initially |
| **Firebase Storage** | Same as Cloud Storage but Firebase SDK | Essentially the same service, slightly different SDK | Cloud Storage gives more control |

**Implementation Notes:**
- Create buckets: `student-record-prod`, `student-record-staging`
- Organize files: `/audio/{sessionId}/{filename}.m4a`, `/pdfs/invoices/{invoiceId}.pdf`, `/whiteboards/{sessionId}/{whiteboardId}.png`
- Use signed URLs for frontend access (no direct public access)
- Set lifecycle policy: Archive audio > 2 years old to Nearline storage
- Implement CORS for browser uploads if needed

---

### Decision 11: Encryption - Google Cloud KMS

**Decision:** Use **Google Cloud Key Management Service** for encrypting sensitive data

**Rationale:**
- **Hardware-backed keys:** Keys stored in hardware security modules (HSMs)
- **Automatic key rotation:** Can configure automatic rotation policies
- **Audit logging:** All key usage logged in Cloud Logging
- **IAM integration:** Fine-grained access control
- **Compliance:** Meets various compliance standards (SOC 2, ISO 27001)
- **Free tier:** 20,000 crypto operations per month (sufficient for admin-only usage)
- **API simplicity:** Easy to use from Node.js with `@google-cloud/kms`

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Node.js crypto module** | No external dependencies, free | Key management is manual, no audit logs, less secure | Constitutional security principle requires enterprise-grade encryption |
| **AWS KMS** | Similar to Cloud KMS, mature | Different cloud vendor, additional account needed | Cloud KMS integrated with our stack |
| **HashiCorp Vault** | Powerful, open source, self-hostable | Complex setup, requires separate infrastructure, costs | Cloud KMS is managed and simpler |
| **Encrypt client-side only** | Maximum security, zero-knowledge | Key management burden on client, recovery difficult | Server-side encryption with KMS more practical |

**Implementation Notes:**
- Create keyring: `student-record-keyring`
- Create key: `sensitive-data-key` with automatic 90-day rotation
- Encrypt before storing in Firestore: `encryptedContent = KMS.encrypt(plaintext)`
- Decrypt only when admin explicitly requests: `plaintext = KMS.decrypt(encryptedContent)`
- Log all decrypt operations to audit trail

---

### Decision 12: PDF Generation - PDFKit (invoices) + Puppeteer (sessions)

**Decision:** Use **PDFKit** for invoice generation, **Puppeteer** for complex session exports

**Rationale:**
- **PDFKit strengths:** Programmatic PDF generation, fast, small bundle, perfect for invoices (structured data)
- **Puppeteer strengths:** HTML-to-PDF, handles complex layouts, perfect for rich content (session notes, whiteboards)
- **Cost efficiency:** Both can run on Cloud Run without additional services
- **Quality:** PDFKit produces clean, professional invoices; Puppeteer preserves HTML styling

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Puppeteer only** | One library for everything, HTML templates | Slower for simple PDFs, larger bundle, needs Chromium | PDFKit faster for invoices |
| **PDFKit only** | Lightweight, fast | Complex layouts difficult, manual positioning tedious | Not suitable for rich session content |
| **react-pdf** | Render React components as PDF, client-side | Client-side only, limited styling, slower | Need server-side generation for security |
| **wkhtmltopdf** | Command-line tool, HTML-to-PDF | Binary dependency, less modern, maintenance concerns | Puppeteer more modern and maintained |
| **Prince XML** | High-quality PDF generation | Expensive license (~$500+), overkill for our needs | PDFKit + Puppeteer free and sufficient |

**Implementation Notes:**
- PDFKit for invoices: Create PDF templates in code, populate with data
- Puppeteer for sessions: Render HTML page with Next.js, screenshot to PDF
- Optimize Puppeteer: Use headless mode, reuse browser instance, cache fonts
- Store generated PDFs in Cloud Storage
- Return signed URLs to frontend

---

## Authentication & Services Decisions

### Decision 13: Authentication - Firebase Authentication

**Decision:** Use **Firebase Authentication** with Google OAuth and Email/Password

**Rationale:**
- **Free tier:** Unlimited users at no cost
- **Google OAuth built-in:** One-click Google Sign-In for admin
- **Email/Password support:** Fallback authentication method
- **Admin SDK:** Verify tokens on backend easily
- **Token-based:** JWT tokens, stateless authentication
- **MFA support:** Can add multi-factor authentication later if needed
- **No user management code:** Firebase handles password resets, email verification

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Auth0** | Full-featured, enterprise-grade | Free tier limits (7,000 users), another vendor | Firebase sufficient and unlimited |
| **NextAuth.js** | Built for Next.js, flexible | Requires session database, more setup | Firebase simpler for admin-only |
| **Clerk** | Modern, great DX, pre-built components | Costs $25/month after 5,000 users | Firebase free tier unlimited |
| **Custom JWT auth** | Full control, no dependencies | Security concerns, manual implementation | Firebase more secure and battle-tested |
| **Supabase Auth** | Part of Supabase, PostgreSQL-backed | Another vendor, less Google Cloud integration | Firebase aligned with our stack |

**Implementation Notes:**
- Enable Google OAuth and Email/Password providers in Firebase Console
- Restrict to single admin email initially
- Verify ID tokens on backend using Firebase Admin SDK
- Store user UID in audit logs
- Add custom claims for admin role verification

---

### Decision 14: Email Service - SendGrid

**Decision:** Use **SendGrid** for transactional emails

**Rationale:**
- **Free tier:** 100 emails per day (sufficient for admin notifications)
- **Deliverability:** High reputation, good inbox placement
- **Templates:** HTML email templates with dynamic content
- **API simplicity:** RESTful API, Node.js SDK available
- **Analytics:** Track opens, clicks, bounces
- **Scalable:** Can upgrade easily if needs grow

**Alternatives Considered:**

| Alternative | Pros | Cons | Why Not Chosen |
|------------|------|------|----------------|
| **Mailgun** | Similar features, good reputation | Free tier only 100 emails/month (vs SendGrid's 100/day) | SendGrid more generous free tier |
| **Amazon SES** | Very cheap ($0.10 per 1,000 emails) | Requires AWS account, more complex setup, no free tier | SendGrid free tier avoids complexity |
| **Postmark** | High deliverability, simple | Free tier only 100 emails total, then paid | SendGrid 100/day ongoing |
| **Resend** | Modern, developer-friendly | Free tier 100 emails/day, newer/less proven | SendGrid more established |

**Implementation Notes:**
- Use SendGrid for: Link expiration warnings, invoice sent notifications (optional)
- Create HTML email templates in SendGrid dashboard
- Store SendGrid API key in Google Secret Manager
- Implement retry logic for failed sends
- Monitor email quota usage

---

## Architecture Patterns

### Decision 15: Monorepo vs Separate Repos

**Decision:** Use **monorepo** (single repository) for frontend and backend

**Rationale:**
- **Shared types:** Easy to share TypeScript types via tRPC
- **Atomic changes:** Update both frontend and backend in single commit/PR
- **Simplified CI/CD:** One deployment pipeline
- **Better DX:** Single place to clone, single `node_modules` with pnpm workspaces
- **Code reuse:** Share utilities, validation schemas

**Implementation Notes:**
- Structure:
  ```
  /
  ├── apps/
  │   ├── web/          # Next.js frontend
  │   └── api/          # Cloud Run backend
  ├── packages/
  │   ├── shared/       # Shared types, Zod schemas
  │   └── ui/           # Shared UI components (optional)
  ├── package.json      # Root package.json
  └── pnpm-workspace.yaml
  ```
- Use **pnpm** for efficient package management
- Use **Turborepo** for build caching and parallel execution

---

### Decision 16: Deployment Strategy

**Decision:** 
- **Frontend:** Continuous deployment to Vercel (main branch → production, PR → preview)
- **Backend:** Continuous deployment to Cloud Run via GitHub Actions

**Rationale:**
- **Vercel:** Automatic deployments on git push, zero configuration
- **Cloud Run:** Dockerized backend, easy rollbacks, automatic HTTPS
- **Preview environments:** Every PR gets preview URL for testing
- **Fast feedback:** Deployments complete in 2-3 minutes

**Implementation Notes:**
- Frontend: Connect Vercel to GitHub repository, auto-deploy on push to main
- Backend: 
  - Dockerfile for Express + tRPC API
  - GitHub Actions workflow: build → push to Google Container Registry → deploy to Cloud Run
  - Environment variables via Google Secret Manager
  - Blue-green deployments for zero downtime

---

## Open Questions Resolved

### Q1: Next.js App Router vs Pages Router?
**Resolution:** Use **App Router** (Next.js 13+)  
**Reason:** App Router is the future, better performance with React Server Components, better routing

### Q2: TypeScript strict mode?
**Resolution:** **Yes, enable strict mode**  
**Reason:** Aligns with code clarity principle, catches errors early

### Q3: Firestore security rules or backend validation?
**Resolution:** **Both** - Firestore rules as defense-in-depth, backend validation primary  
**Reason:** Backend validation enforces business logic, Firestore rules prevent direct access

### Q4: Client-side or server-side PDF generation?
**Resolution:** **Server-side** (Cloud Run)  
**Reason:** Security (don't expose data to client), consistent rendering, better performance

### Q5: Real-time updates with Firestore?
**Resolution:** **Not initially** - use polling or manual refresh  
**Reason:** Admin-only app doesn't need real-time, can add later if needed

### Q6: Vercel functions or Cloud Run?
**Resolution:** **Cloud Run for all backend logic**  
**Reason:** More control, easier to manage, Vercel functions have 10s timeout limit (too short for PDF generation)

---

## Cost Projections

### Monthly Cost Estimates (First 3 Months, <100 sessions/month)

| Service | Free Tier | Expected Usage | Est. Cost |
|---------|-----------|----------------|-----------|
| **Vercel** | 100GB bandwidth | <10GB | $0 |
| **Cloud Run** | 2M requests, 360K vCPU-sec | ~10K requests | $0 |
| **Firestore** | 50K reads, 20K writes/day | ~5K reads, 1K writes/day | $0 |
| **Cloud Storage** | 5GB storage, 1GB egress | ~2GB storage, <1GB egress | $0 |
| **Cloud KMS** | 20K ops/month | ~500 ops/month | $0 |
| **Firebase Auth** | Unlimited | ~100 auth operations/month | $0 |
| **SendGrid** | 100 emails/day | ~5 emails/day | $0 |
| **Sentry** | 5K errors/month | <1K errors/month | $0 |
| **Total** | | | **$0** |

### Cost at Scale (1,000 sessions/month)

| Service | Expected Usage | Est. Cost |
|---------|----------------|-----------|
| **Vercel** | ~50GB bandwidth | $0 (within free) |
| **Cloud Run** | ~100K requests | $0 (within free) |
| **Firestore** | ~200K reads, 50K writes/month | $0-5 |
| **Cloud Storage** | ~20GB storage, 5GB egress | $0.50-2 |
| **Cloud KMS** | ~5K ops/month | $0 (within free) |
| **Total** | | **~$5-7/month** |

---

## Conclusion

All technology decisions have been made with the following priorities:

1. ✅ **Cost optimization:** Maximized free tier usage across all services
2. ✅ **Type safety:** TypeScript everywhere, tRPC for API, Zod for validation
3. ✅ **Developer experience:** Modern tools with excellent documentation
4. ✅ **Code clarity:** Maintainable codebase with strong typing and consistent patterns
5. ✅ **Security:** Enterprise-grade encryption (Cloud KMS), managed authentication (Firebase)
6. ✅ **Performance:** Serverless scales to zero, efficient querying, optimized bundles
7. ✅ **Minimalist design:** Tailwind CSS enables rapid, clean UI development

**Status:** All research complete, ready to proceed to implementation ✅

---

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tiptap Documentation](https://tiptap.dev/docs)
- [Excalidraw Documentation](https://docs.excalidraw.com/)
- [Google Cloud KMS Documentation](https://cloud.google.com/kms/docs)

