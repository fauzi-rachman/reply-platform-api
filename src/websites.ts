/**
 * Website management routes module
 * 
 * Handles CRUD operations for user websites
 */

import { Hono } from 'hono';
import { Env } from './types';
import { authMiddleware, generateId } from './utils';

const websites = new Hono<Env>();

/**
 * GET /websites
 * List all websites owned by authenticated user
 * 
 * Requires authentication via JWT token
 * @returns Array of website objects
 */
websites.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    const result = await c.env.DB.prepare(
      'SELECT * FROM websites WHERE user_id = ? ORDER BY created_at DESC'
    ).bind(userId).all();

    return c.json({ websites: result.results || [] });
  } catch (error) {
    console.error('Get websites error:', error);
    return c.json({ error: 'Failed to get websites' }, 500);
  }
});

/**
 * POST /websites
 * Add a new website to user's account
 * 
 * Requires authentication via JWT token
 * @body domain - Website domain to add (e.g., "example.com")
 * @returns Newly created website object
 */
websites.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { domain } = await c.req.json();

    if (!domain) {
      return c.json({ error: 'Missing domain' }, 400);
    }

    // Check if domain already exists
    const existing = await c.env.DB.prepare('SELECT * FROM websites WHERE domain = ?')
      .bind(domain)
      .first();

    if (existing) {
      return c.json({ error: 'Domain already exists' }, 409);
    }

    // Create new website
    const websiteId = generateId();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'INSERT INTO websites (id, user_id, domain, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(websiteId, userId, domain, now, now).run();

    const website = await c.env.DB.prepare('SELECT * FROM websites WHERE id = ?')
      .bind(websiteId)
      .first();

    return c.json({ website }, 201);
  } catch (error) {
    console.error('Add website error:', error);
    return c.json({ error: 'Failed to add website' }, 500);
  }
});

/**
 * GET /websites/:id
 * Get specific website details
 * 
 * Requires authentication via JWT token
 * @param id - Website ID
 * @returns Website object
 */
websites.get('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const websiteId = c.req.param('id');

    const website = await c.env.DB.prepare(
      'SELECT * FROM websites WHERE id = ? AND user_id = ?'
    ).bind(websiteId, userId).first();

    if (!website) {
      return c.json({ error: 'Website not found' }, 404);
    }

    return c.json({ website });
  } catch (error) {
    console.error('Get website error:', error);
    return c.json({ error: 'Failed to get website' }, 500);
  }
});

/**
 * DELETE /websites/:id
 * Delete a website from user's account
 * 
 * Requires authentication via JWT token
 * @param id - Website ID to delete
 * @returns 204 No Content on success
 */
websites.delete('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const websiteId = c.req.param('id');

    // Check if website exists and belongs to user
    const website = await c.env.DB.prepare(
      'SELECT * FROM websites WHERE id = ? AND user_id = ?'
    ).bind(websiteId, userId).first();

    if (!website) {
      return c.json({ error: 'Website not found' }, 404);
    }

    // Delete website
    await c.env.DB.prepare('DELETE FROM websites WHERE id = ?')
      .bind(websiteId)
      .run();

    return c.json({ message: 'Website deleted' }, 200);
  } catch (error) {
    console.error('Delete website error:', error);
    return c.json({ error: 'Failed to delete website' }, 500);
  }
});

export default websites;
