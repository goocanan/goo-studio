// Pricing engine: turns STL geometry + user cost inputs into HPP (cost of
// goods) and a selling price. Pure functions so they are easy to test/reuse.

import { estimatePrintHours } from './printTime';

/** Typical solid densities in g/cm^3 (= g/ml). */
export const MATERIAL_DENSITIES = {
  PLA: 1.24,
  'PLA+': 1.24,
  'PLA+ 2.0': 1.24,
  'PLA PRO': 1.24,
  PETG: 1.27,
  ABS: 1.04,
  ASA: 1.07,
  TPU: 1.21,
  Nylon: 1.14,
  PA: 1.14,
  PC: 1.2,
  HIPS: 1.04,
};

export const DEFAULT_PRICING = {
  density: 1.24, // g/cm^3
  infill: 0.15, // 15 % (default)
  // Effective wall/shell thickness in mm. Calibrated against OrcaSlicer:
  // 4 walls @ 0.4mm nozzle ~= 1.6mm. Used with the mesh surface area to
  // estimate the printed shell volume, which is what makes weight accurate.
  shellThicknessMm: 1.6,
  materialPricePerKg: 150000, // Rp / kg
  printHours: 2, // jam (fallback when print-time is manual)
  // Auto-estimate print time from geometry, calibrated to OrcaSlicer for this
  // printer (Creality Hi 0.4). Layer height and effective speed drive the flow.
  printTimeAuto: true,
  layerHeightMm: 0.2,
  avgSpeedMmPerSec: 119,
  machineCostPerHour: 5000, // Rp / jam (listrik + depresiasi)
  laborMinutes: 10, // menit kerja manual
  laborCostPerHour: 30000, // Rp / jam
  failureRate: 5, // % cadangan gagal cetak
  packagingCost: 0, // Rp
  otherCost: 0, // Rp
  marginPercent: 40, // % margin dari harga jual
  marginMode: 'margin', // 'margin' | 'markup'
  quantity: 1,
};

export function densityForMaterial(material) {
  if (!material) return DEFAULT_PRICING.density;
  const key = String(material).trim();
  if (MATERIAL_DENSITIES[key] != null) return MATERIAL_DENSITIES[key];
  const found = Object.keys(MATERIAL_DENSITIES).find(
    (k) => k.toLowerCase() === key.toLowerCase()
  );
  return found ? MATERIAL_DENSITIES[found] : DEFAULT_PRICING.density;
}

/**
 * Estimate printed volume (cm^3) from mesh geometry.
 *
 * The naive "solid * (shell + infill*(1-shell))" heuristic is badly wrong for
 * thin-walled or hollow parts because the shell cost scales with SURFACE AREA,
 * not with volume. Instead we model the print as:
 *
 *   shell  = min(solid, surfaceArea * wallThickness)   // walls + top/bottom skin
 *   inner  = max(0, solid - shell)
 *   printed = shell + infill * inner
 *
 * Validated against OrcaSlicer G-code over 28 slices (4 models x 5 infill
 * levels + 8 models @20%): mean error ~4% vs ~25% for the old heuristic, and
 * it converges to the true solid volume at 100% infill.
 */
export function estimatePrintedVolumeCm3(geometry, { infill, shellThicknessMm = 0.8 }) {
  const solidCm3 = num(geometry?.volumeMm3) / 1000;
  if (solidCm3 <= 0) return 0;

  const areaMm2 = num(geometry?.areaMm2);
  const infillRatio = Math.min(1, Math.max(0, Number(infill) || 0));

  // If we have no surface area (e.g. legacy data), fall back to the old model.
  if (!(areaMm2 > 0)) {
    return solidCm3 * (0.25 + 0.75 * infillRatio);
  }

  // shellCm3: area(mm^2) * thickness(mm) = mm^3, /1000 => cm^3
  const shellCm3 = Math.min(solidCm3, (areaMm2 * num(shellThicknessMm)) / 1000);
  const innerCm3 = Math.max(0, solidCm3 - shellCm3);
  return shellCm3 + infillRatio * innerCm3;
}

/**
 * Estimate printed weight (grams) from mesh geometry.
 */
export function estimateWeightGrams(geometry, { density, infill, shellThicknessMm }) {
  const printedCm3 = estimatePrintedVolumeCm3(geometry, { infill, shellThicknessMm });
  return printedCm3 * num(density);
}

function num(value) {
  const n = Number(value);
  return isFinite(n) ? n : 0;
}

/**
 * Resolve the print time (hours) for an item: auto-estimated from geometry when
 * cfg.printTimeAuto is on, otherwise the manual value.
 */
export function resolvePrintHours(geometry, cfg, manualHours) {
  if (cfg && cfg.printTimeAuto === false) return num(manualHours);
  const printedCm3 = estimatePrintedVolumeCm3(geometry, {
    infill: num(cfg?.infill),
    shellThicknessMm: num(cfg?.shellThicknessMm),
  });
  const auto = estimatePrintHours(geometry, {
    printedCm3,
    profile: {
      layerHeightMm: num(cfg?.layerHeightMm) || undefined,
      avgSpeedMmPerSec: num(cfg?.avgSpeedMmPerSec) || undefined,
    },
  });
  // Fall back to the manual value if geometry is too thin to estimate.
  return auto > 0 ? auto : num(manualHours);
}

/**
 * Compute a full cost breakdown for a single item.
 * @param {object} geometry  { volumeMm3 }
 * @param {object} input     pricing inputs (see DEFAULT_PRICING)
 */
export function computeItemCost(geometry, input) {
  const cfg = { ...DEFAULT_PRICING, ...input };
  const volumeMm3 = num(geometry?.volumeMm3);
  const quantity = Math.max(1, Math.round(num(cfg.quantity) || 1));

  const solidCm3 = volumeMm3 / 1000;
  const printedCm3 = estimatePrintedVolumeCm3(geometry, {
    infill: num(cfg.infill),
    shellThicknessMm: num(cfg.shellThicknessMm),
  });
  const weightPerUnit = printedCm3 * num(cfg.density);

  const printHours = resolvePrintHours(geometry, cfg, cfg.printHours);

  const materialPerUnit = (weightPerUnit / 1000) * num(cfg.materialPricePerKg);
  const machinePerUnit = printHours * num(cfg.machineCostPerHour);
  const laborPerUnit = (num(cfg.laborMinutes) / 60) * num(cfg.laborCostPerHour);

  const basePerUnit = materialPerUnit + machinePerUnit + laborPerUnit;
  const failurePerUnit = basePerUnit * (num(cfg.failureRate) / 100);

  const extrasPerBatch = num(cfg.packagingCost) + num(cfg.otherCost);
  const extrasPerUnit = extrasPerBatch / quantity;

  const hppPerUnit =
    materialPerUnit + machinePerUnit + laborPerUnit + failurePerUnit + extrasPerUnit;
  const hppTotal = hppPerUnit * quantity;

  const marginPercent = num(cfg.marginPercent);
  let sellPerUnit;
  if (cfg.marginMode === 'markup') {
    sellPerUnit = hppPerUnit * (1 + marginPercent / 100);
  } else {
    // Margin based on selling price: price = cost / (1 - margin)
    const m = Math.min(marginPercent, 95) / 100;
    sellPerUnit = hppPerUnit / (1 - m);
  }
  const profitPerUnit = sellPerUnit - hppPerUnit;

  return {
    volumeMm3,
    solidCm3,
    printedCm3,
    quantity,
    weightPerUnit,
    weightTotal: weightPerUnit * quantity,
    printHours,
    printHoursPerUnit: printHours,
    printHoursTotal: printHours * quantity,
    materialPerUnit,
    machinePerUnit,
    laborPerUnit,
    failurePerUnit,
    extrasPerUnit,
    hppPerUnit,
    hppTotal,
    marginPercent,
    sellPerUnit,
    sellTotal: sellPerUnit * quantity,
    profitPerUnit,
    profitTotal: profitPerUnit * quantity,
    // Derived insights
    costPerGram: weightPerUnit > 0 ? hppPerUnit / weightPerUnit : 0,
    materialShare: hppPerUnit > 0 ? (materialPerUnit / hppPerUnit) * 100 : 0,
    markupPercent: hppPerUnit > 0 ? (profitPerUnit / hppPerUnit) * 100 : 0,
  };
}

/**
 * Aggregate several item results into one summary.
 */
export function summarizeItems(results) {
  return results.reduce(
    (acc, r) => {
      acc.count += 1;
      acc.units += r.quantity;
      acc.weightTotal += r.weightTotal;
      acc.printHoursTotal += num(r.printHoursTotal);
      acc.hppTotal += r.hppTotal;
      acc.sellTotal += r.sellTotal;
      acc.profitTotal += r.profitTotal;
      return acc;
    },
    { count: 0, units: 0, weightTotal: 0, printHoursTotal: 0, hppTotal: 0, sellTotal: 0, profitTotal: 0 }
  );
}

export function formatRupiah(value) {
  const n = num(value);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatNumber(value, digits = 1) {
  const n = num(value);
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}
