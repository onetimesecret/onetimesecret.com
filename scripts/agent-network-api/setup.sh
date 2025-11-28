#!/bin/bash
# Setup script for Agent Network API on Cloudflare Workers
#
# Prerequisites:
#   - Cloudflare account with Workers enabled
#   - wrangler CLI installed: npm install -g wrangler
#   - Logged in: wrangler login
#
# Usage: ./setup.sh

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

echo "Creating KV namespaces..."
echo ""

# Create KV namespaces and capture IDs
echo "Creating AGENT_AUTH namespace..."
AUTH_OUTPUT=$(wrangler kv namespace create AGENT_AUTH 2>&1)
AUTH_ID=$(echo "$AUTH_OUTPUT" | grep -oP 'id = "\K[^"]+' || true)
AUTH_PREVIEW_OUTPUT=$(wrangler kv namespace create AGENT_AUTH --preview 2>&1)
AUTH_PREVIEW_ID=$(echo "$AUTH_PREVIEW_OUTPUT" | grep -oP 'id = "\K[^"]+' || true)

echo "Creating AGENT_MESSAGES namespace..."
MESSAGES_OUTPUT=$(wrangler kv namespace create AGENT_MESSAGES 2>&1)
MESSAGES_ID=$(echo "$MESSAGES_OUTPUT" | grep -oP 'id = "\K[^"]+' || true)
MESSAGES_PREVIEW_OUTPUT=$(wrangler kv namespace create AGENT_MESSAGES --preview 2>&1)
MESSAGES_PREVIEW_ID=$(echo "$MESSAGES_PREVIEW_OUTPUT" | grep -oP 'id = "\K[^"]+' || true)

echo "Creating AGENT_EVENTS namespace..."
AGENT_EVENTS_OUTPUT=$(wrangler kv namespace create AGENT_EVENTS 2>&1)
AGENT_EVENTS_ID=$(echo "$AGENT_EVENTS_OUTPUT" | grep -oP 'id = "\K[^"]+' || true)
AGENT_EVENTS_PREVIEW_OUTPUT=$(wrangler kv namespace create AGENT_EVENTS --preview 2>&1)
AGENT_EVENTS_PREVIEW_ID=$(echo "$AGENT_EVENTS_PREVIEW_OUTPUT" | grep -oP 'id = "\K[^"]+' || true)

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
