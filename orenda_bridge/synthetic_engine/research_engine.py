from __future__ import annotations

import random
from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Dict, Iterable, List, Sequence

from .ground_truth import GroundTruthCorpus, Session, Turn

# Simple keyword taxonomy we can expand later. These help us bootstrap
# archetype labeling and pattern mining without an embedding model.
CATEGORY_KEYWORDS = {
    "money": ["money", "income", "earn", "financial", "pricing", "cost"],
    "career": ["career", "work", "job", "profession", "freelance", "consulting"],
    "location": ["where", "city", "place", "country", "move", "location"],
    "care": ["child", "care", "nurture", "support", "heal"],
    "creative": ["art", "music", "creative", "design", "paint", "write"],
    "movement": ["body", "movement", "somatic", "dance", "physical"],
}


@dataclass
class SessionProfile:
    session_id: str
    dominant_categories: List[str]
    top_keywords: List[str]
    representative_user_lines: List[str]
    token_estimate: int


class SyntheticResearchEngine:
    """
    Basic, deterministic synthetic research engine.

    It does not call an LLM yet; instead it provides:
      - Archetype derivation via keyword heuristics.
      - Deterministic "simulated" sessions (sampling ground-truth turns).
      - Aggregate analytics / pattern mining.
      - Method suggestions pulled from those analytics.

    Once we are confident in the workflow we can swap the heuristics for
    actual prompt calls, but this lets us exercise the rest of the system now.
    """

    def __init__(self, corpus: GroundTruthCorpus | None = None, seed: int = 13):
        self.corpus = corpus or GroundTruthCorpus()
        self.random = random.Random(seed)
        self._profiles: List[SessionProfile] = []

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def generate_archetypes(self, max_archetypes: int = 5) -> List[SessionProfile]:
        """
        Build archetype summaries from the ground-truth sessions.
        """
        if self._profiles:
            return self._profiles[:max_archetypes]

        profiles: List[SessionProfile] = []
        for session in self.corpus:
            if not session.turns:
                continue

            keywords = self._extract_keywords(session)
            dominant = self._detect_categories(keywords)
            user_lines = self._representative_user_lines(session)

            profiles.append(
                SessionProfile(
                    session_id=session.session_id,
                    dominant_categories=dominant,
                    top_keywords=[kw for kw, _ in keywords[:8]],
                    representative_user_lines=user_lines,
                    token_estimate=session.total_tokens_estimate(),
                )
            )

        # Cache for reuse
        self._profiles = profiles
        return profiles[:max_archetypes]

    def simulate_sessions(self, count: int = 3, max_turns: int = 6) -> List[List[Turn]]:
        """
        Deterministically sample segments from the real sessions to act as
        "synthetic" practice logs. This keeps tone/style grounded in reality
        without any token cost.
        """
        simulations: List[List[Turn]] = []
        for _ in range(count):
            session = self.random.choice(self.corpus.sessions)
            if not session.turns:
                continue

            start = self.random.randint(0, max(0, len(session.turns) - max_turns))
            segment = session.turns[start : start + max_turns]
            simulations.append(segment)

        return simulations

    def analyze_sessions(self) -> Dict:
        """
        Produce aggregate analytics for reporting + downstream prompts.
        """
        total_sessions = len(self.corpus)
        total_turns = self.corpus.total_turns()
        avg_turns = total_turns / total_sessions if total_sessions else 0
        total_tokens = self.corpus.total_token_estimate()

        keyword_counter: Counter[str] = Counter()
        for session in self.corpus:
            for kw, freq in self._extract_keywords(session):
                keyword_counter[kw] += freq

        top_keywords = keyword_counter.most_common(12)
        category_spread = self._aggregate_categories()

        return {
            "total_sessions": total_sessions,
            "total_turns": total_turns,
            "avg_turns_per_session": round(avg_turns, 2),
            "token_estimate": total_tokens,
            "top_keywords": top_keywords,
            "category_spread": category_spread,
        }

    def generate_methods(self, max_methods: int = 4) -> List[Dict]:
        """
        Convert analytics into high-level "method ideas" the team can use
        while the full LLM-powered generator is still under construction.
        """
        analysis = self.analyze_sessions()
        category_spread = analysis["category_spread"]
        sorted_categories = sorted(
            category_spread.items(), key=lambda kv: kv[1], reverse=True
        )

        methods: List[Dict] = []
        for name, weight in sorted_categories[:max_methods]:
            methods.append(
                {
                    "method": f"{name.title()} Thread",
                    "focus": name,
                    "evidence": f"{weight} mentions across ground-truth sessions",
                    "suggested_moves": self._suggest_moves_for_category(name),
                }
            )

        return methods

    # ------------------------------------------------------------------ #
    # Internal helpers
    # ------------------------------------------------------------------ #
    def _extract_keywords(self, session: Session) -> List[tuple[str, int]]:
        counter: Counter[str] = Counter()
        for turn in session.user_turns():
            for token in self._simple_tokenize(turn.text):
                if len(token) <= 3:
                    continue
                counter[token] += 1
        return counter.most_common()

    def _detect_categories(self, keywords: Sequence[tuple[str, int]]) -> List[str]:
        hits: Dict[str, int] = defaultdict(int)
        for category, vocab in CATEGORY_KEYWORDS.items():
            for kw, freq in keywords:
                if kw in vocab:
                    hits[category] += freq
        if not hits:
            return ["general"]
        sorted_hits = sorted(hits.items(), key=lambda kv: kv[1], reverse=True)
        return [name for name, _ in sorted_hits[:3]]

    def _aggregate_categories(self) -> Dict[str, int]:
        counts: Dict[str, int] = defaultdict(int)
        for profile in self.generate_archetypes(max_archetypes=len(self.corpus)):
            for category in profile.dominant_categories:
                counts[category] += 1
        return counts

    def _representative_user_lines(self, session: Session, limit: int = 3) -> List[str]:
        lines = []
        for turn in session.user_turns():
            cleaned = " ".join(turn.text.strip().split())
            if cleaned:
                lines.append(cleaned)
            if len(lines) >= limit:
                break
        return lines

    def _simple_tokenize(self, text: str) -> Iterable[str]:
        for raw in text.lower().replace("/", " ").replace("\n", " ").split():
            token = "".join(ch for ch in raw if ch.isalnum())
            if token:
                yield token

    def _suggest_moves_for_category(self, category: str) -> List[str]:
        suggestions = {
            "money": [
                "Map income streams mentioned in the chart.",
                "Ask for recent earning experiments before offering ideas.",
            ],
            "career": [
                "Contrast house rulers related to work vs. meaning.",
                "Offer a pacing cue before diving into 10th-house themes.",
            ],
            "location": [
                "Relate planetary dignities to geographies or climates.",
                "Invite the user to sense how place affects their nervous system.",
            ],
            "care": [
                "Notice Moon/6th-house cues about service orientation.",
                "Use guarded questions about emotional capacity.",
            ],
            "creative": [
                "Surface mythic references tied to Venus/Mercury placements.",
                "Balance praise with an observation about creative pacing.",
            ],
            "movement": [
                "Tie Mars/ASC signatures to somatic practices.",
                "Offer a pause for the user to notice bodily cues.",
            ],
            "general": [
                "Stay slow; mirror back phrasing instead of inventing agendas.",
                "Track relationship depth to modulate question frequency.",
            ],
        }
        return suggestions.get(category, suggestions["general"])


def _demo() -> None:
    """
    Simple CLI demo to sanity-check the engine quickly:

        python -m orenda_bridge.synthetic_engine.research_engine
    """

    engine = SyntheticResearchEngine()
    print("=== Archetypes ===")
    for archetype in engine.generate_archetypes():
        print(
            f"- {archetype.session_id}: {archetype.dominant_categories} | "
            f"{', '.join(archetype.top_keywords[:5])}"
        )

    print("\n=== Analytics ===")
    print(engine.analyze_sessions())

    print("\n=== Methods ===")
    for method in engine.generate_methods():
        print(f"- {method['method']}: {method['focus']} ({method['evidence']})")


if __name__ == "__main__":
    _demo()

