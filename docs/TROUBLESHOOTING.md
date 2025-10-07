# Troubleshooting Guide

This guide covers common issues you may encounter while developing or deploying the Reply Platform API and their solutions.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Development Server Issues](#development-server-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Deployment Issues](#deployment-issues)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)

## Installation Issues

### npm install fails

**Symptom**: Error during `npm install`

**Possible Causes & Solutions**:

1. **Node.js version too old**
   ```bash
   # Check Node version
   node --version
   # Should be 18 or higher
   
   # Solution: Install Node 18+
   # Using nvm:
   nvm install 18
   nvm use 18
   ```

2. **Network issues**
   ```bash
   # Try with different registry
   npm install --registry=https://registry.npmjs.org/
   
   # Or clear npm cache
   npm cache clean --force
   npm install
   ```

3. **Permission errors (Linux/Mac)**
   ```bash
   # Don't use sudo! Fix npm permissions instead
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   # Add to ~/.profile or ~/.bashrc:
   export PATH=~/.npm-global/bin:$PATH
   source ~/.profile
   ```

### Package conflicts

**Symptom**: `npm ERR! ERESOLVE unable to resolve dependency tree`

**Solution**:
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Or use --legacy-peer-deps
npm install --legacy-peer-deps
```

## Development Server Issues

### wrangler dev fails to start

**Symptom**: Server crashes immediately on `npm run dev`

**Possible Causes & Solutions**:

1. **Missing .dev.vars file**
   ```bash
   # Error: Missing environment variables
   
   # Solution: Create .dev.vars from example
   cp .dev.vars.example .dev.vars
   # Edit with your actual values
   ```

2. **Port already in use**
   ```bash
   # Error: Address already in use
   
   # Solution: Find and kill process on port 8787
   lsof -ti:8787 | xargs kill -9
   
   # Or specify different port
   npx wrangler dev --port 8788
   ```

3. **TypeScript compilation errors**
   ```bash
   # Run type check to see errors
   npm run type-check
   
   # Fix type errors before running dev server
   ```

### Hot reload not working

**Symptom**: Changes to code don't reflect in dev server

**Solutions**:
1. Restart the dev server: Ctrl+C and `npm run dev`
2. Check if file is being watched (should be in `src/` directory)
3. Clear Wrangler cache:
   ```bash
   rm -rf .wrangler
   npm run dev
   ```

### CORS errors in browser console

**Symptom**: `Access-Control-Allow-Origin` errors

**Solutions**:

1. **Check CORS configuration** in `src/index.ts`:
   ```typescript
   app.use('*', cors({
     origin: (origin) => origin, // Allows all origins
     allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowHeaders: ['Content-Type', 'Authorization'],
     credentials: true,
   }));
   ```

2. **Update FRONTEND_URL** in `.dev.vars`:
   ```bash
   FRONTEND_URL=http://localhost:3000
   ```

3. **Make sure preflight requests work**: Browser sends OPTIONS request first

## Database Issues

### Database not created

**Symptom**: `Error: Database binding not found`

**Solution**:
```bash
# Create database
npm run db:create

# Copy the database_id from output
# Update wrangler.toml with the database_id

# Verify database exists
npx wrangler d1 list
```

### Migration fails

**Symptom**: Error when running `npm run db:migrate:local`

**Possible Causes & Solutions**:

1. **Database doesn't exist**
   ```bash
   # Create it first
   npm run db:create
   ```

2. **Database ID mismatch**
   ```bash
   # Verify ID in wrangler.toml matches actual database
   npx wrangler d1 list
   
   # Update wrangler.toml with correct database_id
   ```

3. **SQL syntax error**
   ```bash
   # Check schema.sql for syntax errors
   # Test SQL locally first:
   sqlite3 test.db < schema.sql
   ```

### Can't query database

**Symptom**: `Cannot read from database` or `DB is not defined`

**Solutions**:

1. **Verify binding name** in `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"  # Must match usage in code: c.env.DB
   ```

2. **Check database is initialized**:
   ```bash
   # Query to verify tables exist
   npx wrangler d1 execute reply-platform-db --local --command ".tables"
   
   # Should show: users  websites
   ```

3. **Ensure using correct environment**:
   ```typescript
   // In route handlers
   const db = c.env.DB; // Not c.env.db
   ```

### Data not persisting in local database

**Symptom**: Data disappears after restarting dev server

**Note**: This is expected behavior. Local D1 database is ephemeral in development.

**Solutions**:
- Use remote database for persistence: `npm run db:migrate`
- Re-run migrations after each dev server restart
- Or seed database with test data on startup

### Database locked error

**Symptom**: `database is locked` error

**Solution**:
```bash
# Stop all Wrangler processes
pkill -f wrangler

# Restart dev server
npm run dev
```

## Authentication Issues

### Google OAuth fails

**Symptom**: Error during `/auth/google` request

**Possible Causes & Solutions**:

1. **Invalid OAuth code**
   - OAuth codes expire quickly (usually 10 minutes)
   - Use code immediately after receiving it
   - Don't reuse codes (they're single-use)

2. **Incorrect Google OAuth configuration**
   ```bash
   # Verify environment variables
   # In .dev.vars:
   GOOGLE_CLIENT_SECRET=your_actual_secret
   
   # In wrangler.toml:
   GOOGLE_CLIENT_ID = "your_actual_client_id"
   ```

3. **Redirect URI mismatch**
   - Check Google Cloud Console
   - Authorized redirect URIs must exactly match your frontend callback URL
   - Include protocol (http:// or https://)

4. **API not enabled**
   - Go to Google Cloud Console
   - Enable Google+ API or Google People API
   - Wait a few minutes for activation

### JWT token invalid

**Symptom**: `401 Unauthorized` or `Invalid token` error

**Solutions**:

1. **Token expired**
   - Current implementation doesn't set expiration
   - If expiration is added, request new token via `/auth/google`

2. **JWT_SECRET changed**
   - Tokens signed with old secret won't validate
   - Users must re-authenticate

3. **Malformed token**
   ```bash
   # Check Authorization header format:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Not:
   Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Missing "Bearer "
   ```

4. **Token verification fails**
   ```typescript
   // Debug in utils.ts verifyJWT function
   console.log('Token:', token);
   console.log('Secret:', secret);
   ```

### CORS blocks authentication request

**Symptom**: Browser blocks request with CORS error

**Solution**:
```typescript
// Ensure CORS allows credentials
app.use('*', cors({
  origin: (origin) => origin,
  credentials: true,  // Important for cookies/auth headers
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

## Deployment Issues

### wrangler login fails

**Symptom**: Browser doesn't open or authentication fails

**Solutions**:
```bash
# Try manual authentication
npx wrangler login

# Or use API token
export CLOUDFLARE_API_TOKEN=your_token
npx wrangler deploy
```

### Deployment fails with "Script not found"

**Symptom**: `Error: Script not found: src/index.ts`

**Solutions**:

1. **Verify file exists**:
   ```bash
   ls -la src/index.ts
   ```

2. **Check wrangler.toml**:
   ```toml
   main = "src/index.ts"  # Must match actual file location
   ```

### Secrets not set

**Symptom**: `Error: Missing secret: GOOGLE_CLIENT_SECRET`

**Solution**:
```bash
# Set the secret
npx wrangler secret put GOOGLE_CLIENT_SECRET
# Enter value when prompted

# Verify secrets are set
npx wrangler secret list
```

### Database migrations fail in production

**Symptom**: `Error executing migration`

**Solutions**:

1. **Verify database exists remotely**:
   ```bash
   npx wrangler d1 list
   ```

2. **Check database_id in wrangler.toml**:
   ```toml
   database_id = "correct-id-from-wrangler-d1-list"
   ```

3. **Test migration locally first**:
   ```bash
   npm run db:migrate:local
   # If it works locally, try remote
   npm run db:migrate
   ```

### GitHub Actions deployment fails

**Symptom**: Deployment fails in GitHub Actions

**Possible Causes & Solutions**:

1. **Missing secrets**
   - Go to GitHub repo Settings > Secrets
   - Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`

2. **Insufficient permissions**
   - Cloudflare API token needs Workers edit permissions
   - Regenerate token with correct permissions

3. **Wrong account ID**
   - Verify account ID in Cloudflare Dashboard
   - Update GitHub secret

## Runtime Errors

### 500 Internal Server Error

**Symptom**: API returns 500 error

**Debug Steps**:

1. **Check logs**:
   ```bash
   npm run tail
   ```

2. **Look for stack traces** in Cloudflare Dashboard

3. **Add debug logging**:
   ```typescript
   try {
     // Your code
   } catch (error) {
     console.error('Error details:', error);
     return c.json({ error: 'Internal error' }, 500);
   }
   ```

4. **Check for missing environment variables**:
   ```typescript
   if (!c.env.DB) {
     console.error('Database binding missing');
   }
   ```

### Unhandled Promise Rejection

**Symptom**: Warnings about unhandled promises

**Solution**:
```typescript
// Always use try-catch with async code
try {
  const result = await someAsyncFunction();
} catch (error) {
  console.error('Error:', error);
  return c.json({ error: 'Operation failed' }, 500);
}
```

### Database query returns undefined

**Symptom**: Query executes but returns undefined

**Solutions**:

1. **Check query syntax**:
   ```typescript
   // Wrong:
   const result = await db.query('SELECT * FROM users WHERE id = ?', userId);
   
   // Correct (D1 syntax):
   const result = await db.prepare('SELECT * FROM users WHERE id = ?')
     .bind(userId)
     .first();
   ```

2. **Verify table exists**:
   ```bash
   npx wrangler d1 execute reply-platform-db --local --command ".tables"
   ```

3. **Check for SQL errors**:
   ```typescript
   const result = await db.prepare('SELECT * FROM users WHERE id = ?')
     .bind(userId)
     .first();
   
   console.log('Query result:', result); // Debug output
   ```

## Performance Issues

### Slow API responses

**Symptom**: Requests take several seconds

**Possible Causes & Solutions**:

1. **Cold start**
   - First request after inactivity is slower
   - Subsequent requests are faster
   - Consider keeping worker warm with scheduled cron

2. **Inefficient database queries**
   ```typescript
   // Bad: N+1 query
   for (const website of websites) {
     const user = await db.prepare('SELECT * FROM users WHERE id = ?')
       .bind(website.user_id)
       .first();
   }
   
   // Good: Join query
   const results = await db.prepare(`
     SELECT w.*, u.name as user_name 
     FROM websites w 
     JOIN users u ON w.user_id = u.id
   `).all();
   ```

3. **Missing indexes**:
   - Check `schema.sql` for indexes
   - Add indexes on frequently queried columns

4. **Large bundle size**:
   ```bash
   # Check bundle size
   npx wrangler deploy --dry-run --outdir=./dist
   ls -lh ./dist
   
   # Reduce dependencies if too large
   ```

### High memory usage

**Symptom**: Worker crashes or performance degrades

**Solutions**:

1. **Avoid loading large data into memory**:
   ```typescript
   // Bad: Load all records
   const all = await db.prepare('SELECT * FROM users').all();
   
   // Good: Paginate
   const page = await db.prepare('SELECT * FROM users LIMIT 100 OFFSET ?')
     .bind(offset)
     .all();
   ```

2. **Stream large responses** instead of buffering

3. **Clean up resources**:
   - Don't store data in global scope unnecessarily
   - Let variables go out of scope when done

### Rate limiting

**Symptom**: Requests rejected or throttled

**Solutions**:

1. **Check Cloudflare Workers limits**:
   - Free tier: 100,000 requests/day
   - Monitor usage in dashboard

2. **Implement application-level rate limiting**:
   ```typescript
   // Use Workers KV to track request counts
   const count = await c.env.RATE_LIMIT.get(userId);
   if (count > 100) {
     return c.json({ error: 'Rate limit exceeded' }, 429);
   }
   ```

## Getting Help

### Enable Verbose Logging

```bash
# Local development
export WRANGLER_LOG=debug
npm run dev

# Or in code
console.log('Debug info:', { userId, timestamp: Date.now() });
```

### Collect Debug Information

When reporting issues, include:

1. **Error message** (full text)
2. **Stack trace** (if available)
3. **Steps to reproduce**
4. **Environment**:
   ```bash
   node --version
   npm --version
   npx wrangler --version
   ```
5. **Relevant code snippets**
6. **Log output**

### Community Support

- **GitHub Issues**: [github.com/fauzi-rachman/reply-platform-api/issues](https://github.com/fauzi-rachman/reply-platform-api/issues)
- **Cloudflare Workers Discord**: [discord.gg/cloudflaredev](https://discord.gg/cloudflaredev)
- **Hono Discord**: [discord.gg/hono](https://discord.gg/hono)

### Official Documentation

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Hono Framework Docs](https://hono.dev/)

## Quick Reference

### Common Commands

```bash
# Reset everything and start fresh
rm -rf node_modules package-lock.json .wrangler
npm install
npm run dev

# Check database
npx wrangler d1 list
npx wrangler d1 execute reply-platform-db --local --command ".tables"

# Check secrets
npx wrangler secret list

# View logs
npm run tail

# Test deployment
npx wrangler deploy --dry-run
```

### Environment Check

```bash
# Verify all prerequisites
node --version        # Should be 18+
npm --version         # Should be 9+
npx wrangler --version # Should be 4+

# Check configuration
cat wrangler.toml     # Verify database_id
cat .dev.vars         # Verify secrets (local)
npx wrangler secret list  # Verify secrets (remote)
```
