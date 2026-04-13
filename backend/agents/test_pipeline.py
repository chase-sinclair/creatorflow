"""
End-to-end test for the CreatorFlow LangGraph pipeline.

Simulates the full user journey:
  1. User submits a raw idea
  2. Intake node assesses clarity
  3. Clarification node asks one question (loop fires at least once)
  4. Pre-loaded answer triggers completeness check → routes to classifier
  5. Classifier → Designer → Explainer

Run from the backend/ directory:
    python agents/test_pipeline.py
"""

import json
import sys
import os

# Allow imports from backend/ root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from agents.graph import pipeline

TEST_IDEA = "I want to scan trending TikTok sounds each week and automatically create slideshows"

# Pre-load one answer that covers both platform and automation level.
# This simulates a user responding to the first clarifying question.
# The clarification node will generate a question, then on the next pass
# see this answer exists and assess completeness → route to classifier.
PRE_LOADED_ANSWERS = [
    "I want to post to TikTok and Instagram, and I want it fully automated with no manual steps.",
    "My goal is to grow my following as a content creator by posting trending content consistently.",
]

initial_state = {
    "raw_idea": TEST_IDEA,
    "clarifying_questions": [],
    "clarifying_answers": PRE_LOADED_ANSWERS,
    "question_round": 0,
    "needs_clarification": False,
    "ready_to_generate": False,
    "workflow_archetype": "",
    "target_platforms": [],
    "automation_level": "",
    "workflow_json": {},
    "summary_brief": "",
    "refinement_history": [],
}


def main():
    print("=" * 60)
    print("CreatorFlow Pipeline Test")
    print("=" * 60)
    print(f"\nIdea: {TEST_IDEA}\n")
    print("Running pipeline...\n")

    result = pipeline.invoke(initial_state)

    print("--- CLARIFICATION ---")
    for i, q in enumerate(result.get("clarifying_questions", [])):
        print(f"Q{i+1}: {q}")
        answers = result.get("clarifying_answers", [])
        if i < len(answers):
            print(f"A{i+1}: {answers[i]}")
    print(f"Rounds: {result.get('question_round', 0)}")

    print("\n--- CLASSIFICATION ---")
    print(f"Archetype:         {result.get('workflow_archetype')}")
    print(f"Platforms:         {result.get('target_platforms')}")
    print(f"Automation level:  {result.get('automation_level')}")

    print("\n--- WORKFLOW JSON ---")
    wf = result.get("workflow_json", {})
    nodes = wf.get("nodes", [])
    edges = wf.get("edges", [])
    print(f"Nodes ({len(nodes)}):")
    for n in nodes:
        print(f"  [{n['id']}] {n['label']} — {n.get('description', '')}")
    print(f"Edges ({len(edges)}):")
    for e in edges:
        print(f"  {e['from']} -> {e['to']}  ({e.get('label', '')})")

    print("\n--- SUMMARY BRIEF ---")
    print(result.get("summary_brief", "(empty)"))

    # Assertions
    print("\n--- VALIDATION ---")
    assert len(nodes) >= 4, f"FAIL: expected >= 4 nodes, got {len(nodes)}"
    print(f"[OK] Node count: {len(nodes)}")

    assert len(edges) >= 1, f"FAIL: expected edges, got {len(edges)}"
    print(f"[OK] Edge count: {len(edges)}")

    assert result.get("summary_brief"), "FAIL: summary_brief is empty"
    print("[OK] Summary brief present")

    assert result.get("question_round", 0) >= 1, "FAIL: clarification loop never fired"
    print(f"[OK] Clarification loop fired {result['question_round']} time(s)")

    assert result.get("workflow_archetype") in {
        "trend_to_content", "source_transform_distribute",
        "monitor_engage_report", "schedule_generate_publish"
    }, f"FAIL: invalid archetype {result.get('workflow_archetype')}"
    print(f"[OK] Valid archetype: {result['workflow_archetype']}")

    print("\n*** All checks passed. ***\n")


if __name__ == "__main__":
    main()
