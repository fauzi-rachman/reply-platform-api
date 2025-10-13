/**
 * AI Agents routes module
 * 
 * Handles CRUD operations for AI agents within organizations
 */

import { Hono } from 'hono';
import { Env } from './types';
import { authMiddleware, generateId } from './utils';

const agents = new Hono<Env>();

/**
 * GET /agents
 * List all agents accessible to the authenticated user
 * 
 * Requires authentication via JWT token
 * @query organization_id - Filter by organization ID (optional)
 * @returns Array of agent objects
 */
agents.get('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const organizationId = c.req.query('organization_id');

    let query = `
      SELECT DISTINCT a.* 
      FROM agents a
      JOIN organizations o ON a.organization_id = o.id
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE (o.owner_id = ? OR om.user_id = ?)
    `;
    const params: any[] = [userId, userId];

    if (organizationId) {
      query += ' AND a.organization_id = ?';
      params.push(organizationId);
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ agents: result.results || [] });
  } catch (error) {
    console.error('Get agents error:', error);
    return c.json({ error: 'Failed to get agents' }, 500);
  }
});

/**
 * POST /agents
 * Create a new AI agent
 * 
 * Requires authentication via JWT token
 * @body organization_id - Organization ID
 * @body name - Agent name
 * @body description - Agent description (optional)
 * @returns Newly created agent object
 */
agents.post('/', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const { organization_id, name, description } = await c.req.json();

    if (!organization_id || !name) {
      return c.json({ error: 'Missing organization_id or name' }, 400);
    }

    // Check if user has access to this organization
    const hasAccess = await c.env.DB.prepare(`
      SELECT 1 
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = ? AND (o.owner_id = ? OR om.user_id = ?)
      LIMIT 1
    `).bind(organization_id, userId, userId).first();

    if (!hasAccess) {
      return c.json({ error: 'Organization not found or access denied' }, 404);
    }

    // Create new agent
    const agentId = generateId();
    const now = new Date().toISOString();

    await c.env.DB.prepare(
      'INSERT INTO agents (id, organization_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(agentId, organization_id, name, description || null, now, now).run();

    const agent = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?')
      .bind(agentId)
      .first();

    return c.json({ agent }, 201);
  } catch (error) {
    console.error('Create agent error:', error);
    return c.json({ error: 'Failed to create agent' }, 500);
  }
});

/**
 * GET /agents/:id
 * Get specific agent details
 * 
 * Requires authentication via JWT token
 * @param id - Agent ID
 * @returns Agent object
 */
agents.get('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const agentId = c.req.param('id');

    // Check if user has access to this agent's organization
    const agent = await c.env.DB.prepare(`
      SELECT a.* 
      FROM agents a
      JOIN organizations o ON a.organization_id = o.id
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE a.id = ? AND (o.owner_id = ? OR om.user_id = ?)
      LIMIT 1
    `).bind(agentId, userId, userId).first();

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    return c.json({ agent });
  } catch (error) {
    console.error('Get agent error:', error);
    return c.json({ error: 'Failed to get agent' }, 500);
  }
});

/**
 * PUT /agents/:id
 * Update agent details
 * 
 * Requires authentication via JWT token
 * @param id - Agent ID
 * @body name - Agent name (optional)
 * @body description - Agent description (optional)
 * @body last_trained - Last training timestamp (optional)
 * @returns Updated agent object
 */
agents.put('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const agentId = c.req.param('id');
    const { name, description, last_trained } = await c.req.json();

    // Check if user has access to this agent's organization
    const agent = await c.env.DB.prepare(`
      SELECT a.* 
      FROM agents a
      JOIN organizations o ON a.organization_id = o.id
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE a.id = ? AND (o.owner_id = ? OR om.user_id = ?)
      LIMIT 1
    `).bind(agentId, userId, userId).first();

    if (!agent) {
      return c.json({ error: 'Agent not found or access denied' }, 404);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }

    if (last_trained !== undefined) {
      updates.push('last_trained = ?');
      params.push(last_trained);
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(agentId);

    await c.env.DB.prepare(
      `UPDATE agents SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    const updated = await c.env.DB.prepare('SELECT * FROM agents WHERE id = ?')
      .bind(agentId)
      .first();

    return c.json({ agent: updated });
  } catch (error) {
    console.error('Update agent error:', error);
    return c.json({ error: 'Failed to update agent' }, 500);
  }
});

/**
 * DELETE /agents/:id
 * Delete an agent
 * 
 * Requires authentication via JWT token
 * @param id - Agent ID
 * @returns 200 OK on success
 */
agents.delete('/:id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const agentId = c.req.param('id');

    // Check if user has access to this agent's organization
    const agent = await c.env.DB.prepare(`
      SELECT a.* 
      FROM agents a
      JOIN organizations o ON a.organization_id = o.id
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE a.id = ? AND (o.owner_id = ? OR om.user_id = ?)
      LIMIT 1
    `).bind(agentId, userId, userId).first();

    if (!agent) {
      return c.json({ error: 'Agent not found or access denied' }, 404);
    }

    // Delete agent
    await c.env.DB.prepare('DELETE FROM agents WHERE id = ?')
      .bind(agentId)
      .run();

    return c.json({ message: 'Agent deleted' }, 200);
  } catch (error) {
    console.error('Delete agent error:', error);
    return c.json({ error: 'Failed to delete agent' }, 500);
  }
});

export default agents;
