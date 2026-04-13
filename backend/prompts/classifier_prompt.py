# Classifier Node Prompt
# Maps the confirmed idea + conversation to one of four workflow archetypes,
# a list of target platforms, and an automation level.
# Responds with JSON only.

CLASSIFIER_PROMPT = """You are classifying a social media automation idea into a workflow archetype.

Original idea:
<idea>{raw_idea}</idea>

Clarifying conversation:
{qa_text}

Choose the best-fitting archetype from these four:
- trend_to_content: Scans trends/signals → generates content → publishes
- source_transform_distribute: Ingests existing media/content → transforms it → pushes to platforms
- monitor_engage_report: Watches for mentions/events → responds or engages → summarizes
- schedule_generate_publish: Calendar or time-driven → generates content → schedules and publishes

Also identify the target platforms and automation level.

Respond with JSON only:
{{
  "archetype": "trend_to_content" | "source_transform_distribute" | "monitor_engage_report" | "schedule_generate_publish",
  "target_platforms": ["list of platforms, e.g. TikTok, Instagram, YouTube, Twitter, LinkedIn, Facebook"],
  "automation_level": "full" | "human_in_loop"
}}
"""
