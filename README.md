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
2. **Email + one-time code** — Clerk emails a code; the frontend then bridges the Clerk JWT to a backend password session at `POST /auth/clerk-session`.

Every API call is guarded by CSRF tokens and the httpOnly `cv_sid` session cookie.

---

## Features

### 🧑‍🎓 Students
- Register with email + password (or get added by an admin), one-time code via email to activate
- One-time roll-number capture after sign-in
- Live election listing with club / position details
- Vote (one per position, receipt generated), results once published
- Announcements, notifications, support request form

### 🎓 Candidates
- Apply through a guided multi-step form: Name, Programme (BBA / BCA / BCOM / MBA / MCA), Age, DOB, Gender, Enrollment No, Mobile, Email, Aadhar, Club/Position, Declaration
- Application locked after submission (read-only while under review)
- Application status page (`/candidate/status`) — PENDING → APPROVED / REJECTED
- Profile shows verified info as displayed at election time

### 🛡️ Admins
- Create and manage elections, clubs, positions
- Approve / reject candidate applications
- Authorize eligible voters
- Publish results
- Announcements, notifications, MFA setup, and a **full audit log** of every sensitive action

---

## Registration → Login flow (the critical path)

1. `/register` — user picks role, enters name/email/password/roll.
2. Clerk sends a one-time code; on submit the app calls `POST /auth/register/clerk` with the Clerk JWT (`getToken({ skipCache: true })` + 500ms retry because the token can be `null` right after code verification).
3. On success the user is sent to `/candidate/apply`.
4. Log out, then log back in with **email + password**:
   - `POST /auth/login` → backend verifies, sets `cv_sid` cookie.
   - Frontend routes by the **database role**. A `STUDENT` who registered as a candidate (roll number saved in `localStorage`) is sent straight to `/candidate/apply`; otherwise to the role dashboard.
5. `/candidate/apply` renders `CandidateLayout`, which loads the application + account via `getMyApplication()` / `getMe()` and gates access client-side (unapproved users see `/candidate/status`, not the protected pages).

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

---

## Frontend

### Env vars (`src/lib/api/v1.ts`, `axios`-free typed client)

| Variable | Example | Used by |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://voteweb-backend-api.onrender.com/api/v1` | all API calls |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk browser SDK |
| `CLERK_SECRET_KEY` | `sk_test_...` | Clerk server-side |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` | Clerk redirects |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `/auth/clerk-callback` | post-Clerk bridge |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/auth/clerk-callback` | post-Clerk bridge |

### Local dev

```bash
cd voteweb-frontend
npm install
# set the env vars above in .env.local (NEXT_PUBLIC_API_URL points at a running backend)
npm run dev          # http://localhost:3001
npm run build        # typecheck + build (run before every deploy)
```

### Key files

| File | Role |
|---|---|
| `src/proxy.ts` | Next.js 16 proxy (= old `middleware.ts`). Pass-through now; no route gating (see note above) |
| `src/app/login/role-login.tsx` | Shared login: password + email-code methods, DB-role routing |
| `src/app/register/role-register.tsx` | Registration with Clerk code verification + `getToken` retry |
| `src/app/forgot-password/page.tsx` | Password reset via Clerk code |
| `src/app/auth/clerk-callback/page.tsx` | Bridges Clerk session → backend session, then routes by DB role |
| `src/app/candidate/layout.tsx` | Collects roll number once (redirects to `/roll-number` if missing) |
| `src/components/candidate-dashboard/CandidateLayout.tsx` | Client-side gate for `/candidate/*` by application status |
| `src/lib/api/v1.ts` | Typed API client (`getMe`, `listElections`, …) |
| `src/lib/session-binding.ts`, `src/lib/mock-auth.ts`, `src/lib/roll-number.ts` | Binding token, auth cookie, roll-number helpers |

---

## Backend

### Env vars

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_ISSUER` | `https://closing-hawk-9939.clerk.accounts.dev` |
| `CLERK_SECRET_KEY` | Clerk API secret (server-to-server) |
| `ADMIN_EMAILS` | Emails treated as administrators |
| `PORT` | Server port (Render sets it) |

### Migrations

```bash
npm run migrate            # up
npm run migrate:status     # show state
npm run migrate:reset      # drop + re-run all (destroys data)
npm run seed               # seed script
```

`npm start` = `npm run migrate && node src/server.js` + `start.sh` on Render.

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
| `POST /auth/register` · `register/instant` · `register/exists` · `register/clerk` | Registration paths |
| `POST /auth/otp/register` · `otp/verify` | OTP registration paths |
| `POST /auth/forgot-password/clerk` | Clerk-based reset trigger |
| `POST /auth/mfa/*` | MFA setup / verify |
| `POST /auth/change-password` | Authenticated password change |

### Key points

- **`src/lib/clerkVerify.js`** verifies Clerk JWTs against the instance JWKS and logs the failure reason (issuer/audience hints) on mismatch — used by the Clerk bridge routes.
- All data mutations are CSRF-protected and rate-limited (`loginLimiter`, `otpLimiter`, `registerLimiter`, …).
- Password hashing via `src/lib/password.js`; sessions + cookies in `src/lib/cookies.js`; audit logging on admin/bank actions.

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
export VERCEL_ORG_ID=team_lnSTnnTSH1LjDopMjMvfJmWY
export VERCEL_PROJECT_ID=prj_IZ4d5YDfGyqmAg8CpaVsGfa5Zihk
npx vercel deploy --prod --token "vcp_<token>" --yes
# verify: curl -sL -o /dev/null -w "%{url_effective} %{http_code}\n" https://voteweb-frontend-three.vercel.app/candidate/apply
```

> ⚠️ Some `vck_...` tokens are scoped to the wrong account and return `You don't have permission` — use the account-level `vcp_...` token for this project.

---

## Security model

- **Roles are server-side truth** — the role picker on login is a routing hint only; every API call re-checks privileges (`requireAuth`, `requireRole`, `requireAdmin`).
- **httpOnly session cookies** — JS can't read `cv_sid`; plus CSRF tokens and rate limiting on every state-changing route.
- **Clerk JWT verification** — `clerkVerify.js` checks signature against Clerk's JWKS and rejects tokens from other instances (wrong `iss`/`aud`).
- **Vote integrity** — one vote per voter per position, receipts generated, results hidden until published.
- **Access control lives client-side on the frontend** for `/candidate/*` (the middleware can't check the cross-site backend cookie).

> Before a real election: move Clerk from the dev instance (`pk_test_...` / `closing-hawk-9939`) to a **production** instance and swap keys on Vercel and Render.

---

## Common operations

| Task | Command |
|---|---|
| Build/check the frontend | `npm run build` |
| Backend tests | `npm test` (node --test) |
| Check deploy status | `render list-deploys` / `vercel inspect` |
| Inspect backend logs | Render log stream for `srv-dacofb5g1s2s73bv06bg` |
| See DB schema | Run `npm run migrate:status`, read `migrations/` in the backend repo |

---

## Troubleshooting

- **Login bounces back to `/login?redirect_url=/…`** → the proxy/middleware is gating a route on a Clerk session that doesn't exist for password login. Ensure `src/proxy.ts` is the pass-through version (commit `0a97ee2`).
- **"Your verification session expired. Please start again."** on register / forgot-password → `useAuth().getToken()` returned `null` immediately after code verification. Fixed with `{ skipCache: true }` + a 500 ms retry.
- **Wrong role after login** (student portal when they're a candidate) → password login routes by DB role, but the candidate shortcut needs a roll number saved in `localStorage`; re-login in the same browser where they registered.
- **Clerk `jwtVerify` failures** → backend logs `clerkVerify: jwtVerify failed { error, code, header, hints: { iss, aud } }` — check the token's instance against `CLERK_ISSUER`.

---

*Built for DBIT institute elections. Frontend: Next.js 16 · Backend: Express + PostgreSQL · Auth: Clerk. See the backend repo's `INVITE-ONLY-LOGIN.md` for the original Google sign-in design.*