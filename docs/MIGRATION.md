# Migration Guide

This guide helps you migrate from the previous API version to the new version with dashboard integration support.

## Overview

The API has been enhanced with new features to support the reply-platform-dashboard:

### New Features
- ✅ Email/password authentication
- ✅ OTP (passwordless) authentication
- ✅ Organizations/workspaces
- ✅ AI Agents management
- ✅ Usage tracking and metrics

### Backwards Compatibility
All existing endpoints remain functional and unchanged:
- ✅ Google OAuth authentication
- ✅ Website management endpoints
- ✅ JWT token format (unchanged)

## Database Migration

### Step 1: Backup Your Database (Production Only)

If you have production data, back it up first:

```bash
# Export production database
npx wrangler d1 export reply-platform-db --remote > backup.sql
```

### Step 2: Run Migration

The new schema includes these tables:
- `organizations` - Organization/workspace data
- `organization_members` - User memberships
- `agents` - AI agent configurations
- `otp_codes` - OTP authentication codes
- `usage_records` - Usage tracking data

**Local Development:**
```bash
npm run db:migrate:local
```

**Production:**
```bash
npm run db:migrate
```

The migration is **additive only** - it won't modify or delete existing data.

### Step 3: Verify Migration

Check that all tables exist:

```bash
# Local
npx wrangler d1 execute reply-platform-db --local --command ".tables"

# Production
npx wrangler d1 execute reply-platform-db --remote --command ".tables"
```

Expected output:
```
agents  organization_members  organizations  otp_codes  usage_records  users  websites
```

## Code Changes

### No Breaking Changes

Your existing code will continue to work without modifications:

```typescript
// ✅ Still works exactly the same
const response = await api.auth(code, redirectUri);
const websites = await api.getWebsites(token);
```

### Optional: Use New Features

To use new features, add new API calls:

```typescript
// Organizations
const organizations = await fetch(`${API_URL}/organizations`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Agents
const agents = await fetch(`${API_URL}/agents`, {
  headers: { Authorization: `Bearer ${token}` }
});

// Usage
const usage = await fetch(`${API_URL}/usage/${orgId}`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Deployment

### Option 1: No Changes Required

If you're not using the new features, you can deploy as-is:

```bash
npm run deploy
```

### Option 2: Full Migration

To enable all features:

1. Run database migration (production):
   ```bash
   npm run db:migrate
   ```

2. Deploy the API:
   ```bash
   npm run deploy
   ```

3. No secrets need to be updated (JWT_SECRET and GOOGLE_CLIENT_SECRET remain the same)

## Testing

### Test Existing Functionality

Ensure your existing integrations still work:

```bash
# Test Google OAuth
curl -X POST https://your-api.workers.dev/auth/google \
  -H "Content-Type: application/json" \
  -d '{"code":"your-code","redirectUri":"your-uri"}'

# Test websites endpoint
curl https://your-api.workers.dev/websites \
  -H "Authorization: Bearer your-token"
```

### Test New Features

Try the new endpoints:

```bash
# Test OTP authentication
curl -X POST https://your-api.workers.dev/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Create organization
curl -X POST https://your-api.workers.dev/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"name":"My Org"}'
```

## Rollback Plan

If you encounter issues, you can rollback:

### Option 1: Restore Previous Deployment

```bash
# List deployments
npx wrangler deployments list

# Rollback to previous version
npx wrangler rollback [deployment-id]
```

### Option 2: Restore Database

If database migration caused issues:

```bash
# Restore from backup
npx wrangler d1 execute reply-platform-db --remote --file=backup.sql
```

## Common Issues

### "Table already exists" Error

This is normal if you run migration twice. The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Missing Columns

If you see "no such column" errors:
1. Verify migration ran successfully
2. Check table structure:
   ```bash
   npx wrangler d1 execute reply-platform-db --remote \
     --command "SELECT sql FROM sqlite_master WHERE type='table'"
   ```

### Data Inconsistency

If you have existing users who need organizations:
1. Organizations are optional - users can use the API without them
2. Users can create organizations via the new endpoints
3. Existing website data is not affected

## Dashboard Integration

If you're integrating with the reply-platform-dashboard:

1. Update dashboard's API URL to point to your deployed API
2. Enable new authentication methods in dashboard settings
3. Test the integration flows
4. See [DASHBOARD_INTEGRATION.md](./DASHBOARD_INTEGRATION.md) for details

## Questions?

- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Review [API Endpoints Documentation](./API_ENDPOINTS.md)
- Open an issue on GitHub

## Summary

✅ **Safe to Deploy**: All existing functionality preserved
✅ **Additive Changes**: No breaking changes to existing APIs
✅ **Backward Compatible**: Old code continues to work
✅ **Easy Rollback**: Can revert if needed
✅ **Well Tested**: All endpoints tested and verified

The migration is designed to be safe and non-disruptive. Your existing integrations will continue to work without modification.
