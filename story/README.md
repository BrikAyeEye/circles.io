# The Houses Journey

A reflective astrology experience where the "houses" talk to the user through short dialogues.

## Overview

**The Houses Journey** is a calm, meditative web experience that lets users explore their natal chart through conversations between astrological houses. Each house speaks with an archetypal voice, focusing on themes of *work, money, and meaning*.

## Tech Stack

- **HTML + CSS + Vanilla JavaScript** (no frameworks, no backend)
- **GitHub Pages compatible** (static hosting)
- **localStorage** for saving reflections
- **JSON data files** for houses and dialogues

## Structure

```
journey/
├── index.html          # Main HTML structure
├── style.css           # Styling (black bg, white text, serif)
├── script.js           # Core logic (dialogue playback, localStorage)
├── data/
│   ├── houses.json     # House archetypes and voices
│   └── dialogues.json  # Pre-written dialogue scenes
└── README.md
```

## Features

- **Welcome Screen**: "✨ The Houses Journey ✨ — Begin Journey"
- **Dialogue Scenes**: Displays lines from JSON with timed fade transitions (~2s between lines)
- **Reflection Input**: Text area for user responses, saved to localStorage
- **Outro Message**: Gentle closing after all scenes

## Usage

1. Open `index.html` in a web browser
2. Click "Begin Journey"
3. Watch dialogues unfold with timed fades
4. Enter reflections when prompted
5. Reflections are automatically saved to localStorage

## GitHub Pages Setup

To host on GitHub Pages:

1. Push this folder to a GitHub repository
2. Go to repository Settings → Pages
3. Select source branch (usually `main`)
4. Site will be available at `https://[username].github.io/[repo-name]/journey/`

Or if hosting at `/circle.io/story`:
- Configure custom domain or use GitHub Pages with path prefix
- Update any absolute paths if needed

## Customization

- **Pacing**: Adjust `PAUSE_BETWEEN_LINES` in `script.js` (default: 2000ms)
- **Dialogues**: Edit `data/dialogues.json` to add/modify scenes
- **Houses**: Edit `data/houses.json` to modify archetypes
- **Styling**: Modify `style.css` for colors, fonts, spacing

## Data Format

### houses.json
```json
{
  "2nd": {
    "name": "The Steward",
    "themes": ["resources", "worth"],
    "voice": "grounded, practical"
  }
}
```

### dialogues.json
```json
[
  {
    "pair": ["2nd", "6th"],
    "lines": [
      {"speaker": "2nd", "text": "..."},
      {"speaker": "system", "text": "Reflection question?"}
    ]
  }
]
```

## Future Enhancements

- Voice input/output
- LLM integration for dynamic dialogues
- Full natal chart calculation
- Multiple user sessions
- Export reflections as JSON/PDF

