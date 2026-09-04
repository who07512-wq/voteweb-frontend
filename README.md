# CampusVote 🗳️

**Secure & neutral online elections for Don Bosco Institute of Technology** — students vote for their club/position representatives from any device, with invite-only Google sign-in, verified voter authorization, and a full candidate application pipeline.

| | |
|---|---|
| **Live site** | https://voteweb-frontend-three.vercel.app |
| **API** | https://voteweb-backend-api.onrender.com/api/v1 |
| **Frontend repo** | `who07512-wq/voteweb-frontend` (this repo) — Next.js 16, deployed on Vercel |
| **Backend repo** | `who07512-wq/voteweb-backend` — Express + PostgreSQL, deployed on Render |
| **Auth docs** | [`INVITE-ONLY-LOGIN.md`](https://github.com/who07512-wq/voteweb-backend/blob/main/INVITE-ONLY-LOGIN.md) in the backend repo |

---

## How it works

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│  Next.js 16 frontend    │  HTTPS │  Express backend             │
│  (Vercel)               │───────►│  (Render)                    │
│                         │ cookie │                              │
│  • Google sign-in via   │ cv_sid │  • Clerk JWT bridge          │
│    Clerk                │        │  • Invite-only gate          │
│  • Student dashboard    │◄───────│  • Sessions (httpOnly)       │
│  • Candidate dashboard  │  JSON  │  • Elections & voting logic  │
│  • Admin dashboard      │        │  • PostgreSQL (audit-logged) │
└─────────────────────────┘        └──────────────────────────────┘
```

**Login is invite-only.** Every user signs in with Google (through Clerk). The backend verifies the Clerk session, then checks the email against the voter roll: known users in, unknown users rejected with `403 NOT_INVITED`. Roles (`STUDENT`, `CANDIDATE`, `ADMIN`) come from the database — never from the login page.

---

## Features

### 👤 Students
- Google sign-in, one-time roll number capture
- Live election listing with club and position details
- Vote for candidates (one vote per position, receipt generated)
- View results once the admin publishes them
- Announcements, notifications, and a support request form

### 🎓 Candidates
- Apply for a position through a guided multi-step form — Name, Programme (BBA / BCA / BCOM / MBA / MCA), Age, DOB, Gender, Enrollment No, Mobile, Email, Aadhar, Club/Position, Declaration
- Auto-fill from their Google profile
- Application is **locked after submission** (read-only while under review)
- Profile page shows their photo and verified information

### 🛡️ Admins
- Create and manage elections, clubs, and positions
- Review candidate applications — approve / reject
- Authorize eligible voters
- Publish results
- Announcements, notifications, and a full audit log of every sensitive action

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, Clerk (`@clerk/nextjs`) |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (20 numbered migrations) |
| Auth | Clerk Google OAuth → backend session bridge (`jose` JWT verification against Clerk's JWKS) |
| Sessions | httpOnly cookies (`cv_sid`) + CSRF protection + rate limiting |
| Hosting | Vercel (frontend), Render (backend + PostgreSQL) |

---

## Running locally

**Backend** (see the [backend README](https://github.com/who07512-wq/voteweb-backend) for full setup):

```bash
cd voteweb-backend
npm install
cp .env.example .env        # set DATABASE_URL
npm run dev                 # http://localhost:3000/api/v1
```

**Frontend:**

```bash
cd voteweb-frontend
npm install
cp .env.example .env.local  # set the vars below
npm run dev                 # http://localhost:3001
```

### Frontend environment variables

| Variable | Example |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://voteweb-backend-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` (or `pk_live_...`) |
| `CLERK_SECRET_KEY` | `sk_test_...` (or `sk_live_...`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/login` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` | `/auth/clerk-callback` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/auth/clerk-callback` |

### Backend environment variables (auth-related)

| Variable | Purpose |
|---|---|
| `INVITE_ONLY` | `true` = only known/invited emails can sign in |
| `INVITED_EMAILS` | Comma-separated allow-list for new sign-ups |
| `ADMIN_EMAILS` | Emails promoted to ADMIN at sign-in (bootstrap) |
| `CLERK_ISSUER` | `https://<your-app>.clerk.accounts.dev` |
| `CLERK_SECRET_KEY` | Same Clerk secret, used server-to-server |
| `DATABASE_URL` | PostgreSQL connection string |

Full auth setup guide: **[`INVITE-ONLY-LOGIN.md`](https://github.com/who07512-wq/voteweb-backend/blob/main/INVITE-ONLY-LOGIN.md)**.

---

## Project structure

```
voteweb-frontend/               voteweb-backend/
├── src/app/                    ├── src/
│   ├── login/                  │   ├── routes/        # Express routers
│   │   └── [[...rest]]/        │   │   ├── auth.js
│   ├── auth/clerk-callback/    │   │   └── clerkAuth.js  # invite gate
│   ├── student/                │   ├── controllers/
│   ├── candidate/              │   ├── services/      # business logic
│   │   ├── apply/              │   ├── middleware/    # csrf, rate limit, auth
│   │   └── profile/            │   ├── db/            # pg pool
│   └── admin/                  │   ├── config/
├── src/components/             │   └── lib/
├── src/lib/                    ├── migrations/        # 001 → 023
│   ├── candidate-api.ts        └── app.js / server.js
│   └── roll-number.ts
└── src/proxy.ts                # Clerk middleware
```

---

## Deployment

| Piece | Where | How |
|---|---|---|
| Frontend | Vercel project `voteweb-frontend` | `vercel --prod` from the repo (auto-deploy activates once the Vercel GitHub App is installed) |
| Backend | Render service `voteweb-api` | Auto-deploys on every push to `main` |
| Database | Render PostgreSQL | Migrations run on deploy |

---

## Security model

- **Invite-only access** — unknown Google accounts are rejected at the backend bridge; every denied attempt is recorded in `audit_logs`
- **Server-side role verification** — the role picker on the login page is a routing hint only; privileges always come from the DB and are enforced on every API call
- **JWT verification** — Clerk session tokens are verified against Clerk's JWKS; forged or foreign-instance tokens fail immediately
- **httpOnly session cookies** — JavaScript can't read them; CSRF tokens + rate limiting protect every state-changing route
- **Vote integrity** — one vote per voter per position, receipts generated, results hidden until published

> ⚠️ Before the real election: switch Clerk from the development instance (`pk_test_…`) to a **production instance** and swap in the `pk_live_` / `sk_live_` keys on both Vercel and Render.

---

*Built with ❤️ by the DBIT team. Questions? See the auth guide or open an issue.*
