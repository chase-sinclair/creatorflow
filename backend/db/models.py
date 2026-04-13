"""
Database operation helpers using the Supabase Python client.
All functions raise exceptions on failure — callers should handle HTTPException.
"""

import uuid
from db.client import get_supabase


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

def create_session(raw_idea: str) -> dict:
    sb = get_supabase()
    result = sb.table("sessions").insert({
        "raw_idea": raw_idea,
        "clarifying_questions": [],
        "clarifying_answers": [],
        "question_round": 0,
        "status": "active",
    }).execute()
    return result.data[0]


def get_session(session_id: str) -> dict | None:
    sb = get_supabase()
    result = sb.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        return None
    return result.data[0]


def update_session(session_id: str, updates: dict) -> dict:
    sb = get_supabase()
    from datetime import datetime, timezone
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = sb.table("sessions").update(updates).eq("id", session_id).execute()
    return result.data[0]


# ---------------------------------------------------------------------------
# Workflows
# ---------------------------------------------------------------------------

def create_workflow(
    session_id: str,
    workflow_json: dict,
    summary_brief: str,
    archetype: str,
    platforms: list[str],
    automation_level: str,
) -> dict:
    sb = get_supabase()
    result = sb.table("workflows").insert({
        "session_id": session_id,
        "workflow_json": workflow_json,
        "summary_brief": summary_brief,
        "archetype": archetype,
        "platforms": platforms,
        "automation_level": automation_level,
        "refinement_history": [],
    }).execute()
    return result.data[0]


def get_workflow(workflow_id: str) -> dict | None:
    sb = get_supabase()
    result = sb.table("workflows").select("*").eq("id", workflow_id).execute()
    if not result.data:
        return None
    return result.data[0]


def get_workflow_by_token(token: str) -> dict | None:
    sb = get_supabase()
    result = sb.table("workflows").select("*").eq("share_token", token).execute()
    if not result.data:
        return None
    return result.data[0]


def update_workflow(workflow_id: str, updates: dict) -> dict:
    sb = get_supabase()
    from datetime import datetime, timezone
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = sb.table("workflows").update(updates).eq("id", workflow_id).execute()
    return result.data[0]


def set_share_token(workflow_id: str, token: str) -> dict:
    return update_workflow(workflow_id, {"share_token": token})


def increment_view_count(workflow_id: str) -> None:
    sb = get_supabase()
    # Use rpc to atomically increment
    sb.rpc("increment_view_count", {"workflow_id": workflow_id}).execute()


# ---------------------------------------------------------------------------
# Examples
# ---------------------------------------------------------------------------

def get_examples() -> list[dict]:
    sb = get_supabase()
    result = sb.table("examples").select("*").order("display_order").execute()
    return result.data


def count_examples() -> int:
    sb = get_supabase()
    result = sb.table("examples").select("id", count="exact").execute()
    return result.count or 0


def seed_examples(examples: list[dict]) -> None:
    sb = get_supabase()
    sb.table("examples").insert(examples).execute()


# ---------------------------------------------------------------------------
# Idea Prompts
# ---------------------------------------------------------------------------

def get_idea_prompts() -> list[dict]:
    sb = get_supabase()
    result = sb.table("idea_prompts").select("*").order("display_order").execute()
    return result.data


def count_idea_prompts() -> int:
    sb = get_supabase()
    result = sb.table("idea_prompts").select("id", count="exact").execute()
    return result.count or 0


def seed_idea_prompts(prompts: list[dict]) -> None:
    sb = get_supabase()
    sb.table("idea_prompts").insert(prompts).execute()


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

def count_workflows() -> int:
    sb = get_supabase()
    result = sb.table("workflows").select("id", count="exact").execute()
    return result.count or 0
