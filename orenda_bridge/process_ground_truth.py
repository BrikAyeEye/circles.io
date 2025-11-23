"""Utility script to convert raw ground-truth transcripts into structured JSON."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence

GROUND_TRUTH_DIR = Path("data/ground_truth")
OUTPUT_PATH = GROUND_TRUTH_DIR / "ground_truth_sessions.json"

SPEAKER_PATTERNS = {
    "user": re.compile(r"^\s*(you said)\s*:\s*$", re.IGNORECASE),
    "assistant": re.compile(r"^\s*(chatgpt said)\s*:\s*$", re.IGNORECASE),
}


@dataclass
class Turn:
    speaker: str
    text: str


@dataclass
class Session:
    session_id: str
    source_file: str
    turns: Sequence[Turn]


def iter_transcript_files(directory: Path) -> Iterable[Path]:
    for path in sorted(directory.glob("*.txt")):
        if path.name.startswith("."):
            continue
        yield path


def parse_transcript(text: str) -> List[Turn]:
    marker_pattern = re.compile(r"(You said|ChatGPT said)\s*:", re.IGNORECASE)
    turns: List[Turn] = []

    matches = list(marker_pattern.finditer(text))
    for idx, match in enumerate(matches):
        label = match.group(1).lower()
        start = match.end()
        end = matches[idx + 1].start() if idx + 1 < len(matches) else len(text)
        chunk = text[start:end].strip()
        if not chunk:
            continue
        speaker = "user" if "you said" in label else "assistant"
        turns.append(Turn(speaker, chunk))

    return turns


def build_sessions() -> List[Session]:
    sessions: List[Session] = []
    for transcript_file in iter_transcript_files(GROUND_TRUTH_DIR):
        text = transcript_file.read_text(encoding="utf-8", errors="ignore")
        turns = parse_transcript(text)
        session_id = transcript_file.stem.replace(" ", "_")
        sessions.append(Session(session_id, transcript_file.name, turns))
    return sessions


def sessions_to_serializable(sessions: Sequence[Session]) -> dict:
    return {
        "sessions": [
            {
                "session_id": session.session_id,
                "source_file": session.source_file,
                "turns": [
                    {"speaker": turn.speaker, "text": turn.text} for turn in session.turns
                ],
            }
            for session in sessions
        ]
    }


def main() -> None:
    if not GROUND_TRUTH_DIR.exists():
        raise SystemExit(f"Directory not found: {GROUND_TRUTH_DIR}")

    sessions = build_sessions()
    payload = sessions_to_serializable(sessions)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Wrote {OUTPUT_PATH} with {len(payload['sessions'])} sessions")


if __name__ == "__main__":
    main()

