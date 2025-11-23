"""Simple profile storage using JSON files (one per user)."""

import json
import os
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime


PROFILES_DIR = Path("data/profiles")


class ProfileStore:
    """Lightweight profile storage using JSON files."""
    
    def __init__(self, profiles_dir: Path = None):
        self.profiles_dir = profiles_dir or PROFILES_DIR
        self.profiles_dir.mkdir(parents=True, exist_ok=True)
    
    def _get_profile_path(self, user_id: str) -> Path:
        """Get file path for a user profile."""
        # Sanitize user_id for filename
        safe_id = user_id.replace("/", "_").replace("\\", "_")
        return self.profiles_dir / f"{safe_id}.json"
    
    def save_profile(self, user_id: str, chart: Optional[Dict] = None, 
                     themes: Optional[list] = None, tone_preference: Optional[str] = None,
                     session_summary: Optional[str] = None, astro_knowledge_level: Optional[int] = None) -> bool:
        """
        Save or update a user profile.
        
        Args:
            user_id: Unique identifier for the user
            chart: Birth chart data (dict)
            themes: List of top themes/interests (e.g., ["career", "money", "location"])
            tone_preference: Preferred communication style (e.g., "soft", "direct", "playful")
            session_summary: Compact summary of recent session insights
            astro_knowledge_level: Astrological knowledge level (1-10 scale)
        
        Returns:
            True if saved successfully
        """
        profile_path = self._get_profile_path(user_id)
        
        # Load existing profile if it exists
        existing = {}
        if profile_path.exists():
            try:
                with open(profile_path, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
            except (json.JSONDecodeError, IOError):
                existing = {}
        
        # Merge new data (only update astro_knowledge_level if provided and higher than existing)
        existing_level = existing.get("astro_knowledge_level")
        if astro_knowledge_level is not None:
            # Use the higher level (user might be learning)
            if existing_level is None or astro_knowledge_level > existing_level:
                final_level = astro_knowledge_level
            else:
                final_level = existing_level
        else:
            final_level = existing_level
        
        profile = {
            "user_id": user_id,
            "chart": chart or existing.get("chart"),
            "themes": themes or existing.get("themes", []),
            "tone_preference": tone_preference or existing.get("tone_preference"),
            "session_summary": session_summary or existing.get("session_summary"),
            "astro_knowledge_level": final_level,
            "last_updated": datetime.now().isoformat(),
            "created_at": existing.get("created_at", datetime.now().isoformat())
        }
        
        # Write to file
        try:
            with open(profile_path, 'w', encoding='utf-8') as f:
                json.dump(profile, f, indent=2, ensure_ascii=False)
            return True
        except IOError:
            return False
    
    def get_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Load a user profile."""
        profile_path = self._get_profile_path(user_id)
        if not profile_path.exists():
            return None
        
        try:
            with open(profile_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return None
    
    def update_session_summary(self, user_id: str, summary: str) -> bool:
        """Update just the session summary (lightweight update)."""
        profile = self.get_profile(user_id) or {}
        profile["session_summary"] = summary
        profile["last_updated"] = datetime.now().isoformat()
        if "user_id" not in profile:
            profile["user_id"] = user_id
        
        profile_path = self._get_profile_path(user_id)
        try:
            with open(profile_path, 'w', encoding='utf-8') as f:
                json.dump(profile, f, indent=2, ensure_ascii=False)
            return True
        except IOError:
            return False

