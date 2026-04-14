import json
import time
import anthropic
from agents.state import CreatorFlowState
from prompts.clarification_prompt import ASSESS_COMPLETENESS_PROMPT, GENERATE_QUESTION_PROMPT

client = anthropic.Anthropic()
MODEL = "claude-sonnet-4-20250514"


def _format_list(items: list[str], prefix: str = "") -> str:
    if not items:
        return "(none yet)"
    return "\n".join(f"{prefix}{i + 1}. {item}" for i, item in enumerate(items))


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


def clarification_node(state: CreatorFlowState) -> dict:
    """
    Two-step node:
    1. If we've asked at least one question and have a matching answer, assess completeness.
       If complete (or question_round >= 4), mark ready_to_generate.
    2. Otherwise, generate the next clarifying question.
    """
    questions = state.get("clarifying_questions", [])
    answers = state.get("clarifying_answers", [])
    round_num = state.get("question_round", 0)

    # Build platforms context string — injected into both prompts so Claude
    # knows not to ask about platforms that were pre-selected by the user.
    pre_platforms = state.get("target_platforms") or []
    if pre_platforms:
        platforms_note = (
            f"Pre-selected platforms (already known — do NOT ask about these): "
            f"{', '.join(pre_platforms)}"
        )
    else:
        platforms_note = ""

    # If we have answers matching all asked questions, assess whether to continue
    if round_num > 0 and len(answers) >= len(questions):
        # Max rounds reached — proceed regardless
        if round_num >= 4:
            return {"ready_to_generate": True}

        # Ask Claude if we have enough info to proceed
        assess_prompt = ASSESS_COMPLETENESS_PROMPT.format(
            raw_idea=state["raw_idea"],
            platforms_note=platforms_note,
            questions_text=_format_list(questions),
            answers_text=_format_list(answers),
        )
        text = _call_claude(assess_prompt, max_tokens=200)
        try:
            result = json.loads(text)
            if result.get("complete", False):
                return {"ready_to_generate": True}
            missing = result.get("still_missing", ["goal"])
            # If platform was pre-set, never count it as missing
            if pre_platforms:
                missing = [m for m in missing if m != "platform"]
            if not missing:
                return {"ready_to_generate": True}
            missing_info = " and ".join(missing)
        except (json.JSONDecodeError, KeyError):
            return {"ready_to_generate": True}
    else:
        if pre_platforms:
            missing_info = "what the main goal is and whether they want fully automatic or human-in-the-loop"
        else:
            missing_info = "which social media platforms they want to use and what the main goal is"

    # Generate the next clarifying question
    question_prompt = GENERATE_QUESTION_PROMPT.format(
        raw_idea=state["raw_idea"],
        platforms_note=platforms_note,
        questions_text=_format_list(questions),
        answers_text=_format_list(answers),
        missing_info=missing_info,
    )
    question = _call_claude(question_prompt, max_tokens=150)
    question = question.strip('"').strip("'")

    return {
        "clarifying_questions": questions + [question],
        "question_round": round_num + 1,
        "ready_to_generate": False,
    }
