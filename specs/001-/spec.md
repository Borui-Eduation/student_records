# Multi-Business Management Platform Specification
# 教育与技术服务多业务管理平台规格说明

**Feature:** Multi-Business Management Platform (Education & Technical Services)  
**Spec ID:** SPEC-001  
**Version:** 1.1.0  
**Date:** 2025-10-08  
**Status:** Ready for Planning  
**Author:** System Administrator

---

## Executive Summary

This specification defines a unified backend management platform that integrates operations for education teaching and technical services (web/AI projects). The system automates multi-rate invoicing, provides rich media course logging with block editing, whiteboard, and audio recording capabilities, and maintains a highly encrypted private knowledge base for sensitive work assets (API keys, SSH credentials, passwords).

---

## Constitutional Principles

This specification adheres to the following constitutional principles:

**Primary Principles:**
- **Multi-Rate Financial Automation**: Core feature - automated invoicing with flexible rate structures for different client types
- **Rich Media Course Logging**: Core feature - comprehensive documentation with block editing, whiteboard, and audio recording
- **Security & Encryption First**: Essential for private knowledge base storing API keys and sensitive credentials
- **Light Minimalist Design**: Clean, efficient interface for all modules
- **Efficient Operations**: Streamlined workflows for time recording, invoicing, and client management

**Secondary Principles:**
- **Code Clarity & Readability**: Foundation for maintainable codebase
- **Professional Service Delivery**: Professional invoices and course documentation for client distribution

---

## Scope

### In Scope

**Core Features:**
- Client management system supporting three client types (institutions, individuals, project clients)
- Flexible multi-rate configuration per client or client type
- Time tracking system with automatic duration calculation
- Rich media course/session logging with block editor, whiteboard integration, and audio recording
- Automated invoice generation with professional PDF output
- Financial reporting and revenue analysis by client and time period
- Highly encrypted private knowledge base for sensitive information
- Course history timeline view per student
- Secure export and sharing functionality for course materials

**User Roles:**
- Single super administrator with full system access

**Data Management:**
- Client information and rate configuration
- Service session records (education and technical projects)
- Course content (notes, drawings, recordings)
- Financial data (invoices, revenue calculations)
- Private knowledge base (encrypted sensitive information)

### Out of Scope

- Multi-user access control and role management (future phase)
- Student/client self-service portal
- Online payment processing integration
- Real-time collaboration features
- Mobile native applications (mobile-responsive web is in scope)
- Integration with accounting software (future phase)
- Automated tax calculation (manual handling)
- Calendar scheduling features

---

## Requirements

### Must Have (P0)

#### Client & Configuration Management

**FR-001: Client Information Management**
- System must support creating, editing, and archiving client records
- Client types: Institution Client (机构客户), Individual Student (个人学生), Project Client (工程项目客户)
- Required fields: name, type, contact information, billing address
- Optional fields: tax ID, company information, notes

**Acceptance Criteria:**
- [ ] Administrator can create new client with all required fields
- [ ] Administrator can edit existing client information
- [ ] Administrator can archive (soft delete) clients no longer active
- [ ] System prevents deletion of clients with existing session records
- [ ] Client list supports search and filtering by type

**FR-002: Flexible Rate Configuration**
- Each client or client type must support one or multiple default hourly rates
- Rates can be set at individual client level or applied to client type
- Rate effective dates to support rate changes over time

**Acceptance Criteria:**
- [ ] Administrator can set default hourly rate for a client type
- [ ] Administrator can override rate for individual clients
- [ ] Administrator can configure multiple rates per client (e.g., different rates for different services)
- [ ] System records rate history with effective dates
- [ ] When recording sessions, system automatically applies appropriate rate based on date

**FR-003: Company Information Configuration**
- System must maintain company profile for invoice generation
- Required fields: company name, tax ID, address, bank account information, contact details

**Acceptance Criteria:**
- [ ] Administrator can configure and update company information
- [ ] Company information automatically appears on generated invoices
- [ ] System validates required fields before allowing invoice generation

#### Session Recording & Time Tracking

**FR-004: Quick Session Entry**
- System must support rapid recording of service sessions
- Required fields: date, start time, end time, associated client
- System automatically calculates total duration from start/end times
- Sessions can be marked as "Education Session" or "Technical Service"

**Acceptance Criteria:**
- [ ] Administrator can create session record with date, start time, end time
- [ ] System automatically calculates duration in hours and minutes
- [ ] Duration is editable in case of manual corrections
- [ ] Session must be linked to specific client
- [ ] Session type (education/technical) can be specified
- [ ] Session entry form loads in under 1 second
- [ ] Session list displays most recent entries first

**FR-005: Client Association & Rate Application**
- Each session must be associated with a specific client
- System automatically applies client's current rate to session
- Rate can be manually overridden for specific sessions

**Acceptance Criteria:**
- [ ] Session record automatically populates client's current rate
- [ ] Administrator can override rate for individual session
- [ ] System displays rate applied to each session in session list
- [ ] Rate changes do not retroactively affect existing sessions

#### Rich Media Course Content

**FR-006: Block-Based Content Editor**
- Each session includes rich media note area supporting block editing
- Supported block types: headings, paragraphs, bulleted/numbered lists, code blocks, images, links
- Editor provides intuitive formatting toolbar
- Auto-save functionality to prevent content loss

**Acceptance Criteria:**
- [ ] Administrator can add multiple content blocks to session
- [ ] Blocks can be reordered via drag-and-drop
- [ ] Each block type renders with appropriate formatting
- [ ] Images can be uploaded and embedded inline
- [ ] Content auto-saves every 30 seconds
- [ ] Editor provides undo/redo functionality
- [ ] Editor loads existing content in under 2 seconds

**FR-007: Whiteboard Integration**
- System provides embedded or callable whiteboard functionality similar to Excalidraw
- Drawings automatically saved and associated with session
- Whiteboard supports: freehand drawing, shapes, text annotations, arrows, colors

**Acceptance Criteria:**
- [ ] Administrator can launch whiteboard from session page
- [ ] Whiteboard drawings automatically save to session
- [ ] Multiple whiteboards can be created per session
- [ ] Whiteboard thumbnail displayed in session summary
- [ ] Whiteboard content can be edited after initial creation
- [ ] Export whiteboard as image for inclusion in PDF

**FR-008: Session Audio Recording**
- One-click audio recording functionality
- Recording controls: start, pause, resume, stop
- Audio files automatically linked to session record
- Playback functionality within system

**Acceptance Criteria:**
- [ ] Administrator can start/pause/stop audio recording with one click
- [ ] Recording timer displays elapsed time during recording
- [ ] Audio files automatically saved and linked to session
- [ ] Audio can be played back within system interface
- [ ] Multiple audio recordings can be associated with single session
- [ ] System supports common audio formats (MP3, WAV, M4A)
- [ ] Audio recording quality is clear and intelligible

**FR-009: Export & Secure Sharing**
- Session content (notes, whiteboard, audio links) can be exported to professional PDF
- System generates secure, read-only sharing links for course materials
- Sharing links expire after 90 days by default (configurable per link)
- Sharing links can be extended or revoked by administrator

**Acceptance Criteria:**
- [ ] Administrator can export session to PDF with one click
- [ ] PDF includes formatted notes, embedded whiteboard images, and audio access links
- [ ] Administrator can generate secure sharing link for session
- [ ] When creating link, administrator can set expiration: 90 days (default), 180 days, 1 year, or no expiration
- [ ] System notifies administrator 7 days before link expiration
- [ ] Administrator can extend expiration date for existing links
- [ ] Sharing links are read-only and do not require recipient authentication
- [ ] Administrator can view list of active sharing links with expiration dates
- [ ] Administrator can revoke sharing links at any time
- [ ] Revoked or expired links display "Access Denied" or "Link Expired" message
- [ ] PDF export maintains professional formatting and branding

#### Financial Management & Invoicing

**FR-010: Revenue Calculation & Reporting**
- System calculates receivable amounts by time period, client, or session count
- Supports filtering: last N sessions, date range, specific client
- Revenue reports show: total duration, total amount, breakdown by client/service type

**Acceptance Criteria:**
- [ ] Administrator can generate revenue report for date range
- [ ] Administrator can generate revenue report for specific client
- [ ] Administrator can generate revenue report for last N sessions (e.g., most recent 10 sessions)
- [ ] Reports display: total hours, total revenue, session count
- [ ] Reports can be filtered by session type (education vs. technical)
- [ ] Report generation completes in under 3 seconds for standard queries

**FR-011: Professional Invoice Generation**
- One-click generation of formal PDF invoices
- Invoice includes: invoice number (format: INV-001, INV-002, etc.), issue date, billing period, company info, client info, line items, total amount
- Line item details: service date, description, duration, hourly rate, subtotal
- Invoice includes bank account information for payment
- Invoices can be regenerated or marked as paid

**Acceptance Criteria:**
- [ ] Administrator can generate invoice for selected sessions
- [ ] System auto-assigns sequential invoice numbers in format INV-XXX (zero-padded, auto-increments)
- [ ] Invoice PDF includes all required information formatted professionally
- [ ] Each line item clearly shows: date, service description, hours, rate, amount
- [ ] Invoice totals are bold and prominent
- [ ] Company banking details appear clearly for payment reference
- [ ] Administrator can mark invoices as "Sent" or "Paid"
- [ ] Invoice list displays status and allows filtering
- [ ] Invoice numbers are continuous and never reused

**FR-012: Invoice Documentation Attachment**
- Invoices include section for course material references
- PDF can embed links to session notes and recordings
- Alternatively, session PDFs can be attached to invoice

**Acceptance Criteria:**
- [ ] Invoice PDF includes section listing associated course materials
- [ ] Links or attachments for session notes and recordings are included
- [ ] Clients can access materials via links or attachments
- [ ] Material links in invoices use same secure sharing mechanism

#### Private Knowledge Base

**FR-013: Structured Private Notes**
- Private note-taking area separate from client-facing content
- Notes support tags, categories, and full-text search
- Note types: general notes, API keys, SSH records, passwords, meeting memos

**Acceptance Criteria:**
- [ ] Administrator can create private notes with tags and categories
- [ ] Full-text search returns relevant notes instantly (under 1 second)
- [ ] Notes can be organized hierarchically or by tag
- [ ] Note creation and editing interface is intuitive
- [ ] Notes support markdown formatting

**FR-014: Encrypted Sensitive Information Storage**
- System securely stores highly sensitive information: API keys, SSH credentials, passwords
- All sensitive information encrypted at rest
- Decryption only occurs when administrator actively views information
- Optional password protection for accessing sensitive information section

**Acceptance Criteria:**
- [ ] Sensitive information is encrypted using industry-standard encryption (AES-256 or equivalent)
- [ ] Information is only decrypted when explicitly requested by administrator
- [ ] System optionally requires additional authentication to access sensitive section
- [ ] Copy-to-clipboard functionality for passwords/keys
- [ ] No sensitive information logged in plain text
- [ ] Audit trail of when sensitive information was accessed

**FR-015: Voice Memo Recording**
- Quick audio recording functionality for private notes
- Voice memos linked to notes or stored independently
- Transcription optional (future enhancement)

**Acceptance Criteria:**
- [ ] Administrator can quickly start audio recording from anywhere in knowledge base
- [ ] Voice memos automatically saved and retrievable
- [ ] Voice memos can be tagged for organization
- [ ] Playback functionality with speed control

**FR-016: Audio Recording Storage Management**
- Administrator can manage audio recording storage manually
- Storage usage dashboard displays total space used by recordings
- Bulk operations for archiving or deleting old recordings
- Three management actions: Keep (retain permanently), Archive (move to long-term storage), Delete (remove permanently)

**Acceptance Criteria:**
- [ ] Storage dashboard shows total audio file storage usage and breakdown by year/month
- [ ] Administrator can filter recordings by age, size, or session
- [ ] Administrator can mark recordings as "Keep" for permanent retention
- [ ] Administrator can archive recordings (moved to separate storage, still accessible)
- [ ] Administrator can permanently delete recordings with confirmation prompt
- [ ] Bulk actions allow managing multiple recordings at once (e.g., "Archive all recordings older than 2 years")
- [ ] System prevents deletion of recordings linked to unpaid invoices
- [ ] Deleted recordings cannot be recovered (irreversible action with clear warning)

### Should Have (P1)

**FR-017: Multi-Dimensional Financial Analytics**
- Advanced reporting with multiple filter dimensions
- Visualizations: revenue trends over time, revenue by client type, revenue by service type
- Export reports to CSV or PDF

**Acceptance Criteria:**
- [ ] Administrator can view revenue trends on timeline chart
- [ ] Reports can combine multiple filters (date range + client type + service type)
- [ ] Visual charts display data clearly
- [ ] Reports can be exported to CSV for further analysis

**FR-018: Student Course History Timeline**
- Comprehensive view of all sessions for a specific student
- Timeline displays: session dates, brief descriptions, whiteboard thumbnails, audio indicators
- Quick navigation to full session details

**Acceptance Criteria:**
- [ ] Administrator can view timeline of all sessions for a client
- [ ] Timeline displays sessions chronologically
- [ ] Whiteboard thumbnails provide visual preview
- [ ] Icons indicate which sessions have recordings
- [ ] Clicking timeline entry opens full session details
- [ ] Timeline loads efficiently even with 100+ sessions

**FR-019: Bulk Session Operations**
- Select multiple sessions for bulk invoice generation
- Bulk export of sessions
- Bulk tagging or categorization

**Acceptance Criteria:**
- [ ] Administrator can select multiple sessions via checkboxes
- [ ] Bulk operations menu appears when sessions selected
- [ ] Can generate single invoice covering multiple sessions
- [ ] Can export multiple sessions to combined PDF

### Nice to Have (P2)

**FR-020: Session Templates**
- Create reusable templates for common session types
- Templates include pre-filled content blocks and structure
- Quickly create new session from template

**Acceptance Criteria:**
- [ ] Administrator can create and save session templates
- [ ] Templates can include pre-filled content blocks
- [ ] New session can be created from template with one click

**FR-021: Dashboard Overview**
- Summary dashboard showing: this month's revenue, total sessions, upcoming unpaid invoices
- Quick access to recent sessions and clients

**Acceptance Criteria:**
- [ ] Dashboard displays current month's revenue and session count
- [ ] Dashboard shows list of unpaid invoices
- [ ] Quick links to recent sessions and clients

**FR-022: Advanced Search Across All Content**
- Global search across sessions, notes, knowledge base
- Search filters by content type, date, client

**Acceptance Criteria:**
- [ ] Single search box searches across all content types
- [ ] Results can be filtered by type, date, and client
- [ ] Search results display with relevant context snippets

---

## User Scenarios

### Scenario 1: Recording and Documenting a Teaching Session

**Actor:** Super Administrator (Instructor/Service Provider)

**Context:** After completing a 2-hour tutoring session with a student, the administrator needs to document the session and prepare it for future invoicing.

**Steps:**
1. Administrator logs into the system
2. Navigates to "New Session" or clicks quick-add button
3. Fills in session details:
   - Date: Today's date (auto-populated)
   - Start time: 14:00
   - End time: 16:00
   - Client: Selects student name from dropdown
   - Session type: Education
4. System automatically calculates duration (2.0 hours) and applies student's rate ($50/hour)
5. Administrator adds session notes using block editor:
   - Heading: "Algebra - Quadratic Equations"
   - Bulleted list of topics covered
   - Code block with example equations
   - Uploaded image of practice problems
6. Opens whiteboard to recreate problem-solving steps demonstrated during session
7. Realizes forgot to record - makes note to remember next time
8. Saves session
9. System confirms save and displays session in list

**Expected Outcome:**
- Session saved with all details
- Duration calculated correctly as 2.0 hours
- Revenue potential calculated as $100
- Session appears in student's history timeline
- Session ready for future invoice inclusion

### Scenario 2: Generating and Sending Professional Invoice

**Actor:** Super Administrator

**Context:** End of month - need to invoice a client for multiple sessions completed during the billing period.

**Steps:**
1. Administrator navigates to "Financial" or "Invoicing" section
2. Selects "Generate Invoice"
3. Chooses client from dropdown
4. Selects date range: October 1-31, 2025
5. System displays all unbilled sessions for this client in date range (8 sessions)
6. Reviews session list and total amount ($800)
7. Optionally adjusts any line items if needed
8. Clicks "Generate Invoice PDF"
9. System creates professional invoice with:
   - Sequential invoice number (INV-2025-042)
   - Company information and banking details
   - Client information
   - 8 line items with dates, descriptions, hours, rates, subtotals
   - Total amount due: $800 (bold, prominent)
   - Links to course materials for each session
10. Reviews PDF preview
11. Downloads invoice PDF
12. Sends invoice to client via email (outside system)
13. Marks invoice as "Sent" in system

**Expected Outcome:**
- Professional invoice PDF generated in under 3 seconds
- Invoice includes all required information for payment
- Course material links work correctly
- Sessions marked as "billed" in system
- Invoice appears in invoice list with "Sent" status

### Scenario 3: Securely Storing and Retrieving API Key

**Actor:** Super Administrator

**Context:** Just obtained a new OpenAI API key for a client project - need to store it securely for future reference.

**Steps:**
1. Administrator navigates to "Knowledge Base" section
2. Clicks "Add Sensitive Information"
3. Fills in form:
   - Type: API Key
   - Service: OpenAI
   - Key: sk-proj-xxx... (paste from clipboard)
   - Associated Project: Client XYZ Website
   - Notes: Production key, billing limit set to $500/month
   - Tags: api-key, openai, client-xyz
4. Saves entry
5. System encrypts the key and stores it
6. Key appears in sensitive information list with masked value (sk-proj-***...)

**Later retrieval:**
1. Administrator searches knowledge base for "openai"
2. Finds the API key entry
3. Clicks "Reveal" button
4. System optionally prompts for additional authentication
5. Key is decrypted and displayed
6. Clicks "Copy to Clipboard"
7. Pastes key into application configuration
8. Closes the entry - key is re-masked

**Expected Outcome:**
- API key stored with AES-256 encryption
- Key not visible without explicit reveal action
- Access to sensitive information logged in audit trail
- Quick retrieval via search and tags
- Copy-to-clipboard works correctly
- No plain text key appears in logs or backups

### Scenario 4: Reviewing Student Progress Timeline

**Actor:** Super Administrator (Instructor)

**Context:** Parent inquiry about student progress - need to review all teaching sessions for the semester.

**Steps:**
1. Administrator navigates to "Clients" section
2. Searches for and selects student name
3. Clicks "View Course History"
4. System displays timeline of all 24 sessions from September-December
5. Timeline shows:
   - Chronological list with dates
   - Session titles/topics
   - Thumbnail preview of whiteboard drawings
   - Icons indicating which sessions have audio recordings
   - Brief notes excerpt for each session
6. Clicks on several sessions to review detailed content
7. Notes consistent progress through algebra curriculum
8. Identifies session with particularly good whiteboard explanation
9. Generates secure sharing link for that session
10. Copies link to send to parent

**Expected Outcome:**
- Complete history of 24 sessions loads in under 2 seconds
- Timeline provides clear visual overview of progress
- Easy navigation to detailed session content
- Can quickly identify and share specific materials
- Sharing link works for parent without requiring login

---

## Success Criteria

### Functional Success

1. **Rapid Session Entry**: Administrator can record a complete session (time, client, basic notes) in under 2 minutes
2. **Automated Invoice Generation**: Invoice PDF generation completes in under 5 seconds regardless of line item count (up to 50 items)
3. **Accurate Financial Calculations**: 100% accuracy in duration calculations and revenue totals (zero tolerance for arithmetic errors)
4. **Content Preservation**: Zero data loss - all session content, recordings, and knowledge base entries persist reliably
5. **Search Performance**: Full-text search returns results in under 1 second for knowledge base with up to 1,000 entries

### User Experience Success

6. **Interface Efficiency**: Common workflows (add session, generate invoice, search knowledge base) require no more than 3 clicks from dashboard
7. **Mobile Responsiveness**: All core features (session entry, note-taking, knowledge base access) fully functional on mobile devices (phone and tablet)
8. **Visual Clarity**: Users can locate needed information without training - intuitive navigation and clear information hierarchy
9. **Error Prevention**: System prevents invalid data entry (e.g., end time before start time, missing required fields) with clear validation messages

### Security Success

10. **Encryption Standard**: All sensitive information encrypted using AES-256 or equivalent industry-standard algorithm
11. **Access Audit**: Complete audit trail of all access to sensitive information section (100% logging coverage)
12. **Secure Sharing**: Sharing links are cryptographically random (not guessable) and support revocation within 1 second

### Professional Output Success

13. **Invoice Quality**: Generated invoices meet professional business standards - clear, complete, properly formatted
14. **Export Fidelity**: PDF exports accurately represent on-screen content with proper formatting and embedded media
15. **Client-Ready Materials**: Exported course materials require no additional editing before sharing with clients

### System Performance Success

16. **Page Load Speed**: All pages load initial content in under 2 seconds on standard broadband connection
17. **Concurrent Recording**: System supports simultaneous audio recording while editing notes without performance degradation
18. **Data Volume**: System maintains performance with up to 1,000 clients, 10,000 sessions, and 500 invoices

---

## Key Entities

### Client
- **Purpose**: Represents customers receiving education or technical services
- **Attributes**: Name, type (institution/individual/project), contact information, billing address, tax ID, active status
- **Relationships**: Has many sessions, has many invoices, has one or more rates
- **Business Rules**: Cannot be deleted if associated with sessions; can only be archived

### Rate
- **Purpose**: Defines hourly billing rates for services
- **Attributes**: Amount, currency, effective date, end date (optional), client or client type association
- **Relationships**: Belongs to client or client type, applied to sessions
- **Business Rules**: Rate changes do not retroactively affect existing sessions; multiple rates can exist with different effective dates

### Session
- **Purpose**: Records a single service interaction (teaching session or technical service)
- **Attributes**: Date, start time, end time, duration (calculated), session type (education/technical), associated client, applied rate, billing status
- **Relationships**: Belongs to client, has one or more content blocks, has zero or more whiteboards, has zero or more audio recordings
- **Business Rules**: Duration calculated from start/end times; rate frozen at time of session creation; cannot be deleted after invoicing (only archived)

### Content Block
- **Purpose**: Represents individual content elements within session notes
- **Attributes**: Type (heading/paragraph/list/code/image/link), content, order, formatting
- **Relationships**: Belongs to session
- **Business Rules**: Blocks maintain order for proper rendering; image blocks store file references

### Whiteboard
- **Purpose**: Stores visual drawings created during sessions
- **Attributes**: Drawing data (vector or raster), thumbnail, creation timestamp
- **Relationships**: Belongs to session
- **Business Rules**: Multiple whiteboards per session allowed; editable after creation

### Audio Recording
- **Purpose**: Stores audio recordings of sessions
- **Attributes**: File path/URL, duration, file format, size, recording timestamp
- **Relationships**: Belongs to session
- **Business Rules**: Multiple recordings per session allowed; cannot be edited (immutable)

### Invoice
- **Purpose**: Formal billing document for services rendered
- **Attributes**: Invoice number (sequential), issue date, billing period start/end, client, total amount, currency, status (draft/sent/paid), payment due date
- **Relationships**: Belongs to client, includes multiple invoice line items
- **Business Rules**: Invoice numbers must be sequential and unique; invoices cannot be deleted after sending (only voided); amounts immutable after generation

### Invoice Line Item
- **Purpose**: Individual service entry on invoice
- **Attributes**: Session reference, service date, description, hours, hourly rate, subtotal
- **Relationships**: Belongs to invoice, references session
- **Business Rules**: Subtotal calculated from hours × rate; line items immutable after invoice generation

### Knowledge Base Entry
- **Purpose**: Stores private notes and work information
- **Attributes**: Title, content type (note/api-key/ssh-record/password/memo), content (encrypted if sensitive), tags, category, creation timestamp, last modified timestamp
- **Relationships**: May have attached audio memos
- **Business Rules**: Sensitive entries encrypted at rest; access logged in audit trail

### Company Profile
- **Purpose**: Stores business information for invoice generation
- **Attributes**: Company name, tax ID, address, banking details, contact information, logo
- **Relationships**: Appears on all invoices
- **Business Rules**: Only one active company profile; changes apply to future invoices only

### Sharing Link
- **Purpose**: Enables secure read-only access to session materials
- **Attributes**: Random token, session reference, creation timestamp, expiration date (optional), revoked status, access count
- **Relationships**: Belongs to session
- **Business Rules**: Tokens must be cryptographically random; revoked links immediately inaccessible; optional access tracking

---

## Assumptions

1. **Single Administrator**: System designed for single super administrator use; multi-user support deferred to future phase
2. **Manual Payment Tracking**: System records invoice status (sent/paid) manually; no payment gateway integration
3. **Language Support**: Primary language is Chinese with English support for technical terms; full internationalization not required in v1
4. **Currency**: Single currency (CNY assumed); multi-currency support deferred
5. **Tax Handling**: Tax calculations handled manually outside system; system records pre-tax and tax amounts if provided
6. **Data Backup**: External backup solution; system does not include automated backup scheduling
7. **Browser Support**: Modern browsers only (Chrome, Firefox, Safari, Edge - latest 2 versions); IE11 not supported
8. **Network Connectivity**: System requires continuous internet connection; offline mode not supported
9. **File Storage**: Audio recordings and images stored on server or cloud storage service; no client-side storage
10. **Email Integration**: Invoice delivery via email handled outside system; system generates PDF only
11. **Access Device**: Primarily desktop/laptop usage with mobile-responsive design; native mobile apps not in scope
12. **Session Duration**: Standard sessions 0.5-8 hours; no special handling for multi-day projects
13. **Whiteboard Tool**: Embedded whiteboard functionality similar to Excalidraw; specific implementation to be determined during development
14. **Audio Quality**: Standard quality audio sufficient (no high-fidelity requirements); typical voice recording quality acceptable
15. **Data Retention**: All data retained indefinitely; no automatic purging or archiving of old records

---

## Dependencies

### External Dependencies

- [ ] Cloud hosting infrastructure or server environment
- [ ] Database system for structured data storage
- [ ] File storage system for media files (audio, images, whiteboards)
- [ ] Encryption library for sensitive data protection
- [ ] PDF generation library for invoices and exports
- [ ] Audio recording capability (browser API or library)
- [ ] Whiteboard/canvas library (Excalidraw or equivalent)
- [ ] Rich text / block editor library

### Internal Dependencies

- [ ] Company profile configuration must be completed before invoice generation
- [ ] At least one client must exist before creating sessions
- [ ] Rates must be configured before sessions can calculate revenue
- [ ] Sessions must exist before invoices can be generated

### Infrastructure Requirements

- [ ] HTTPS/SSL certificate for secure data transmission
- [ ] Adequate storage capacity for audio files and images (estimate 100MB per hour of audio)
- [ ] Database backup solution
- [ ] Server capacity to handle media uploads and encryption operations

---

## Design Decisions

**Invoice Numbering Format**: Simple sequential format with "INV-" prefix (INV-001, INV-002, INV-003, etc.)
- Continuous numbering with no annual resets
- Three-digit zero-padded numbers (expandable to more digits as needed)
- Clear prefix distinguishes invoice numbers from other identifiers
- Implementation: System maintains counter in database, auto-increments on invoice creation

**Sharing Link Expiration Policy**: Default 90-day expiration with per-link configuration
- All sharing links expire automatically 90 days after creation unless explicitly configured otherwise
- Administrator can override expiration when creating link (extend to 180 days, 1 year, or no expiration)
- Administrator can extend expiration for existing links before they expire
- System sends notification/warning when links are nearing expiration (7 days before)
- Security benefit: Reduces risk of long-term unauthorized access to materials

**Audio Recording Retention**: Manual management approach
- System retains all recordings indefinitely by default
- No automatic deletion or archival
- Administrator explicitly marks recordings for:
  - **Keep**: Important recordings to retain permanently
  - **Archive**: Move to long-term storage (accessible but not in active system)
  - **Delete**: Permanently remove to free storage space
- System provides storage usage dashboard to help administrator monitor space consumption
- Recordings can be bulk-managed (e.g., archive all recordings older than 2 years with one action)

---

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Data loss due to inadequate backup | Medium | High | Implement automated daily backups with off-site storage; regular restore testing |
| Encryption key loss/corruption | Low | Critical | Multi-layer key management with secure backup; key recovery procedures documented |
| Audio file size causing storage issues | Medium | Medium | Implement compression; monitor storage usage; configurable audio quality settings |
| Whiteboard data too large for database | Low | Medium | Store whiteboard drawings as files rather than in database; implement size limits |
| Poor mobile experience affecting usability | Medium | Medium | Thorough mobile testing; responsive design throughout; consider progressive web app |
| Invoice generation slow with many line items | Low | Low | Optimize PDF generation; implement background processing if needed; set reasonable limits |
| Search performance degrades over time | Medium | Medium | Implement proper database indexing; periodic performance tuning; consider search engine integration |
| Sensitive data exposure through logs/errors | High | Critical | Implement strict logging policies; mask sensitive data in all logs; regular security audits |
| Sharing link guessing/brute force | Low | Medium | Use cryptographically strong random tokens; implement rate limiting; monitor access patterns |

---

## References

- Project Constitution: `/Users/yao/Documents/Organized_Files/Code_Projects/Student Record/student_record/.specify/memory/constitution.md`
- Constitutional Principles (7 principles): Light Minimalist Design, Code Clarity, Multi-Rate Financial Automation, Rich Media Course Logging, Security & Encryption First, Efficient Operations, Professional Service Delivery

---

## Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-08 | 1.0.0 | Initial specification created from comprehensive PRD | System Administrator |
| 2025-10-08 | 1.1.0 | Design decisions finalized: invoice numbering (INV-XXX), 90-day link expiration, manual audio retention; Added FR-016 for audio storage management | System Administrator |
