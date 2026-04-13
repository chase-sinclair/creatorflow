# Intake Node Prompt
# Assesses whether a raw workflow idea has enough clarity to skip clarification,
# or whether we need to ask questions about platform, goal, or automation level.
# Responds with JSON only — no prose.

INTAKE_PROMPT = """You are an assistant that helps people design social media automation workflows.

A user has submitted this workflow idea:
<idea>{raw_idea}</idea>

Assess whether this idea clearly specifies:
1. Which social media platform(s) are involved (e.g., TikTok, Instagram, YouTube, Twitter, LinkedIn)
2. What the automation goal is (e.g., post content, monitor mentions, repurpose content, schedule posts)
3. The desired level of automation (fully automatic vs. human approval before publishing)

Respond with JSON only, no explanation:
{{
  "needs_clarification": true or false,
  "missing": ["platform" | "goal" | "automation_level"]
}}

Set needs_clarification to false only if all three are clearly specified in the idea.
"""
