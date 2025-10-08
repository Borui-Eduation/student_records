# Implementation Tasks: Multi-Business Management Platform
# 实施任务:教育与技术服务多业务管理平台

**Feature:** Multi-Business Management Platform  
**Generated:** 2025-10-08  
**Total Tasks:** 156  
**Organization:** By Feature/User Story  
**Execution Strategy:** MVP-first with incremental delivery

---

## Task Organization Strategy

This task list is organized by **functional requirements** (user stories) to enable:
- ✅ Independent feature development
- ✅ Parallel team execution
- ✅ Incremental testing and delivery
- ✅ Early MVP deployment

### Phases

1. **Phase 1: Project Setup** (T001-T015) - Foundation for all features
2. **Phase 2: Authentication & Infrastructure** (T016-T025) - Blocking prerequisites
3. **Phase 3-10: Feature Implementation** - One phase per user story (P0 features)
4. **Phase 11-13: Advanced Features** (P1 features)
5. **Phase 14: Integration & Polish** - Cross-cutting concerns

### Parallel Execution Markers

- **[P]** = Can be done in parallel with adjacent [P] tasks
- **[Story: FR-XXX]** = Links task to functional requirement
- **Checkpoint** = Test/validate before proceeding

---

## Phase 1: Project Setup & Foundation
**Duration:** Week 1-2  
**Goal:** Establish development environment and project structure

### T001: Initialize Monorepo Structure [P]
**File:** `package.json`, `pnpm-workspace.yaml`, `turbo.json`
```bash
Create project structure:
/apps/web (Next.js frontend)
/apps/api (Express backend)
/packages/shared (shared types)
```
**Dependencies:** None  
**Deliverable:** Working monorepo with pnpm workspaces

### T002: Configure Frontend Project (Next.js) [P]
**Files:** `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.js`
- Initialize Next.js 14 with TypeScript
- Configure App Router
- Set up Tailwind CSS
- Install shadcn/ui CLI
- Configure path aliases (@/components, @/lib)

**Dependencies:** T001  
**Deliverable:** Next.js dev server runs successfully

### T003: Configure Backend Project (Express + tRPC) [P]
**Files:** `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/index.ts`
- Initialize Express with TypeScript
- Install tRPC server packages
- Configure CORS middleware
- Set up error handling middleware
- Configure TypeScript strict mode

**Dependencies:** T001  
**Deliverable:** Express server runs on localhost:8080

### T004: Set Up Shared Types Package [P]
**Files:** `packages/shared/package.json`, `packages/shared/tsconfig.json`, `packages/shared/src/index.ts`
- Initialize shared package
- Export base TypeScript interfaces
- Configure for consumption by web and api

**Dependencies:** T001  
**Deliverable:** Shared types importable in both apps

### T005: Configure Google Cloud Project
**Tool:** Google Cloud Console, gcloud CLI
- Create new GCP project: `student-record-prod`
- Enable required APIs: Firestore, Cloud Storage, Cloud Run, Cloud KMS
- Set up billing with alerts ($5, $10, $20)
- Create service account with appropriate roles

**Dependencies:** None (External setup)  
**Deliverable:** GCP project ready, service account key downloaded

### T006: Initialize Firestore Database
**Tool:** Firebase Console, gcloud firestore
- Create Firestore database in Native mode (region: asia-east1)
- Set up initial security rules (admin-only)
- Create composite indexes from data-model.md

**Dependencies:** T005  
**Deliverable:** Firestore database accessible, indexes created

### T007: Set Up Cloud Storage Buckets
**Tool:** gsutil
- Create buckets: `student-record-prod`, `student-record-staging`
- Configure CORS for browser uploads
- Set up lifecycle policies

**Dependencies:** T005  
**Deliverable:** Buckets created and accessible

### T008: Configure Cloud KMS
**Tool:** gcloud kms
- Create keyring: `student-record-keyring`
- Create encryption key: `sensitive-data-key`
- Set 90-day auto-rotation
- Grant service account crypto permissions

**Dependencies:** T005  
**Deliverable:** KMS key ready for encryption operations

### T009: Set Up Firebase Authentication
**Tool:** Firebase Console
- Link GCP project to Firebase
- Enable Google OAuth provider
- Enable Email/Password provider
- Whitelist admin email
- Get Firebase config for web app

**Dependencies:** T005  
**Deliverable:** Firebase Auth configured

### T010: Configure Development Environment Variables
**Files:** `apps/web/.env.local`, `apps/api/.env`
- Frontend: Firebase config, API URL
- Backend: GCP credentials, Firebase project ID, Cloud Storage bucket, KMS keys
- Create .env.example templates

**Dependencies:** T005-T009  
**Deliverable:** Environment variables documented and configured

### T011: Set Up ESLint and Prettier [P]
**Files:** `.eslintrc.js`, `.prettierrc`, `package.json`
- Configure ESLint for TypeScript
- Set up Prettier with consistent formatting
- Add lint-staged for pre-commit hooks
- Configure VS Code settings

**Dependencies:** T001-T004  
**Deliverable:** Linting works across all packages

### T012: Configure Git and GitHub Repository [P]
**Files:** `.gitignore`, `.github/workflows/`
- Initialize git repository
- Create .gitignore (exclude .env, node_modules, build artifacts, service account keys)
- Set up GitHub repository
- Create branch protection rules

**Dependencies:** None  
**Deliverable:** Git repository initialized

### T013: Set Up Docker for Cloud Run [P]
**Files:** `apps/api/Dockerfile`, `apps/api/.dockerignore`
- Create multi-stage Dockerfile for Node.js app
- Optimize for production (smaller image size)
- Configure for Cloud Run deployment

**Dependencies:** T003  
**Deliverable:** Docker image builds successfully

### T014: Deploy Initial "Hello World" to Vercel
**Tool:** Vercel Dashboard, Vercel CLI
- Connect GitHub repository to Vercel
- Configure build settings (root: apps/web)
- Add environment variables
- Deploy and verify

**Dependencies:** T002, T010  
**Deliverable:** Frontend accessible at Vercel URL

### T015: Deploy Initial "Hello World" to Cloud Run
**Tool:** gcloud run deploy
- Build and push Docker image to GCR
- Deploy to Cloud Run (asia-east1)
- Configure service account
- Test endpoint

**Dependencies:** T003, T013, T010  
**Deliverable:** Backend accessible at Cloud Run URL

**CHECKPOINT:** Both frontend and backend deployed and accessible

---

## Phase 2: Authentication & Core Infrastructure
**Duration:** Week 3  
**Goal:** Implement authentication and base tRPC setup (blocking prerequisites)

### T016: [Story: Foundation] Implement Firebase Auth Client SDK
**Files:** `apps/web/lib/firebase.ts`, `apps/web/contexts/AuthContext.tsx`
- Initialize Firebase in Next.js
- Create AuthContext with React Context
- Implement sign-in methods (Google OAuth, Email/Password)
- Implement sign-out
- Create useAuth hook

**Dependencies:** T002, T009  
**Deliverable:** Authentication works in frontend

### T017: [Story: Foundation] Create Auth Middleware for Backend
**Files:** `apps/api/src/middleware/auth.ts`
- Verify Firebase ID tokens using Admin SDK
- Extract user ID from token
- Attach user to request context
- Handle authentication errors

**Dependencies:** T003, T009  
**Deliverable:** Backend can verify Firebase tokens

### T018: [Story: Foundation] Set Up tRPC Client (Frontend)
**Files:** `apps/web/lib/trpc.ts`, `apps/web/app/providers.tsx`
- Configure tRPC client with TanStack Query
- Set up auth headers (Firebase ID token)
- Configure error handling
- Create React provider

**Dependencies:** T002, T016  
**Deliverable:** Frontend can make tRPC calls

### T019: [Story: Foundation] Set Up tRPC Server (Backend)
**Files:** `apps/api/src/trpc.ts`, `apps/api/src/context.ts`
- Create tRPC context with authenticated user
- Create protected procedure (requires auth)
- Set up router structure
- Configure error formatter

**Dependencies:** T003, T017  
**Deliverable:** Backend tRPC server ready

### T020: [Story: Foundation] Create Root tRPC Router
**Files:** `apps/api/src/routers/_app.ts`, `apps/api/src/index.ts`
- Initialize root router
- Export router type for frontend
- Integrate with Express

**Dependencies:** T019  
**Deliverable:** tRPC endpoint accessible at /trpc

### T021: [Story: Foundation] Define Shared Zod Schemas
**Files:** `packages/shared/src/schemas/index.ts`
- Export all Zod schemas for validation
- Share between frontend and backend
- Include: Client, Rate, Session, Invoice schemas

**Dependencies:** T004  
**Deliverable:** Shared schemas available for import

### T022: [Story: Foundation] Create Firestore Client Utility
**Files:** `apps/api/src/lib/firestore.ts`
- Initialize Firestore Admin SDK
- Create typed collection references
- Export db instance

**Dependencies:** T003, T006  
**Deliverable:** Backend can read/write Firestore

### T023: [Story: Foundation] Create Cloud Storage Utility
**Files:** `apps/api/src/lib/storage.ts`
- Initialize Cloud Storage client
- Create helpers: uploadFile, getSignedUrl, deleteFile
- Configure bucket references

**Dependencies:** T003, T007  
**Deliverable:** Backend can upload files to Cloud Storage

### T024: [Story: Foundation] Create Cloud KMS Utility
**Files:** `apps/api/src/lib/kms.ts`
- Initialize Cloud KMS client
- Create helpers: encrypt, decrypt
- Configure keyring and key references

**Dependencies:** T003, T008  
**Deliverable:** Backend can encrypt/decrypt data

### T025: [Story: Foundation] Set Up Error Tracking (Sentry)
**Files:** `apps/web/lib/sentry.ts`, `apps/api/src/lib/sentry.ts`
- Install Sentry SDK (frontend and backend)
- Configure Sentry projects
- Set up error boundaries (frontend)
- Integrate with tRPC error handler (backend)

**Dependencies:** T002, T003  
**Deliverable:** Errors logged to Sentry

**CHECKPOINT:** Authentication works end-to-end, tRPC operational

---

## Phase 3: Client Management (FR-001, FR-002, FR-003)
**Duration:** Week 4  
**Goal:** Implement complete client and rate management features

### T026: [Story: FR-001] Define Client TypeScript Types
**Files:** `packages/shared/src/types/client.ts`
- Define Client interface
- Define ClientType enum
- Export types

**Dependencies:** T021  
**Deliverable:** Client types available

### T027: [Story: FR-001] Define Client Zod Schemas [P]
**Files:** `packages/shared/src/schemas/client.ts`
- CreateClientSchema
- UpdateClientSchema
- ListClientsSchema
- Export inferred types

**Dependencies:** T021  
**Deliverable:** Client validation schemas

### T028: [Story: FR-001] Create Client Service (Backend)
**Files:** `apps/api/src/services/clientService.ts`
- createClient(input, userId)
- listClients(filters, userId)
- getClientById(id, userId)
- updateClient(id, updates, userId)
- archiveClient(id, userId)
- restoreClient(id, userId)

**Dependencies:** T022, T026  
**Deliverable:** Client business logic implemented

### T029: [Story: FR-001] Create Clients tRPC Router
**Files:** `apps/api/src/routers/clients.ts`
- clients.create mutation
- clients.list query
- clients.getById query
- clients.update mutation
- clients.archive mutation
- clients.restore mutation

**Dependencies:** T020, T027, T028  
**Deliverable:** Client API endpoints functional

### T030: [Story: FR-001] Create Client List Page UI
**Files:** `apps/web/app/clients/page.tsx`, `apps/web/components/clients/ClientList.tsx`
- Display clients in table/grid
- Search by name or email
- Filter by type and active status
- Pagination
- Links to detail pages

**Dependencies:** T018, T029  
**Deliverable:** Client list page shows data

### T031: [Story: FR-001] Create Client Form Component [P]
**Files:** `apps/web/components/clients/ClientForm.tsx`
- React Hook Form integration
- Zod validation
- Fields: name, type, contactInfo, billingAddress, taxId, notes
- Error handling and display

**Dependencies:** T018, T027  
**Deliverable:** Reusable client form

### T032: [Story: FR-001] Create Client Detail/Edit Page
**Files:** `apps/web/app/clients/[id]/page.tsx`
- Display client details
- Edit mode with form
- Archive/Restore actions
- Link to sessions
- Link to invoices

**Dependencies:** T030, T031  
**Deliverable:** Client detail page functional

### T033: [Story: FR-001] Create New Client Page
**Files:** `apps/web/app/clients/new/page.tsx`
- Uses ClientForm component
- Creates new client
- Redirects to detail page on success

**Dependencies:** T031  
**Deliverable:** Can create new clients via UI

### T034: [Story: FR-002] Define Rate TypeScript Types
**Files:** `packages/shared/src/types/rate.ts`
- Define Rate interface
- Export types

**Dependencies:** T021  
**Deliverable:** Rate types available

### T035: [Story: FR-002] Define Rate Zod Schemas [P]
**Files:** `packages/shared/src/schemas/rate.ts`
- CreateRateSchema
- UpdateRateSchema
- Export inferred types

**Dependencies:** T021  
**Deliverable:** Rate validation schemas

### T036: [Story: FR-002] Create Rate Service (Backend)
**Files:** `apps/api/src/services/rateService.ts`
- createRate(input, userId)
- listRates(filters, userId)
- getRateById(id, userId)
- updateRate(id, updates, userId)
- deleteRate(id, userId) - with validation
- getCurrentRateForClient(clientId, date)

**Dependencies:** T022, T034  
**Deliverable:** Rate business logic implemented

### T037: [Story: FR-002] Create Rates tRPC Router
**Files:** `apps/api/src/routers/rates.ts`
- rates.create mutation
- rates.list query
- rates.getById query
- rates.update mutation
- rates.delete mutation
- rates.getCurrentForClient query

**Dependencies:** T020, T035, T036  
**Deliverable:** Rate API endpoints functional

### T038: [Story: FR-002] Create Rate Management UI Component
**Files:** `apps/web/components/rates/RateManager.tsx`, `apps/web/components/rates/RateForm.tsx`
- Display rates table for client
- Add new rate form
- Edit existing rates
- Show effective dates
- Highlight current rate

**Dependencies:** T018, T037  
**Deliverable:** Rate management embedded in client page

### T039: [Story: FR-002] Integrate Rates into Client Detail Page
**Files:** `apps/web/app/clients/[id]/page.tsx` (update)
- Add Rates section
- Show client's rates
- Allow adding/editing rates
- Display rate history

**Dependencies:** T032, T038  
**Deliverable:** Rates manageable from client page

### T040: [Story: FR-003] Define CompanyProfile TypeScript Types
**Files:** `packages/shared/src/types/companyProfile.ts`
- Define CompanyProfile interface
- Export types

**Dependencies:** T021  
**Deliverable:** CompanyProfile types available

### T041: [Story: FR-003] Define CompanyProfile Zod Schemas [P]
**Files:** `packages/shared/src/schemas/companyProfile.ts`
- UpdateCompanyProfileSchema
- Export inferred types

**Dependencies:** T021  
**Deliverable:** CompanyProfile validation schemas

### T042: [Story: FR-003] Create CompanyProfile Service (Backend)
**Files:** `apps/api/src/services/companyProfileService.ts`
- getCompanyProfile(userId)
- updateCompanyProfile(updates, userId)
- createDefaultProfile(userId) - if not exists

**Dependencies:** T022, T040  
**Deliverable:** CompanyProfile business logic

### T043: [Story: FR-003] Create CompanyProfile tRPC Router
**Files:** `apps/api/src/routers/company.ts`
- company.getProfile query
- company.updateProfile mutation

**Dependencies:** T020, T041, T042  
**Deliverable:** CompanyProfile API endpoints

### T044: [Story: FR-003] Create Company Settings Page
**Files:** `apps/web/app/settings/company/page.tsx`, `apps/web/components/settings/CompanyProfileForm.tsx`
- Display company information form
- Fields: companyName, taxId, address, bankInfo, contactInfo
- Save/update functionality
- Validation

**Dependencies:** T018, T043  
**Deliverable:** Company settings page functional

**CHECKPOINT:** Can create clients, manage rates, configure company profile

---

## Phase 4: Session Time Tracking (FR-004, FR-005)
**Duration:** Week 5  
**Goal:** Implement basic session creation with time tracking and rate calculation

### T045: [Story: FR-004] Define Session TypeScript Types
**Files:** `packages/shared/src/types/session.ts`
- Define Session interface
- Define SessionType enum
- Define BillingStatus enum
- Export types

**Dependencies:** T021  
**Deliverable:** Session types available

### T046: [Story: FR-004] Define Session Zod Schemas [P]
**Files:** `packages/shared/src/schemas/session.ts`
- CreateSessionSchema
- UpdateSessionSchema
- ListSessionsSchema
- Export inferred types

**Dependencies:** T021  
**Deliverable:** Session validation schemas

### T047: [Story: FR-004] Create Session Service - Basic Operations
**Files:** `apps/api/src/services/sessionService.ts`
- createSession(input, userId) - basic session with time tracking
- calculateDuration(startTime, endTime)
- listSessions(filters, userId)
- getSessionById(id, userId)
- updateSession(id, updates, userId)
- deleteSession(id, userId) - with billing status check

**Dependencies:** T022, T045  
**Deliverable:** Basic session CRUD

### T048: [Story: FR-005] Implement Rate Auto-Application in Session Service
**Files:** `apps/api/src/services/sessionService.ts` (update)
- In createSession: fetch client's current rate for session date
- Calculate totalAmount = duration * rate
- Freeze rate amount in session record

**Dependencies:** T036, T047  
**Deliverable:** Sessions auto-calculate amounts

### T049: [Story: FR-004/FR-005] Create Sessions tRPC Router - Basic Endpoints
**Files:** `apps/api/src/routers/sessions.ts`
- sessions.create mutation
- sessions.list query
- sessions.getById query
- sessions.update mutation
- sessions.delete mutation

**Dependencies:** T020, T046, T047, T048  
**Deliverable:** Session API endpoints functional

### T050: [Story: FR-004] Create Session Form Component
**Files:** `apps/web/components/sessions/SessionForm.tsx`
- Fields: date, startTime, endTime, clientId, sessionType
- Duration auto-calculation (client-side preview)
- Client selector dropdown
- Rate display (auto-populated)
- Manual rate override option
- React Hook Form + Zod validation

**Dependencies:** T018, T046  
**Deliverable:** Session form component

### T051: [Story: FR-004] Create Session List Page
**Files:** `apps/web/app/sessions/page.tsx`, `apps/web/components/sessions/SessionList.tsx`
- Display sessions table
- Columns: date, client, duration, amount, billing status, type
- Filter by date range, client, billing status, type
- Pagination
- Sort by date (descending default)
- Link to session details

**Dependencies:** T018, T049  
**Deliverable:** Session list page

### T052: [Story: FR-004] Create New Session Page
**Files:** `apps/web/app/sessions/new/page.tsx`
- Uses SessionForm
- Creates new session
- Redirects to session detail on success

**Dependencies:** T050  
**Deliverable:** Can create sessions via UI

### T053: [Story: FR-004] Create Session Detail Page (Basic)
**Files:** `apps/web/app/sessions/[id]/page.tsx`
- Display session metadata (date, time, duration, client, amount)
- Edit mode for basic fields
- Delete button (with confirmation)
- Placeholder for content (Phase 5)

**Dependencies:** T051  
**Deliverable:** Session detail page shows basic info

**CHECKPOINT:** Can create and manage sessions with automatic rate calculation

---

## Phase 5: Rich Media Content Editor (FR-006)
**Duration:** Week 6  
**Goal:** Implement Tiptap block editor for session notes

### T054: [Story: FR-006] Install and Configure Tiptap
**Files:** `apps/web/package.json`, `apps/web/lib/tiptap.ts`
- Install Tiptap packages: @tiptap/react, @tiptap/starter-kit, @tiptap/extension-*
- Configure extensions: Document, Paragraph, Text, Heading, BulletList, OrderedList, CodeBlock, Image, Link
- Create Tiptap configuration

**Dependencies:** T002  
**Deliverable:** Tiptap library ready

### T055: [Story: FR-006] Define ContentBlock TypeScript Types
**Files:** `packages/shared/src/types/session.ts` (update)
- Define ContentBlock interface
- Define BlockType enum
- Update Session interface to include contentBlocks array

**Dependencies:** T045  
**Deliverable:** ContentBlock types defined

### T056: [Story: FR-006] Create Tiptap Editor Component
**Files:** `apps/web/components/editor/TiptapEditor.tsx`, `apps/web/components/editor/EditorToolbar.tsx`
- Create Tiptap editor wrapper component
- Toolbar with formatting buttons (heading, bold, italic, lists, code, link, image)
- Handle content changes
- Convert Tiptap JSON to ContentBlock array format
- Props: initialContent, onChange, readOnly

**Dependencies:** T054, T055  
**Deliverable:** Reusable Tiptap editor component

### T057: [Story: FR-006] Implement Auto-Save for Editor
**Files:** `apps/web/components/editor/TiptapEditor.tsx` (update), `apps/web/hooks/useAutoSave.ts`
- Debounce editor changes (30 seconds)
- Call tRPC mutation to save content
- Show save status indicator (Saving... / Saved / Error)
- Handle race conditions

**Dependencies:** T056  
**Deliverable:** Editor auto-saves

### T058: [Story: FR-006] Update Session Service - Content Blocks
**Files:** `apps/api/src/services/sessionService.ts` (update)
- updateSessionContent(sessionId, contentBlocks, userId)
- Validate contentBlocks structure
- Store in Firestore

**Dependencies:** T047, T055  
**Deliverable:** Backend can save content blocks

### T059: [Story: FR-006] Update Sessions tRPC Router - Content Endpoints
**Files:** `apps/api/src/routers/sessions.ts` (update)
- sessions.updateContent mutation
- sessions.getContent query (if needed separately)

**Dependencies:** T049, T058  
**Deliverable:** Content save endpoint

### T060: [Story: FR-006] Integrate Editor into Session Detail Page
**Files:** `apps/web/app/sessions/[id]/page.tsx` (update)
- Add TiptapEditor component
- Load existing content
- Auto-save changes
- Display content in read mode when not editing

**Dependencies:** T053, T056, T057  
**Deliverable:** Can edit session notes with rich text

### T061: [Story: FR-006] Implement Image Upload for Editor
**Files:** `apps/web/components/editor/ImageUploadDialog.tsx`, `apps/api/src/services/storageService.ts`
- Frontend: Image upload dialog, image selection, preview
- Backend: Upload image to Cloud Storage, return URL
- tRPC endpoint: sessions.uploadImage mutation
- Insert image URL into editor

**Dependencies:** T023, T056  
**Deliverable:** Can upload and embed images in notes

**CHECKPOINT:** Session notes can be edited with rich formatting and images

---

## Phase 6: Whiteboard Integration (FR-007)
**Duration:** Week 7  
**Goal:** Implement Excalidraw whiteboard for visual content

### T062: [Story: FR-007] Install and Configure Excalidraw
**Files:** `apps/web/package.json`, `apps/web/lib/excalidraw.ts`
- Install @excalidraw/excalidraw
- Configure Excalidraw component
- Set up proper imports (client-side only for Next.js)

**Dependencies:** T002  
**Deliverable:** Excalidraw library ready

### T063: [Story: FR-007] Create Excalidraw Wrapper Component
**Files:** `apps/web/components/whiteboard/ExcalidrawBoard.tsx`
- Wrap Excalidraw component
- Handle scene data changes
- Props: initialData, onChange, readOnly
- Export to PNG functionality

**Dependencies:** T062  
**Deliverable:** Reusable Excalidraw component

### T064: [Story: FR-007] Update Session Types for Whiteboards
**Files:** `packages/shared/src/types/session.ts` (update)
- Add whiteboardUrls: string[] to Session interface
- Store Cloud Storage URLs for whiteboard images

**Dependencies:** T045  
**Deliverable:** Session type includes whiteboards

### T065: [Story: FR-007] Create Whiteboard Service (Backend)
**Files:** `apps/api/src/services/whiteboardService.ts`
- saveWhiteboard(sessionId, sceneData, userId)
- Convert Excalidraw JSON to PNG
- Upload PNG to Cloud Storage
- Return URL and store in session.whiteboardUrls

**Dependencies:** T023, T047  
**Deliverable:** Backend can save whiteboards

### T066: [Story: FR-007] Update Sessions tRPC Router - Whiteboard Endpoints
**Files:** `apps/api/src/routers/sessions.ts` (update)
- sessions.saveWhiteboard mutation
- sessions.deleteWhiteboard mutation

**Dependencies:** T049, T065  
**Deliverable:** Whiteboard save endpoint

### T067: [Story: FR-007] Create Whiteboard Modal/Panel Component
**Files:** `apps/web/components/whiteboard/WhiteboardModal.tsx`
- Modal or side panel with Excalidraw
- Save button to upload whiteboard
- List existing whiteboards
- Click to edit existing whiteboard
- Delete whiteboard option

**Dependencies:** T063  
**Deliverable:** Whiteboard UI component

### T068: [Story: FR-007] Integrate Whiteboard into Session Detail Page
**Files:** `apps/web/app/sessions/[id]/page.tsx` (update)
- "Add Whiteboard" button
- Display whiteboard thumbnails
- Click thumbnail to view/edit in modal
- Save whiteboard to backend

**Dependencies:** T060, T067  
**Deliverable:** Can create and save whiteboards in sessions

**CHECKPOINT:** Sessions can include multiple whiteboards

---

## Phase 7: Audio Recording (FR-008)
**Duration:** Week 8  
**Goal:** Implement browser audio recording for sessions

### T069: [Story: FR-008] Create Audio Recording Hook
**Files:** `apps/web/hooks/useAudioRecorder.ts`
- Use browser MediaRecorder API
- startRecording()
- pauseRecording()
- resumeRecording()
- stopRecording()
- Return audio blob
- Handle browser compatibility

**Dependencies:** T002  
**Deliverable:** Audio recording hook

### T070: [Story: FR-008] Create Audio Recorder Component
**Files:** `apps/web/components/audio/AudioRecorder.tsx`
- Recording controls: start, pause, resume, stop
- Timer display (elapsed time)
- Waveform visualization (optional)
- Save recording button
- Props: onSave callback

**Dependencies:** T069  
**Deliverable:** Audio recorder UI

### T071: [Story: FR-008] Update Session Types for Audio
**Files:** `packages/shared/src/types/session.ts` (update)
- Add audioUrls: string[] to Session interface
- Store Cloud Storage URLs for audio files

**Dependencies:** T045  
**Deliverable:** Session type includes audio

### T072: [Story: FR-008] Create Audio Service (Backend)
**Files:** `apps/api/src/services/audioService.ts`
- uploadAudio(sessionId, audioBlob, userId)
- Upload audio file to Cloud Storage (format: audio/{sessionId}/{timestamp}.m4a)
- Return URL and store in session.audioUrls
- deleteAudio(sessionId, audioUrl, userId)

**Dependencies:** T023, T047  
**Deliverable:** Backend can save audio files

### T073: [Story: FR-008] Update Sessions tRPC Router - Audio Endpoints
**Files:** `apps/api/src/routers/sessions.ts` (update)
- sessions.getAudioUploadUrl mutation (presigned URL approach)
- sessions.linkAudio mutation (link uploaded audio to session)
- sessions.deleteAudio mutation

**Dependencies:** T049, T072  
**Deliverable:** Audio upload endpoints

### T074: [Story: FR-008] Create Audio Player Component [P]
**Files:** `apps/web/components/audio/AudioPlayer.tsx`
- HTML5 audio player with controls
- Speed control (1x, 1.5x, 2x)
- Progress bar
- Volume control
- Props: audioUrl, title

**Dependencies:** None (HTML5)  
**Deliverable:** Audio playback component

### T075: [Story: FR-008] Integrate Audio Recording into Session Detail Page
**Files:** `apps/web/app/sessions/[id]/page.tsx` (update)
- Add AudioRecorder component
- Upload audio after recording
- Display list of audio recordings
- Audio player for each recording
- Delete audio option

**Dependencies:** T068, T070, T074  
**Deliverable:** Can record and play audio in sessions

**CHECKPOINT:** Sessions support rich media: text, images, whiteboards, audio

---

## Phase 8: Invoice Generation (FR-010, FR-011, FR-012)
**Duration:** Week 9-10  
**Goal:** Implement automated invoice generation and PDF export

### T076: [Story: FR-010] Define Invoice TypeScript Types
**Files:** `packages/shared/src/types/invoice.ts`
- Define Invoice interface
- Define InvoiceLineItem interface
- Define InvoiceStatus enum
- Export types

**Dependencies:** T021  
**Deliverable:** Invoice types available

### T077: [Story: FR-010] Define Invoice Zod Schemas [P]
**Files:** `packages/shared/src/schemas/invoice.ts`
- CreateInvoiceSchema
- UpdateInvoiceStatusSchema
- GetRevenueReportSchema
- Export inferred types

**Dependencies:** T021  
**Deliverable:** Invoice validation schemas

### T078: [Story: FR-011] Implement Invoice Number Generator
**Files:** `apps/api/src/services/invoiceNumberService.ts`
- getNextInvoiceNumber() - Firestore transaction for sequential numbering
- Format: "INV-001", "INV-002", etc.
- Ensure thread-safe increment

**Dependencies:** T022  
**Deliverable:** Invoice numbering service

### T079: [Story: FR-011] Create Invoice Service
**Files:** `apps/api/src/services/invoiceService.ts`
- generateInvoice(sessionIds, clientId, userId)
  - Fetch sessions
  - Fetch client and company profile
  - Create invoice record
  - Assign invoice number
  - Calculate totals
  - Update session billing status
  - Return invoice ID
- listInvoices(filters, userId)
- getInvoiceById(id, userId)
- updateInvoiceStatus(id, status, userId)

**Dependencies:** T022, T042, T047, T076, T078  
**Deliverable:** Invoice business logic

### T080: [Story: FR-011] Install and Configure PDF Generation Libraries
**Files:** `apps/api/package.json`, `apps/api/src/lib/pdf.ts`
- Install pdfkit for invoices
- Install puppeteer for complex PDFs (optional, heavy)
- Create PDF generation utilities

**Dependencies:** T003  
**Deliverable:** PDF libraries ready

### T081: [Story: FR-011] Create Invoice PDF Template
**Files:** `apps/api/src/templates/invoiceTemplate.ts`
- Design invoice layout (header, company info, client info, line items, totals, banking details)
- Use PDFKit to generate professional invoice
- Include: invoice number, date, billing period, line items, totals, bank account info

**Dependencies:** T080  
**Deliverable:** Invoice PDF template

### T082: [Story: FR-011] Implement Invoice PDF Generation
**Files:** `apps/api/src/services/pdfService.ts`
- generateInvoicePDF(invoiceId, userId)
- Fetch invoice data
- Generate PDF using template
- Upload PDF to Cloud Storage
- Update invoice.pdfUrl
- Return PDF URL

**Dependencies:** T023, T079, T081  
**Deliverable:** PDF generation works

### T083: [Story: FR-011] Create Invoices tRPC Router
**Files:** `apps/api/src/routers/invoices.ts`
- invoices.generate mutation
- invoices.list query
- invoices.getById query
- invoices.updateStatus mutation
- invoices.generatePDF mutation
- invoices.getRevenue query

**Dependencies:** T020, T077, T079, T082  
**Deliverable:** Invoice API endpoints

### T084: [Story: FR-010] Create Revenue Report Component
**Files:** `apps/web/components/reports/RevenueReport.tsx`
- Date range selector
- Client filter
- Session type filter
- Display: total sessions, total hours, total revenue
- Breakdown by client, session type, billing status
- Charts (optional: Recharts library)

**Dependencies:** T018, T083  
**Deliverable:** Revenue reporting UI

### T085: [Story: FR-011] Create Invoice List Page
**Files:** `apps/web/app/invoices/page.tsx`, `apps/web/components/invoices/InvoiceList.tsx`
- Display invoices table
- Columns: invoice number, client, date, amount, status
- Filter by client, status, date range
- Status update buttons (mark as sent/paid)
- Download PDF button
- Link to invoice details

**Dependencies:** T018, T083  
**Deliverable:** Invoice list page

### T086: [Story: FR-011] Create Invoice Generation Wizard
**Files:** `apps/web/app/invoices/generate/page.tsx`, `apps/web/components/invoices/InvoiceWizard.tsx`
- Step 1: Select client
- Step 2: Select sessions (filter by date range, unbilled only)
- Step 3: Review line items and totals
- Step 4: Generate invoice
- Show preview before generating
- Redirect to invoice detail on success

**Dependencies:** T018, T083  
**Deliverable:** Invoice generation workflow

### T087: [Story: FR-011] Create Invoice Detail Page
**Files:** `apps/web/app/invoices/[id]/page.tsx`
- Display invoice details (number, client, date, line items, totals)
- PDF preview/download button
- Status update actions
- Link to associated sessions
- Print-friendly view

**Dependencies:** T085  
**Deliverable:** Invoice detail page

### T088: [Story: FR-012] Add Course Material Links to Invoice PDF
**Files:** `apps/api/src/templates/invoiceTemplate.ts` (update)
- Add section for course materials
- Include links to session sharing URLs (Phase 10)
- Or embed session PDFs (Phase 10)

**Dependencies:** T081  
**Deliverable:** Invoice PDF includes material references

### T089: [Story: FR-010] Create Financial Dashboard Page
**Files:** `apps/web/app/dashboard/page.tsx`
- Current month revenue summary
- Unbilled sessions count and amount
- Recent invoices list
- Quick access to common actions
- Charts and visualizations

**Dependencies:** T084, T085  
**Deliverable:** Financial dashboard

**CHECKPOINT:** Can generate invoices with professional PDFs and track revenue

---

## Phase 9: Knowledge Base (FR-013, FR-014, FR-015, FR-016)
**Duration:** Week 11-12  
**Goal:** Implement encrypted knowledge base for sensitive information

### T090: [Story: FR-013] Define KnowledgeEntry TypeScript Types
**Files:** `packages/shared/src/types/knowledgeBase.ts`
- Define KnowledgeEntry interface
- Define KnowledgeType enum
- Export types

**Dependencies:** T021  
**Deliverable:** Knowledge types available

### T091: [Story: FR-013] Define KnowledgeEntry Zod Schemas [P]
**Files:** `packages/shared/src/schemas/knowledgeBase.ts`
- CreateKnowledgeEntrySchema
- UpdateKnowledgeEntrySchema
- SearchKnowledgeSchema
- Export inferred types

**Dependencies:** T021  
**Deliverable:** Knowledge validation schemas

### T092: [Story: FR-014] Create Encryption Service
**Files:** `apps/api/src/services/encryptionService.ts`
- encryptContent(plaintext) - using Cloud KMS
- decryptContent(encryptedBlob) - using Cloud KMS
- shouldEncrypt(entryType) - auto-encrypt for sensitive types
- Handle encryption metadata (algorithm, IV)

**Dependencies:** T024  
**Deliverable:** Encryption/decryption helpers

### T093: [Story: FR-013/FR-014] Create Knowledge Base Service
**Files:** `apps/api/src/services/knowledgeService.ts`
- createEntry(input, userId) - auto-encrypt if sensitive
- listEntries(filters, userId) - return masked content for encrypted
- getEntryById(id, userId) - return masked content
- revealEntry(id, userId) - decrypt and return plaintext, log to audit
- updateEntry(id, updates, userId)
- deleteEntry(id, userId)
- searchEntries(query, userId) - full-text search on title/tags

**Dependencies:** T022, T090, T092  
**Deliverable:** Knowledge base business logic

### T094: [Story: FR-013/FR-014] Create Audit Logging Service
**Files:** `apps/api/src/services/auditService.ts`
- logAuditEvent(userId, action, resourceType, resourceId, description)
- Write to auditLogs collection
- Include: timestamp, IP address, user agent

**Dependencies:** T022  
**Deliverable:** Audit logging

### T095: [Story: FR-013/FR-014] Update Knowledge Service with Audit Logging
**Files:** `apps/api/src/services/knowledgeService.ts` (update)
- In revealEntry: call auditService.logAuditEvent
- Log action: 'DECRYPT_KEY' or 'ACCESS_SENSITIVE'
- Update accessedAt and accessCount

**Dependencies:** T093, T094  
**Deliverable:** Sensitive access is audited

### T096: [Story: FR-013/FR-014] Create Knowledge tRPC Router
**Files:** `apps/api/src/routers/knowledge.ts`
- knowledge.create mutation
- knowledge.list query
- knowledge.getById query
- knowledge.reveal mutation (decrypt)
- knowledge.update mutation
- knowledge.delete mutation
- knowledge.search query

**Dependencies:** T020, T091, T093, T095  
**Deliverable:** Knowledge API endpoints

### T097: [Story: FR-013] Create Knowledge Base List Page
**Files:** `apps/web/app/knowledge/page.tsx`, `apps/web/components/knowledge/KnowledgeList.tsx`
- Display entries table
- Columns: title, type, tags, last accessed
- Search bar (full-text)
- Filter by type, tags, category
- Masked content indicator for encrypted entries
- Link to entry details

**Dependencies:** T018, T096  
**Deliverable:** Knowledge list page

### T098: [Story: FR-013/FR-014] Create Knowledge Entry Form
**Files:** `apps/web/components/knowledge/KnowledgeEntryForm.tsx`
- Fields: title, type, content, tags, category
- Type selector determines if auto-encrypted
- Warning for sensitive types
- Markdown or plain text editor for content

**Dependencies:** T018, T091  
**Deliverable:** Knowledge entry form

### T099: [Story: FR-013] Create New Knowledge Entry Page
**Files:** `apps/web/app/knowledge/new/page.tsx`
- Uses KnowledgeEntryForm
- Creates new entry
- Redirects to entry detail

**Dependencies:** T098  
**Deliverable:** Can create knowledge entries

### T100: [Story: FR-014] Create Knowledge Entry Detail Page with Reveal
**Files:** `apps/web/app/knowledge/[id]/page.tsx`
- Display entry details
- If encrypted: show masked content with "Reveal" button
- Reveal button calls decrypt endpoint
- Display decrypted content
- Copy-to-clipboard for sensitive content
- Edit/delete actions
- Access history display

**Dependencies:** T097, T098  
**Deliverable:** Can view and decrypt entries

### T101: [Story: FR-015] Add Voice Memo Recording to Knowledge Base
**Files:** `apps/web/components/knowledge/VoiceMemoRecorder.tsx`
- Reuse AudioRecorder component
- Upload voice memo to Cloud Storage
- Link to knowledge entry as attachment
- Display/play voice memos

**Dependencies:** T070, T096  
**Deliverable:** Voice memos in knowledge base

### T102: [Story: FR-016] Create Storage Usage Dashboard
**Files:** `apps/web/app/settings/storage/page.tsx`, `apps/web/components/storage/StorageStats.tsx`, `apps/api/src/services/storageStatsService.ts`
- Backend: Calculate total audio storage by month/year
- Frontend: Display storage usage charts
- Breakdown by session, knowledge base
- Warning if approaching limits

**Dependencies:** T018, T023  
**Deliverable:** Storage usage visible

### T103: [Story: FR-016] Create Audio Recording Management UI
**Files:** `apps/web/components/storage/RecordingManager.tsx`
- List all audio recordings
- Filter by age, size, session
- Bulk selection
- Actions: Keep, Archive, Delete
- Confirmation dialogs for destructive actions
- Prevent deletion of recordings linked to unpaid invoices

**Dependencies:** T102  
**Deliverable:** Audio management interface

### T104: [Story: FR-016] Implement Audio Archival Service (Backend)
**Files:** `apps/api/src/services/storageManagementService.ts`
- archiveRecordings(recordingIds, userId) - move to Nearline storage class
- deleteRecordings(recordingIds, userId) - with validation
- Check invoice status before deleting

**Dependencies:** T023, T079  
**Deliverable:** Audio archival/deletion logic

### T105: [Story: FR-016] Create Recording Management tRPC Endpoints
**Files:** `apps/api/src/routers/storage.ts`
- storage.getStats query
- storage.listRecordings query
- storage.archiveRecordings mutation
- storage.deleteRecordings mutation

**Dependencies:** T020, T102, T104  
**Deliverable:** Storage management API

**CHECKPOINT:** Knowledge base with encryption, audit logging, and storage management functional

---

## Phase 10: Secure Sharing & Export (FR-009)
**Duration:** Week 13-14  
**Goal:** Implement sharing links and session export to PDF

### T106: [Story: FR-009] Define SharingLink TypeScript Types
**Files:** `packages/shared/src/types/sharingLink.ts`
- Define SharingLink interface
- Export types

**Dependencies:** T021  
**Deliverable:** SharingLink types available

### T107: [Story: FR-009] Define SharingLink Zod Schemas [P]
**Files:** `packages/shared/src/schemas/sharingLink.ts`
- CreateSharingLinkSchema
- Export inferred types

**Dependencies:** T021  
**Deliverable:** SharingLink validation schemas

### T108: [Story: FR-009] Create Sharing Link Service
**Files:** `apps/api/src/services/sharingLinkService.ts`
- createSharingLink(sessionId, expiresInDays, userId)
  - Generate cryptographically random token (UUID v4)
  - Set expiration (default 90 days)
  - Store in sharingLinks collection
  - Return link URL
- listSharingLinks(sessionId, userId)
- revokeSharingLink(linkId, userId)
- extendSharingLink(linkId, newExpiresAt, userId)
- validateSharingLink(token) - check expiration and revocation
- incrementAccessCount(token)

**Dependencies:** T022, T106  
**Deliverable:** Sharing link logic

### T109: [Story: FR-009] Create Sharing tRPC Router
**Files:** `apps/api/src/routers/sharing.ts`
- sharing.createLink mutation
- sharing.listLinks query
- sharing.revokeLink mutation
- sharing.extendLink mutation
- Public endpoint: sharing.getSessionByToken query (no auth required)

**Dependencies:** T020, T107, T108  
**Deliverable:** Sharing API endpoints

### T110: [Story: FR-009] Create Sharing Link Management UI
**Files:** `apps/web/components/sharing/SharingLinkManager.tsx`
- Display active sharing links for session
- "Create Link" button with expiration options (90 days, 180 days, 1 year, no expiration)
- Copy link button
- Expiration date display
- Extend expiration button
- Revoke link button
- Access count display

**Dependencies:** T018, T109  
**Deliverable:** Sharing link management UI

### T111: [Story: FR-009] Integrate Sharing Links into Session Detail Page
**Files:** `apps/web/app/sessions/[id]/page.tsx` (update)
- Add "Share" tab or section
- Show SharingLinkManager component
- Display active links

**Dependencies:** T075, T110  
**Deliverable:** Can create sharing links from session page

### T112: [Story: FR-009] Create Public Session View Page (No Auth)
**Files:** `apps/web/app/share/[token]/page.tsx`
- Public route (no authentication required)
- Fetch session by sharing token
- Display session content (read-only)
- Show: date, duration, notes (Tiptap read-only), whiteboards, audio players
- Hide: client name, financial info, admin actions
- Handle expired/revoked links gracefully

**Dependencies:** T109  
**Deliverable:** Public sharing links work

### T113: [Story: FR-009] Create Session PDF Export Service (Backend)
**Files:** `apps/api/src/services/sessionExportService.ts`
- exportSessionToPDF(sessionId, userId)
- Render session content as HTML
- Use Puppeteer to convert HTML to PDF
- Include: notes, embedded whiteboard images, audio access links
- Upload PDF to Cloud Storage
- Return PDF URL

**Dependencies:** T023, T047, T080  
**Deliverable:** Session PDF export

### T114: [Story: FR-009] Update Sessions tRPC Router - Export Endpoint
**Files:** `apps/api/src/routers/sessions.ts` (update)
- sessions.exportToPDF mutation

**Dependencies:** T049, T113  
**Deliverable:** Export endpoint

### T115: [Story: FR-009] Add Export Button to Session Detail Page
**Files:** `apps/web/app/sessions/[id]/page.tsx` (update)
- "Export to PDF" button
- Show loading state during generation
- Download PDF when ready
- Display success message

**Dependencies:** T111, T114  
**Deliverable:** Can export sessions to PDF

### T116: [Story: FR-009] Implement Bulk Session Export
**Files:** `apps/web/app/sessions/page.tsx` (update), `apps/api/src/services/sessionExportService.ts` (update)
- Select multiple sessions via checkboxes
- "Export Selected" button
- Backend: Generate combined PDF with all sessions
- Or: Generate ZIP file with individual PDFs

**Dependencies:** T051, T113  
**Deliverable:** Bulk export functionality

### T117: [Story: FR-009] Create Link Expiration Notification Service (Backend - Scheduled)
**Files:** `apps/api/src/jobs/expirationNotifications.ts`
- Query sharing links expiring in 7 days
- Send email notification to admin (SendGrid)
- Mark links as "notified"
- Run daily via Cloud Scheduler (setup separately)

**Dependencies:** T108, External: SendGrid setup  
**Deliverable:** Expiration notifications (scheduled job)

**CHECKPOINT:** Sharing links and PDF export fully functional

---

## Phase 11: Advanced Analytics (FR-017) [P1]
**Duration:** Week 15  
**Goal:** Implement multi-dimensional financial analytics

### T118: [Story: FR-017] Install Visualization Library
**Files:** `apps/web/package.json`
- Install Recharts or similar charting library
- Configure for Next.js

**Dependencies:** T002  
**Deliverable:** Charting library ready

### T119: [Story: FR-017] Create Analytics Service (Backend)
**Files:** `apps/api/src/services/analyticsService.ts`
- getRevenueTimeline(dateRange, filters, userId) - data for line chart
- getRevenueByClientType(dateRange, userId) - data for pie chart
- getRevenueBySessionType(dateRange, userId) - data for bar chart
- getSessionCountTimeline(dateRange, filters, userId)

**Dependencies:** T022, T079  
**Deliverable:** Analytics calculations

### T120: [Story: FR-017] Create Analytics tRPC Router
**Files:** `apps/api/src/routers/analytics.ts`
- analytics.getRevenueTimeline query
- analytics.getRevenueByClientType query
- analytics.getRevenueBySessionType query
- analytics.exportToCSV mutation

**Dependencies:** T020, T119  
**Deliverable:** Analytics API endpoints

### T121: [Story: FR-017] Create Analytics Dashboard Page
**Files:** `apps/web/app/analytics/page.tsx`, `apps/web/components/analytics/Charts.tsx`
- Date range selector
- Multiple chart types: line (revenue over time), pie (by client type), bar (by session type)
- Filter options: client, session type
- Export to CSV button

**Dependencies:** T018, T118, T120  
**Deliverable:** Analytics dashboard with visualizations

**CHECKPOINT:** Advanced financial analytics available

---

## Phase 12: Student Timeline View (FR-018) [P1]
**Duration:** Week 15  
**Goal:** Implement comprehensive course history timeline per student

### T122: [Story: FR-018] Enhance Sessions Service with Timeline Query
**Files:** `apps/api/src/services/sessionService.ts` (update)
- getClientTimeline(clientId, userId)
- Return sessions with: date, topic/title, whiteboard thumbnails, audio indicators, brief content preview

**Dependencies:** T047  
**Deliverable:** Timeline data endpoint

### T123: [Story: FR-018] Update Sessions tRPC Router - Timeline Endpoint
**Files:** `apps/api/src/routers/sessions.ts` (update)
- sessions.getClientTimeline query

**Dependencies:** T049, T122  
**Deliverable:** Timeline API endpoint

### T124: [Story: FR-018] Create Timeline Component
**Files:** `apps/web/components/timeline/SessionTimeline.tsx`
- Vertical timeline UI
- Display sessions chronologically
- Show: date, session type icon, brief content, whiteboard thumbnails, audio indicator
- Click to open session details
- Filter/search within timeline

**Dependencies:** T018, T123  
**Deliverable:** Timeline UI component

### T125: [Story: FR-018] Add Timeline Tab to Client Detail Page
**Files:** `apps/web/app/clients/[id]/page.tsx` (update)
- Add "Course History" or "Timeline" tab
- Show SessionTimeline component
- Load efficiently (pagination, virtualization if many sessions)

**Dependencies:** T032, T124  
**Deliverable:** Student timeline accessible from client page

**CHECKPOINT:** Can view complete course history for each student

---

## Phase 13: Bulk Operations (FR-019) [P1]
**Duration:** Week 16  
**Goal:** Implement bulk operations for efficiency

### T126: [Story: FR-019] Implement Bulk Session Selection UI
**Files:** `apps/web/app/sessions/page.tsx` (update), `apps/web/components/sessions/SessionList.tsx` (update)
- Add checkboxes to session list
- "Select All" checkbox
- Selected count indicator
- Bulk actions menu (appears when sessions selected)

**Dependencies:** T051  
**Deliverable:** Can select multiple sessions

### T127: [Story: FR-019] Implement Bulk Invoice Generation
**Files:** Already implemented in T086 (Invoice Wizard)
- Ensure supports multiple sessions across different dates
- Test with large session counts (50+)

**Dependencies:** T086  
**Deliverable:** Bulk invoice generation tested

### T128: [Story: FR-019] Implement Bulk Session Tagging/Categorization
**Files:** `apps/api/src/services/sessionService.ts` (update), `apps/web/components/sessions/BulkTagDialog.tsx`
- Add tags field to Session type
- Backend: bulkUpdateSessions(sessionIds, updates, userId)
- Frontend: Bulk tag dialog
- Apply tags to selected sessions

**Dependencies:** T047, T126  
**Deliverable:** Can tag sessions in bulk

### T129: [Story: FR-019] Implement Bulk Session Export (If not done in T116)
**Files:** Already handled in T116
- Verify bulk export works for 20+ sessions

**Dependencies:** T116  
**Deliverable:** Bulk export verified

**CHECKPOINT:** Bulk operations for sessions functional

---

## Phase 14: Polish, Testing & Production Deployment
**Duration:** Week 17-18  
**Goal:** Final polish, comprehensive testing, production launch

### T130: UI/UX Polish - Consistent Styling [P]
**Files:** All UI components
- Review all pages for consistent Tailwind usage
- Ensure light minimalist design throughout
- Fix spacing and typography inconsistencies
- Add loading skeletons
- Improve error messages

**Dependencies:** All UI tasks  
**Deliverable:** Consistent UI across app

### T131: Mobile Responsiveness Testing and Fixes [P]
**Files:** All pages and components
- Test on mobile devices (iPhone, Android)
- Test on tablets
- Fix responsive layout issues
- Ensure forms work on mobile
- Test touch interactions

**Dependencies:** All UI tasks  
**Deliverable:** Mobile-responsive app

### T132: Performance Optimization - Frontend [P]
**Files:** `apps/web/next.config.js`, various components
- Implement lazy loading for heavy components (Tiptap, Excalidraw)
- Optimize images (next/image)
- Code splitting
- Reduce bundle size
- Implement virtual scrolling for long lists

**Dependencies:** T002, All frontend tasks  
**Deliverable:** Lighthouse score > 90

### T133: Performance Optimization - Backend [P]
**Files:** All backend services
- Optimize Firestore queries (reduce reads)
- Implement caching where appropriate
- Optimize PDF generation (reuse Puppeteer instance)
- Database query profiling

**Dependencies:** T003, All backend tasks  
**Deliverable:** API response times < 500ms P95

### T134: Comprehensive Error Handling - Frontend [P]
**Files:** All frontend components
- Add error boundaries
- Improve error messages
- Handle offline state
- Retry logic for failed requests
- User-friendly error pages

**Dependencies:** All frontend tasks  
**Deliverable:** Graceful error handling

### T135: Comprehensive Error Handling - Backend [P]
**Files:** All backend services
- Consistent error responses
- Log errors to Sentry
- Handle rate limiting
- Database connection error handling

**Dependencies:** All backend tasks  
**Deliverable:** Robust error handling

### T136: Security Audit - Frontend
**Files:** All frontend code
- Review authentication flow
- Check for XSS vulnerabilities
- Validate all user inputs
- Secure local storage usage
- Content Security Policy

**Dependencies:** All frontend tasks  
**Deliverable:** Frontend security validated

### T137: Security Audit - Backend
**Files:** All backend code
- Review authentication middleware
- Validate all tRPC inputs
- Check Firestore security rules
- Audit sensitive data handling
- Review Cloud KMS usage
- SQL injection prevention (N/A for Firestore, but review any raw queries)

**Dependencies:** All backend tasks  
**Deliverable:** Backend security validated

### T138: Penetration Testing
**Tool:** OWASP ZAP or manual testing
- Test authentication bypass
- Test sharing link security (token guessing)
- Test encryption strength
- Test for CSRF vulnerabilities

**Dependencies:** T136, T137  
**Deliverable:** Security vulnerabilities identified and fixed

### T139: Accessibility Audit (WCAG AA)
**Files:** All UI components
- Screen reader testing
- Keyboard navigation
- Color contrast validation
- ARIA labels
- Form accessibility

**Dependencies:** All frontend tasks  
**Deliverable:** WCAG AA compliance

### T140: Browser Compatibility Testing
**Browsers:** Chrome, Firefox, Safari, Edge (latest 2 versions)
- Test all features across browsers
- Fix browser-specific issues
- Test audio recording compatibility
- Test PDF generation

**Dependencies:** All frontend tasks  
**Deliverable:** Works on all target browsers

### T141: Set Up Firestore Indexes for Production
**Files:** `firestore.indexes.json`, Firebase Console
- Create all composite indexes from data-model.md
- Test queries with production-scale data

**Dependencies:** T006  
**Deliverable:** All indexes created

### T142: Configure Production Environment Variables
**Files:** Vercel dashboard, Cloud Run secrets
- Set production environment variables
- Configure production Firebase project
- Set up production GCS buckets
- Configure production domain

**Dependencies:** T010  
**Deliverable:** Production environment configured

### T143: Set Up Monitoring and Alerting
**Tools:** Google Cloud Monitoring, Sentry
- Configure Cloud Logging
- Set up error tracking in Sentry
- Configure uptime monitoring
- Set up billing alerts
- Create dashboard for key metrics

**Dependencies:** T025  
**Deliverable:** Monitoring operational

### T144: Set Up Automated Backups
**Tool:** gcloud firestore export
- Configure daily Firestore exports to Cloud Storage
- Set up backup retention policy (30 days)
- Test restore procedure

**Dependencies:** T006, T007  
**Deliverable:** Backups running

### T145: Create User Documentation
**Files:** `docs/user-guide.md`, `docs/admin-guide.md`
- User guide: How to use the system
- Admin guide: Configuration, backup/restore
- FAQ
- Troubleshooting

**Dependencies:** All features  
**Deliverable:** Documentation complete

### T146: Performance Load Testing
**Tool:** k6, Artillery, or similar
- Test concurrent user load (simulate 100 users)
- Test API endpoint performance under load
- Test Firestore query performance
- Identify bottlenecks

**Dependencies:** All backend tasks  
**Deliverable:** Performance benchmarks

### T147: End-to-End Testing Setup
**Files:** `tests/e2e/`, `playwright.config.ts`
- Install Playwright
- Create E2E test suite:
  - Test authentication flow
  - Test session creation workflow
  - Test invoice generation
  - Test knowledge base encryption/decryption
  - Test sharing link creation and access
- Run in CI/CD

**Dependencies:** All features  
**Deliverable:** E2E tests passing

### T148: Beta Testing with Real Data
**Duration:** 1 week
- Use system for real work
- Create 20+ sessions
- Generate 5+ invoices
- Test knowledge base with sensitive data
- Identify usability issues

**Dependencies:** T142, All features  
**Deliverable:** Beta feedback collected

### T149: Bug Fixes from Beta Testing
**Files:** Various
- Fix all critical bugs
- Fix high-priority usability issues
- Document known issues for post-launch

**Dependencies:** T148  
**Deliverable:** Critical bugs fixed

### T150: Production Deployment - Frontend
**Tool:** Vercel
- Deploy to production domain
- Configure custom domain (if applicable)
- Enable production environment variables
- Test deployment

**Dependencies:** T142, T149  
**Deliverable:** Frontend live in production

### T151: Production Deployment - Backend
**Tool:** gcloud run deploy
- Deploy to Cloud Run production
- Configure production service account
- Set up Cloud Scheduler for cron jobs (expiration notifications)
- Enable Cloud Run domain mapping (if applicable)
- Test deployment

**Dependencies:** T142, T149  
**Deliverable:** Backend live in production

### T152: DNS Configuration (If Custom Domain)
**Tool:** DNS provider
- Point custom domain to Vercel
- Configure DNS for backend (if separate domain)
- Verify SSL certificates

**Dependencies:** T150, T151  
**Deliverable:** Custom domain working

### T153: Post-Deployment Smoke Testing
**Duration:** 2 hours
- Test all critical paths in production
- Verify authentication
- Create test session
- Generate test invoice
- Test sharing link
- Monitor error rates

**Dependencies:** T150, T151  
**Deliverable:** Production verified

### T154: Set Up Analytics (Google Analytics 4 or Plausible)
**Files:** `apps/web/lib/analytics.ts`
- Install analytics script
- Track page views
- Track key events (session created, invoice generated)
- Set up goals

**Dependencies:** T150  
**Deliverable:** Analytics tracking

### T155: Create Runbook for Operations
**Files:** `docs/runbook.md`
- How to deploy updates
- How to monitor system health
- How to respond to alerts
- How to backup/restore data
- Common troubleshooting steps

**Dependencies:** T143, T144  
**Deliverable:** Operations runbook

### T156: Production Launch Announcement
**Action:** Email, blog post, or notification
- Announce system is live
- Provide access URL
- Share documentation links
- Provide support contact

**Dependencies:** T153  
**Deliverable:** Launch complete! 🎉

**CHECKPOINT:** System live in production, fully functional and tested

---

## Task Dependencies Summary

### Blocking Prerequisites (Must Complete First)
- **T001-T015**: Project setup (all features depend on this)
- **T016-T025**: Authentication and tRPC infrastructure (all features depend on this)

### Independent Feature Tracks (Can be developed in parallel after Phase 2)
- **Track A: Client Management** (T026-T044) → Blocks sessions
- **Track B: Session Creation** (T045-T053) → Blocks rich media features
- **Track C: Rich Media** (T054-T075) → Can be done in parallel (T054-T061, T062-T068, T069-T075)
- **Track D: Invoicing** (T076-T089) → Depends on sessions
- **Track E: Knowledge Base** (T090-T105) → Independent track
- **Track F: Sharing** (T106-T117) → Depends on sessions
- **Track G: Advanced Features** (T118-T129) → Depends on core features

### MVP Scope (Minimum Viable Product)
For fastest time to value, implement in this order:
1. Phase 1-2: Setup + Auth (T001-T025)
2. Phase 3: Client Management (T026-T044)
3. Phase 4: Basic Sessions (T045-T053)
4. Phase 8: Invoicing (T076-T089)

**MVP Deliverable:** Can create clients, record sessions, generate invoices (8-10 weeks)

Then add:
- Rich media features (Phases 5-7)
- Knowledge base (Phase 9)
- Sharing (Phase 10)
- Advanced features (Phases 11-13)

---

## Parallel Execution Examples

### During Phase 3 (Client Management):
- **Developer 1**: T026-T033 (Client CRUD + UI)
- **Developer 2**: T034-T039 (Rate management)
- **Developer 3**: T040-T044 (Company profile)

### During Phase 5-7 (Rich Media):
- **Developer 1**: T054-T061 (Tiptap editor)
- **Developer 2**: T062-T068 (Excalidraw whiteboard)
- **Developer 3**: T069-T075 (Audio recording)

### During Phase 14 (Polish):
- **Developer 1**: T130-T131 (UI polish + mobile)
- **Developer 2**: T132-T133 (Performance optimization)
- **Developer 3**: T134-T135 (Error handling)
- **QA/Security**: T136-T140 (Security + accessibility audits)

---

## Testing Strategy

**Note:** This implementation uses **integration testing** rather than TDD. Unit tests are written after features are functional to avoid over-testing implementation details.

### Integration Tests (Post-Implementation)
- Write integration tests for each tRPC router after feature completion
- Test happy paths and error cases
- Mock external services (Firestore, Cloud Storage, KMS)

### E2E Tests (Phase 14)
- Playwright tests for critical user workflows
- Run before each deployment

### Manual Testing
- Test each feature after implementation
- Use beta testing phase for real-world validation

---

## Estimated Timeline Summary

| Phase | Duration | Tasks | Deliverable |
|-------|----------|-------|-------------|
| **Phase 1: Setup** | Week 1-2 | T001-T015 | Development environment ready |
| **Phase 2: Auth & Infrastructure** | Week 3 | T016-T025 | tRPC operational, auth working |
| **Phase 3: Client Management** | Week 4 | T026-T044 | Client and rate management complete |
| **Phase 4: Session Basics** | Week 5 | T045-T053 | Session creation and time tracking |
| **Phase 5: Tiptap Editor** | Week 6 | T054-T061 | Rich text notes |
| **Phase 6: Whiteboard** | Week 7 | T062-T068 | Visual content |
| **Phase 7: Audio** | Week 8 | T069-T075 | Audio recording |
| **Phase 8: Invoicing** | Week 9-10 | T076-T089 | Invoice generation and PDFs |
| **Phase 9: Knowledge Base** | Week 11-12 | T090-T105 | Encrypted knowledge base |
| **Phase 10: Sharing** | Week 13-14 | T106-T117 | Sharing links and export |
| **Phase 11: Analytics** | Week 15 | T118-T121 | Financial analytics |
| **Phase 12: Timeline** | Week 15 | T122-T125 | Student course history |
| **Phase 13: Bulk Ops** | Week 16 | T126-T129 | Bulk operations |
| **Phase 14: Launch** | Week 17-18 | T130-T156 | Production deployment |
| **TOTAL** | **17-18 weeks** | **156 tasks** | **Production system** |

---

## Success Criteria

### Per-Phase Validation
- ✅ Each checkpoint must pass before proceeding
- ✅ Manual testing of all new features
- ✅ No regressions in existing features

### Final Success Criteria (From Spec)
- ✅ All 16 P0 requirements functional
- ✅ All 4 P1 requirements functional (optional: can skip for MVP)
- ✅ Page loads < 2 seconds, invoice generation < 5 seconds
- ✅ 100% encryption for sensitive data
- ✅ Audio recording works across target browsers
- ✅ Monthly costs within free tiers (~$0-7/month)
- ✅ UI follows minimalist design principle
- ✅ All critical features covered by E2E tests

---

## Notes

- **Parallel Markers ([P])**: Tasks marked [P] can be done simultaneously with adjacent [P] tasks
- **Story References ([Story: FR-XXX])**: Links each task to functional requirement for traceability
- **Checkpoints**: Validate before proceeding to next phase
- **MVP-First**: Can deploy MVP after Phase 8 (invoicing), then add rich media and knowledge base iteratively
- **Testing Approach**: Integration and E2E testing, not TDD (tests written after features work)
- **Technology Choices**: All technology decisions documented in `docs/research.md`
- **Data Model**: Complete schema in `docs/data-model.md`
- **API Contracts**: Example in `contracts/clients-router.md`

---

**Task list ready for execution!** Start with Phase 1 (T001-T015) to set up the foundation. 🚀

