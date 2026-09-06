# CampusVote (VoteWeb) 🗳️

**Online voting platform for institute / college elections** — students register (or are added by admins), candidates apply for positions through a guided form, administrators run elections end-to-end, and everything sensitive is audit-logged.

| | |
|---|---|
| **Live frontend (Vercel — primary)** | https://voteweb-frontend-three.vercel.app |
| **Live frontend (Render — mirror)** | https://voteweb-frontend-sk7e.onrender.com |
| **API (Render)** | https://voteweb-backend-api.onrender.com/api/v1 |
| **Frontend repo** | `who07512-wq/voteweb-frontend` — Next.js 16 (`main` → auto-deploy) |
| **Backend repo** | `who07512-wq/voteweb-backend` — Express + PostgreSQL (`main` → auto-deploy) |
| **Auth provider** | Clerk (instance `closing-hawk-9939.clerk.accounts.dev`) |

**Contents**

1. [How it works](#how-it-works)
2. [Features by role](#features-by-role)
3. [Auth flows (critical path)](#auth-flows)
4. [Tech stack](#tech-stack)
5. [Environment variables](#environment-variables)
6. [Frontend structure (file-by-file)](#frontend-structure)
7. [Key data flows](#key-data-flows)
8. [Backend quick reference](#backend-quick-reference)
9. [Security model](#security-model)
10. [Deployment](#deployment)
11. [Common operations & troubleshooting](#common-operations--troubleshooting)
12. [Known issues & audit](#known-issues--audit)

---

## How it works

```
┌───────────────────────────────┐         ┌───────────────────────────────────┐
│  Next.js 16 frontend (Vercel) │  HTTPS  │  Express backend (Render)         │
│                               │────────►│                                   │
│  • Register (Clerk code OTP)  │  cookie │  • /auth/me  session check        │
│  • Login (password OR code)   │  cv_sid │  • /auth/login password           │
│  • Student / Candidate dash   │◄────────│  • Clerk JWT bridge (email code)  │
│  • Admin portal               │  JSON   │  • Elections, voting, candidates  │
│  • CSRF token + binding token │         │  • PostgreSQL (audit-logged)      │
└───────────────────────────────┘         └───────────────────────────────────┘
```

The **frontend is a client-rendered SPA** (App Router, `"use client"` pages). The **backend owns all identity and data**: roles come from the database, never from the login page. There are **two sign-in methods**:

1. **Email + password** — for registered accounts (`POST /auth/login`). No Clerk required.
2. **Email + one-time code** — Clerk emails a code; the frontend bridges the Clerk JWT to a backend password session at `POST /auth/clerk-session`.

Every API call is guarded by CSRF tokens and the httpOnly `cv_sid` session cookie.

**Root page** (`src/app/page.tsx`) is session-aware: it calls `getMe()` and redirects an already-authenticated user straight to their role dashboard (`/student/dashboard`, `/candidate/dashboard`, `/cad/dashboard`, `/admin/dashboard`); everyone else goes to `/login`. (Previously `/` always redirected to `/login`, forcing a second login every time the app link was clicked.)

---

## Features by role

### 🧑‍🎓 Students
- Register with email + password (or get added by an admin), one-time code via email to activate
- One-time roll-number capture after sign-in (`/roll-number`)
- Live election listing with club / position details (`/student/dashboard`, `/student/vote`)
- Vote (one per position, receipt generated — `/student/vote/review`, `/student/vote/success`), results once published (`/student/results`)
- Candidate comparison (`/student/candidates`, `/student/candidates/compare`)
- Announcements, notifications (`/notifications`), support request (`/student/help`), report an issue
- Profile / settings / password security (`/student/profile`, `/student/settings`, `/student/settings/security`)

### 🎓 Candidates
- `/register` → guided multi-step application (`/candidate/apply`): Name, Programme (BBA / BCA / BCOM / MBA / MCA), Age, DOB, Gender, Enrollment No, Mobile, Email, Aadhar, Club/Position, Declaration
- Application locked after submission (read-only while under review)
- Status page (`/candidate/status`) — PENDING → APPROVED / REJECTED
- Campaign / manifesto / profile / preview once approved (`/candidate/campaign`, `/candidate/manifesto`, `/candidate/profile`, `/candidate/preview`)
- Setup / settings pages (`/candidate/settings`)

### 🛡️ Admins (`/admin/*`, all wrapped in `AdminLayout`)
- Dashboard with stats (`/admin/dashboard`), election builder (`/admin/election`), schedule (`/admin/schedule`)
- Students (`/admin/students`), positions (`/admin/positions`), candidates (`/admin/candidates`)
- Approve/reject candidate applications, authorize voters
- Results (`/admin/results`), reports (`/admin/reports`), issues (`/admin/issues`)
- Announcements (`/admin/announcements`), access requests (`/admin/access-requests`), activity/audit log (`/admin/activity`), settings

### 👁️ CAD (election monitor)
- `/cad/dashboard`, `/cad/elections`, `/cad/results` — live monitoring (role `CAD` in the DB)

---

## Auth flows

### Registration → login (critical path)
1. `/register` — user picks role (only **candidate** is currently open), enters name/email/password/roll.
2. Clerk sends a one-time code; on submit the app calls `POST /auth/register/clerk` with the Clerk JWT (`getToken({ skipCache: true })` + 500ms retry because the token can be `null` right after code verification). The backend stores the account as **STUDENT** — "candidacy is earned via application approval."
3. On success the user is sent to `/candidate/apply`.
4. Log out, then log back in with **email + password**: `POST /auth/login` → backend verifies and sets `cv_sid`. The frontend routes by the **database role**. A `STUDENT` who registered as a candidate (roll saved under the candidate or student key) is sent straight to `/candidate/apply`.
5. `/candidate/apply` renders `CandidateLayout`, which loads the application + account via `getMyApplication()` / `getMe()` and gates access client-side (unapproved users see `/candidate/status`, not protected pages).

### Login page (`/login` → `role-login.tsx`)
- **Admin portal** (`/login/admin`): fixed email + password → `POST /auth/admin-portal-login`; gated to `ADMIN_EMAILS` + shared portal password, no Clerk.
- **Email-code method**: Clerk `sendCode`/`verifyCode`; brand-new emails are auto-created at Clerk (open registration by design). Clerk session → `goToCallback()` → `/auth/clerk-callback` → `POST /auth/clerk-session` (Backend verified) → route by DB role.
- **Password method**: `POST /auth/login` (email + password), routes by DB role, preserves the `hasRollNumber("candidate"|"student", email)` → `/candidate/apply` shortcut.
- `sessionStorage` keys used by these flows: `campusvote_role_mismatch`, `campusvote_login_role`, `campusvote_oauth_started`, `campusvote_bridged`, `campusvote_dest`, `campusvote_signed_out`, `campusvote_binding_token`.

### Clerk callback (`/auth/clerk-callback`)
Bridges the Clerk identity to a backend session; then validates the **portal role choosen** against the **DB role** (mismatch → `/login` with a `campusvote_role_mismatch` notice; ADMIN may land on any portal).

> **Why the old `?redirect_url=` bug happened:** `src/proxy.ts` (Next.js 16 middleware) previously required a valid **Clerk** session (`session.userId`) on every `/candidate/*` route. Password-login users have no Clerk session, so the middleware bounced them to `/login?redirect_url=/candidate/apply` right after signing in. The middleware cannot verify the cross-site backend cookie, so the gate was removed — access control now lives in `CandidateLayout` (commit `0a97ee2`).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.3 (App Router), React 19, TypeScript, Tailwind 4, Clerk (`@clerk/nextjs` 7), lucide-react |
| Backend | Node.js, Express, `jose` JWT verification |
| Database | PostgreSQL 18 (numbered migrations, run on deploy) |
| Auth | Clerk email-code + backend password; Clerk JWKS verification in `src/lib/clerkVerify.js` |
| Sessions | httpOnly `cv_sid` cookie + `X-CSRF-Token` + rate limiting + session binding token |
| Hosting | Vercel (frontend), Render (backend + Postgres + frontend mirror) |

## Environment variables

### Frontend (`src/lib/api/v1.ts` typed client)

| Variable | Example | Used by |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://voteweb-backend-api.onrender.com/api/v1` | all API calls (`src/lib/api/client.ts`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk browser SDK |
| `CLERK_SECRET_KEY` | `sk_test_...` | Clerk server-side |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` | Clerk redirects |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `/auth/clerk-callback` | post-Clerk bridge |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/auth/clerk-callback` | post-Clerk bridge |

> `next.config.ts` also honours `SERVER_ACTIONS_ALLOWED_ORIGINS` (production Server Action origins when behind a proxy/tunnel).

### Backend (`voteweb-backend/.env.example`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_ISSUER` | `https://closing-hawk-9939.clerk.accounts.dev` |
| `CLERK_SECRET_KEY` | Clerk API secret (server-to-server) |
| `SESSION_SECRET` · `TOTP_ENCRYPTION_KEY` · `OTP_SECRET` | Session/TOTP/OTP secrets |
| `COOKIE_SECURE` · `COOKIE_SAMESITE` · `CORS_ORIGIN` | Cookie/CSRF/CORS settings |
| `BREVO_API_KEY` · `BREVO_SENDER_EMAIL` · `BREVO_SENDER_NAME` | Transactional email |
| `ADMIN_EMAILS` · `ADMIN_PORTAL_PASSWORD` | Admin portal access |
| `ALLOW_DEV_ADMIN` | Dev-only admin bypass (never in production) |

---

## Frontend structure

### `src/proxy.ts` (Next.js 16 proxy, replaces middleware.ts)
Pass-through `clerkMiddleware` — intentionally does **not** gate routes (see auth-flows note). Access control for `/candidate/*` is client-side in `CandidateLayout`.

### App routes — `src/app/`

| Area | Paths | Notes |
|---|---|---|
| Root | `/` | Session-aware → role dashboard or `/login` |
| Auth | `/login`, `/login/student`, `/login/cad`, `/login/admin`, `/login/[[...rest]]` | all render `role-login.tsx` |
| Auth | `/auth/clerk-callback` | Clerk → backend bridge |
| Register | `/register` → `role-register.tsx`, `/roll-number` | Candidate portal (student closed) |
| Password | `/forgot-password`, `/reset-password`, `/email-recovery`, `/access-request`, `/access-request/status` | Recovery + voter access |
| Student | `/student/dashboard`, `/student/vote`, `/student/vote/review`, `/student/vote/success`, `/student/results`, `/student/candidates`, `/student/candidates/compare`, `/student/receipt`, `/student/profile`, `/student/settings`, `/student/settings/security`, `/student/guidelines`, `/student/help`, `/student/help/request/[requestId]`, `/student/help/report`, `/student/help/requests` | `StudentLayout` |
| Candidate | `/candidate`, `/candidate/apply`, `/candidate/status`, `/candidate/dashboard`, `/candidate/campaign`, `/candidate/manifesto`, `/candidate/profile`, `/candidate/preview`, `/candidate/settings` | `candidate/layout.tsx` + `CandidateLayout` |
| Admin | `/admin/dashboard`, `/admin/election`, `/admin/schedule`, `/admin/students`, `/admin/positions`, `/admin/candidates`, `/admin/results`, `/admin/reports`, `/admin/issues`, `/admin/announcements`, `/admin/access-requests`, `/admin/activity`, `/admin/settings` | `AdminLayout` |
| CAD | `/cad/dashboard`, `/cad/elections`, `/cad/results` | `CadLayout` |
| Other | `/notifications`, `/help`, `/verify/[receiptId]`, `/403`, `/404`, `/500`, `/access-denied`, `/unauthorized`, `/session-expired`, `/account-locked`, `/maintenance` | Status/utility pages |

### Components — `src/components/`

| Folder | Contents |
|---|---|
| `ui/` | Design-system primitives — `Button`, `Input`, `Card`, `Modal`, `Dropdown`, `Badge`, `Avatar`, `skeleton.tsx`, `toast-provider.tsx`, `notification-bell.tsx`, `offline-banner.tsx`, `session-expired.tsx`, `confirmation-modal.tsx`, `EmptyState`, `ErrorState`, `LoadingSkeleton` |
| `auth/` | Login/register chrome — `AuthLayout`, `AuthCard`, `AuthHeader`, `AuthBranding`, `CampusVoteLogo`, `RoleSelector`, `PasswordInput`, `RememberMe`, `AuthNotice`, `ErrorMessage`, `LockedAccountState`, `UnauthorizedState`, `SessionExpiredState`, `SuccessState` |
| `layout/` | `StudentLayout`, `Navbar`, `Sidebar`, `MobileNav` |
| `admin-dashboard/` | `AdminLayout`, `AdminNavbar`, `AdminSidebar` |
| `candidate-dashboard/` | `CandidateLayout` (app-status gate — the real `/candidate/*` access control), `CandidateNavbar`, `CandidateSidebar` |
| `cad-dashboard/` | `CadLayout` |
| `candidate/` | `CandidateCard`, `CandidateGrid`, `CandidateSearch`, `CandidateSort`, `CandidateFilters`, `CandidateCount`, `CandidatePageHeader` |
| `election/` | `ElectionCard`, `ElectionStatusCard`, `Ballot`, `ScheduleCard`, `Timeline`, `StatCard`, `ActivityList`, `QuickActionsGrid`, `QuickActionCard`, `NoticeCard`, `PrivacyCard`, `ProfileCard`, `VotingStatusCard` |
| `voting/` | `VotingContext`, `BallotReview`, `CandidateVotingCard`, `AbstainOption`, `ConfirmationModal`, `LeaveVotingModal`, `ElectionInfoCard`, `VotingNavigation`, `VotingProgress`, `VotingStates`, `PrivacyNotice` |
| `receipt/` | `ReceiptHeader`, `ReceiptId`, `ReceiptInformation`, `ReceiptQRCode`, `ReceiptHistory`, `ReceiptActions`, `ReceiptVerification`, `ReceiptStates`, `PrivacyNotice` |

### Lib — `src/lib/` (state, API, helpers)

| File | Purpose |
|---|---|
| `api/client.ts` | Base `ApiClient`: auto-attaches `X-CSRF-Token` + `X-Session-Binding` on state-changing calls; `getCsrfToken()`; throws typed `ApiError` |
| `api/v1.ts` | Typed current API (`getMe`, election/student/candidate endpoints from the backend) |
| `api/` (others) | `admin.ts`, `admin-compat.ts`, `students.ts`, `elections.ts`, `candidates.ts`, `auth.ts`, `help.ts`, `notifications.ts`, `receipts.ts`, `results.ts`, `index.ts` — feature API modules |
| `api/auth.ts` | Thin auth wrappers (`authApi.login/logout/getProfile/forgotPassword/resetPassword`) |
| `auth-types.ts` | `UserRole` etc. |
| `session-binding.ts` | `setBindingToken`/`clearBindingToken` (`campusvote_binding_token` in sessionStorage) |
| `mock-auth.ts` | `setAuthCookie`/`clearAuthCookie` — display-only `campusvote_auth` cookie (used by `AdminNavbar`) |
| `roll-number.ts` | `hasRollNumber(role, email)` — localStorage roll per role+email (never trusted by backend) |
| `candidate-application-store.ts` | Client-side store for the application wizard |
| `candidate-api.ts`, `candidates-api.ts`, `voting-api.ts`, `results-api.ts`, `receipts.ts` | Form-specific API calls |
| `*-data.ts` | Mock/fallback data files used by some dashboard skeletons (`admin-dashboard-data`, `candidate-dashboard-data`, `candidate-data`, `election-data`, `election-voting-data`, `guidelines-data`, `help-data`, `notification-data`, `receipt-data`, `results-data`, `student-profile-data`) |
| `utils.ts` | Shared helpers |

### Hooks — `src/hooks/`
- `useSignOut.ts` — triple sign-out (backend `POST /auth/logout`, clear auth cookie + binding token + `campusvote_*` sessionStorage flags, then Clerk `signOut`), then full `window.location.href = "/login"` to flush client state.
- `useCandidateApplication.ts` — application lifecycle helper.

---

## Key data flows

| Flow | Frontend | Backend |
|---|---|---|
| Session check | `getMe()` → route | `GET /api/v1/auth/me` (`loadSession`) |
| Password login | `role-login.tsx` | `POST /api/v1/auth/login` → `cv_sid` cookie |
| Clerk bridge | `clerk-callback` | `POST /api/v1/auth/clerk-session` (JWT via JWKS) |
| Register | `role-register.tsx` | `POST /api/v1/auth/register/clerk` (stores STUDENT) |
| Candidate application | `candidate-application-store` | `POST /api/candidates` (submit), `GET /candidate-application/my` |
| Voting | `voting/*` components | `POST /api/v1/elections/…/vote`, `GET …/eligibility` |
| Results | `student/results`, `admin/results`, `cad/results` | Results endpoints gated by `results_published_at` |
| Admin panel | `AdminLayout` + `/admin/*` | All `/api/v1/admin/*` (requireAdmin) |

---

## Backend quick reference

### Migrations
```bash
npm run migrate            # up
npm run migrate:status     # show state
npm run migrate:reset      # drop + re-run all (destroys data)
npm run seed               # seed script
```
`npm start` = `npm run migrate && node src/server.js`; on Render `start.sh` waits for DB health first.

### Auth endpoints (`src/routes/auth.js`)
| Method & path | Purpose |
|---|---|
| `GET /auth/csrf` | CSRF token for state-changing requests |
| `GET /auth/me` | Current session (`{ authenticated, user }`) |
| `POST /auth/login` | Email + password login → `cv_sid` |
| `POST /auth/admin-portal-login` | Admin fixed email+password |
| `POST /auth/logout` | Clear session |
| `POST /auth/otp/send-login` · `verify-login` | OTP login |
| `POST /auth/otp/send-reset` · `verify-reset` · `reset-password` | Password reset |
| `POST /auth/register` · `register/instant` · `register/clerk` | Registration paths |
| `POST /auth/otp/register` · `otp/verify` | OTP registration paths |
| `POST /auth/forgot-password/clerk` | Clerk-based reset trigger |
| `POST /auth/mfa/setup` · `mfa/verify` · `mfa/verify-setup` | MFA setup / verify |
| `POST /auth/change-password` | Authenticated password change |

> ⚠️ `POST /auth/register/exists` was drafted but is **not yet committed** — do not rely on it on `main`.

### Key backend files
- **`src/lib/clerkVerify.js`** — verifies Clerk JWTs against the instance JWKS (iss/aud checks), used by the Clerk bridge.
- **`src/lib/password.js`, `src/lib/crypto.js`** — password hashing, token hashing (SHA-256).
- **`src/services/voteService.js`** — cast/verify/aggregate votes; one vote per position per voter enforced by the DB UNIQUE constraint.
- **`src/services/electionService.js`** — election lifecycle + status transitions (DRAFT→SCHEDULED→OPEN→CLOSED→PUBLISHED).
- **`src/services/candidateApplicationService.js`** — application review + approve/reject.
- **`src/middleware/requireAdmin.js` / `requireAuth.js` / `requireRole.js` / `csrfProtection.js` / `loadSession.js` / `rateLimiter.js`** — all server-side authz.
- **`src/app.js`** — single place where every route is mounted; also the (now production-guarded) `/api/debug/*` endpoints.

---

## Security model

- **Roles are server-side truth** — the role picker on login is a routing hint only; every API call re-checks privileges (`requireAuth`, `requireRole`, `requireAdmin`).
- **httpOnly session cookies** — JS can't read `cv_sid`; plus CSRF tokens and rate limiting on every state-changing route.
- **Clerk JWT verification** — `clerkVerify.js` checks signature against Clerk's JWKS and rejects tokens from other instances (wrong `iss`/`aud`).
- **Vote integrity** — one vote per voter per position, receipts generated, results hidden until published.
- **Access control is client-side on the frontend** for `/candidate/*` (the proxy can't check the cross-site backend cookie); the backend still enforces everything.

> Before a real election: move Clerk from the dev instance (`pk_test_...` / `closing-hawk-9939`) to a **production** instance and swap keys on Vercel and Render.

---

## Deployment

| Piece | Platform | Auto-deploy | How it updates |
|---|---|---|---|
| Frontend (primary) | Vercel project `prj_IZ4d5YDfGyqmAg8CpaVsGfa5Zihk` (team `team_lnSTnnTSH1LjDopMjMvfJmWY`, user `who07512-3427`) | No (manual via CLI) | `npx vercel deploy --prod --token <vcp_...>` from the repo |
| Frontend (mirror) | Render service `srv-dacoig7avr4c73804vu0` | Yes | push to `main` |
| Backend + DB | Render service `srv-dacofb5g1s2s73bv06bg` | Yes | push to `main` (runs migrations first) |

### Deploying the frontend to Vercel manually

```bash
cd voteweb-frontend
npm run build
export VERCEL_ORG_ID=team_lnSTnnTSH1LjDopMjMvfJmWY
export VERCEL_PROJECT_ID=prj_IZ4d5YDfGyqmAg8CpaVsGfa5Zihk
npx vercel deploy --prod --token "vcp_<token>" --yes
# verify:
curl -sL -o /dev/null -w "%{http_code}\n" https://voteweb-frontend-three.vercel.app/candidate/apply
```

> ⚠️ Some `vck_...` tokens are scoped to the wrong account and return `You don't have permission` — use the account-level `vcp_...` token for this project.

---

## Common operations & troubleshooting

| Task | Command |
|---|---|
| Build/check the frontend | `npm run build` |
| Backend tests | `npm test` (node --test) |
| Check deploy status | `render list-deploys` / `vercel inspect` |
| Inspect backend logs | Render log stream for `srv-dacofb5g1s2s73bv06bg` |
| See DB schema | Run `npm run migrate:status`, read `migrations/` in the backend repo |

- **Login bounces back to `/login?redirect_url=/…`** → the proxy/middleware is gating a route on a Clerk session that doesn't exist for password login. Ensure `src/proxy.ts` is the pass-through version (commit `0a97ee2`).
- **Root link keeps sending you to `/login` after signing in** → fixed: `/` now calls `getMe()` and routes to the DB-role dashboard. (Requires the frontend to be re-deployed with the new `src/app/page.tsx`.)
- **"Your verification session expired. Please start again."** on register / forgot-password → `useAuth().getToken()` returned `null` immediately after code verification. Fixed with `{ skipCache: true }` + a 500 ms retry.
- **Wrong role after login** (student portal when they're a candidate) → password login routes by DB role, but the candidate shortcut needs a roll number saved in `localStorage`; re-login in the same browser where they registered.
- **Clerk `jwtVerify` failures** → backend logs `clerkVerify: jwtVerify failed …` — check the token's instance against `CLERK_ISSUER`.

---

## Known issues & audit

- **Root `/` fix** — session-aware root page is written in the working tree (`src/app/page.tsx`) but **not yet committed/deployed**.
- **`register/exists`** — drafted backend endpoint + README references; **not committed** to the backend repo.
- **Backend audit findings (open)** — public PATCH on `positions`/`clubs`; `GET /api/v1/authorizations/:id` IDOR; `GET /api/v1/elections` exposes DRAFT/SCHEDULED; CAD results 500 (non-existent `positions.max_selections`); candidate approval doesn't create a ballot row. Fixed: all `/api/debug/*` endpoints are production-guarded (commits `705b0b1`, `6d81037`). See the backend `SECURITY-ASSESSMENT-REPORT.md`.
- **Migrations 018/019** — `ALTER TYPE … ADD VALUE` inside the per-file transaction breaks a *fresh* DB boot (latent deploy bug).

---

*Built for DBIT institute elections. Frontend: Next.js 16 · Backend: Express + PostgreSQL · Auth: Clerk. See `vote.md` (project root manual), the backend `INVITE-ONLY-LOGIN.md`, and `PRODUCTION-CONVERSION.md` for the original Google sign-in design.*