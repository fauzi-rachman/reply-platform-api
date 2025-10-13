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
import organizationRoutes from './organizations';
import agentRoutes from './agents';
import usageRoutes from './usage';

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
 * Authentication routes
 * Mounted under /auth/*
 */
app.route('/auth', authRoutes);

/**
 * Website management routes
 * Mounted under /websites/*
 */
app.route('/websites', websiteRoutes);

/**
 * Organization management routes
 * Mounted under /organizations/*
 */
app.route('/organizations', organizationRoutes);

/**
 * AI Agent management routes
 * Mounted under /agents/*
 */
app.route('/agents', agentRoutes);

/**
 * Usage tracking routes
 * Mounted under /usage/*
 */
app.route('/usage', usageRoutes);

// Export the app as the default Worker handler
export default app;