import json
import time

import anthropic
from fastapi import APIRouter
from pydantic import BaseModel

from db import models

_anthropic_client = None

def _get_client():
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic()
    return _anthropic_client

router = APIRouter(prefix="/api/content", tags=["content"])

# ---------------------------------------------------------------------------
# Seed data — mirrors frontend/src/lib/constants.js
# ---------------------------------------------------------------------------

EXAMPLE_SEED = [
    {
        "title": "Trend-to-Reel Pipeline",
        "description": "Scans TikTok weekly trends, generates short-form scripts, and auto-posts reels to Instagram and TikTok.",
        "persona": "For Creators",
        "archetype": "trend_to_content",
        "platforms": ["TikTok", "Instagram"],
        "display_order": 1,
        "workflow_json": {
            "nodes": [
                {"id": "n1", "type": "agent", "label": "Trend Scanner", "description": "Monitors TikTok weekly trends and surfaces the top 5 by engagement.", "tools": ["TikTok API"], "inputs": ["Time window"], "outputs": ["Trend list"]},
                {"id": "n2", "type": "agent", "label": "Script Writer", "description": "Writes a short-form video script for each trend.", "tools": ["Claude API"], "inputs": ["Trend list"], "outputs": ["Scripts"]},
                {"id": "n3", "type": "agent", "label": "Video Renderer", "description": "Renders vertical video from script and stock footage.", "tools": ["RunwayML"], "inputs": ["Scripts"], "outputs": ["Video files"]},
                {"id": "n4", "type": "agent", "label": "Publisher", "description": "Uploads videos with captions and hashtags to TikTok and Instagram.", "tools": ["TikTok API", "Instagram Graph API"], "inputs": ["Video files"], "outputs": ["Published posts"]},
            ],
            "edges": [
                {"from": "n1", "to": "n2", "label": "Trend data"},
                {"from": "n2", "to": "n3", "label": "Scripts"},
                {"from": "n3", "to": "n4", "label": "Videos"},
            ],
            "archetype": "trend_to_content",
            "automation_level": "full",
        },
    },
    {
        "title": "YouTube → Newsletter Repurposer",
        "description": "Pulls your latest YouTube video, extracts key insights, and sends a weekly email digest.",
        "persona": "For Creators",
        "archetype": "source_transform_distribute",
        "platforms": ["YouTube", "Email"],
        "display_order": 2,
        "workflow_json": {
            "nodes": [
                {"id": "n1", "type": "agent", "label": "Video Ingester", "description": "Fetches the latest video from your YouTube channel.", "tools": ["YouTube Data API"], "inputs": ["Channel ID"], "outputs": ["Video URL"]},
                {"id": "n2", "type": "agent", "label": "Transcript Extractor", "description": "Transcribes the video audio into text.", "tools": ["OpenAI Whisper"], "inputs": ["Video URL"], "outputs": ["Transcript"]},
                {"id": "n3", "type": "agent", "label": "Summary Writer", "description": "Extracts key insights and writes a newsletter-style recap.", "tools": ["Claude API"], "inputs": ["Transcript"], "outputs": ["Newsletter draft"]},
                {"id": "n4", "type": "agent", "label": "Email Sender", "description": "Sends the newsletter to your subscriber list.", "tools": ["Mailchimp API"], "inputs": ["Newsletter draft"], "outputs": ["Sent email"]},
            ],
            "edges": [
                {"from": "n1", "to": "n2", "label": "Video URL"},
                {"from": "n2", "to": "n3", "label": "Transcript"},
                {"from": "n3", "to": "n4", "label": "Newsletter draft"},
            ],
            "archetype": "source_transform_distribute",
            "automation_level": "full",
        },
    },
    {
        "title": "Brand Mention Monitor",
        "description": "Watches Twitter and Reddit for brand mentions, drafts personalized replies, and sends a daily report.",
        "persona": "For Marketing Teams",
        "archetype": "monitor_engage_report",
        "platforms": ["Twitter", "Reddit"],
        "display_order": 3,
        "workflow_json": {
            "nodes": [
                {"id": "n1", "type": "agent", "label": "Mention Listener", "description": "Scans Twitter and Reddit for mentions of your brand name.", "tools": ["Twitter API v2", "Reddit API"], "inputs": ["Brand keywords"], "outputs": ["Mention list"]},
                {"id": "n2", "type": "agent", "label": "Sentiment Classifier", "description": "Categorizes each mention as positive, neutral, or negative.", "tools": ["Claude API"], "inputs": ["Mention list"], "outputs": ["Classified mentions"]},
                {"id": "n3", "type": "agent", "label": "Reply Drafter", "description": "Drafts a personalized response for each mention.", "tools": ["Claude API"], "inputs": ["Classified mentions"], "outputs": ["Draft replies"]},
                {"id": "n4", "type": "agent", "label": "Report Builder", "description": "Compiles a daily summary report of mentions and engagement.", "tools": ["Claude API"], "inputs": ["Classified mentions"], "outputs": ["Daily report"]},
            ],
            "edges": [
                {"from": "n1", "to": "n2", "label": "Raw mentions"},
                {"from": "n2", "to": "n3", "label": "Classified mentions"},
                {"from": "n2", "to": "n4", "label": "Mention data"},
            ],
            "archetype": "monitor_engage_report",
            "automation_level": "human_in_loop",
        },
    },
    {
        "title": "Content Calendar Autopilot",
        "description": "Takes your content calendar, generates posts for each slot, and schedules them across LinkedIn and Twitter.",
        "persona": "For Marketing Teams",
        "archetype": "schedule_generate_publish",
        "platforms": ["LinkedIn", "Twitter"],
        "display_order": 4,
        "workflow_json": {
            "nodes": [
                {"id": "n1", "type": "agent", "label": "Calendar Reader", "description": "Reads upcoming slots from your content calendar.", "tools": ["Google Calendar API", "Notion API"], "inputs": ["Calendar access"], "outputs": ["Upcoming slots"]},
                {"id": "n2", "type": "agent", "label": "Post Generator", "description": "Writes platform-appropriate posts for each calendar slot.", "tools": ["Claude API"], "inputs": ["Upcoming slots"], "outputs": ["Draft posts"]},
                {"id": "n3", "type": "agent", "label": "Approval Gate", "description": "Sends drafts for human review before publishing.", "tools": ["Slack API", "Email"], "inputs": ["Draft posts"], "outputs": ["Approved posts"]},
                {"id": "n4", "type": "agent", "label": "Scheduler", "description": "Queues approved posts for publish at the scheduled time.", "tools": ["Buffer API", "LinkedIn API", "Twitter API v2"], "inputs": ["Approved posts"], "outputs": ["Scheduled posts"]},
            ],
            "edges": [
                {"from": "n1", "to": "n2", "label": "Calendar slots"},
                {"from": "n2", "to": "n3", "label": "Draft posts"},
                {"from": "n3", "to": "n4", "label": "Approved posts"},
            ],
            "archetype": "schedule_generate_publish",
            "automation_level": "human_in_loop",
        },
    },
    {
        "title": "Podcast Clip Machine",
        "description": "Transcribes your podcast episodes, finds the most shareable moments, and publishes short clips to social.",
        "persona": "For Podcasters",
        "archetype": "source_transform_distribute",
        "platforms": ["YouTube", "Instagram", "Twitter"],
        "display_order": 5,
        "workflow_json": {
            "nodes": [
                {"id": "n1", "type": "agent", "label": "Audio Ingester", "description": "Downloads the latest podcast episode audio.", "tools": ["RSS Feed", "Podcast hosting API"], "inputs": ["RSS feed URL"], "outputs": ["Audio file"]},
                {"id": "n2", "type": "agent", "label": "Transcriber", "description": "Converts the full episode audio to a text transcript.", "tools": ["OpenAI Whisper"], "inputs": ["Audio file"], "outputs": ["Transcript"]},
                {"id": "n3", "type": "agent", "label": "Highlight Picker", "description": "Identifies the 3 most engaging moments for short clips.", "tools": ["Claude API"], "inputs": ["Transcript"], "outputs": ["Clip timestamps"]},
                {"id": "n4", "type": "agent", "label": "Clip Publisher", "description": "Creates short video clips and posts them to YouTube Shorts, Instagram Reels, and Twitter.", "tools": ["FFmpeg", "YouTube Data API", "Instagram Graph API", "Twitter API v2"], "inputs": ["Clip timestamps", "Audio file"], "outputs": ["Published clips"]},
            ],
            "edges": [
                {"from": "n1", "to": "n2", "label": "Audio file"},
                {"from": "n2", "to": "n3", "label": "Transcript"},
                {"from": "n3", "to": "n4", "label": "Clip timestamps"},
            ],
            "archetype": "source_transform_distribute",
            "automation_level": "full",
        },
    },
    {
        "title": "Local Business Promoter",
        "description": "Monitors local events and seasonal hooks, creates promotional posts, and publishes to Facebook and Instagram.",
        "persona": "For Small Business",
        "archetype": "schedule_generate_publish",
        "platforms": ["Facebook", "Instagram"],
        "display_order": 6,
        "workflow_json": {
            "nodes": [
                {"id": "n1", "type": "agent", "label": "Event Scanner", "description": "Finds upcoming local events and seasonal opportunities relevant to your business.", "tools": ["Google Calendar API", "Eventbrite API"], "inputs": ["Business location", "Industry"], "outputs": ["Event list"]},
                {"id": "n2", "type": "agent", "label": "Copy Writer", "description": "Writes engaging promotional copy tailored to each event.", "tools": ["Claude API"], "inputs": ["Event list"], "outputs": ["Post copy"]},
                {"id": "n3", "type": "agent", "label": "Image Generator", "description": "Creates branded social images for each post.", "tools": ["DALL-E API", "Canva API"], "inputs": ["Post copy"], "outputs": ["Post images"]},
                {"id": "n4", "type": "agent", "label": "Publisher", "description": "Schedules and publishes posts to Facebook and Instagram.", "tools": ["Facebook Graph API", "Instagram Graph API"], "inputs": ["Post copy", "Post images"], "outputs": ["Published posts"]},
            ],
            "edges": [
                {"from": "n1", "to": "n2", "label": "Event data"},
                {"from": "n2", "to": "n3", "label": "Post copy"},
                {"from": "n3", "to": "n4", "label": "Copy + images"},
            ],
            "archetype": "schedule_generate_publish",
            "automation_level": "full",
        },
    },
]

IDEA_PROMPT_SEED = [
    # Solo Creator
    {"persona": "Solo Creator", "prompt_text": "Automatically clip highlights from my weekly YouTube video and post them to TikTok and Instagram Reels.", "archetype": "source_transform_distribute", "platforms": ["YouTube", "TikTok", "Instagram"], "display_order": 1},
    {"persona": "Solo Creator", "prompt_text": "Scan trending audio on TikTok each week and generate video concepts I can film — delivered to my inbox Monday morning.", "archetype": "trend_to_content", "platforms": ["TikTok"], "display_order": 2},
    {"persona": "Solo Creator", "prompt_text": "Turn my Twitter threads into LinkedIn articles automatically and post them the same day.", "archetype": "source_transform_distribute", "platforms": ["Twitter", "LinkedIn"], "display_order": 3},
    # Marketing Team
    {"persona": "Marketing Team", "prompt_text": "Monitor brand mentions across Twitter and Reddit, draft responses for my review, and send a daily summary report.", "archetype": "monitor_engage_report", "platforms": ["Twitter", "Reddit"], "display_order": 4},
    {"persona": "Marketing Team", "prompt_text": "Pull from our content calendar and auto-generate LinkedIn and Twitter posts for every scheduled slot — human approval before publish.", "archetype": "schedule_generate_publish", "platforms": ["LinkedIn", "Twitter"], "display_order": 5},
    {"persona": "Marketing Team", "prompt_text": "Watch competitor social accounts weekly and summarize their top-performing content into a brief for our team.", "archetype": "monitor_engage_report", "platforms": ["Twitter", "Instagram", "LinkedIn"], "display_order": 6},
    # Podcast Brand
    {"persona": "Podcast Brand", "prompt_text": "Transcribe each episode, pull the three best quotes, and create audiogram posts for Twitter and Instagram automatically.", "archetype": "source_transform_distribute", "platforms": ["Twitter", "Instagram"], "display_order": 7},
    {"persona": "Podcast Brand", "prompt_text": "After each episode publishes, generate a newsletter recap with key takeaways and send it to our subscriber list.", "archetype": "source_transform_distribute", "platforms": ["Email"], "display_order": 8},
    {"persona": "Podcast Brand", "prompt_text": "Clip my guest interviews into short highlight reels and schedule them as a drip campaign across the week.", "archetype": "schedule_generate_publish", "platforms": ["YouTube", "Instagram", "Twitter"], "display_order": 9},
    # Small Business
    {"persona": "Small Business", "prompt_text": "Monitor local events and holidays, then generate timely promotional posts for our Facebook and Instagram pages.", "archetype": "schedule_generate_publish", "platforms": ["Facebook", "Instagram"], "display_order": 10},
    {"persona": "Small Business", "prompt_text": "Watch for Google reviews mentioning our business and draft personal thank-you responses I can approve with one click.", "archetype": "monitor_engage_report", "platforms": ["Google"], "display_order": 11},
    {"persona": "Small Business", "prompt_text": "Every time we add a new product, automatically create social posts for all our channels with photos and copy.", "archetype": "source_transform_distribute", "platforms": ["Facebook", "Instagram", "Twitter"], "display_order": 12},
]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/examples")
async def get_examples():
    """Return pre-built example workflows. Seeds table on first request."""
    try:
        if models.count_examples() == 0:
            models.seed_examples(EXAMPLE_SEED)
        return models.get_examples()
    except Exception:
        # If DB isn't set up yet, return hardcoded data so frontend still works
        return EXAMPLE_SEED


@router.get("/ideas")
async def get_ideas():
    """Return idea prompts organised by persona. Seeds table on first request."""
    try:
        if models.count_idea_prompts() == 0:
            models.seed_idea_prompts(IDEA_PROMPT_SEED)
        raw = models.get_idea_prompts()
        # Group by persona for convenient frontend consumption
        grouped: dict[str, list] = {}
        for p in raw:
            grouped.setdefault(p["persona"], []).append(p)
        return grouped
    except Exception:
        # Fallback to hardcoded
        grouped: dict[str, list] = {}
        for p in IDEA_PROMPT_SEED:
            grouped.setdefault(p["persona"], []).append(p)
        return grouped


@router.get("/stats")
async def get_stats():
    """Returns workflow count for the hero section counter."""
    try:
        count = models.count_workflows()
        return {"workflow_count": count}
    except Exception:
        return {"workflow_count": 0}


# ---------------------------------------------------------------------------
# POST /api/content/prompt-suggestions
# ---------------------------------------------------------------------------

class SuggestionsRequest(BaseModel):
    platforms: list[str] = []


_FALLBACK_SUGGESTIONS = [
    "Automatically schedule and publish posts across all my platforms",
    "Monitor brand mentions and draft replies for my review",
    "Repurpose my long-form content into short clips for social",
    "Generate a weekly content calendar and post everything automatically",
]

@router.post("/prompt-suggestions")
async def get_prompt_suggestions(body: SuggestionsRequest):
    """
    Generate 4 tailored automation prompt suggestions for the given platforms.
    Called after platform selection so the brainstorm chips feel relevant.
    """
    platforms_str = ", ".join(body.platforms) if body.platforms else "social media"

    prompt = f"""You are helping content creators and marketers discover social media automation ideas.

The user has selected these platforms: {platforms_str}

Generate exactly 4 short, specific automation prompt ideas tailored to these platforms.
Each idea should be:
- One sentence, plain English
- Actionable and concrete (not generic)
- Something a non-technical person would actually want
- Specific to the platforms listed when possible

Respond with a JSON array of exactly 4 strings, nothing else:
["idea 1", "idea 2", "idea 3", "idea 4"]
"""

    client = _get_client()
    for attempt in range(3):
        try:
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=400,
                messages=[{"role": "user", "content": prompt}],
            )
            text = response.content[0].text.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
            suggestions = json.loads(text)
            if isinstance(suggestions, list) and len(suggestions) >= 4:
                return {"suggestions": suggestions[:4]}
        except anthropic.APIStatusError as e:
            if e.status_code == 529 and attempt < 2:
                time.sleep(8 * (attempt + 1))
                continue
            break
        except Exception:
            break

    return {"suggestions": _FALLBACK_SUGGESTIONS}
