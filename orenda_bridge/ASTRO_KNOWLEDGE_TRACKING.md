# Astrological Knowledge Tracking

## Overview

Tracks user's astrological knowledge level (1-10 scale) to adjust language and technical depth.

## How It Works

### Detection

**Automatic detection** from user messages:
- **Beginner terms** (lowers score): "horoscope", "zodiac sign", "star sign", "compatibility"
- **Intermediate terms** (raises score): "house", "rising", "ascendant", "planet", "moon sign", "sun sign"
- **Advanced terms** (raises score more): "aspect", "conjunction", "opposition", "midheaven", "degree", "orb", "transit", "ruler", "dignity"

**Conversation history** is also analyzed (last 10 messages) for cumulative evidence.

### Levels

- **1-3: Beginner**
  - Avoid all technical jargon
  - No degrees, aspects, house cusps
  - Use simple language: "where you work" instead of "10th house"
  - Explain concepts as you go

- **4-6: Intermediate**
  - Can use basic astro terms (houses, planets, signs)
  - Explain complex concepts (aspects, dignities, transits) if used
  - Balance between accessible and precise

- **7-10: Advanced**
  - Can use full technical vocabulary
  - Degrees, aspects, orbs, house cusps, rulerships, dignities
  - Still conversational and mythic, but precision is welcome

### Storage

- Stored in user profile (`data/profiles/{user_id}.json`)
- Persists across sessions
- Only increases (user might be learning)
- Key: `astro_knowledge_level` (integer 1-10)

### Optional Question

If level is unknown and relationship depth is 3-8, the AI can gently ask:
- "do you know what the houses stand for?"
- "how familiar are you with astrology?"

But this is optional and only if it flows naturally.

## Implementation

### Files

- `memory/astro_knowledge_tracker.py` - Detection logic
- `memory/profile_store.py` - Storage (updated to include `astro_knowledge_level`)
- `server.py` - Integration into chat endpoint

### Usage

The system automatically:
1. Detects knowledge level from user messages
2. Loads existing level from profile
3. Updates profile if detected level is higher
4. Injects knowledge context into system prompt
5. Adjusts AI language accordingly

No frontend changes needed - it's all backend detection.

## Example

**User message:** "My Sun is at 15° Leo in the 10th house, and it's exactly opposite my Neptune in the 8th."

**Detection:** Advanced (uses degrees, house numbers, aspect terminology)

**AI response:** Can use technical language like "Sun-Midheaven conjunction" and "Neptune opposition" without explanation.

---

**User message:** "I'm a Leo, what does that mean?"

**Detection:** Beginner (only knows sign)

**AI response:** Uses simple language, explains concepts, avoids jargon.

