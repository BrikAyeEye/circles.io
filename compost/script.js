// Data Management
let closures = [];
let currentEntry = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    renderTiles();
});

// Load data from data.json and localStorage
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (response.ok) {
            const data = await response.json();
            closures = Array.isArray(data) ? data : [];
        }
    } catch (error) {
        console.log('No data.json found or error loading it');
        closures = [];
    }

    // Load drafts from localStorage
    const drafts = localStorage.getItem('closures_drafts');
    if (drafts) {
        try {
            const parsedDrafts = JSON.parse(drafts);
            closures = [...closures, ...parsedDrafts];
        } catch (error) {
            console.error('Error parsing localStorage drafts:', error);
        }
    }
}

// Save drafts to localStorage
function saveDrafts() {
    const drafts = closures.filter(c => c.isDraft);
    localStorage.setItem('closures_drafts', JSON.stringify(drafts));
}

// Setup event listeners
function setupEventListeners() {
    // New Closure button
    document.getElementById('btnNew').addEventListener('click', openModal);

    // Modal controls
    document.getElementById('btnCloseModal').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') closeModal();
    });

    // Form inputs
    document.getElementById('inputReflection').addEventListener('input', (e) => {
        document.getElementById('charCount').textContent = e.target.value.length;
    });

    // File upload
    const fileInput = document.getElementById('inputMedia');
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    fileInput.addEventListener('change', handleFileSelect);
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'var(--accent-gold)';
    });
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.style.borderColor = 'rgba(242, 242, 242, 0.3)';
    });
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.style.borderColor = 'rgba(242, 242, 242, 0.3)';
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect({ target: fileInput });
        }
    });

    // Form actions
    document.getElementById('btnSaveDraft').addEventListener('click', saveDraft);
    document.getElementById('btnExportJSON').addEventListener('click', exportJSON);
    document.getElementById('btnAddTemp').addEventListener('click', addTempEntry);

    // Lightbox controls
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'lightboxOverlay') closeLightbox();
    });
    document.getElementById('btnDownloadJSON').addEventListener('click', downloadCurrentEntryJSON);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!document.getElementById('lightboxOverlay').hasAttribute('hidden')) {
                closeLightbox();
            } else if (!document.getElementById('modalOverlay').hasAttribute('hidden')) {
                closeModal();
            }
        }
    });

    // Pre-fill date
    document.getElementById('inputDate').valueAsDate = new Date();
}

// Handle file selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    const preview = document.getElementById('mediaPreview');
    preview.hidden = false;
    preview.innerHTML = '';

    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = 'Preview';
        preview.appendChild(img);
    } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.controls = false;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        preview.appendChild(video);
    }
}

// Open modal
function openModal() {
    const modal = document.getElementById('modalOverlay');
    modal.hidden = false;
    document.body.classList.add('modal-open');
    document.getElementById('inputTitle').focus();
    currentEntry = null;
    document.getElementById('closureForm').reset();
    document.getElementById('inputDate').valueAsDate = new Date();
    document.getElementById('charCount').textContent = '0';
    document.getElementById('mediaPreview').hidden = true;
    document.getElementById('mediaPreview').innerHTML = '';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('modalOverlay');
    modal.hidden = true;
    document.body.classList.remove('modal-open');
}

// Get form data
function getFormData() {
    const form = document.getElementById('closureForm');
    const formData = new FormData(form);
    const fileInput = document.getElementById('inputMedia');
    const file = fileInput.files[0];

    if (!file) {
        alert('Please upload an image or video');
        return null;
    }

    const title = formData.get('title').trim();
    const date = formData.get('date');
    const reflection = formData.get('reflection').trim();
    const link = formData.get('link').trim();

    if (!title || !date || !reflection) {
        alert('Please fill in all required fields');
        return null;
    }

    const id = generateId(title);
    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
    const mediaUrl = URL.createObjectURL(file);

    return {
        id,
        title,
        date,
        reflection,
        media: {
            type: mediaType,
            src: mediaUrl,
            file: file,
            fileName: file.name
        },
        link: link || undefined,
        tags: ['closure']
    };
}

// Generate ID from title
function generateId(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
}

// Save draft
function saveDraft() {
    const entry = getFormData();
    if (!entry) return;

    entry.isDraft = true;
    closures.push(entry);
    saveDrafts();
    alert('Draft saved to localStorage');
}

// Export JSON
function exportJSON() {
    const entry = getFormData();
    if (!entry) return;

    // Prepare entry for export (remove file object, use filename)
    const exportEntry = {
        ...entry,
        media: {
            type: entry.media.type,
            src: `assets/media/${entry.media.fileName}`,
            poster: entry.media.type === 'video' ? `assets/media/${entry.media.fileName.replace(/\.mp4$/, '.jpg')}` : undefined
        }
    };
    delete exportEntry.media.file;
    delete exportEntry.isDraft;

    const json = JSON.stringify(exportEntry, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entry-${entry.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Add temporary entry
function addTempEntry() {
    const entry = getFormData();
    if (!entry) return;

    entry.isDraft = true;
    closures.push(entry);
    saveDrafts();
    renderTiles();
    closeModal();
}

// Render tiles
function renderTiles() {
    const grid = document.getElementById('tilesGrid');
    const emptyState = document.getElementById('emptyState');

    if (closures.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = '';

    closures.forEach((closure, index) => {
        const tile = createTile(closure, index);
        grid.appendChild(tile);
    });
}

// Create tile element
function createTile(closure, index) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.setAttribute('role', 'gridcell');
    tile.setAttribute('tabindex', '0');
    tile.setAttribute('aria-label', `${closure.title}, ${closure.date}`);

    // Media
    const media = document.createElement(closure.media.type === 'image' ? 'img' : 'video');
    media.className = 'tile-media';
    media.src = closure.media.src;
    if (closure.media.type === 'image') {
        media.alt = `${closure.title}. ${closure.reflection}`;
    } else {
        media.muted = true;
        media.loop = true;
        media.setAttribute('aria-label', `${closure.title}. ${closure.reflection}`);
    }
    media.addEventListener('error', () => {
        const error = document.createElement('div');
        error.className = 'tile-media-error';
        error.textContent = '⚠ media missing';
        tile.appendChild(error);
    });

    // Glyph
    const glyph = document.createElement('div');
    glyph.className = 'tile-glyph';
    
    const cross = document.createElement('div');
    cross.className = 'tile-cross';
    
    const circle = document.createElement('div');
    circle.className = 'tile-circle';
    
    const eye = document.createElement('div');
    eye.className = 'tile-eye';
    
    glyph.appendChild(cross);
    glyph.appendChild(circle);
    glyph.appendChild(eye);

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'tile-overlay';
    
    const title = document.createElement('div');
    title.className = 'tile-overlay-title';
    title.textContent = closure.title;
    
    const reflection = document.createElement('div');
    reflection.className = 'tile-overlay-reflection';
    reflection.textContent = `Stayed alive: ${closure.reflection}`;
    
    const date = document.createElement('div');
    date.className = 'tile-overlay-date';
    date.textContent = closure.date;
    
    overlay.appendChild(title);
    overlay.appendChild(reflection);
    overlay.appendChild(date);

    tile.appendChild(media);
    tile.appendChild(glyph);
    tile.appendChild(overlay);

    // Click handler
    tile.addEventListener('click', () => openLightbox(closure, index));
    tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(closure, index);
        }
    });

    // Mobile tap handling
    let tapCount = 0;
    tile.addEventListener('touchstart', (e) => {
        tapCount++;
        setTimeout(() => {
            if (tapCount === 1) {
                // First tap: reveal overlay
                overlay.style.opacity = '1';
                media.style.opacity = '1';
                media.style.transform = 'scale(1.06)';
                setTimeout(() => {
                    overlay.style.opacity = '';
                    media.style.opacity = '';
                    media.style.transform = '';
                }, 2000);
            } else if (tapCount === 2) {
                // Second tap: open lightbox
                openLightbox(closure, index);
            }
            tapCount = 0;
        }, 300);
    });

    return tile;
}

// Open lightbox
function openLightbox(closure, index) {
    const lightbox = document.getElementById('lightboxOverlay');
    lightbox.hidden = false;
    document.body.classList.add('modal-open');
    currentEntry = closure;

    const mediaContainer = document.getElementById('lightboxMedia');
    mediaContainer.innerHTML = '';

    const media = document.createElement(closure.media.type === 'image' ? 'img' : 'video');
    media.src = closure.media.src;
    if (closure.media.type === 'image') {
        media.alt = `${closure.title}. ${closure.reflection}`;
    } else {
        media.muted = true;
        media.loop = true;
        media.controls = false;
        media.autoplay = true;
        media.setAttribute('aria-label', `${closure.title}. ${closure.reflection}`);
    }

    mediaContainer.appendChild(media);

    document.getElementById('lightboxTitle').textContent = closure.title;
    document.getElementById('lightboxDate').textContent = closure.date;
    document.getElementById('lightboxReflection').textContent = closure.reflection;

    const linkEl = document.getElementById('lightboxLink');
    if (closure.link) {
        linkEl.href = closure.link;
        linkEl.hidden = false;
    } else {
        linkEl.hidden = true;
    }

    // Focus trap
    const focusableElements = lightbox.querySelectorAll('button, a, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
}

// Close lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightboxOverlay');
    lightbox.hidden = true;
    document.body.classList.remove('modal-open');
    currentEntry = null;
}

// Download current entry JSON
function downloadCurrentEntryJSON() {
    if (!currentEntry) return;

    const exportEntry = {
        ...currentEntry
    };

    // If it's a blob URL, we can't export the actual file path
    // User should use Export JSON from the form instead
    if (exportEntry.media.src.startsWith('blob:')) {
        alert('This entry uses a temporary file. Please use "Export JSON" from the form to export with the correct file path.');
        return;
    }

    delete exportEntry.isDraft;
    if (exportEntry.media.file) {
        delete exportEntry.media.file;
    }

    const json = JSON.stringify(exportEntry, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `entry-${exportEntry.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

