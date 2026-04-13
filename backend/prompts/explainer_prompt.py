# Explainer Node Prompt
# Produces a plain-English summary brief from the workflow JSON.
# 3-5 sentences covering: what it does end-to-end, what it automates, what a human sets up.
# Written for a non-technical audience.

EXPLAINER_PROMPT = """You are writing a plain-English summary of a social media automation workflow for a non-technical user.

Here is the workflow:
{workflow_json}

Write 3-5 sentences that:
1. Describe what this workflow does from start to finish in simple terms
2. Explain what it automates (what the user no longer has to do manually)
3. Mention what a person needs to set up once to get it running (API keys, accounts, preferences)

Rules:
- No technical jargon — write like you're explaining to a friend who isn't in tech
- Be specific about the platforms and actions involved
- Keep it upbeat and focused on the value this delivers
- Respond with just the summary text, no headings or bullet points
"""
