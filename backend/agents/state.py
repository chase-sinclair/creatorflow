from typing import TypedDict


class CreatorFlowState(TypedDict):
    # Core idea content
    raw_idea: str
    clarifying_questions: list[str]
    clarifying_answers: list[str]
    question_round: int

    # Routing signals (set by nodes, read by conditional edges)
    needs_clarification: bool   # Set by intake node
    ready_to_generate: bool     # Set by clarification node when enough info is collected

    # Classification output
    workflow_archetype: str     # One of four archetypes
    target_platforms: list[str]
    automation_level: str       # "full" or "human_in_loop"

    # Generation output
    workflow_json: dict
    summary_brief: str

    # Refinement
    refinement_history: list[dict]
