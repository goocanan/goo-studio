import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { BRANDS, MATERIALS, DEFAULT_INITIAL_WEIGHT } from '../../lib/constants';
import { generateSpoolId } from '../../lib/utils';

export default function SpoolFormModal({ spools, onSave, onClose }) {
  const [form, setForm] = useState({
    brand: BRANDS[0],
    material: MATERIALS[0],
    colorName: '',
    colorHex: '#8b5cf6',
    version: 'V1',
    initialWeight: DEFAULT_INITIAL_WEIGHT,

    nozzleTempMin: 200,
    nozzleTempMax: 220,
    bedTempMin: 55,
    bedTempMax: 65,
    printSpeed: 60,
    notes: '',
  });

  const generatedId = generateSpoolId(form.material, spools);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.colorName.trim()) return;
    onSave({
      ...form,
      id: generatedId,
      remainingWeight: form.initialWeight,
      initialWeight: Number(form.initialWeight),

      nozzleTempMin: Number(form.nozzleTempMin),
      nozzleTempMax: Number(form.nozzleTempMax),
      bedTempMin: Number(form.bedTempMin),
      bedTempMax: Number(form.bedTempMax),
      printSpeed: Number(form.printSpeed),
    });
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Spool</h2>
          <button className="btn-icon" onClick={onClose}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Spool ID (auto)</label>
            <input className="form-input" value={generatedId} disabled style={{ opacity: 0.6 }} />
          </div>

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
              <label className="form-label">Color Profile *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  className="form-input"
                  value={form.colorName}
                  onChange={e => setForm(f => ({ ...f, colorName: e.target.value }))}
                  placeholder="Fire Red, Cold White..."
                  required
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
                placeholder="V2.0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Weight (g)</label>
            <input
              type="number"
              className="form-input"
              value={form.initialWeight}
              onChange={e => setForm(f => ({ ...f, initialWeight: e.target.value }))}
            />
          </div>

          <div className="modal-form-row">
            <div className="form-group">
              <label className="form-label">Nozzle Temp (°C)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  className="form-input"
                  value={form.nozzleTempMin}
                  onChange={e => setForm(f => ({ ...f, nozzleTempMin: e.target.value }))}
                  placeholder="Min"
                />
                <input
                  type="number"
                  className="form-input"
                  value={form.nozzleTempMax}
                  onChange={e => setForm(f => ({ ...f, nozzleTempMax: e.target.value }))}
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bed Temp (°C)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  className="form-input"
                  value={form.bedTempMin}
                  onChange={e => setForm(f => ({ ...f, bedTempMin: e.target.value }))}
                  placeholder="Min"
                />
                <input
                  type="number"
                  className="form-input"
                  value={form.bedTempMax}
                  onChange={e => setForm(f => ({ ...f, bedTempMax: e.target.value }))}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="form-input"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Print tips, adhesion notes..."
              rows={2}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Save style={{ width: 16, height: 16 }} />
              Save Spool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
