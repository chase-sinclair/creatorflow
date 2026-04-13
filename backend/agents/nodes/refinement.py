import json
import time
import anthropic
from agents.state import CreatorFlowState
from prompts.refinement_prompt import REFINEMENT_PROMPT

client = anthropic.Anthropic()
MODEL = "claude-sonnet-4-20250514"


def _call_claude(prompt: str, max_tokens: int = 2000) -> str:
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


def refinement_node(state: CreatorFlowState, refinement_message: str) -> dict:
    """
    Updates an existing workflow based on a user's follow-up request.
    Returns updated workflow_json, change_description, and appended refinement_history.

    Called directly from the API layer (Phase 4), not part of the main pipeline.
    """
    workflow_json = state.get("workflow_json", {})
    refinement_history = state.get("refinement_history", [])

    prompt = REFINEMENT_PROMPT.format(
        workflow_json=json.dumps(workflow_json, indent=2),
        refinement_message=refinement_message,
    )
    text = _call_claude(prompt, max_tokens=2000)

    try:
        result = json.loads(text)
        updated_workflow = result.get("workflow_json", workflow_json)
        change_description = result.get("change_description", "Workflow updated.")
        if "nodes" not in updated_workflow:
            updated_workflow = workflow_json
    except (json.JSONDecodeError, KeyError):
        updated_workflow = workflow_json
        change_description = "Workflow updated based on your request."

    return {
        "workflow_json": updated_workflow,
        "change_description": change_description,
        "refinement_history": refinement_history + [
            {"message": refinement_message, "change_description": change_description}
        ],
    }
