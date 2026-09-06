# CampusVote (VoteWeb) — Single Project Manual (`vote.md`)

The one-file reference for the **entire CampusVote project**: what it is, what's used, where everything lives (file-by-file), how the pieces fit, and how to run/deploy/secure it.

> Full per-repo manuals: **frontend** → `voteweb-frontend/README.md` · **backend** → `voteweb-backend/README.md`.

---

## 1. What this is

An **online voting platform for institute / college elections** ("CampusVote", historically "VoteWeb"). Students register (or are added by admins), candidates apply for positions through a guided form, administrators run elections end-to-end (setup → schedule → open → close → publish results), election monitors ("CAD") watch the process, and every sensitive action is audit-logged.

Three trust boundaries that define the whole system:

1. **Identity** — verified by **Clerk** (email + one-time code) *and/or* the backend (email + password). Roles always come from the **database**, never from the client.
2. **Authorization** — enforced **server-side** by Express middleware (`requireAuth` / `requireRole` / `requireAdmin`) against the DB `students.role`.
3. **Persistent data** — PostgreSQL, changed only through numbered migrations (`migrations/*.sql`) applied on deploy.

---

## 2. Repositories, hosting & identity

| Piece | Where it lives | URL / service | Auto-deploy |
|---|---|---|---|
| **Frontend** (primary) | `who07512-wq/voteweb-frontend` — Next.js 16 | https://voteweb-frontend-three.vercel.app (Vercel, project `prj_IZ4d5YDfGyqmAg8CpaVsGfa5Zihk`) | Manual (`npx vercel deploy --prod`) |
| **Frontend** (mirror) | same repo | https://voteweb-frontend-sk7e.onrender.com (Render `srv-dacoig7avr4c73804vu0`) | `main` push |
| **Backend API** | `who07512-wq/voteweb-backend` — Express | https://voteweb-backend-api.onrender.com/api/v1 (Render `srv-dacofb5g1s2s73bv06bg`) | `main` push (`npm run migrate && node src/server.js`) |
| **Database** | PostgreSQL on Render | provided by the backend service | managed via `migrate.js` |
| **Auth provider** | Clerk | instance `closing-hawk-9939.clerk.accounts.dev` | — |

---

## 3. Architecture

```
Browser
  │  HTTPS
  ▼
Next.js 16 (Vercel)           ← client-rendered SPA, "use client" pages
  │  fetch(..., credentials: 'include')
  │  headers: X-CSRF-Token            cookies: cv_sid (httpOnly), cv_csrf
  │  headers: X-Session-Binding (writes)
  ▼
Express 4 (Render)  src/app.js  ──  one place that mounts every route
  │  middleware: helmet → cors → json → cookieParser → loadSession
  │             → csrfProtection (writes) → requireAuth/requireRole/requireAdmin (per route)
  ▼
Services (src/services/*)  ──  all SQL + business logic
  ▼
PostgreSQL 18  (migrations/001…028)
```

### The two sign-in methods
1. **Email + password** → `POST /api/v1/auth/login` → backend issues `cv_sid` + `cv_csrf` cookies. No Clerk.
2. **Email + one-time code (Clerk)** → Clerk verifies the code, a Clerk JWT is bridged at `POST /api/v1/auth/clerk-session`, the backend verifies the JWT against the Clerk JWKS (`src/lib/clerkVerify.js`, `jose`) and issues the same backend cookies. Brand-new emails are auto-provisioned (open registration for STUDENT/CAD portals; ADMIN is password-only via `ADMIN_EMAILS`).

---

## 4. Frontend — file-by-file

### Entry & routing
- `src/proxy.ts` — Next.js 16 proxy (old `middleware.ts`). **Pass-through** `clerkMiddleware`; deliberately gates nothing, because the proxy can't see the cross-site backend cookie. Real `/candidate/*` gating happens client-side (`CandidateLayout`).
- `src/app/page.tsx` — root: calls `getMe()`; authenticated users → role dashboard, everyone else → `/login`. *(Session-aware fix — written, not yet deployed.)*
- `src/app/layout.tsx`, `src/app/globals.css` — root layout / global styles.

### Auth & identity (the critical path)
| File | Job |
|---|---|
| `src/app/register/role-register.tsx` | Registration wizard (email → Clerk code → password → `POST /auth/register/clerk` with Clerk JWT; token retried with `skipCache:true`; backend stores **STUDENT**) |
| `src/app/login/role-login.tsx` | Shared login (password + email-code + admin-password flows); routes by **DB role** |
| `src/app/login/[[...rest]]/page.tsx`, `login/admin`, `login/cad`, `login/student` | Portal entry pages parameterizing `role-login.tsx` |
| `src/app/auth/clerk-callback/page.tsx` | Bridges Clerk session → backend session; portal-vs-DB-role validation (mismatch → `/login` notice) |
| `src/app/forgot-password/page.tsx`, `reset-password`, `email-recovery`, `access-request`, `access-request/status` | Recovery + voting-access flows |
| `src/lib/session-binding.ts` | `setBindingToken`/`clearBindingToken` (`campusvote_binding_token` in sessionStorage) |
| `src/lib/mock-auth.ts` | Display-only `campusvote_auth` cookie (used by `AdminNavbar`) |
| `src/lib/roll-number.ts` | `hasRollNumber(role, email)` — localStorage per role+email; **never trusted by the backend** |
| `src/lib/api/client.ts` | Base `ApiClient` — auto `X-CSRF-Token` + `X-Session-Binding` on writes, typed `ApiError` |
| `src/lib/api/v1.ts` | Current typed API (`getMe`, elections, candidates, …) |
| `src/hooks/useSignOut.ts` | Triple sign-out: backend `/auth/logout` → clear cookies/tokens → Clerk `signOut` → hard nav to `/login` |

### Role areas — `src/app/`
- **Student** → `/student/*` (dashboard, vote → review → success, results, candidates + compare, receipt, profile, settings/security, guidelines, help + requests + report) wrapped by `src/components/layout/StudentLayout.tsx`.
- **Candidate** → `/candidate/*` (apply, status, dashboard, campaign, manifesto, profile, preview, settings) wrapped by `src/app/candidate/layout.tsx` (roll-number collection) + `src/components/candidate-dashboard/CandidateLayout.tsx` (**application-status gate**: `getMyApplication()` + `getMe()` + `PROTECTED_ROUTES`/`canAccessRoute`).
- **Admin** → `/admin/*` (dashboard, election, schedule, students, positions, candidates, results, reports, issues, announcements, access-requests, activity, settings) wrapped by `src/components/admin-dashboard/AdminLayout.tsx`.
- **CAD** → `/cad/*` (dashboard, elections, results) wrapped by `src/components/cad-dashboard/CadLayout.tsx`.
- **Receiver/utility** → `/verify/[receiptId]`, `/notifications`, `/help`, `/403`, `/404`, `/500`, `/access-denied`, `/unauthorized`, `/session-expired`, `/account-locked`, `/maintenance`.

### Components & hooks
- `src/components/ui/*` — design system (Button, Input, Card, Modal, Dropdown, Badge, Avatar, skeletons, toast-provider, notification-bell, offline-banner, session-expired).
- `src/components/auth/*` — login/register chrome (AuthLayout, AuthCard, AuthHeader, RoleSelector, PasswordInput, RememberMe, LockedAccountState, …).
- `src/components/election/*`, `voting/*`, `receipt/*`, `candidate/*` — feature components (Ballot, BallotReview, VotingContext, ReceiptQRCode, CandidateGrid, …).
- `src/hooks/useCandidateApplication.ts` — application-wizard lifecycle.
- `src/lib/*-data.ts` — optional/mock data for some dashboard skeletons.

---

## 5. Backend — file-by-file

### Core
| File | Job |
|---|---|
| `src/server.js` | Entry point; graceful shutdown (SIGTERM/SIGINT) |
| `src/app.js` | Express app; **every route mount lives here** + health + debug endpoints |
| `src/config/index.js`, `src/config/database.js` | Env loader + pg Pool options |
| `src/db/index.js` | Singleton pg Pool + `query()` |
| `migrate.js` | Migration runner (`npm run migrate`) |

### Middleware (`src/middleware/`)
`loadSession` (cv_sid → session) · `requireAuth` (401) · `requireRole` (role allowlist) · `requireAdmin` (ADMIN + dev bypass) · `csrfProtection` (double-submit) · `rateLimiter` (login/OTP/register/reset/MFA limits).

### Lib (`src/lib/`)
`password.js` (hashing) · `crypto.js` (hashToken SHA-256, encryption) · `cookies.js` (cookie helpers) · `totp.js` (TOTP/MFA) · `sanitize.js` · `authDb.js` (session/student lookups + `publicUser`) · `clerkVerify.js` (Clerk JWT via JWKS).

### Routes → controllers → services (the three layers)
Every area follows: `src/routes/*.js` (HTTP) → `src/controllers/*.js` (validation) → `src/services/*.js` (all SQL/business logic).

| Area | Routes | Controllers | Services |
|---|---|---|---|
| Auth/login/OTP/MFA/register | `auth.js`, `clerkAuth.js`, `emailRecovery.js` | — | `sessionService`, `otpService`, `mfaService`, `brevoService` |
| Students | `students.js` (public read) | `studentController` | `studentService` |
| Elections | `elections.js` | `electionController` | `electionService` |
| Positions/Clubs | `positions.js`, `clubs.js` | `positionController`, `clubController` | `positionService`, `clubService` |
| Candidates | `candidates.js` | `candidateController` | `candidateService` |
| Candidate applications | `candidateApplications.js` (→ `/api/candidates`) | `candidateApplicationController` | `candidateApplicationService` |
| Voting + results | `votes.js` (under `/api/v1/elections`) | `voteController` | `voteService` |
| Voter authorization | `authorization.js` (public GET) | `authorizationController` | `authorizationService` |
| Receipts | `receipts.js` | — | `receiptService` |
| Notifications/Support | `notifications.js`, `support.js` | `notificationController`, `supportController` | `notificationService`, `supportService` |
| Access requests | `accessRequests.js` | — | `accessRequestService` |
| CAD | `cad.js` | — | `voteService` (results) |
| Admin (all behind `requireAdmin`) | `admin*.js` (students, elections, clubs, positions, candidates, candidate-applications, authorizations, announcements, support, email-recovery, access-requests) | `adminStats`, `adminAuditLogs`, `adminAnnouncementController`, `adminSupportController` | (the services above) |
| Unmounted dead code | `debug.js` | — | — |

### API surface (mount map — `src/app.js:306–402`)
- `/api/v1/auth` — auth.js + clerkAuth.js + emailRecovery.js
- `/api/v1/access-requests` · `/api/v1/elections` (+ votes/eligibility) · `/api/v1/announcements`
- `/api/v1/clubs/:id/positions` · `/api/v1/positions/:id/candidates` (public reads)
- `/api/v1/positions` · `/api/v1/clubs` · `/api/v1/candidates` (public reads; legacy PATCH handlers exist)
- `/api/candidates` (student candidate applications) · `/api/v1/authorizations/:id` (public read)
- `/api/v1/receipts` · `/api/v1/notifications` · `/api/v1/support` · `/api/v1/cad`
- `/api/v1/admin/*` — **every** admin mount wrapped in `requireAdmin`
- `/api/health`, `/api/health/db`, `/api/health/brevo`; `/api/debug/*` (dev-only, production-guarded → 403)

---

## 6. Database (PostgreSQL)

Schema is applied by `migrate.js` from `migrations/001…028`. Key tables & the migration that created them:

| Migration | Table / change | Plays a role in |
|---|---|---|
| `001` | `elections` | Schedule, status lifecycle, results gating |
| `002` | `students` (`role`, `is_active`, email) | **Role authority** for all authz |
| `003`–`005` | `clubs`, `positions`, `candidates` | Ballot structure |
| `006` | `voter_authorizations` | Eligibility |
| `007` | `votes` + UNIQUE(student_id, election_id, position_id) | **Vote integrity** (one per position) |
| `008` | `audit_logs` | Audit trail |
| `013`–`016` | `vote_receipts`, `announcements`, `support_requests`, `notifications` | Receipts/PM |
| `017`–`019` | results columns + `PUBLISHED` status | Results publishing |
| `020` | auth tables (`sessions`, MFA-related) | Sessions/MFA |
| `021` (×2) | `candidate_applications` (status: draft/submitted/under_review/changes_requested/approved/rejected), `otp_challenges` | Candidate lifecycle + email OTP |
| `022`–`028` | username/mobile, application extra fields, identity/email recovery, `student_access_requests`, CAD role, nomination-club-position, profile photo | Extensions |

**Vote integrity guarantee:** the `votes` UNIQUE constraint means a second vote on the same position by the same voter is rejected at the DB level — no race can create double votes.

---

## 7. Security

**In place:**
- Roles from DB only; all writes require session + CSRF (`cv_csrf` ↔ `X-CSRF-Token`) + `X-Session-Binding`.
- Clerk JWTs verified against the instance JWKS (iss/aud), in `clerkVerify.js`.
- Rate limits on auth/OTP/register/reset/MFA.
- Admin MFA (TOTP) support.
- All `/api/debug/*` endpoints return `403 Not available in production` when `NODE_ENV=production` (commits `705b0b1`, `6d81037`).

**Audit findings still open (see backend `SECURITY-ASSESSMENT-REPORT.md`):**
- Public/legacy `PATCH` on `/api/v1/positions/:id` and `/api/v1/clubs/:id` (unauthenticated writes).
- `GET /api/v1/authorizations/:id` — public IDOR kind read (student email/name leak).
- `GET /api/v1/elections` returns DRAFT/SCHEDULED elections to the public.
- CAD results 500 — `voteService.getElectionResultsFull` references non-existent `positions.max_selections`.
- Candidate **approval** promotes role but never creates a `candidates` ballot row → approved applicants won't appear on ballots.
- `adminStats.pendingApps` always 0 (queries a status that doesn't exist).
- Migrations `018`/`019` use `ALTER TYPE … ADD VALUE` inside the runner's transaction → breaks **fresh** DB boots (live DB was applied historically).

---

## 8. Running & deploying

### Local frontend
```bash
cd voteweb-frontend
npm install
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 + Clerk publishable key
npm run dev        # http://localhost:3001 (see next.config.ts allowedDevOrigins)
npm run build      # typecheck + build before any deploy
```

### Local backend
```bash
cd voteweb-backend
cp .env.example .env        # DATABASE_URL, SESSION_SECRET, TOTP_ENCRYPTION_KEY, OTP_SECRET, BREVO_*
npm install
npm run migrate             # apply migrations
npm run seed                # optional dev seed
npm run dev                 # http://localhost:3000
npm test                    # node --test API tests
```

### Production deploys
| Target | Trigger | Command / notes |
|---|---|---|
| Vercel frontend | manual | `npx vercel deploy --prod --token "vcp_<token>" --yes` |
| Render frontend mirror | `main` push | auto |
| Render backend + DB | `main` push | auto, runs `npm run migrate && node src/server.js` |

---

## 9. Quick links

- Frontend repo README → `voteweb-frontend/README.md`
- Backend repo README → `voteweb-backend/README.md`
- Auth & invite design → `voteweb-backend/INVITE-ONLY-LOGIN.md`
- Production checklist → `voteweb-frontend/PRODUCTION-CONVERSION.md`
- Security docs → `voteweb-backend/SECURITY-ASSESSMENT-REPORT.md`, `SECURITY-TESTING.md`
- Setup/deploy guides → `voteweb-backend/SETUP.md`, `DEPLOYMENT.md`
- Feature/roadmap notes → `voteweb-backend/docs/FEATURE-GAP-REPORT.md`, `docs/STEP13-REPORT.md`
- Render MCP notes → `voteweb-backend/RENDER-MCP.md`

*Built for DBIT institute elections. Frontend: Next.js 16 · Backend: Express + PostgreSQL · Auth: Clerk.*