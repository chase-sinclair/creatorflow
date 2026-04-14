# Clarification Node Prompts
# Two prompts: one to assess whether we have enough info to proceed,
# and one to generate the next single clarifying question.
# Questions must be plain English and friendly — never technical.

ASSESS_COMPLETENESS_PROMPT = """You are helping someone design a social media automation workflow.

Original idea:
<idea>{raw_idea}</idea>

{platforms_note}

Questions asked so far:
{questions_text}

Answers received:
{answers_text}

Based on the idea and conversation so far, assess whether we now know enough about:
1. Which social media platform(s) to use (may already be answered — see above)
2. What the main automation goal is
3. Whether they want fully automatic or human-in-the-loop (approval before posting)

Respond with JSON only:
{{
  "complete": true or false,
  "still_missing": ["platform" | "goal" | "automation_level"]
}}
"""

GENERATE_QUESTION_PROMPT = """You are a friendly assistant helping someone design a social media automation workflow.

Original idea:
<idea>{raw_idea}</idea>

{platforms_note}

Questions asked so far:
{questions_text}

Answers so far:
{answers_text}

The most important thing we still don't know is: {missing_info}

Generate ONE short, friendly, plain-English question to find this out.
- Never use technical jargon
- Never ask multiple things at once
- Keep it conversational, like a helpful colleague asking a quick follow-up
- If platforms are already known (see above), do NOT ask about them again
- Respond with just the question text, nothing else
"""
