import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Package, Info, Zap, Droplet, Palette, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MATERIALS } from '../lib/constants';
import { optimizeImage, normalizeImageUrl } from '../lib/utils';
import { groupPartsByColor, detectColorFromName, matchSpoolForColor, COLOR_DEFS_MAP } from '../lib/colors';
import { useSpools } from '../hooks/useSpools';
import { analyzeSTLFile } from '../lib/stl';

export default function AddProject({ onAdd, onBack, initialData, fileManager, onLaunchToPricing }) {
  const { spools } = useSpools();
  const [name, setName] = useState(initialData?.name || '');
  const [image, setImage] = useState(initialData?.thumbnail || null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrlError, setImageUrlError] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('medium');
  const [parts, setParts] = useState(initialData?.parts?.map(p => ({
    id: Math.random(),
    name: p.name,
    path: p.path,
    material: p.material || MATERIALS[0],
    color: p.color || '',
    weight: p.weight || 0,
    hours: p.printDurationMinutes ? Math.floor(p.printDurationMinutes / 60) : 0,
    minutes: p.printDurationMinutes ? p.printDurationMinutes % 60 : 0,
    quantity: p.quantity || 1
  })) || []);

  const handleAddPart = () => {
    setParts([...parts, {
      id: Date.now(),
      name: '',
      material: MATERIALS[0],
      color: '',
      weight: 0,
      hours: 0,
      minutes: 0,
      quantity: 1
    }]);
  };

  // --- Color grouping -------------------------------------------------------
  // Read the color from each part name, group parts that share a color, and let
  // one filament be chosen per color group instead of per part.
  const [colorGroupSpools, setColorGroupSpools] = useState({});

  const colorGroups = useMemo(() => groupPartsByColor(parts), [parts]);

  // Only groups where the parts already carry a detected color are auto-assignable.
  const assignableGroups = useMemo(
    () => colorGroups.filter((g) => g.key !== 'unknown'),
    [colorGroups]
  );

  const handleGroupSpoolSelect = (groupKey, spool) => {
    setColorGroupSpools((prev) => ({ ...prev, [groupKey]: spool ? spool.id : '' }));
    if (!spool) return;
    // Apply the chosen filament to every part in this color group at once.
    const group = colorGroups.find((g) => g.key === groupKey);
    if (!group) return;
    const ids = new Set(group.partIds);
    setParts((prev) =>
      prev.map((p) =>
        ids.has(p.id) ? { ...p, material: spool.material, color: spool.colorName } : p
      )
    );
  };

  const handleAutoAssignAll = () => {
    const nextSel = { ...colorGroupSpools };
    setParts((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      const updated = new Map();
      colorGroups.forEach((group) => {
        if (group.key === 'unknown') return;
        // Prefer the material most common among this group's parts.
        const matCount = {};
        group.partIds.forEach((id) => {
          const p = byId.get(id);
          if (p && p.material) matCount[p.material] = (matCount[p.material] || 0) + 1;
        });
        const preferred = Object.keys(matCount).sort((a, b) => matCount[b] - matCount[a])[0];
        const spool = matchSpoolForColor(group, spools, preferred);
        if (spool) {
          nextSel[group.key] = spool.id;
          group.partIds.forEach((id) => {
            const p = byId.get(id);
            if (p) updated.set(id, { ...p, material: spool.material, color: spool.colorName });
          });
        }
      });
      return prev.map((p) => updated.get(p.id) || p);
    });
    setColorGroupSpools(nextSel);
  };
  // -------------------------------------------------------------------------

  const handleRemovePart = (id) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const handlePartChange = (id, field, value) => {
    let finalValue = value;
    if (['quantity', 'weight', 'hours', 'minutes'].includes(field)) finalValue = parseInt(value) || 0;
    setParts(prev => prev.map(p => p.id === id ? { ...p, [field]: finalValue } : p));
  };

  const handleSpoolSelect = (id, spool) => {
    setParts(prev => prev.map(p => p.id === id ? { ...p, material: spool.material, color: spool.colorName } : p));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImageUrlError('');
    }
  };

  const handleImageUrlApply = () => {
    const url = normalizeImageUrl(imageUrl);
    if (!url) {
      setImageUrlError('Link tidak valid. Contoh: https://contoh.com/gambar.jpg');
      return;
    }
    setImageUrlError('');
    setImage(url);
    setImageUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalImage = image;
    
    if (image instanceof File || (typeof image === 'string' && image.length > 200000)) {
      try {
        finalImage = await optimizeImage(image);
      } catch (error) {
        console.error('Failed to optimize image in AddProject:', error);
      }
    }

    const projectData = {
      name,
      image: finalImage,
      notes,
      priority,
      status: parts.length > 0 ? 'ready' : 'idea',
      parts: parts.map(({ id, hours, minutes, ...rest }) => ({
        ...rest,
        printDurationMinutes: (hours || 0) * 60 + (minutes || 0)
      }))
    };

    const proj = await onAdd(projectData);
    
    // Launch to pricing: read STL files from disk, parse, and send to pricing calculator
    if (proj && fileManager && onLaunchToPricing) {
      const stlParts = parts.filter(p => p.path && /\.stl$/i.test(p.name));
      
      if (stlParts.length > 0 && fileManager.getFileData) {
        const { getFileData } = fileManager;
        const parsed = [];
        let unreadable = 0;
        
        for (const part of stlParts) {
          try {
            const file = await getFileData(part.path);
            if (!file) continue;
            
            const geo = await analyzeSTLFile(file);
            parsed.push({
              id: `stl-launch-${Date.now()}-${parsed.length}`,
              name: part.name,
              size: file.size,
              quantity: part.quantity || 1,
              material: part.material || MATERIALS[0],
              printHours: part.hours || 0,
              ...geo,
              error: null
            });
          } catch {
            unreadable += 1;
          }
        }
        
        if (parsed.length > 0) {
          onLaunchToPricing({
            items: parsed,
            projectName: name,
            skipped: unreadable
          });
        }
      }
    }
  };

  return (
    <div className="animate-in form-container">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn-text mb-2" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Projects
          </button>
          <h1 className="heading-xl gradient-text-hero">✨ Create New Project</h1>
        </div>
        <div className="flex-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={onBack}>Cancel</button>
          <button type="submit" form="project-form" className="btn btn-primary lg">
            <Zap size={18} /> Launch Project
          </button>
        </div>
      </div>

      <form id="project-form" onSubmit={handleSubmit}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card form-section"
        >
          <h2 className="form-section-title"><Info size={20} /> Basic Information</h2>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Project Image</label>
              <div className="image-upload-wrapper">
                {image ? (
                  <div className="image-preview-container">
                    <img 
                      src={typeof image === 'string' ? image : URL.createObjectURL(image)} 
                      className="image-preview" 
                      alt="Project Preview" 
                    />
                    <button type="button" className="image-remove-btn" onClick={() => { setImage(null); setImageUrlError(''); }}>×</button>
                  </div>
                ) : (
                  <label className="image-upload-placeholder">
                    <Plus size={24} />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </label>
                )}
                <div className="image-url-row">
                  <input
                    type="url"
                    className="form-input"
                    placeholder="atau tempel link gambar (https://...)"
                    value={imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); if (imageUrlError) setImageUrlError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleImageUrlApply(); } }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleImageUrlApply}
                    disabled={!imageUrl.trim()}
                  >
                    Pakai
                  </button>
                </div>
                {imageUrlError && <p className="image-url-error">{imageUrlError}</p>}
              </div>
            </div>
            <div className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Voron 2.4 Build" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  className="form-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
          <div className="form-group mt-4">
            <label className="form-label">Project Notes</label>
            <textarea 
              className="form-input" 
              placeholder="Optional background info..."
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card form-section"
        >
          <div className="flex-between mb-4">
            <h2 className="form-section-title mb-0"><Package size={20} /> Initial Parts</h2>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddPart}>
              <Plus size={14} /> Add Part
            </button>
          </div>

          {assignableGroups.length > 0 && (
            <div className="color-groups-panel">
              <div className="color-groups-head">
                <div>
                  <div className="color-groups-title"><Palette size={16} /> Filament per warna</div>
                  <p className="color-groups-hint">
                    Warna dibaca otomatis dari nama part. Pilih satu filament untuk tiap warna —
                    semua part dengan warna yang sama akan langsung terisi.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleAutoAssignAll}
                  title="Pilih otomatis filament dari inventory untuk semua warna"
                >
                  <Wand2 size={14} /> Auto-pilih semua
                </button>
              </div>
              <div className="color-groups-list">
                {assignableGroups.map((group) => {
                  const selectedId = colorGroupSpools[group.key]
                    || spools.find(s => group.partIds.some(id => {
                      const p = parts.find(x => x.id === id);
                      return p && s.material === p.material && s.colorName === p.color;
                    }))?.id
                    || '';
                  const aliases = (COLOR_DEFS_MAP[group.key]?.aliases) || [];
                  const noMatch = spools.length > 0 && !spools.some(s => {
                    const cn = (s.colorName || '').toLowerCase();
                    return aliases.some(a => cn.includes(a)) || cn.includes(group.label.toLowerCase());
                  });
                  return (
                    <div className="color-group-row" key={group.key}>
                      <span className="color-swatch" style={{ background: group.hex }} />
                      <div className="color-group-info">
                        <span className="color-group-label">{group.label}</span>
                        <span className="color-group-count">{group.count} part</span>
                      </div>
                      <select
                        className="form-input"
                        value={selectedId}
                        onChange={(e) => {
                          const spool = spools.find(s => s.id === e.target.value);
                          handleGroupSpoolSelect(group.key, spool || null);
                        }}
                      >
                        <option value="">-- Pilih Filament untuk warna ini --</option>
                        {spools.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.brand} {s.material} - {s.colorName}
                          </option>
                        ))}
                      </select>
                      {noMatch && (
                        <span className="color-group-empty" title="Tidak ada filament dengan warna ini di inventory">
                          ⚠ tidak ada di inventory
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <AnimatePresence>
            {parts.length === 0 ? (
              <div className="empty-state py-4">
                <p className="text-dim">No parts added yet. You can add them later or add some now.</p>
              </div>
            ) : (
              <div className="flex-col gap-3">
                {parts.map((part, index) => (
                  <motion.div 
                    key={part.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card p-4 border-subtle"
                  >
                    <div className="flex-between mb-3">
                      <span className="text-xs text-muted font-bold uppercase tracking-wider">
                        Part #{index + 1}
                        {(() => {
                          const det = detectColorFromName(part.name);
                          if (!det) return null;
                          return (
                            <span className="text-xs text-dim" style={{ marginLeft: '0.5rem', textTransform: 'none' }}>
                              <span className="color-swatch" style={{ background: det.hex, width: 12, height: 12, display: 'inline-block', verticalAlign: '-2px', marginRight: '0.3rem' }} />
                              {det.label}
                            </span>
                          );
                        })()}
                      </span>
                      <button type="button" className="btn-icon text-error" onClick={() => handleRemovePart(part.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="form-group mb-3">
                      <input 
                        className="form-input" 
                        placeholder="Part name (e.g. Front Cover)" 
                        required
                        value={part.name}
                        onChange={(e) => handlePartChange(part.id, 'name', e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group mb-3">
                      <label className="text-xs text-dim">Filament (Inventory)</label>
                      <select 
                        className="form-input"
                        value={spools.find(s => s.material === part.material && s.colorName === part.color)?.id || ''}
                        onChange={(e) => {
                          const spool = spools.find(s => s.id === e.target.value);
                          if (spool) {
                            handleSpoolSelect(part.id, spool);
                          }
                        }}
                      >
                        <option value="">-- Pilih Filament dari Inventory --</option>
                        {spools.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.brand} {s.material} - {s.colorName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-grid-2 mt-3">
                      <div className="form-group">
                        <label className="text-xs text-dim">Quantity</label>
                        <input 
                          type="number" 
                          min="1"
                          className="form-input" 
                          value={part.quantity}
                          onChange={(e) => handlePartChange(part.id, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="text-xs text-dim">Berat per unit (gram)</label>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="0"
                          className="form-input" 
                          value={part.weight}
                          onChange={(e) => handlePartChange(part.id, 'weight', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group mt-3">
                      <label className="text-xs text-dim">Durasi Cetak per unit</label>
                      <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-1">
                          <input 
                            type="number" 
                            min="0"
                            placeholder="0"
                            className="form-input" 
                            value={part.hours}
                            onChange={(e) => handlePartChange(part.id, 'hours', e.target.value)}
                          />
                          <span className="text-xs text-dim">Jam</span>
                        </div>
                        <div className="flex-1 flex items-center gap-1">
                          <input 
                            type="number" 
                            min="0"
                            max="59"
                            placeholder="0"
                            className="form-input" 
                            value={part.minutes}
                            onChange={(e) => handlePartChange(part.id, 'minutes', e.target.value)}
                          />
                          <span className="text-xs text-dim">Menit</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </form>
    </div>
  );
}
