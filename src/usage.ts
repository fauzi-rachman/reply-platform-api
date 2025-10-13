/**
 * Usage tracking routes module
 * 
 * Handles usage metrics and statistics for organizations
 */

import { Hono } from 'hono';
import { Env } from './types';
import { authMiddleware } from './utils';

const usage = new Hono<Env>();

/**
 * GET /usage/:organization_id
 * Get usage statistics for an organization
 * 
 * Requires authentication via JWT token
 * @param organization_id - Organization ID
 * @query start_date - Start date for filtering (ISO 8601, optional)
 * @query end_date - End date for filtering (ISO 8601, optional)
 * @returns Usage statistics object
 */
usage.get('/:organization_id', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const organizationId = c.req.param('organization_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    // Check if user has access to this organization
    const hasAccess = await c.env.DB.prepare(`
      SELECT 1 
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = ? AND (o.owner_id = ? OR om.user_id = ?)
      LIMIT 1
    `).bind(organizationId, userId, userId).first();

    if (!hasAccess) {
      return c.json({ error: 'Organization not found or access denied' }, 404);
    }

    // Get total credits used
    let creditsQuery = `
      SELECT COALESCE(SUM(credits_used), 0) as total_credits
      FROM usage_records
      WHERE organization_id = ?
    `;
    const creditsParams: any[] = [organizationId];

    if (startDate) {
      creditsQuery += ' AND record_date >= ?';
      creditsParams.push(startDate);
    }

    if (endDate) {
      creditsQuery += ' AND record_date <= ?';
      creditsParams.push(endDate);
    }

    const creditsResult = await c.env.DB.prepare(creditsQuery)
      .bind(...creditsParams)
      .first();

    // Get number of agents
    const agentsResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total_agents FROM agents WHERE organization_id = ?'
    ).bind(organizationId).first();

    // TODO: Get plan limits from subscription table (hardcoded for now)
    const totalCredits = 1100;
    const totalAgents = 10;

    return c.json({
      credits_used: creditsResult?.total_credits || 0,
      total_credits: totalCredits,
      agents_used: agentsResult?.total_agents || 0,
      total_agents: totalAgents,
    });
  } catch (error) {
    console.error('Get usage error:', error);
    return c.json({ error: 'Failed to get usage' }, 500);
  }
});

/**
 * GET /usage/:organization_id/history
 * Get usage history for an organization
 * 
 * Requires authentication via JWT token
 * @param organization_id - Organization ID
 * @query start_date - Start date for filtering (ISO 8601, optional)
 * @query end_date - End date for filtering (ISO 8601, optional)
 * @returns Array of usage records grouped by date
 */
usage.get('/:organization_id/history', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const organizationId = c.req.param('organization_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    // Check if user has access to this organization
    const hasAccess = await c.env.DB.prepare(`
      SELECT 1 
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = ? AND (o.owner_id = ? OR om.user_id = ?)
      LIMIT 1
    `).bind(organizationId, userId, userId).first();

    if (!hasAccess) {
      return c.json({ error: 'Organization not found or access denied' }, 404);
    }

    // Get usage history grouped by date
    let query = `
      SELECT 
        record_date,
        SUM(credits_used) as credits_used
      FROM usage_records
      WHERE organization_id = ?
    `;
    const params: any[] = [organizationId];

    if (startDate) {
      query += ' AND record_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND record_date <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY record_date ORDER BY record_date ASC';

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ history: result.results || [] });
  } catch (error) {
    console.error('Get usage history error:', error);
    return c.json({ error: 'Failed to get usage history' }, 500);
  }
});

/**
 * GET /usage/:organization_id/by-agent
 * Get usage statistics grouped by agent
 * 
 * Requires authentication via JWT token
 * @param organization_id - Organization ID
 * @query start_date - Start date for filtering (ISO 8601, optional)
 * @query end_date - End date for filtering (ISO 8601, optional)
 * @returns Array of usage records grouped by agent
 */
usage.get('/:organization_id/by-agent', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId');
    const organizationId = c.req.param('organization_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    // Check if user has access to this organization
    const hasAccess = await c.env.DB.prepare(`
      SELECT 1 
      FROM organizations o
      LEFT JOIN organization_members om ON o.id = om.organization_id
      WHERE o.id = ? AND (o.owner_id = ? OR om.user_id = ?)
      LIMIT 1
    `).bind(organizationId, userId, userId).first();

    if (!hasAccess) {
      return c.json({ error: 'Organization not found or access denied' }, 404);
    }

    // Get usage by agent
    let query = `
      SELECT 
        a.id as agent_id,
        a.name as agent_name,
        COALESCE(SUM(ur.credits_used), 0) as credits_used
      FROM agents a
      LEFT JOIN usage_records ur ON a.id = ur.agent_id AND ur.organization_id = ?
    `;
    const params: any[] = [organizationId];

    if (startDate) {
      query += ' AND ur.record_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND ur.record_date <= ?';
      params.push(endDate);
    }

    query += `
      WHERE a.organization_id = ?
      GROUP BY a.id, a.name
      ORDER BY credits_used DESC
    `;
    params.push(organizationId);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ by_agent: result.results || [] });
  } catch (error) {
    console.error('Get usage by agent error:', error);
    return c.json({ error: 'Failed to get usage by agent' }, 500);
  }
});

export default usage;
