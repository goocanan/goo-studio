import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  Send,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Percent,
  Box,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MATERIALS } from '../lib/constants';
import { ProjectService } from '../api';
import { analyzeSTLFile } from '../lib/stl';
import {
  DEFAULT_PRICING,
  densityForMaterial,
  computeItemCost,
  estimatePrintedVolumeCm3,
  summarizeItems,
  formatRupiah,
  formatNumber,
} from '../lib/pricing';
import {
  estimatePrintHours,
  formatDuration,
  LAYER_HEIGHT_PRESETS,
  MAX_LAYER_HEIGHT_MM,
} from '../lib/printTime';

let uid = 0;
const nextId = () => `stl-${Date.now()}-${uid++}`;

// Persist pricing parameters (and the parsed geometry of uploaded files, which
// is plain numbers) so they survive a page switch or refresh.
const PARAMS_STORAGE_KEY = 'goo-pricing-params';
const ITEMS_STORAGE_KEY = 'goo-pricing-items';

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

// Merge saved params over defaults so newly added keys still get a value.
function loadParams() {
  const saved = loadJSON(PARAMS_STORAGE_KEY, null);
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_PRICING };
  return { ...DEFAULT_PRICING, ...saved };
}

// Restore uploaded items (geometry only; the File object is not serializable).
function loadItems() {
  const saved = loadJSON(ITEMS_STORAGE_KEY, null);
  if (!Array.isArray(saved)) return [];
  return saved.filter((it) => it && typeof it.name === 'string');
}

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
  const [items, setItems] = useState(loadItems);
  const [params, setParams] = useState(loadParams);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState({});
  const inputRef = useRef(null);

  // "Kirim ke Project" — pick a project, then either update an existing
  // component or create a new one, writing the computed weight (g/unit) and
  // print time (min/unit) into it.
  const queryClient = useQueryClient();
  const [sendItem, setSendItem] = useState(null); // { item, cost } | null
  const [sendProjectId, setSendProjectId] = useState('');
  const [sendPartId, setSendPartId] = useState('');
  const [sendMode, setSendMode] = useState('update'); // 'update' | 'create'
  const [sendNewName, setSendNewName] = useState('');
  const [sendFeedback, setSendFeedback] = useState(null); // { type, message }

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: ProjectService.getAll,
    enabled: !!sendItem,
  });

  const sendMutation = useMutation({
    mutationFn: ({ projectId, partId, updates }) =>
      ProjectService.updatePart(projectId, partId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const sendCreateMutation = useMutation({
    mutationFn: ({ projectId, part }) => ProjectService.addPart(projectId, part),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const sendProject = useMemo(
    () => projects.find((p) => p.id === sendProjectId) || null,
    [projects, sendProjectId]
  );
  const sendParts = sendProject?.parts || [];
  const sendPart = sendParts.find((pt) => pt.id === sendPartId) || null;
  const sendWeight = sendItem ? Math.max(0, Math.round(sendItem.cost.weightPerUnit)) : 0;
  const sendMinutes = sendItem
    ? Math.max(0, Math.round(sendItem.cost.printHoursPerUnit * 60))
    : 0;
  const sendDurationLabel = sendItem ? formatDuration(sendItem.cost.printHoursPerUnit) : '-';
  // Bounding box (mm) from the STL analysis, per unit — sent alongside weight/time.
  const sendDims = (() => {
    const size = sendItem?.item?.bbox?.size;
    if (!Array.isArray(size)) return { dimX: 0, dimY: 0, dimZ: 0 };
    return {
      dimX: Math.round(Number(size[0]) || 0),
      dimY: Math.round(Number(size[1]) || 0),
      dimZ: Math.round(Number(size[2]) || 0),
    };
  })();
  // Default name for a new component: the STL file name without its extension.
  const sendDefaultName = sendItem ? sendItem.item.name.replace(/\.stl$/i, '') : '';

  const openSend = (item, cost) => {
    setSendItem({ item, cost });
    setSendProjectId('');
    setSendPartId('');
    setSendMode('update');
    setSendNewName(item.name.replace(/\.stl$/i, ''));
    setSendFeedback(null);
  };

  const closeSend = () => {
    setSendItem(null);
    setSendProjectId('');
    setSendPartId('');
    setSendFeedback(null);
  };

  const canSubmitSend =
    !!sendProjectId && (sendMode === 'update' ? !!sendPartId : sendNewName.trim().length > 0);

  const handleSend = async () => {
    if (!sendItem || !sendProjectId) return;
    try {
      if (sendMode === 'create') {
        const name = sendNewName.trim() || sendDefaultName || 'Component';
        await sendCreateMutation.mutateAsync({
          projectId: sendProjectId,
          part: {
            name,
            material: MATERIALS[0],
            color: 'Unknown',
            weight: sendWeight,
            printDurationMinutes: sendMinutes,
            quantity: sendItem.item.quantity || 1,
            ...sendDims,
          },
        });
        setSendFeedback({
          type: 'ok',
          message: `Component baru "${name}" dibuat: ${sendWeight} g · ${sendDurationLabel} per unit.`,
        });
      } else {
        if (!sendPartId) return;
        await sendMutation.mutateAsync({
          projectId: sendProjectId,
          partId: sendPartId,
          updates: { weight: sendWeight, printDurationMinutes: sendMinutes, ...sendDims },
        });
        setSendFeedback({
          type: 'ok',
          message: `Berhasil diperbarui: ${sendWeight} g · ${sendDurationLabel} per unit.`,
        });
      }
    } catch (e) {
      setSendFeedback({ type: 'err', message: e?.message || 'Gagal mengirim ke project.' });
    }
  };

  // Persist to localStorage so values survive page switches and refreshes.
  useEffect(() => {
    try {
      localStorage.setItem(PARAMS_STORAGE_KEY, JSON.stringify(params));
    } catch {
      /* storage full / unavailable */
    }
  }, [params]);

  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full / unavailable */
    }
  }, [items]);

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
            `${item.name}\n  Berat: ${formatNumber(cost.weightPerUnit)} g x ${cost.quantity}\n  Waktu cetak: ${formatDuration(cost.printHours)} /unit\n  HPP: ${formatRupiah(cost.hppPerUnit)} /unit (${formatRupiah(cost.hppTotal)})\n  Harga jual: ${formatRupiah(cost.sellPerUnit)} /unit (${formatRupiah(cost.sellTotal)})`
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
    <>
      {sendItem && (
        <div className="modal-overlay" onClick={closeSend}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Kirim ke Component Project</h2>
              <button className="btn-icon" onClick={closeSend} type="button">✕</button>
            </div>

            <div className="modal-form">
              <div className="pricing-send-source">
                <FileBox size={16} className="pricing-file-icon" />
                <span className="pricing-send-source-name" title={sendItem.item.name}>
                  {sendItem.item.name}
                </span>
              </div>

              <div className="pricing-send-preview">
                <div className="pricing-send-preview-cell">
                  <Scale size={13} className="text-cyan-400" />
                  <span className="pricing-send-preview-label">Berat / unit</span>
                  <span className="pricing-send-preview-value">{sendWeight} g</span>
                </div>
                <div className="pricing-send-preview-cell">
                  <Clock size={13} className="text-amber-400" />
                  <span className="pricing-send-preview-label">Waktu cetak / unit</span>
                  <span className="pricing-send-preview-value">{sendDurationLabel}</span>
                </div>
                <div className="pricing-send-preview-cell">
                  <Box size={13} className="text-emerald-400" />
                  <span className="pricing-send-preview-label">Ukuran (X×Y×Z)</span>
                  <span className="pricing-send-preview-value">
                    {sendDims.dimX > 0 || sendDims.dimY > 0
                      ? `${sendDims.dimX}×${sendDims.dimY}×${sendDims.dimZ} mm`
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project</label>
                <select
                  className="form-input"
                  value={sendProjectId}
                  onChange={(e) => {
                    setSendProjectId(e.target.value);
                    setSendPartId('');
                    setSendFeedback(null);
                  }}
                >
                  <option value="">-- Pilih Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Aksi</label>
                <div className="pricing-send-mode">
                  <button
                    type="button"
                    className={`pricing-send-mode-btn ${sendMode === 'update' ? 'active' : ''}`}
                    onClick={() => { setSendMode('update'); setSendFeedback(null); }}
                  >
                    Perbarui component
                  </button>
                  <button
                    type="button"
                    className={`pricing-send-mode-btn ${sendMode === 'create' ? 'active' : ''}`}
                    onClick={() => { setSendMode('create'); setSendFeedback(null); }}
                  >
                    Buat component baru
                  </button>
                </div>
              </div>

              {sendMode === 'update' ? (
                <div className="form-group">
                  <label className="form-label">Component (yang diperbarui)</label>
                  <select
                    className="form-input"
                    value={sendPartId}
                    disabled={!sendProjectId}
                    onChange={(e) => {
                      setSendPartId(e.target.value);
                      setSendFeedback(null);
                    }}
                  >
                    <option value="">
                      {!sendProjectId
                        ? '-- Pilih project dulu --'
                        : sendParts.length === 0
                          ? '-- Project ini belum punya component --'
                          : '-- Pilih Component --'}
                    </option>
                    {sendParts.map((pt) => (
                      <option key={pt.id} value={pt.id}>
                        {pt.name} ({pt.quantity || 1}u) · {Math.round(Number(pt.weight) || 0)}g
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Nama component baru</label>
                  <input
                    type="text"
                    className="form-input"
                    value={sendNewName}
                    placeholder={sendDefaultName || 'Nama component'}
                    onChange={(e) => {
                      setSendNewName(e.target.value);
                      setSendFeedback(null);
                    }}
                  />
                </div>
              )}

              {sendMode === 'update' && sendPart && (
                <p className="pricing-send-warn">
                  Component &quot;{sendPart.name}&quot; akan diperbarui: berat{' '}
                  {Math.round(Number(sendPart.weight) || 0)} g → <strong>{sendWeight} g</strong>,
                  durasi {formatDuration((Number(sendPart.printDurationMinutes) || 0) / 60)} →{' '}
                  <strong>{sendDurationLabel}</strong>.
                </p>
              )}

              {sendMode === 'create' && sendProjectId && (
                <p className="pricing-send-warn">
                  Component baru &quot;{sendNewName.trim() || sendDefaultName}&quot; akan dibuat di
                  project &quot;{sendProject?.name}&quot; dengan berat{' '}
                  <strong>{sendWeight} g</strong> dan durasi <strong>{sendDurationLabel}</strong>{' '}
                  per unit.
                </p>
              )}

              {sendFeedback && (
                <p className={`pricing-send-feedback ${sendFeedback.type === 'ok' ? 'ok' : 'err'}`}>
                  {sendFeedback.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />}
                  {sendFeedback.message}
                </p>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeSend}>
                  {sendFeedback?.type === 'ok' ? 'Selesai' : 'Batal'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSend}
                  disabled={!canSubmitSend || sendMutation.isPending || sendCreateMutation.isPending}
                >
                  <Send size={14} />
                  {sendMutation.isPending || sendCreateMutation.isPending
                    ? 'Mengirim...'
                    : sendMode === 'create'
                      ? 'Buat'
                      : 'Kirim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                            <label className="form-label">
                              Waktu Cetak{' '}
                              {params.printTimeAuto !== false && (
                                <span className="pricing-auto-tag">otomatis</span>
                              )}
                            </label>
                            <div className="pricing-input-wrap">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                className="form-input"
                                value={
                                  params.printTimeAuto === false
                                    ? item.printHours
                                    : Math.round((cost?.printHours ?? 0) * 100) / 100
                                }
                                disabled={params.printTimeAuto !== false}
                                onChange={(e) =>
                                  updateItem(item.id, { printHours: Number(e.target.value) || 0 })
                                }
                              />
                              <span className="pricing-input-suffix">jam</span>
                            </div>
                            {params.printTimeAuto !== false && cost?.printHours != null && (
                              <p className="pricing-hint">
                                ≈ {formatDuration(cost.printHours)} dari geometri STL
                              </p>
                            )}
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

                        <div className="pricing-file-actions">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm pricing-send-btn"
                            onClick={() => openSend(item, cost)}
                            title="Copy berat & waktu cetak ke component project"
                          >
                            <Send size={14} /> Kirim ke Project
                          </button>
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
                    step="1"
                    className="range-slider"
                    value={Math.round((params.infill || 0) * 100)}
                    onChange={(e) => setParam('infill', Number(e.target.value) / 100)}
                  />
                  <div className="pricing-input-wrap pricing-infill-wrap">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      className="form-input"
                      value={Math.round((params.infill || 0) * 100)}
                      onChange={(e) => {
                        const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        setParam('infill', v / 100);
                      }}
                    />
                    <span className="pricing-input-suffix">%</span>
                  </div>
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
                  Jumlah dinding × lebar nozzle (4 dinding × 0,4 mm ≈ 1,6 mm).
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Waktu Cetak</label>
                <div className="pricing-mode-toggle">
                  <button
                    className={`pricing-mode-btn ${params.printTimeAuto !== false ? 'active' : ''}`}
                    onClick={() => setParam('printTimeAuto', true)}
                  >
                    Otomatis dari STL
                  </button>
                  <button
                    className={`pricing-mode-btn ${params.printTimeAuto === false ? 'active' : ''}`}
                    onClick={() => setParam('printTimeAuto', false)}
                  >
                    Manual
                  </button>
                </div>
                {params.printTimeAuto !== false && (
                  <>
                    <div className="form-grid-2" style={{ marginTop: '0.5rem' }}>
                      <NumberField
                        label="Tinggi Layer"
                        value={params.layerHeightMm}
                        onChange={(v) => setParam('layerHeightMm', v)}
                        suffix="mm"
                        step="0.05"
                      />
                      <NumberField
                        label="Kecepatan Efektif"
                        value={params.avgSpeedMmPerSec}
                        onChange={(v) => setParam('avgSpeedMmPerSec', v)}
                        suffix="mm/s"
                        step="5"
                      />
                    </div>
                    <div className="pricing-preset-row">
                      <span className="pricing-preset-label">Preset tinggi layer</span>
                      {LAYER_HEIGHT_PRESETS.map((h) => {
                        const active = Number(params.layerHeightMm) === h;
                        const overMax = h > MAX_LAYER_HEIGHT_MM;
                        return (
                          <button
                            key={h}
                            type="button"
                            className={`pricing-preset-chip ${active ? 'active' : ''} ${overMax ? 'warn' : ''}`}
                            onClick={() => setParam('layerHeightMm', h)}
                            title={
                              overMax
                                ? `Tinggi layer ${String(h).replace('.', ',')} mm melebihi batas printer (maks ${String(MAX_LAYER_HEIGHT_MM).replace('.', ',')} mm) — OrcaSlicer tidak bisa slice`
                                : `Tinggi layer ${String(h).replace('.', ',')} mm`
                            }
                          >
                            {String(h).replace('.', ',')} mm
                            {overMax ? ' ⚠' : ''}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
                <p className="pricing-hint">
                  {params.printTimeAuto !== false
                    ? 'Estimasi dari geometri (volume + jumlah layer), dikalibrasi ke OrcaSlicer. Akurasi ±10–15%.'
                    : 'Isi jam cetak manual di tiap file.'}
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
                <span>Total waktu cetak</span>
                <span>{formatDuration(summary.printHoursTotal)}</span>
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
                Waktu cetak diestimasi otomatis dari geometri (volume + jumlah layer) dan
                dikalibrasi ke OrcaSlicer; kamu bisa setel tinggi layer & kecepatan efektif.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
    </>
  );
}
