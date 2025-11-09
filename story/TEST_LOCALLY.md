# Test Locally

## Quick Test

I've started a local server for you. Open your browser and visit:

**http://localhost:8000/**

Then click on `index.html` or navigate directly to see the journey.

## Manual Test

If the server isn't running, you can:

1. **Option A: Direct file open**
   - Navigate to `journey/` folder
   - Double-click `index.html`
   - Note: JSON files may not load due to CORS (use Option B instead)

2. **Option B: Local server**
   ```powershell
   cd journey
   python -m http.server 8000
   ```
   Then visit: http://localhost:8000/

## What to Test

1. ✅ Welcome screen appears
2. ✅ "Begin Journey" button works
3. ✅ Intro messages fade in with timing
4. ✅ Dialogue scenes play with pauses
5. ✅ Reflection input appears after each scene
6. ✅ "Save" button saves to localStorage
7. ✅ Outro appears after all scenes

## Check Browser Console

Press F12 → Console tab to see any errors.

## Verify localStorage

Press F12 → Application → Local Storage → Check for `housesJourneyReflections`

