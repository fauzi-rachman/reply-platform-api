import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import authRoutes from './auth';
import websiteRoutes from './websites';

const app = new Hono<Env>();

// CORS middleware
app.use('*', cors({
  origin: (origin) => origin, // Allow all origins in development
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({ message: 'Reply.sh API is running' });
});

// Mount routes
app.route('/auth', authRoutes);
app.route('/websites', websiteRoutes);

export default app;