/**
 * Organizations routes module
 * 
 * Handles CRUD operations for organizations/workspaces
 */

import { Hono } from 'hono';
import { Env } from './types';
import { authMiddleware, generateId } from './utils';

const organizations = new Hono<Env>();

/**
 * GET /organizations
 * List all organizations where user is a member
 * 
 * Requires authentication via JWT token
 * @returns Array of organization objects
 */
organizations.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');

    // Get organizations where user is owner or member
    const result = await c.env.DB.prepare(`
      SELECT DISTINCT o.* 
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE o.owner_id = ? OR om.user_id = ?
      ORDER BY o.created_at DESC
    `).bind(userId, userId).all();

    return c.json({ organizations: result.results || [] });
  } catch (error) {
    console.error('Get organizations error:', error);
    return c.json({ error: 'Failed to get organizations' }, 500);
  }
});

/**
 * POST /organizations
 * Create a new organization
 * 
 * Requires authentication via JWT token
 * @body name - Organization name
 * @body url_slug - URL-friendly slug (optional, auto-generated if not provided)
 * @returns Newly created organization object
 */
organizations.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { name, url_slug } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Missing organization name' }, 400);
    }

    // Generate URL slug if not provided
    let slug = url_slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if slug already exists
    const existing = await c.env.DB.prepare('SELECT * FROM organizations WHERE url_slug = ?')
      .bind(slug)
      .first();

    if (existing) {
      // Add random suffix to make it unique
      slug = `${slug}-${Math.random().toString(36).substr(2, 6)}`;
    }

    // Create new organization
    const orgId = generateId();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'INSERT INTO organizations (id, name, url_slug, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(orgId, name, slug, userId, now, now).run();

    // Add creator as owner member
    const memberId = generateId();
    await c.env.DB.prepare(
      'INSERT INTO organization_members (id, organization_id, user_id, role) VALUES (?, ?, ?, ?)'
    ).bind(memberId, orgId, userId, 'owner').run();

    const organization = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?')
      .bind(orgId)
      .first();

    return c.json({ organization }, 201);
  } catch (error) {
    console.error('Create organization error:', error);
    return c.json({ error: 'Failed to create organization' }, 500);
  }
});

/**
 * GET /organizations/:id
 * Get specific organization details
 * 
 * Requires authentication via JWT token
 * @param id - Organization ID
 * @returns Organization object
 */
organizations.get('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const orgId = c.req.param('id');

    // Check if user has access to this organization
    const org = await c.env.DB.prepare(`
      SELECT o.* 
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = ? AND (o.owner_id = ? OR om.user_id = ?)
      LIMIT 1
    `).bind(orgId, userId, userId).first();

    if (!org) {
      return c.json({ error: 'Organization not found' }, 404);
    }

    return c.json({ organization: org });
  } catch (error) {
    console.error('Get organization error:', error);
    return c.json({ error: 'Failed to get organization' }, 500);
  }
});

/**
 * PUT /organizations/:id
 * Update organization details
 * 
 * Requires authentication via JWT token (owner only)
 * @param id - Organization ID
 * @body name - Organization name (optional)
 * @body url_slug - URL-friendly slug (optional)
 * @returns Updated organization object
 */
organizations.put('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const orgId = c.req.param('id');
    const { name, url_slug } = await c.req.json();

    // Check if user is owner
    const org = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ? AND owner_id = ?')
      .bind(orgId, userId)
      .first();

    if (!org) {
      return c.json({ error: 'Organization not found or access denied' }, 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }

    if (url_slug) {
      // Check if new slug is available
      const existing = await c.env.DB.prepare('SELECT * FROM organizations WHERE url_slug = ? AND id != ?')
        .bind(url_slug, orgId)
        .first();

      if (existing) {
        return c.json({ error: 'URL slug already in use' }, 409);
      }

      updates.push('url_slug = ?');
      params.push(url_slug);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(orgId);

    await c.env.DB.prepare(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    const updated = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?')
      .bind(orgId)
      .first();

    return c.json({ organization: updated });
  } catch (error) {
    console.error('Update organization error:', error);
    return c.json({ error: 'Failed to update organization' }, 500);
  }
});

/**
 * DELETE /organizations/:id
 * Delete an organization
 * 
 * Requires authentication via JWT token (owner only)
 * @param id - Organization ID
 * @returns 200 OK on success
 */
organizations.delete('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const orgId = c.req.param('id');

    // Check if user is owner
    const org = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ? AND owner_id = ?')
      .bind(orgId, userId)
      .first();

    if (!org) {
      return c.json({ error: 'Organization not found or access denied' }, 404);
    }

    // Delete organization (cascade will delete members, agents, etc.)
    await c.env.DB.prepare('DELETE FROM organizations WHERE id = ?')
      .bind(orgId)
      .run();

    return c.json({ message: 'Organization deleted' }, 200);
  } catch (error) {
    console.error('Delete organization error:', error);
    return c.json({ error: 'Failed to delete organization' }, 500);
  }
});

/**
 * GET /organizations/:id/members
 * List all members of an organization
 * 
 * Requires authentication via JWT token
 * @param id - Organization ID
 * @returns Array of member objects with user details
 */
organizations.get('/:id/members', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const orgId = c.req.param('id');

    // Check if user has access to this organization
    const hasAccess = await c.env.DB.prepare(`
      SELECT 1 
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = ? AND (o.owner_id = ? OR om.user_id = ?)
      LIMIT 1
    `).bind(orgId, userId, userId).first();

    if (!hasAccess) {
      return c.json({ error: 'Organization not found or access denied' }, 404);
    }

    // Get all members with user details
    const result = await c.env.DB.prepare(`
      SELECT om.id, om.organization_id, om.user_id, om.role, om.created_at,
             u.email, u.name, u.picture
      FROM organization_members om
      JOIN users u ON om.user_id = u.id
      WHERE om.organization_id = ?
      ORDER BY om.created_at ASC
    `).bind(orgId).all();

    return c.json({ members: result.results || [] });
  } catch (error) {
    console.error('Get members error:', error);
    return c.json({ error: 'Failed to get members' }, 500);
  }
});

export default organizations;
