# orenda_bridge/hermeneutic_bridge.py

"""
Hermeneutic Bridge

The Hermeneutic Bridge initializes an LLM warm-up phase that is interpretive-first
rather than purely instructive. It runs a reflective conversation between the LLM
and itself, exploring meanings, tones, and emotional cues before any user input.

Purpose:
- Load a seed (mood/tone fragment)
- Run internal interpretive loop (LLM reflects on the seed 5-10 times)
- Develop coherent interpretive stance
- Export stance summary for use in first user exchange
"""

import random
import json
import os
from pathlib import Path
from typing import List, Dict, Optional


class HermeneuticBridge:
    """
    The Hermeneutic Bridge initializes an LLM warm-up phase that is interpretive-first
    rather than purely instructive. It runs a reflective conversation between two
    internal agents:
      - 'Interpreter': explores meanings, tones, emotional cues.
      - 'Responder': tests interpretations against contextual fragments.
    """

    def __init__(self, seeds_dir: str = "./orenda_bridge/seeds", model: str = "gpt-4o", temperature: float = 0.8):
        """
        Initialize the bridge.
        
        Args:
            seeds_dir: Path to directory containing seed JSON files
            model: LLM model to use
            temperature: Temperature for LLM responses
        """
        self.seeds_dir = Path(seeds_dir)
        self.seed_data = None
        self.seed_filename = None  # Track which seed file was loaded
        self.model = model
        self.temperature = temperature
        self.llm_client = None  # Will be set via set_client()

    def set_client(self, client):
        """
        Set the LLM client (e.g., OpenAI client).
        
        Args:
            client: LLM client object with chat.completions.create() method
        """
        self.llm_client = client

    def _call_llm(self, messages: List[Dict]) -> str:
        """
        Internal method to call LLM. Supports both OpenAI and Mistral clients.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            
        Returns:
            str: LLM response content
        """
        if not self.llm_client:
            raise ValueError("LLM client not set. Call set_client() first.")
        
        # Detect client type by checking for Mistral-specific attributes
        # Mistral has chat.complete, OpenAI has chat.completions
        is_mistral = (
            hasattr(self.llm_client, 'chat') and 
            hasattr(self.llm_client.chat, 'complete') and
            not hasattr(self.llm_client.chat, 'completions')
        )
        
        if is_mistral:
            # Mistral API
            response = self.llm_client.chat.complete(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
            )
            return response.choices[0].message.content
        else:
            # OpenAI API (default)
            response = self.llm_client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
            )
            return response.choices[0].message.content

    def load_random_seed(self) -> List[Dict]:
        """
        Load a random seed file from the seeds directory.
        
        Returns:
            List of message dicts from the seed file
            
        Raises:
            FileNotFoundError: If no seed files found
        """
        if not self.seeds_dir.exists():
            raise FileNotFoundError(f"Seeds directory not found: {self.seeds_dir}")
        
        seed_files = list(self.seeds_dir.glob("*.json"))
        
        if not seed_files:
            raise FileNotFoundError(f"No seed files found in {self.seeds_dir}")
        
        seed_file = random.choice(seed_files)
        self.seed_filename = seed_file.name
        print(f"[hermeneutic bridge] Loading seed: {self.seed_filename}\n")
        
        with open(seed_file, "r", encoding="utf-8") as f:
            self.seed_data = json.load(f)
        
        # Validate format
        if not isinstance(self.seed_data, list):
            raise ValueError(f"Seed file {self.seed_filename} must be a JSON array")
        
        for msg in self.seed_data:
            if not isinstance(msg, dict) or "role" not in msg or "content" not in msg:
                raise ValueError(f"Each message in seed must have 'role' and 'content' keys")
        
        return self.seed_data

    def run_interpretive_loop(self, max_turns: int = 10) -> List[Dict]:
        """
        The interpretive loop lets the LLM analyze the seed and 'self-interpret'
        before real user input. The LLM is given freedom to explore metaphors,
        voice tone, and emotional anchors.
        
        Args:
            max_turns: Number of interpretive iterations (default: 10)
            
        Returns:
            List of all messages from the interpretive loop
        """
        if not self.llm_client:
            raise ValueError("LLM client not set. Call set_client() first.")
        
        seed = self.seed_data or self.load_random_seed()
        
        # Start with system prompt for interpretive mode
        # Note: LLM already has astrological knowledge from training
        messages = [
            {
                "role": "system",
                "content": "You are Astra, an astrological guide exploring tone and meaning. "
                          "Explore the subtle textures and interpretive possibilities within the seed dialogue, "
                          "focusing on how astrological themes emerge in conversation."
            }
        ]
        messages += seed.copy()  # Copy to avoid mutating original
        
        print("[hermeneutic bridge] Starting interpretive loop...\n")
        
        for i in range(max_turns):
            # Prompt for deeper reflection
            reflection_prompt = (
                f"Reflect again, iteration {i+1}. "
                "What subtle tensions or ambiguities appear? "
                "What emotional undertones? What interpretive layers?"
            )
            
            messages.append({"role": "user", "content": reflection_prompt})
            
            reply = self._call_llm(messages)
            print(f"[iteration {i+1}] {reply[:100]}...\n")
            
            messages.append({"role": "assistant", "content": reply})
        
        print("[hermeneutic bridge] Interpretive loop complete\n")
        return messages

    def summarize_bridge_state(self) -> str:
        """
        After the loop, ask the LLM to summarize what tone and interpretive style it now holds.
        
        Returns:
            str: Summary of the interpretive stance
        """
        if not self.llm_client:
            raise ValueError("LLM client not set. Call set_client() first.")
        
        summary_prompt = [
            {
                "role": "system",
                "content": "You are Astra, an astrological guide. Summarize your interpretive stance."
            },
            {
                "role": "user",
                "content": "What tone, pace, and astrological approach do you now embody? "
                          "How do you interpret charts and planetary patterns?"
            },
        ]
        
        summary = self._call_llm(summary_prompt)
        print(f"[hermeneutic bridge] Stance summary:\n{summary}\n")
        
        return summary

    def warm_up(self, max_turns: int = 10) -> Dict:
        """
        Complete warm-up process: load seed, run interpretive loop, summarize stance.
        
        Args:
            max_turns: Number of interpretive iterations
            
        Returns:
            Dict with:
                - 'messages': All messages from warm-up
                - 'summary': Stance summary
                - 'seed_used': Name of seed file used
        """
        self.load_random_seed()  # This sets self.seed_filename
        
        messages = self.run_interpretive_loop(max_turns=max_turns)
        summary = self.summarize_bridge_state()
        
        return {
            'messages': messages,
            'summary': summary,
            'seed_used': self.seed_filename or "unknown"
        }

