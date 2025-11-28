#!/usr/bin/env bash
# Schema validation tests for agent-network JSON schemas
# Requires: pip install check-jsonschema

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FIXTURES_DIR="$SCRIPT_DIR/fixtures"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

pass() { echo -e "${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "${RED}✗${NC} $1"; ((FAIL++)); }

echo ""
echo "Agent Network Schema Validation Tests"
echo "======================================"

# Schema self-validation
echo -e "\n${YELLOW}Schema Self-Validation${NC}"
check-jsonschema --check-metaschema "$PROJECT_ROOT/public/agent-network.schema.json" 2>/dev/null && pass "agent-network.schema.json" || fail "agent-network.schema.json"
check-jsonschema --check-metaschema "$PROJECT_ROOT/public/agent-message.schema.json" 2>/dev/null && pass "agent-message.schema.json" || fail "agent-message.schema.json"

# Agent Network Manifest
echo -e "\n${YELLOW}Agent Network Manifest${NC}"
check-jsonschema --schemafile "$PROJECT_ROOT/public/agent-network.schema.json" "$FIXTURES_DIR/valid-agent-network.json" 2>/dev/null && pass "Valid manifest" || fail "Valid manifest"
check-jsonschema --schemafile "$PROJECT_ROOT/public/agent-network.schema.json" "$PROJECT_ROOT/public/.well-known/agent-network.json" 2>/dev/null && pass "Production manifest" || fail "Production manifest"
check-jsonschema --schemafile "$PROJECT_ROOT/public/agent-network.schema.json" "$FIXTURES_DIR/invalid-agent-network-missing-auth.json" 2>/dev/null && fail "Should reject missing auth" || pass "Rejects missing auth"

# Agent Messages
echo -e "\n${YELLOW}Agent Messages${NC}"
check-jsonschema --schemafile "$PROJECT_ROOT/public/agent-message.schema.json" "$FIXTURES_DIR/valid-agent-message-status.json" 2>/dev/null && pass "Valid status_update" || fail "Valid status_update"
check-jsonschema --schemafile "$PROJECT_ROOT/public/agent-message.schema.json" "$FIXTURES_DIR/valid-agent-message-question.json" 2>/dev/null && pass "Valid question" || fail "Valid question"
check-jsonschema --schemafile "$PROJECT_ROOT/public/agent-message.schema.json" "$FIXTURES_DIR/valid-agent-message-handoff.json" 2>/dev/null && pass "Valid task_handoff" || fail "Valid task_handoff"
check-jsonschema --schemafile "$PROJECT_ROOT/public/agent-message.schema.json" "$FIXTURES_DIR/invalid-agent-message-bad-id.json" 2>/dev/null && fail "Should reject bad agent_id" || pass "Rejects bad agent_id"

echo -e "\n======================================"
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
[ $FAIL -eq 0 ]
