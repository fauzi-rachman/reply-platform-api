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