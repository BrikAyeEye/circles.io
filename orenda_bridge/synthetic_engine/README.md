## Synthetic Research Engine (basic version)

This folder hosts the zero-token-cost scaffolding for the four-part research engine:

1. **Archetype generator** – derives tonal/archetypal profiles from real sessions.
2. **Session simulator** – samples deterministic snippets so we can test UI flows.
3. **Session analyzer** – surfaces aggregate stats + keyword spreads.
4. **Method generator** – turns those stats into lightweight “move libraries”.

### How it works today

- `process_ground_truth.py` converts the raw PDFs → `data/ground_truth/ground_truth_sessions.json`.
- `synthetic_engine/ground_truth.py` loads the JSON into simple dataclasses.
- `synthetic_engine/research_engine.py` provides the heuristics described above.
- Everything is deterministic and LLM-free, so we can iterate without burning tokens.

Run a quick demo:

```bash
cd orenda_bridge
python -m synthetic_engine.research_engine
```

You’ll see archetype summaries, analytics, and suggested “methods” printed to stdout.

### Next steps

- Swap the heuristic keyword analyzer for embedding-based clustering.
- Feed the archetype/method outputs into real prompt templates.
- Schedule batch jobs (or CLI commands) for regenerating synthetic research packets.

Because everything already pulls from `ground_truth_sessions.json`, plugging in an
LLM later is just a matter of replacing the helper functions inside
`research_engine.py`.

