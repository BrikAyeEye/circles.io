"""
Synthetic research engine utilities.

This package currently provides a lightweight, deterministic engine that:
  1. Loads real session transcripts from `data/ground_truth/ground_truth_sessions.json`.
  2. Builds simple archetype profiles from the ground truth.
  3. Generates deterministic "simulated" sessions by sampling ground-truth turns.
  4. Produces aggregate analytics that can feed into later LLM-powered steps.

It is intentionally LLM-free so we can exercise the pipeline locally and keep
token costs at zero while we iterate on the surrounding product experience.

When we are ready to plug in an LLM, we can extend `research_engine.py`
to swap out the heuristic summarizers with actual prompt calls.
"""

from .ground_truth import GroundTruthCorpus, Session, Turn
from .research_engine import SyntheticResearchEngine

__all__ = [
    "GroundTruthCorpus",
    "SyntheticResearchEngine",
    "Session",
    "Turn",
]

