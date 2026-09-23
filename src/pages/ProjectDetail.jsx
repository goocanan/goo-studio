import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, Play, Save, Package, Scale, Settings, MoreVertical, Edit3, Box, Layers, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROJECT_STATUSES, PART_STATUSES, MATERIALS } from '../lib/constants';
import { formatWeight, formatDuration, optimizeImage } from '../lib/utils';
import { useSpools } from '../hooks/useSpools';
import { useContent } from '../hooks/useContent';

export default function ProjectDetail({ 
  project, onUpdate, onDelete, onAddPart, onUpdatePart, onDeletePart, onBack 
}) {
  const { spools } = useSpools();
  const { contents, createContent } = useContent();
  const relatedContent = contents.filter(c => c.projectId === project.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...project });
  const [showPartModal, setShowPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Calculate project stats & breakdown
  const stats = useMemo(() => {
    const totalParts = project.parts?.length || 0;
    const totalUnits = project.parts?.reduce((sum, p) => sum + (parseInt(p.quantity) || 1), 0) || 0;
    const doneParts = project.parts?.filter(p => p.status === PART_STATUSES.DONE).length || 0;
    
    // Total Weight (sum of weight * quantity)
    const totalWeight = project.parts?.reduce((sum, p) => sum + ((Number(p.weight) || 0) * (parseInt(p.quantity) || 1)), 0) || 0;
    
    // Total Print Duration (sum of printDurationMinutes * quantity)
    const totalDurationMinutes = project.parts?.reduce((sum, p) => sum + ((Number(p.printDurationMinutes) || 0) * (parseInt(p.quantity) || 1)), 0) || 0;
    
    // Group stats per Color & Material
    const colorMap = {};
    project.parts?.forEach(p => {
      const qty = parseInt(p.quantity) || 1;
      const materialName = p.material || 'PLA';
      const colorName = p.color || 'Default';
      const key = `${materialName}___${colorName}`;
      
      if (!colorMap[key]) {
        const matchingSpool = spools.find(s => 
          s.material?.toLowerCase() === materialName.toLowerCase() && 
          s.colorName?.toLowerCase() === colorName.toLowerCase()
        );
        colorMap[key] = {
          key,
          material: materialName,
          color: colorName,
          colorHex: matchingSpool?.colorHex || null,
          totalWeight: 0,
          totalDurationMinutes: 0,
          totalUnits: 0,
          partCount: 0
        };
      }
      colorMap[key].totalWeight += (Number(p.weight) || 0) * qty;
      colorMap[key].totalDurationMinutes += (Number(p.printDurationMinutes) || 0) * qty;
      colorMap[key].totalUnits += qty;
      colorMap[key].partCount += 1;
    });

    const progress = totalParts > 0 ? Math.round((doneParts / totalParts) * 100) : 0;
    return { 
      totalParts, 
      totalUnits, 
      doneParts, 
      progress, 
      totalWeight, 
      totalDurationMinutes,
      byColor: Object.values(colorMap)
    };
  }, [project.parts, spools]);

  const handleSaveProject = () => {
    onUpdate(project.id, editForm);
    setIsEditing(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const optimizedBase64 = await optimizeImage(file);
      onUpdate(project.id, { image: optimizedBase64 });
      setEditForm(prev => ({ ...prev, image: optimizedBase64 }));
    } catch (error) {
      console.error('Image optimization failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const [formState, setFormState] = useState({ 
    name: '', 
    spoolId: '', 
    quantity: 1, 
    weight: 0, 
    hours: 0, 
    minutes: 0 
  });

  useEffect(() => {
    if (showPartModal) {
      if (editingPart) {
        const matchingSpool = spools.find(s => s.material === editingPart.material && s.colorName === editingPart.color);
        const totalMins = Number(editingPart.printDurationMinutes) || 0;
        setFormState({
          name: editingPart.name || '',
          spoolId: matchingSpool?.id || '',
          quantity: editingPart.quantity || 1,
          weight: editingPart.weight || 0,
          hours: Math.floor(totalMins / 60),
          minutes: totalMins % 60
        });
      } else {
        setFormState({ name: '', spoolId: '', quantity: 1, weight: 0, hours: 0, minutes: 0 });
      }
    }
  }, [showPartModal, editingPart, spools]);

  const handleAddPartSubmit = (e) => {
    e.preventDefault();
    
    const spool = spools.find(s => s.id === formState.spoolId);
    const totalDurationMins = (parseInt(formState.hours) || 0) * 60 + (parseInt(formState.minutes) || 0);

    const partData = {
      name: formState.name,
      material: spool ? spool.material : (editingPart?.material || 'PLA'),
      color: spool ? spool.colorName : (editingPart?.color || ''),
      quantity: parseInt(formState.quantity) || 1,
      weight: parseInt(formState.weight) || 0,
      printDurationMinutes: totalDurationMins,
      status: editingPart ? editingPart.status : PART_STATUSES.PENDING
    };
    
    if (editingPart) {
      onUpdatePart(project.id, editingPart.id, partData);
    } else {
      onAddPart(project.id, partData);
    }
    
    setShowPartModal(false);
    setEditingPart(null);
  };

  const openEditPartModal = (part) => {
    setEditingPart(part);
    setShowPartModal(true);
  };

  const openAddPartModal = () => {
    setEditingPart(null);
    setShowPartModal(true);
  };

  return (
    <>
      {showPartModal && (
        <div className="modal-overlay" onClick={() => setShowPartModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPart ? 'Edit Component' : 'Add Component'}</h2>
              <button className="btn-icon" onClick={() => setShowPartModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPartSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Nama Component</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Panel Depan R" 
                  className="form-input" 
                  value={formState.name}
                  onChange={e => setFormState({...formState, name: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Filament (Inventory)</label>
                <select 
                  className="form-input" 
                  required
                  value={formState.spoolId}
                  onChange={e => setFormState({...formState, spoolId: e.target.value})}
                >
                  <option value="">-- Pilih Filament --</option>
                  {spools.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.brand} {s.material} - {s.colorName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Jumlah (Quantity)</label>
                  <input 
                    type="number" 
                    min="1"
                    required 
                    className="form-input" 
                    value={formState.quantity}
                    onChange={e => setFormState({...formState, quantity: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Berat per unit (gram)</label>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    className="form-input" 
                    value={formState.weight}
                    onChange={e => setFormState({...formState, weight: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Durasi Cetak per unit</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-1">
                    <input 
                      type="number" 
                      min="0"
                      placeholder="0"
                      className="form-input" 
                      value={formState.hours}
                      onChange={e => setFormState({...formState, hours: e.target.value})}
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
                      value={formState.minutes}
                      onChange={e => setFormState({...formState, minutes: e.target.value})}
                    />
                    <span className="text-xs text-dim">Menit</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPartModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">{editingPart ? 'Simpan Perubahan' : 'Tambah Component'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="animate-in">
        {/* Navigation Header */}
        <div className="page-header mb-2">
          <div className="page-header-left">
            <button className="btn-text" onClick={onBack}>
              <ArrowLeft size={16} /> Kembali ke Project
            </button>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                <Edit3 size={14} /> Edit Project
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={handleSaveProject}>
                <Save size={14} /> Simpan Perubahan
              </button>
            )}
            <button className="btn btn-ghost btn-sm text-error" onClick={() => {
              if(confirm('Hapus proyek ini secara permanen?')) {
                onDelete(project.id);
                onBack();
              }
            }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Project Hero Section */}
        <div className="project-hero aesthetic-hero mb-4 sm:mb-6">
          <div className="hero-backdrop" style={{ 
            backgroundImage: project.image ? `url(${typeof project.image === 'string' ? project.image : URL.createObjectURL(project.image)})` : 'none' 
          }}></div>
          <div className="project-hero-content-row relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6">
            {project.image && (
              <div className="project-hero-image-wrapper premium-frame shrink-0">
                <img 
                  src={typeof project.image === 'string' ? project.image : (project.image instanceof File ? URL.createObjectURL(project.image) : '')} 
                  className="project-hero-image" 
                  alt={project.name} 
                />
              </div>
            )}
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <input 
                        className="heading-xl bg-transparent border-b border-dashed border-white/30 outline-none text-white w-full"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        autoFocus
                      />
                    ) : (
                      <h1 className="heading-xl gradient-text-hero leading-tight mb-0.5 text-xl sm:text-2xl md:text-3xl font-extrabold truncate">{project.name}</h1>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className={`tag tag-glass status-${project.status}`}>
                      {project.status.toUpperCase()}
                    </span>
                    {project.priority && (
                      <span className={`tag tag-glass priority-${project.priority}`}>
                        {project.priority.toUpperCase()}
                      </span>
                    )}
                    <span className="text-xxs text-dim flex items-center gap-1">
                       <Clock size={10} /> Dibuat {new Date(project.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:items-end shrink-0">
                  <div className="text-xxs text-dim uppercase mb-0.5 font-bold">Status Project</div>
                  <select 
                    className="form-input bg-surface/50 border-subtle text-xs py-1"
                    style={{ width: 'auto' }}
                    value={project.status}
                    onChange={(e) => onUpdate(project.id, { status: e.target.value })}
                  >
                    {Object.entries(PROJECT_STATUSES).map(([key, val]) => (
                      <option key={val} value={val}>{key}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stat Cards Overview (Mobile 2x2 Grid) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3.5">
                <div className="stat-card-glass flex items-center gap-2 sm:gap-3">
                  <div className="stat-icon-box bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                    <Package size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xxs text-dim uppercase font-bold tracking-wider block truncate">Components</span>
                    <span className="text-sm sm:text-lg font-bold text-white leading-snug truncate block">
                      {stats.doneParts}/{stats.totalParts} <span className="text-[10px] sm:text-xs text-dim font-normal">({stats.totalUnits}u)</span>
                    </span>
                  </div>
                </div>

                <div className="stat-card-glass flex items-center gap-2 sm:gap-3">
                  <div className="stat-icon-box bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    <Scale size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xxs text-dim uppercase font-bold tracking-wider block truncate">Total Berat</span>
                    <span className="text-sm sm:text-lg font-bold text-cyan-400 leading-snug truncate block">{formatWeight(stats.totalWeight)}</span>
                  </div>
                </div>

                <div className="stat-card-glass flex items-center gap-2 sm:gap-3">
                  <div className="stat-icon-box bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xxs text-dim uppercase font-bold tracking-wider block truncate">Total Durasi</span>
                    <span className="text-sm sm:text-lg font-bold text-amber-400 leading-snug truncate block">{formatDuration(stats.totalDurationMinutes)}</span>
                  </div>
                </div>

                <div className="stat-card-glass flex items-center gap-2 sm:gap-3">
                  <div className="stat-icon-box bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-xxs text-dim uppercase font-bold tracking-wider block truncate">Progress</span>
                    <span className="text-sm sm:text-lg font-bold text-emerald-400 leading-snug truncate block">{stats.progress}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 sm:mt-4">
                <div className="progress-bar lg">
                  <motion.div 
                    className="progress-bar-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.progress}%` }}
                    transition={{ duration: 1 }}
                    style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total & Breakdown per Warna Section (Responsive Mobile Pill List) */}
        {stats.byColor.length > 0 && (
          <div className="glass-card p-3 px-3.5 sm:px-4 rounded-xl border border-white/5 bg-black/20 mb-5 sm:mb-6">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-dim flex items-center gap-2">
                <Palette size={14} className="text-primary" /> Ringkasan Cetak per Warna
              </h3>
              <span className="text-xxs text-dim font-mono">{stats.byColor.length} Warna</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {stats.byColor.map((group) => (
                <div 
                  key={group.key} 
                  className="flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-3 px-2.5 py-1.5 rounded-lg border border-white/5 bg-white/5 text-xs hover:border-white/15 transition-all w-full sm:w-auto"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                      style={{ 
                        backgroundColor: group.colorHex || 'var(--accent-primary)',
                        boxShadow: group.colorHex ? `0 0 6px ${group.colorHex}66` : 'none'
                      }}
                    />
                    <span className="font-bold text-white text-xs truncate max-w-[120px]">{group.color}</span>
                    <span className="text-xxs font-mono text-dim bg-white/5 px-1.5 py-0.5 rounded shrink-0">{group.material}</span>
                  </div>

                  <div className="flex items-center gap-2 border-l border-white/10 pl-2 text-xxs font-medium ml-auto sm:ml-0">
                    <span className="text-dim">{group.totalUnits}u</span>
                    <span className="text-cyan-400 font-semibold">{formatWeight(group.totalWeight)}</span>
                    <span className="text-amber-400 font-semibold">{formatDuration(group.totalDurationMinutes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Components Section (Responsive Mobile Rows) */}
        <div className="detail-section mb-8 sm:mb-12">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="heading-md flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base mb-0"><Package size={18} className="text-primary shrink-0" /> Project Components</h2>
              <span className="badge badge-ghost text-xxs font-mono shrink-0">{stats.totalParts} Item</span>
            </div>
            <button className="btn btn-primary btn-sm text-xs shrink-0" onClick={openAddPartModal}>
              <Plus size={14} /> <span className="hidden sm:inline">Tambah Component</span><span className="sm:hidden">Tambah</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-2.5">
            <AnimatePresence>
              {project.parts.length === 0 ? (
                <div className="glass-card p-6 sm:p-8 text-center w-full col-span-full border-dashed border-white/10">
                  <div className="mb-2.5 opacity-50"><Package size={36} className="mx-auto text-dim" /></div>
                  <h3 className="heading-sm text-dim text-sm">Belum ada component</h3>
                  <p className="text-muted text-xs mb-3">Tambahkan component pertama untuk melacak berat dan waktu cetak.</p>
                  <button className="btn btn-secondary btn-sm text-xs" onClick={openAddPartModal}>
                    <Plus size={14} /> Tambah Component Pertama
                  </button>
                </div>
              ) : (
                project.parts.map((part, index) => {
                  const qty = parseInt(part.quantity) || 1;
                  const unitWeight = Number(part.weight) || 0;
                  const totalWeight = unitWeight * qty;
                  const unitMins = Number(part.printDurationMinutes) || 0;
                  const totalMins = unitMins * qty;
                  const isDone = part.status === PART_STATUSES.DONE;
                  const matchingSpool = spools.find(s => 
                    s.material?.toLowerCase() === part.material?.toLowerCase() && 
                    s.colorName?.toLowerCase() === part.color?.toLowerCase()
                  );

                  return (
                    <motion.div 
                      key={part.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="glass-card p-2.5 px-3 sm:px-4 rounded-xl border border-subtle hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 bg-surface/30"
                    >
                      {/* Left Column: Index + Name + Material/Color Tag */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                        <span className="text-xxs font-mono font-bold text-dim bg-white/5 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                          #{index + 1}
                        </span>
                        <h4 className="font-bold text-sm text-white truncate max-w-[160px] sm:max-w-[220px]">{part.name}</h4>
                        
                        <span className="px-2 py-0.5 rounded text-xxs font-medium bg-white/5 border border-white/10 text-white/80 inline-flex items-center gap-1.5 shrink-0">
                          {matchingSpool?.colorHex && (
                            <span 
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: matchingSpool.colorHex }}
                            />
                          )}
                          {part.material} {part.color ? `• ${part.color}` : ''}
                        </span>
                      </div>

                      {/* Right Container: Metrics (unit, weight, duration inline) + Action Buttons attached right */}
                      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0">
                        {/* Horizontal Metrics Pill (Side-by-side) */}
                        <div className="flex items-center gap-1.5 sm:gap-2.5 bg-black/40 px-2 sm:px-2.5 py-1 rounded-lg border border-white/5 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1" title="Quantity">
                            <Package size={11} className="text-purple-400 shrink-0" />
                            <span className="text-white/90 font-medium text-xs">{qty}u</span>
                          </div>

                          <div className="flex items-center gap-1 border-l border-white/10 pl-1.5 sm:pl-2.5" title="Total Berat">
                            <Scale size={11} className="text-cyan-400 shrink-0" />
                            <span className="text-cyan-300 font-semibold text-xs">{formatWeight(totalWeight)}</span>
                          </div>

                          <div className="flex items-center gap-1 border-l border-white/10 pl-1.5 sm:pl-2.5" title="Total Durasi">
                            <Clock size={11} className="text-amber-400 shrink-0" />
                            <span className="text-amber-300 font-semibold text-xs">{formatDuration(totalMins)}</span>
                          </div>
                        </div>

                        {/* Action Buttons (Attached to far right) */}
                        <div className="flex items-center gap-1.5 ml-auto sm:ml-0 shrink-0">
                          <button 
                            className={`badge-status-pill py-0.5 px-2 text-xxs ${isDone ? 'badge-status-done' : 'badge-status-pending'}`}
                            onClick={() => onUpdatePart(project.id, part.id, { 
                              status: isDone ? PART_STATUSES.PENDING : PART_STATUSES.DONE 
                            })}
                            title="Klik untuk ubah status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-purple-400'}`} />
                            {part.status?.toUpperCase()}
                          </button>

                          <button className="btn-icon xs hover:text-primary transition-colors" onClick={() => openEditPartModal(part)} title="Edit Component">
                            <Edit3 size={12} />
                          </button>
                          <button className="btn-icon xs hover:text-error transition-colors" onClick={() => onDeletePart(project.id, part.id)} title="Hapus Component">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Configuration, Notes & Related Content Section (Balanced 2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 border-t border-subtle pt-8">
          {/* Left Column: Photo Configuration & Notes */}
          <div className="glass-card p-5 rounded-2xl border border-subtle flex flex-col justify-between">
            <div>
              <h3 className="heading-sm mb-4 flex items-center gap-2 text-white">
                <Settings size={18} className="text-primary" /> Catatan & Foto Proyek
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xxs text-dim block mb-1.5 font-bold uppercase tracking-wider">Foto Proyek</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="w-full max-w-[220px] sm:w-48 h-32 rounded-xl overflow-hidden border border-white/15 bg-black/40 shadow-lg shrink-0 relative group">
                      {project.image ? (
                        <img 
                          src={typeof project.image === 'string' ? project.image : URL.createObjectURL(project.image)} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          alt="Preview" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-dim text-xs gap-1">
                          <Box size={24} className="opacity-30" />
                          <span>Belum ada foto</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <input 
                        type="file" 
                        id="project-image-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <label 
                        htmlFor="project-image-upload" 
                        className={`btn btn-secondary btn-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        {isUploading ? 'Mengunggah...' : 'Ubah Foto Proyek'}
                      </label>
                      <p className="text-xxs text-dim">Rekomendasi: Format 16:9 atau 1:1 (PNG/JPG)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xxs text-dim block mb-1.5 font-bold uppercase tracking-wider">Instruksi & Catatan Cetak</label>
                  {isEditing ? (
                    <textarea 
                      className="form-input text-sm"
                      rows="4"
                      placeholder="Tambahkan catatan atau instruksi perakitan khusus..."
                      value={editForm.notes}
                      onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                    ></textarea>
                  ) : (
                    <div className="text-xs text-muted bg-black/30 p-3.5 rounded-xl border border-white/5 min-h-[90px] whitespace-pre-wrap leading-relaxed">
                      {project.notes || 'Belum ada catatan penjelas penataan atau perakitan.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Related Content Ideas */}
          <div className="glass-card p-5 rounded-2xl border border-subtle flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-sm flex items-center gap-2 text-white">
                  <Play size={18} className="text-primary" /> Ide Konten Terkait
                </h3>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => {
                    const title = prompt('Masukkan ide konten baru untuk proyek ini:');
                    if (title) createContent({ title, projectId: project.id, status: 'idea' });
                  }}
                >
                  <Plus size={13} /> Tambah Ide
                </button>
              </div>

              <div className="space-y-2.5">
                {relatedContent.length === 0 ? (
                  <div className="glass-card p-6 text-center text-dim border-dashed border-white/10 rounded-xl">
                    <p className="text-xs">Belum ada ide konten yang terhubung dengan proyek ini.</p>
                  </div>
                ) : (
                  relatedContent.map(content => {
                    const statusColorMap = {
                      idea: 'badge-ghost', research: 'badge-ghost', ready: 'badge-ghost',
                      script: 'badge-primary', recording: 'badge-primary', editing: 'badge-primary',
                      review: 'badge-warning', scheduled: 'badge-info', published: 'badge-success'
                    };
                    const statusBadge = statusColorMap[content.status] || 'badge-ghost';
                    const priorityDot = content.priority === 'high' ? '🔴' : content.priority === 'low' ? '🟢' : '🟡';
                    const isOverdue = content.scheduledAt && new Date(content.scheduledAt).getTime() < Date.now() && content.status !== 'published';

                    return (
                      <div key={content.id} className="glass-card p-3 rounded-xl border border-white/5 bg-black/20 flex justify-between items-center relative overflow-hidden">
                        <div 
                          className="absolute top-0 left-0 bottom-0 w-1" 
                          style={{ 
                            background: content.priority === 'high' ? 'var(--accent-error)' : 
                                        content.priority === 'low' ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                          }} 
                        />
                        <div className="pl-2 flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-bold text-xs text-white truncate">{content.title}</h4>
                            <span className="text-xxs shrink-0">{priorityDot}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xxs text-dim">
                            {content.platform && (
                              <span className="badge badge-ghost text-xxs py-0 px-1.5">{content.platform}</span>
                            )}
                            {content.scheduledAt && (
                              <span className={`text-xxs ${isOverdue ? 'text-error font-bold' : 'text-dim'}`}>
                                {isOverdue ? '⚠️ Overdue' : `Due: ${new Date(content.scheduledAt).toLocaleDateString()}`}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`badge ${statusBadge} shrink-0 text-xxs py-0.5 px-2`}>
                          {content.status.toUpperCase()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
