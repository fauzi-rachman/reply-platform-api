# Architecture

## Overview

Reply Platform API is a serverless API application built on Cloudflare's edge computing platform. It provides authentication and website management services for the Reply Platform, which enables users to add commenting functionality to their websites.

## Technology Stack

### Runtime Environment
- **Cloudflare Workers**: Serverless edge computing platform
- **Node.js**: Compatible runtime (v18+)

### Core Framework & Libraries
- **Hono**: Fast, lightweight web framework for edge computing
- **TypeScript**: Type-safe JavaScript with static typing
- **Cloudflare D1**: SQLite-compatible database at the edge

### Development Tools
- **Wrangler**: Cloudflare Workers CLI tool
- **Vitest**: Modern testing framework
- **TypeScript Compiler**: Type checking

## Project Structure

```
reply-platform-api/
├── src/
│   ├── index.ts          # Application entry point, route mounting
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Utility functions (JWT, auth, hashing)
├── docs/                 # Documentation files
├── schema.sql            # Database schema definition
├── wrangler.toml         # Cloudflare Workers configuration
├── package.json          # Project dependencies and scripts
├── .dev.vars.example     # Example environment variables
└── README.md             # Project overview
```

### Source Code Organization

#### `src/index.ts`
The main application file that:
- Initializes the Hono application
- Configures CORS middleware
- Defines the health check endpoint
- Mounts route modules (auth, websites)

#### `src/types.ts`
Contains all TypeScript interfaces and types:
- `Env`: Environment bindings and variables
- `User`: User database model
- `Website`: Website database model
- `JWTPayload`: JWT token payload structure
- `GoogleUserInfo`: Google OAuth user information
- `GoogleTokenResponse`: Google OAuth token response

#### `src/utils.ts`
Provides utility functions:
- `signJWT()`: Create JWT tokens using HMAC-SHA256
- `verifyJWT()`: Verify and decode JWT tokens
- `authMiddleware()`: Hono middleware for protecting routes
- `generateId()`: Generate UUIDs for database records
- `hashPassword()`: Hash passwords using SHA-256
- `verifyPassword()`: Verify password against hash

## Architecture Patterns

### Serverless Architecture
The application follows a serverless architecture pattern:
- No server management required
- Auto-scaling based on demand
- Pay-per-request pricing model
- Global edge deployment for low latency

### RESTful API Design
The API follows REST principles:
- Resource-based URLs (`/auth`, `/websites`)
- HTTP methods for CRUD operations (GET, POST, DELETE)
- JSON request/response format
- Stateless authentication using JWT

### Middleware Pattern
Hono's middleware pattern is used for cross-cutting concerns:
- CORS handling for all routes
- JWT authentication for protected endpoints
- Request/response transformation

## Data Flow

### Authentication Flow

```
1. Client → POST /auth/google with OAuth code
2. API → Exchange code with Google OAuth API
3. Google → Return access token
4. API → Fetch user info from Google
5. API → Create/update user in D1 database
6. API → Generate JWT token
7. API → Return JWT to client
8. Client → Include JWT in Authorization header for subsequent requests
```

### Protected Resource Access Flow

```
1. Client → Request with Authorization: Bearer <JWT>
2. authMiddleware → Extract and verify JWT
3. authMiddleware → Set userId in request context
4. Route Handler → Access database using userId
5. Route Handler → Return resource data
```

## Database Schema

### Users Table
Stores user account information:
- `id`: UUID primary key
- `email`: Unique email address
- `name`: Display name
- `picture`: Profile picture URL
- `password_hash`: Hashed password (optional, for future use)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

### Websites Table
Stores website registrations per user:
- `id`: UUID primary key
- `user_id`: Foreign key to users table
- `domain`: Unique domain name
- `created_at`: Registration timestamp
- `updated_at`: Last update timestamp

### Indexes
- `idx_websites_user_id`: Fast lookup of websites by user
- `idx_users_email`: Fast user lookup by email

## Security Architecture

### Authentication
- Google OAuth 2.0 for user authentication
- JWT tokens for stateless session management
- Tokens include user ID and email claims

### Authorization
- Bearer token authentication via HTTP headers
- Middleware validates tokens on protected routes
- User context attached to requests after validation

### Data Protection
- Passwords hashed with SHA-256 (if used)
- Secrets stored in Cloudflare Workers secrets (not in code)
- CORS configured to allow only authorized origins

### Environment Variables
- **Public** (in `wrangler.toml`): Non-sensitive configuration
- **Secrets** (via Wrangler CLI): Sensitive credentials
- **Development** (in `.dev.vars`): Local development secrets

## Deployment Architecture

### Development Environment
- Local Wrangler dev server
- Local D1 database instance
- Hot reload for code changes

### Production Environment
- Cloudflare Workers global network
- D1 database replicated across regions
- GitHub Actions for CI/CD
- Automatic deployment on push to main branch

### Edge Computing Benefits
- **Low Latency**: Code runs close to users globally
- **High Availability**: Distributed across Cloudflare's network
- **Auto-scaling**: Handles traffic spikes automatically
- **Cost Effective**: Pay only for actual usage

## API Architecture

### Endpoint Structure
```
/                    # Health check
/auth/*              # Authentication endpoints
  /google            # Google OAuth login
  /me                # Get current user
/websites/*          # Website management
  /                  # List/create websites
  /:id               # Get/delete specific website
```

### Request/Response Format
- Content-Type: `application/json`
- Authorization: `Bearer <JWT>`
- Error responses include descriptive messages
- Success responses include relevant data

## Extensibility

### Adding New Routes
1. Create route handler module
2. Import in `src/index.ts`
3. Mount with `app.route()`

### Adding New Database Tables
1. Add CREATE TABLE statement to `schema.sql`
2. Define TypeScript interface in `src/types.ts`
3. Run migration with `npm run db:migrate`

### Adding New Middleware
1. Create middleware function in `src/utils.ts` or separate file
2. Apply with `app.use()` globally or per-route
3. Follow Hono middleware signature: `(c, next) => Promise<void>`

## Performance Considerations

### Edge Optimization
- Minimal dependencies for fast cold starts
- Efficient routing with Hono framework
- Database queries optimized with indexes

### Caching Strategy
- Cloudflare CDN caches static assets
- Database queries for user data (consider adding caching layer)
- JWT tokens cache user identity (no database lookup per request)

## Monitoring & Observability

### Available Tools
- Wrangler tail: Live log streaming (`npm run tail`)
- Cloudflare Dashboard: Analytics and metrics
- Health check endpoint: Service availability monitoring

### Logging
- Request/response logging via Cloudflare Workers
- Error tracking in Cloudflare Dashboard
- Custom logging can be added to route handlers
