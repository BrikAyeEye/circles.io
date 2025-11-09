# Deploy to GitHub Pages at /story

## Quick Setup

### Option 1: Rename folder to `story` (Recommended)

If you want it accessible at `https://yourdomain.github.io/story/`:

1. Rename the `journey` folder to `story`
2. Push to GitHub
3. Access at: `https://[username].github.io/[repo]/story/`

### Option 2: Keep as `journey` folder

If you want it accessible at `https://yourdomain.github.io/journey/`:

1. Keep folder name as `journey`
2. Push to GitHub
3. Access at: `https://[username].github.io/[repo]/journey/`

## GitHub Pages Configuration

1. Go to your repository on GitHub
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `main` (or your default branch)
5. Folder: `/ (root)`
6. Save

## Testing Locally

Before pushing, test locally:

1. Open `index.html` in a browser
2. Or use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Then visit: http://localhost:8000/journey/
   ```

## File Structure

```
journey/  (or story/)
├── index.html
├── style.css
├── script.js
├── data/
│   ├── houses.json
│   └── dialogues.json
├── .gitignore
└── README.md
```

## Verification Checklist

- [x] All files use relative paths (no absolute URLs)
- [x] JSON files are in `data/` folder
- [x] CSS and JS files are in root
- [x] No external dependencies
- [x] Works when opening `index.html` directly

## Troubleshooting

**If JSON files don't load:**
- Check browser console for CORS errors
- Make sure you're using a local server or GitHub Pages (not `file://` protocol)

**If styles don't load:**
- Verify `style.css` is in the same folder as `index.html`
- Check browser console for 404 errors

**If reflections don't save:**
- Check browser localStorage (DevTools → Application → Local Storage)
- Verify JavaScript console for errors

