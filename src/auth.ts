/**
 * Authentication routes module
 * 
 * Handles user authentication via:
 * - Google OAuth
 * - Email/password login
 * - OTP (passwordless) authentication
 */

import { Hono } from 'hono';
import { Env, GoogleTokenResponse, GoogleUserInfo } from './types';
import { authMiddleware, generateId, hashPassword, verifyPassword, signJWT } from './utils';

const auth = new Hono<Env>();

/**
 * POST /auth/google
 * Exchange Google OAuth code for JWT token
 * 
 * @body code - OAuth authorization code from Google
 * @body redirectUri - Redirect URI used in OAuth flow
 * @returns JWT token and user information
 */
auth.post('/google', async (c) => {
  try {
    const { code, redirectUri } = await c.req.json();

    if (!code || !redirectUri) {
      return c.json({ error: 'Missing code or redirectUri' }, 400);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      return c.json({ error: 'Failed to exchange code for token' }, 401);
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return c.json({ error: 'Failed to get user info' }, 401);
    }

    const userInfo: GoogleUserInfo = await userInfoResponse.json();

    // Check if user exists
    let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(userInfo.email)
      .first();

    // Create user if doesn't exist
    if (!user) {
      const userId = generateId();
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)'
      ).bind(userId, userInfo.email, userInfo.name, userInfo.picture).run();

      user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(userId)
        .first();
    }

    if (!user) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    // Generate JWT token
    const token = await signJWT(
      { userId: user.id as string, email: user.email as string },
      c.env.JWT_SECRET
    );

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

/**
 * POST /auth/login
 * Email/password authentication
 * 
 * @body email - User's email address
 * @body password - User's password
 * @returns JWT token and user information
 */
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Missing email or password' }, 400);
    }

    // Find user by email
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user || !user.password_hash) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash as string);
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate JWT token
    const token = await signJWT(
      { userId: user.id as string, email: user.email as string },
      c.env.JWT_SECRET
    );

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

/**
 * POST /auth/otp/request
 * Request OTP code for passwordless authentication
 * 
 * @body email - User's email address
 * @returns Success message
 */
auth.post('/otp/request', async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ error: 'Missing email' }, 400);
    }

    // Check rate limiting - only allow 1 OTP per minute per email
    const recentOTP = await c.env.DB.prepare(
      'SELECT * FROM otp_codes WHERE email = ? AND created_at > datetime("now", "-1 minute") ORDER BY created_at DESC LIMIT 1'
    ).bind(email).first();

    if (recentOTP) {
      return c.json({ error: 'Please wait before requesting another OTP' }, 429);
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = generateId();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store OTP in database
    await c.env.DB.prepare(
      'INSERT INTO otp_codes (id, email, code, expires_at) VALUES (?, ?, ?, ?)'
    ).bind(otpId, email, code, expiresAt).run();

    // TODO: Send email with OTP code
    // For now, we'll just return success
    // In production, integrate with email service (SendGrid, Mailgun, etc.)
    console.log(`OTP for ${email}: ${code}`);

    return c.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('OTP request error:', error);
    return c.json({ error: 'Failed to send OTP' }, 500);
  }
});

/**
 * POST /auth/otp/verify
 * Verify OTP code and authenticate user
 * 
 * @body email - User's email address
 * @body otp - 6-digit OTP code
 * @returns JWT token and user information
 */
auth.post('/otp/verify', async (c) => {
  try {
    const { email, otp } = await c.req.json();

    if (!email || !otp) {
      return c.json({ error: 'Missing email or OTP' }, 400);
    }

    // Find valid OTP
    const otpRecord = await c.env.DB.prepare(
      'SELECT * FROM otp_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1'
    ).bind(email, otp).first();

    if (!otpRecord) {
      return c.json({ error: 'Invalid or expired OTP' }, 401);
    }

    // Mark OTP as used
    await c.env.DB.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')
      .bind(otpRecord.id)
      .run();

    // Find or create user
    let user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user) {
      const userId = generateId();
      await c.env.DB.prepare(
        'INSERT INTO users (id, email, name) VALUES (?, ?, ?)'
      ).bind(userId, email, email.split('@')[0]).run();

      user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(userId)
        .first();
    }

    if (!user) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    // Generate JWT token
    const token = await signJWT(
      { userId: user.id as string, email: user.email as string },
      c.env.JWT_SECRET
    );

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    return c.json({ error: 'OTP verification failed' }, 500);
  }
});

/**
 * GET /auth/me
 * Get current authenticated user's information
 * 
 * Requires authentication via JWT token
 * @returns User object with profile information
 */
auth.get('/me', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

export default auth;
