from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence

GROUND_TRUTH_PATH = Path("data/ground_truth/ground_truth_sessions.json")


@dataclass(frozen=True)
class Turn:
    speaker: str
    text: str

    @property
    def is_user(self) -> bool:
        return self.speaker.lower().startswith("user")

    @property
    def is_assistant(self) -> bool:
        return self.speaker.lower().startswith("assistant")


@dataclass(frozen=True)
class Session:
    session_id: str
    source_file: str
    turns: Sequence[Turn]

    def user_turns(self) -> Iterable[Turn]:
        return (turn for turn in self.turns if turn.is_user)

    def assistant_turns(self) -> Iterable[Turn]:
        return (turn for turn in self.turns if turn.is_assistant)

    def total_tokens_estimate(self) -> int:
        """
        Quick-and-dirty token estimate (4 chars ≈ 1 token) so we can reason
        about future LLM cost without running a tokenizer.
        """
        return sum(len(turn.text) for turn in self.turns) // 4


class GroundTruthCorpus:
    """
    Lightweight loader around the ground-truth session JSON file. Keeps the
    representation extremely simple so it is easy to mock in tests.
    """

    def __init__(self, path: Path | str = GROUND_TRUTH_PATH):
        self.path = Path(path)
        self.sessions: List[Session] = []
        self._load()

    # --------------------------------------------------------------------- #
    # Internal helpers
    # --------------------------------------------------------------------- #
    def _load(self) -> None:
        if not self.path.exists():
            raise FileNotFoundError(
                f"Ground truth file not found: {self.path}. Run "
                "`python process_ground_truth.py` first."
            )

        raw = json.loads(self.path.read_text(encoding="utf-8"))
        if "sessions" not in raw or not isinstance(raw["sessions"], list):
            raise ValueError("ground_truth_sessions.json must contain a 'sessions' list")

        sessions: List[Session] = []
        for item in raw["sessions"]:
            turns = [
                Turn(speaker=turn["speaker"], text=turn["text"])
                for turn in item.get("turns", [])
                if isinstance(turn, dict) and turn.get("text")
            ]
            sessions.append(
                Session(
                    session_id=item.get("session_id", "unknown"),
                    source_file=item.get("source_file", "unknown"),
                    turns=turns,
                )
            )

        self.sessions = sessions

    # --------------------------------------------------------------------- #
    # Public API
    # --------------------------------------------------------------------- #
    def __len__(self) -> int:
        return len(self.sessions)

    def __iter__(self):
        return iter(self.sessions)

    def total_turns(self) -> int:
        return sum(len(session.turns) for session in self.sessions)

    def total_token_estimate(self) -> int:
        return sum(session.total_tokens_estimate() for session in self.sessions)

    def head(self, n: int = 1) -> Sequence[Session]:
        return self.sessions[:n]

