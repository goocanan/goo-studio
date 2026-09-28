// Print-time estimation from mesh geometry.
//
// Honest scope: print time CANNOT be derived from an STL alone -- it depends on
// layer height, speeds, acceleration, travel and cooling. What we can do is a
// calibrated estimate for THIS printer, fitted against real OrcaSlicer G-code.
//
// Model (physically grounded):
//   Base estimate at the REFERENCE layer height (0.2mm, the calibration height):
//     extrusionSec = printedVolume_mm3 / (lineWidth * refLayer * avgSpeed)
//     overheadSec  = layerCount * secondsPerLayer      (travel, accel, cooling)
//   Layer-height scaling:
//     hours = (extrusionSec + overheadSec) * layerFactor(layerHeight) * correction / 3600
//
// Calibration:
//   * Base: 8 models (0.8-197 cm^3) sliced at 0.2mm / 4 walls / 15% infill. The
//     fit gives a = 99.87 s/cm^3 ~ 10 mm^3/s = 0.42 * 0.2 * ~119 mm/s, matching
//     the profile's blended wall(150)/infill(270) speeds. Mean error ~10%.
//   * Layer height: 3 models x 4 heights (0.10/0.20/0.28/0.30mm) re-sliced in
//     OrcaSlicer. Print time does NOT scale as 1/layerHeight: the hotend's
//     volumetric flow caps extrusion, so thin layers cost less than
//     proportionally more (measured 0.10mm = 1.58x of 0.20mm, not 2.0x).
//     Fitted factor(lh) = A/lh + B, normalised to 1.0 at 0.20mm; residuals <5%.
//     NOTE: 0.40mm is above this printer's max_layer_height (0.32mm) and OrcaSlicer
//     refuses to slice it, so that preset is shown with a warning.

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

// Reference layer height the base model was calibrated at.
export const REFERENCE_LAYER_MM = 0.2;

// Layer-height scaling factor coefficients, fitted against OrcaSlicer:
//   factor(lh) = A/lh + B   with factor(0.20) = 1.0
const LAYER_FACTOR_A = 0.1167;
const LAYER_FACTOR_B = 0.4167;

// Preset layer heights for a 0.4mm nozzle. 0.2mm is the calibration height.
// 0.4mm exceeds this printer's physical maximum (0.32mm) -- kept because it was
// requested, but flagged in the UI as not sliceable.
export const LAYER_HEIGHT_PRESETS = [0.1, 0.2, 0.4];

// Layer heights above the machine's max_layer_height (0.4 nozzle -> 0.32mm).
export const MAX_LAYER_HEIGHT_MM = 0.32;

function num(value) {
  const n = Number(value);
  return isFinite(n) ? n : 0;
}

/**
 * Layer-height time factor, normalised so factor(0.2mm) = 1.
 */
export function layerHeightFactor(layerHeightMm) {
  const lh = Math.max(0.05, num(layerHeightMm));
  return LAYER_FACTOR_A / lh + LAYER_FACTOR_B;
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

  const lineWidth = Math.max(0.01, num(profile.lineWidthMm));
  const speed = Math.max(1, num(profile.avgSpeedMmPerSec));

  // Base estimate at the reference layer height (calibration basis).
  const flowMm3PerSec = lineWidth * REFERENCE_LAYER_MM * speed;
  const extrusionSec = (printedCm3 * 1000) / flowMm3PerSec;

  const heightMm = num(geometry?.bbox?.size?.[2]);
  const refLayers = heightMm > 0 ? heightMm / REFERENCE_LAYER_MM : 0;
  const overheadSec = refLayers * num(profile.secondsPerLayer);

  // Scale to the requested layer height (sub-linear, see notes above).
  const layerFactor = layerHeightFactor(profile.layerHeightMm);

  const totalSec = (extrusionSec + overheadSec) * layerFactor * num(profile.correction || 1);
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
