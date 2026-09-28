// Print-time estimation from mesh geometry.
//
// Honest scope: print time CANNOT be derived from an STL alone -- it depends on
// layer height, speeds, acceleration, travel and cooling. What we can do is a
// calibrated estimate for THIS printer, fitted against real OrcaSlicer G-code.
//
// Model (physically grounded):
//   extrusionSec = printedVolume_mm3 / (lineWidth * layerHeight * avgSpeed)
//   overheadSec  = layerCount * secondsPerLayer      (travel, accel, cooling)
//   hours        = (extrusionSec + overheadSec) * correction / 3600
//
// Calibration: 8 models (0.8-197 cm^3) sliced in OrcaSlicer with the Creality
// Hi 0.4 profile at 4 walls / 15% infill. The fit gives a = 99.87 s/cm^3,
// i.e. a volumetric flow of ~10 mm^3/s = 0.42 * 0.2 * ~119 mm/s, which matches
// the profile's blended wall(150)/infill(270) speeds. Mean error ~10%.

export const DEFAULT_PRINT_PROFILE = {
  layerHeightMm: 0.2,
  lineWidthMm: 0.42,
  // Effective average extrusion speed (blend of wall/infill speeds), mm/s.
  avgSpeedMmPerSec: 119,
  // Seconds added per layer for travel, acceleration ramp-up and cooling.
  secondsPerLayer: 4.75,
  // Global correction factor (1.0 = calibrated defaults above).
  correction: 1.0,
};

function num(value) {
  const n = Number(value);
  return isFinite(n) ? n : 0;
}

/**
 * Estimate print time in hours for one unit.
 * @param {object} geometry { volumeMm3, areaMm2, bbox }
 * @param {object} opts     { printedCm3, profile }
 */
export function estimatePrintHours(geometry, opts = {}) {
  const profile = { ...DEFAULT_PRINT_PROFILE, ...(opts.profile || {}) };
  const printedCm3 = num(opts.printedCm3);
  if (printedCm3 <= 0) return 0;

  const layerHeight = Math.max(0.01, num(profile.layerHeightMm));
  const lineWidth = Math.max(0.01, num(profile.lineWidthMm));
  const speed = Math.max(1, num(profile.avgSpeedMmPerSec));

  // Extrusion time: printed volume / (flow area * speed)
  const flowMm3PerSec = lineWidth * layerHeight * speed;
  const extrusionSec = (printedCm3 * 1000) / flowMm3PerSec;

  // Layer count from the model height, plus per-layer overhead.
  const heightMm = num(geometry?.bbox?.size?.[2]);
  const layers = heightMm > 0 ? heightMm / layerHeight : 0;
  const overheadSec = layers * num(profile.secondsPerLayer);

  const totalSec = (extrusionSec + overheadSec) * num(profile.correction || 1);
  return totalSec / 3600;
}

/**
 * Format hours into "Xj Ym" for display.
 */
export function formatDuration(hours) {
  const h = num(hours);
  if (h <= 0) return '-';
  const totalMin = Math.round(h * 60);
  const hh = Math.floor(totalMin / 60);
  const mm = totalMin % 60;
  if (hh <= 0) return `${mm} mnt`;
  return `${hh} j ${mm} mnt`;
}
