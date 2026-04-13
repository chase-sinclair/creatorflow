from langgraph.graph import StateGraph, END, START
from agents.state import CreatorFlowState
from agents.nodes.intake import intake_node
from agents.nodes.clarification import clarification_node
from agents.nodes.classifier import classifier_node
from agents.nodes.designer import designer_node
from agents.nodes.explainer import explainer_node


# ---------------------------------------------------------------------------
# Routing functions — read state flags set by nodes
# ---------------------------------------------------------------------------

def route_after_intake(state: CreatorFlowState) -> str:
    """Route to clarification if needed, skip straight to classifier if idea is clear."""
    if state.get("needs_clarification", True):
        return "clarification"
    return "classifier"


def route_after_clarification(state: CreatorFlowState) -> str:
    """
    Loop back to clarification if more questions are needed.
    Proceed to classifier when ready_to_generate is True or max rounds hit.
    """
    if state.get("ready_to_generate", False):
        return "classifier"
    if state.get("question_round", 0) >= 4:
        return "classifier"
    return "clarification"


# ---------------------------------------------------------------------------
# Graph assembly
# ---------------------------------------------------------------------------

def build_graph() -> StateGraph:
    graph = StateGraph(CreatorFlowState)

    # Register nodes
    graph.add_node("intake", intake_node)
    graph.add_node("clarification", clarification_node)
    graph.add_node("classifier", classifier_node)
    graph.add_node("designer", designer_node)
    graph.add_node("explainer", explainer_node)

    # Entry point
    graph.set_entry_point("intake")

    # Conditional edge: intake → clarification or classifier
    graph.add_conditional_edges(
        "intake",
        route_after_intake,
        {
            "clarification": "clarification",
            "classifier": "classifier",
        },
    )

    # Conditional edge: clarification → loop back or proceed
    graph.add_conditional_edges(
        "clarification",
        route_after_clarification,
        {
            "clarification": "clarification",   # Loop: ask another question
            "classifier": "classifier",          # Done: proceed to generation
        },
    )

    # Linear edges through generation pipeline
    graph.add_edge("classifier", "designer")
    graph.add_edge("designer", "explainer")
    graph.add_edge("explainer", END)

    return graph.compile()


# Compiled graph — import this in Phase 4 API endpoints
pipeline = build_graph()
