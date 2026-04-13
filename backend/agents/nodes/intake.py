import json
import time
import anthropic
from agents.state import CreatorFlowState
from prompts.intake_prompt import INTAKE_PROMPT

client = anthropic.Anthropic()
MODEL = "claude-sonnet-4-20250514"


def _call_claude(prompt: str, max_tokens: int = 300) -> str:
    for attempt in range(3):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            return text
        except anthropic.APIStatusError as e:
            if e.status_code == 529 and attempt < 2:
                time.sleep(10 * (attempt + 1))
                continue
            raise


def intake_node(state: CreatorFlowState) -> dict:
    """
    Assesses whether the raw idea is clear enough to skip clarification.
    Sets needs_clarification and initializes list fields if empty.
    """
    prompt = INTAKE_PROMPT.format(raw_idea=state["raw_idea"])
    text = _call_claude(prompt, max_tokens=300)

    try:
        result = json.loads(text)
        needs_clarification = result.get("needs_clarification", True)
    except (json.JSONDecodeError, KeyError):
        needs_clarification = True

    return {
        "needs_clarification": needs_clarification,
        "clarifying_questions": state.get("clarifying_questions", []),
        "clarifying_answers": state.get("clarifying_answers", []),
        "question_round": state.get("question_round", 0),
        "ready_to_generate": False,
        "refinement_history": state.get("refinement_history", []),
    }
