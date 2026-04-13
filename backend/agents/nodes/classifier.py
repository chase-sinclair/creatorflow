import json
import time
import anthropic
from agents.state import CreatorFlowState
from prompts.classifier_prompt import CLASSIFIER_PROMPT

client = anthropic.Anthropic()
MODEL = "claude-sonnet-4-20250514"

VALID_ARCHETYPES = {
    "trend_to_content",
    "source_transform_distribute",
    "monitor_engage_report",
    "schedule_generate_publish",
}


def _call_claude(prompt: str, max_tokens: int = 400) -> str:
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


def classifier_node(state: CreatorFlowState) -> dict:
    """
    Classifies the confirmed idea into a workflow archetype, target platforms,
    and automation level using the full Q&A context.
    """
    questions = state.get("clarifying_questions", [])
    answers = state.get("clarifying_answers", [])

    qa_pairs = []
    for i, q in enumerate(questions):
        qa_pairs.append(f"Q: {q}")
        if i < len(answers):
            qa_pairs.append(f"A: {answers[i]}")
    qa_text = "\n".join(qa_pairs) if qa_pairs else "(No clarifying conversation)"

    prompt = CLASSIFIER_PROMPT.format(
        raw_idea=state["raw_idea"],
        qa_text=qa_text,
    )
    text = _call_claude(prompt, max_tokens=400)

    try:
        result = json.loads(text)
        archetype = result.get("archetype", "trend_to_content")
        if archetype not in VALID_ARCHETYPES:
            archetype = "trend_to_content"
        platforms = result.get("target_platforms", [])
        automation_level = result.get("automation_level", "full")
        if automation_level not in ("full", "human_in_loop"):
            automation_level = "full"
    except (json.JSONDecodeError, KeyError):
        archetype = "trend_to_content"
        platforms = []
        automation_level = "full"

    return {
        "workflow_archetype": archetype,
        "target_platforms": platforms,
        "automation_level": automation_level,
    }
