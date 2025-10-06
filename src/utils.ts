import { Context } from 'hono';
import { Env, JWTPayload } from './types';

// Simple JWT implementation for Cloudflare Workers
export async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${data}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    const data = `${encodedHeader}.${encodedPayload}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(encodedSignature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    
    if (!isValid) return null;
    
    const payload = JSON.parse(atob(encodedPayload));
    return payload;
  } catch {
    return null;
  }
}

export async function authMiddleware(c: Context<Env>, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);
  
  if (!payload) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  c.set('userId', payload.userId);
  c.set('userEmail', payload.email);
  
  await next();
}

export function generateId(): string {
  return crypto.randomUUID();
}

// Simple password hashing using SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}