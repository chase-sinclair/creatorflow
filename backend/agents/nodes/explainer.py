import json
import time
import anthropic
from agents.state import CreatorFlowState
from prompts.explainer_prompt import EXPLAINER_PROMPT

client = anthropic.Anthropic()
MODEL = "claude-sonnet-4-20250514"


def _call_claude(prompt: str, max_tokens: int = 500) -> str:
    for attempt in range(3):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text.strip()
        except anthropic.APIStatusError as e:
            if e.status_code == 529 and attempt < 2:
                time.sleep(10 * (attempt + 1))
                continue
            raise


def explainer_node(state: CreatorFlowState) -> dict:
    """
    Produces a plain-English summary brief from the workflow JSON.
    3-5 sentences suitable for non-technical users.
    """
    workflow_json = state.get("workflow_json", {})

    prompt = EXPLAINER_PROMPT.format(
        workflow_json=json.dumps(workflow_json, indent=2),
    )
    summary_brief = _call_claude(prompt, max_tokens=500)

    return {"summary_brief": summary_brief}
