"""
Tracks user's astrological knowledge level (1-10 scale).
Detects from user messages and stores in profile.
"""

import re
from typing import Optional, Dict, List

# Astro knowledge indicators (weighted)
BEGINNER_TERMS = {
    "horoscope": 1,
    "zodiac sign": 1,
    "star sign": 1,
    "what does my sign mean": 1,
    "compatibility": 1,
}

INTERMEDIATE_TERMS = {
    "house": 2,
    "rising": 2,
    "ascendant": 2,
    "planet": 2,
    "mercury": 2,
    "venus": 2,
    "mars": 2,
    "jupiter": 2,
    "saturn": 2,
    "moon sign": 2,
    "sun sign": 2,
}

ADVANCED_TERMS = {
    "aspect": 3,
    "conjunction": 3,
    "opposition": 3,
    "trine": 3,
    "square": 3,
    "sextile": 3,
    "midheaven": 3,
    "mc": 3,
    "ic": 3,
    "asc": 3,
    "descendant": 3,
    "degree": 3,
    "orb": 3,
    "transit": 3,
    "progressed": 3,
    "synastry": 3,
    "composite": 3,
    "house cusp": 3,
    "ruler": 3,
    "rulership": 3,
    "dignity": 3,
    "detriment": 3,
    "fall": 3,
    "exaltation": 3,
}

# Questions that indicate knowledge level
KNOWLEDGE_QUESTIONS = {
    "what are the houses": "beginner",
    "what do the houses mean": "beginner",
    "what is the 10th house": "beginner",
    "what does my chart mean": "beginner",
    "explain my chart": "beginner",
    "what is an aspect": "intermediate",
    "what does this aspect mean": "intermediate",
    "explain this transit": "advanced",
    "what is the orb": "advanced",
}


def detect_astro_knowledge(user_message: str, conversation_history: List[Dict] = None) -> Optional[int]:
    """
    Detect astro knowledge level (1-10) from user message and history.
    
    Returns:
        int: 1-10 scale (1=beginner, 5=intermediate, 10=advanced)
        None: if not enough data to determine
    """
    if not user_message:
        return None
    
    text = user_message.lower()
    score = 0
    evidence_count = 0
    
    # Check for beginner terms (lowers score)
    for term, weight in BEGINNER_TERMS.items():
        if term in text:
            score -= weight
            evidence_count += 1
    
    # Check for intermediate terms (raises score)
    for term, weight in INTERMEDIATE_TERMS.items():
        if term in text:
            score += weight
            evidence_count += 1
    
    # Check for advanced terms (raises score more)
    for term, weight in ADVANCED_TERMS.items():
        if term in text:
            score += weight
            evidence_count += 1
    
    # Check conversation history for cumulative evidence
    if conversation_history:
        for msg in conversation_history[-10:]:  # Last 10 messages
            if msg.get('role') == 'user':
                msg_text = msg.get('content', '').lower()
                for term, weight in BEGINNER_TERMS.items():
                    if term in msg_text:
                        score -= weight * 0.5  # Less weight for older messages
                for term, weight in INTERMEDIATE_TERMS.items():
                    if term in msg_text:
                        score += weight * 0.5
                for term, weight in ADVANCED_TERMS.items():
                    if term in msg_text:
                        score += weight * 0.5
    
    # Not enough evidence
    if evidence_count == 0:
        return None
    
    # Convert score to 1-10 scale
    # Default assumption: if no clear evidence, assume beginner (3)
    if score < 0:
        level = max(1, min(4, 3 + score // 2))  # 1-4 range
    elif score == 0:
        level = 3  # Neutral/beginner
    elif score < 5:
        level = 4 + score // 2  # 4-6 range (intermediate)
    else:
        level = min(10, 7 + score // 3)  # 7-10 range (advanced)
    
    return level


def get_knowledge_level_label(level: int) -> str:
    """Convert numeric level to label."""
    if level <= 3:
        return "beginner"
    elif level <= 6:
        return "intermediate"
    else:
        return "advanced"


def should_ask_knowledge_question(level: Optional[int], relationship_depth: int) -> bool:
    """
    Decide if we should explicitly ask about astro knowledge.
    
    Returns True if:
    - We don't know their level yet
    - Relationship depth is 3-8 (good time to ask)
    - They haven't shown clear evidence
    """
    if level is not None:
        return False  # We already know
    
    if relationship_depth < 3:
        return False  # Too early
    
    if relationship_depth > 8:
        return False  # Too late, should have detected by now
    
    return True


def build_knowledge_context(level: Optional[int]) -> str:
    """
    Build context string for system prompt based on knowledge level.
    """
    if level is None:
        return ""  # No context yet
    
    label = get_knowledge_level_label(level)
    
    if label == "beginner":
        return "\n\nUser astro knowledge: BEGINNER (1-3). Avoid all technical jargon. No degrees, aspects, house cusps, or astro terminology unless you explain it first. Use simple language: 'where you work' instead of '10th house', 'how you feel' instead of 'Moon placement'. Explain concepts as you go."
    elif label == "intermediate":
        return "\n\nUser astro knowledge: INTERMEDIATE (4-6). Can use basic astro terms (houses, planets, signs) but explain complex concepts (aspects, dignities, transits) if you use them. Balance between accessible and precise."
    else:  # advanced
        return "\n\nUser astro knowledge: ADVANCED (7-10). Can use full technical vocabulary (degrees, aspects, orbs, house cusps, rulerships, dignities). Still keep it conversational and mythic, but precision is welcome."

