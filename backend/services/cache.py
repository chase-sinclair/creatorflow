"""
Redis session state cache.
Stores CreatorFlowState as JSON keyed by session_id.
TTL: 2 hours (sessions expire if the user abandons mid-brainstorm).
"""

import json
import os
import redis

_client: redis.Redis | None = None
SESSION_TTL = 60 * 60 * 2  # 2 hours


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        url = os.environ["REDIS_URL"]
        _client = redis.Redis.from_url(url, decode_responses=True)
    return _client


def save_session_state(session_id: str, state: dict) -> None:
    r = get_redis()
    r.setex(f"session:{session_id}", SESSION_TTL, json.dumps(state))


def load_session_state(session_id: str) -> dict | None:
    r = get_redis()
    raw = r.get(f"session:{session_id}")
    if raw is None:
        return None
    return json.loads(raw)


def delete_session_state(session_id: str) -> None:
    r = get_redis()
    r.delete(f"session:{session_id}")
