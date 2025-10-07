# Deployment Guide

## Overview

Reply Platform API can be deployed to Cloudflare Workers either manually using Wrangler CLI or automatically via GitHub Actions CI/CD.

## Prerequisites

Before deploying, ensure you have:

- **Cloudflare Account**: Free or paid account at [cloudflare.com](https://cloudflare.com)
- **Wrangler CLI**: Installed via `npm install` (included in devDependencies)
- **Database Created**: D1 database created and configured
- **Secrets Configured**: Google OAuth and JWT secrets set

## Manual Deployment

### Step 1: Authenticate with Cloudflare

```bash
npx wrangler login
```

This opens a browser window for authentication. Grant permissions to Wrangler.

### Step 2: Create Production Database

If you haven't already created a D1 database:

```bash
npm run db:create
```

Output example:
```
Created database reply-platform-db (335926d1-a7ff-4061-bbb1-aa69879aaea8)
```

### Step 3: Update wrangler.toml

Update the `database_id` in `wrangler.toml` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "reply-platform-db"
database_id = "335926d1-a7ff-4061-bbb1-aa69879aaea8"  # Your database ID
```

### Step 4: Run Database Migrations

Initialize the database schema in production:

```bash
npm run db:migrate
```

This creates the `users` and `websites` tables with indexes.

### Step 5: Set Production Secrets

Configure sensitive environment variables:

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET
# Enter your Google OAuth client secret when prompted

npx wrangler secret put JWT_SECRET
# Enter your JWT secret key (minimum 32 characters recommended)
```

**Important**: Secrets are encrypted and stored securely by Cloudflare. They are not visible in your code or wrangler.toml.

### Step 6: Configure Public Variables

Update `wrangler.toml` with your production values:

```toml
[vars]
GOOGLE_CLIENT_ID = "your_production_google_client_id"
FRONTEND_URL = "https://your-production-frontend.com"
```

### Step 7: Deploy

```bash
npm run deploy
```

This command:
1. Builds your TypeScript code
2. Bundles dependencies
3. Uploads to Cloudflare Workers
4. Makes it available globally on Cloudflare's edge network

### Step 8: Verify Deployment

After deployment, Wrangler outputs the worker URL:
```
Published reply-platform-api (1.23 sec)
  https://reply-platform-api.your-subdomain.workers.dev
```

Test the health check:
```bash
curl https://reply-platform-api.your-subdomain.workers.dev/
```

Expected response:
```json
{"message": "Reply.sh API is running"}
```

## Automated Deployment with GitHub Actions

### Benefits

- Automatic deployment on push to main branch
- No manual steps required
- Consistent deployment process
- Deployment history in GitHub

### Setup Instructions

#### Step 1: Get Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. Set permissions:
   - Account > Workers Scripts > Edit
   - Account > Workers KV Storage > Edit (if using KV)
   - Account > D1 > Edit
5. Set Account Resources: Include your account
6. Create token and copy it (you won't see it again)

#### Step 2: Get Cloudflare Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select Workers & Pages
3. Copy your Account ID from the right sidebar

#### Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token from Step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID from Step 2 |

#### Step 4: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

#### Step 5: Configure Secrets in Cloudflare

Before the first automated deployment, you must set secrets manually once:

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put JWT_SECRET
```

Secrets persist across deployments and don't need to be reset.

#### Step 6: Push to Main Branch

```bash
git add .
git commit -m "Set up automated deployment"
git push origin main
```

GitHub Actions will automatically:
1. Detect the push to main
2. Install dependencies
3. Deploy to Cloudflare Workers
4. Report success/failure in the Actions tab

### Monitoring Deployments

View deployment status:
1. Go to your GitHub repository
2. Click "Actions" tab
3. Select the latest workflow run
4. View logs and deployment details

## Custom Domain Setup

### Step 1: Add Route in Cloudflare

1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your worker
3. Click "Triggers" tab
4. Under "Routes", click "Add route"
5. Enter your route pattern: `api.yourdomain.com/*`
6. Select your zone (yourdomain.com)
7. Save

### Step 2: Add DNS Record

1. Go to Cloudflare Dashboard > DNS
2. Add a CNAME record:
   - Type: CNAME
   - Name: api
   - Target: your-worker.workers.dev
   - Proxy status: Proxied (orange cloud)
3. Save

### Step 3: Update CORS Configuration

Update the FRONTEND_URL in `wrangler.toml` to match your custom domain if needed.

## Environment-Specific Deployments

### Development Environment

Deploy to a development worker:

```bash
npx wrangler deploy --env development
```

Add to `wrangler.toml`:

```toml
[env.development]
name = "reply-platform-api-dev"
vars = { FRONTEND_URL = "http://localhost:3000" }

[[env.development.d1_databases]]
binding = "DB"
database_name = "reply-platform-db-dev"
database_id = "your-dev-database-id"
```

### Staging Environment

```toml
[env.staging]
name = "reply-platform-api-staging"
vars = { FRONTEND_URL = "https://staging.example.com" }

[[env.staging.d1_databases]]
binding = "DB"
database_name = "reply-platform-db-staging"
database_id = "your-staging-database-id"
```

Deploy to staging:
```bash
npx wrangler deploy --env staging
```

## Rollback Procedure

### Rollback to Previous Version

Cloudflare Workers keeps previous deployments. To rollback:

1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your worker
3. Click "Deployments" tab
4. Find the previous working version
5. Click "Rollback to this deployment"

### Via CLI

List recent deployments:
```bash
npx wrangler deployments list
```

Rollback to specific version:
```bash
npx wrangler rollback [deployment-id]
```

## Database Migrations

### Running Migrations in Production

Always test migrations locally first:

```bash
# Test locally
npm run db:migrate:local

# Verify changes
wrangler d1 execute reply-platform-db --local --command "SELECT * FROM sqlite_master WHERE type='table'"

# Deploy to production
npm run db:migrate
```

### Migration Best Practices

1. **Test locally first**: Always run migrations on local database
2. **Backup data**: Export important data before migrations
3. **Incremental changes**: Make small, reversible changes
4. **Avoid breaking changes**: Add new columns as nullable
5. **Version control**: Keep all migrations in `schema.sql` or separate files

### Backup and Restore

Export production data:
```bash
# Export users
wrangler d1 execute reply-platform-db --remote --command "SELECT * FROM users" --json > users_backup.json

# Export websites
wrangler d1 execute reply-platform-db --remote --command "SELECT * FROM websites" --json > websites_backup.json
```

## Monitoring and Observability

### Live Logs

Stream real-time logs from production:

```bash
npm run tail
```

Filter logs:
```bash
npx wrangler tail --status=error  # Only errors
npx wrangler tail --method=POST   # Only POST requests
npx wrangler tail --search="auth" # Search for keyword
```

### Analytics Dashboard

View metrics in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. View:
   - Requests per second
   - Error rate
   - CPU time
   - Duration percentiles

### Setting Up Alerts

Configure alerts in Cloudflare:
1. Go to Notifications
2. Create new notification
3. Select trigger (e.g., error rate threshold)
4. Choose delivery method (email, webhook, PagerDuty)

## Performance Optimization

### Bundle Size Optimization

Check bundle size:
```bash
npx wrangler deploy --dry-run --outdir=./dist
ls -lh ./dist
```

Reduce bundle size:
- Minimize dependencies
- Use tree-shaking
- Avoid large libraries
- Use dynamic imports for optional features

### Edge Caching

Add caching headers to responses:

```typescript
return c.json(data, 200, {
  'Cache-Control': 'public, max-age=300'
});
```

### Cold Start Optimization

- Keep initialization code minimal
- Lazy load large dependencies
- Use global variables for reusable connections

## Security Hardening

### Rotate Secrets

Regularly rotate sensitive credentials:

```bash
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put JWT_SECRET
```

### CORS Configuration

In production, restrict CORS to specific origins:

```typescript
app.use('*', cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

### Rate Limiting

Consider implementing rate limiting for production:

```typescript
// Example using Cloudflare Workers KV for rate limiting
const RATE_LIMIT = 100; // requests per minute
```

## Cost Management

### Free Tier Limits

Cloudflare Workers Free Tier:
- 100,000 requests/day
- 10ms CPU time per request
- No egress fees

### Paid Plans

Workers Paid ($5/month):
- 10 million requests/month included
- $0.50 per additional million requests
- 50ms CPU time per request

### D1 Database Pricing

Currently in beta, D1 is free. Future pricing TBD.

### Monitoring Costs

Track usage in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. View "Usage" tab
4. Monitor requests and CPU time

## Troubleshooting Deployments

### Common Issues

**Issue**: `Authentication error`
```bash
# Solution: Re-authenticate
npx wrangler login
```

**Issue**: `Database not found`
```bash
# Solution: Verify database_id in wrangler.toml
wrangler d1 list
```

**Issue**: `Secret not set`
```bash
# Solution: Set the missing secret
npx wrangler secret put SECRET_NAME
```

**Issue**: `Build failed`
```bash
# Solution: Check TypeScript errors
npm run type-check
```

### Deployment Checklist

Before deploying to production:

- [ ] Database created and configured
- [ ] Secrets set (GOOGLE_CLIENT_SECRET, JWT_SECRET)
- [ ] Public variables updated (GOOGLE_CLIENT_ID, FRONTEND_URL)
- [ ] Database migrations run
- [ ] Local testing completed
- [ ] Type checking passed
- [ ] Tests passed (if applicable)
- [ ] CORS configuration reviewed
- [ ] Custom domain configured (if needed)

## Post-Deployment

### Verify Deployment

Test all critical endpoints:

```bash
# Health check
curl https://your-worker.workers.dev/

# Test authentication (with valid OAuth code)
curl -X POST https://your-worker.workers.dev/auth/google \
  -H "Content-Type: application/json" \
  -d '{"code": "valid_oauth_code"}'

# Test authenticated endpoint (with valid token)
curl https://your-worker.workers.dev/auth/me \
  -H "Authorization: Bearer your_jwt_token"
```

### Update Documentation

- Update README.md with production URL
- Document any configuration changes
- Update API documentation if endpoints changed

### Monitor Initial Traffic

- Watch logs with `npm run tail`
- Check for errors in Cloudflare Dashboard
- Monitor response times and success rates

## Continuous Improvement

### Regular Maintenance

- Update dependencies monthly: `npm update`
- Review and rotate secrets quarterly
- Monitor performance metrics weekly
- Review error logs daily

### Performance Reviews

- Analyze slow endpoints
- Optimize database queries
- Review bundle size
- Check cold start times

### Security Audits

- Review CORS configuration
- Check for exposed secrets
- Update dependencies for security patches
- Review authentication flow

## Support and Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Hono Framework Docs](https://hono.dev/)
