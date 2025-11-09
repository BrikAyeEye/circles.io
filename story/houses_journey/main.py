"""
The Houses Journey - Phase 1
A calm, text-based prototype for exploring natal chart themes
through dialogues between astrological houses.
"""

import json
import time
import os
import sys
from datetime import datetime
from pathlib import Path

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        # Python < 3.7 fallback
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')


# Configuration
PAUSE_BETWEEN_LINES = 2.0  # seconds
PAUSE_AFTER_SCENE = 1.5
DATA_DIR = Path(__file__).parent / "data"
REFLECTIONS_FILE = Path(__file__).parent / "reflections.json"


def load_json(filepath):
    """Load JSON data from file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_reflection(scene_pair, question, answer):
    """Append a user reflection to reflections.json."""
    reflection = {
        "scene": f"{scene_pair[0]} <-> {scene_pair[1]}",
        "question": question,
        "answer": answer,
        "time": datetime.now().isoformat()
    }
    
    # Load existing reflections
    if REFLECTIONS_FILE.exists():
        reflections = load_json(REFLECTIONS_FILE)
    else:
        reflections = []
    
    # Append new reflection
    reflections.append(reflection)
    
    # Save back to file
    with open(REFLECTIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(reflections, f, indent=2, ensure_ascii=False)


def print_slowly(text, pause=PAUSE_BETWEEN_LINES):
    """Print text with a pause after."""
    print(text)
    time.sleep(pause)


def intro(houses_data):
    """Welcome message from The Second House."""
    second_house = houses_data["2nd"]
    print("\n" + "="*60)
    print("  THE HOUSES JOURNEY")
    print("="*60 + "\n")
    time.sleep(1.5)
    
    print_slowly(f"{second_house['name']} speaks:")
    print_slowly("Welcome. I am the keeper of resources, of what you value.")
    print_slowly("Today, we will explore together.")
    print_slowly("Listen to the conversations that unfold.")
    print_slowly("There are no right answers—only what feels true.\n")
    time.sleep(PAUSE_AFTER_SCENE)


def play_scene(dialogue, houses_data):
    """Play through a dialogue scene between two houses."""
    pair = dialogue["pair"]
    house_a = houses_data[pair[0]]
    house_b = houses_data[pair[1]]
    
    print("\n" + "-"*60)
    print(f"  {house_a['name']} <-> {house_b['name']}")
    print("-"*60 + "\n")
    time.sleep(1.0)
    
    question = None
    
    # Print each line in the dialogue
    for line in dialogue["lines"]:
        speaker = line["speaker"]
        text = line["text"]
        
        if speaker == "system":
            # System question - save it for later
            question = text
            print_slowly(f"\n  {text}\n", pause=1.0)
        elif speaker == pair[0]:
            # First house speaks
            print_slowly(f"{house_a['name']}: {text}")
        elif speaker == pair[1]:
            # Second house speaks
            print_slowly(f"{house_b['name']}: {text}")
    
    time.sleep(PAUSE_AFTER_SCENE)
    
    # Collect user reflection
    if question:
        print("  [Type your reflection, then press Enter]")
        answer = input("  > ").strip()
        
        if answer:
            save_reflection(pair, question, answer)
            print_slowly("\n  Thank you. Your reflection has been saved.\n", pause=1.0)
        else:
            print_slowly("\n  No reflection recorded.\n", pause=1.0)
    
    time.sleep(PAUSE_AFTER_SCENE)


def outro():
    """Closing message."""
    print("\n" + "="*60)
    print_slowly("The conversation settles.")
    print_slowly("Take what resonates with you.")
    print_slowly("The houses will be here when you return.")
    print("="*60 + "\n")


def main():
    """Main orchestration function."""
    try:
        # Load data
        houses_data = load_json(DATA_DIR / "houses.json")
        dialogues = load_json(DATA_DIR / "dialogues.json")
        
        # Welcome
        intro(houses_data)
        
        # Play through scenes (limit to 2-3 for Phase 1)
        scenes_to_play = dialogues[:3]  # First 3 scenes
        
        for dialogue in scenes_to_play:
            play_scene(dialogue, houses_data)
        
        # Closing
        outro()
        
    except FileNotFoundError as e:
        print(f"Error: Could not find required file: {e}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format: {e}")
    except KeyboardInterrupt:
        print("\n\nJourney interrupted. Your reflections are saved.")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()

