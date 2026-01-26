#!/bin/bash
# =============================================================================
# App Factory v4.0 - FULLY AUTOMATED Setup Script
# =============================================================================
# ONE COMMAND TO RULE THEM ALL
# Run: curl -sSL https://raw.githubusercontent.com/aharwelik/v4.0-autonomous-factory/main/scripts/setup.sh | bash
# Or:  chmod +x setup.sh && ./setup.sh
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }
print_header() { echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"; echo -e "${CYAN}  $1${NC}"; echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}\n"; }

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo ""
echo "  ██████╗ ██████╗ ██████╗     ███████╗ █████╗  ██████╗████████╗ ██████╗ ██████╗ ██╗   ██╗"
echo "  ██╔══██╗██╔══██╗██╔══██╗    ██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗╚██╗ ██╔╝"
echo "  ███████║██████╔╝██████╔╝    █████╗  ███████║██║        ██║   ██║   ██║██████╔╝ ╚████╔╝ "
echo "  ██╔══██║██╔═══╝ ██╔═══╝     ██╔══╝  ██╔══██║██║        ██║   ██║   ██║██╔══██╗  ╚██╔╝  "
echo "  ██║  ██║██║     ██║         ██║     ██║  ██║╚██████╗   ██║   ╚██████╔╝██║  ██║   ██║   "
echo "  ╚═╝  ╚═╝╚═╝     ╚═╝         ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝   ╚═╝   "
echo ""
echo "  Autonomous App Factory v4.0 - FULLY AUTOMATED SETUP"
echo ""

# =============================================================================
# STEP 1: PREREQUISITES
# =============================================================================
print_header "STEP 1: Checking Prerequisites"

# Check OS
OS="$(uname -s)"
case "$OS" in
    Linux*)     OS_TYPE=Linux;;
    Darwin*)    OS_TYPE=Mac;;
    CYGWIN*|MINGW*) OS_TYPE=Windows;;
    *)          OS_TYPE="Unknown";;
esac
print_success "Detected OS: $OS_TYPE"

# Check/Install Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1)
    if [ "$NODE_MAJOR" -ge 18 ]; then
        print_success "Node.js $NODE_VERSION installed"
    else
        print_warning "Node.js $NODE_VERSION is old. Upgrading..."
        if [ "$OS_TYPE" = "Mac" ]; then
            brew install node@20 || curl -fsSL https://fnm.vercel.app/install | bash && fnm install 20
        else
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs
        fi
    fi
else
    print_status "Installing Node.js..."
    if [ "$OS_TYPE" = "Mac" ]; then
        if command -v brew &> /dev/null; then
            brew install node
        else
            curl -fsSL https://fnm.vercel.app/install | bash
            source ~/.bashrc 2>/dev/null || source ~/.zshrc 2>/dev/null
            fnm install 20
        fi
    else
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    print_success "Node.js installed"
fi

# Check/Install Git
if command -v git &> /dev/null; then
    print_success "Git installed: $(git --version | cut -d' ' -f3)"
else
    print_status "Installing Git..."
    if [ "$OS_TYPE" = "Mac" ]; then
        xcode-select --install 2>/dev/null || brew install git
    else
        sudo apt-get install -y git
    fi
fi

# =============================================================================
# STEP 2: INSTALL GLOBAL TOOLS
# =============================================================================
print_header "STEP 2: Installing Global Tools"

# Install Claude Code
if command -v claude &> /dev/null; then
    print_success "Claude Code already installed"
else
    print_status "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code
    print_success "Claude Code installed"
fi

# Install n8n globally
if command -v n8n &> /dev/null; then
    print_success "n8n already installed"
else
    print_status "Installing n8n (workflow automation)..."
    npm install -g n8n
    print_success "n8n installed"
fi

# Install PM2 for process management
if command -v pm2 &> /dev/null; then
    print_success "PM2 already installed"
else
    print_status "Installing PM2 (process manager)..."
    npm install -g pm2
    print_success "PM2 installed"
fi

# =============================================================================
# STEP 3: PROJECT DEPENDENCIES
# =============================================================================
print_header "STEP 3: Installing Project Dependencies"

# Dashboard dependencies
if [ -d "dashboard" ]; then
    print_status "Installing dashboard dependencies..."
    cd dashboard
    npm install
    cd "$PROJECT_ROOT"
    print_success "Dashboard dependencies installed"
fi

# =============================================================================
# STEP 4: ENVIRONMENT SETUP
# =============================================================================
print_header "STEP 4: Environment Configuration"

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    print_status "Creating .env file..."
    cat > .env << 'ENVEOF'
# =============================================================================
# APP FACTORY v4.0 - ENVIRONMENT CONFIGURATION
# =============================================================================
# Fill in your API keys below. Most have FREE tiers!
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# AI PROVIDERS (at least one required)
# ─────────────────────────────────────────────────────────────────────────────

# Google Gemini - FREE! (1M tokens/day)
# Get at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=

# Anthropic Claude - $5 free credit
# Get at: https://console.anthropic.com
ANTHROPIC_API_KEY=

# ─────────────────────────────────────────────────────────────────────────────
# DEPLOYMENT (required for deploying apps)
# ─────────────────────────────────────────────────────────────────────────────

# Vercel - FREE unlimited deploys
# Get at: https://vercel.com/account/tokens
VERCEL_TOKEN=

# ─────────────────────────────────────────────────────────────────────────────
# DATABASE (required for persistence)
# ─────────────────────────────────────────────────────────────────────────────

# Neon - FREE 512MB PostgreSQL
# Get at: https://console.neon.tech
DATABASE_URL=

# ─────────────────────────────────────────────────────────────────────────────
# AUTHENTICATION (required for user auth)
# ─────────────────────────────────────────────────────────────────────────────

# Clerk - FREE 10,000 users
# Get at: https://dashboard.clerk.com
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATIONS (optional but recommended)
# ─────────────────────────────────────────────────────────────────────────────

# Telegram - FREE unlimited
# Get at: https://t.me/BotFather
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# ─────────────────────────────────────────────────────────────────────────────
# PAYMENTS (optional)
# ─────────────────────────────────────────────────────────────────────────────

# Stripe - No monthly fee
# Get at: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# ─────────────────────────────────────────────────────────────────────────────
# ANALYTICS (optional)
# ─────────────────────────────────────────────────────────────────────────────

# PostHog - FREE 1M events/month
# Get at: https://app.posthog.com
POSTHOG_API_KEY=

# ─────────────────────────────────────────────────────────────────────────────
# EMAIL (optional)
# ─────────────────────────────────────────────────────────────────────────────

# Resend - FREE 100 emails/day
# Get at: https://resend.com
RESEND_API_KEY=

# ─────────────────────────────────────────────────────────────────────────────
# SETTINGS
# ─────────────────────────────────────────────────────────────────────────────
MONTHLY_BUDGET=50
NODE_ENV=development

ENVEOF
    print_warning "Created .env - Please add your API keys!"
else
    print_success ".env file exists"
fi

# Create data directories
mkdir -p data/n8n
mkdir -p data/logs
mkdir -p data/backups

# =============================================================================
# STEP 5: N8N CONFIGURATION
# =============================================================================
print_header "STEP 5: Configuring n8n Workflows"

# Create n8n ecosystem config for PM2
cat > ecosystem.config.js << 'PMEOF'
module.exports = {
  apps: [
    {
      name: 'n8n',
      script: 'n8n',
      args: 'start',
      env: {
        N8N_PORT: 5678,
        N8N_PROTOCOL: 'http',
        N8N_HOST: 'localhost',
        GENERIC_TIMEZONE: 'America/New_York',
        N8N_USER_FOLDER: './data/n8n',
        N8N_TEMPLATES_ENABLED: 'true',
        N8N_DIAGNOSTICS_ENABLED: 'false',
        N8N_PERSONALIZATION_ENABLED: 'false',
      },
    },
    {
      name: 'dashboard',
      cwd: './dashboard',
      script: 'npm',
      args: 'run dev',
      env: {
        PORT: 3000,
      },
    },
  ],
};
PMEOF
print_success "PM2 ecosystem config created"

# Create n8n startup script that imports workflows
cat > scripts/start-n8n.sh << 'N8NEOF'
#!/bin/bash
# Start n8n and auto-import workflows

cd "$(dirname "$0")/.."

# Start n8n in background
n8n start &
N8N_PID=$!

# Wait for n8n to be ready
echo "Waiting for n8n to start..."
for i in {1..30}; do
    if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
        echo "n8n is ready!"
        break
    fi
    sleep 1
done

# Import workflows if n8n is running
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    echo "Importing workflows..."

    # Import each workflow
    for workflow in workflows/n8n-templates/*.json; do
        if [ -f "$workflow" ]; then
            echo "Importing: $workflow"
            curl -s -X POST "http://localhost:5678/api/v1/workflows" \
                -H "Content-Type: application/json" \
                -d @"$workflow" > /dev/null 2>&1 || true
        fi
    done

    echo "Workflows imported!"
fi

# Keep n8n running
wait $N8N_PID
N8NEOF
chmod +x scripts/start-n8n.sh
print_success "n8n startup script created"

# =============================================================================
# STEP 6: CREATE CONVENIENCE SCRIPTS
# =============================================================================
print_header "STEP 6: Creating Convenience Scripts"

# Start everything script
cat > start.sh << 'STARTEOF'
#!/bin/bash
# Start the entire App Factory system

cd "$(dirname "$0")"

echo "🏭 Starting App Factory v4.0..."
echo ""

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Start with PM2
pm2 start ecosystem.config.js

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🚀 App Factory is running!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Dashboard:  http://localhost:3000"
echo "  n8n:        http://localhost:5678"
echo ""
echo "  Commands:"
echo "    pm2 logs          - View all logs"
echo "    pm2 logs dashboard - View dashboard logs"
echo "    pm2 logs n8n      - View n8n logs"
echo "    pm2 stop all      - Stop everything"
echo "    pm2 restart all   - Restart everything"
echo ""
STARTEOF
chmod +x start.sh

# Stop script
cat > stop.sh << 'STOPEOF'
#!/bin/bash
pm2 stop all
echo "🏭 App Factory stopped"
STOPEOF
chmod +x stop.sh

# Status script
cat > status.sh << 'STATUSEOF'
#!/bin/bash
echo "🏭 App Factory Status"
echo "═══════════════════════════════════════════════════════════"
pm2 status
echo ""
echo "Services:"
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "  ✓ Dashboard: http://localhost:3000" || echo "  ✗ Dashboard: Not running"
curl -s http://localhost:5678/healthz > /dev/null 2>&1 && echo "  ✓ n8n: http://localhost:5678" || echo "  ✗ n8n: Not running"
STATUSEOF
chmod +x status.sh

print_success "Convenience scripts created: start.sh, stop.sh, status.sh"

# =============================================================================
# STEP 7: HEALTH CHECK
# =============================================================================
print_header "STEP 7: Running Health Check"

# Update health check script
cat > scripts/health-check.sh << 'HEALTHEOF'
#!/bin/bash
# App Factory v4.0 - System Health Check

cd "$(dirname "$0")/.."

echo ""
echo "🏭 App Factory Health Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "Services:"
echo "─────────"

# Check Dashboard
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✓ Dashboard: Running (http://localhost:3000)"
else
    echo "  ✗ Dashboard: Not running"
fi

# Check n8n
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    echo "  ✓ n8n: Running (http://localhost:5678)"
else
    echo "  ✗ n8n: Not running"
fi

echo ""
echo "API Keys:"
echo "─────────"

# Check Gemini (FREE)
if [ -n "$GEMINI_API_KEY" ]; then
    RESULT=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY" 2>/dev/null)
    [ "$RESULT" = "200" ] && echo "  ✓ Gemini: Valid (FREE)" || echo "  ✗ Gemini: Invalid"
else
    echo "  - Gemini: Not configured"
fi

# Check Anthropic
if [ -n "$ANTHROPIC_API_KEY" ]; then
    RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://api.anthropic.com/v1/messages \
        -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" \
        -H "Content-Type: application/json" \
        -d '{"model":"claude-3-haiku-20240307","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}' 2>/dev/null)
    [ "$RESULT" = "200" ] && echo "  ✓ Anthropic: Valid" || echo "  ✗ Anthropic: Invalid"
else
    echo "  - Anthropic: Not configured"
fi

# Check Vercel
if [ -n "$VERCEL_TOKEN" ]; then
    RESULT=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v2/user" 2>/dev/null)
    [ "$RESULT" = "200" ] && echo "  ✓ Vercel: Valid" || echo "  ✗ Vercel: Invalid"
else
    echo "  - Vercel: Not configured"
fi

# Check Telegram
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    RESULT=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" 2>/dev/null)
    [ "$RESULT" = "200" ] && echo "  ✓ Telegram: Valid" || echo "  ✗ Telegram: Invalid"
else
    echo "  - Telegram: Not configured"
fi

echo ""
echo "System:"
echo "─────────"

# Disk space
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | tr -d '%')
[ "$DISK_USAGE" -lt 80 ] && echo "  ✓ Disk: ${DISK_USAGE}% used" || echo "  ! Disk: ${DISK_USAGE}% used (LOW)"

# Memory
if command -v free &> /dev/null; then
    MEM=$(free -m | awk 'NR==2{printf "%.0f", $3*100/$2}')
    echo "  ✓ Memory: ${MEM}% used"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
HEALTHEOF
chmod +x scripts/health-check.sh

./scripts/health-check.sh

# =============================================================================
# COMPLETE
# =============================================================================
print_header "SETUP COMPLETE!"

echo "
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   🎉 App Factory v4.0 is ready!                             │
  │                                                             │
  │   NEXT STEPS:                                               │
  │                                                             │
  │   1. Add your API keys to .env                              │
  │      (Gemini is FREE - highly recommended!)                 │
  │                                                             │
  │   2. Start the factory:                                     │
  │      ./start.sh                                             │
  │                                                             │
  │   3. Open the dashboard:                                    │
  │      http://localhost:3000                                  │
  │                                                             │
  │   4. Type your app idea and watch it build!                 │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

  Quick Commands:
  ─────────────────────────────────────────────────────────────
  ./start.sh              Start everything
  ./stop.sh               Stop everything
  ./status.sh             Check status
  ./scripts/health-check.sh  Full health check
  claude                  Open Claude Code

  Documentation:
  ─────────────────────────────────────────────────────────────
  CLAUDE.md               Main blueprint (read this!)
  docs/SETUP-GUIDE.md     Detailed setup guide
  docs/TROUBLESHOOTING.md Common issues
"

print_success "Happy building! 🚀"
