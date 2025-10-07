# Contributing to Reply Platform API

Thank you for your interest in contributing to Reply Platform API! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project follows a Code of Conduct that all contributors are expected to uphold. Please be respectful, inclusive, and considerate in all interactions.

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of:
- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, education, socio-economic status
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **GitHub account**: [Sign up here](https://github.com/signup)
2. **Git installed**: [Download here](https://git-scm.com/downloads)
3. **Node.js 18+**: [Download here](https://nodejs.org/)
4. **Code editor**: VS Code recommended with TypeScript support
5. **Cloudflare account**: For testing (free tier is fine)

### Initial Setup

1. **Fork the repository**
   - Visit [reply-platform-api](https://github.com/fauzi-rachman/reply-platform-api)
   - Click "Fork" button in the top-right
   - This creates your own copy of the repository

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/reply-platform-api.git
   cd reply-platform-api
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/fauzi-rachman/reply-platform-api.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment**
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars with your credentials
   ```

6. **Create database and run migrations**
   ```bash
   npm run db:create
   # Update wrangler.toml with database ID
   npm run db:migrate:local
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

#### 🐛 Bug Reports
Found a bug? Please:
1. Check if it's already reported in [Issues](https://github.com/fauzi-rachman/reply-platform-api/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)
   - Screenshots if applicable

#### ✨ Feature Requests
Have an idea? Please:
1. Check if it's already requested in [Issues](https://github.com/fauzi-rachman/reply-platform-api/issues)
2. If not, create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Proposed implementation (optional)

#### 🔧 Code Contributions
Want to code? Great!
1. Find an issue labeled `good first issue` or `help wanted`
2. Comment on the issue to claim it
3. Follow the development process below

#### 📖 Documentation
Improve docs by:
- Fixing typos or unclear explanations
- Adding examples or tutorials
- Translating documentation
- Improving API documentation

#### 🧪 Testing
Help by:
- Adding test coverage
- Improving existing tests
- Testing on different platforms

## Development Process

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### Branch Naming Convention

- Features: `feature/description-in-kebab-case`
- Bug fixes: `fix/description-in-kebab-case`
- Documentation: `docs/description-in-kebab-case`
- Refactoring: `refactor/description-in-kebab-case`
- Tests: `test/description-in-kebab-case`

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run type checking
npm run type-check

# Run tests (if available)
npm run test

# Test manually in dev server
npm run dev
```

### 4. Commit Your Changes

Follow [commit guidelines](#commit-guidelines) below.

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

1. Go to your fork on GitHub
2. Click "Pull Request" button
3. Ensure base is `main` and compare is your branch
4. Fill out the PR template
5. Submit!

## Coding Standards

### TypeScript Style

#### Type Annotations
```typescript
// ✅ Good: Explicit types
function getUserById(id: string): Promise<User | null> {
  // ...
}

// ❌ Bad: No type annotations
function getUserById(id) {
  // ...
}
```

#### Interfaces vs Types
```typescript
// ✅ Prefer interfaces for object shapes
interface User {
  id: string;
  email: string;
}

// ✅ Use types for unions/intersections
type Status = 'active' | 'inactive';
```

#### Async/Await
```typescript
// ✅ Good: async/await
async function fetchUser(id: string) {
  try {
    const user = await db.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first();
    return user;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// ❌ Bad: Promise chains
function fetchUser(id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first()
    .then(user => user)
    .catch(error => {
      console.error('Error:', error);
      throw error;
    });
}
```

#### Error Handling
```typescript
// ✅ Good: Proper error handling
try {
  const result = await riskyOperation();
  return c.json(result);
} catch (error) {
  console.error('Operation failed:', error);
  return c.json({ error: 'Operation failed' }, 500);
}

// ❌ Bad: No error handling
const result = await riskyOperation();
return c.json(result);
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `user-routes.ts` |
| Variables | camelCase | `userId`, `userName` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| Functions | camelCase | `getUserById()`, `createWebsite()` |
| Classes | PascalCase | `UserService`, `AuthController` |
| Interfaces | PascalCase | `User`, `Website`, `JWTPayload` |
| Types | PascalCase | `Status`, `Role` |

### Code Organization

```typescript
// ✅ Good: Organized imports
import { Hono } from 'hono';           // External dependencies first
import { cors } from 'hono/cors';      

import { Env } from './types';         // Local imports second
import { authMiddleware } from './utils';

// Constants
const MAX_WEBSITES = 10;

// Main code
const app = new Hono<Env>();
```

### Comments

```typescript
// ✅ Good: Explain WHY, not WHAT
// JWT tokens don't expire because users expect persistent sessions
// across browser sessions without re-authentication
const payload = { userId, email };

// ❌ Bad: Obvious comment
// Create payload object
const payload = { userId, email };
```

## Commit Guidelines

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, config)
- `perf`: Performance improvements

### Examples

```bash
# Feature
git commit -m "feat(auth): add Google OAuth support"

# Bug fix
git commit -m "fix(database): resolve connection timeout issue"

# Documentation
git commit -m "docs(api): add examples for website endpoints"

# With body
git commit -m "feat(websites): add pagination support

- Add page and limit query parameters
- Update documentation
- Add tests for pagination logic"

# Breaking change
git commit -m "feat(auth)!: change JWT payload structure

BREAKING CHANGE: JWT payload now includes user role.
Existing tokens will be invalid and users must re-authenticate."
```

### Commit Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Keep subject line under 50 characters
- Capitalize subject line
- Don't end subject line with period
- Separate subject from body with blank line
- Wrap body at 72 characters
- Use body to explain what and why, not how

## Pull Request Process

### Before Submitting

Ensure your PR:
- [ ] Follows coding standards
- [ ] Includes tests (if applicable)
- [ ] Updates documentation (if applicable)
- [ ] Has descriptive commits
- [ ] Passes all checks (type checking, tests)
- [ ] Is based on latest `main` branch

### PR Title

Follow commit message format:
```
feat(auth): add password reset functionality
fix(database): resolve migration issue
docs(readme): update installation instructions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
How was this tested?

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] Tests pass locally
```

### Review Process

1. **Automated Checks**: GitHub Actions runs checks
2. **Code Review**: Maintainer reviews your code
3. **Feedback**: You may be asked to make changes
4. **Approval**: Once approved, PR will be merged

### Responding to Feedback

- Be receptive to feedback
- Make requested changes promptly
- Ask questions if unclear
- Push additional commits to same branch
- Don't force push after review starts

## Testing Guidelines

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('User Authentication', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should create JWT token with valid payload', async () => {
    const payload = { userId: '123', email: 'test@example.com' };
    const token = await signJWT(payload, 'secret');
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should reject invalid JWT token', async () => {
    const result = await verifyJWT('invalid-token', 'secret');
    
    expect(result).toBeNull();
  });
});
```

### Test Coverage

Aim for:
- Utility functions: 80%+ coverage
- API endpoints: Test happy path + error cases
- Edge cases: Test boundary conditions

### Manual Testing

Before submitting:
1. Test in development server
2. Test all modified endpoints
3. Test error scenarios
4. Verify database changes

## Documentation

### When to Update Documentation

Update docs when you:
- Add new features
- Change API endpoints
- Modify configuration
- Fix bugs that affect usage
- Add new environment variables

### Documentation Files

- `README.md`: Overview and quick start
- `docs/API.md`: API endpoint documentation
- `docs/ARCHITECTURE.md`: System architecture
- `docs/DEVELOPMENT.md`: Development guide
- `docs/DEPLOYMENT.md`: Deployment instructions
- `docs/TROUBLESHOOTING.md`: Common issues
- Code comments: Complex logic explanation

### Documentation Style

- Use clear, simple language
- Provide examples
- Include code snippets
- Add diagrams if helpful
- Keep it up-to-date

## Community

### Getting Help

- **GitHub Issues**: Ask questions
- **Discussions**: Share ideas
- **Discord**: Real-time chat (if available)

### Recognition

Contributors are recognized in:
- Git commit history
- Release notes
- Contributors list

### Communication

- Be respectful and professional
- Stay on topic
- Provide context in questions
- Share knowledge with others

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers this project.

## Questions?

Don't hesitate to ask! We're here to help:
- Open an issue with the `question` label
- Comment on relevant issues
- Reach out to maintainers

Thank you for contributing! 🎉
