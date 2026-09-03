# CampusVote Backend API Documentation

Base URL: `http://localhost:5000/api`
Auth: Bearer token in `Authorization` header

---

## Auth

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/login` | `{ email, password, role }` | `{ success, token, user: { id, name, email, role, department, year } }` |
| POST | `/auth/logout` | `{}` | `{ success }` |
| GET | `/auth/profile` | - | `{ id, name, email, role, department, year }` |
| POST | `/auth/forgot-password` | `{ email }` | `{ success, message }` |
| POST | `/auth/reset-password` | `{ token, newPassword }` | `{ success }` |

---

## Candidates

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/candidates/me` | - | `CandidateApplication` |
| GET | `/candidates` | - | `CandidateApplication[]` |
| GET | `/candidates/approved` | - | `CandidateApplication[]` |
| GET | `/candidates/:id` | - | `CandidateApplication` |
| POST | `/candidates` | `SubmitApplicationPayload` | `CandidateApplication` |
| PUT | `/candidates/:id` | `Partial<SubmitApplicationPayload>` | `CandidateApplication` |
| PATCH | `/candidates/:id/status` | `{ status, reason?, note? }` | `CandidateApplication` |
| GET | `/candidates/positions` | - | `string[]` |
| GET | `/candidates/departments` | - | `string[]` |

### CandidateApplication
```json
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
  "bio": "Short bio",
  "manifesto": "[{\"title\":\"Vision\",\"content\":\"...\"}]",
  "status": "submitted|under_review|changes_requested|approved|rejected",
  "rejectionReason": null,
  "adminNote": null,
  "submittedDate": "01 August 2026",
  "reviewedDate": null
}
```

---

## Elections

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/elections/current` | - | `Election` |
| GET | `/elections/positions` | - | `ElectionPosition[]` |
| POST | `/elections/vote` | `{ selections: { posId: candidateId\|null } }` | `{ success, voteId, receiptHash, nullifier, timestamp }` |
| GET | `/elections/results` | - | `ElectionResults` |
| GET | `/elections/participation` | - | `DepartmentParticipation[]` |

### Election
```json
{
  "id": "election-2026",
  "name": "Student Council Election 2026",
  "status": "open|closed|upcoming",
  "startDate": "10 August 2026",
  "endDate": "10 August 2026",
  "startTime": "9:00 AM",
  "endTime": "5:00 PM",
  "eligibleStudents": 850,
  "totalPositions": 6,
  "participation": 76.3
}
```

### ElectionPosition
```json
{
  "id": "pos-1",
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
      "shortManifesto": "Brief manifesto"
    }
  ]
}
```

---

## Students

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/students/profile` | - | `StudentProfile` |
| PUT | `/students/profile` | `Partial<StudentProfile>` | `StudentProfile` |
| GET | `/students/notifications/settings` | - | `NotificationSettings` |
| PUT | `/students/notifications/settings` | `Partial<NotificationSettings>` | `{ success }` |
| GET | `/students/sessions` | - | `ActiveSession[]` |
| DELETE | `/students/sessions/:id` | - | `{ success }` |

---

## Admin

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/admin/election` | - | `AdminElection` |
| PUT | `/admin/election` | `Partial<AdminElection>` | `{ success }` |
| GET | `/admin/students` | - | `AdminStudent[]` |
| GET | `/admin/schedule` | - | `ScheduleEvent[]` |
| POST | `/admin/schedule` | `ScheduleEvent` | `ScheduleEvent` |
| DELETE | `/admin/schedule/:id` | - | `{ success }` |
| GET | `/admin/announcements` | - | `Announcement[]` |
| POST | `/admin/announcements` | `Announcement` | `Announcement` |
| DELETE | `/admin/announcements/:id` | - | `{ success }` |
| GET | `/admin/issues` | - | `AdminIssue[]` |
| PATCH | `/admin/issues/:id` | `Partial<AdminIssue>` | `{ success }` |
| GET | `/admin/activity` | - | `ActivityLogEntry[]` |
| GET | `/admin/dashboard` | - | `{ stats, charts }` |

---

## Notifications

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/notifications` | - | `Notification[]` |
| PATCH | `/notifications/:id/read` | - | `{ success }` |
| PATCH | `/notifications/read-all` | - | `{ success }` |
| DELETE | `/notifications/:id` | - | `{ success }` |

---

## Receipts

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/receipts/verify?hash=<hash>` | - | `Receipt` |
| GET | `/receipts?voteId=<id>` | - | `Receipt` |
| GET | `/receipts/history` | - | `ReceiptHistoryItem[]` |

---

## Results

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/results` | - | `ElectionResults` |
| GET | `/results/participation` | - | `DepartmentParticipation[]` |
| GET | `/results/reports` | - | `{ reportData, candidateReport, ... }` |

---

## Help/Support

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/help/requests` | - | `SupportRequest[]` |
| GET | `/help/requests/:id` | - | `SupportRequest` |
| POST | `/help/requests` | `{ subject, category, description, priority }` | `SupportRequest` |
| POST | `/help/requests/:id/messages` | `{ message }` | `SupportMessage` |
| GET | `/help/faq` | - | `FAQItem[]` |
| GET | `/help/status` | - | `SystemStatus[]` |

---

## Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Set this in `.env.local` to point to your backend.
