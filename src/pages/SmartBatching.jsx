import React, { useState, useMemo } from 'react';
import { GripVertical, Zap, CheckCircle, Search as SearchIcon, AlertTriangle } from 'lucide-react';
import { formatWeight, weightPercent, getWeightColor } from '../lib/utils';

const SAMPLE_PROJECTS = [
  { id: 'p1', name: 'Gantungan Kunci Custom', material: 'PLA+', color: 'Black', brand: 'eSUN', version: 'V2', weight: 120 },
  { id: 'p2', name: 'Phone Stand V2', material: 'PLA+', color: 'Black', brand: 'eSUN', version: 'V2', weight: 250 },
  { id: 'p3', name: 'Pot Kecil Dekoratif', material: 'PETG', color: 'Clear', brand: 'PolyMaker', version: 'V3', weight: 180 },
  { id: 'p4', name: 'Cable Organizer', material: 'PLA+', color: 'Black', brand: 'eSUN', version: 'V2', weight: 80 },
];

export default function SmartBatching({ spools }) {
  const [projects] = useState(SAMPLE_PROJECTS);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [pickList, setPickList] = useState(null);

  const toggleProject = (id) => {
    setSelectedProjects(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const generatePickList = () => {
    const selected = projects.filter(p => selectedProjects.includes(p.id));

    // Group by brand + material + color + version
    const groups = {};
    selected.forEach(p => {
      const key = `${p.brand}|${p.material}|${p.color}|${p.version}`;
      if (!groups[key]) {
        groups[key] = { brand: p.brand, material: p.material, color: p.color, version: p.version, totalWeight: 0, projects: [] };
      }
      groups[key].totalWeight += p.weight;
      groups[key].projects.push(p.name);
    });

    // Match with inventory
    const results = Object.values(groups).map((group, idx) => {
      const matching = spools.find(s =>
        s.brand === group.brand &&
        s.material === group.material &&
        s.colorName.toLowerCase().includes(group.color.toLowerCase())
      );
      return {
        id: idx + 1,
        ...group,
        spool: matching,
        sufficient: matching ? matching.remainingWeight >= group.totalWeight : false,
      };
    });

    setPickList(results);
  };

  const totalWeight = projects
    .filter(p => selectedProjects.includes(p.id))
    .reduce((sum, p) => sum + p.weight, 0);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">🏭 Smart Batching</h1>
          <p className="page-subtitle">Group projects by material for efficient printing</p>
        </div>
      </div>

      <div className="batching-layout">
        {/* Left Panel: Project Queue */}
        <div className="batching-panel">
          <div className="batching-panel-title">
            <span>📋</span> Project Queue
          </div>
          {projects.map(project => (
            <div
              key={project.id}
              className={`project-item ${selectedProjects.includes(project.id) ? 'selected' : ''}`}
              onClick={() => toggleProject(project.id)}
              style={selectedProjects.includes(project.id) ? { borderColor: 'rgba(139,92,246,0.3)', background: 'var(--accent-primary-soft)' } : {}}
            >
              <input
                type="checkbox"
                checked={selectedProjects.includes(project.id)}
                onChange={() => toggleProject(project.id)}
                style={{ accentColor: 'var(--accent-primary)' }}
              />
              <GripVertical style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
              <div className="project-item-info">
                <div className="project-item-name">{project.name}</div>
                <div className="project-item-meta">
                  {project.brand} {project.material} {project.color} · ~{project.weight}g
                </div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-dim" style={{ fontSize: '0.85rem' }}>
              {selectedProjects.length} proyek · ~{totalWeight}g
            </span>
            <button
              className="btn btn-primary"
              disabled={selectedProjects.length === 0}
              onClick={generatePickList}
              style={selectedProjects.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <Zap style={{ width: 16, height: 16 }} />
              Generate Pick-List
            </button>
          </div>
        </div>

        {/* Right Panel: Pick-List */}
        <div className="batching-panel">
          <div className="batching-panel-title">
            <span>🎯</span> Pick-List
          </div>

          {!pickList && (
            <div className="empty-state">
              <Zap style={{ width: 40, height: 40 }} />
              <p>Pilih proyek dan klik "Generate Pick-List"</p>
            </div>
          )}

          {pickList && pickList.map(item => {
            const pct = item.spool ? weightPercent(item.spool.remainingWeight, item.spool.initialWeight) : 0;
            return (
              <div key={item.id} className="picklist-card">
                <div className="picklist-label">Grup Cetak {String(item.id).padStart(2, '0')}</div>
                <div className="picklist-material">{item.brand} {item.material} {item.color} {item.version}</div>
                {item.spool ? (
                  <>
                    <div className="picklist-spool">Spool: {item.spool.id}</div>
                    <div className="picklist-weight-row">
                      <span>Required: <strong>{formatWeight(item.totalWeight)}</strong></span>
                      <span>Available: <strong>{formatWeight(item.spool.remainingWeight)}</strong></span>
                      {item.sufficient ? (
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>✅ CUKUP</span>
                      ) : (
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>⚠️ PAS-PASAN</span>
                      )}
                    </div>
                    <div className="progress-bar" style={{ marginBottom: '1rem' }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: getWeightColor(pct) }} />
                    </div>
                    <div className="picklist-actions">
                      <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}>
                        <SearchIcon style={{ width: 14, height: 14 }} /> Scan QR
                      </button>
                      <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}>
                        <CheckCircle style={{ width: 14, height: 14 }} /> Confirm
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="alert-bar alert-bar-warning" style={{ marginTop: '0.5rem' }}>
                    <AlertTriangle style={{ width: 18, height: 18 }} />
                    <span style={{ fontSize: '0.85rem' }}>Spool tidak ditemukan di inventory</span>
                  </div>
                )}
              </div>
            );
          })}

          {pickList && pickList.length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
              Proyek dikelompokkan berdasarkan Brand + Material + Color + Version
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
