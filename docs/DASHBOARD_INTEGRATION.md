# Dashboard Integration Guide

This guide provides instructions for integrating the Reply Platform API with the dashboard frontend.

## Overview

The API now supports all features required by the reply-platform-dashboard:

- ✅ Google OAuth authentication
- ✅ Email/password authentication
- ✅ OTP (passwordless) authentication
- ✅ Website management
- ✅ Organization/workspace management
- ✅ AI Agent management
- ✅ Usage tracking and metrics

## Quick Start

### 1. Environment Configuration

Set the API base URL in your dashboard `.env`:

```env
NEXT_PUBLIC_API_URL=https://reply-platform-api.workers.dev
```

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### 2. API Client Setup

The dashboard's `src/lib/api.ts` is already configured to work with all endpoints. No changes needed.

### 3. Authentication Flow

#### Google OAuth

```typescript
// 1. Redirect to Google OAuth
const handleGoogleLogin = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.append('client_id', clientId || '');
  googleAuthUrl.searchParams.append('redirect_uri', redirectUri || '');
  googleAuthUrl.searchParams.append('response_type', 'code');
  googleAuthUrl.searchParams.append('scope', 'email profile');
  
  window.location.href = googleAuthUrl.toString();
};

// 2. Handle callback
const code = searchParams.get('code');
const response = await api.auth(code, redirectUri);
auth.setToken(response.token);
```

#### Email/Password

```typescript
const response = await api.login('user@example.com', 'password');
auth.setToken(response.token);
```

#### OTP (Passwordless)

```typescript
// Request OTP
await api.requestOTP('user@example.com');

// Verify OTP
const response = await api.verifyOTP('user@example.com', '123456');
auth.setToken(response.token);
```

## New Features Implementation

### Organizations

#### List Organizations

```typescript
import { api } from '@/lib/api';

const token = auth.getToken();
const response = await fetch(`${API_URL}/organizations`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json();
const organizations = data.organizations;
```

#### Create Organization

```typescript
const response = await fetch(`${API_URL}/organizations`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My Organization',
    url_slug: 'my-org', // Optional
  }),
});
const data = await response.json();
const organization = data.organization;
```

#### Get Organization Members

```typescript
const response = await fetch(`${API_URL}/organizations/${orgId}/members`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json();
const members = data.members;
```

### AI Agents

#### List Agents

```typescript
// All agents
const response = await fetch(`${API_URL}/agents`, {
  headers: { Authorization: `Bearer ${token}` },
});

// Filter by organization
const response = await fetch(
  `${API_URL}/agents?organization_id=${orgId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const data = await response.json();
const agents = data.agents;
```

#### Create Agent

```typescript
const response = await fetch(`${API_URL}/agents`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    organization_id: orgId,
    name: 'My AI Agent',
    description: 'Agent description',
  }),
});
const data = await response.json();
const agent = data.agent;
```

#### Update Agent (e.g., after training)

```typescript
const response = await fetch(`${API_URL}/agents/${agentId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    last_trained: new Date().toISOString(),
  }),
});
```

### Usage Tracking

#### Get Usage Statistics

```typescript
const response = await fetch(
  `${API_URL}/usage/${orgId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const data = await response.json();
// {
//   credits_used: 0,
//   total_credits: 1100,
//   agents_used: 9,
//   total_agents: 10
// }
```

#### Get Usage History

```typescript
const startDate = '2025-10-01';
const endDate = '2025-10-12';

const response = await fetch(
  `${API_URL}/usage/${orgId}/history?start_date=${startDate}&end_date=${endDate}`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const data = await response.json();
const history = data.history;
```

#### Get Usage by Agent

```typescript
const response = await fetch(
  `${API_URL}/usage/${orgId}/by-agent`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const data = await response.json();
const byAgent = data.by_agent;
```

## Dashboard Pages Implementation

### Usage Page (`/dashboard/usage`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function UsagePage() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUsage = async () => {
      const token = auth.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // Get default organization ID (first organization)
        const orgsResponse = await fetch(`${API_URL}/organizations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const orgsData = await orgsResponse.json();
        const orgId = orgsData.organizations[0]?.id;

        if (orgId) {
          const usageResponse = await fetch(`${API_URL}/usage/${orgId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const usageData = await usageResponse.json();
          setUsage(usageData);
        }
      } catch (error) {
        console.error('Failed to load usage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsage();
  }, [router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Usage</h1>
      <p>Credits: {usage?.credits_used} / {usage?.total_credits}</p>
      <p>Agents: {usage?.agents_used} / {usage?.total_agents}</p>
    </div>
  );
}
```

### Agents Page (`/dashboard/agents`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadAgents = async () => {
      const token = auth.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/agents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setAgents(data.agents);
      } catch (error) {
        console.error('Failed to load agents:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, [router]);

  const handleCreateAgent = async (name: string) => {
    const token = auth.getToken();
    if (!token) return;

    // Get default organization
    const orgsResponse = await fetch(`${API_URL}/organizations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orgsData = await orgsResponse.json();
    const orgId = orgsData.organizations[0]?.id;

    if (!orgId) return;

    const response = await fetch(`${API_URL}/agents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organization_id: orgId,
        name,
      }),
    });

    const data = await response.json();
    setAgents([data.agent, ...agents]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Agents</h1>
      {agents.map(agent => (
        <div key={agent.id}>
          <h3>{agent.name}</h3>
          <p>{agent.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Database Migration

Before using the new features, run the database migration:

### Local Development

```bash
npm run db:migrate:local
```

### Production

```bash
npm run db:migrate
```

This will create the following tables:
- `organizations` - Organization/workspace data
- `organization_members` - Organization membership
- `agents` - AI agent configurations
- `otp_codes` - OTP codes for passwordless auth
- `usage_records` - Usage tracking data

## API Client Updates

Update your `src/lib/api.ts` to include the new endpoints:

```typescript
// Add to existing api object

async getOrganizations(token: string): Promise<Organization[]> {
  const response = await fetch(`${API_URL}/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to get organizations');
  const data = await response.json();
  return data.organizations;
},

async getAgents(token: string, organizationId?: string): Promise<Agent[]> {
  let url = `${API_URL}/agents`;
  if (organizationId) url += `?organization_id=${organizationId}`;
  
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to get agents');
  const data = await response.json();
  return data.agents;
},

async getUsage(token: string, organizationId: string): Promise<Usage> {
  const response = await fetch(`${API_URL}/usage/${organizationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to get usage');
  return response.json();
},
```

## Testing

Test the integration locally:

1. Start the API:
   ```bash
   cd reply-platform-api
   npm run dev
   ```

2. Start the dashboard:
   ```bash
   cd reply-platform-dashboard
   npm run dev
   ```

3. Test authentication flows (Google OAuth, email/password, OTP)
4. Test organization creation and management
5. Test agent creation and management
6. Test usage tracking display

## Production Deployment

1. Deploy API to Cloudflare Workers:
   ```bash
   npm run deploy
   ```

2. Run production database migration:
   ```bash
   npm run db:migrate
   ```

3. Update dashboard environment variables with production API URL

4. Deploy dashboard

## Troubleshooting

### CORS Issues

If you encounter CORS errors, verify that the API's CORS configuration allows your dashboard domain.

### Authentication Errors

- Ensure JWT_SECRET is set in Cloudflare Workers secrets
- Verify Google OAuth credentials are configured correctly
- Check that tokens are being stored and sent correctly

### Database Errors

- Run migrations to ensure all tables exist
- Check database binding in wrangler.toml
- Verify database ID is correct

## Support

For issues or questions:
- Check the [API documentation](./API_ENDPOINTS.md)
- Review [troubleshooting guide](./TROUBLESHOOTING.md)
- Open an issue on GitHub
