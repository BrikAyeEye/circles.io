# Compost Archive — Closures

A minimal, static page that displays **closure tiles** as a diagonal "Scottish" cross (white on muted black) with a center circle (closed eye: horizontal line). Each tile accepts an image or short video. Hover enlarges/reveals the media; click opens a lightbox.

## What This Is

A ritual archive for closures ("compost")—a quiet space to mark what has ended, what stayed alive, and what is being returned to the earth.

## How to Add an Entry

1. Click **+ New Closure** on the page
2. Fill in the form:
   - **Title**: Name of the closure
   - **Date**: When it happened
   - **Reflection**: One line about what stayed alive (max 200 chars)
   - **Upload**: Image (.jpg, .png, .webp) or video (.mp4)
   - **Optional link**: URL to a longer note
3. Click **Export JSON** to download the entry JSON file
4. Save your media file to `/assets/media/` with the filename referenced in the JSON
5. Add the entry JSON to `data.json` (merge it into the array)
6. Commit both the JSON and media files to the repository

## How to Deploy

1. Enable GitHub Pages for this repository (Settings → Pages → Source: main branch, / (root))
2. The site will be available at `https://[username].github.io/[repo-name]/`

## Technical Details

- **Static only**: No build step, no frameworks
- **Persistence**: Uses localStorage for drafts during a session
- **Media**: Supports `.jpg`, `.png`, `.webp`, `.mp4`
- **Accessibility**: Keyboard navigation, focus management, ARIA labels
- **Mobile-friendly**: Responsive grid, touch-friendly interactions

## File Structure

```
/
  index.html          # Main page
  styles.css          # All styles
  script.js           # All functionality
  data.json           # Committed entries (read-only gallery)
  /assets/
    /media/           # Media files (images/videos)
  LICENSE
  README.md
```

## License

See LICENSE file for details.

