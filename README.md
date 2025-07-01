# Tamarin AI - Opensource Pull Request Review System

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![tRPC](https://img.shields.io/badge/tRPC-Type--safe-blue?style=flat-square)](https://trpc.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white&style=flat-square)](https://supabase.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/your-org/tamarin-ai/pulls)

Tamarin AI integrates with GitHub as a GitHub App and provides intelligent, contextual code reviews with line-specific comments and overall feedback.

## 🏗️ Tech Stack

- **Frontend**: Next.js 14+ with TypeScript and Shadcn components
- **Backend**: tRPC
- **Database**: PostgreSQL ([Supabase](https://supabase.com/) Postgres) with Prisma ORM
- **Styling**: Tailwind CSS
- **Data Fetching**: React Query
- **Authentication**: NextAuth.js with GitHub provider
- **AI Integration**: OpenAI GPT-4 and Anthropic Claude
- **GitHub Integration**: GitHub App with webhooks using Octokit
- **Deployment**: Vercel

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- GitHub App credentials
- OpenAI or Anthropic API keys

### 1. Clone and Install

```bash
git clone <repository-url>
cd ai-code-review
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
```

Fill in your environment variables

```bash
# Database
DATABASE_URL="postgresql://username:password@hostname:port/database"
DIRECT_URL="postgresql://username:password@hostname:port/database"

# GitHub App Configuration
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

# AI Provider Configuration
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# App Configuration
NEXT_PUBLIC_GITHUB_APP_NAME=tamarin-ai
TOKEN_LIMIT_PER_24H=1000000
```

#### Generate Production Secrets

```bash
# Generate a secure NextAuth secret
openssl rand -base64 32

```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

```

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🔧 GitHub App Setup & Deployment

### 1. Create GitHub App

1. Go to GitHub Settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Fill in the required fields:
   - **App name**: `tamarin-ai` (or your preferred name)
   - **Homepage URL**: `https://your-domain.com`
   - **Webhook URL**: `https://your-domain.com/api/webhook/github`
   - **Webhook secret**: Generate a secure secret

### 2. Permissions

Set the following permissions:

- **Repository permissions**:
  - Contents: Read
  - Metadata: Read
  - Pull requests: Write
  - Issues: Write
- **Organization permissions**:
  - Members: Read

### 3. Subscribe to Events

- Pull requests
- Pull request reviews
- Pull request review comments
- Installation repositories

### 4. Private Key

1. Generate a private key for your GitHub App
2. Add it to your `.env` file as `GITHUB_PRIVATE_KEY`

### 5. Update GitHub App Settings for Production

- **Homepage URL**: `https://your-domain.com`
- **Webhook URL**: `https://your-domain.com/api/webhook/github`
- **User authorization callback URL**: `https://your-domain.com/api/auth/callback/github`
- **Make App Public**: Enable "Public page" and disable "Draft"

---

## Production Deployment

### Option A: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```
2. **Deploy**:
   ```bash
   vercel
   ```
3. **Follow the prompts** to link your GitHub repository and deploy.
4. **Set environment variables** in the Vercel dashboard.

### Database Setup (Production)

#### Using Supabase

1. **Create a Supabase Account and Project**
   - Go to [https://app.supabase.com/](https://app.supabase.com/) and sign up or log in.
   - Click "New Project".
   - Enter a project name, password, and select a region.
   - Click "Create new project".

2. **Get the Database Connection String**
   - Once your project is created, go to the "Project Settings" > "Database".
   - Under "Connection string", copy the `URI` (it will look like: `postgresql://postgres:[YOUR_PASSWORD]@db.[HASH].supabase.co:5432/postgres`).

3. **Configure Environment Variables**
   - In your `.env` file, set:
     ```
     DATABASE_URL="your_supabase_connection_string"
     DIRECT_URL="your_supabase_connection_string"
     ```
   - Replace `your_supabase_connection_string` with the URI you copied.

4. **Push Prisma Schema to Supabase**
   - Run:
     ```bash
     npm run db:generate
     npm run db:push
     ```
   - This will generate the Prisma client and push your schema to the Supabase database.

### Deploy Database Schema

```bash
# Set production DATABASE_URL
export DATABASE_URL="your_production_database_url"

# Generate Prisma client for production
npx prisma generate

# Deploy schema to production
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

---

## 📝 API Documentation

### tRPC Routes

#### GitHub Router (`/api/trpc/github`)

- `repositories` - Get user's repositories
- `organizationRepositories` - Get repositories for an organization
- `toggleRepository` - Enable/disable AI reviews for a repository
- `repositoryStats` - Get repository statistics
- `webhook` - Handle GitHub webhook events

#### User Router (`/api/trpc/user`)

- `profile` - Get user profile and organizations
- `organizations` - Get user's organizations

### Webhook Endpoints

- `POST /api/webhook/github` - GitHub webhook handler

---

## 🛠️ Troubleshooting & Maintenance

### Common Issues

- **Webhook failures**:
  - Check `GITHUB_WEBHOOK_SECRET` matches
  - Verify webhook URL is accessible
  - Check signature verification
- **Database connection errors**:
  - Verify `DATABASE_URL` is correct
  - Check connection pooling limits
  - Ensure database is accessible from deployment
- **GitHub App permissions**:
  - Verify all required permissions are granted
  - Check if repositories are accessible
  - Ensure app is installed on correct repositories

### Debug Commands

```bash
# Test database connection
npx prisma db pull

# Check environment variables
echo $GITHUB_APP_ID
echo $NEXTAUTH_URL

# Test webhook locally with ngrok
ngrok http 3000
```

### Monitoring & Maintenance

- Check logs in your deployment platform
- Monitor webhook events in GitHub App settings
- Track usage through your database
- Set up error tracking (Sentry, LogRocket, etc.)
- Keep dependencies updated
- Monitor API usage (OpenAI/Anthropic)
- Backup database regularly
- Monitor costs and usage

---

## 🤝 Contributing

We welcome contributions from the community! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ and Cursor
