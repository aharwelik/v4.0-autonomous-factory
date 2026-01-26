#!/bin/bash

# ============================================================================
# App Factory Health Check Script
# Validates all components and API connections
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Print functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_check() {
    echo -n "  Checking $1... "
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

# ============================================================================
# Environment File Check
# ============================================================================

print_header "Environment Configuration"

if [ -f ".env" ]; then
    print_pass ".env file exists"
    source .env 2>/dev/null || print_warn "Could not source .env file"
else
    print_fail ".env file not found"
    echo "    Create .env from config/api-keys.env.template"
fi

# ============================================================================
# Required API Keys Check
# ============================================================================

print_header "API Keys Validation"

check_api_key() {
    local key_name=$1
    local key_value=$2
    local required=$3

    print_check "$key_name"

    if [ -z "$key_value" ]; then
        if [ "$required" = "required" ]; then
            print_fail "Not set (REQUIRED)"
        else
            print_warn "Not set (optional)"
        fi
    else
        # Check key format (basic validation)
        local key_length=${#key_value}
        if [ $key_length -lt 10 ]; then
            print_fail "Key appears invalid (too short)"
        else
            print_pass "Set ($key_length chars)"
        fi
    fi
}

check_api_key "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY" "required"
check_api_key "GEMINI_API_KEY" "$GEMINI_API_KEY" "required"
check_api_key "VERCEL_TOKEN" "$VERCEL_TOKEN" "required"
check_api_key "TELEGRAM_BOT_TOKEN" "$TELEGRAM_BOT_TOKEN" "required"
check_api_key "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "optional"
check_api_key "STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY" "optional"
check_api_key "CAPSOLVER_API_KEY" "$CAPSOLVER_API_KEY" "optional"
check_api_key "POSTHOG_API_KEY" "$POSTHOG_API_KEY" "optional"
check_api_key "DATABASE_URL" "$DATABASE_URL" "optional"
check_api_key "RESEND_API_KEY" "$RESEND_API_KEY" "optional"

# ============================================================================
# API Connectivity Tests
# ============================================================================

print_header "API Connectivity Tests"

# Test Anthropic API
print_check "Anthropic API"
if [ -n "$ANTHROPIC_API_KEY" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        https://api.anthropic.com/v1/messages 2>/dev/null || echo "000")

    if [ "$response" = "400" ] || [ "$response" = "401" ] || [ "$response" = "200" ]; then
        # 400 is expected without a body, 401 means key invalid
        if [ "$response" = "401" ]; then
            print_fail "Invalid API key"
        else
            print_pass "Connected"
        fi
    else
        print_fail "Connection failed (HTTP $response)"
    fi
else
    print_fail "Key not set"
fi

# Test Gemini API
print_check "Gemini API"
if [ -n "$GEMINI_API_KEY" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        "https://generativelanguage.googleapis.com/v1/models?key=$GEMINI_API_KEY" 2>/dev/null || echo "000")

    if [ "$response" = "200" ]; then
        print_pass "Connected"
    elif [ "$response" = "400" ] || [ "$response" = "403" ]; then
        print_fail "Invalid API key"
    else
        print_fail "Connection failed (HTTP $response)"
    fi
else
    print_fail "Key not set"
fi

# Test Vercel API
print_check "Vercel API"
if [ -n "$VERCEL_TOKEN" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $VERCEL_TOKEN" \
        https://api.vercel.com/v2/user 2>/dev/null || echo "000")

    if [ "$response" = "200" ]; then
        print_pass "Connected"
    elif [ "$response" = "401" ] || [ "$response" = "403" ]; then
        print_fail "Invalid token"
    else
        print_fail "Connection failed (HTTP $response)"
    fi
else
    print_fail "Key not set"
fi

# Test Telegram Bot
print_check "Telegram Bot"
if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
    response=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" 2>/dev/null)

    if echo "$response" | grep -q '"ok":true'; then
        bot_name=$(echo "$response" | grep -o '"username":"[^"]*"' | cut -d'"' -f4)
        print_pass "Connected (@$bot_name)"
    else
        print_fail "Invalid bot token"
    fi
else
    print_fail "Key not set"
fi

# Test Stripe (if configured)
print_check "Stripe API"
if [ -n "$STRIPE_SECRET_KEY" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -u "$STRIPE_SECRET_KEY:" \
        https://api.stripe.com/v1/balance 2>/dev/null || echo "000")

    if [ "$response" = "200" ]; then
        print_pass "Connected"
    elif [ "$response" = "401" ]; then
        print_fail "Invalid API key"
    else
        print_fail "Connection failed (HTTP $response)"
    fi
else
    print_warn "Not configured"
fi

# ============================================================================
# System Dependencies
# ============================================================================

print_header "System Dependencies"

# Node.js
print_check "Node.js"
if command -v node &> /dev/null; then
    version=$(node --version)
    major_version=$(echo $version | cut -d'.' -f1 | sed 's/v//')
    if [ "$major_version" -ge 18 ]; then
        print_pass "Installed ($version)"
    else
        print_warn "Installed but version < 18 ($version)"
    fi
else
    print_fail "Not installed"
fi

# npm
print_check "npm"
if command -v npm &> /dev/null; then
    version=$(npm --version)
    print_pass "Installed (v$version)"
else
    print_fail "Not installed"
fi

# Git
print_check "Git"
if command -v git &> /dev/null; then
    version=$(git --version | cut -d' ' -f3)
    print_pass "Installed (v$version)"
else
    print_fail "Not installed"
fi

# Claude Code
print_check "Claude Code"
if command -v claude &> /dev/null; then
    version=$(claude --version 2>/dev/null || echo "unknown")
    print_pass "Installed ($version)"
else
    print_fail "Not installed (npm install -g @anthropic-ai/claude-code)"
fi

# Vercel CLI (optional)
print_check "Vercel CLI"
if command -v vercel &> /dev/null; then
    version=$(vercel --version 2>/dev/null || echo "unknown")
    print_pass "Installed ($version)"
else
    print_warn "Not installed (optional)"
fi

# ============================================================================
# Project Structure
# ============================================================================

print_header "Project Structure"

BASE_DIR=$(dirname "$0")/..

check_dir() {
    print_check "Directory: $1"
    if [ -d "$BASE_DIR/$1" ]; then
        print_pass "Exists"
    else
        print_fail "Missing"
    fi
}

check_file() {
    print_check "File: $1"
    if [ -f "$BASE_DIR/$1" ]; then
        print_pass "Exists"
    else
        print_fail "Missing"
    fi
}

check_dir "agents"
check_dir "skills"
check_dir "workflows"
check_dir "dashboard"
check_dir "config"
check_dir "templates"
check_dir "scripts"
check_dir "docs"

check_file "CLAUDE.md"
check_file "agents/orchestrator.md"
check_file "agents/builder.md"
check_file "agents/researcher.md"
check_file "agents/marketer.md"
check_file "agents/operator.md"

# ============================================================================
# Disk Space Check
# ============================================================================

print_header "System Resources"

print_check "Disk space"
available=$(df -h . | awk 'NR==2 {print $4}')
print_pass "Available: $available"

print_check "Memory"
if command -v free &> /dev/null; then
    mem=$(free -h | awk '/^Mem:/ {print $7}')
    print_pass "Available: $mem"
elif command -v vm_stat &> /dev/null; then
    # macOS
    pages_free=$(vm_stat | grep "Pages free" | awk '{print $3}' | tr -d '.')
    mem_free=$((pages_free * 4096 / 1024 / 1024))
    print_pass "Free: ${mem_free}MB"
else
    print_warn "Could not determine memory"
fi

# ============================================================================
# Summary
# ============================================================================

print_header "Health Check Summary"

TOTAL=$((PASSED + FAILED + WARNINGS))

echo ""
echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${RED}Failed:${NC}   $FAILED"
echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All critical checks passed!${NC}"

    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Review warnings for optimal setup.${NC}"
    fi

    echo ""
    echo "Your App Factory is ready to use."
    exit 0
else
    echo -e "${RED}Some critical checks failed.${NC}"
    echo "Please fix the issues above before proceeding."
    exit 1
fi
