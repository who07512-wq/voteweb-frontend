# Backend Developer - Connection Guide

## Frontend API Base URL
Set in frontend: `NEXT_PUBLIC_API_URL=http://localhost:5000` (or deployed backend URL)

---

## Candidate Application Form - Required Endpoints

The frontend has a candidate application form with 3 steps: **Personal Info → Contact Details → Manifesto**. These are the endpoints your backend MUST implement:

### 1. POST /api/candidate-applications
Submit a new candidate application.

**Request Body:**
```json
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
  "bio": "I am a motivated student...",
  "manifesto": "[{\"title\":\"Vision\",\"content\":\"My vision...\"},{\"title\":\"Goals\",\"content\":\"My goals...\"}]"
}
```

**Response 201:**
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
  "bio": "I am a motivated student...",
  "manifesto": "[{\"title\":\"Vision\",\"content\":\"My vision...\"}]",
  "status": "submitted",
  "submittedDate": "10 August 2026"
}
```

---

### 2. GET /api/candidate-applications/me
Get the current logged-in user's own application.

**Headers:** `Authorization: Bearer <jwt_token>`

**Response 200:**
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
  "bio": "I am a motivated student...",
  "manifesto": "[{\"title\":\"Vision\",\"content\":\"...\"}]",
  "status": "submitted",
  "rejectionReason": null,
  "adminNote": null,
  "submittedDate": "10 August 2026",
  "reviewedDate": null
}
```

**Response 404:** (no application found)
```json
{ "message": "Application not found" }
```

---

### 3. PATCH /api/candidate-applications/me
Update own application (only if status is `draft` or `changes_requested`).

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body (all fields optional):**
```json
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
  "bio": "Updated bio...",
  "manifesto": "[{\"title\":\"Vision\",\"content\":\"...\"}]"
}
```

**Response 200:** Updated application object

**Response 400:** (cannot update after submission)
```json
{ "message": "Cannot update application after submission" }
```

---

### 4. GET /api/admin/candidate-applications
Admin: Get all candidate applications.

**Headers:** `Authorization: Bearer <admin_jwt_token>`

**Query params (optional):**
- `status` — filter by status: `draft`, `submitted`, `under_review`, `changes_requested`, `approved`, `rejected`
- `department` — filter by department
- `position` — filter by position

**Response 200:**
```json
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
    "bio": "Short bio",
    "manifesto": "[{\"title\":\"Vision\",\"content\":\"...\"}]",
    "status": "under_review",
    "rejectionReason": null,
    "adminNote": null,
    "submittedDate": "01 August 2026",
    "reviewedDate": null
  }
]
```

---

### 5. PATCH /api/admin/candidate-applications/:id/status
Admin: Approve, reject, or request changes.

**Headers:** `Authorization: Bearer <admin_jwt_token>`

**Request Body:**
```json
{
  "status": "approved"
}
```
OR
```json
{
  "status": "rejected",
  "reason": "Application incomplete"
}
```
OR
```json
{
  "status": "changes_requested",
  "note": "Please add more detail to your manifesto"
}
```

**Response 200:** Updated application object
```json
{
  "id": "CAN-101",
  "status": "approved",
  "reviewedDate": "10 August 2026"
}
```

---

### 6. GET /api/candidate-applications/approved
Public: Get all approved candidates (for student voting page).

**Response 200:**
```json
[
  {
    "id": "CAN-101",
    "name": "John Doe",
    "department": "BCA",
    "year": "3rd Year",
    "position": "President",
    "photo": null,
    "bio": "Short bio...",
    "manifesto": "[{\"title\":\"Vision\",\"content\":\"...\"}]"
  }
]
```

---

## IMPORTANT NOTES

1. **Status Values** — only these 6 values are valid:
   - `draft` — application started but not submitted
   - `submitted` — submitted by candidate
   - `under_review` — admin is reviewing
   - `changes_requested` — admin sent back for changes
   - `approved` — approved, candidate visible to students
   - `rejected` — rejected

2. **Manifesto Format** — manifesto is stored as JSON string:
   ```json
   "[{\"title\":\"Vision\",\"content\":\"...\"},{\"title\":\"Goals\",\"content\":\"...\"}]"
   ```
   Frontend parses this, so backend should store and return the same JSON string format.

3. **Admin Routes** — routes under `/api/admin/` require admin JWT token (role = "administrator")

4. **Auth Header** — all protected routes need:
   ```
   Authorization: Bearer <jwt_token>
   ```

5. **Position Options** — valid positions:
   ```
   President, Vice President, General Secretary, Treasurer, Cultural Secretary, Sports Secretary
   ```

6. **Department Options** — valid departments:
   ```
   BCA, BBA, BSc IT, BSc CS, B.Com, BA
   ```

---

## Questions? Ask the frontend developer.
