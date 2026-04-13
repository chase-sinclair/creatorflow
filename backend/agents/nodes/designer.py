import json
import time
import anthropic
from agents.state import CreatorFlowState
from prompts.designer_prompt import DESIGNER_PROMPT

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


def _build_qa_text(state: CreatorFlowState) -> str:
    questions = state.get("clarifying_questions", [])
    answers = state.get("clarifying_answers", [])
    if not questions:
        return "(No clarifying conversation)"
    pairs = []
    for i, q in enumerate(questions):
        pairs.append(f"Q: {q}")
        if i < len(answers):
            pairs.append(f"A: {answers[i]}")
    return "\n".join(pairs)


def designer_node(state: CreatorFlowState) -> dict:
    """
    Generates the full workflow JSON (React Flow-compatible) using Claude.
    Uses max_tokens: 2000 for detailed node/edge descriptions.
    """
    archetype = state.get("workflow_archetype", "trend_to_content")
    platforms = ", ".join(state.get("target_platforms", [])) or "unspecified platforms"
    automation_level = state.get("automation_level", "full")
    qa_text = _build_qa_text(state)

    prompt = DESIGNER_PROMPT.format(
        raw_idea=state["raw_idea"],
        qa_text=qa_text,
        archetype=archetype,
        platforms=platforms,
        automation_level=automation_level,
    )
    text = _call_claude(prompt, max_tokens=2000)

    try:
        workflow_json = json.loads(text)
        if "nodes" not in workflow_json:
            workflow_json["nodes"] = []
        if "edges" not in workflow_json:
            workflow_json["edges"] = []
        if "archetype" not in workflow_json:
            workflow_json["archetype"] = archetype
        if "automation_level" not in workflow_json:
            workflow_json["automation_level"] = automation_level
    except json.JSONDecodeError:
        workflow_json = {
            "nodes": [
                {
                    "id": "node_1",
                    "type": "agent",
                    "label": "Source",
                    "description": "Collects input data",
                    "tools": [],
                    "inputs": ["User configuration"],
                    "outputs": ["Raw data"],
                }
            ],
            "edges": [],
            "archetype": archetype,
            "automation_level": automation_level,
        }

    return {"workflow_json": workflow_json}
