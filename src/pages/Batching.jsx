import React, { useState } from 'react';
import { Zap, Package, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { formatWeight } from '../lib/utils';

export default function Batching({ 
  suggestedGroups, batches, spools, createBatch, completeBatch, onNavigate 
}) {
  const [selectedSpools, setSelectedSpools] = useState({});

  const handleCreateBatch = (group, key) => {
    const spoolId = selectedSpools[key];
    if (!spoolId) {
      alert('Pilih spool terlebih dahulu!');
      return;
    }
    createBatch(group, spoolId);
  };

  const activeBatches = batches.filter(b => b.status !== 'completed');
  const completedBatches = batches.filter(b => b.status === 'completed');

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">⚡ Smart Batching</h1>
          <p className="page-subtitle">Otomatisasi pengelompokan komponen berdasarkan warna & material</p>
        </div>
      </div>

      <div className="batching-grid">
        <section className="batch-section">
          <h2 className="heading-lg mb-4">Suggested Groups</h2>
          {suggestedGroups.length === 0 ? (
            <div className="glass-card empty-mini">
              <Package size={32} className="text-dim mb-2" />
              <p>Tidak ada komponen "Pending" untuk di-batch.</p>
            </div>
          ) : (
            <div className="batch-groups-grid">
              {suggestedGroups.map((group) => {
                const key = `${group.material}-${group.color}`;
                const sortedSpools = [...spools].sort((a, b) => {
                  const aMatch = a.material === group.material && a.colorName === group.color;
                  const bMatch = b.material === group.material && b.colorName === group.color;
                  if (aMatch && !bMatch) return -1;
                  if (!aMatch && bMatch) return 1;
                  const aMatMatch = a.material === group.material;
                  const bMatMatch = b.material === group.material;
                  if (aMatMatch && !bMatMatch) return -1;
                  if (!aMatMatch && bMatMatch) return 1;
                  return 0;
                });

                return (
                  <div key={key} className="glass-card batch-group-card">
                    <div className="batch-group-header">
                      <div className="batch-group-tag">
                        <span className="dot" style={{ background: 'var(--accent-primary)' }}></span>
                        {group.material} {group.color}
                      </div>
                      <span className="text-bold">{formatWeight(group.totalWeight)}</span>
                    </div>

                    <div className="batch-parts-list">
                      {group.parts.map(part => (
                        <div key={part.id} className="batch-part-item">
                          <span>{part.projectName} <ChevronRight size={12} className="inline" /> {part.name}</span>
                          <span className="text-dim">{part.weight}g x{part.quantity || 1}</span>
                        </div>
                      ))}
                    </div>

                    <div className="batch-spool-selector">
                      <label className="text-xs text-dim">Pilih Spool Tersedia:</label>
                      <select 
                        className="form-input"
                        value={selectedSpools[key] || ''}
                        onChange={(e) => setSelectedSpools({...selectedSpools, [key]: e.target.value})}
                      >
                        <option value="">-- Pilih Spool --</option>
                        {sortedSpools.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.colorName} - {s.brand} {s.material} ({formatWeight(s.remainingWeight)})
                          </option>
                        ))}
                      </select>
                      {selectedSpools[key] && spools.find(s => s.id === selectedSpools[key])?.material !== group.material && (
                        <p className="text-error text-xs mt-1">
                          <AlertCircle size={12} className="inline" /> Material tidak cocok!
                        </p>
                      )}
                      {selectedSpools[key] && spools.find(s => s.id === selectedSpools[key])?.remainingWeight < group.totalWeight && (
                        <p className="text-error text-xs mt-1">
                          <AlertCircle size={12} className="inline" /> Stok tidak mencukupi!
                        </p>
                      )}
                    </div>

                    <button 
                      className="btn btn-primary btn-full mt-4"
                      disabled={!selectedSpools[key] || sortedSpools.length === 0}
                      onClick={() => handleCreateBatch(group, key)}
                    >
                      <Zap size={16} /> Generate Print Batch
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="batch-section mt-8">
          <h2 className="heading-lg mb-4">Active Batches</h2>
          {activeBatches.length === 0 ? (
            <p className="text-dim italic">Belum ada proses cetak aktif.</p>
          ) : (
            <div className="batch-list-horizontal">
              {activeBatches.map(batch => (
                <div key={batch.id} className="glass-card active-batch-card">
                  <div className="flex-between mb-2">
                    <span className="text-bold">{batch.id}</span>
                    <span className="tag tag-primary">{batch.status.toUpperCase()}</span>
                  </div>
                  <div className="text-sm text-dim mb-3">
                    {batch.material} {batch.color} | {batch.parts.length} parts
                  </div>
                  
                  <div className="batch-parts-mini-list mb-4">
                    {batch.parts.map((pt, i) => (
                      <div key={i} className="text-xxs text-dim flex items-center gap-1 mb-1">
                        <ChevronRight size={10} className="text-primary" />
                        <span className="truncate"><strong>{pt.projectName}</strong>: {pt.name} (x{pt.quantity || 1})</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex-between align-end">
                    <div className="text-xs">
                      Spool: <span className="text-primary">{batch.spoolId}</span>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => completeBatch(batch.id)}
                    >
                      <CheckCircle size={14} /> Selesai
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
