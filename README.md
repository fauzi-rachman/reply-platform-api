# Reply Platform API

A serverless API built with **Hono** framework and deployed to **Cloudflare Workers** with **D1 database** integration.

> 📚 **Comprehensive Documentation Available**: This project includes detailed documentation in the [`docs/`](docs/) directory covering architecture, development, deployment, troubleshooting, and complete API reference with examples.

## 🚀 **Live API**

**Production API**: `https://reply-platform-api.red-frog-895a.workers.dev`

## ✨ **Features**

- ⚡ **Serverless** - Runs on Cloudflare Workers
- 🗄️ **D1 Database** - Built-in SQLite database  
- 🔐 **Google OAuth** - Secure authentication
- 🔑 **JWT Tokens** - Stateless authentication
- 📱 **RESTful API** - Clean REST endpoints
- 🛡️ **CORS Enabled** - Cross-origin support
- 📊 **TypeScript** - Full type safety

## 📋 **API Endpoints**

### Authentication
- `POST /auth/google` - Exchange Google OAuth code for JWT token
- `GET /auth/me` - Get current user information

### Website Management  
- `GET /websites` - List user's websites
- `POST /websites` - Add a new website
- `GET /websites/:id` - Get specific website
- `DELETE /websites/:id` - Delete a website

## 🛠️ **Quick Setup**

### 1. Clone & Install
```bash
git clone https://github.com/fauzi-rachman/reply-platform-api.git
cd reply-platform-api
npm install
```

### 2. Configure Environment
```bash
# Copy example environment file
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your secrets
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
JWT_SECRET=your_jwt_secret_key
```

### 3. Set up Database
```bash
# Create D1 database
npm run db:create

# Update wrangler.toml with your database ID
# Initialize database schema
npm run db:migrate
```

### 4. Deploy to Cloudflare
```bash
# Set production secrets
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put JWT_SECRET

# Deploy to Cloudflare Workers
npm run deploy
```

## 🔧 **Development**

```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run tests
npm run test

# Watch tests
npm run test:watch
```

## 📚 **Configuration**

### Environment Variables

**Public** (set in `wrangler.toml`):
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `FRONTEND_URL` - Dashboard URL for CORS

**Secrets** (set via `wrangler secret put`):
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret  
- `JWT_SECRET` - Secret key for JWT signing

### Database Configuration

The API uses Cloudflare D1 database with tables:
- `users` - User accounts and profiles
- `websites` - Website registrations per user

## 🚀 **Simple Deployment**

The repository is configured for **automatic deployment**:

1. **Fork this repository**
2. **Set up Cloudflare secrets** in your account
3. **Push to main branch** - Automatic deployment via GitHub Actions!

### GitHub Actions Setup

Add these secrets to your GitHub repository:
```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

## 🔗 **Related Projects**

- **Dashboard**: [reply-platform-dashboard](https://github.com/fauzi-rachman/reply-platform-dashboard)
- **Original Monorepo**: [reply-platform](https://github.com/fauzi-rachman/reply-platform)

## 📖 **Documentation**

Comprehensive documentation is available in the `docs/` directory:

- **[API Reference](docs/API.md)** - Complete API endpoint documentation with examples
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[Development Guide](docs/DEVELOPMENT.md)** - Local setup and development workflow
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Code Examples](docs/EXAMPLES.md)** - Integration examples and use cases

### Quick Links

- **Database Schema**: See [`schema.sql`](schema.sql)
- **Contributing**: See [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Code of Conduct**: See [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Add tests if needed
5. Submit a pull request

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.