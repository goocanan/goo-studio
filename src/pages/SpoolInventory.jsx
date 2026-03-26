import React, { useState, useMemo } from 'react';
import { Search, LayoutGrid, List, Plus, Thermometer } from 'lucide-react';
import { formatWeight, weightPercent, getWeightColor, getStatusBadgeClass, getStatusLabel } from '../lib/utils';
import { MATERIALS } from '../lib/constants';

export default function SpoolInventory({ spools, onViewDetail, onAdd }) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [materialFilter, setMaterialFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const filtered = useMemo(() => {
    return spools.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.id.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.colorName.toLowerCase().includes(q) ||
        s.material.toLowerCase().includes(q);
      const matchMaterial = !materialFilter || s.material === materialFilter;
      const matchStatus = !statusFilter ||
        (statusFilter === 'all') ||
        s.status === statusFilter;
      return matchSearch && matchMaterial && matchStatus;
    });
  }, [spools, search, materialFilter, statusFilter]);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">📦 Spool Inventory</h1>
          <p className="page-subtitle">{spools.length} spool terdaftar</p>
        </div>
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid />
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <List />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="toolbar-row">
          <div className="search-bar">
            <Search />
            <input
              type="text"
              placeholder="Search spools (ID, brand, color)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="toolbar-row">
          <div className="chip-group">
            {MATERIALS.slice(0, 5).map(m => (
              <button
                key={m}
                className={`chip ${materialFilter === m ? 'active' : ''}`}
                onClick={() => setMaterialFilter(materialFilter === m ? null : m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 0.25rem' }} />
          <div className="chip-group">
            {[
              { value: 'available', label: 'Available' },
              { value: 'low', label: 'Low Stock' },
              { value: null, label: 'All' },
            ].map(s => (
              <button
                key={s.label}
                className={`chip ${statusFilter === s.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(statusFilter === s.value ? null : s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid-spools">
          {filtered.map(spool => {
            const pct = weightPercent(spool.remainingWeight, spool.initialWeight);
            const barColor = getWeightColor(pct);
            return (
              <div
                key={spool.id}
                className="glass-card interactive spool-card"
            onClick={() => onViewDetail(spool.id)}
              >
                <div className="spool-card-header">
                  <div>
                    <div className="spool-brand">{spool.brand} {spool.material}</div>
                    <div className="spool-name">{spool.colorName}</div>
                    <div className="spool-meta">
                      <span>ID: {spool.id}</span>
                      <span>{spool.version}</span>
                    </div>
                  </div>
                  <div className="spool-color-dot" style={{ background: spool.colorHex }} />
                </div>
                <div className="spool-weight-section">
                  <div className="spool-weight-text">
                    <span className="spool-weight-value">{formatWeight(spool.remainingWeight)}</span>
                    <span className="text-muted">/ {formatWeight(spool.initialWeight)}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                </div>
                <div className="spool-footer">
                  <div className="spool-temp">
                    <Thermometer />
                    <span>{spool.nozzleTempMin}–{spool.nozzleTempMax}°C / {spool.bedTempMin}–{spool.bedTempMax}°C</span>
                  </div>
                  <span className={`badge ${getStatusBadgeClass(spool.status)}`}>
                    <span className="badge-dot" />
                    {getStatusLabel(spool.status)}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <Search style={{ width: 48, height: 48 }} />
              <p>Tidak ada spool yang cocok dengan filter</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-card" style={{ overflow: 'auto', borderRadius: 'var(--radius-xl)' }}>
          <table className="spool-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Brand</th>
                <th>Material</th>
                <th>Color</th>
                <th>Ver</th>
                <th>Weight</th>
                <th>Temp</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(spool => {
                const pct = weightPercent(spool.remainingWeight, spool.initialWeight);
                const barColor = getWeightColor(pct);
                return (
                  <tr key={spool.id} onClick={() => onViewDetail(spool.id)}>
                    <td style={{ fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{spool.id}</td>
                    <td>{spool.brand}</td>
                    <td>{spool.material}</td>
                    <td>
                      <div className="color-cell">
                        <div className="spool-color-dot" style={{ background: spool.colorHex, width: 10, height: 10 }} />
                        {spool.colorName}
                      </div>
                    </td>
                    <td>{spool.version}</td>
                    <td>
                      <div className="weight-cell">
                        <span style={{ fontSize: '0.8rem' }}>{formatWeight(spool.remainingWeight)}</span>
                        <div className="progress-bar">
                          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {spool.nozzleTempMin}/{spool.bedTempMin}°C
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(spool.status)}`}>
                        <span className="badge-dot" />
                        {getStatusLabel(spool.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <p>Tidak ada spool yang cocok</p>
            </div>
          )}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={onAdd} title="Tambah Spool Baru">
        <Plus />
      </button>
    </div>
  );
}
