# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Publicly Disclose

**Please do not open a public GitHub issue for security vulnerabilities.** This could put users at risk before a fix is available.

### 2. Report Privately

Send details to: **[Your security contact email - to be added]**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

### 3. Response Time

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity and complexity

### 4. Disclosure Process

1. We'll confirm receipt of your report
2. We'll investigate and assess the issue
3. We'll develop and test a fix
4. We'll release the fix and notify users
5. We'll publicly acknowledge your contribution (if desired)

## Security Best Practices

### For Users

#### Environment Variables
- Never commit `.dev.vars` to version control
- Use strong, unique secrets for `JWT_SECRET` (minimum 32 characters)
- Rotate secrets regularly
- Use different secrets for development and production

#### Database Security
- Keep database credentials secure
- Regularly backup your D1 database
- Monitor database access logs

#### API Keys
- Keep Google OAuth credentials secure
- Use separate credentials for development and production
- Configure authorized redirect URIs carefully
- Regularly review OAuth consent screen settings

### For Developers

#### Code Security

```typescript
// ✅ Good: Parameterized queries (D1 handles this)
const user = await db.prepare('SELECT * FROM users WHERE id = ?')
  .bind(userId)
  .first();

// ❌ Bad: String concatenation (vulnerable to SQL injection)
const user = await db.prepare(`SELECT * FROM users WHERE id = '${userId}'`)
  .first();
```

#### Input Validation
Always validate and sanitize user inputs:

```typescript
// Validate domain format
if (!domain || typeof domain !== 'string' || domain.length > 255) {
  return c.json({ error: 'Invalid domain' }, 400);
}
```

#### Authentication
- Always use `authMiddleware` for protected routes
- Verify token expiration (if implemented)
- Check user ownership before modifying resources

#### CORS Configuration
In production, restrict allowed origins:

```typescript
app.use('*', cors({
  origin: ['https://yourdomain.com'], // Whitelist specific domains
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

## Known Security Considerations

### JWT Tokens
- **No Expiration**: Current implementation doesn't set token expiration
  - Consider adding expiration (`exp` claim)
  - Implement token refresh mechanism
  - Store token revocation list if needed

### Password Hashing
- **Simple SHA-256**: Current hashing is basic
  - For production password auth, use bcrypt or argon2
  - Add salt to prevent rainbow table attacks
  - Use multiple iterations

### Rate Limiting
- **No Rate Limiting**: Currently no rate limits implemented
  - Consider adding rate limiting for auth endpoints
  - Use Cloudflare Workers KV for tracking
  - Implement IP-based throttling

## Security Headers

Consider adding security headers to responses:

```typescript
app.use('*', async (c, next) => {
  await next();
  
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
});
```

## Dependency Security

### Keep Dependencies Updated
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

### Review Dependencies
- Minimize dependencies
- Use well-maintained packages
- Review package permissions
- Check for known vulnerabilities

## Cloudflare Workers Security

### Secrets Management
- Use `wrangler secret put` for sensitive data
- Never log secrets
- Rotate secrets regularly

### Environment Isolation
- Use separate workers for dev/staging/production
- Use different databases for each environment
- Configure different OAuth credentials per environment

### Monitoring
- Enable Cloudflare Workers analytics
- Monitor for unusual traffic patterns
- Set up alerts for errors
- Review logs regularly

## Compliance

### GDPR Considerations
- User data is stored in Cloudflare D1
- Implement data export functionality
- Implement account deletion
- Keep privacy policy updated

### Data Retention
- Define data retention policies
- Implement automated data cleanup
- Log data access for auditing

## Security Checklist

Before deploying to production:

- [ ] All secrets are set via `wrangler secret put`
- [ ] CORS is restricted to specific origins
- [ ] JWT_SECRET is strong and unique (32+ characters)
- [ ] Google OAuth credentials are production-ready
- [ ] Database backups are configured
- [ ] Monitoring and alerts are set up
- [ ] Security headers are configured
- [ ] Dependencies are up to date
- [ ] No secrets in code or version control
- [ ] Rate limiting is implemented (if needed)
- [ ] Error messages don't expose sensitive info
- [ ] Input validation is comprehensive

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Cloudflare Security Best Practices](https://developers.cloudflare.com/workers/platform/security/)
- [Google OAuth Security](https://developers.google.com/identity/protocols/oauth2/security-best-practices)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## Questions?

If you have questions about security:
- Review this document
- Check the [documentation](docs/)
- Open a GitHub discussion
- Contact the maintainers

---

Thank you for helping keep Reply Platform API secure! 🔒
