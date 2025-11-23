# Seed Stories for Hermeneutic Prompts

This directory contains few-shot example dialogues that teach the AI the desired style:
- Mythic, archetypal interpretations
- Personal observations ("Personally, I feel...")
- Guarded questions ("Or is this just me?")
- Natural, conversational tone
- Inviting critical engagement

## Format

Each JSON file should be an array of message objects:

```json
[
  {
    "role": "user",
    "content": "Neptune in my 8th house."
  },
  {
    "role": "assistant",
    "content": "Neptune stirs the hidden waters..."
  },
  ...
]
```

## Adding New Stories

1. Create a new JSON file in this directory
2. Follow the format above
3. The system will automatically load and use them
4. Restart the server or call `/reload-seeds` to reload

## Guidelines

- Show mythic/archetypal language (not textbook lists)
- Include personal observations naturally
- Use guarded questions sparingly
- Show natural conversation flow
- Include examples of user pushback/critical engagement
- Cover different planets, houses, aspects

