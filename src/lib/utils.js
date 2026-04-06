import { DEFAULT_LOW_STOCK_THRESHOLD } from './constants';

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
