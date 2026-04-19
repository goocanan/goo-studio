import React, { useState, useMemo } from 'react';
import { Zap, Package, CheckCircle, AlertCircle, ChevronRight, Layers, Printer, Scale, Box, MoreHorizontal, Check, Square, XCircle, Trash2 } from 'lucide-react';
import { formatWeight } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Batching({ 
  suggestedGroups, batches, spools, createBatch, completeBatch, deleteBatch, onNavigate 
}) {
  const [selectedSpools, setSelectedSpools] = useState({});
  const [activeTab, setActiveTab] = useState('suggested');
  // State for selected parts: { [partId]: boolean }
  const [selectedParts, setSelectedParts] = useState({});

  const handleCreateBatch = (group, key) => {
    const spoolId = selectedSpools[key];
    if (!spoolId) {
      alert('Pilih spool terlebih dahulu!');
      return;
    }

    // Filter parts based on selection. If not explicitly in selectedParts, assume selected.
    const selectedGroupParts = group.parts.filter(p => selectedParts[p.id] !== false);

    if (selectedGroupParts.length === 0) {
      alert('Pilih setidaknya satu komponen untuk dibuat batch!');
      return;
    }

    createBatch({ ...group, parts: selectedGroupParts }, spoolId);
  };

  const togglePart = (partId) => {
    setSelectedParts(prev => ({
      ...prev,
      [partId]: prev[partId] === false ? true : false
    }));
  };

  const toggleGroupSelection = (group, selectAll = true) => {
    const updates = {};
    group.parts.forEach(p => {
      updates[p.id] = selectAll;
    });
    setSelectedParts(prev => ({ ...prev, ...updates }));
  };

  const handleDeleteCompletedBatch = (batchId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus dari riwayat?")) {
      deleteBatch(batchId);
    }
  };

  const activeBatches = batches.filter(b => b.status !== 'completed');
  const completedBatches = batches.filter(b => b.status === 'completed');

  return (
    <div className="animate-in batching-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">⚡ Smart Batching</h1>
          <p className="page-subtitle">Otomatisasi pengelompokan komponen berdasarkan warna & material</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="batching-stats">
        <div className="batching-stat-card">
          <div className="batching-stat-icon" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
            <Layers size={20} />
          </div>
          <div className="batching-stat-info">
            <span className="batching-stat-value">{suggestedGroups.length}</span>
            <span className="batching-stat-label">Suggested Groups</span>
          </div>
        </div>
        <div className="batching-stat-card">
          <div className="batching-stat-icon" style={{ background: 'var(--accent-cyan-soft)', color: 'var(--accent-cyan)' }}>
            <Printer size={20} />
          </div>
          <div className="batching-stat-info">
            <span className="batching-stat-value">{activeBatches.length}</span>
            <span className="batching-stat-label">Active Batches</span>
          </div>
        </div>
        <div className="batching-stat-card">
          <div className="batching-stat-icon" style={{ background: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)' }}>
            <CheckCircle size={20} />
          </div>
          <div className="batching-stat-info">
            <span className="batching-stat-value">{completedBatches.length}</span>
            <span className="batching-stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="batching-tabs">
        <button 
          className={`batching-tab ${activeTab === 'suggested' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggested')}
        >
          <Layers size={16} />
          Suggested Groups
          {suggestedGroups.length > 0 && <span className="batching-tab-count">{suggestedGroups.length}</span>}
        </button>
        <button 
          className={`batching-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Printer size={16} />
          Active Batches
          {activeBatches.length > 0 && <span className="batching-tab-count">{activeBatches.length}</span>}
        </button>
        <button 
          className={`batching-tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <CheckCircle size={16} />
          Completed
        </button>
      </div>

      {/* Tab Content */}
      <div className="batching-content">
        {/* Suggested Groups */}
        {activeTab === 'suggested' && (
          <div className="batching-groups-grid">
            {suggestedGroups.length === 0 ? (
              <div className="batching-empty">
                <Package size={48} />
                <h3>No Groups Available</h3>
                <p>Tambahkan komponen dengan status "Pending" untuk melihat saran pengelompokan otomatis.</p>
                <button className="btn btn-secondary" onClick={() => onNavigate('projects')}>
                  <ChevronRight size={16} /> Lihat Projects
                </button>
              </div>
            ) : (
              suggestedGroups.map((group) => {
                const key = `${group.material}-${group.color}`;
                const groupSelectedParts = group.parts.filter(p => selectedParts[p.id] !== false);
                
                const sortedSpools = [...spools].sort((a, b) => {
                  const aMatch = a.material === group.material && a.colorName === group.color;
                  const bMatch = b.material === group.material && b.colorName === group.color;
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                  return 0;
                });

                const selectedSpool = spools.find(s => s.id === selectedSpools[key]);
                const materialMismatch = selectedSpool && selectedSpool.material !== group.material;

                return (
                  <motion.div 
                    key={key} 
                    className="batching-group-card glass-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {/* Card Header */}
                    <div className="batching-group-header">
                      <div className="batching-group-tag">
                        <span className="batching-group-dot" />
                        <span className="batching-group-label">{group.material}</span>
                        <span className="batching-group-color">{group.color}</span>
                      </div>
                    </div>

                    {/* Parts List */}
                    <div className="batching-parts-list">
                      <div className="batching-parts-header flex-between">
                        <span>{group.parts.length} Components ({groupSelectedParts.length} selected)</span>
                        <div className="flex gap-1.5">
                          <button 
                            type="button" 
                            className="batching-selection-btn all"
                            onClick={(e) => { e.stopPropagation(); toggleGroupSelection(group, true); }}
                          >
                            <CheckCircle size={10} /> All
                          </button>
                          <button 
                            type="button" 
                            className="batching-selection-btn none"
                            onClick={(e) => { e.stopPropagation(); toggleGroupSelection(group, false); }}
                          >
                            <XCircle size={10} /> None
                          </button>
                        </div>
                      </div>
                      {group.parts.map(part => {
                        const isSelected = selectedParts[part.id] !== false;
                        return (
                          <div 
                            key={part.id} 
                            className={`batching-part-row clickable ${!isSelected ? 'opacity-50' : ''}`}
                            onClick={() => togglePart(part.id)}
                          >
                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                              <div className={`batching-checkbox ${isSelected ? 'selected' : ''}`}>
                                {isSelected && <Check size={14} strokeWidth={3} />}
                              </div>
                              <div className="batching-part-info truncate">
                                <span className="batching-part-project">{part.projectName}</span>
                                <ChevronRight size={10} />
                                <span className="batching-part-name truncate">{part.name}</span>
                              </div>
                            </div>
                            <span className="batching-part-qty">×{part.quantity || 1}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Spool Selector */}
                    <div className="batching-spool-select">
                      <label>Assign Spool</label>
                      <select 
                        className="form-input"
                        value={selectedSpools[key] || ''}
                        onChange={(e) => setSelectedSpools({...selectedSpools, [key]: e.target.value})}
                      >
                        <option value="">-- Pilih Spool --</option>
                        {sortedSpools.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.colorName} - {s.brand} {s.material}
                          </option>
                        ))}
                      </select>

                      {materialMismatch && (
                        <div className="batching-warning">
                          <AlertCircle size={12} /> Material tidak cocok!
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <button 
                      className="btn btn-primary batching-action-btn"
                      disabled={!selectedSpools[key] || sortedSpools.length === 0 || groupSelectedParts.length === 0}
                      onClick={() => handleCreateBatch(group, key)}
                    >
                      <Zap size={16} /> Generate Print Batch ({groupSelectedParts.length})
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Active Batches */}
        {activeTab === 'active' && (
          <div className="batching-active-grid">
            {activeBatches.length === 0 ? (
              <div className="batching-empty">
                <Printer size={48} />
                <h3>No Active Batches</h3>
                <p>Generate print batch dari tab Suggested Groups untuk memulai proses cetak.</p>
              </div>
            ) : (
              activeBatches.map((batch, index) => (
                <motion.div 
                  key={batch.id} 
                  className="batching-active-card glass-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="batching-active-header">
                    <div className="batching-active-id">
                      <Printer size={14} />
                      <span>{batch.id.substring(0, 12)}...</span>
                    </div>
                    <span className={`batching-status-tag status-${batch.status}`}>
                      {batch.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="batching-active-meta">
                    <span className="batching-meta-chip">
                      <Box size={12} /> {batch.material}
                    </span>
                    <span className="batching-meta-chip">
                      {batch.color}
                    </span>
                    <span className="batching-meta-chip">
                      <Package size={12} /> {batch.parts?.length || 0} parts
                    </span>
                  </div>
                  
                  <div className="batching-active-parts">
                    {(batch.parts || []).map((pt, i) => (
                      <div key={i} className="batching-active-part-row">
                        <ChevronRight size={10} />
                        <span><strong>{pt.projectName}</strong>: {pt.name}</span>
                        <span className="batching-active-part-qty">×{pt.quantity || 1}</span>
                      </div>
                    ))}
                  </div>

                  <div className="batching-active-footer">
                    <div className="batching-spool-info">
                      <span>Spool:</span>
                      <span className="batching-spool-id">{batch.spoolId?.substring(0, 10)}...</span>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => completeBatch(batch.id)}
                    >
                      <CheckCircle size={14} /> Mark Done
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Completed Batches */}
        {activeTab === 'completed' && (
          <div className="batching-completed-grid">
            {completedBatches.length === 0 ? (
              <div className="batching-empty">
                <CheckCircle size={48} />
                <h3>No Completed Batches Yet</h3>
                <p>Batch yang sudah selesai akan ditampilkan di sini sebagai histori.</p>
              </div>
            ) : (
              completedBatches.map((batch, index) => (
                <motion.div 
                  key={batch.id} 
                  className="batching-completed-card glass-card"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="batching-completed-header flex-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} style={{ color: 'var(--accent-emerald)' }} />
                      <span>{batch.material} {batch.color}</span>
                      <span className="batching-completed-parts">{batch.parts?.length || 0} parts</span>
                    </div>
                    <button 
                      className="btn btn-ghost btn-sm text-error" 
                      onClick={() => handleDeleteCompletedBatch(batch.id)}
                      title="Hapus riwayat batch"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
