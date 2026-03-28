import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Upload, Download, AlertTriangle, Cylinder, Plus, X, Trash2, Pencil } from 'lucide-react';
import { MATERIALS } from '../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings({ settings, spools, onAddSpool, onUpdateSettings, onUpdateSpool, onDeleteSpool, onResetAll, onExportData, onImportData }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Spool Form State
  const [newSpool, setNewSpool] = useState({
    brand: '',
    materialType: 'PLA',
    color: '',
    colorHex: '#3b82f6',


  });

  const handleAddSpool = async (e) => {
    e.preventDefault();
    if (editingId) {
      await onUpdateSpool(editingId, newSpool);
    } else {
      await onAddSpool(newSpool);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setNewSpool({
      brand: '',
      materialType: 'PLA',
      color: '',
      colorHex: '#3b82f6',
    });
  };

  const openAddModal = () => {
    setEditingId(null);
    setNewSpool({
      brand: '',
      materialType: 'PLA',
      color: '',
      colorHex: '#3b82f6',
    });
    setShowAddModal(true);
  };

  const openEditModal = (spool) => {
    setEditingId(spool.id);
    setNewSpool({
      brand: spool.brand,
      materialType: spool.material || spool.materialType,
      color: spool.color || spool.colorName,
      colorHex: spool.colorHex || '#3b82f6',
    });
    setShowAddModal(true);
  };

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
          <p className="page-subtitle">Configure your inventory and management preferences</p>
        </div>
      </div>

      {/* Filament Inventory List */}
      <div className="section mb-8">
        <div className="section-header flex-between">
          <div className="flex items-center gap-2">
            <Cylinder style={{ width: 16, height: 16 }} />
            <span>Filament Inventory</span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <Plus size={14} /> Add Filament
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-subtle bg-white/5">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-dim">Brand</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-dim">Type</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-dim">Color</th>

                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-dim text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {spools.map((spool, idx) => (
                  <tr key={spool.id || idx} className="border-b border-subtle hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm font-semibold">{spool.brand}</td>
                    <td className="p-4 text-sm">
                      <span className="badge badge-secondary">{spool.material || spool.materialType}</span>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border border-white/20" 
                          style={{ background: spool.colorHex || '#ccc' }}
                        />
                        {spool.color || spool.colorName}
                      </div>
                    </td>

                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-2">
                        <button 
                          className="btn-icon text-primary p-1 hover:bg-primary/10 rounded"
                          onClick={() => openEditModal(spool)}
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          className="btn-icon text-error p-1 hover:bg-error/10 rounded"
                          onClick={() => onDeleteSpool(spool.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {spools.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-dim italic text-sm">
                      Belum ada data filament yang terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Spool Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card modal-content max-w-md w-full p-6 relative overflow-hidden"
            >
              <div className="flex-between mb-6">
                <h2 className="heading-md m-0 flex items-center gap-2">
                  <Cylinder size={20} className="text-primary" />
                  {editingId ? 'Edit Filament' : 'Add New Filament'}
                </h2>
                <button className="btn-icon" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSpool} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="e.g. eSUN"
                    value={newSpool.brand}
                    onChange={e => setNewSpool({...newSpool, brand: e.target.value})}
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Material</label>
                    <select 
                      className="form-input"
                      value={newSpool.materialType}
                      onChange={e => setNewSpool({...newSpool, materialType: e.target.value})}
                    >
                      {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Color Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      placeholder="e.g. Fire Red"
                      value={newSpool.color}
                      onChange={e => setNewSpool({...newSpool, color: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                   <div className="form-group">
                    <label className="form-label">Pick Color</label>
                    <input 
                      type="color" 
                      className="form-input h-10 p-1 bg-transparent border-subtle" 
                      value={newSpool.colorHex}
                      onChange={e => setNewSpool({...newSpool, colorHex: e.target.value})}
                    />
                  </div>

                </div>

                <div className="flex-end gap-3 mt-6">
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Save Filament'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* General Preferences */}
      <div className="section mb-8">
        <div className="section-header">
          <SettingsIcon style={{ width: 16, height: 16 }} />
          <span>General Preferences</span>
        </div>

        <div className="settings-card">


          <div className="settings-row">
            <span className="settings-row-label">Weight Unit</span>
            <div className="radio-group">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="weightUnit"
                  value="gram"
                  checked={settings.weightUnit === 'gram'}
                  onChange={() => onUpdateSettings({ weightUnit: 'gram' })}
                />
                <span className="text-sm">gram</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="weightUnit"
                  value="kg"
                  checked={settings.weightUnit === 'kg'}
                  onChange={() => onUpdateSettings({ weightUnit: 'kg' })}
                />
                <span className="text-sm">kg</span>
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
