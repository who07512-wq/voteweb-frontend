# Frontend → Real Backend Conversion Map

Goal: remove the mock/demo data layer (`src/lib/*-data.ts`, `candidate-application-store.ts`,
`vote-store.ts`) and drive every page from the VoteWeb Express backend
(`voteweb-backend`, mounted at `/api/v1`).

> ⚠️ The typed clients in `src/lib/api/*` were written against an **aspirational API that
> does not match the real backend** (e.g. `elections.ts` calls `/elections/current`,
> `/elections/positions`, `/elections/vote`; none exist). Do not wire pages to `lib/api`
> blindly — target the verified Express surface below and fix/remove the mismatched client.

## Verified backend surface (routes in voteweb-backend/src/routes)

### Public (no auth)
| Endpoint | Purpose |
|---|---|
| `GET /elections` · `GET /elections/:id` | Elections list/details (`v1.ts` `listElections` matches) |
| `GET /elections/:id/clubs` | Clubs for election |
| `GET /clubs` · `GET /clubs/:id/positions` | Clubs; positions per club |
| `GET /positions` · `GET /positions/:id/candidates` | Positions; candidates per position |
| `GET /candidates` · `GET /candidates/:id` | Candidate list/detail |
| `GET /announcements` | Published announcements (`v1.ts` matches) |
| `GET /receipts/:uuid` | Public receipt verification |
| `POST /auth/login` · `POST /otp/send-login` · `POST /otp/verify-login` · `GET /auth/csrf` | Auth |
| `POST /support` · `GET /support` | Public support (no auth middleware on list) |

### Authenticated (session cookie `cv_sid`)
| Endpoint | Purpose |
|---|---|
| `GET /auth/me` | Current session (`v1.ts` `getMe` matches) |
| `POST /auth/logout` | Logout (CSRF) |
| `GET /elections/:electionId/eligibility` | Own eligibility |
| `GET /elections/:electionId/votes/check` | Voted check |
| `POST /elections/:electionId/votes` | Cast vote (CSRF + binding) |
| `GET /elections/:electionId/votes/receipt` · `.../receipt/:voteId` | Own receipts |
| `GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/:id/read` · `POST /notifications/mark-all-read` | Notifications |
| `GET /receipts/me/:electionId` | Receipt history for election |
| `POST /candidates/apply` · `GET /candidates/me/application` · `GET /candidates/me/access` · `PATCH /candidates/me/profile` · `POST /candidates/me/resubmit` | Candidate application (mounted at `/api/candidates`!) |
| `GET /students` (id-scoped), `GET /students/by-external-id/:externalId` | Student lookups |

### Admin (`requireAdmin`; on `/api/v1/admin/*`)
Students CRUD, elections CRUD + `/status` + `/:id/publish` (results), clubs, positions,
candidates, candidate-applications (`approve`/`reject`/`request-changes`),
announcements CRUD, support (list/update).

## Plumbing gaps to fix first (blocks state-changing pages)

1. **Session binding tokens**: `loadSession` requires `X-Session-Binding` for POST/PUT/PATCH
   when a session cookie exists. The frontend never stores the `bindingToken` returned by
   login/OTP, so authenticated writes (cast vote, admin actions) are treated as logged-out.
   Store it (sessionStorage) after login/OTP verify and send it from `api/client.ts`.
2. **CSRF**: `client.ts` already fetches `/auth/csrf` and sends `X-CSRF-Token` — keep.
3. **API base mismatch**: `client.ts` defaults to the Railway prod URL while `v1.ts` defaults
   to localhost — unify on `NEXT_PUBLIC_API_URL`.
4. **Missing backend endpoints** (frontend pages need them; build in backend first):
   - `GET /admin/activity` (audit log; only raw `auth_audit_logs` exists — no route)
   - `GET /elections/:id/results` exists but not wired to frontend
   - Reports / participation stats — none (would need aggregation queries)
   - Schedule events — none (election `start/end_time` only)
   - `GET /students/profile` (currently `students.js` is id-scoped, no `/profile`)
   - Notification "delete" — not in backend

## Page-by-page plan

### Student
| Page | Mock source today | Action |
|---|---|---|
| `student/vote` + `review` + `success` | `candidate-application-store` (localStorage) + `election-voting-data` | Rewire to `GET /elections/:id/clubs`→positions→candidates; submit via `POST /elections/:id/votes` (needs binding token) |
| `student/receipt` | `receipt-data` | `GET /elections/:id/votes/receipt` + `GET /receipts/me/:electionId` |
| `verify/[receiptId]` | `receipt-data` | `GET /receipts/:uuid` (already real public endpoint) |
| `student/candidates` + `[candidateId]` + `compare` | `candidate-data` `CANDIDATES` | `GET /candidates` + `GET /positions/:id/candidates` |
| `student/results` | `results-data` | `GET /elections/:id/results` |
| `notifications` | `notification-data` | `GET /notifications` (this page) |
| `student/profile` + `settings` + `settings/security` | `student-profile-data` | Needs `GET /students/profile` + sessions endpoints (build) |
| `student/help/*` | `help-data` (FAQ static + mock support) | FAQ may stay static content; requests → `GET/POST /support` |

### Candidate portal
| Page | Mock source | Action |
|---|---|---|
| `candidate/apply` + `status` + `profile` + `campaign` + `manifesto` + `preview` | `candidate-application-store` (localStorage) + `candidate-dashboard-data` | Real flow: `POST /candidates/apply`, `GET /candidates/me/application`, `PATCH /candidates/me/profile`, resubmit. Preview → public candidate record. |

### Admin
| Page | Mock source | Action |
|---|---|---|
| `admin/students` | `admin-dashboard-data` | `GET /admin/students` |
| `admin/candidates` | store + `admin-dashboard-data` | `GET /admin/candidate-applications` + approve/reject/request-changes |
| `admin/announcements` | `admin-dashboard-data` | announcements CRUD |
| `admin/election` + `schedule` | `admin-dashboard-data` | elections CRUD + `/status`; schedule needs backend work |
| `admin/positions` | `admin-dashboard-data` | `GET /positions` + admin patch |
| `admin/dashboard` | `admin-dashboard-data` (stats) | derive from real aggregates |
| `admin/issues` | `admin-dashboard-data` `MOCK_ISSUES` | `GET /admin/support` |
| `admin/activity` | `MOCK_ACTIVITY_LOG` | build `GET /admin/activity` from `auth_audit_logs` |
| `admin/results` + `reports` | `results-data` | `GET /elections/:id/results`; reports need aggregation |

## Execution order (slices)
1. Plumbing: binding token + API base + fix `lib/api` mismatches  ← prerequisite
2. Voting flow (student/vote, review, success) — the core feature currently fake
3. Receipts + verify
4. Notifications
5. Student candidates pages
6. Candidate portal
7. Admin pages + missing backend endpoints
8. Delete `vote-store.ts`, `*-data.ts` mocks, `candidate-application-store.ts`
