import { Context } from 'hono';
import { Env, JWTPayload } from './types';

/**
 * Sign a JWT token using HMAC-SHA256
 * 
 * Creates a JSON Web Token with the provided payload, signed with the secret key.
 * The token is stateless and contains all necessary user information.
 * 
 * @param payload - User information to encode in the token (userId and email)
 * @param secret - Secret key for signing the token (from JWT_SECRET environment variable)
 * @returns Base64-encoded JWT token in format: header.payload.signature
 * 
 * @example
 * const token = await signJWT({ userId: '123', email: 'user@example.com' }, 'secret-key');
 * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMi..."
 */
export async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  // Create JWT header with algorithm and type
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  // Import secret key for HMAC signing
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the token and encode signature
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${data}.${encodedSignature}`;
}

/**
 * Verify and decode a JWT token
 * 
 * Validates the token signature and returns the decoded payload if valid.
 * Returns null if the token is invalid, expired, or tampered with.
 * 
 * @param token - JWT token to verify (in format: header.payload.signature)
 * @param secret - Secret key used to sign the token (must match the signing secret)
 * @returns Decoded payload if valid, null if invalid
 * 
 * @example
 * const payload = await verifyJWT(token, 'secret-key');
 * if (payload) {
 *   console.log(`User ID: ${payload.userId}`);
 * }
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    // Split token into components
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    const data = `${encodedHeader}.${encodedPayload}`;
    
    // Import secret key for verification
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Verify signature
    const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    
    if (!isValid) return null;
    
    // Decode and return payload
    const payload = JSON.parse(atob(encodedPayload));
    return payload;
  } catch {
    // Return null for any errors (malformed token, invalid JSON, etc.)
    return null;
  }
}

/**
 * Authentication middleware for Hono routes
 * 
 * Validates the JWT token in the Authorization header and sets user context.
 * Rejects requests without a valid token with 401 Unauthorized.
 * 
 * Usage:
 * - Apply globally: app.use('*', authMiddleware)
 * - Apply to specific routes: app.get('/protected', authMiddleware, handler)
 * 
 * After successful authentication, the following context variables are set:
 * - c.get('userId') - Authenticated user's ID
 * - c.get('userEmail') - Authenticated user's email
 * 
 * @param c - Hono context object
 * @param next - Next middleware/handler in the chain
 * @returns JSON error response (401) or calls next middleware
 * 
 * @example
 * app.get('/websites', authMiddleware, async (c) => {
 *   const userId = c.get('userId');
 *   // Use userId to fetch user's data
 * });
 */
export async function authMiddleware(c: Context<Env>, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  
  // Check for Authorization header with Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Extract token (remove "Bearer " prefix)
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  
  // Reject invalid tokens
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  // Set user context for subsequent handlers
  c.set('userId', payload.userId);
  c.set('userEmail', payload.email);
  
  // Continue to next middleware/handler
  await next();
}

/**
 * Generate a unique identifier using UUID v4
 * 
 * Uses the Web Crypto API to generate cryptographically secure UUIDs.
 * Used for creating user IDs, website IDs, and other unique identifiers.
 * 
 * @returns UUID v4 string (format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
 * 
 * @example
 * const userId = generateId();
 * // Returns: "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Hash a password using SHA-256
 * 
 * Creates a one-way hash of the password for secure storage.
 * Note: This is a simple implementation. For production password storage,
 * consider using bcrypt or argon2 with salt and multiple iterations.
 * 
 * @param password - Plain text password to hash
 * @returns Base64-encoded hash of the password
 * 
 * @example
 * const hash = await hashPassword('mypassword123');
 * // Store hash in database instead of plain password
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

/**
 * Verify a password against its hash
 * 
 * Hashes the provided password and compares it with the stored hash.
 * Returns true if they match, indicating correct password.
 * 
 * @param password - Plain text password to verify
 * @param hash - Stored hash to compare against
 * @returns True if password matches, false otherwise
 * 
 * @example
 * const isValid = await verifyPassword('mypassword123', storedHash);
 * if (isValid) {
 *   // Password is correct
 * }
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}