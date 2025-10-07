# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation in `docs/` directory
  - API reference with detailed endpoint documentation
  - Architecture guide explaining system design
  - Development guide for local setup
  - Deployment guide for production
  - Troubleshooting guide for common issues
  - Code examples and use cases
- Contributing guidelines (CONTRIBUTING.md)
- Code of Conduct (CODE_OF_CONDUCT.md)
- Security policy (SECURITY.md)
- Enhanced inline code comments and JSDoc documentation
- This changelog file

### Changed
- Updated README.md with links to comprehensive documentation

## [1.0.0] - 2024-01-15

### Added
- Initial release
- Google OAuth authentication
- JWT token-based authentication
- User management (create/read via OAuth)
- Website CRUD operations (create, read, list, delete)
- Cloudflare D1 database integration
- TypeScript support
- Hono framework integration
- CORS support for cross-origin requests
- Health check endpoint
- Database schema with users and websites tables
- Wrangler configuration for Cloudflare Workers deployment
- Basic project structure and setup

### Features
- **Authentication**
  - POST /auth/google - Exchange Google OAuth code for JWT
  - GET /auth/me - Get current authenticated user

- **Websites**
  - GET /websites - List user's websites
  - POST /websites - Add new website
  - GET /websites/:id - Get specific website
  - DELETE /websites/:id - Delete website

### Technical Stack
- Hono web framework
- Cloudflare Workers (serverless)
- Cloudflare D1 (SQLite database)
- TypeScript
- Vitest for testing

### Security
- JWT-based stateless authentication
- HMAC-SHA256 token signing
- Password hashing with SHA-256
- Environment variable configuration for secrets

## Version History

### Semantic Versioning

This project follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Incompatible API changes
- **MINOR**: New functionality (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Types

- **Unreleased**: Changes in development, not yet released
- **Released**: Stable versions deployed to production

## Migration Guides

### Migrating to 1.0.0

First release - no migration needed.

## Breaking Changes

### Version 1.0.0

- Initial release - no breaking changes

## Deprecations

No deprecations at this time.

## Security Advisories

No security advisories at this time.

For security issues, please see [SECURITY.md](SECURITY.md).

## Support

- **Current Version**: 1.0.0
- **Supported Versions**: 1.x.x
- **End of Life**: To be announced

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute to this project.

## Links

- [GitHub Repository](https://github.com/fauzi-rachman/reply-platform-api)
- [Documentation](docs/README.md)
- [Issues](https://github.com/fauzi-rachman/reply-platform-api/issues)
- [Pull Requests](https://github.com/fauzi-rachman/reply-platform-api/pulls)

---

**Note**: This changelog is manually maintained. For a complete list of changes, see the [Git commit history](https://github.com/fauzi-rachman/reply-platform-api/commits).
