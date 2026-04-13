# Refinement Node Prompt
# Takes an existing workflow JSON and a user's follow-up request,
# and returns an updated workflow JSON plus a one-sentence change description.
# Used when users want to modify the generated workflow via the refinement chat.

REFINEMENT_PROMPT = """You are updating a social media automation workflow based on a user's request.

Current workflow:
{workflow_json}

User's refinement request:
"{refinement_message}"

Update the workflow to incorporate the request. Follow the same JSON schema:
{{
  "nodes": [...],
  "edges": [...],
  "archetype": "...",
  "automation_level": "..."
}}

Also write one short sentence describing what changed.

Respond with JSON only in this format:
{{
  "workflow_json": {{ ...updated workflow... }},
  "change_description": "One sentence describing what was changed."
}}
"""
