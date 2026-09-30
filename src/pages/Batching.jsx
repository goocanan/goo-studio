import React, { useState } from 'react';
import { Zap, Package, CheckCircle, AlertCircle, ChevronRight, Layers, Printer, Box, Check, XCircle, Trash2, Ruler, Grid3x3, RotateCcw } from 'lucide-react';
import { formatWeight, packBed, partFootprint } from '../lib/utils';
import { BED_PLATES } from '../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

export default function Batching({ 
  suggestedGroups, batches, spools, createBatch, completeBatch, deleteBatch, onNavigate 
}) {
  const [selectedSpools, setSelectedSpools] = useState({});
  const [activeTab, setActiveTab] = useState('suggested');
  // State for selected parts: { [partId]: boolean }
  const [selectedParts, setSelectedParts] = useState({});
  // State for selected bed plate per group: { [groupKey]: bedId }
  const [selectedBeds, setSelectedBeds] = useState({});

  const bedById = (id) => BED_PLATES.find(b => b.id === id);

  const isPartSelected = (partId) => selectedParts[partId] !== false;

  const getSelectedIds = (group) => group.parts.filter(p => isPartSelected(p.id)).map(p => p.id);

  // Pick a bed plate -> auto-select everything that fits the plate (greedy by area).
  const handleBedChange = (group, key, bedId) => {
    setSelectedBeds(prev => ({ ...prev, [key]: bedId }));
    if (!bedId) return;
    const bed = bedById(bedId);
    if (!bed) return;

    const res = packBed(group.parts, bed.width, bed.depth, {});
    // Parts with a known footprint that fit + parts whose size is unknown (keep them
    // selected so the user can decide — we can't judge fit for them).
    const auto = new Set([...res.selectedIds, ...res.unknownIds]);
    const updates = {};
    group.parts.forEach(p => { updates[p.id] = auto.has(p.id); });
    setSelectedParts(prev => ({ ...prev, ...updates }));
  };

  const autoFit = (group, key) => handleBedChange(group, key, selectedBeds[key]);

  // Toggle one part. When a bed plate is chosen, adding a part is only allowed
  // while it still fits the plate — otherwise the freed space must be used first.
  const togglePart = (group, key, part) => {
    const bedId = selectedBeds[key];
    if (isPartSelected(part.id)) {
      setSelectedParts(prev => ({ ...prev, [part.id]: false }));
      return;
    }
    if (bedId) {
      const bed = bedById(bedId);
      const current = getSelectedIds(group);
      const trial = [...current, part.id];
      const res = packBed(group.parts, bed.width, bed.depth, { priorityIds: trial });
      // Block the add when the new part does not fit, or when it would push an
      // already-selected part off the plate. The user must free space first.
      if (res.overflowIds.length > 0) {
        alert(`Tidak bisa menambah "${part.name}" — bed ${bed.name} (${bed.width}×${bed.depth}mm) tidak cukup.\nUnselect komponen lain dulu untuk memberi ruang.`);
        return;
      }
    }
    setSelectedParts(prev => ({ ...prev, [part.id]: true }));
  };

  const toggleGroupSelection = (group, selectAll = true) => {
    const key = `${group.material}-${group.color}`;
    if (selectAll && selectedBeds[key]) {
      // With a bed chosen, "All" fills the plate with only what fits.
      autoFit(group, key);
      return;
    }
    const updates = {};
    group.parts.forEach(p => {
      updates[p.id] = selectAll;
    });
    setSelectedParts(prev => ({ ...prev, ...updates }));
  };

  const handleCreateBatch = (group, key) => {
    const spoolId = selectedSpools[key];
    if (!spoolId) {
      alert('Pilih spool terlebih dahulu!');
      return;
    }

    // Filter parts based on selection. If not explicitly in selectedParts, assume selected.
    const bed = bedById(selectedBeds[key]);
    let selectedGroupParts = group.parts.filter(p => isPartSelected(p.id));

    if (selectedGroupParts.length === 0) {
      alert('Pilih setidaknya satu komponen untuk dibuat batch!');
      return;
    }

    // Safety net: with a bed chosen, never send parts that don't fit the plate.
    if (bed) {
      const fit = packBed(group.parts, bed.width, bed.depth, {
        priorityIds: selectedGroupParts.map(p => p.id),
      });
      const drop = new Set(fit.overflowIds);
      if (drop.size > 0) {
        selectedGroupParts = selectedGroupParts.filter(p => !drop.has(p.id));
      }
    }

    if (selectedGroupParts.length === 0) {
      alert('Tidak ada komponen yang muat di bed ini. Pilih bed lebih besar atau kurangi komponen.');
      return;
    }

    createBatch(
      { ...group, parts: selectedGroupParts },
      spoolId,
      bed ? { bedPlate: bed.name, bedWidth: bed.width, bedDepth: bed.depth } : {}
    );
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
                const groupSelectedParts = group.parts.filter(p => isPartSelected(p.id));
                const bed = bedById(selectedBeds[key]);

                // Live packing result for the current selection on the chosen bed.
                const selectedIds = groupSelectedParts.map(p => p.id);
                const selectedSet = new Set(selectedIds);
                const pack = bed
                  ? packBed(group.parts, bed.width, bed.depth, { priorityIds: selectedIds })
                  : null;
                const usedArea = pack
                  ? pack.placements.filter(pl => selectedSet.has(pl.partId)).reduce((s, pl) => s + pl.w * pl.d, 0)
                  : 0;
                const fillPercent = pack && pack.totalArea > 0 ? Math.round((usedArea / pack.totalArea) * 100) : 0;
                const overflowSet = new Set(pack?.overflowIds || []);
                const unknownCount = group.parts.filter(p => !partFootprint(p).known).length;
                
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

                    {/* Bed Plate Selector */}
                    <div className="batching-bed-select">
                      <div className="batching-bed-label">
                        <Grid3x3 size={13} />
                        <span>Bed Plate</span>
                      </div>
                      <div className="batching-bed-row">
                        <select
                          className="form-input"
                          value={selectedBeds[key] || ''}
                          onChange={(e) => handleBedChange(group, key, e.target.value)}
                        >
                          <option value="">-- Pilih ukuran bed --</option>
                          {BED_PLATES.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} — {b.width}×{b.depth}mm
                            </option>
                          ))}
                        </select>
                        {bed && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm batching-refit-btn"
                            title="Auto-fit ulang komponen yang muat"
                            onClick={() => autoFit(group, key)}
                          >
                            <RotateCcw size={13} /> Auto-fit
                          </button>
                        )}
                      </div>

                      {bed && (
                        <div className="batching-bed-fill">
                          <div className="batching-fill-track">
                            <div
                              className="batching-fill-bar"
                              style={{ width: `${Math.min(100, fillPercent)}%` }}
                            />
                          </div>
                          <div className="batching-fill-meta">
                            <span><strong>{fillPercent}%</strong> terisi</span>
                            <span>{groupSelectedParts.length}/{group.parts.length} komponen dipilih</span>
                          </div>
                          {overflowSet.size > 0 && (
                            <div className="batching-warning">
                              <AlertCircle size={12} /> {overflowSet.size} komponen terpilih tidak muat di bed ini.
                            </div>
                          )}
                          {unknownCount > 0 && (
                            <div className="batching-hint">
                              <Ruler size={12} /> {unknownCount} komponen belum punya ukuran (tidak bisa dihitung otomatis).
                            </div>
                          )}
                        </div>
                      )}
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
                        const isSelected = isPartSelected(part.id);
                        const fp = partFootprint(part);
                        const isOver = isSelected && overflowSet.has(part.id);
                        return (
                          <div 
                            key={part.id} 
                            className={`batching-part-row clickable ${!isSelected ? 'opacity-50' : ''} ${isOver ? 'over' : ''}`}
                            onClick={() => togglePart(group, key, part)}
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
                            <span className={`batching-part-dims ${fp.known ? '' : 'unknown'}`}>
                              {fp.known ? `${Math.round(fp.w)}×${Math.round(fp.d)}mm` : '— mm'}
                            </span>
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
              activeBatches.map((batch, index) => {
                const spool = spools.find(s => s.id === batch.spoolId);
                return (
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
                    {batch.bedPlate && (
                      <span className="batching-meta-chip">
                        <Grid3x3 size={12} /> {batch.bedPlate}
                        {batch.bedWidth > 0 ? ` (${batch.bedWidth}×${batch.bedDepth}mm)` : ''}
                      </span>
                    )}
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
                      {spool ? (
                        <span className="batching-spool-id">
                          {spool.colorName} • {spool.brand} {spool.material} ({formatWeight(spool.remainingWeight)})
                        </span>
                      ) : (
                        <span className="batching-spool-id">{batch.spoolId?.substring(0, 10)}...</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => {
                          if (window.confirm('Batalkan batch ini? Komponen akan kembali ke status pending.')) {
                            deleteBatch(batch.id);
                          }
                        }}
                        title="Batalkan batch"
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => completeBatch(batch.id)}
                      >
                        <CheckCircle size={14} /> Mark Done
                      </button>
                    </div>
                  </div>
                </motion.div>
                );
              })
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
              completedBatches.map((batch, index) => {
                const spool = spools.find(s => s.id === batch.spoolId);
                return (
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
                      {batch.bedPlate && <span className="batching-completed-parts">{batch.bedPlate}</span>}
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
                  <div className="batching-completed-meta">
                    <span>Spool: {spool ? `${spool.colorName} • ${spool.brand} ${spool.material}` : (batch.spoolId?.substring(0, 10) + '...' || '-')}</span>
                  </div>
                </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
