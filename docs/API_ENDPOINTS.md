# API Endpoints Documentation

Complete API reference for Reply Platform API with dashboard integration support.

## Table of Contents

- [Authentication](#authentication)
- [Websites](#websites)
- [Organizations](#organizations)
- [Agents](#agents)
- [Usage Tracking](#usage-tracking)

## Base URL

```
Production: https://reply-platform-api.workers.dev
Local: http://localhost:8787
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### POST /auth/google

Exchange Google OAuth authorization code for JWT token.

**Request:**
```json
{
  "code": "string",        // OAuth authorization code from Google
  "redirectUri": "string"  // Redirect URI used in OAuth flow
}
```

**Response (200):**
```json
{
  "token": "string",  // JWT token
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "picture": "string | null"
  }
}
```

**Errors:**
- 400 Bad Request: Missing code or redirectUri
- 401 Unauthorized: Invalid OAuth code
- 500 Internal Server Error

---

### POST /auth/login

Email/password authentication.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "picture": "string | null"
  }
}
```

**Errors:**
- 400 Bad Request: Missing email or password
- 401 Unauthorized: Invalid credentials
- 500 Internal Server Error

---

### POST /auth/otp/request

Request OTP code for passwordless authentication.

**Request:**
```json
{
  "email": "string"
}
```

**Response (200):**
```json
{
  "message": "OTP sent to email"
}
```

**Errors:**
- 400 Bad Request: Missing email
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error

---

### POST /auth/otp/verify

Verify OTP code and authenticate user.

**Request:**
```json
{
  "email": "string",
  "otp": "string"  // 6-digit code
}
```

**Response (200):**
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "picture": "string | null"
  }
}
```

**Errors:**
- 400 Bad Request: Missing email or OTP
- 401 Unauthorized: Invalid or expired OTP
- 500 Internal Server Error

---

### GET /auth/me

Get current authenticated user's information.

**Authentication:** Required

**Response (200):**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string | null",
    "picture": "string | null"
  }
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: User not found
- 500 Internal Server Error

---

## Websites

### GET /websites

List all websites owned by authenticated user.

**Authentication:** Required

**Response (200):**
```json
{
  "websites": [
    {
      "id": "string",
      "user_id": "string",
      "domain": "string",
      "created_at": "string (ISO 8601)",
      "updated_at": "string (ISO 8601)"
    }
  ]
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 500 Internal Server Error

---

### POST /websites

Add a new website to user's account.

**Authentication:** Required

**Request:**
```json
{
  "domain": "string"  // e.g., "example.com"
}
```

**Response (201):**
```json
{
  "website": {
    "id": "string",
    "user_id": "string",
    "domain": "string",
    "created_at": "string (ISO 8601)",
    "updated_at": "string (ISO 8601)"
  }
}
```

**Errors:**
- 400 Bad Request: Missing domain
- 401 Unauthorized: Invalid token
- 409 Conflict: Domain already exists
- 500 Internal Server Error

---

### GET /websites/:id

Get specific website details.

**Authentication:** Required

**Response (200):**
```json
{
  "website": {
    "id": "string",
    "user_id": "string",
    "domain": "string",
    "created_at": "string (ISO 8601)",
    "updated_at": "string (ISO 8601)"
  }
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Website not found
- 500 Internal Server Error

---

### DELETE /websites/:id

Delete a website from user's account.

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Website deleted"
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Website not found
- 500 Internal Server Error

---

## Organizations

### GET /organizations

List all organizations where user is a member.

**Authentication:** Required

**Response (200):**
```json
{
  "organizations": [
    {
      "id": "string",
      "name": "string",
      "url_slug": "string",
      "owner_id": "string",
      "created_at": "string (ISO 8601)",
      "updated_at": "string (ISO 8601)"
    }
  ]
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 500 Internal Server Error

---

### POST /organizations

Create a new organization.

**Authentication:** Required

**Request:**
```json
{
  "name": "string",
  "url_slug": "string"  // Optional, auto-generated if not provided
}
```

**Response (201):**
```json
{
  "organization": {
    "id": "string",
    "name": "string",
    "url_slug": "string",
    "owner_id": "string",
    "created_at": "string (ISO 8601)",
    "updated_at": "string (ISO 8601)"
  }
}
```

**Errors:**
- 400 Bad Request: Missing name
- 401 Unauthorized: Invalid token
- 500 Internal Server Error

---

### GET /organizations/:id

Get specific organization details.

**Authentication:** Required

**Response (200):**
```json
{
  "organization": {
    "id": "string",
    "name": "string",
    "url_slug": "string",
    "owner_id": "string",
    "created_at": "string (ISO 8601)",
    "updated_at": "string (ISO 8601)"
  }
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Organization not found or access denied
- 500 Internal Server Error

---

### PUT /organizations/:id

Update organization details (owner only).

**Authentication:** Required

**Request:**
```json
{
  "name": "string",      // Optional
  "url_slug": "string"   // Optional
}
```

**Response (200):**
```json
{
  "organization": {
    "id": "string",
    "name": "string",
    "url_slug": "string",
    "owner_id": "string",
    "created_at": "string (ISO 8601)",
    "updated_at": "string (ISO 8601)"
  }
}
```

**Errors:**
- 400 Bad Request: No fields to update
- 401 Unauthorized: Invalid token
- 404 Not Found: Organization not found or access denied
- 409 Conflict: URL slug already in use
- 500 Internal Server Error

---

### DELETE /organizations/:id

Delete an organization (owner only).

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Organization deleted"
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Organization not found or access denied
- 500 Internal Server Error

---

### GET /organizations/:id/members

List all members of an organization.

**Authentication:** Required

**Response (200):**
```json
{
  "members": [
    {
      "id": "string",
      "organization_id": "string",
      "user_id": "string",
      "role": "string",  // "owner", "admin", "member"
      "created_at": "string (ISO 8601)",
      "email": "string",
      "name": "string | null",
      "picture": "string | null"
    }
  ]
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Organization not found or access denied
- 500 Internal Server Error

---

## Agents

### GET /agents

List all agents accessible to the authenticated user.

**Authentication:** Required

**Query Parameters:**
- `organization_id` (optional): Filter by organization ID

**Response (200):**
```json
{
  "agents": [
    {
      "id": "string",
      "organization_id": "string",
      "name": "string",
      "description": "string | null",
      "last_trained": "string (ISO 8601) | null",
      "created_at": "string (ISO 8601)",
      "updated_at": "string (ISO 8601)"
    }
  ]
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 500 Internal Server Error

---

### POST /agents

Create a new AI agent.

**Authentication:** Required

**Request:**
```json
{
  "organization_id": "string",
  "name": "string",
  "description": "string"  // Optional
}
```

**Response (201):**
```json
{
  "agent": {
    "id": "string",
    "organization_id": "string",
    "name": "string",
    "description": "string | null",
    "last_trained": "string (ISO 8601) | null",
    "created_at": "string (ISO 8601)",
    "updated_at": "string (ISO 8601)"
  }
}
```

**Errors:**
- 400 Bad Request: Missing organization_id or name
- 401 Unauthorized: Invalid token
- 404 Not Found: Organization not found or access denied
- 500 Internal Server Error

---

### GET /agents/:id

Get specific agent details.

**Authentication:** Required

**Response (200):**
```json
{
  "agent": {
    "id": "string",
    "organization_id": "string",
    "name": "string",
    "description": "string | null",
    "last_trained": "string (ISO 8601) | null",
    "created_at": "string (ISO 8601)",
    "updated_at": "string (ISO 8601)"
  }
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Agent not found
- 500 Internal Server Error

---

### PUT /agents/:id

Update agent details.

**Authentication:** Required

**Request:**
```json
{
  "name": "string",           // Optional
  "description": "string",    // Optional
  "last_trained": "string"    // Optional, ISO 8601
}
```

**Response (200):**
```json
{
  "agent": {
    "id": "string",
    "organization_id": "string",
    "name": "string",
    "description": "string | null",
    "last_trained": "string (ISO 8601) | null",
    "created_at": "string (ISO 8601)",
    "updated_at": "string (ISO 8601)"
  }
}
```

**Errors:**
- 400 Bad Request: No fields to update
- 401 Unauthorized: Invalid token
- 404 Not Found: Agent not found or access denied
- 500 Internal Server Error

---

### DELETE /agents/:id

Delete an agent.

**Authentication:** Required

**Response (200):**
```json
{
  "message": "Agent deleted"
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Agent not found or access denied
- 500 Internal Server Error

---

## Usage Tracking

### GET /usage/:organization_id

Get usage statistics for an organization.

**Authentication:** Required

**Query Parameters:**
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)

**Response (200):**
```json
{
  "credits_used": 0,
  "total_credits": 1100,
  "agents_used": 9,
  "total_agents": 10
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Organization not found or access denied
- 500 Internal Server Error

---

### GET /usage/:organization_id/history

Get usage history for an organization.

**Authentication:** Required

**Query Parameters:**
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)

**Response (200):**
```json
{
  "history": [
    {
      "record_date": "2025-10-01",
      "credits_used": 0
    }
  ]
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Organization not found or access denied
- 500 Internal Server Error

---

### GET /usage/:organization_id/by-agent

Get usage statistics grouped by agent.

**Authentication:** Required

**Query Parameters:**
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)

**Response (200):**
```json
{
  "by_agent": [
    {
      "agent_id": "string",
      "agent_name": "string",
      "credits_used": 0
    }
  ]
}
```

**Errors:**
- 401 Unauthorized: Invalid token
- 404 Not Found: Organization not found or access denied
- 500 Internal Server Error

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "string"  // Human-readable error message
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required or invalid |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
