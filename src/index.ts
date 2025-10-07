/**
 * Reply Platform API
 * 
 * A serverless API built with Hono framework for Cloudflare Workers.
 * Provides authentication via Google OAuth and website management functionality.
 * 
 * Main features:
 * - Google OAuth authentication with JWT token generation
 * - Website CRUD operations for authenticated users
 * - D1 database integration for data persistence
 * - CORS support for cross-origin requests
 * 
 * @see https://github.com/fauzi-rachman/reply-platform-api
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import authRoutes from './auth';
import websiteRoutes from './websites';

// Initialize Hono app with typed environment
const app = new Hono<Env>();

/**
 * CORS middleware configuration
 * 
 * Enables cross-origin requests from frontend applications.
 * In production, consider restricting origins to specific domains.
 */
app.use('*', cors({
  origin: (origin) => origin, // Allow all origins (consider restricting in production)
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies and authorization headers
}));

/**
 * Health check endpoint
 * 
 * Simple endpoint to verify the API is running.
 * Useful for monitoring, load balancers, and uptime checks.
 * 
 * @route GET /
 * @returns {Object} JSON object with status message
 */
app.get('/', (c) => {
  return c.json({ message: 'Reply.sh API is running' });
});

/**
 * Mount authentication routes
 * All routes under /auth/* handle OAuth login and user information
 * 
 * Routes:
 * - POST /auth/google - Exchange OAuth code for JWT token
 * - GET /auth/me - Get current user information (requires authentication)
 */
app.route('/auth', authRoutes);

/**
 * Mount website management routes
 * All routes under /websites/* handle website CRUD operations
 * 
 * Routes (all require authentication):
 * - GET /websites - List user's websites
 * - POST /websites - Add new website
 * - GET /websites/:id - Get specific website
 * - DELETE /websites/:id - Delete website
 */
app.route('/websites', websiteRoutes);

// Export the app as the default Worker handler
export default app;