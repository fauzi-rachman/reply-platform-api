# Examples and Use Cases

This document provides practical examples and common use cases for the Reply Platform API.

## Table of Contents

- [Authentication Examples](#authentication-examples)
- [Website Management Examples](#website-management-examples)
- [Complete Integration Example](#complete-integration-example)
- [Error Handling Examples](#error-handling-examples)
- [Common Use Cases](#common-use-cases)

## Authentication Examples

### Google OAuth Integration (Frontend)

#### Step 1: Redirect User to Google OAuth

```javascript
// Configuration
const GOOGLE_CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
const REDIRECT_URI = 'https://your-app.com/auth/callback';

// Generate Google OAuth URL
function getGoogleAuthURL() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'online',
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Redirect user to Google login
function loginWithGoogle() {
  window.location.href = getGoogleAuthURL();
}
```

#### Step 2: Handle OAuth Callback

```javascript
// In your callback page (e.g., /auth/callback)
async function handleOAuthCallback() {
  // Get authorization code from URL
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (!code) {
    console.error('No authorization code received');
    return;
  }
  
  try {
    // Exchange code for JWT token
    const response = await fetch('https://reply-platform-api.workers.dev/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      throw new Error('Authentication failed');
    }
    
    const data = await response.json();
    
    // Store token and user info
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Authentication error:', error);
    alert('Login failed. Please try again.');
  }
}

// Call on page load
handleOAuthCallback();
```

### Get Current User Information

```javascript
async function getCurrentUser() {
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    console.error('No token found');
    return null;
  }
  
  try {
    const response = await fetch('https://reply-platform-api.workers.dev/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    // Token might be invalid, clear it
    localStorage.removeItem('jwt_token');
    return null;
  }
}

// Usage
const user = await getCurrentUser();
if (user) {
  console.log(`Welcome, ${user.name}!`);
} else {
  // Redirect to login
  window.location.href = '/login';
}
```

### Authentication Helper Class

```typescript
class AuthService {
  private readonly API_BASE = 'https://reply-platform-api.workers.dev';
  private readonly TOKEN_KEY = 'jwt_token';
  private readonly USER_KEY = 'user';
  
  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
  
  // Get stored token
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  // Get stored user
  getUser(): any {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }
  
  // Login with Google
  async loginWithGoogle(code: string) {
    const response = await fetch(`${this.API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      throw new Error('Authentication failed');
    }
    
    const data = await response.json();
    
    localStorage.setItem(this.TOKEN_KEY, data.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
    
    return data;
  }
  
  // Logout
  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
  
  // Make authenticated request
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${this.API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.status === 401) {
      // Token invalid, logout
      this.logout();
      throw new Error('Session expired');
    }
    
    return response;
  }
}

// Usage
const auth = new AuthService();

if (auth.isAuthenticated()) {
  const user = auth.getUser();
  console.log(`Logged in as ${user.email}`);
}
```

## Website Management Examples

### List All Websites

```javascript
async function getWebsites() {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('https://reply-platform-api.workers.dev/websites', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch websites');
  }
  
  const websites = await response.json();
  return websites;
}

// Usage
const websites = await getWebsites();
websites.forEach(site => {
  console.log(`${site.domain} - Created: ${new Date(site.created_at).toLocaleDateString()}`);
});
```

### Add a New Website

```javascript
async function addWebsite(domain) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch('https://reply-platform-api.workers.dev/websites', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add website');
  }
  
  const website = await response.json();
  return website;
}

// Usage
try {
  const newSite = await addWebsite('example.com');
  console.log(`Website added: ${newSite.id}`);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Get Specific Website

```javascript
async function getWebsite(websiteId) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(
    `https://reply-platform-api.workers.dev/websites/${websiteId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Website not found');
  }
  
  return await response.json();
}

// Usage
const website = await getWebsite('660e8400-e29b-41d4-a716-446655440001');
console.log(website);
```

### Delete Website

```javascript
async function deleteWebsite(websiteId) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(
    `https://reply-platform-api.workers.dev/websites/${websiteId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to delete website');
  }
  
  return await response.json();
}

// Usage with confirmation
async function confirmDeleteWebsite(websiteId, domain) {
  if (confirm(`Are you sure you want to delete ${domain}?`)) {
    try {
      await deleteWebsite(websiteId);
      alert('Website deleted successfully');
      // Refresh website list
      loadWebsites();
    } catch (error) {
      alert('Failed to delete website');
    }
  }
}
```

## Complete Integration Example

### React Component Example

```tsx
import React, { useState, useEffect } from 'react';

const API_BASE = 'https://reply-platform-api.workers.dev';

function WebsiteManager() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  
  // Load websites on mount
  useEffect(() => {
    loadWebsites();
  }, []);
  
  async function loadWebsites() {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch(`${API_BASE}/websites`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to load websites');
      
      const data = await response.json();
      setWebsites(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleAddWebsite(e) {
    e.preventDefault();
    
    if (!newDomain) return;
    
    try {
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch(`${API_BASE}/websites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain: newDomain }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      setNewDomain('');
      loadWebsites(); // Reload list
    } catch (err) {
      alert(`Failed to add website: ${err.message}`);
    }
  }
  
  async function handleDeleteWebsite(id, domain) {
    if (!confirm(`Delete ${domain}?`)) return;
    
    try {
      const token = localStorage.getItem('jwt_token');
      
      const response = await fetch(`${API_BASE}/websites/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      
      loadWebsites(); // Reload list
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  }
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h2>My Websites</h2>
      
      <form onSubmit={handleAddWebsite}>
        <input
          type="text"
          placeholder="example.com"
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
        />
        <button type="submit">Add Website</button>
      </form>
      
      <ul>
        {websites.map(site => (
          <li key={site.id}>
            {site.domain}
            <button onClick={() => handleDeleteWebsite(site.id, site.domain)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      
      {websites.length === 0 && <p>No websites yet. Add one above!</p>}
    </div>
  );
}

export default WebsiteManager;
```

### Vue.js Component Example

```vue
<template>
  <div>
    <h2>My Websites</h2>
    
    <form @submit.prevent="addWebsite">
      <input v-model="newDomain" placeholder="example.com" />
      <button type="submit">Add Website</button>
    </form>
    
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <ul v-else>
      <li v-for="site in websites" :key="site.id">
        {{ site.domain }}
        <button @click="deleteWebsite(site.id, site.domain)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script>
const API_BASE = 'https://reply-platform-api.workers.dev';

export default {
  data() {
    return {
      websites: [],
      loading: false,
      error: null,
      newDomain: '',
    };
  },
  
  mounted() {
    this.loadWebsites();
  },
  
  methods: {
    async loadWebsites() {
      this.loading = true;
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE}/websites`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error('Failed to load');
        
        this.websites = await response.json();
        this.error = null;
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    
    async addWebsite() {
      if (!this.newDomain) return;
      
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE}/websites`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ domain: this.newDomain }),
        });
        
        if (!response.ok) throw new Error('Failed to add');
        
        this.newDomain = '';
        this.loadWebsites();
      } catch (err) {
        alert(err.message);
      }
    },
    
    async deleteWebsite(id, domain) {
      if (!confirm(`Delete ${domain}?`)) return;
      
      try {
        const token = localStorage.getItem('jwt_token');
        const response = await fetch(`${API_BASE}/websites/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        this.loadWebsites();
      } catch (err) {
        alert(err.message);
      }
    },
  },
};
</script>
```

## Error Handling Examples

### Comprehensive Error Handling

```typescript
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    // Handle different status codes
    if (response.ok) {
      return await response.json();
    }
    
    // Parse error response
    const errorData = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 400:
        throw new APIError('Invalid request', 400, errorData);
      case 401:
        // Clear token and redirect to login
        localStorage.removeItem('jwt_token');
        window.location.href = '/login';
        throw new APIError('Unauthorized', 401, errorData);
      case 403:
        throw new APIError('Forbidden', 403, errorData);
      case 404:
        throw new APIError('Not found', 404, errorData);
      case 409:
        throw new APIError('Conflict - resource already exists', 409, errorData);
      case 500:
        throw new APIError('Server error', 500, errorData);
      default:
        throw new APIError(`Request failed: ${response.status}`, response.status, errorData);
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network error
    throw new APIError('Network error - please check your connection', 0, error);
  }
}

// Usage with error handling
async function addWebsiteWithErrorHandling(domain: string) {
  try {
    const website = await apiRequest('/websites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    
    return { success: true, website };
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.statusCode) {
        case 409:
          return { success: false, error: 'This domain is already registered' };
        case 400:
          return { success: false, error: 'Invalid domain format' };
        default:
          return { success: false, error: error.message };
      }
    }
    
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

## Common Use Cases

### Use Case 1: Protected Dashboard

```typescript
// Protect routes that require authentication
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('jwt_token');
  
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  
  return children;
}

// Usage
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Use Case 2: Auto-refresh Token (if implemented)

```typescript
// Note: Current API doesn't have token refresh, but here's how it could work
async function refreshTokenIfNeeded() {
  const token = localStorage.getItem('jwt_token');
  if (!token) return false;
  
  // Decode token to check expiration (would need to add expiration to JWT)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    
    // Refresh if expires in less than 5 minutes
    if (expiresAt - now < 5 * 60 * 1000) {
      // Call refresh endpoint (not implemented yet)
      // const newToken = await refreshToken();
      // localStorage.setItem('jwt_token', newToken);
    }
    
    return true;
  } catch {
    return false;
  }
}
```

### Use Case 3: Batch Operations

```typescript
async function deleteMultipleWebsites(websiteIds: string[]) {
  const results = await Promise.allSettled(
    websiteIds.map(id => deleteWebsite(id))
  );
  
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return {
    total: websiteIds.length,
    succeeded,
    failed,
    results,
  };
}

// Usage
const result = await deleteMultipleWebsites(['id1', 'id2', 'id3']);
console.log(`Deleted ${result.succeeded} out of ${result.total} websites`);
```

### Use Case 4: Pagination (Future Enhancement)

```typescript
// Example of how pagination could be implemented
async function getWebsitesPaginated(page = 1, limit = 10) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(
    `${API_BASE}/websites?page=${page}&limit=${limit}`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  
  return await response.json();
  // Could return: { websites: [...], total: 50, page: 1, totalPages: 5 }
}
```

These examples should help you integrate the Reply Platform API into your applications!
