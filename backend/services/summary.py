"""
Generates a plain-English idea summary when brainstorming is complete.
Used to show the user a confirmation card before generating the full workflow.
"""

import time
import anthropic

client = anthropic.Anthropic()
MODEL = "claude-sonnet-4-20250514"

SUMMARY_PROMPT = """A user just finished describing their social media automation idea through a short conversation.

Original idea:
<idea>{raw_idea}</idea>

Clarifying Q&A:
{qa_text}

Write a 2-3 sentence plain-English summary of the workflow they want to build.
- Start with "Here's what we'll build:"
- Mention the platforms and what the automation does
- End with what they'll no longer have to do manually
- Keep it friendly and exciting — this is the moment before they see their workflow
- Respond with just the summary text, no labels or formatting
"""


def generate_idea_summary(raw_idea: str, questions: list[str], answers: list[str]) -> str:
    qa_pairs = []
    for i, q in enumerate(questions):
        qa_pairs.append(f"Q: {q}")
        if i < len(answers):
            qa_pairs.append(f"A: {answers[i]}")
    qa_text = "\n".join(qa_pairs) if qa_pairs else "(No clarifying conversation)"

    prompt = SUMMARY_PROMPT.format(raw_idea=raw_idea, qa_text=qa_text)

    for attempt in range(3):
        try:
            response = client.messages.create(
                model=MODEL,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text.strip()
        except anthropic.APIStatusError as e:
            if e.status_code == 529 and attempt < 2:
                time.sleep(10 * (attempt + 1))
                continue
            raise

    return f"Here's what we'll build: {raw_idea}"
