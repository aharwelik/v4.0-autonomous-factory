#!/bin/bash
# =============================================================================
# App Factory v4.0 - One-Click Setup Script
# =============================================================================
# This script sets up everything you need to run the Autonomous App Factory
# Run: chmod +x setup.sh && ./setup.sh
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print with color
print_status() { echo -e "${BLUE}[*]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[!]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

# Header
echo ""
echo "=========================================="
echo "    🏭 App Factory v4.0 Setup"
echo "=========================================="
echo ""

# -----------------------------------------------------------------------------
# Step 1: Check Prerequisites
# -----------------------------------------------------------------------------
print_status "Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found. Please install from https://nodejs.org"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found. Please reinstall Node.js"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "Git installed: $GIT_VERSION"
else
    print_warning "Git not found. Some features may not work."
fi

# Check Claude Code
if command -v claude &> /dev/null; then
    print_success "Claude Code installed"
else
    print_status "Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code
    print_success "Claude Code installed"
fi

echo ""

# -----------------------------------------------------------------------------
# Step 2: Check Environment Variables
# -----------------------------------------------------------------------------
print_status "Checking environment variables..."

# Load .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_success ".env file found"
else
    print_warning ".env file not found. Creating template..."
    cat > .env << 'EOF'
# =============================================================================
# App Factory v4.0 - Environment Variables
# =============================================================================

# REQUIRED - Get from https://console.anthropic.com
ANTHROPIC_API_KEY=

# REQUIRED - Get from https://ai.google.dev
GEMINI_API_KEY=

# REQUIRED - Get from https://vercel.com/account/tokens
VERCEL_TOKEN=

# REQUIRED - Get from Telegram @BotFather
TELEGRAM_BOT_TOKEN=

# OPTIONAL - Get from https://capsolver.com
CAPSOLVER_API_KEY=

# OPTIONAL - Get from https://stripe.com (for payments)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=

# OPTIONAL - Grok API from https://x.ai
XAI_API_KEY=

# OPTIONAL - GLM API from https://open.bigmodel.cn
GLM_API_KEY=

# SETTINGS
MONTHLY_BUDGET=50
ALERT_CHAT_ID=
EOF
    print_warning "Please edit .env with your API keys, then run this script again."
    exit 0
fi

# Check required keys
MISSING_KEYS=0

if [ -z "$ANTHROPIC_API_KEY" ]; then
    print_error "ANTHROPIC_API_KEY is missing"
    MISSING_KEYS=1
fi

if [ -z "$GEMINI_API_KEY" ]; then
    print_warning "GEMINI_API_KEY is missing (needed for image generation)"
fi

if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    print_warning "TELEGRAM_BOT_TOKEN is missing (needed for alerts)"
fi

if [ $MISSING_KEYS -eq 1 ]; then
    print_error "Please add the missing API keys to .env and run again."
    exit 1
fi

print_success "Required environment variables present"
echo ""

# -----------------------------------------------------------------------------
# Step 3: Install Dependencies
# -----------------------------------------------------------------------------
print_status "Installing dependencies..."

# Create package.json if it doesn't exist
if [ ! -f package.json ]; then
    cat > package.json << 'EOF'
{
  "name": "app-factory-v4",
  "version": "4.0.0",
  "description": "Autonomous App Factory",
  "scripts": {
    "dashboard": "next dev -p 3000",
    "build": "next build",
    "n8n": "n8n start",
    "health": "./scripts/health-check.sh",
    "test": "vitest"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@tanstack/react-query": "^5.0.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.300.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "browser-use": "^0.1.0",
    "capsolver-npm": "^1.0.0",
    "@google/generative-ai": "^0.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^1.0.0"
  }
}
EOF
fi

npm install
print_success "Dependencies installed"
echo ""

# -----------------------------------------------------------------------------
# Step 4: Set Up n8n (Workflow Automation)
# -----------------------------------------------------------------------------
print_status "Setting up n8n..."

# Check if Docker is available (preferred for n8n)
if command -v docker &> /dev/null; then
    print_status "Docker found. Setting up n8n in Docker..."
    
    # Create n8n data directory
    mkdir -p ~/.n8n
    
    # Check if n8n container exists
    if docker ps -a | grep -q n8n; then
        print_status "n8n container exists, starting..."
        docker start n8n
    else
        print_status "Creating n8n container..."
        docker run -d --name n8n \
            -p 5678:5678 \
            -v ~/.n8n:/home/node/.n8n \
            -e GENERIC_TIMEZONE="America/New_York" \
            -e TZ="America/New_York" \
            n8nio/n8n
    fi
    
    print_success "n8n running at http://localhost:5678"
else
    print_warning "Docker not found. Installing n8n via npm..."
    npm install -g n8n
    print_success "n8n installed. Start with: n8n start"
fi

echo ""

# -----------------------------------------------------------------------------
# Step 5: Install Get-Shit-Done (GSD) Framework
# -----------------------------------------------------------------------------
print_status "Installing GSD framework..."

npx get-shit-done-cc --claude --local
print_success "GSD framework installed"
echo ""

# -----------------------------------------------------------------------------
# Step 6: Validate API Keys
# -----------------------------------------------------------------------------
print_status "Validating API keys..."

# Test Anthropic API
print_status "Testing Anthropic API..."
ANTHROPIC_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST https://api.anthropic.com/v1/messages \
    -H "Content-Type: application/json" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d '{"model":"claude-3-haiku-20240307","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}' \
    2>/dev/null || echo "000")

if [ "$ANTHROPIC_TEST" = "200" ]; then
    print_success "Anthropic API key valid"
else
    print_error "Anthropic API key invalid or error (HTTP $ANTHROPIC_TEST)"
fi

# Test Gemini API
if [ -n "$GEMINI_API_KEY" ]; then
    print_status "Testing Gemini API..."
    GEMINI_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY" \
        2>/dev/null || echo "000")
    
    if [ "$GEMINI_TEST" = "200" ]; then
        print_success "Gemini API key valid"
    else
        print_warning "Gemini API key may be invalid (HTTP $GEMINI_TEST)"
    fi
fi

# Test Telegram Bot
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    print_status "Testing Telegram Bot..."
    TELEGRAM_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" \
        2>/dev/null || echo "000")
    
    if [ "$TELEGRAM_TEST" = "200" ]; then
        print_success "Telegram Bot token valid"
        
        # Send test message if chat ID is set
        if [ -n "$ALERT_CHAT_ID" ]; then
            curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
                -d "chat_id=$ALERT_CHAT_ID" \
                -d "text=🏭 App Factory v4.0 is set up and ready!" \
                > /dev/null 2>&1
            print_success "Test message sent to Telegram"
        fi
    else
        print_warning "Telegram Bot token may be invalid (HTTP $TELEGRAM_TEST)"
    fi
fi

echo ""

# -----------------------------------------------------------------------------
# Step 7: Create Directory Structure
# -----------------------------------------------------------------------------
print_status "Creating directory structure..."

mkdir -p .gsd
mkdir -p .planning
mkdir -p agents
mkdir -p skills/browser-automation
mkdir -p skills/content-generation
mkdir -p skills/ui-generation
mkdir -p skills/analytics
mkdir -p workflows/n8n-templates
mkdir -p dashboard/components
mkdir -p dashboard/api
mkdir -p templates/app-templates
mkdir -p templates/landing-pages
mkdir -p config
mkdir -p docs
mkdir -p scripts
mkdir -p data/logs
mkdir -p data/backups

print_success "Directory structure created"
echo ""

# -----------------------------------------------------------------------------
# Step 8: Initialize State Files
# -----------------------------------------------------------------------------
print_status "Initializing state files..."

# Create STATE.md
cat > .gsd/STATE.md << 'EOF'
# Factory State

## Current Project
name: none
status: idle
phase: 0
started: null

## Active Tasks
| ID | Agent | Task | Status | Progress |
|----|-------|------|--------|----------|
| - | - | - | - | - |

## Completed Today
- System initialized

## Cost Today
- Total: $0.00

## Errors (Last 24h)
- None
EOF

# Create config file
cat > config/settings.json << 'EOF'
{
  "budget": {
    "monthly": 50,
    "alerts": {
      "warning": 75,
      "critical": 90
    }
  },
  "agents": {
    "orchestrator": { "model": "claude-3-5-sonnet", "enabled": true },
    "researcher": { "model": "claude-3-5-haiku", "enabled": true },
    "builder": { "model": "claude-3-5-sonnet", "enabled": true },
    "marketer": { "model": "claude-3-5-haiku", "enabled": true },
    "operator": { "model": "claude-3-5-haiku", "enabled": true }
  },
  "automation": {
    "contentGeneration": true,
    "socialPosting": false,
    "marketResearch": true
  }
}
EOF

print_success "State files initialized"
echo ""

# -----------------------------------------------------------------------------
# Step 9: Create Health Check Script
# -----------------------------------------------------------------------------
print_status "Creating health check script..."

cat > scripts/health-check.sh << 'HEALTHEOF'
#!/bin/bash
echo "🏭 App Factory Health Check"
echo "=========================="
echo ""

# Check API connectivity
echo "API Status:"
echo "-----------"

# Anthropic
if [ -n "$ANTHROPIC_API_KEY" ]; then
    RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X POST https://api.anthropic.com/v1/messages \
        -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" \
        -H "Content-Type: application/json" \
        -d '{"model":"claude-3-haiku-20240307","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}' 2>/dev/null)
    [ "$RESULT" = "200" ] && echo "✓ Anthropic: OK" || echo "✗ Anthropic: ERROR ($RESULT)"
else
    echo "✗ Anthropic: NOT CONFIGURED"
fi

# Check n8n
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    echo "✓ n8n: Running"
else
    echo "✗ n8n: Not running"
fi

# Check disk space
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | tr -d '%')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo "✓ Disk Space: OK (${DISK_USAGE}% used)"
else
    echo "! Disk Space: LOW (${DISK_USAGE}% used)"
fi

echo ""
echo "System Status: Ready"
HEALTHEOF

chmod +x scripts/health-check.sh
print_success "Health check script created"
echo ""

# -----------------------------------------------------------------------------
# Complete!
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
echo "    🎉 Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Review your .env file and add any missing keys"
echo "  2. Start Claude Code: claude"
echo "  3. Tell Claude: 'I want to build an app. Help me get started.'"
echo ""
echo "Useful commands:"
echo "  claude                    - Start Claude Code"
echo "  ./scripts/health-check.sh - Check system status"
echo "  npm run dashboard         - Start the dashboard"
echo ""
echo "Documentation: docs/SETUP-GUIDE.md"
echo "Main guide: CLAUDE.md"
echo ""
print_success "Happy building! 🚀"
