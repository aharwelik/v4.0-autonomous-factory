# Troubleshooting Guide
## Common Issues and Solutions

This guide covers the most common problems you might encounter while using the App Factory.

---

## Quick Diagnosis

Run the health check script first:

```bash
./scripts/health-check.sh
```

This will identify most configuration issues automatically.

---

## Installation Issues

### "command not found: claude"

**Problem**: Claude Code CLI is not installed or not in PATH.

**Solution**:
```bash
# Reinstall Claude Code
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code

# Verify installation
which claude
claude --version

# If still not found, check npm global path
npm config get prefix
# Add the bin folder to your PATH
```

### "npm install fails with EACCES"

**Problem**: Permission issues with npm global packages.

**Solution**:
```bash
# Option 1: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# Option 2: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### "Node version too old"

**Problem**: Factory requires Node.js 18+.

**Solution**:
```bash
# Check current version
node --version

# Install latest LTS via nvm
nvm install --lts
nvm use --lts

# Or via Homebrew (Mac)
brew install node@20
```

---

## API Key Issues

### "Invalid API key" for Anthropic

**Problem**: Claude API key is incorrect or expired.

**Solution**:
1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Update your `.env` file:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ```
4. Make sure there are no extra spaces or quotes

### "Gemini API returns 403"

**Problem**: API key is invalid or quota exceeded.

**Solution**:
```bash
# Check your quota at Google Cloud Console
# Or create a new key at https://ai.google.dev

# Verify key works
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_KEY"
```

### "Vercel deployment fails with 401"

**Problem**: Vercel token is invalid.

**Solution**:
```bash
# Re-authenticate with Vercel
vercel logout
vercel login

# Or create new token at vercel.com/account/tokens
# Update VERCEL_TOKEN in .env
```

### "Telegram bot not responding"

**Problem**: Bot token is wrong or bot wasn't started.

**Solution**:
1. Message @BotFather on Telegram
2. Send `/mybots` to see your bots
3. Verify the token matches your `.env`
4. Send a message to your bot first
5. Get your chat ID:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getUpdates"
   # Look for "chat":{"id": YOUR_CHAT_ID
   ```

---

## Build Issues

### "v0 generation times out"

**Problem**: Vercel v0 API is slow or overloaded.

**Solution**:
```javascript
// Increase timeout in your config
const V0_TIMEOUT = 120000; // 2 minutes

// Or try breaking down the request into smaller components
// Instead of: "Generate a complete dashboard"
// Try: "Generate just the header component"
```

### "Database connection failed"

**Problem**: DATABASE_URL is incorrect or database is unreachable.

**Solution**:
```bash
# Test connection manually
# For Neon:
psql "postgresql://user:pass@host/db?sslmode=require"

# For Supabase:
psql "postgresql://postgres:pass@host:5432/postgres"

# Common fixes:
# 1. Check SSL mode (usually sslmode=require)
# 2. Whitelist your IP in database settings
# 3. Verify username/password
```

### "Drizzle push fails"

**Problem**: Schema migration issues.

**Solution**:
```bash
# Generate migration first
npx drizzle-kit generate:pg

# Check what will change
npx drizzle-kit check:pg

# Force push (careful - can lose data)
npx drizzle-kit push:pg --force

# If schema is completely broken, drop and recreate
npx drizzle-kit drop
npx drizzle-kit push:pg
```

### "TypeScript compilation errors"

**Problem**: Type mismatches or missing types.

**Solution**:
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Check for type errors
npm run typecheck
# or
npx tsc --noEmit
```

---

## Browser Automation Issues

### "CAPTCHA keeps appearing"

**Problem**: Bot detection is triggering CAPTCHAs.

**Solution**:
1. Enable stealth mode in browser config:
   ```javascript
   const browser = await Browser.launch({
     stealth: true,
     args: ['--disable-blink-features=AutomationControlled']
   });
   ```

2. Use residential proxies instead of datacenter

3. Add realistic delays:
   ```javascript
   await page.waitForTimeout(Math.random() * 2000 + 1000);
   ```

4. If CAPTCHAs persist, use CapSolver:
   ```bash
   # Check CapSolver balance
   curl https://api.capsolver.com/getBalance \
     -d '{"clientKey":"YOUR_KEY"}'
   ```

### "Browser Use crashes"

**Problem**: Browser automation fails unexpectedly.

**Solution**:
```bash
# Update browser-use
npm update browser-use

# Install Chromium dependencies (Linux)
npx playwright install-deps

# Run with debugging
DEBUG=browser-use* node your-script.js

# Try headful mode for debugging
const browser = await Browser.launch({ headless: false });
```

### "Proxy connection refused"

**Problem**: Proxy configuration is incorrect.

**Solution**:
```javascript
// Verify proxy format
const proxy = {
  server: 'http://proxy-host:port',
  username: 'user',
  password: 'pass'
};

// Test proxy independently
curl -x http://user:pass@host:port https://httpbin.org/ip
```

---

## Agent Issues

### "Agent stuck in loop"

**Problem**: Agent keeps repeating the same action.

**Solution**:
```bash
# Check agent state
cat .gsd/STATE.md

# Reset specific agent
rm .gsd/agents/researcher/state.json

# Reset all state (nuclear option)
rm -rf .gsd
```

### "Agent not responding"

**Problem**: Agent appears frozen or unresponsive.

**Solution**:
1. Check if rate-limited:
   ```bash
   # Look for rate limit errors in logs
   grep -i "rate" .gsd/logs/*.log
   ```

2. Check API status:
   - Anthropic: https://status.anthropic.com
   - OpenAI: https://status.openai.com

3. Restart Claude Code session:
   ```bash
   # Exit current session
   /exit

   # Start fresh
   claude
   ```

### "Out of context window"

**Problem**: Conversation too long for model context.

**Solution**:
- Claude Code handles this automatically with summarization
- If manual, start a new session with key context
- Break large tasks into smaller subtasks

---

## Deployment Issues

### "Vercel build fails"

**Problem**: Build errors during deployment.

**Solution**:
```bash
# Test build locally first
npm run build

# Check for environment variables
vercel env ls

# Pull env vars locally for testing
vercel env pull .env.local

# Force rebuild
vercel --force

# Check build logs
vercel logs [deployment-url]
```

### "Environment variables not working"

**Problem**: Env vars not available in deployed app.

**Solution**:
```bash
# Add variables via CLI
vercel env add VARIABLE_NAME production

# Or via dashboard: vercel.com > project > settings > env

# Remember: Client-side vars need NEXT_PUBLIC_ prefix
NEXT_PUBLIC_STRIPE_KEY=pk_xxx  # Available in browser
STRIPE_SECRET_KEY=sk_xxx       # Server only
```

### "Domain not resolving"

**Problem**: Custom domain shows error.

**Solution**:
1. Check DNS propagation: https://dnschecker.org
2. Verify DNS records in Vercel dashboard
3. Wait up to 48 hours for propagation
4. Check for conflicting records
5. Try clearing DNS cache:
   ```bash
   # Mac
   sudo dscacheutil -flushcache

   # Windows
   ipconfig /flushdns
   ```

---

## Cost & Budget Issues

### "Budget exceeded unexpectedly"

**Problem**: Spending more than expected.

**Solution**:
1. Check cost breakdown:
   ```bash
   # View costs in dashboard
   /costs

   # Or check .gsd/costs/daily.json
   ```

2. Identify expensive operations:
   - Large context windows (use Haiku for simple tasks)
   - Excessive image generation
   - Too many parallel agents

3. Adjust settings in `config/budget-limits.json`

### "Rate limited by API"

**Problem**: Too many requests to an API.

**Solution**:
```javascript
// Add exponential backoff
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.status === 429) {
        await sleep(Math.pow(2, i) * 1000);
      } else {
        throw e;
      }
    }
  }
}

// Reduce parallelism in agent-settings.json
{
  "parallelism": {
    "max_concurrent_agents": 2  // Reduce from default
  }
}
```

---

## Getting More Help

### 1. Ask Claude Code

```bash
claude "I'm getting this error: [paste error]. How do I fix it?"
```

### 2. Check Logs

```bash
# Agent logs
cat .gsd/logs/*.log | tail -100

# System health
./scripts/health-check.sh
```

### 3. Reset and Retry

```bash
# Soft reset (keeps config)
rm -rf .gsd/state/*

# Hard reset (fresh start)
rm -rf .gsd
rm -rf node_modules
npm install
```

### 4. Common Log Locations

| Log Type | Location |
|----------|----------|
| Agent activity | `.gsd/logs/agent-*.log` |
| Build errors | `.next/trace` |
| Vercel deploys | `vercel logs` |
| Cost tracking | `.gsd/costs/` |

---

## Error Reference

| Error Code | Meaning | Quick Fix |
|------------|---------|-----------|
| `ECONNREFUSED` | Can't connect to service | Check if service is running |
| `ETIMEDOUT` | Connection timed out | Check network, try again |
| `401` | Unauthorized | Check API key |
| `403` | Forbidden | Check permissions/quota |
| `429` | Rate limited | Wait and retry with backoff |
| `500` | Server error | External service issue |
| `ENOENT` | File not found | Check file path |
| `EACCES` | Permission denied | Check file permissions |

---

*Troubleshooting Guide v4.0 - When things go wrong*
