import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Calculator,
  UploadCloud,
  Trash2,
  FileBox,
  Coins,
  TrendingUp,
  Scale,
  Clock,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Percent,
  Box,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MATERIALS } from '../lib/constants';
import { analyzeSTLFile } from '../lib/stl';
import {
  DEFAULT_PRICING,
  densityForMaterial,
  computeItemCost,
  summarizeItems,
  formatRupiah,
  formatNumber,
} from '../lib/pricing';

let uid = 0;
const nextId = () => `stl-${Date.now()}-${uid++}`;

function NumberField({ label, value, onChange, suffix, step = 'any', min = 0 }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="pricing-input-wrap">
        <input
          type="number"
          className="form-input"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
        {suffix && <span className="pricing-input-suffix">{suffix}</span>}
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, tone, value, label }) {
  return (
    <div className="glass-card stat-card pricing-stat">
      <div className="stat-icon" style={{ background: `var(--accent-${tone}-soft)`, color: `var(--accent-${tone})` }}>
        <Icon />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function PricingCalculator() {
  const [items, setItems] = useState([]);
  const [params, setParams] = useState({ ...DEFAULT_PRICING });
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({});
  const inputRef = useRef(null);

  const setParam = (key, value) =>
    setParams((prev) => ({ ...prev, [key]: value }));

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []).filter((f) =>
      f.name.toLowerCase().endsWith('.stl')
    );
    if (files.length === 0) return;

    setIsParsing(true);
    const parsed = await Promise.all(
      files.map(async (file) => {
        const base = {
          id: nextId(),
          name: file.name,
          size: file.size,
          quantity: 1,
          material: MATERIALS[0],
          printHours: DEFAULT_PRICING.printHours,
        };
        try {
          const geo = await analyzeSTLFile(file);
          return { ...base, ...geo, error: null };
        } catch (err) {
          return { ...base, error: err.message || 'Gagal membaca file' };
        }
      })
    );

    setItems((prev) => [...prev, ...parsed]);
    setIsParsing(false);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const clearAll = () => {
    setItems([]);
    setExpanded({});
  };

  const resetParams = () => setParams({ ...DEFAULT_PRICING });

  // Compute cost for every item whenever items or params change.
  const results = useMemo(() => {
    return items.map((item) => {
      const input = {
        ...params,
        quantity: item.quantity,
        printHours: item.printHours,
        density: densityForMaterial(item.material),
      };
      return { item, cost: item.error ? null : computeItemCost(item, input) };
    });
  }, [items, params]);

  const validResults = useMemo(
    () => results.filter((r) => r.cost).map((r) => r.cost),
    [results]
  );
  const summary = useMemo(() => summarizeItems(validResults), [validResults]);

  const copySummary = async () => {
    const lines = [
      'Ringkasan Harga Jual — GOO-Studio',
      `Margin: ${params.marginPercent}% (${params.marginMode === 'markup' ? 'markup' : 'margin'})`,
      '',
      ...results
        .filter((r) => r.cost)
        .map(
          ({ item, cost }) =>
            `${item.name}\n  Berat: ${formatNumber(cost.weightPerUnit)} g x ${cost.quantity}\n  HPP: ${formatRupiah(cost.hppPerUnit)} /unit (${formatRupiah(cost.hppTotal)})\n  Harga jual: ${formatRupiah(cost.sellPerUnit)} /unit (${formatRupiah(cost.sellTotal)})`
        ),
      '',
      `Total HPP: ${formatRupiah(summary.hppTotal)}`,
      `Total Harga Jual: ${formatRupiah(summary.sellTotal)}`,
      `Estimasi Profit: ${formatRupiah(summary.profitTotal)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const toggleExpand = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">🧮 Kalkulator Harga Jual</h1>
          <p className="page-subtitle">
            Upload file STL untuk menghitung berat, HPP, dan harga jual berdasarkan margin.
          </p>
        </div>
        <div className="pricing-header-actions">
          {items.length > 0 && (
            <button className="btn btn-ghost" onClick={clearAll}>
              <Trash2 size={18} /> Hapus Semua
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => inputRef.current?.click()}
            disabled={isParsing}
          >
            <UploadCloud size={18} /> {isParsing ? 'Membaca...' : 'Upload STL'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-stats mb-8 pricing-stats">
        <MiniStat icon={FileBox} tone="primary" value={summary.count} label="Model" />
        <MiniStat icon={Scale} tone="cyan" value={`${formatNumber(summary.weightTotal, 0)}g`} label="Total Berat" />
        <MiniStat icon={Coins} tone="amber" value={formatRupiah(summary.hppTotal)} label="Total HPP" />
        <MiniStat icon={TrendingUp} tone="emerald" value={formatRupiah(summary.sellTotal)} label="Total Harga Jual" />
      </div>

      <div className="layout-split">
        <div className="layout-main">
          {/* Dropzone */}
          <div
            className={`pricing-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud size={40} />
            <p className="pricing-dropzone-title">
              Tarik & lepas file STL di sini
            </p>
            <p className="pricing-dropzone-hint">
              Bisa banyak file sekaligus · format .stl (binary / ASCII)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".stl"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {/* Items */}
          {results.length === 0 ? (
            <div className="glass-card mt-6">
              <div className="empty-state">
                <Box />
                <p>Belum ada file. Upload STL untuk mulai menghitung.</p>
              </div>
            </div>
          ) : (
            <div className="pricing-file-list">
              <AnimatePresence initial={false}>
                {results.map(({ item, cost }) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="glass-card pricing-file-card"
                  >
                    <div className="pricing-file-header">
                      <button
                        className="pricing-expand-btn"
                        onClick={() => toggleExpand(item.id)}
                        aria-label="Detail"
                      >
                        {expanded[item.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                      <FileBox size={18} className="pricing-file-icon" />
                      <div className="pricing-file-name-wrap">
                        <span className="pricing-file-name" title={item.name}>{item.name}</span>
                        <span className="pricing-file-meta">
                          {item.error ? (
                            <span className="pricing-error">
                              <AlertCircle size={12} /> {item.error}
                            </span>
                          ) : (
                            <>
                              {formatNumber(item.volumeMm3 / 1000, 2)} cm³ ·{' '}
                              {item.triangles.toLocaleString('id-ID')} tri ·{' '}
                              {formatNumber(item.bbox.size[0], 0)}×{formatNumber(item.bbox.size[1], 0)}×
                              {formatNumber(item.bbox.size[2], 0)} mm
                            </>
                          )}
                        </span>
                      </div>
                      <button
                        className="btn-icon pricing-remove"
                        onClick={() => removeItem(item.id)}
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {!item.error && cost && (
                      <>
                        <div className="pricing-file-controls">
                          <div className="form-group">
                            <label className="form-label">Material</label>
                            <select
                              className="form-input"
                              value={item.material}
                              onChange={(e) => updateItem(item.id, { material: e.target.value })}
                            >
                              {MATERIALS.map((m) => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Jumlah</label>
                            <input
                              type="number"
                              min="1"
                              className="form-input"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.id, {
                                  quantity: Math.max(1, Number(e.target.value) || 1),
                                })
                              }
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Waktu Cetak</label>
                            <div className="pricing-input-wrap">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                className="form-input"
                                value={item.printHours}
                                onChange={(e) =>
                                  updateItem(item.id, { printHours: Number(e.target.value) || 0 })
                                }
                              />
                              <span className="pricing-input-suffix">jam</span>
                            </div>
                          </div>
                        </div>

                        <div className="pricing-file-results">
                          <div className="pricing-result-cell">
                            <span className="pricing-result-label">Berat</span>
                            <span className="pricing-result-value">
                              {formatNumber(cost.weightPerUnit)} g
                            </span>
                          </div>
                          <div className="pricing-result-cell">
                            <span className="pricing-result-label">HPP / unit</span>
                            <span className="pricing-result-value">{formatRupiah(cost.hppPerUnit)}</span>
                          </div>
                          <div className="pricing-result-cell highlight">
                            <span className="pricing-result-label">Harga Jual / unit</span>
                            <span className="pricing-result-value">{formatRupiah(cost.sellPerUnit)}</span>
                          </div>
                          <div className="pricing-result-cell">
                            <span className="pricing-result-label">Profit / unit</span>
                            <span className="pricing-result-value profit">
                              {formatRupiah(cost.profitPerUnit)}
                            </span>
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {expanded[item.id] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="pricing-breakdown"
                            >
                              <div className="pricing-breakdown-title">Rincian HPP per unit</div>
                              {[
                                ['Material', cost.materialPerUnit],
                                ['Mesin / listrik', cost.machinePerUnit],
                                ['Tenaga kerja', cost.laborPerUnit],
                                ['Cadangan gagal cetak', cost.failurePerUnit],
                                ['Kemasan & lain-lain', cost.extrasPerUnit],
                              ].map(([label, val]) => (
                                <div key={label} className="pricing-breakdown-row">
                                  <span>{label}</span>
                                  <span>{formatRupiah(val)}</span>
                                </div>
                              ))}
                              <div className="pricing-breakdown-row total">
                                <span>Total HPP / unit</span>
                                <span>{formatRupiah(cost.hppPerUnit)}</span>
                              </div>
                              <div className="pricing-breakdown-row">
                                <span>Volume padat model</span>
                                <span>{formatNumber(cost.solidCm3, 2)} cm³</span>
                              </div>
                              <div className="pricing-breakdown-row">
                                <span>Volume tercetak (est.)</span>
                                <span>{formatNumber(cost.printedCm3, 2)} cm³</span>
                              </div>
                              <div className="pricing-breakdown-row">
                                <span>Markup dari HPP</span>
                                <span>{formatNumber(cost.markupPercent, 0)}%</span>
                              </div>
                              <div className="pricing-breakdown-row">
                                <span>Porsi biaya material</span>
                                <span>{formatNumber(cost.materialShare, 0)}%</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Parameters + summary */}
        <div className="layout-sidebar pricing-sidebar">
          <section className="section">
            <div className="section-header">
              <Calculator size={16} /> Parameter Harga
            </div>
            <div className="glass-card form-section pricing-params">
              <div className="form-grid-2">
                <NumberField
                  label="Harga Filament"
                  value={params.materialPricePerKg}
                  onChange={(v) => setParam('materialPricePerKg', v)}
                  suffix="Rp/kg"
                  step="1000"
                />
                <NumberField
                  label="Biaya Mesin"
                  value={params.machineCostPerHour}
                  onChange={(v) => setParam('machineCostPerHour', v)}
                  suffix="Rp/jam"
                  step="500"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Infill (kepadatan isi)</label>
                <div className="pricing-range-row">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="range-slider"
                    value={Math.round((params.infill || 0) * 100)}
                    onChange={(e) => setParam('infill', Number(e.target.value) / 100)}
                  />
                  <span className="pricing-range-value">{Math.round((params.infill || 0) * 100)}%</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ketebalan Dinding</label>
                <div className="pricing-input-wrap">
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    step="0.1"
                    value={params.shellThicknessMm}
                    onChange={(e) => setParam('shellThicknessMm', Number(e.target.value) || 0)}
                  />
                  <span className="pricing-input-suffix">mm</span>
                </div>
                <p className="pricing-hint">
                  Jumlah dinding × lebar nozzle (2 dinding × 0,4 mm ≈ 0,8 mm).
                </p>
              </div>

              <div className="form-grid-2">
                <NumberField
                  label="Kerja Manual"
                  value={params.laborMinutes}
                  onChange={(v) => setParam('laborMinutes', v)}
                  suffix="mnt"
                  step="1"
                />
                <NumberField
                  label="Upah / Jam"
                  value={params.laborCostPerHour}
                  onChange={(v) => setParam('laborCostPerHour', v)}
                  suffix="Rp"
                  step="1000"
                />
              </div>

              <div className="form-grid-2">
                <NumberField
                  label="Cadangan Gagal"
                  value={params.failureRate}
                  onChange={(v) => setParam('failureRate', v)}
                  suffix="%"
                  step="1"
                />
                <NumberField
                  label="Kemasan"
                  value={params.packagingCost}
                  onChange={(v) => setParam('packagingCost', v)}
                  suffix="Rp"
                  step="500"
                />
              </div>

              <NumberField
                label="Biaya Lain-lain"
                value={params.otherCost}
                onChange={(v) => setParam('otherCost', v)}
                suffix="Rp"
                step="500"
              />

              <div className="pricing-divider" />

              <div className="form-group">
                <label className="form-label">
                  <Percent size={12} /> Mode Margin
                </label>
                <div className="pricing-mode-toggle">
                  <button
                    className={`pricing-mode-btn ${params.marginMode === 'margin' ? 'active' : ''}`}
                    onClick={() => setParam('marginMode', 'margin')}
                  >
                    Margin (% dari jual)
                  </button>
                  <button
                    className={`pricing-mode-btn ${params.marginMode === 'markup' ? 'active' : ''}`}
                    onClick={() => setParam('marginMode', 'markup')}
                  >
                    Markup (% dari HPP)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {params.marginMode === 'markup' ? 'Markup' : 'Margin'}: {params.marginPercent}%
                </label>
                <div className="pricing-range-row">
                  <input
                    type="range"
                    min="0"
                    max={params.marginMode === 'margin' ? 90 : 300}
                    step="1"
                    className="range-slider"
                    value={params.marginPercent}
                    onChange={(e) => setParam('marginPercent', Number(e.target.value))}
                  />
                  <input
                    type="number"
                    className="form-input pricing-margin-input"
                    value={params.marginPercent}
                    onChange={(e) => setParam('marginPercent', Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <button className="btn btn-secondary pricing-reset" onClick={resetParams}>
                <RefreshCw size={16} /> Reset Parameter
              </button>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <Coins size={16} /> Ringkasan
            </div>
            <div className="glass-card form-section pricing-summary">
              <div className="pricing-breakdown-row">
                <span>Total berat</span>
                <span>{formatNumber(summary.weightTotal)} g</span>
              </div>
              <div className="pricing-breakdown-row">
                <span>Total unit</span>
                <span>{summary.units}</span>
              </div>
              <div className="pricing-breakdown-row">
                <span>Total HPP</span>
                <span>{formatRupiah(summary.hppTotal)}</span>
              </div>
              <div className="pricing-breakdown-row">
                <span>Estimasi profit</span>
                <span className="profit">{formatRupiah(summary.profitTotal)}</span>
              </div>
              <div className="pricing-breakdown-row total">
                <span>Total harga jual</span>
                <span>{formatRupiah(summary.sellTotal)}</span>
              </div>
              <button
                className="btn btn-secondary pricing-reset"
                onClick={copySummary}
                disabled={summary.count === 0}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Tersalin!' : 'Salin Ringkasan'}
              </button>
            </div>
          </section>

          <section className="section">
            <div className="glass-card pricing-tip">
              <Clock size={16} />
              <p>
                Berat dihitung dari volume STL, luas permukaan, ketebalan dinding, dan infill —
                mengikuti cara slicer (OrcaSlicer/Bambu) menghitung, akurasi ±5% (uji 28 model).
                Waktu cetak, harga filament, dan margin bisa kamu atur sendiri.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
