#!/bin/bash
# Setup script for Agent Network API on Cloudflare Workers
#
# Prerequisites:
#   - Cloudflare account with Workers enabled
#   - wrangler CLI installed: npm install -g wrangler
#   - Logged in: wrangler login
#
# Usage: ./setup.sh
#
# This script is idempotent - safe to run multiple times.

set -e

echo "=== Agent Network API Setup ==="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "Error: Not logged in to Cloudflare. Run: wrangler login"
    exit 1
fi

# Helper function to extract namespace ID from wrangler output (portable, works on macOS/BSD)
extract_id() {
    awk -F '"' '/id =/ {print $2}'
}

# Helper function to get or create a KV namespace
# Returns the namespace ID, creating it if it doesn't exist
get_or_create_namespace() {
    local name="$1"
    local preview="$2"
    local existing_id=""

    # Check if namespace already exists
    if [[ "$preview" == "--preview" ]]; then
        existing_id=$(wrangler kv namespace list 2>/dev/null | grep -E "\"title\":\s*\"${name}_preview\"" | awk -F '"' '/"id":/ {for(i=1;i<=NF;i++) if($i=="id") print $(i+2)}' | head -1 || true)
    else
        # Match exact title (not preview)
        existing_id=$(wrangler kv namespace list 2>/dev/null | grep -E "\"title\":\s*\"${name}\"[^_]" | awk -F '"' '/"id":/ {for(i=1;i<=NF;i++) if($i=="id") print $(i+2)}' | head -1 || true)
    fi

    if [[ -n "$existing_id" ]]; then
        echo "  Found existing namespace: $existing_id" >&2
        echo "$existing_id"
        return
    fi

    # Create new namespace
    local output
    if [[ "$preview" == "--preview" ]]; then
        output=$(wrangler kv namespace create "$name" --preview 2>&1)
    else
        output=$(wrangler kv namespace create "$name" 2>&1)
    fi

    echo "$output" | extract_id
}

echo "Setting up KV namespaces (will reuse existing ones)..."
echo ""

echo "Processing AGENT_AUTH namespace..."
AUTH_ID=$(get_or_create_namespace "AGENT_AUTH" "")
AUTH_PREVIEW_ID=$(get_or_create_namespace "AGENT_AUTH" "--preview")

echo "Processing AGENT_MESSAGES namespace..."
MESSAGES_ID=$(get_or_create_namespace "AGENT_MESSAGES" "")
MESSAGES_PREVIEW_ID=$(get_or_create_namespace "AGENT_MESSAGES" "--preview")

echo "Processing AGENT_EVENTS namespace..."
AGENT_EVENTS_ID=$(get_or_create_namespace "AGENT_EVENTS" "")
AGENT_EVENTS_PREVIEW_ID=$(get_or_create_namespace "AGENT_EVENTS" "--preview")

echo ""
echo "=== KV Namespace IDs ==="
echo "Update wrangler.toml with these values:"
echo ""
echo "AGENT_AUTH:"
echo "  id = \"$AUTH_ID\""
echo "  preview_id = \"$AUTH_PREVIEW_ID\""
echo ""
echo "AGENT_MESSAGES:"
echo "  id = \"$MESSAGES_ID\""
echo "  preview_id = \"$MESSAGES_PREVIEW_ID\""
echo ""
echo "AGENT_EVENTS:"
echo "  id = \"$AGENT_EVENTS_ID\""
echo "  preview_id = \"$AGENT_EVENTS_PREVIEW_ID\""
echo ""

# Update wrangler.toml with actual IDs
if [[ -n "$AUTH_ID" && -n "$MESSAGES_ID" && -n "$AGENT_EVENTS_ID" ]]; then
    echo "Updating wrangler.toml with namespace IDs..."

    # sed -i.bak is portable (works on both macOS and GNU sed)
    sed -i.bak "s/YOUR_AGENT_AUTH_NAMESPACE_ID/$AUTH_ID/" wrangler.toml
    sed -i.bak "s/YOUR_AGENT_AUTH_PREVIEW_ID/$AUTH_PREVIEW_ID/" wrangler.toml
    sed -i.bak "s/YOUR_AGENT_MESSAGES_NAMESPACE_ID/$MESSAGES_ID/" wrangler.toml
    sed -i.bak "s/YOUR_AGENT_MESSAGES_PREVIEW_ID/$MESSAGES_PREVIEW_ID/" wrangler.toml
    sed -i.bak "s/YOUR_AGENT_EVENTS_NAMESPACE_ID/$AGENT_EVENTS_ID/" wrangler.toml
    sed -i.bak "s/YOUR_AGENT_EVENTS_PREVIEW_ID/$AGENT_EVENTS_PREVIEW_ID/" wrangler.toml

    rm -f wrangler.toml.bak
    echo "wrangler.toml updated successfully!"
else
    echo "Warning: Could not extract all namespace IDs. Please update wrangler.toml manually."
fi

echo ""
echo "=== Next Steps ==="
echo "1. Review wrangler.toml and ensure namespace IDs are correct"
echo "2. Deploy the worker: wrangler deploy"
echo "3. Test the API: curl https://agent-network-mock.<your-subdomain>.workers.dev/health"
echo ""
echo "=== Admin Endpoints ==="
echo "Analytics: GET /api/v2/admin/analytics (Header: X-Admin-Key: mock-admin-key)"
echo "Auth Logs: GET /api/v2/admin/auth-attempts (Header: X-Admin-Key: mock-admin-key)"
echo ""
echo "Setup complete!"
