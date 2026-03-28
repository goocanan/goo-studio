import React, { useState } from 'react';
import { ArrowLeft, Trash2, Save, QrCode, Thermometer, Weight, Tag, Palette } from 'lucide-react';
import { formatWeight, weightPercent, getWeightColor, getStatusBadgeClass, getStatusLabel } from '../lib/utils';
import { BRANDS, MATERIALS } from '../lib/constants';

export default function SpoolDetail({ spool, onBack, onUpdate, onDelete, onAdjustWeight }) {
  const [form, setForm] = useState({ ...spool });
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!spool) return null;

  const pct = weightPercent(form.remainingWeight, form.initialWeight);
  const barColor = getWeightColor(pct);

  const handleSave = () => {
    onUpdate(spool.id, {
      brand: form.brand,
      material: form.material,
      colorName: form.colorName,
      colorHex: form.colorHex,
      version: form.version,
      initialWeight: Number(form.initialWeight),

      remainingWeight: Number(form.remainingWeight),
      nozzleTempMin: Number(form.nozzleTempMin),
      nozzleTempMax: Number(form.nozzleTempMax),
      bedTempMin: Number(form.bedTempMin),
      bedTempMax: Number(form.bedTempMax),
      printSpeed: Number(form.printSpeed),
      notes: form.notes,
    });
    onBack();
  };

  const handleQuickAdjust = (amount) => {
    const newWeight = Math.max(0, form.remainingWeight - amount);
    setForm(f => ({ ...f, remainingWeight: newWeight }));
    onAdjustWeight(spool.id, amount);
  };

  // SVG donut gauge
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="animate-in">
      {/* Top Bar */}
      <div className="detail-top-bar">
        <button className="btn btn-ghost" onClick={onBack}>
          <ArrowLeft style={{ width: 18, height: 18 }} />
          Back
        </button>
        {confirmDelete ? (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-rose)' }}>Yakin hapus?</span>
            <button className="btn btn-danger" onClick={() => { onDelete(spool.id); onBack(); }}>
              Hapus
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Batal</button>
          </div>
        ) : (
          <button className="btn btn-icon" onClick={() => setConfirmDelete(true)} title="Delete spool">
            <Trash2 style={{ width: 18, height: 18 }} />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="detail-header">
        <div className="detail-color-swatch" style={{ background: form.colorHex }} />
        <div className="detail-info">
          <div className="heading-lg">{form.brand} {form.material} {form.colorName}</div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
            <span className="text-dim" style={{ fontSize: '0.85rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
              {spool.id}
            </span>
            <span className={`badge ${getStatusBadgeClass(spool.status)}`}>
              <span className="badge-dot" />
              {getStatusLabel(spool.status)}
            </span>
          </div>
        </div>
      </div>

      {/* Section A: Identity */}
      <div className="detail-section">
        <div className="section-header">
          <Tag style={{ width: 16, height: 16 }} />
          <span>Identity</span>
        </div>
        <div className="modal-form">
          <div className="modal-form-row">
            <div className="form-group">
              <label className="form-label">Brand</label>
              <select
                className="form-input form-select"
                value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
              >
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Material</label>
              <select
                className="form-input form-select"
                value={form.material}
                onChange={e => setForm(f => ({ ...f, material: e.target.value }))}
              >
                {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-form-row">
            <div className="form-group">
              <label className="form-label">Color Profile</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="form-input"
                  value={form.colorName}
                  onChange={e => setForm(f => ({ ...f, colorName: e.target.value }))}
                  placeholder="Color name"
                />
                <input
                  type="color"
                  value={form.colorHex}
                  onChange={e => setForm(f => ({ ...f, colorHex: e.target.value }))}
                  style={{ width: 44, height: 44, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'none' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Version / Batch</label>
              <input
                className="form-input"
                value={form.version}
                onChange={e => setForm(f => ({ ...f, version: e.target.value }))}
                placeholder="V2.0, Lot-2024Q3"
              />
            </div>
          </div>
        </div>
      </div>



      {/* Section C: Recommended Settings */}
      <div className="detail-section">
        <div className="section-header">
          <Thermometer style={{ width: 16, height: 16 }} />
          <span>Recommended Settings</span>
        </div>
        <div className="modal-form">
          <div className="modal-form-row">
            <div className="form-group">
              <label className="form-label">Nozzle Temp Min (°C)</label>
              <input
                type="number"
                className="form-input"
                value={form.nozzleTempMin}
                onChange={e => setForm(f => ({ ...f, nozzleTempMin: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nozzle Temp Max (°C)</label>
              <input
                type="number"
                className="form-input"
                value={form.nozzleTempMax}
                onChange={e => setForm(f => ({ ...f, nozzleTempMax: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="modal-form-row">
            <div className="form-group">
              <label className="form-label">Bed Temp Min (°C)</label>
              <input
                type="number"
                className="form-input"
                value={form.bedTempMin}
                onChange={e => setForm(f => ({ ...f, bedTempMin: Number(e.target.value) }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bed Temp Max (°C)</label>
              <input
                type="number"
                className="form-input"
                value={form.bedTempMax}
                onChange={e => setForm(f => ({ ...f, bedTempMax: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Print Speed (mm/s)</label>
            <input
              type="number"
              className="form-input"
              value={form.printSpeed}
              onChange={e => setForm(f => ({ ...f, printSpeed: Number(e.target.value) }))}
              style={{ maxWidth: 200 }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Temperature tips, adhesion notes, etc."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="detail-actions">
        <button className="btn btn-primary" onClick={handleSave}>
          <Save style={{ width: 18, height: 18 }} />
          Save Changes
        </button>
        <button className="btn btn-secondary">
          <QrCode style={{ width: 18, height: 18 }} />
          Print QR Label
        </button>
      </div>
    </div>
  );
}
