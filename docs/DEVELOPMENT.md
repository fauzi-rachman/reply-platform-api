# Development Guide

## Prerequisites

Before you begin development, ensure you have the following installed:

- **Node.js**: Version 18 or higher
- **npm**: Comes with Node.js
- **Git**: For version control
- **Cloudflare Account**: Free account at [cloudflare.com](https://cloudflare.com)
- **Google Cloud Console**: For OAuth credentials

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/fauzi-rachman/reply-platform-api.git
cd reply-platform-api
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- `hono`: Web framework
- `wrangler`: Cloudflare Workers CLI
- `typescript`: TypeScript compiler
- `vitest`: Testing framework
- `@cloudflare/workers-types`: TypeScript type definitions

### 3. Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: Add your frontend callback URL
5. Copy the Client ID and Client Secret

### 4. Set Up Environment Variables

#### For Local Development

1. Copy the example environment file:
```bash
cp .dev.vars.example .dev.vars
```

2. Edit `.dev.vars` with your actual credentials:
```bash
# .dev.vars
GOOGLE_CLIENT_SECRET=your_actual_google_oauth_client_secret
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_recommended

# Optional overrides
# GOOGLE_CLIENT_ID=your_google_client_id
# FRONTEND_URL=http://localhost:3000
```

**Important**: Never commit `.dev.vars` to version control. It's already in `.gitignore`.

#### For Production

Production secrets are managed via Wrangler CLI (see Deployment section).

### 5. Configure wrangler.toml

Edit `wrangler.toml` to update public configuration:

```toml
[vars]
GOOGLE_CLIENT_ID = "your_google_client_id"
FRONTEND_URL = "https://your-frontend-domain.com"
```

### 6. Set Up Database

#### Create D1 Database

```bash
npm run db:create
```

This creates a new D1 database. The output will include a database ID like:
```
Created database reply-platform-db (335926d1-a7ff-4061-bbb1-aa69879aaea8)
```

#### Update wrangler.toml with Database ID

Replace the `database_id` in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "reply-platform-db"
database_id = "YOUR_DATABASE_ID_HERE"
```

#### Initialize Database Schema

For local development:
```bash
npm run db:migrate:local
```

For remote/production database:
```bash
npm run db:migrate
```

This creates the `users` and `websites` tables with appropriate indexes.

## Development Workflow

### Start Development Server

```bash
npm run dev
```

This starts the Wrangler dev server on `http://localhost:8787`. The server features:
- Hot reload on code changes
- Local D1 database instance
- Access to environment variables from `.dev.vars`
- Request logging in the console

### Access the API

Once the dev server is running:
- Health check: `http://localhost:8787/`
- Full API available at `http://localhost:8787/*`

### Making Code Changes

The development server watches for changes in the `src/` directory. When you save a file:
1. Server automatically reloads
2. New code is compiled and deployed
3. No need to restart manually

### Project File Structure

```
src/
├── index.ts       # Main application entry point
│   ├── Hono app initialization
│   ├── CORS middleware configuration
│   ├── Health check route
│   └── Route mounting (auth, websites)
│
├── types.ts       # TypeScript type definitions
│   ├── Env interface (bindings & variables)
│   ├── User, Website models
│   ├── JWT payload interface
│   └── Google OAuth types
│
└── utils.ts       # Utility functions
    ├── JWT: signJWT(), verifyJWT()
    ├── Auth: authMiddleware()
    ├── Crypto: hashPassword(), verifyPassword()
    └── ID: generateId()
```

### Adding New Features

#### Adding a New Endpoint

1. **For new route module**, create a new file (e.g., `src/comments.ts`):

```typescript
import { Hono } from 'hono';
import { Env } from './types';
import { authMiddleware } from './utils';

const comments = new Hono<Env>();

// Protected route example
comments.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  // Your logic here
  return c.json({ comments: [] });
});

export default comments;
```

2. **Mount the route** in `src/index.ts`:

```typescript
import commentRoutes from './comments';
// ...
app.route('/comments', commentRoutes);
```

#### Adding a New Database Table

1. **Add SQL to `schema.sql`**:

```sql
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (website_id) REFERENCES websites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comments_website_id ON comments(website_id);
```

2. **Add TypeScript interface** in `src/types.ts`:

```typescript
export interface Comment {
  id: string;
  website_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
```

3. **Run migration**:

```bash
npm run db:migrate:local  # For local development
npm run db:migrate        # For production
```

#### Adding Middleware

Create middleware functions following Hono's pattern:

```typescript
export async function customMiddleware(c: Context<Env>, next: () => Promise<void>) {
  // Pre-processing
  console.log('Before request');
  
  // Call next middleware/handler
  await next();
  
  // Post-processing
  console.log('After request');
}
```

Apply middleware:
```typescript
// Globally
app.use('*', customMiddleware);

// To specific routes
app.get('/path', customMiddleware, handlerFunction);
```

## Testing

### Run Tests

```bash
npm run test        # Run once
npm run test:watch  # Run in watch mode
```

### Test Structure

Currently, basic testing infrastructure is set up with Vitest. To add tests:

1. Create test files with `.test.ts` or `.spec.ts` extension
2. Place them alongside source files or in a `__tests__` directory
3. Follow this pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { generateId } from './utils';

describe('Utils', () => {
  it('should generate valid UUID', () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
```

### Testing Best Practices

- Test business logic in isolation
- Mock external dependencies (database, Google API)
- Test both success and error cases
- Keep tests simple and focused
- Use descriptive test names

## Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

This verifies all types are correct without emitting any output. Fix any type errors before committing.

**Note**: A `tsconfig.json` may need to be created for proper type checking. Example:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "types": ["@cloudflare/workers-types"],
    "jsx": "react",
    "moduleResolution": "node",
    "noEmit": true,
    "strict": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## Debugging

### Console Logging

Add `console.log()` statements in your code. They appear in the Wrangler dev server output.

```typescript
console.log('User ID:', userId);
console.error('Error occurred:', error);
```

### Inspecting Database

Use the Wrangler CLI to query your local database:

```bash
# Query local database
wrangler d1 execute reply-platform-db --local --command "SELECT * FROM users"

# Query remote database
wrangler d1 execute reply-platform-db --remote --command "SELECT * FROM users"
```

### Live Logging (Production)

Stream live logs from production:

```bash
npm run tail
```

This shows real-time requests and console output from your deployed worker.

### Common Issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for solutions to common development issues.

## Database Management

### Viewing Database Schema

```bash
wrangler d1 execute reply-platform-db --local --command ".schema"
```

### Backing Up Database

```bash
# Export local database
wrangler d1 execute reply-platform-db --local --command "SELECT * FROM users" > users_backup.json
```

### Resetting Database

To start fresh:

```bash
# Drop and recreate tables
wrangler d1 execute reply-platform-db --local --command "DROP TABLE IF EXISTS users; DROP TABLE IF EXISTS websites;"

# Re-run migration
npm run db:migrate:local
```

## Code Style

### TypeScript Conventions

- Use explicit types for function parameters and return values
- Prefer `interface` over `type` for object shapes
- Use `async/await` over Promises with `.then()`
- Use optional chaining (`?.`) for potentially undefined values

### Naming Conventions

- **Files**: kebab-case (e.g., `auth-routes.ts`)
- **Variables/Functions**: camelCase (e.g., `getUserById`)
- **Interfaces/Types**: PascalCase (e.g., `UserProfile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ATTEMPTS`)

### File Organization

- Keep files focused and single-purpose
- Extract reusable logic into `utils.ts` or separate files
- Group related types in `types.ts`
- One route module per feature (auth, websites, etc.)

## Environment Variables Reference

### Public Variables (wrangler.toml)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789.apps.googleusercontent.com` |
| `FRONTEND_URL` | Frontend application URL for CORS | `https://dashboard.example.com` |

### Secret Variables (.dev.vars for local, Wrangler secrets for production)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-abc123...` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your-secret-key-min-32-chars` |

## Git Workflow

### Branch Naming

- Features: `feature/description`
- Bugs: `fix/description`
- Docs: `docs/description`

### Commit Messages

Follow conventional commits:
- `feat: add new endpoint for comments`
- `fix: resolve authentication issue`
- `docs: update API documentation`
- `refactor: simplify JWT validation`
- `test: add tests for user creation`

### Before Committing

1. Run type check: `npm run type-check`
2. Run tests: `npm run test`
3. Review your changes: `git diff`
4. Stage relevant files only: `git add <files>`

## Performance Optimization

### Cold Start Optimization

- Minimize dependencies
- Use lazy loading for large modules
- Keep bundle size small

### Database Optimization

- Use indexes on frequently queried columns
- Batch operations when possible
- Avoid N+1 queries

### Edge Computing Best Practices

- Cache static responses when possible
- Minimize external API calls
- Use Cloudflare Workers KV for session storage (if needed)

## Security Best Practices

### Environment Variables

- Never commit secrets to Git
- Use Wrangler secrets for production
- Rotate secrets regularly

### Authentication

- Always validate JWT tokens
- Check token expiration
- Verify user ownership of resources

### Input Validation

- Validate all user inputs
- Sanitize data before database queries
- Use parameterized queries (D1 handles this)

### CORS Configuration

- Restrict allowed origins in production
- Use specific origins instead of wildcard
- Validate origin against whitelist

## Useful Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run deploy` | Deploy to production |
| `npm run type-check` | Check TypeScript types |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:create` | Create new D1 database |
| `npm run db:migrate` | Run migrations on remote DB |
| `npm run db:migrate:local` | Run migrations on local DB |
| `npm run tail` | Stream production logs |
| `wrangler secret list` | List production secrets |
| `wrangler secret put <NAME>` | Set production secret |

## Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Review [API.md](./API.md) for API endpoint details
- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
