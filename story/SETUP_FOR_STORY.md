# Setup for /story Path

## To Access at `/story/` on GitHub Pages

### Step 1: Rename Folder (if needed)

If you want it at `https://yourdomain.github.io/story/`:

```powershell
# From mini_zen directory
Rename-Item -Path "journey" -NewName "story"
```

### Step 2: Verify Files

Make sure you have:
```
story/  (or journey/)
├── index.html
├── style.css
├── script.js
├── data/
│   ├── houses.json
│   └── dialogues.json
└── README.md
```

### Step 3: Push to GitHub

```powershell
cd story  # or journey
git add .
git commit -m "Add Houses Journey web prototype"
git push
```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. **Settings** → **Pages**
3. **Source**: Deploy from a branch
4. **Branch**: `main` (or your default)
5. **Folder**: `/ (root)`
6. Click **Save**

### Step 5: Access Your Site

- If folder is `story`: `https://[username].github.io/[repo]/story/`
- If folder is `journey`: `https://[username].github.io/[repo]/journey/`

## Current Status

✅ All files created and ready
✅ Relative paths configured
✅ No external dependencies
✅ localStorage for reflections
✅ GitHub Pages compatible

## Test Before Pushing

1. Open `index.html` in browser (or use local server)
2. Click "Begin Journey"
3. Verify dialogues play correctly
4. Test reflection saving
5. Check browser console for errors (F12)

## Quick Local Test

```powershell
cd journey  # or story
python -m http.server 8000
# Visit: http://localhost:8000/
```

