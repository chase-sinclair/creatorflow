from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents.state import CreatorFlowState
from agents.nodes.intake import intake_node
from agents.nodes.clarification import clarification_node
from db import models
from services.cache import save_session_state, load_session_state
from services.summary import generate_idea_summary

router = APIRouter(prefix="/api/brainstorm", tags=["brainstorm"])


def _empty_state(raw_idea: str) -> CreatorFlowState:
    return CreatorFlowState(
        raw_idea=raw_idea,
        clarifying_questions=[],
        clarifying_answers=[],
        question_round=0,
        needs_clarification=False,
        ready_to_generate=False,
        workflow_archetype="",
        target_platforms=[],
        automation_level="",
        workflow_json={},
        summary_brief="",
        refinement_history=[],
    )


# ---------------------------------------------------------------------------
# POST /api/brainstorm/start
# ---------------------------------------------------------------------------

class StartRequest(BaseModel):
    raw_idea: str
    platforms: list[str] = []


@router.post("/start")
async def brainstorm_start(body: StartRequest):
    """
    Submit the initial idea.
    Creates a session, runs intake + first clarification node.
    Returns: session_id, first question (or ready_to_generate if idea is crystal clear).
    Accepts optional `platforms` — pre-populates target_platforms so the AI skips that question.
    """
    if not body.raw_idea.strip():
        raise HTTPException(status_code=400, detail="raw_idea cannot be empty")

    # Create session row in Supabase
    session = models.create_session(body.raw_idea.strip())
    session_id = session["id"]

    # Initialize state, pre-seeding platforms if the user already selected them
    state = _empty_state(body.raw_idea.strip())
    if body.platforms:
        state["target_platforms"] = [p.strip() for p in body.platforms if p.strip()]

    # Run intake node
    intake_updates = intake_node(state)
    state.update(intake_updates)

    # Run first clarification node
    clarification_updates = clarification_node(state)
    state.update(clarification_updates)

    # Persist state to Redis
    save_session_state(session_id, dict(state))

    # Persist question to Supabase
    models.update_session(session_id, {
        "clarifying_questions": state["clarifying_questions"],
        "question_round": state["question_round"],
    })

    if state.get("ready_to_generate"):
        # Idea was clear enough to skip all questions
        idea_summary = generate_idea_summary(
            state["raw_idea"],
            state["clarifying_questions"],
            state["clarifying_answers"],
        )
        models.update_session(session_id, {"status": "confirmed", "idea_summary": idea_summary})
        return {
            "session_id": session_id,
            "ready_to_generate": True,
            "idea_summary": idea_summary,
            "question_round": state["question_round"],
        }

    return {
        "session_id": session_id,
        "ready_to_generate": False,
        "question": state["clarifying_questions"][-1],
        "question_round": state["question_round"],
    }


# ---------------------------------------------------------------------------
# POST /api/brainstorm/respond
# ---------------------------------------------------------------------------

class RespondRequest(BaseModel):
    session_id: str
    answer: str


@router.post("/respond")
async def brainstorm_respond(body: RespondRequest):
    """
    Submit an answer to the current clarifying question.
    Runs clarification node again. Returns next question or ready_to_generate + idea_summary.
    """
    if not body.answer.strip():
        raise HTTPException(status_code=400, detail="answer cannot be empty")

    # Load state from Redis
    state = load_session_state(body.session_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    # Append answer
    state["clarifying_answers"] = state.get("clarifying_answers", []) + [body.answer.strip()]

    # Run clarification node
    clarification_updates = clarification_node(state)
    state.update(clarification_updates)

    # Persist updated state
    save_session_state(body.session_id, state)

    # Persist to Supabase
    models.update_session(body.session_id, {
        "clarifying_questions": state["clarifying_questions"],
        "clarifying_answers": state["clarifying_answers"],
        "question_round": state["question_round"],
    })

    if state.get("ready_to_generate"):
        # Generate confirmation summary
        idea_summary = generate_idea_summary(
            state["raw_idea"],
            state["clarifying_questions"],
            state["clarifying_answers"],
        )
        models.update_session(body.session_id, {
            "status": "confirmed",
            "idea_summary": idea_summary,
        })
        # Persist summary to state cache too
        state["summary_brief"] = idea_summary
        save_session_state(body.session_id, state)

        return {
            "session_id": body.session_id,
            "ready_to_generate": True,
            "idea_summary": idea_summary,
            "question_round": state["question_round"],
        }

    return {
        "session_id": body.session_id,
        "ready_to_generate": False,
        "question": state["clarifying_questions"][-1],
        "question_round": state["question_round"],
    }
