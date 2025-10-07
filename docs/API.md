# API Documentation

## Base URL

**Production**: `https://reply-platform-api.red-frog-895a.workers.dev`  
**Development**: `http://localhost:8787` (when running `npm run dev`)

## Authentication

Most API endpoints require authentication using JWT tokens obtained through Google OAuth.

### Authentication Header Format
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Health Check

#### `GET /`
Check if the API is running.

**Authentication**: Not required

**Response**:
```json
{
  "message": "Reply.sh API is running"
}
```

**Status Codes**:
- `200 OK`: API is operational

**Example**:
```bash
curl https://reply-platform-api.red-frog-895a.workers.dev/
```

---

## Authentication Endpoints

### Google OAuth Login

#### `POST /auth/google`
Exchange a Google OAuth authorization code for a JWT token.

**Authentication**: Not required

**Request Body**:
```json
{
  "code": "google_oauth_authorization_code"
}
```

**Response** (Success):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Status Codes**:
- `200 OK`: Successfully authenticated
- `400 Bad Request`: Missing or invalid authorization code
- `401 Unauthorized`: Invalid OAuth code
- `500 Internal Server Error`: Server error during authentication

**Flow**:
1. Client redirects user to Google OAuth consent screen
2. Google redirects back with authorization code
3. Client sends code to this endpoint
4. API exchanges code for access token with Google
5. API fetches user info from Google
6. API creates or updates user in database
7. API generates and returns JWT token

**Example**:
```bash
curl -X POST https://reply-platform-api.red-frog-895a.workers.dev/auth/google \
  -H "Content-Type: application/json" \
  -d '{"code": "4/0AY0e-g7..."}'
```

**Google OAuth Setup**:
To obtain an authorization code, redirect users to:
```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=openid%20email%20profile
```

---

### Get Current User

#### `GET /auth/me`
Retrieve information about the currently authenticated user.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (Success):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://lh3.googleusercontent.com/...",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Status Codes**:
- `200 OK`: User information retrieved successfully
- `401 Unauthorized`: Missing or invalid token
- `404 Not Found`: User not found in database
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl https://reply-platform-api.red-frog-895a.workers.dev/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Website Management Endpoints

### List User's Websites

#### `GET /websites`
Retrieve all websites registered by the authenticated user.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (Success):
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "domain": "example.com",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "domain": "blog.example.com",
    "created_at": "2024-01-16T14:20:00.000Z",
    "updated_at": "2024-01-16T14:20:00.000Z"
  }
]
```

**Status Codes**:
- `200 OK`: Websites retrieved successfully (empty array if none)
- `401 Unauthorized`: Missing or invalid token
- `500 Internal Server Error`: Server error

**Example**:
```bash
curl https://reply-platform-api.red-frog-895a.workers.dev/websites \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Add New Website

#### `POST /websites`
Register a new website for the authenticated user.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "domain": "example.com"
}
```

**Response** (Success):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "domain": "example.com",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Status Codes**:
- `201 Created`: Website successfully registered
- `400 Bad Request`: Missing or invalid domain
- `401 Unauthorized`: Missing or invalid token
- `409 Conflict`: Domain already registered
- `500 Internal Server Error`: Server error

**Validation Rules**:
- Domain must be provided
- Domain must be unique across all users
- Domain format is not strictly validated (can be subdomain, TLD, etc.)

**Example**:
```bash
curl -X POST https://reply-platform-api.red-frog-895a.workers.dev/websites \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

---

### Get Specific Website

#### `GET /websites/:id`
Retrieve details of a specific website by ID.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `id`: Website UUID

**Response** (Success):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "domain": "example.com",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

**Status Codes**:
- `200 OK`: Website retrieved successfully
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Website belongs to another user
- `404 Not Found`: Website not found
- `500 Internal Server Error`: Server error

**Authorization**:
Users can only access their own websites. Attempting to access another user's website returns a 403 error.

**Example**:
```bash
curl https://reply-platform-api.red-frog-895a.workers.dev/websites/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Delete Website

#### `DELETE /websites/:id`
Delete a website by ID.

**Authentication**: Required

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `id`: Website UUID

**Response** (Success):
```json
{
  "message": "Website deleted successfully"
}
```

**Status Codes**:
- `200 OK`: Website deleted successfully
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Website belongs to another user
- `404 Not Found`: Website not found
- `500 Internal Server Error`: Server error

**Authorization**:
Users can only delete their own websites. Attempting to delete another user's website returns a 403 error.

**Example**:
```bash
curl -X DELETE https://reply-platform-api.red-frog-895a.workers.dev/websites/660e8400-e29b-41d4-a716-446655440001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message description"
}
```

### Common Error Codes

| Status Code | Description |
|------------|-------------|
| `400 Bad Request` | Invalid request format or missing required fields |
| `401 Unauthorized` | Missing or invalid authentication token |
| `403 Forbidden` | Authenticated but not authorized for this resource |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Resource already exists (e.g., duplicate domain) |
| `500 Internal Server Error` | Server-side error |

---

## Rate Limiting

Currently, there are no explicit rate limits implemented. However, Cloudflare Workers may apply platform-level limits:
- Free tier: 100,000 requests/day
- Paid tier: 10+ million requests/month

---

## CORS Configuration

The API is configured to allow cross-origin requests:
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Credentials**: Enabled
- **Origins**: All origins allowed (consider restricting in production)

---

## Data Models

### User Object
```typescript
{
  id: string;              // UUID
  email: string;           // Email address
  name: string | null;     // Display name
  picture: string | null;  // Profile picture URL
  created_at: string;      // ISO 8601 timestamp
  updated_at: string;      // ISO 8601 timestamp
}
```

### Website Object
```typescript
{
  id: string;         // UUID
  user_id: string;    // User UUID (owner)
  domain: string;     // Domain name
  created_at: string; // ISO 8601 timestamp
  updated_at: string; // ISO 8601 timestamp
}
```

### JWT Payload
```typescript
{
  userId: string;  // User UUID
  email: string;   // User email
}
```

---

## SDKs and Client Libraries

Currently, there are no official SDKs. The API can be consumed using any HTTP client:

### JavaScript/TypeScript Example
```typescript
const API_BASE = 'https://reply-platform-api.red-frog-895a.workers.dev';

// Login with Google
async function loginWithGoogle(code: string) {
  const response = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  const data = await response.json();
  return data.token;
}

// Get user's websites
async function getWebsites(token: string) {
  const response = await fetch(`${API_BASE}/websites`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}

// Add a website
async function addWebsite(token: string, domain: string) {
  const response = await fetch(`${API_BASE}/websites`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ domain })
  });
  return await response.json();
}
```

### Python Example
```python
import requests

API_BASE = 'https://reply-platform-api.red-frog-895a.workers.dev'

# Login with Google
def login_with_google(code):
    response = requests.post(
        f'{API_BASE}/auth/google',
        json={'code': code}
    )
    return response.json()['token']

# Get user's websites
def get_websites(token):
    response = requests.get(
        f'{API_BASE}/websites',
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()

# Add a website
def add_website(token, domain):
    response = requests.post(
        f'{API_BASE}/websites',
        headers={'Authorization': f'Bearer {token}'},
        json={'domain': domain}
    )
    return response.json()
```

---

## Versioning

Currently, the API is unversioned. All endpoints are at the root level. Future versions may introduce versioning (e.g., `/v1/...`).

---

## Changelog

### Current Version (1.0.0)
- Initial release
- Google OAuth authentication
- Website management (CRUD operations)
- JWT token-based sessions
