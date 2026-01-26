#!/bin/bash

# ============================================================================
# App Factory Backup Script
# Creates timestamped backups of important data and configuration
# ============================================================================

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-$HOME/app-factory-backups}"
MAX_BACKUPS="${MAX_BACKUPS:-10}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="app-factory-backup-$TIMESTAMP"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  App Factory Backup Tool${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the factory directory (parent of scripts/)
FACTORY_DIR=$(dirname "$0")/..
FACTORY_DIR=$(cd "$FACTORY_DIR" && pwd)

echo "Factory Directory: $FACTORY_DIR"
echo "Backup Directory:  $BACKUP_DIR"
echo "Backup Name:       $BACKUP_NAME"
echo ""

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create this backup's directory
CURRENT_BACKUP="$BACKUP_DIR/$BACKUP_NAME"
mkdir -p "$CURRENT_BACKUP"

# ============================================================================
# Backup Functions
# ============================================================================

backup_file() {
    local src="$1"
    local dest="$2"

    if [ -f "$src" ]; then
        mkdir -p "$(dirname "$dest")"
        cp "$src" "$dest"
        echo -e "  ${GREEN}[OK]${NC} $src"
    else
        echo -e "  ${YELLOW}[SKIP]${NC} $src (not found)"
    fi
}

backup_dir() {
    local src="$1"
    local dest="$2"

    if [ -d "$src" ]; then
        mkdir -p "$dest"
        cp -r "$src"/* "$dest/" 2>/dev/null || true
        echo -e "  ${GREEN}[OK]${NC} $src/"
    else
        echo -e "  ${YELLOW}[SKIP]${NC} $src/ (not found)"
    fi
}

# ============================================================================
# Backup Configuration Files
# ============================================================================

echo "Backing up configuration..."
mkdir -p "$CURRENT_BACKUP/config"

backup_file "$FACTORY_DIR/.env" "$CURRENT_BACKUP/config/.env"
backup_file "$FACTORY_DIR/config/budget-limits.json" "$CURRENT_BACKUP/config/budget-limits.json"
backup_file "$FACTORY_DIR/config/agent-settings.json" "$CURRENT_BACKUP/config/agent-settings.json"

# ============================================================================
# Backup State Files
# ============================================================================

echo ""
echo "Backing up state..."
mkdir -p "$CURRENT_BACKUP/state"

# GSD state files (if using GSD workflow)
if [ -d "$FACTORY_DIR/.gsd" ]; then
    backup_dir "$FACTORY_DIR/.gsd" "$CURRENT_BACKUP/state/.gsd"
fi

# Claude state (if exists)
if [ -d "$FACTORY_DIR/.claude" ]; then
    backup_dir "$FACTORY_DIR/.claude" "$CURRENT_BACKUP/state/.claude"
fi

# ============================================================================
# Backup Agent Definitions
# ============================================================================

echo ""
echo "Backing up agents..."
backup_dir "$FACTORY_DIR/agents" "$CURRENT_BACKUP/agents"

# ============================================================================
# Backup Custom Skills
# ============================================================================

echo ""
echo "Backing up skills..."
backup_dir "$FACTORY_DIR/skills" "$CURRENT_BACKUP/skills"

# ============================================================================
# Backup Workflows
# ============================================================================

echo ""
echo "Backing up workflows..."
backup_dir "$FACTORY_DIR/workflows" "$CURRENT_BACKUP/workflows"

# ============================================================================
# Backup Custom Templates (if customized)
# ============================================================================

echo ""
echo "Backing up templates..."
backup_dir "$FACTORY_DIR/templates" "$CURRENT_BACKUP/templates"

# ============================================================================
# Backup Dashboard Data (if applicable)
# ============================================================================

echo ""
echo "Backing up dashboard..."
if [ -d "$FACTORY_DIR/dashboard" ]; then
    mkdir -p "$CURRENT_BACKUP/dashboard"

    # Back up package.json and config files (not node_modules)
    backup_file "$FACTORY_DIR/dashboard/package.json" "$CURRENT_BACKUP/dashboard/package.json"
    backup_file "$FACTORY_DIR/dashboard/next.config.js" "$CURRENT_BACKUP/dashboard/next.config.js"
    backup_file "$FACTORY_DIR/dashboard/next.config.mjs" "$CURRENT_BACKUP/dashboard/next.config.mjs"
    backup_file "$FACTORY_DIR/dashboard/tailwind.config.ts" "$CURRENT_BACKUP/dashboard/tailwind.config.ts"
    backup_file "$FACTORY_DIR/dashboard/tailwind.config.js" "$CURRENT_BACKUP/dashboard/tailwind.config.js"
    backup_file "$FACTORY_DIR/dashboard/.env.local" "$CURRENT_BACKUP/dashboard/.env.local"

    # Back up src directory
    if [ -d "$FACTORY_DIR/dashboard/src" ]; then
        backup_dir "$FACTORY_DIR/dashboard/src" "$CURRENT_BACKUP/dashboard/src"
    fi
fi

# ============================================================================
# Backup Apps Data (if any apps exist)
# ============================================================================

echo ""
echo "Backing up apps data..."
if [ -d "$FACTORY_DIR/apps" ]; then
    mkdir -p "$CURRENT_BACKUP/apps"

    # For each app, back up config and data (not node_modules)
    for app_dir in "$FACTORY_DIR/apps"/*/; do
        if [ -d "$app_dir" ]; then
            app_name=$(basename "$app_dir")
            mkdir -p "$CURRENT_BACKUP/apps/$app_name"

            backup_file "$app_dir/package.json" "$CURRENT_BACKUP/apps/$app_name/package.json"
            backup_file "$app_dir/.env" "$CURRENT_BACKUP/apps/$app_name/.env"
            backup_file "$app_dir/.env.local" "$CURRENT_BACKUP/apps/$app_name/.env.local"

            if [ -d "$app_dir/src" ]; then
                backup_dir "$app_dir/src" "$CURRENT_BACKUP/apps/$app_name/src"
            fi
        fi
    done
else
    echo -e "  ${YELLOW}[SKIP]${NC} No apps/ directory found"
fi

# ============================================================================
# Create Backup Manifest
# ============================================================================

echo ""
echo "Creating backup manifest..."

cat > "$CURRENT_BACKUP/manifest.json" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$TIMESTAMP",
  "factory_version": "4.0",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "hostname": "$(hostname)",
  "source_dir": "$FACTORY_DIR",
  "contents": [
    "config/",
    "state/",
    "agents/",
    "skills/",
    "workflows/",
    "templates/",
    "dashboard/",
    "apps/"
  ]
}
EOF

echo -e "  ${GREEN}[OK]${NC} manifest.json"

# ============================================================================
# Compress Backup
# ============================================================================

echo ""
echo "Compressing backup..."

cd "$BACKUP_DIR"
tar -czf "$BACKUP_NAME.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"

BACKUP_SIZE=$(du -h "$BACKUP_NAME.tar.gz" | cut -f1)
echo -e "  ${GREEN}[OK]${NC} Created $BACKUP_NAME.tar.gz ($BACKUP_SIZE)"

# ============================================================================
# Cleanup Old Backups
# ============================================================================

echo ""
echo "Cleaning up old backups..."

# Count current backups
backup_count=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)

if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
    # Delete oldest backups
    to_delete=$((backup_count - MAX_BACKUPS))

    ls -1t "$BACKUP_DIR"/*.tar.gz | tail -n "$to_delete" | while read file; do
        rm "$file"
        echo -e "  ${YELLOW}[DELETED]${NC} $(basename "$file")"
    done
else
    echo -e "  ${GREEN}[OK]${NC} $backup_count/$MAX_BACKUPS backups kept"
fi

# ============================================================================
# Summary
# ============================================================================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Backup Complete${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backup Location: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
echo "Backup Size:     $BACKUP_SIZE"
echo ""
echo "To restore this backup:"
echo "  cd $BACKUP_DIR"
echo "  tar -xzf $BACKUP_NAME.tar.gz"
echo "  cp -r $BACKUP_NAME/* /path/to/factory/"
echo ""

# ============================================================================
# Optional: Send notification
# ============================================================================

if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    # Load env if not already loaded
    if [ -f "$FACTORY_DIR/.env" ]; then
        source "$FACTORY_DIR/.env"
    fi

    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        message="Backup Complete%0A%0AName: $BACKUP_NAME%0ASize: $BACKUP_SIZE%0ALocation: $BACKUP_DIR"

        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}" \
            -d "text=$message" \
            -d "parse_mode=HTML" > /dev/null 2>&1 || true

        echo "Notification sent to Telegram."
    fi
fi

exit 0
