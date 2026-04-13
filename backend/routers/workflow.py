import secrets
import string

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from agents.nodes.classifier import classifier_node
from agents.nodes.designer import designer_node
from agents.nodes.explainer import explainer_node
from agents.nodes.refinement import refinement_node
from db import models
from services.cache import load_session_state

router = APIRouter(prefix="/api/workflow", tags=["workflow"])


def _generate_token(length: int = 8) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


# ---------------------------------------------------------------------------
# POST /api/workflow/generate
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    session_id: str


@router.post("/generate")
async def generate_workflow(body: GenerateRequest):
    """
    Run classifier → designer → explainer on the confirmed session state.
    Saves workflow to Supabase and returns the full output.
    """
    # Load state from Redis (has all clarification context)
    state = load_session_state(body.session_id)
    if state is None:
        # Fall back to Supabase if Redis expired
        session = models.get_session(body.session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found")
        if session["status"] != "confirmed":
            raise HTTPException(status_code=400, detail="Session brainstorm not yet confirmed")
        # Reconstruct minimal state from DB
        state = {
            "raw_idea": session["raw_idea"],
            "clarifying_questions": session.get("clarifying_questions", []),
            "clarifying_answers": session.get("clarifying_answers", []),
            "question_round": session.get("question_round", 0),
            "needs_clarification": False,
            "ready_to_generate": True,
            "workflow_archetype": "",
            "target_platforms": [],
            "automation_level": "",
            "workflow_json": {},
            "summary_brief": "",
            "refinement_history": [],
        }

    # Run generation pipeline: classifier → designer → explainer
    classifier_updates = classifier_node(state)
    state.update(classifier_updates)

    designer_updates = designer_node(state)
    state.update(designer_updates)

    explainer_updates = explainer_node(state)
    state.update(explainer_updates)

    # Save workflow to Supabase
    workflow = models.create_workflow(
        session_id=body.session_id,
        workflow_json=state["workflow_json"],
        summary_brief=state["summary_brief"],
        archetype=state["workflow_archetype"],
        platforms=state["target_platforms"],
        automation_level=state["automation_level"],
    )

    return {
        "workflow_id": workflow["id"],
        "workflow_json": state["workflow_json"],
        "summary_brief": state["summary_brief"],
        "archetype": state["workflow_archetype"],
        "platforms": state["target_platforms"],
        "automation_level": state["automation_level"],
    }


# ---------------------------------------------------------------------------
# POST /api/workflow/refine
# ---------------------------------------------------------------------------

class RefineRequest(BaseModel):
    workflow_id: str
    message: str


@router.post("/refine")
async def refine_workflow(body: RefineRequest):
    """
    Apply a follow-up refinement request to an existing workflow.
    Updates Supabase and returns updated workflow_json + change_description.
    """
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="message cannot be empty")

    workflow = models.get_workflow(body.workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Build minimal state from the saved workflow
    state = {
        "workflow_json": workflow["workflow_json"],
        "refinement_history": workflow.get("refinement_history", []),
        "summary_brief": workflow.get("summary_brief", ""),
    }

    # Run refinement node
    refinement_updates = refinement_node(state, body.message.strip())
    state.update(refinement_updates)

    # Re-run explainer to update summary brief for the new workflow
    explainer_updates = explainer_node(state)
    state.update(explainer_updates)

    # Persist to Supabase
    models.update_workflow(body.workflow_id, {
        "workflow_json": state["workflow_json"],
        "summary_brief": state["summary_brief"],
        "refinement_history": state["refinement_history"],
    })

    return {
        "workflow_id": body.workflow_id,
        "workflow_json": state["workflow_json"],
        "summary_brief": state["summary_brief"],
        "change_description": refinement_updates.get("change_description", ""),
    }


# ---------------------------------------------------------------------------
# GET /api/workflow/share/{token}  — must come before /{workflow_id}
# ---------------------------------------------------------------------------

@router.get("/share/{token}")
async def get_workflow_by_token(token: str):
    """Fetch a workflow by its share token (for read-only shared view)."""
    workflow = models.get_workflow_by_token(token)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Shared workflow not found")

    # Increment view count (best-effort, don't fail the request)
    try:
        models.update_workflow(workflow["id"], {"view_count": (workflow.get("view_count") or 0) + 1})
    except Exception:
        pass

    return workflow


# ---------------------------------------------------------------------------
# GET /api/workflow/{workflow_id}
# ---------------------------------------------------------------------------

@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Fetch a workflow by ID."""
    workflow = models.get_workflow(workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


# ---------------------------------------------------------------------------
# POST /api/workflow/{workflow_id}/share
# ---------------------------------------------------------------------------

@router.post("/{workflow_id}/share")
async def share_workflow(workflow_id: str):
    """Generate a shareable token for a workflow. Idempotent — returns existing token if set."""
    workflow = models.get_workflow(workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Return existing token if already set
    existing_token = workflow.get("share_token")
    if existing_token:
        return {"share_token": existing_token, "share_url": f"/share/{existing_token}"}

    # Generate unique token (retry on collision)
    for _ in range(5):
        token = _generate_token(8)
        try:
            models.set_share_token(workflow_id, token)
            return {"share_token": token, "share_url": f"/share/{token}"}
        except Exception:
            continue

    raise HTTPException(status_code=500, detail="Could not generate unique share token")


# ---------------------------------------------------------------------------
# GET /api/workflow/{workflow_id}/export
# ---------------------------------------------------------------------------

@router.get("/{workflow_id}/export")
async def export_workflow(workflow_id: str):
    """PDF export — implemented in Phase 7."""
    workflow = models.get_workflow(workflow_id)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return JSONResponse(
        status_code=501,
        content={"detail": "PDF export coming in Phase 7"},
    )
