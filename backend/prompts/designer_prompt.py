# Designer Node Prompt
# Generates the full workflow JSON given the archetype and all collected context.
# This is the most important prompt — it produces the React Flow-compatible graph.
# Uses max_tokens: 2000 to allow for detailed node descriptions.
# Responds with JSON only — must always be valid.

DESIGNER_PROMPT = """You are designing a social media automation workflow for a non-technical user.

Original idea:
<idea>{raw_idea}</idea>

Clarifying conversation:
{qa_text}

Workflow archetype: {archetype}
Target platforms: {platforms}
Automation level: {automation_level}

Design a complete workflow as structured JSON. Follow this schema exactly:

{{
  "nodes": [
    {{
      "id": "node_1",
      "type": "agent",
      "label": "Short plain-English name (2-4 words)",
      "description": "One sentence describing exactly what this agent does",
      "tools": ["Real tool or API names, e.g. TikTok API, OpenAI Whisper, YouTube Data API"],
      "inputs": ["What this node receives"],
      "outputs": ["What this node produces"]
    }}
  ],
  "edges": [
    {{
      "from": "node_1",
      "to": "node_2",
      "label": "Short description of what is passed"
    }}
  ],
  "archetype": "{archetype}",
  "automation_level": "{automation_level}"
}}

Requirements:
- Include 4-6 nodes that form a logical, linear or lightly branching flow
- First node should be the trigger/source (green in UI)
- Last node should be the output/publish step (purple in UI)
- Labels must be plain English — no technical jargon visible to the user
- Descriptions must be one clear sentence a non-technical person can understand
- Tools should be real, named APIs or services (not generic "API")
- If automation_level is human_in_loop, include one "Approval Gate" node before any publish step
- Respond with the JSON object only, no explanation or markdown code fences
"""
