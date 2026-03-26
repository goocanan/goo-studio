import React, { useState } from 'react';
import { Settings as SettingsIcon, Palette, Database, Upload, Download, AlertTriangle } from 'lucide-react';
import { BRANDS, MATERIALS, DEFAULT_BRAND_PRESETS } from '../lib/constants';

export default function Settings({ settings, onUpdateSettings, onResetAll, onExportData, onImportData }) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const data = onExportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goo-studio-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const success = onImportData(ev.target.result);
        if (success) {
          alert('Data imported successfully!');
        } else {
          alert('Failed to import data. Check file format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">⚙️ Settings</h1>
          <p className="page-subtitle">Configure your inventory preferences</p>
        </div>
      </div>

      {/* Brand Presets */}
      <div className="section">
        <div className="section-header">
          <Palette style={{ width: 16, height: 16 }} />
          <span>Brand Presets</span>
        </div>

        <div className="settings-card">
          {Object.entries(DEFAULT_BRAND_PRESETS).map(([brand, materials]) => (
            <div key={brand} className="settings-row">
              <div>
                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{brand}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  {Object.entries(materials).map(([mat, temps]) =>
                    `${mat}: ${temps.nozzleMin}–${temps.nozzleMax}/${temps.bedMin}–${temps.bedMax}°C`
                  ).join(' · ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button className="btn-icon" title="Edit" style={{ padding: '0.4rem' }}>✏️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Display Preferences */}
      <div className="section">
        <div className="section-header">
          <SettingsIcon style={{ width: 16, height: 16 }} />
          <span>Display Preferences</span>
        </div>

        <div className="settings-card">
          <div className="settings-row">
            <span className="settings-row-label">Low Stock Threshold</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                className="form-input"
                value={settings.lowStockThreshold}
                onChange={e => onUpdateSettings({ lowStockThreshold: Number(e.target.value) })}
                style={{ width: 80, textAlign: 'center', padding: '0.5rem' }}
              />
              <span className="text-dim" style={{ fontSize: '0.85rem' }}>gram</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-row-label">Default Reel Weight</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="number"
                className="form-input"
                value={settings.defaultReelWeight}
                onChange={e => onUpdateSettings({ defaultReelWeight: Number(e.target.value) })}
                style={{ width: 80, textAlign: 'center', padding: '0.5rem' }}
              />
              <span className="text-dim" style={{ fontSize: '0.85rem' }}>gram</span>
            </div>
          </div>

          <div className="settings-row">
            <span className="settings-row-label">Weight Unit</span>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="weightUnit"
                  value="gram"
                  checked={settings.weightUnit === 'gram'}
                  onChange={() => onUpdateSettings({ weightUnit: 'gram' })}
                />
                gram
              </label>
              <label>
                <input
                  type="radio"
                  name="weightUnit"
                  value="kg"
                  checked={settings.weightUnit === 'kg'}
                  onChange={() => onUpdateSettings({ weightUnit: 'kg' })}
                />
                kg
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="section">
        <div className="section-header">
          <Database style={{ width: 16, height: 16 }} />
          <span>Data Management</span>
        </div>

        <div className="settings-card">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleExport}>
              <Download style={{ width: 16, height: 16 }} />
              Export JSON
            </button>
            <button className="btn btn-secondary" onClick={handleImport}>
              <Upload style={{ width: 16, height: 16 }} />
              Import Data
            </button>
            {confirmReset ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-rose)' }}>Yakin reset semua data?</span>
                <button className="btn btn-danger" onClick={() => { onResetAll(); setConfirmReset(false); }}>
                  Reset
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Batal</button>
              </div>
            ) : (
              <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
                <AlertTriangle style={{ width: 16, height: 16 }} />
                Reset All
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
