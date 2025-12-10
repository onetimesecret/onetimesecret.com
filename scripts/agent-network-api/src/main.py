"""
Cloudflare Workers Python mock for Agent Network API.

This script implements a mock of the agent-network.json spec endpoints
with analytics tracking and auth attempt logging.

Deploy with: wrangler deploy

Requires KV namespaces:
- AGENT_AUTH: Auth requests and tokens
- AGENT_MESSAGES: Message storage
- AGENT_EVENTS: Request analytics and auth tracking
"""

import hashlib
import json
import secrets
from datetime import datetime, timezone

from js import Headers
from workers import Response, WorkerEntrypoint


# Helper functions
def json_response(data: dict, status: int = 200) -> Response:
    """Create a JSON response with proper headers including CORS."""
    return Response(
        json.dumps(data, default=str),
        status=status,
        headers={
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    )


def generate_id() -> str:
    """Generate a unique ID (mock UUIDv7-like)."""
    timestamp = int(datetime.now(timezone.utc).timestamp() * 1000)
    random_part = secrets.token_hex(8)
    return f"{timestamp:012x}-{random_part}"


def get_timestamp() -> str:
    """Get ISO 8601 timestamp."""
    return datetime.now(timezone.utc).isoformat()


async def log_analytics(env, event_type: str, data: dict):
    """Log an analytics event to KV."""
    analytics_key = f"event:{generate_id()}"
    event = {"type": event_type, "timestamp": get_timestamp(), "data": data}
    await env.AGENT_EVENTS.put(analytics_key, json.dumps(event))

    # Update counters
    counter_key = f"counter:{event_type}:{datetime.now(timezone.utc).strftime('%Y-%m-%d')}"
    try:
        current = await env.AGENT_EVENTS.get(counter_key)
        count = int(current) + 1 if current else 1
    except Exception:
        count = 1
    await env.AGENT_EVENTS.put(counter_key, str(count))


async def log_auth_attempt(
    env, request_data: dict, success: bool, reason: str = None
):
    """Log authentication attempt for tracking."""
    auth_log_key = f"auth_attempt:{generate_id()}"
    log_entry = {
        "timestamp": get_timestamp(),
        "public_key_hash": hashlib.sha256(
            request_data.get("public_key", "").encode()
        ).hexdigest()[:16],
        "purpose": request_data.get("purpose", "unknown"),
        "success": success,
        "reason": reason,
        "agent_id": request_data.get("agent_id"),
    }
    await env.AGENT_EVENTS.put(auth_log_key, json.dumps(log_entry))
    await log_analytics(env, "auth_attempt", {"success": success})


# Route handlers
async def handle_auth_request(request, env):
    """
    POST /api/v2/agent/auth
    CIBA flow: Agent registers keypair and purpose.
    Returns auth_request_id for polling.
    """
    try:
        body = await request.json()
    except Exception:
        await log_auth_attempt(env, {}, False, "invalid_json")
        return json_response({"error": "Invalid JSON body"}, 400)

    public_key = body.get("public_key")
    purpose = body.get("purpose")
    callback_url = body.get("callback_url")

    if not public_key or not purpose:
        await log_auth_attempt(env, body, False, "missing_fields")
        return json_response(
            {"error": "Missing required fields: public_key, purpose"}, 400
        )

    auth_request_id = generate_id()

    # Store auth request
    auth_data = {
        "id": auth_request_id,
        "public_key": public_key,
        "purpose": purpose,
        "callback_url": callback_url,
        "status": "pending",
        "created_at": get_timestamp(),
        "expires_at": None,  # Would be set in real implementation
    }
    await env.AGENT_AUTH.put(
        f"auth_request:{auth_request_id}",
        json.dumps(auth_data),
        expirationTtl=3600,  # 1 hour TTL
    )

    await log_auth_attempt(env, body, True, "request_created")
    await log_analytics(
        env, "auth_request_created", {"request_id": auth_request_id}
    )

    return json_response(
        {
            "auth_request_id": auth_request_id,
            "status": "pending",
            "poll_endpoint": f"/api/v2/agent/auth/{auth_request_id}",
            "expires_in": 3600,
            "message": "Awaiting human approval. Poll the endpoint or await callback.",
        },
        202,
    )


async def handle_auth_poll(request, env, auth_request_id: str):
    """
    GET /api/v2/agent/auth/{id}
    Poll for auth request status.
    """
    auth_data = await env.AGENT_AUTH.get(f"auth_request:{auth_request_id}")

    if not auth_data:
        await log_analytics(
            env, "auth_poll_not_found", {"request_id": auth_request_id}
        )
        return json_response(
            {"error": "Auth request not found or expired"}, 404
        )

    auth_request = json.loads(auth_data)
    await log_analytics(
        env,
        "auth_poll",
        {"request_id": auth_request_id, "status": auth_request["status"]},
    )

    # For mock purposes, auto-approve after a few polls (simulate human approval)
    # In production, this would check a separate approval state
    if auth_request["status"] == "pending":
        # Check if we should auto-approve (mock behavior)
        poll_count_key = f"poll_count:{auth_request_id}"
        poll_count = await env.AGENT_AUTH.get(poll_count_key)
        poll_count = int(poll_count) + 1 if poll_count else 1
        await env.AGENT_AUTH.put(
            poll_count_key, str(poll_count), expirationTtl=3600
        )

        # Auto-approve after 3 polls for demo purposes
        if poll_count >= 3:
            token = secrets.token_urlsafe(32)
            auth_request["status"] = "approved"
            auth_request["token"] = token
            auth_request["approved_at"] = get_timestamp()
            await env.AGENT_AUTH.put(
                f"auth_request:{auth_request_id}",
                json.dumps(auth_request),
                expirationTtl=3600,
            )
            # Store token for validation
            await env.AGENT_AUTH.put(
                f"token:{token}",
                json.dumps(
                    {
                        "auth_request_id": auth_request_id,
                        "created_at": get_timestamp(),
                    }
                ),
                expirationTtl=86400,  # 24 hour token TTL
            )

    response_data = {
        "auth_request_id": auth_request_id,
        "status": auth_request["status"],
        "created_at": auth_request["created_at"],
    }

    if auth_request["status"] == "approved":
        response_data["access_token"] = auth_request.get("token")
        response_data["token_type"] = "Bearer"
        response_data["expires_in"] = 86400

    return json_response(response_data)


async def validate_token(request, env) -> tuple[bool, str]:
    """Validate Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return False, "missing_bearer_token"

    token = auth_header[7:]  # Remove "Bearer " prefix
    token_data = await env.AGENT_AUTH.get(f"token:{token}")

    if not token_data:
        return False, "invalid_token"

    return True, token


async def handle_post_message(request, env):
    """POST /api/v2/agent/messages - Post a message."""
    valid, result = await validate_token(request, env)
    if not valid:
        await log_analytics(
            env,
            "unauthorized_request",
            {"endpoint": "post_message", "reason": result},
        )
        return json_response({"error": "Unauthorized", "reason": result}, 401)

    try:
        body = await request.json()
    except Exception:
        return json_response({"error": "Invalid JSON body"}, 400)

    message_id = generate_id()
    message = {
        "id": message_id,
        "content": body.get("content"),
        "recipient": body.get("recipient"),
        "topic": body.get("topic"),
        "created_at": get_timestamp(),
        "ttl": body.get("ttl", 3600),
    }

    await env.AGENT_MESSAGES.put(
        f"message:{message_id}",
        json.dumps(message),
        expirationTtl=message["ttl"],
    )

    await log_analytics(env, "message_posted", {"message_id": message_id})

    return json_response(
        {
            "message_id": message_id,
            "status": "delivered",
            "created_at": message["created_at"],
        },
        201,
    )


async def handle_read_messages(request, env):
    """GET /api/v2/agent/messages - Read messages."""
    valid, result = await validate_token(request, env)
    if not valid:
        await log_analytics(
            env,
            "unauthorized_request",
            {"endpoint": "read_messages", "reason": result},
        )
        return json_response({"error": "Unauthorized", "reason": result}, 401)

    # Mock: return empty list (would filter by since param in real implementation)
    await log_analytics(env, "messages_read", {})

    return json_response(
        {"messages": [], "next_cursor": None, "has_more": False}
    )


async def handle_ask_question(request, env):
    """POST /api/v2/agent/questions - Ask a question."""
    valid, result = await validate_token(request, env)
    if not valid:
        return json_response({"error": "Unauthorized", "reason": result}, 401)

    try:
        # Body is validated but not used in this mock - would store question in production
        await request.json()
    except Exception:
        return json_response({"error": "Invalid JSON body"}, 400)

    question_id = generate_id()
    await log_analytics(env, "question_asked", {"question_id": question_id})

    return json_response(
        {
            "question_id": question_id,
            "status": "pending",
            "poll_endpoint": f"/api/v2/agent/questions/{question_id}",
        },
        202,
    )


async def handle_discover_peers(request, env):
    """GET /api/v2/agent/peers - Discover other agents."""
    valid, result = await validate_token(request, env)
    if not valid:
        return json_response({"error": "Unauthorized", "reason": result}, 401)

    await log_analytics(env, "peers_discovered", {})

    # Mock peer list - realistic agent network participants
    peers = [
        {
            "agent_id": "claude-code-primary",
            "name": "Claude Code (Primary)",
            "provider": "anthropic",
            "capabilities": ["message", "secret", "handoff", "code_review"],
            "status": "online",
            "last_seen": get_timestamp(),
            "metadata": {
                "model": "claude-sonnet-4-20250514",
                "context": "software_development"
            }
        },
        {
            "agent_id": "github-copilot-workspace",
            "name": "GitHub Copilot Workspace",
            "provider": "github",
            "capabilities": ["message", "handoff", "code_generation"],
            "status": "online",
            "last_seen": get_timestamp(),
            "metadata": {
                "context": "ide_integration"
            }
        },
        {
            "agent_id": "devin-dev-agent",
            "name": "Devin",
            "provider": "cognition",
            "capabilities": ["message", "secret", "handoff", "autonomous_coding"],
            "status": "busy",
            "last_seen": get_timestamp(),
            "metadata": {
                "current_task": "debugging_session",
                "context": "autonomous_development"
            }
        },
        {
            "agent_id": "cursor-composer",
            "name": "Cursor Composer",
            "provider": "cursor",
            "capabilities": ["message", "handoff", "multi_file_edit"],
            "status": "online",
            "last_seen": get_timestamp(),
            "metadata": {
                "context": "editor_integration"
            }
        },
        {
            "agent_id": "codex-cli-agent",
            "name": "OpenAI Codex CLI",
            "provider": "openai",
            "capabilities": ["message", "secret", "shell_execution"],
            "status": "offline",
            "last_seen": "2025-11-28T08:30:00Z",
            "metadata": {
                "context": "terminal_automation"
            }
        },
        {
            "agent_id": "windsurf-cascade",
            "name": "Windsurf Cascade",
            "provider": "codeium",
            "capabilities": ["message", "handoff", "code_flow"],
            "status": "online",
            "last_seen": get_timestamp(),
            "metadata": {
                "context": "ide_integration"
            }
        }
    ]

    # Filter by status if requested
    url = request.url
    if "status=" in url:
        status_filter = url.split("status=")[1].split("&")[0]
        peers = [p for p in peers if p["status"] == status_filter]

    return json_response(
        {
            "peers": peers,
            "total": len(peers),
            "online_count": len([p for p in peers if p["status"] == "online"]),
            "network_version": "0.1",
            "discovery_timestamp": get_timestamp()
        }
    )


async def handle_subscribe(request, env):
    """POST /api/v2/agent/subscribe - Subscribe to topics."""
    valid, result = await validate_token(request, env)
    if not valid:
        return json_response({"error": "Unauthorized", "reason": result}, 401)

    try:
        body = await request.json()
    except Exception:
        return json_response({"error": "Invalid JSON body"}, 400)

    topic = body.get("topic")
    subscription_id = generate_id()
    await log_analytics(
        env,
        "subscription_created",
        {"topic": topic, "subscription_id": subscription_id},
    )

    return json_response(
        {
            "subscription_id": subscription_id,
            "topic": topic,
            "status": "active",
        },
        201,
    )


async def handle_create_secret(request, env):
    """POST /api/v2/secret - Create a one-time secret."""
    valid, result = await validate_token(request, env)
    if not valid:
        return json_response({"error": "Unauthorized", "reason": result}, 401)

    try:
        body = await request.json()
    except Exception:
        return json_response({"error": "Invalid JSON body"}, 400)

    secret_key = generate_id()
    await log_analytics(
        env, "secret_created", {"secret_key": secret_key[:8] + "..."}
    )

    return json_response(
        {
            "secret_key": secret_key,
            "secret_url": f"https://onetimesecret.com/secret/{secret_key}",
            "expires_in": body.get("ttl", 604800),
            "status": "created",
        },
        201,
    )


async def handle_handoff(request, env):
    """POST /api/v2/agent/handoff - Agent handoff."""
    valid, result = await validate_token(request, env)
    if not valid:
        return json_response({"error": "Unauthorized", "reason": result}, 401)

    try:
        body = await request.json()
    except Exception:
        return json_response({"error": "Invalid JSON body"}, 400)

    handoff_id = generate_id()
    await log_analytics(
        env,
        "handoff_initiated",
        {"handoff_id": handoff_id, "target_agent": body.get("target_agent")},
    )

    return json_response(
        {
            "handoff_id": handoff_id,
            "status": "initiated",
            "target_agent": body.get("target_agent"),
        },
        202,
    )


async def handle_analytics(request, env):
    """GET /api/v2/admin/analytics - Get analytics summary (admin endpoint)."""
    # WARNING: This is a mock/demo admin key - NOT for production use.
    # In production, use environment variables or proper secret management.
    expected_admin_key = getattr(env, "ADMIN_KEY", "mock-admin-key")
    admin_key = request.headers.get("X-Admin-Key")
    if admin_key != expected_admin_key:
        return json_response({"error": "Unauthorized"}, 401)

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Gather counters
    event_types = [
        "auth_request_created",
        "auth_poll",
        "auth_attempt",
        "message_posted",
        "messages_read",
        "secret_created",
        "question_asked",
        "peers_discovered",
        "subscription_created",
        "handoff_initiated",
        "unauthorized_request",
    ]

    counters = {}
    for event_type in event_types:
        counter_key = f"counter:{event_type}:{today}"
        count = await env.AGENT_EVENTS.get(counter_key)
        counters[event_type] = int(count) if count else 0

    return json_response(
        {
            "date": today,
            "counters": counters,
            "summary": {
                "total_auth_attempts": counters.get("auth_attempt", 0),
                "total_messages": counters.get("message_posted", 0),
                "total_secrets": counters.get("secret_created", 0),
                "unauthorized_attempts": counters.get(
                    "unauthorized_request", 0
                ),
            },
        }
    )


async def handle_auth_attempts(request, env):
    """GET /api/v2/admin/auth-attempts - Get auth attempt logs (admin endpoint)."""
    # WARNING: This is a mock/demo admin key - NOT for production use.
    expected_admin_key = getattr(env, "ADMIN_KEY", "mock-admin-key")
    admin_key = request.headers.get("X-Admin-Key")
    if admin_key != expected_admin_key:
        return json_response({"error": "Unauthorized"}, 401)

    # List auth attempts from KV (limited query in mock)
    attempts = []
    # Note: KV list is limited, would use Durable Objects or D1 for production
    keys = await env.AGENT_EVENTS.list(prefix="auth_attempt:")

    for key in keys.keys[:50]:  # Limit to 50 most recent
        attempt_data = await env.AGENT_EVENTS.get(key.name)
        if attempt_data:
            attempts.append(json.loads(attempt_data))

    return json_response({"auth_attempts": attempts, "total": len(attempts)})


# Main Worker entrypoint class
class Default(WorkerEntrypoint):
    """Main entry point for Cloudflare Worker."""

    async def fetch(self, request):
        """Handle incoming HTTP requests."""
        env = self.env
        url = request.url
        path = url.split("//")[1].split("/", 1)[1] if "//" in url else url
        path = "/" + path.split("?")[0]  # Remove query string
        method = request.method

        # CORS preflight
        if method == "OPTIONS":
            headers = Headers.new(
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Key",
                }.items()
            )
            return Response.new(None, status=204, headers=headers)

        # Route matching
        try:
            # Auth endpoints
            if path == "/api/v2/agent/auth" and method == "GET":
                # Discovery endpoint - describe the CIBA auth flow
                response = json_response({
                    "auth_method": "ciba",
                    "description": "Client Initiated Backchannel Authentication",
                    "flow": "POST public_key and purpose to initiate auth request, then poll the returned endpoint",
                    "required_fields": {
                        "public_key": "Your agent's public key (PEM or JWK format)",
                        "purpose": "Human-readable description of why access is needed"
                    },
                    "optional_fields": {
                        "callback_url": "URL to receive approval notification",
                        "agent_id": "Optional identifier for your agent"
                    },
                    "example_request": {
                        "public_key": "-----BEGIN PUBLIC KEY-----...",
                        "purpose": "Coordinate task handoff between coding agents",
                        "callback_url": "https://myagent.example/callback"
                    },
                    "next_step": "POST to this endpoint with required fields"
                })
            elif path == "/api/v2/agent/auth" and method == "POST":
                response = await handle_auth_request(request, env)
            elif path.startswith("/api/v2/agent/auth/") and method == "GET":
                auth_request_id = path.split("/")[-1]
                response = await handle_auth_poll(request, env, auth_request_id)

            # Capability endpoints
            elif path == "/api/v2/agent/messages" and method == "POST":
                response = await handle_post_message(request, env)
            elif path == "/api/v2/agent/messages" and method == "GET":
                response = await handle_read_messages(request, env)
            elif path == "/api/v2/agent/questions" and method == "POST":
                response = await handle_ask_question(request, env)
            elif path == "/api/v2/agent/peers" and method == "GET":
                response = await handle_discover_peers(request, env)
            elif path == "/api/v2/agent/subscribe" and method == "POST":
                response = await handle_subscribe(request, env)
            elif path == "/api/v2/secret" and method == "POST":
                response = await handle_create_secret(request, env)
            elif path == "/api/v2/agent/handoff" and method == "POST":
                response = await handle_handoff(request, env)

            # Admin endpoints
            elif path == "/api/v2/admin/analytics" and method == "GET":
                response = await handle_analytics(request, env)
            elif path == "/api/v2/admin/auth-attempts" and method == "GET":
                response = await handle_auth_attempts(request, env)

            # Health check
            elif path == "/" or path == "/health":
                response = json_response(
                    {
                        "status": "ok",
                        "service": "agent-network-api",
                        "version": "0.1",
                        "spec_version": "draft-01",
                    }
                )

            else:
                response = json_response(
                    {"error": "Not found", "path": path}, 404
                )

        except Exception as e:
            await log_analytics(env, "error", {"path": path, "error": str(e)})
            response = json_response({"error": "Internal server error"}, 500)

        return response
