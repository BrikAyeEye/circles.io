# The Houses Journey - Phase 1

A calm, text-based prototype for exploring natal chart themes through dialogues between astrological houses.

## Overview

**The Houses Journey** is a reflective experience where users explore their natal chart through conversations between astrological houses. Each house speaks with an archetypal voice, focusing on themes of *work, money, and meaning*.

## Phase 1 Scope

This is a minimal console-based prototype that:
- Plays pre-written dialogues between house pairs (2nd↔6th, 2nd↔10th, 2nd↔8th)
- Uses timed pauses to create a meditative rhythm
- Collects user reflections after each scene
- Saves reflections to JSON with timestamps

## Requirements

- Python 3.10+
- Standard library only (no external dependencies)

## Structure

```
houses_journey/
├── main.py              # Main orchestration script
├── data/
│   ├── houses.json      # House archetypes and voices
│   └── dialogues.json   # Pre-written dialogue scenes
├── reflections.json     # Saved user reflections (generated)
└── README.md
```

## Usage

Run from the `houses_journey` directory:

```bash
python main.py
```

The experience will:
1. Welcome you with a message from The Second House (The Steward)
2. Play through 2-3 dialogue scenes
3. Prompt you for reflections after each scene
4. Save your reflections to `reflections.json`
5. Close with a gentle outro

## Customization

- Adjust pause timing in `main.py`: `PAUSE_BETWEEN_LINES` and `PAUSE_AFTER_SCENE`
- Add more dialogues in `data/dialogues.json`
- Modify house archetypes in `data/houses.json`

## What's Next (Future Phases)

- Visual UI (Streamlit, web interface)
- Voice input/output
- LLM integration for dynamic dialogues
- Full natal chart calculation
- Multiple user sessions/profiles

