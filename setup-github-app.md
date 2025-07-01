# GitHub App Setup Guide

## The Issue

Your webhook is failing with `Invalid keyData` because the `GITHUB_PRIVATE_KEY` environment variable is not configured correctly.

## Solution Steps

### 1. Create/Configure Your GitHub App

If you haven't created a GitHub App yet:

1. Go to: https://github.com/settings/apps/new
2. Fill in the required fields:
   - **App name**: `ai-code-review-dev` (or any unique name)
   - **Homepage URL**: `http://localhost:3000`
   - **Webhook URL**: `http://localhost:3000/api/webhook/github` (or use ngrok for local testing)
   - **Webhook secret**: Generate a random secret (save this for later)

3. **Permissions** (Repository permissions):
   - Contents: Read
   - Metadata: Read
   - Pull requests: Write
   - Issues: Write

4. **Subscribe to events**:
   - Pull requests
   - Pull request reviews
   - Installation repositories

5. **Create the app** and note down the **App ID**

### 2. Generate and Download Private Key

1. In your newly created GitHub App settings
2. Scroll down to "Private keys" section
3. Click "Generate a private key"
4. Download the `.pem` file (e.g., `your-app-name.2024-06-28.private-key.pem`)

### 3. Configure Environment Variables

Create a `.env` file in your project root with the following format:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ai_code_review"
DIRECT_URL="postgresql://username:password@localhost:5432/ai_code_review"

# GitHub App Configuration (REPLACE WITH YOUR VALUES)
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET=e32ab2a3feff60df300162927c07d8b7e810686a
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

# AI Provider Configuration
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=ywGhzM9CDwqedyKZkWUwCoXWIuUmFS9BnNWW2xGBQhQ=

# App Configuration
NEXT_PUBLIC_GITHUB_APP_NAME=ai-code-review-dev
```

### 4. Format the Private Key Correctly

**CRITICAL**: The private key must be formatted as a single line with `\n` escaped newlines.

#### Option A: Manual Formatting

1. Open your downloaded `.pem` file
2. Copy the entire content
3. Replace all actual newlines with `\n`
4. Put the result in quotes

Example:

```bash
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA7Z...\n...\n-----END RSA PRIVATE KEY-----"
```

#### Option B: Use a Script (Recommended)

Run this command to automatically format your private key:

```bash
# Replace 'path-to-your-key.pem' with your actual file path
echo "GITHUB_PRIVATE_KEY=\"$(cat path-to-your-key.pem | tr '\n' '|' | sed 's/|/\\n/g')\""
```

### 5. Install Your GitHub App

1. Go to your GitHub App settings
2. Click "Install App"
3. Install it on your repository: `chandrashekar-kongari/ai-code-review`

### 6. Test the Setup

Restart your development server and check the logs:

```bash
npm run dev
```

You should see:

```
🔧 Initializing GitHub App with: { appId: '123456', hasPrivateKey: true, ... }
✅ GitHub App initialized successfully
```

### 7. Generate Required Secrets

For the other environment variables:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate GITHUB_WEBHOOK_SECRET (or create your own)
openssl rand -hex 20
```

## Troubleshooting

### Common Issues:

1. **"Invalid keyData"**: Private key format is wrong
   - Make sure newlines are escaped as `\n`
   - Ensure the key starts with `-----BEGIN` and ends with `-----END`

2. **"Failed to read private key"**:
   - Check if the `.pem` file is corrupted
   - Regenerate the private key from GitHub App settings

3. **"Missing signature"**: Webhook secret doesn't match
   - Ensure GITHUB_WEBHOOK_SECRET matches what you set in GitHub App settings

### Debug Commands:

```bash
# Check if your private key is properly formatted
echo $GITHUB_PRIVATE_KEY | head -c 50

# Verify other environment variables are set
echo "App ID: $GITHUB_APP_ID"
echo "Has Private Key: $(test -n "$GITHUB_PRIVATE_KEY" && echo "Yes" || echo "No")"
echo "Has Webhook Secret: $(test -n "$GITHUB_WEBHOOK_SECRET" && echo "Yes" || echo "No")"
```

## For Local Development with External Webhooks

If you want to test webhooks locally, use ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Update your GitHub App webhook URL to the ngrok URL
# e.g., https://abc123.ngrok.io/api/webhook/github
```
