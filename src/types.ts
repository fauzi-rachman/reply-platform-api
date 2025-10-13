/**
 * Cloudflare Workers environment interface
 * Defines bindings (resources) and variables (request context) available in the worker
 */
export interface Env {
  /** Resource bindings configured in wrangler.toml */
  Bindings: {
    /** D1 database instance for data persistence */
    DB: D1Database;
    /** Google OAuth client ID (public, configured in wrangler.toml) */
    GOOGLE_CLIENT_ID: string;
    /** Google OAuth client secret (secret, set via wrangler secret put) */
    GOOGLE_CLIENT_SECRET: string;
    /** Secret key for signing and verifying JWT tokens (secret, set via wrangler secret put) */
    JWT_SECRET: string;
    /** Frontend application URL for CORS configuration (public, configured in wrangler.toml) */
    FRONTEND_URL: string;
  };
  /** Request-scoped variables set during request processing (e.g., by middleware) */
  Variables: {
    /** Authenticated user's ID, set by authMiddleware */
    userId: string;
    /** Authenticated user's email, set by authMiddleware */
    userEmail: string;
  };
}

/**
 * User account model
 * Represents a user in the system, typically created via Google OAuth
 */
export interface User {
  /** Unique user identifier (UUID v4) */
  id: string;
  /** User's email address (unique, from Google OAuth) */
  email: string;
  /** User's display name (from Google profile) */
  name: string | null;
  /** URL to user's profile picture (from Google) */
  picture: string | null;
  /** Hashed password (reserved for future password authentication feature) */
  password_hash?: string | null;
  /** Account creation timestamp (ISO 8601 format) */
  created_at: string;
  /** Last update timestamp (ISO 8601 format) */
  updated_at: string;
}

/**
 * Website model
 * Represents a website registered by a user for the commenting platform
 */
export interface Website {
  /** Unique website identifier (UUID v4) */
  id: string;
  /** ID of the user who owns this website */
  user_id: string;
  /** Domain name of the website (must be unique across all users) */
  domain: string;
  /** Registration timestamp (ISO 8601 format) */
  created_at: string;
  /** Last update timestamp (ISO 8601 format) */
  updated_at: string;
}

/**
 * JWT token payload
 * Contains claims stored in the JWT token for stateless authentication
 */
export interface JWTPayload {
  /** User ID claim - identifies the authenticated user */
  userId: string;
  /** Email claim - user's email address for display/verification */
  email: string;
}

/**
 * Google user information response
 * Data returned from Google's userinfo endpoint after OAuth
 */
export interface GoogleUserInfo {
  /** User's email address from Google account */
  email: string;
  /** User's full name from Google profile */
  name: string;
  /** URL to user's Google profile picture */
  picture: string;
  /** Whether Google has verified the email address */
  verified_email: boolean;
}

/**
 * Google OAuth token response
 * Data returned when exchanging authorization code for access token
 */
export interface GoogleTokenResponse {
  /** Access token for making authenticated requests to Google APIs */
  access_token: string;
  /** Token expiration time in seconds */
  expires_in: number;
  /** Token type (typically "Bearer") */
  token_type: string;
  /** Space-delimited list of granted scopes */
  scope: string;
  /** Refresh token for obtaining new access tokens (optional, depends on OAuth flow) */
  refresh_token?: string;
}

/**
 * Organization/Workspace model
 * Represents a workspace that can have multiple members and agents
 */
export interface Organization {
  /** Unique organization identifier (UUID v4) */
  id: string;
  /** Organization name */
  name: string;
  /** URL-friendly slug for organization */
  url_slug: string;
  /** ID of the user who owns this organization */
  owner_id: string;
  /** Creation timestamp (ISO 8601 format) */
  created_at: string;
  /** Last update timestamp (ISO 8601 format) */
  updated_at: string;
}

/**
 * Organization member model
 * Represents a user's membership in an organization
 */
export interface OrganizationMember {
  /** Unique membership identifier (UUID v4) */
  id: string;
  /** Organization ID */
  organization_id: string;
  /** User ID */
  user_id: string;
  /** Member role (owner, admin, member) */
  role: string;
  /** Membership creation timestamp (ISO 8601 format) */
  created_at: string;
}

/**
 * AI Agent model
 * Represents an AI agent configuration for an organization
 */
export interface Agent {
  /** Unique agent identifier (UUID v4) */
  id: string;
  /** Organization ID that owns this agent */
  organization_id: string;
  /** Agent name */
  name: string;
  /** Agent description (optional) */
  description: string | null;
  /** Last training timestamp (ISO 8601 format, optional) */
  last_trained: string | null;
  /** Creation timestamp (ISO 8601 format) */
  created_at: string;
  /** Last update timestamp (ISO 8601 format) */
  updated_at: string;
}

/**
 * OTP code model
 * Represents a one-time password for email-based authentication
 */
export interface OTPCode {
  /** Unique OTP identifier (UUID v4) */
  id: string;
  /** Email address for OTP */
  email: string;
  /** 6-digit OTP code */
  code: string;
  /** Expiration timestamp (ISO 8601 format) */
  expires_at: string;
  /** Whether OTP has been used */
  used: boolean;
  /** Creation timestamp (ISO 8601 format) */
  created_at: string;
}

/**
 * Usage record model
 * Tracks credit usage for organizations and agents
 */
export interface UsageRecord {
  /** Unique usage record identifier (UUID v4) */
  id: string;
  /** Organization ID */
  organization_id: string;
  /** Agent ID (optional) */
  agent_id: string | null;
  /** Number of credits used */
  credits_used: number;
  /** Date of usage record (ISO 8601 date format) */
  record_date: string;
  /** Creation timestamp (ISO 8601 format) */
  created_at: string;
}