# 🚀 Quick Start - Test on /story

## ✅ Everything is Ready!

All files are created and configured for GitHub Pages.

## 📁 Current Structure

```
journey/
├── index.html          ✅ Main page
├── style.css           ✅ Styling (black bg, white serif)
├── script.js            ✅ Logic with localStorage
├── data/
│   ├── houses.json     ✅ House archetypes
│   └── dialogues.json  ✅ 3 dialogue scenes
└── Documentation files
```

## 🧪 Test Locally Right Now

**Option 1: Direct file**
- Navigate to `journey/` folder
- Double-click `index.html`
- ⚠️ Note: JSON may not load due to CORS (use Option 2)

**Option 2: Local server (Recommended)**
```powershell
cd journey
python -m http.server 8000
```
Then open: **http://localhost:8000/**

## 📤 Deploy to GitHub Pages

### If you want it at `/story/`:

1. **Rename folder** (optional):
   ```powershell
   Rename-Item -Path "journey" -NewName "story"
   ```

2. **Push to GitHub**:
   ```powershell
   git add journey/  # or story/
   git commit -m "Add Houses Journey web prototype"
   git push
   ```

3. **Enable GitHub Pages**:
   - Go to repo → Settings → Pages
   - Source: Deploy from branch `main`
   - Folder: `/ (root)`
   - Save

4. **Access at**:
   - `https://[username].github.io/[repo]/journey/` (if kept as journey)
   - `https://[username].github.io/[repo]/story/` (if renamed to story)

## ✨ What to Expect

1. Welcome screen: "✨ The Houses Journey ✨"
2. Click "Begin Journey"
3. Intro from The Steward (2nd House)
4. 3 dialogue scenes with timed fades
5. Reflection prompts after each scene
6. Outro message
7. Reflections saved to browser localStorage

## 🔍 Verify It Works

- Open browser console (F12)
- Check for any errors
- Test reflection saving
- Check localStorage: DevTools → Application → Local Storage

## 📝 Customization

- **Pacing**: Edit `PAUSE_BETWEEN_LINES` in `script.js` (default: 2000ms)
- **Dialogues**: Edit `data/dialogues.json`
- **Houses**: Edit `data/houses.json`
- **Styling**: Edit `style.css`

---

**Ready to test!** 🎉

