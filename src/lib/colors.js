// Color detection from part names.
// Reads the color mentioned in a part's name (English + Indonesian, common
// filament colors) so the Create Project form can group parts by color and
// assign one filament per color group instead of one per part.

// Canonical colors: key -> { label, hex, aliases }
// Aliases are matched as whole words inside the part name (case-insensitive).
const COLOR_DEFS = [
  { key: 'black',      label: 'Hitam',      hex: '#1c1c1e', aliases: ['black', 'hitam', 'noir', 'blk'] },
  { key: 'white',      label: 'Putih',      hex: '#f5f5f7', aliases: ['white', 'putih', 'wht', 'bone', 'ivory', 'beige', 'cream'] },
  { key: 'grey',       label: 'Abu-abu',    hex: '#8e8e93', aliases: ['grey', 'gray', 'abu', 'silver', 'perak', 'steel'] },
  { key: 'red',        label: 'Merah',      hex: '#e23b3b', aliases: ['red', 'merah', 'maroon', 'merah tua'] },
  { key: 'orange',     label: 'Oranye',     hex: '#f08a24', aliases: ['orange', 'oranye', 'jingga'] },
  { key: 'yellow',     label: 'Kuning',     hex: '#f2c40f', aliases: ['yellow', 'kuning', 'gold', 'emas'] },
  { key: 'green',      label: 'Hijau',      hex: '#2fae4e', aliases: ['green', 'hijau', 'lime', 'emerald', 'olive'] },
  { key: 'blue',       label: 'Biru',       hex: '#2f6fe0', aliases: ['blue', 'biru', 'navy', 'cyan', 'toska', 'teal'] },
  { key: 'purple',     label: 'Ungu',       hex: '#8b4fd0', aliases: ['purple', 'ungu', 'violet', 'magenta', 'lavender'] },
  { key: 'pink',       label: 'Pink',       hex: '#e8629f', aliases: ['pink', 'merah muda', 'fuchsia'] },
  { key: 'brown',      label: 'Coklat',     hex: '#8a5a2b', aliases: ['brown', 'coklat', 'cokelat', 'chocolate', 'wood', 'kayu'] },
  { key: 'clear',      label: 'Bening',     hex: '#cfe6f2', aliases: ['clear', 'transparent', 'transparan', 'bening', 'natural'] },
];

// Build a fast lookup: alias -> canonical color def. Longer aliases first so
// multi-word phrases (e.g. "merah muda") win over their shorter parts.
const ALIAS_INDEX = [];
COLOR_DEFS.forEach((def) => {
  def.aliases.forEach((alias) => ALIAS_INDEX.push({ alias, def }));
});
ALIAS_INDEX.sort((a, b) => b.alias.length - a.alias.length);

export const COLOR_DEFS_MAP = COLOR_DEFS.reduce((acc, d) => {
  acc[d.key] = d;
  return acc;
}, {});

/**
 * Detect the first color mentioned in a part name.
 * @param {string} name
 * @returns {{key:string,label:string,hex:string}|null}
 */
export function detectColorFromName(name) {
  if (!name || typeof name !== 'string') return null;
  const haystack = ` ${name.toLowerCase().replace(/[_\-]+/g, ' ')} `;
  for (const { alias, def } of ALIAS_INDEX) {
    // Whole-word match, allowing digits/symbols around it (e.g. "black2", "red_v2").
    const re = new RegExp(`(^|[^a-z])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i');
    if (re.test(haystack)) return { key: def.key, label: def.label, hex: def.hex };
  }
  return null;
}

/**
 * Group a list of parts by the color detected in their name.
 * Preserves first-seen order; parts without a detectable color fall into the
 * "unknown" bucket so they can still be assigned together.
 * @param {Array<{id:any,name:string}>} parts
 * @returns {Array<{key:string,label:string,hex:string,partIds:any[],count:number}>}
 */
export function groupPartsByColor(parts) {
  const groups = new Map();
  (parts || []).forEach((part) => {
    const detected = detectColorFromName(part.name);
    const key = detected ? detected.key : 'unknown';
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: detected ? detected.label : 'Tanpa warna terdeteksi',
        hex: detected ? detected.hex : '#6b7280',
        partIds: [],
        count: 0,
      });
    }
    const g = groups.get(key);
    g.partIds.push(part.id);
    g.count += 1;
  });
  return Array.from(groups.values());
}

/**
 * Find the best inventory spool for a detected color group.
 * Matches the spool's color name against the color's aliases, preferring the
 * spool with the most filament remaining.
 * @param {{key:string,label:string}} group
 * @param {Array} spools  spools with { id, colorName, material, remainingWeight }
 * @param {string} [material] optional material to prefer
 * @returns {object|null}
 */
export function matchSpoolForColor(group, spools, material) {
  if (!group || !spools || spools.length === 0) return null;
  const def = COLOR_DEFS_MAP[group.key];
  const aliases = def ? def.aliases : [];
  const candidates = spools.filter((s) => {
    const cn = (s.colorName || '').toLowerCase();
    if (!cn) return false;
    return aliases.some((a) => cn.includes(a)) || cn.includes((group.label || '').toLowerCase());
  });
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => {
    if (material) {
      const am = a.material === material ? 1 : 0;
      const bm = b.material === material ? 1 : 0;
      if (am !== bm) return bm - am;
    }
    return (b.remainingWeight || 0) - (a.remainingWeight || 0);
  });
  return sorted[0];
}
