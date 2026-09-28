// Pricing engine: turns STL geometry + user cost inputs into HPP (cost of
// goods) and a selling price. Pure functions so they are easy to test/reuse.

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
  infill: 0.2, // 20 %
  materialPricePerKg: 150000, // Rp / kg
  printHours: 2, // jam
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
 * Estimate printed weight (grams) from solid volume (mm^3).
 * Uses the common slicer heuristic:
 *   printedVolume = solidVolume * (shell + infill * (1 - shell))
 * with shell ~= 25% for typical 0.4mm nozzle / 3 walls.
 */
export function estimateWeightGrams(volumeMm3, { density, infill, shellFactor = 0.25 }) {
  const solidCm3 = (volumeMm3 || 0) / 1000;
  const infillRatio = Math.min(1, Math.max(0, Number(infill) || 0));
  const effectiveRatio = shellFactor + (1 - shellFactor) * infillRatio;
  return solidCm3 * density * effectiveRatio;
}

function num(value) {
  const n = Number(value);
  return isFinite(n) ? n : 0;
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
  const weightPerUnit = estimateWeightGrams(volumeMm3, {
    density: num(cfg.density),
    infill: num(cfg.infill),
  });

  const materialPerUnit = (weightPerUnit / 1000) * num(cfg.materialPricePerKg);
  const machinePerUnit = num(cfg.printHours) * num(cfg.machineCostPerHour);
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
    quantity,
    weightPerUnit,
    weightTotal: weightPerUnit * quantity,
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
      acc.hppTotal += r.hppTotal;
      acc.sellTotal += r.sellTotal;
      acc.profitTotal += r.profitTotal;
      return acc;
    },
    { count: 0, units: 0, weightTotal: 0, hppTotal: 0, sellTotal: 0, profitTotal: 0 }
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
