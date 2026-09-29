import { DEFAULT_LOW_STOCK_THRESHOLD, BED_MARGIN_MM } from './constants';

/**
 * Generate a spool ID based on material type and existing spools.
 * Format: MATERIAL-XX (e.g., PLA-04, PETG-03)
 */
export function generateSpoolId(material, existingSpools = []) {
  const prefix = material.replace('+', '').toUpperCase();
  const existingWithPrefix = existingSpools.filter(s =>
    s.id.startsWith(prefix + '-')
  );
  const maxNum = existingWithPrefix.reduce((max, s) => {
    const num = parseInt(s.id.split('-')[1], 10);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const nextNum = String(maxNum + 1).padStart(2, '0');
  return `${prefix}-${nextNum}`;
}

/**
 * Calculate spool status based on remaining weight and threshold.
 */
export function calculateStatus(remainingWeight, initialWeight, threshold = DEFAULT_LOW_STOCK_THRESHOLD) {
  if (remainingWeight <= 0) return 'empty';
  if (remainingWeight >= initialWeight * 0.98) return 'new';
  if (remainingWeight <= threshold) return 'low';
  return 'available';
}

/**
 * Calculate weight percentage.
 */
export function weightPercent(remaining, initial) {
  if (initial <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((remaining / initial) * 100)));
}

/**
 * Format weight as human-readable string.
 */
export function formatWeight(grams) {
  if (grams === undefined || grams === null || isNaN(grams)) return '0g';
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)}kg`;
  }
  return `${Math.round(grams)}g`;
}

/**
 * Format minutes into readable hours and minutes string (e.g. 2j 15m or 45m).
 */
export function formatDuration(totalMinutes) {
  if (!totalMinutes || isNaN(totalMinutes) || totalMinutes <= 0) return '0m';
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  if (hours > 0 && mins > 0) return `${hours}j ${mins}m`;
  if (hours > 0) return `${hours}j`;
  return `${mins}m`;
}

/**
 * Get a progress bar color/class based on percentage.
 */
export function getWeightColor(percent) {
  if (percent <= 10) return 'var(--accent-rose)';
  if (percent <= 25) return 'var(--accent-amber)';
  if (percent <= 50) return 'var(--accent-cyan)';
  return 'var(--accent-emerald)';
}

/**
 * Get badge class name from status.
 */
export function getStatusBadgeClass(status) {
  const map = {
    'available': 'badge-available',
    'low': 'badge-low',
    'empty': 'badge-empty',
    'new': 'badge-new',
  };
  return map[status] || 'badge-available';
}

/**
 * Get project status badge class.
 */
export function getProjectStatusBadgeClass(status) {
  const map = {
    'idea': 'badge-new',
    'ready': 'badge-available',
    'printing': 'badge-in-use',
    'done': 'badge-emerald',
  };
  return map[status] || 'badge-new';
}

/**
 * Get part status badge class.
 */
export function getPartStatusBadgeClass(status) {
  const map = {
    'pending': 'badge-low',
    'ready': 'badge-available',
    'printing': 'badge-in-use',
    'done': 'badge-emerald',
  };
  return map[status] || 'badge-low';
}

/**
 * Get status display label.
 */
export function getStatusLabel(status) {
  const map = {
    'available': 'Available',
    'low': 'Low Stock',
    'empty': 'Empty',
    'in-use': 'In Use',
    'new': 'Baru',
  };
  return map[status] || status;
}

/**
 * Format a date string relative to now.
 */
export function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days === 1) return 'Kemarin';
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Group parts from multiple projects by material and color.
 * Useful for Smart Batching.
 */
export function groupPartsByColorMaterial(projects) {
  const groups = {};

  projects.forEach(project => {
    // Collect all parts from any project that isn't 'done'
    if (project.status === 'done' || !project.parts) return;

    project.parts.forEach(part => {
      // Only batch parts that are 'pending' or 'ready'
      if (part.status === 'done' || part.status === 'printing') return;

      const key = `${part.material || part.materialType}|${part.color || part.colorName}`;
      if (!groups[key]) {
        groups[key] = {
          material: part.material || part.materialType,
          color: part.color || part.colorName,
          totalQuantity: 0,
          parts: [],
        };
      }

      const quantity = Number(part.quantity) || 1;
      
      groups[key].totalQuantity += quantity;
      groups[key].parts.push({
        ...part,
        projectName: project.name,
        projectId: project.id,
      });
    });
  });
  return Object.values(groups).sort((a, b) => b.totalQuantity - a.totalQuantity);
}

/**
 * Footprint (mm) of a part on the bed = its X/Y bounding box. Falls back to Z
 * for legacy parts that only have one dimension recorded.
 */
export function partFootprint(part) {
  const x = Number(part?.dimX) || 0;
  const y = Number(part?.dimY) || 0;
  const z = Number(part?.dimZ) || 0;
  const w = x || z;
  const d = y || z;
  return { w, d, known: x > 0 && y > 0 };
}

// Try to place one rectangle (w x d) into the current shelf packing. Returns the
// placement + next shelf state, or null when it does not fit anywhere left.
function shelfTryPlace(shelf, w, d) {
  let pw = w;
  let pd = d;
  if (pw > shelf.W || pd > shelf.D) {
    // Rotate 90° if that helps.
    if (d <= shelf.W && w <= shelf.D) {
      pw = d;
      pd = w;
    } else {
      return null;
    }
  }
  let y = shelf.shelfY;
  let x = shelf.cursorX;
  let h = shelf.shelfH;
  if (x + pw > shelf.W) {
    // Start a new row (shelf).
    y = shelf.shelfY + shelf.shelfH;
    x = 0;
    h = 0;
  }
  if (y + pd > shelf.D) return null;
  return { x, y, w: pw, d: pd, nextY: y, nextH: Math.max(h, pd), nextX: x + pw };
}

/**
 * Pack parts onto a bed with a shelf (row) algorithm.
 *
 * - `priorityIds` are laid out first (so the user's manual selection is kept),
 *   then every other part is offered the leftover space, largest first.
 * - A part is "placed" only when ALL of its copies fit (all-or-nothing), so the
 *   returned `selectedIds` is exactly the set that fits the plate.
 *
 * Returns { W, D, totalArea, usedArea, fillPercent, selectedIds, overflowIds,
 *           unknownIds, placements }.
 */
export function packBed(parts, bedWidth, bedDepth, { margin = BED_MARGIN_MM, priorityIds = [], excludeIds = [] } = {}) {
  const W = Math.max(0, (Number(bedWidth) || 0) - margin * 2);
  const D = Math.max(0, (Number(bedDepth) || 0) - margin * 2);
  const priority = new Set(priorityIds);
  const excluded = new Set(excludeIds);

  const candidates = (parts || [])
    .filter((part) => !excluded.has(part.id))
    .map((part) => ({ part, fp: partFootprint(part) }))
    .filter((c) => c.fp.known && c.fp.w > 0 && c.fp.d > 0)
    .sort((a, b) => {
      const pa = priority.has(a.part.id) ? 0 : 1;
      const pb = priority.has(b.part.id) ? 0 : 1;
      if (pa !== pb) return pa - pb;
      return b.fp.w * b.fp.d - a.fp.w * a.fp.d;
    });

  const shelf = { W, D, placements: [], shelfY: 0, shelfH: 0, cursorX: 0 };
  const selectedIds = [];

  for (const c of candidates) {
    const qty = Math.max(1, Number(c.part.quantity) || 1);
    const trial = { ...shelf, placements: shelf.placements.slice() };
    let ok = true;
    for (let i = 0; i < qty; i++) {
      const spot = shelfTryPlace(trial, c.fp.w, c.fp.d);
      if (!spot) { ok = false; break; }
      trial.placements.push({ partId: c.part.id, x: spot.x, y: spot.y, w: spot.w, d: spot.d });
      trial.shelfY = spot.nextY;
      trial.shelfH = spot.nextH;
      trial.cursorX = spot.nextX;
    }
    if (ok) {
      shelf.placements = trial.placements;
      shelf.shelfY = trial.shelfY;
      shelf.shelfH = trial.shelfH;
      shelf.cursorX = trial.cursorX;
      selectedIds.push(c.part.id);
    }
  }

  const placedSet = new Set(selectedIds);
  const usedArea = shelf.placements.reduce((s, p) => s + p.w * p.d, 0);
  const totalArea = W * D;

  return {
    W,
    D,
    totalArea,
    usedArea,
    fillPercent: totalArea > 0 ? Math.round((usedArea / totalArea) * 100) : 0,
    selectedIds,
    overflowIds: (parts || [])
      .filter((p) => priority.has(p.id) && !placedSet.has(p.id) && partFootprint(p).known)
      .map((p) => p.id),
    unknownIds: (parts || []).filter((p) => !partFootprint(p).known).map((p) => p.id),
    placements: shelf.placements,
  };
}

/**
 * Compresses and resizes an image before uploading/saving to DB.
 * Max width/height 1200px, JPEG quality 0.8
 */
export async function optimizeImage(fileOrBase64, maxWidth = 1000, maxHeight = 1000) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to compressed jpeg
      const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      resolve(optimizedBase64);
    };

    if (typeof fileOrBase64 === 'string') {
      img.src = fileOrBase64;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.readAsDataURL(fileOrBase64);
    }
  });
}

/**
 * True when the value is a usable remote image link (http/https).
 * Lets users attach a project photo by pasting a URL instead of uploading a file.
 */
export function isRemoteImageUrl(value) {
  if (typeof value !== 'string') return false;
  return /^https?:\/\/\S+$/i.test(value.trim());
}

/**
 * Normalise a pasted image link. Adds a missing https:// scheme so
 * "example.com/pic.jpg" works, and returns null when it is not a usable link.
 */
export function normalizeImageUrl(value) {
  if (typeof value !== 'string') return null;
  let url = value.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    // Only auto-prefix something that looks like a host (has a dot before any slash)
    if (!/^[\w.-]+\.[a-z]{2,}([/?#]|$)/i.test(url)) return null;
    url = 'https://' + url;
  }
  return /^https?:\/\/\S+$/i.test(url) ? url : null;
}
