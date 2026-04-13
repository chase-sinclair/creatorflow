from typing import TypedDict


class CreatorFlowState(TypedDict):
    raw_idea: str
    clarifying_questions: list[str]
    clarifying_answers: list[str]
    question_round: int
    workflow_archetype: str
    target_platforms: list[str]
    automation_level: str        # "full" or "human_in_loop"
    workflow_json: dict
    summary_brief: str
    refinement_history: list[dict]
