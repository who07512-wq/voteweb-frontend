# DBIT Election Platform - Backend Setup Guide

## For: Backend Developer Partner
## Stack: Node.js + Express + PostgreSQL

---

## STEP 1: Database Setup (PostgreSQL)

### Create Database
```sql
CREATE DATABASE dbit_election;
\c dbit_election;
```

### Tables Schema

```sql
-- Users (students, candidates, admins)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'candidate', 'administrator')),
    department VARCHAR(100),
    year VARCHAR(50),
    section VARCHAR(10),
    enrollment_number VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Elections
CREATE TABLE elections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'closed')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Positions
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidate Applications
CREATE TABLE candidate_applications (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    enrollment_number VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(50) NOT NULL,
    section VARCHAR(10) NOT NULL,
    position VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    photo_url TEXT,
    bio TEXT,
    manifesto JSONB,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected')),
    rejection_reason TEXT,
    admin_note TEXT,
    submitted_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
    candidate_id VARCHAR(50) REFERENCES candidate_applications(id) ON DELETE SET NULL,
    abstain BOOLEAN DEFAULT false,
    receipt_hash VARCHAR(255),
    nullifier VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(voter_id, position_id)
);

-- Vote Receipts
CREATE TABLE vote_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vote_id UUID REFERENCES votes(id) ON DELETE CASCADE,
    receipt_hash VARCHAR(255) UNIQUE NOT NULL,
    nullifier VARCHAR(255) UNIQUE NOT NULL,
    election_id UUID REFERENCES elections(id) ON DELETE SET NULL,
    voter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    verification_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'normal',
    status VARCHAR(50) DEFAULT 'active',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule Events
CREATE TABLE schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    event_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support/Issues
CREATE TABLE support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Support Messages
CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES support_requests(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Sessions
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device VARCHAR(255),
    browser VARCHAR(255),
    ip_address VARCHAR(50),
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
```sql
CREATE INDEX idx_votes_voter ON votes(voter_id);
CREATE INDEX idx_votes_election ON votes(election_id);
CREATE INDEX idx_candidate_email ON candidate_applications(email);
CREATE INDEX idx_candidate_status ON candidate_applications(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_support_user ON support_requests(user_id);
```

---

## STEP 2: Backend Project Setup

```bash
mkdir dbit-election-backend
cd dbit-election-backend
npm init -y
npm install express cors helmet pg bcryptjs jsonwebtoken dotenv zod
npm install -D typescript ts-node @types/node @types/express @types/cors @types/pg @types/bcryptjs @types/jsonwebtoken nodemon
npx tsc --init
```

### .env
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/dbit_election
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## STEP 3: API Routes (Express)

Base URL: `http://localhost:5000/api`

### Auth Middleware
```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}
```

### Database Connection
```typescript
// src/config/db.ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
```

---

## STEP 4: All API Endpoints

### POST /api/auth/login
```json
// Request
{ "email": "student@college.edu", "password": "password123", "role": "student" }

// Response 200
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "student@college.edu",
    "role": "student",
    "department": "BCA",
    "year": "3rd Year"
  }
}

// Response 401
{ "success": false, "message": "Invalid credentials" }

// Response 423
{ "success": false, "message": "Account locked. Try again in 5 minutes." }
```

### POST /api/auth/register (optional - for student self-registration)
```json
// Request
{
  "name": "John Doe",
  "email": "student@college.edu",
  "password": "password123",
  "enrollmentNumber": "DBIT2026001",
  "department": "BCA",
  "year": "3rd Year",
  "section": "A",
  "phone": "9876543210"
}

// Response 201
{ "success": true, "user": { ... } }
```

### POST /api/auth/logout
```json
// Headers: Authorization: Bearer <token>
// Response 200
{ "success": true }
```

### GET /api/auth/profile
```json
// Headers: Authorization: Bearer <token>
// Response 200
{
  "id": "uuid",
  "name": "John Doe",
  "email": "student@college.edu",
  "role": "student",
  "department": "BCA",
  "year": "3rd Year"
}
```

---

### GET /api/candidates
```json
// Headers: Authorization: Bearer <token>
// Response 200
[
  {
    "id": "CAN-101",
    "name": "John Doe",
    "enrollmentNumber": "DBIT2026001",
    "department": "BCA",
    "year": "3rd Year",
    "section": "A",
    "position": "President",
    "email": "john@college.edu",
    "phone": "9876543210",
    "photo": null,
    "bio": "Short bio text",
    "manifesto": "[{\"title\":\"Vision\",\"content\":\"...\"}]",
    "status": "approved",
    "rejectionReason": null,
    "adminNote": null,
    "submittedDate": "01 August 2026",
    "reviewedDate": "03 August 2026"
  }
]
```

### GET /api/candidates/approved
```json
// Response 200
// Returns only candidates with status = "approved"
[
  { ... same shape as above ... }
]
```

### GET /api/candidates/me
```json
// Headers: Authorization: Bearer <token>
// Response 200 - returns current user's application
{ ... }
```

### POST /api/candidates
```json
// Headers: Authorization: Bearer <token>
// Request
{
  "name": "John Doe",
  "enrollmentNumber": "DBIT2026001",
  "department": "BCA",
  "year": "3rd Year",
  "section": "A",
  "position": "President",
  "email": "john@college.edu",
  "phone": "9876543210",
  "photo": null,
  "bio": "I am John Doe...",
  "manifesto": "[{\"title\":\"Vision\",\"content\":\"My vision...\"},{\"title\":\"Goals\",\"content\":\"My goals...\"}]"
}

// Response 201
{ "id": "CAN-101", "status": "submitted", ... }
```

### PUT /api/candidates/:id
```json
// Headers: Authorization: Bearer <token>
// Request - partial update (only draft/changes_requested can update)
{ "bio": "Updated bio", "manifesto": "..." }

// Response 200
{ ... updated application ... }

// Response 400
{ "message": "Cannot update after submission" }
```

### PATCH /api/candidates/:id/status
```json
// Headers: Authorization: Bearer <admin-token>
// Request
{
  "status": "approved",
  "reason": "Optional rejection reason",
  "note": "Optional admin note"
}

// Response 200
{ ... updated application ... }
```

### GET /api/candidates/positions
```json
// Response 200
["President", "Vice President", "General Secretary", "Treasurer", "Cultural Secretary", "Sports Secretary"]
```

### GET /api/candidates/departments
```json
// Response 200
["BCA", "BBA", "BSc IT", "BSc CS", "B.Com", "BA"]
```

---

### GET /api/elections/current
```json
// Response 200
{
  "id": "uuid",
  "name": "Student Council Election 2026",
  "status": "open",
  "startDate": "10 August 2026",
  "endDate": "10 August 2026",
  "startTime": "9:00 AM",
  "endTime": "5:00 PM",
  "eligibleStudents": 850,
  "totalPositions": 6,
  "participation": 76.3
}
```

### GET /api/elections/positions
```json
// Response 200
[
  {
    "id": "pos-uuid-1",
    "name": "President",
    "order": 1,
    "candidates": [
      {
        "id": "CAN-101",
        "name": "John Doe",
        "department": "BCA",
        "year": "3rd Year",
        "photoInitials": "JD",
        "campaignSymbol": "PRE",
        "shortManifesto": "Brief manifesto text..."
      }
    ]
  }
]
```

### POST /api/elections/vote
```json
// Headers: Authorization: Bearer <token>
// Request
{
  "selections": {
    "pos-uuid-1": "CAN-101",
    "pos-uuid-2": null  // null = abstain
  }
}

// Response 200
{
  "success": true,
  "voteId": "vote-uuid",
  "receiptHash": "sha256-hash...",
  "nullifier": "unique-nullifier-string",
  "timestamp": "2026-08-10T14:30:00Z"
}

// Response 400
{ "message": "Voting is not open" }

// Response 409
{ "message": "You have already voted" }
```

### GET /api/elections/results
```json
// Response 200
{
  "electionName": "Student Council Election 2026",
  "totalVoters": 850,
  "totalVotesCast": 649,
  "participationRate": 76.3,
  "positions": [
    {
      "position": "President",
      "totalVotes": 649,
      "candidates": [
        {
          "id": "CAN-101",
          "name": "John Doe",
          "department": "BCA",
          "votes": 312,
          "percentage": 48.1,
          "status": "winner"
        },
        {
          "id": "CAN-102",
          "name": "Jane Smith",
          "department": "BBA",
          "votes": 337,
          "percentage": 51.9,
          "status": "runner_up"
        }
      ]
    }
  ]
}
```

---

### GET /api/students/profile
```json
// Headers: Authorization: Bearer <token>
// Response 200
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@college.edu",
  "enrollmentNumber": "DBIT2026001",
  "department": "BCA",
  "year": "3rd Year",
  "section": "A",
  "phone": "9876543210",
  "avatar": null
}
```

### PUT /api/students/profile
```json
// Headers: Authorization: Bearer <token>
// Request
{ "phone": "9876543210", "section": "B" }
// Response 200
{ ... updated profile ... }
```

### GET /api/students/notifications/settings
```json
// Response 200
{
  "emailNotifications": true,
  "pushNotifications": true,
  "voteReminders": true,
  "resultAnnouncements": true,
  "systemUpdates": true
}
```

### PUT /api/students/notifications/settings
```json
// Request
{ "emailNotifications": false }
// Response 200
{ "success": true }
```

### GET /api/students/sessions
```json
// Response 200
[
  {
    "id": "session-uuid",
    "device": "Windows",
    "browser": "Chrome",
    "ip": "192.168.1.1",
    "lastActive": "2026-08-10T14:30:00Z",
    "current": true
  }
]
```

### DELETE /api/students/sessions/:id
```json
// Response 200
{ "success": true }
```

---

### GET /api/admin/election
```json
// Headers: Authorization: Bearer <admin-token>
// Response 200
{
  "id": "uuid",
  "name": "Student Council Election 2026",
  "status": "open",
  "startDate": "10 August 2026",
  "endDate": "10 August 2026",
  "eligibleStudents": 850,
  "totalPositions": 6,
  "participation": 76.3
}
```

### PUT /api/admin/election
```json
// Request
{ "status": "closed" }
// Response 200
{ "success": true }
```

### GET /api/admin/students
```json
// Response 200
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@college.edu",
    "department": "BCA",
    "year": "3rd Year",
    "section": "A",
    "hasVoted": true,
    "status": "active"
  }
]
```

### GET /api/admin/schedule
```json
// Response 200
[
  {
    "id": "uuid",
    "title": "Voting Day",
    "date": "10 August 2026",
    "time": "9:00 AM",
    "type": "voting",
    "status": "scheduled"
  }
]
```

### POST /api/admin/schedule
```json
// Request
{ "title": "Candidate Registration", "date": "01 August 2026", "time": "10:00 AM", "type": "registration" }
// Response 201
{ "id": "uuid", ... }
```

### DELETE /api/admin/schedule/:id
```json
// Response 200
{ "success": true }
```

### GET /api/admin/announcements
```json
// Response 200
[
  {
    "id": "uuid",
    "title": "Voting Started",
    "content": "Voting is now open...",
    "date": "10 August 2026",
    "priority": "high",
    "status": "active"
  }
]
```

### POST /api/admin/announcements
```json
// Request
{ "title": "Voting Started", "content": "...", "priority": "high" }
// Response 201
{ "id": "uuid", ... }
```

### GET /api/admin/issues
```json
// Response 200
[
  {
    "id": "uuid",
    "title": "Cannot login",
    "category": "Technical",
    "reportedBy": "John Doe",
    "date": "10 August 2026",
    "status": "open",
    "priority": "high"
  }
]
```

### PATCH /api/admin/issues/:id
```json
// Request
{ "status": "resolved" }
// Response 200
{ "success": true }
```

### GET /api/admin/activity
```json
// Response 200
[
  {
    "id": "uuid",
    "action": "Approved candidate application",
    "user": "Admin",
    "timestamp": "10 August 2026 2:30 PM",
    "details": "Approved CAN-101 for President"
  }
]
```

### GET /api/admin/dashboard
```json
// Response 200
{
  "totalStudents": 850,
  "totalCandidates": 12,
  "votesCast": 649,
  "participationRate": 76.3,
  "pendingApplications": 3,
  "openIssues": 2
}
```

---

### GET /api/notifications
```json
// Headers: Authorization: Bearer <token>
// Response 200
[
  {
    "id": "uuid",
    "title": "Application Approved",
    "message": "Your candidate application has been approved",
    "type": "success",
    "read": false,
    "timestamp": "2026-08-10T14:30:00Z"
  }
]
```

### PATCH /api/notifications/:id/read
```json
// Response 200
{ "success": true }
```

### PATCH /api/notifications/read-all
```json
// Response 200
{ "success": true }
```

### DELETE /api/notifications/:id
```json
// Response 200
{ "success": true }
```

---

### GET /api/receipts/verify?hash=<receiptHash>
```json
// Response 200
{
  "id": "receipt-uuid",
  "voteId": "vote-uuid",
  "receiptHash": "sha256-hash...",
  "nullifier": "unique-nullifier",
  "timestamp": "2026-08-10T14:30:00Z",
  "verified": true,
  "verificationUrl": "https://clg-voting.vercel.app/verify/abc123"
}
```

### GET /api/receipts/history
```json
// Headers: Authorization: Bearer <token>
// Response 200
[
  {
    "id": "receipt-uuid",
    "electionName": "Student Council Election 2026",
    "date": "10 August 2026",
    "receiptHash": "sha256-hash...",
    "verified": true
  }
]
```

---

### GET /api/help/requests
```json
// Headers: Authorization: Bearer <token>
// Response 200
[
  {
    "id": "uuid",
    "subject": "Cannot vote",
    "category": "Technical",
    "status": "open",
    "priority": "high",
    "createdAt": "2026-08-10T14:30:00Z",
    "updatedAt": "2026-08-10T14:30:00Z",
    "messages": [
      {
        "id": "msg-uuid",
        "sender": "John Doe",
        "message": "I cannot select a candidate",
        "timestamp": "2026-08-10T14:30:00Z",
        "isAdmin": false
      }
    ]
  }
]
```

### POST /api/help/requests
```json
// Request
{ "subject": "Cannot vote", "category": "Technical", "description": "Details...", "priority": "high" }
// Response 201
{ "id": "uuid", ... }
```

### POST /api/help/requests/:id/messages
```json
// Request
{ "message": "Additional info..." }
// Response 201
{ ... }
```

### GET /api/help/faq
```json
// Response 200
[
  { "question": "How do I vote?", "answer": "..." }
]
```

### GET /api/help/status
```json
// Response 200
[
  { "name": "Database", "status": "operational" },
  { "name": "Voting System", "status": "operational" }
]
```

---

## STEP 5: JWT Token Structure

```typescript
// Sign token
const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);

// Token payload
{
  "id": "user-uuid",
  "email": "user@college.edu",
  "role": "student",
  "iat": 1723300000,
  "exp": 1723386400
}
```

---

## STEP 6: Frontend Environment

On the frontend side, add this to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

When deploying frontend to Vercel, set the same in Vercel Environment Variables.

---

## STEP 7: Test Checklist

After building, test these flows:

- [ ] Student login → sees dashboard
- [ ] Candidate login → sees application form
- [ ] Candidate submits application → status becomes "under_review"
- [ ] Admin approves candidate → status becomes "approved"
- [ ] Student sees approved candidates at /student/candidates
- [ ] Student casts vote → receives receipt
- [ ] Student verifies receipt at /verify/[hash]
- [ ] Admin sees results at /admin/results
