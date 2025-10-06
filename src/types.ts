export interface Env {
  Bindings: {
    DB: D1Database;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    JWT_SECRET: string;
    FRONTEND_URL: string;
  };
  Variables: {
    userId: string;
    userEmail: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  password_hash?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Website {
  id: string;
  user_id: string;
  domain: string;
  created_at: string;
  updated_at: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}