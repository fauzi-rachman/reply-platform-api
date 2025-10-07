# Project Quick Reference

This document provides a quick overview of the Reply Platform API for developers, AI coding agents, and GitHub Copilot.

## What is This Project?

Reply Platform API is a **serverless REST API** built with:
- **Runtime**: Cloudflare Workers (edge computing)
- **Framework**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Language**: TypeScript
- **Authentication**: Google OAuth 2.0 + JWT

**Purpose**: Provides backend services for a website commenting platform, handling user authentication and website management.

## Quick Start (30 seconds)

```bash
# Clone and install
git clone https://github.com/fauzi-rachman/reply-platform-api.git
cd reply-platform-api
npm install

# Configure environment
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your Google OAuth credentials

# Start dev server
npm run dev
# API runs at http://localhost:8787
```

## Project Structure

```
reply-platform-api/
├── src/
│   ├── index.ts      # Main app, route mounting, CORS config
│   ├── types.ts      # TypeScript interfaces (User, Website, Env, etc.)
│   └── utils.ts      # JWT, auth middleware, password hashing
├── docs/             # Comprehensive documentation
├── schema.sql        # Database schema (users, websites tables)
├── wrangler.toml     # Cloudflare Workers configuration
└── README.md         # Project overview
```

## API Endpoints (At a Glance)

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/` | No | Health check |
| POST | `/auth/google` | No | OAuth login → JWT token |
| GET | `/auth/me` | Yes | Get current user |
| GET | `/websites` | Yes | List user's websites |
| POST | `/websites` | Yes | Add website |
| GET | `/websites/:id` | Yes | Get website |
| DELETE | `/websites/:id` | Yes | Delete website |

## Common Tasks

### Add New Endpoint
1. Create route handler function
2. Import in `src/index.ts`
3. Mount with `app.route('/path', handler)`

### Add Database Table
1. Add SQL to `schema.sql`
2. Add TypeScript interface to `src/types.ts`
3. Run migration: `npm run db:migrate:local`

### Deploy to Production
```bash
npm run deploy
```

### Debug Issues
```bash
npm run tail  # View live logs
```

## Environment Variables

| Variable | Type | Where Set | Purpose |
|----------|------|-----------|---------|
| `GOOGLE_CLIENT_ID` | Public | wrangler.toml | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Secret | wrangler CLI | OAuth secret |
| `JWT_SECRET` | Secret | wrangler CLI | Token signing |
| `FRONTEND_URL` | Public | wrangler.toml | CORS config |

## Key Patterns

### Authentication Flow
```
1. User logs in with Google
2. Frontend gets OAuth code
3. POST /auth/google with code
4. API returns JWT token
5. Frontend stores token
6. Include token in Authorization header for API calls
```

### Protected Route Pattern
```typescript
import { authMiddleware } from './utils';

app.get('/protected', authMiddleware, async (c) => {
  const userId = c.get('userId');  // Set by middleware
  // Your logic here
});
```

### Database Query Pattern
```typescript
// D1 uses prepared statements
const result = await c.env.DB.prepare(
  'SELECT * FROM users WHERE id = ?'
).bind(userId).first();
```

## Documentation Map

- **New to project?** → [Development Guide](docs/DEVELOPMENT.md)
- **Need API details?** → [API Reference](docs/API.md)
- **Want to contribute?** → [Contributing Guide](CONTRIBUTING.md)
- **Deploying?** → [Deployment Guide](docs/DEPLOYMENT.md)
- **Having issues?** → [Troubleshooting](docs/TROUBLESHOOTING.md)
- **Understanding architecture?** → [Architecture Guide](docs/ARCHITECTURE.md)
- **Need examples?** → [Code Examples](docs/EXAMPLES.md)

## Testing Your Changes

```bash
# Type check
npm run type-check

# Run tests
npm run test

# Manual testing
npm run dev
curl http://localhost:8787/
```

## Important Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Application entry point |
| `src/types.ts` | All TypeScript types |
| `src/utils.ts` | Shared utility functions |
| `schema.sql` | Database schema definition |
| `wrangler.toml` | Cloudflare configuration |
| `.dev.vars` | Local secrets (gitignored) |

## Common Commands

```bash
npm run dev              # Start dev server
npm run deploy           # Deploy to production
npm run type-check       # Check TypeScript types
npm run test             # Run tests
npm run db:create        # Create D1 database
npm run db:migrate       # Run migrations (remote)
npm run db:migrate:local # Run migrations (local)
npm run tail             # Stream production logs
```

## Quick Tips

### For AI Agents / GitHub Copilot

- **Types are comprehensive**: Check `src/types.ts` for all data models
- **Authentication is required**: Most endpoints need JWT token from `/auth/google`
- **Database is D1**: Use prepared statements, not raw SQL strings
- **Environment is typed**: Use `c.env.VARNAME` for config values
- **Middleware pattern**: Use `authMiddleware` for protected routes
- **UUIDs for IDs**: Use `generateId()` from utils

### Common Mistakes to Avoid

❌ Don't: Commit `.dev.vars` to Git
✅ Do: Use `.dev.vars.example` as template

❌ Don't: Concatenate SQL strings
✅ Do: Use prepared statements with `.bind()`

❌ Don't: Store secrets in `wrangler.toml`
✅ Do: Use `wrangler secret put` for secrets

❌ Don't: Forget authentication middleware
✅ Do: Apply `authMiddleware` to protected routes

## Dependencies

### Production
- `hono`: Web framework

### Development
- `wrangler`: Cloudflare Workers CLI
- `typescript`: Type checking
- `vitest`: Testing framework
- `@cloudflare/workers-types`: TypeScript types

## Technology Stack Rationale

- **Cloudflare Workers**: Global edge computing, low latency, auto-scaling
- **D1 Database**: SQLite at the edge, no separate database server
- **Hono**: Fastest web framework for edge computing
- **TypeScript**: Type safety and better developer experience
- **Google OAuth**: Trusted authentication provider
- **JWT**: Stateless authentication, no session storage needed

## Support & Resources

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/fauzi-rachman/reply-platform-api/issues)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Security**: [SECURITY.md](SECURITY.md)

## License

MIT License - See [LICENSE](LICENSE) file for details

---

**Remember**: This is a quick reference. For detailed information, see the comprehensive documentation in the [`docs/`](docs/) directory.
