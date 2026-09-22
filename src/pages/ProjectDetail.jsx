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
        <div className="project-hero aesthetic-hero mb-6">
          <div className="hero-backdrop" style={{ 
            backgroundImage: project.image ? `url(${typeof project.image === 'string' ? project.image : URL.createObjectURL(project.image)})` : 'none' 
          }}></div>
          <div className="project-hero-content-row relative z-10">
            {project.image && (
              <div className="project-hero-image-wrapper premium-frame">
                <img 
                  src={typeof project.image === 'string' ? project.image : (project.image instanceof File ? URL.createObjectURL(project.image) : '')} 
                  className="project-hero-image" 
                  alt={project.name} 
                />
              </div>
            )}
            <div className="flex-1">
              <div className="project-hero-header mb-6">
                <div className="flex-col">
                  <div className="flex items-center gap-4">
                    {isEditing ? (
                      <input 
                        className="heading-xl bg-transparent border-b border-dashed border-white/30 outline-none text-white w-full"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        autoFocus
                      />
                    ) : (
                      <h1 className="heading-xl gradient-text-hero leading-tight mb-1">{project.name}</h1>
                    )}
                  </div>
                  <div className="flex gap-3 items-center">
                    <span className={`tag tag-glass status-${project.status}`}>
                      {project.status.toUpperCase()}
                    </span>
                    {project.priority && (
                      <span className={`tag tag-glass priority-${project.priority}`}>
                        {project.priority.toUpperCase()}
                      </span>
                    )}
                    <span className="text-xxs text-dim ml-2 flex items-center gap-1">
                       <Clock size={10} /> Dibuat {new Date(project.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
                
                <div className="flex-col align-end">
                  <div className="text-xxs text-dim uppercase mb-1 font-bold">Status Project</div>
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

              {/* Stat Cards Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="stat-card-glass flex items-center gap-3">
                  <div className="stat-icon-box bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Package size={18} />
                  </div>
                  <div>
                    <span className="text-xxs text-dim uppercase font-bold tracking-wider block">Components</span>
                    <span className="text-lg font-bold text-white leading-snug">
                      {stats.doneParts}/{stats.totalParts} <span className="text-xs text-dim font-normal">({stats.totalUnits}u)</span>
                    </span>
                  </div>
                </div>

                <div className="stat-card-glass flex items-center gap-3">
                  <div className="stat-icon-box bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Scale size={18} />
                  </div>
                  <div>
                    <span className="text-xxs text-dim uppercase font-bold tracking-wider block">Total Berat</span>
                    <span className="text-lg font-bold text-cyan-400 leading-snug">{formatWeight(stats.totalWeight)}</span>
                  </div>
                </div>

                <div className="stat-card-glass flex items-center gap-3">
                  <div className="stat-icon-box bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="text-xxs text-dim uppercase font-bold tracking-wider block">Total Durasi</span>
                    <span className="text-lg font-bold text-amber-400 leading-snug">{formatDuration(stats.totalDurationMinutes)}</span>
                  </div>
                </div>

                <div className="stat-card-glass flex items-center gap-3">
                  <div className="stat-icon-box bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <span className="text-xxs text-dim uppercase font-bold tracking-wider block">Progress</span>
                    <span className="text-lg font-bold text-emerald-400 leading-snug">{stats.progress}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
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

        {/* Total & Breakdown per Warna Section (Compact & Low-Height) */}
        {stats.byColor.length > 0 && (
          <div className="detail-section mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="heading-sm flex items-center gap-2">
                <Palette size={16} className="text-primary" /> Ringkasan Cetak per Warna
              </h3>
              <span className="text-xxs text-dim font-medium">{stats.byColor.length} Variasi Warna</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {stats.byColor.map((group) => (
                <div key={group.key} className="glass-card p-2.5 px-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between gap-2 text-xs hover:border-white/15 transition-all">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                      style={{ 
                        backgroundColor: group.colorHex || 'var(--accent-primary)',
                        boxShadow: group.colorHex ? `0 0 6px ${group.colorHex}66` : 'none'
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate text-xs">{group.color}</div>
                      <span className="text-xxs text-dim block truncate">{group.material} • {group.totalUnits}u</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-cyan-400 font-semibold block text-xs">{formatWeight(group.totalWeight)}</span>
                    <span className="text-amber-400 text-xxs font-medium block">{formatDuration(group.totalDurationMinutes)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Components Section (Compact Cards) */}
        <div className="detail-section mb-12">
          <div className="section-header flex-between mb-3">
            <div className="flex items-center gap-3">
              <h2 className="heading-md flex items-center gap-2"><Package size={18} className="text-primary" /> Project Components</h2>
              <span className="badge badge-ghost text-xxs font-mono">{stats.totalParts} Item</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={openAddPartModal}>
              <Plus size={14} /> Tambah Component
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {project.parts.length === 0 ? (
                <div className="glass-card p-8 text-center w-full col-span-full border-dashed border-white/10">
                  <div className="mb-3 opacity-50"><Package size={36} className="mx-auto text-dim" /></div>
                  <h3 className="heading-sm text-dim">Belum ada component</h3>
                  <p className="text-muted text-xs mb-3">Tambahkan component pertama untuk melacak berat dan waktu cetak.</p>
                  <button className="btn btn-secondary btn-sm" onClick={openAddPartModal}>
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
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="glass-card p-3.5 rounded-xl border border-subtle hover:border-primary/40 transition-all flex flex-col justify-between gap-3 bg-surface/30"
                    >
                      {/* Header Row: Title, Tag & Actions */}
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xxs font-bold text-dim bg-white/5 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                            #{index + 1}
                          </span>
                          <h4 className="font-bold text-sm text-white truncate">{part.name}</h4>
                          <span className="px-2 py-0.5 rounded text-xxs font-medium bg-white/5 border border-white/10 text-white/70 shrink-0 flex items-center gap-1">
                            {matchingSpool?.colorHex && (
                              <span 
                                className="w-2 h-2 rounded-full inline-block"
                                style={{ backgroundColor: matchingSpool.colorHex }}
                              />
                            )}
                            {part.material} {part.color ? `• ${part.color}` : ''}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
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

                      {/* Metrics Strip */}
                      <div className="grid grid-cols-3 gap-2 bg-black/30 p-2 px-3 rounded-lg border border-white/5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Package size={12} className="text-purple-400 shrink-0" />
                          <span className="text-white/90 font-medium">{qty} unit</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Scale size={12} className="text-cyan-400 shrink-0" />
                          <span className="text-cyan-300 font-semibold">{formatWeight(totalWeight)}</span>
                        </div>

                        <div className="flex items-center gap-1.5 justify-end">
                          <Clock size={12} className="text-amber-400 shrink-0" />
                          <span className="text-amber-300 font-semibold">{formatDuration(totalMins)}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Details & Configuration Section */}
        <div className="detail-section pt-8 border-t border-subtle">
          <div className="glass-card p-6">
            <h3 className="heading-sm mb-6 flex items-center gap-2"><Settings size={20} /> Project Configuration & Notes</h3>
            
            <div className="form-grid-2">
              <div className="form-group">
                <label className="text-xs text-dim block mb-2 font-bold uppercase tracking-wider">Project Photo</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 rounded-xl overflow-hidden border border-subtle bg-surface/30">
                    {project.image ? (
                      <img src={project.image} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dim text-xxs">No Photo</div>
                    )}
                  </div>
                  <div className="flex-col gap-2">
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
                      {isUploading ? 'Uploading...' : 'Change Photo'}
                    </label>
                    <p className="text-xxs text-dim mt-1">Recommended: 16:9 Aspect Ratio</p>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="text-xs text-dim block mb-2 font-bold uppercase tracking-wider">Notes & Instructions</label>
                {isEditing ? (
                  <textarea 
                    className="form-input text-sm"
                    rows="5"
                    placeholder="Add specific assembly instructions or print settings..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  ></textarea>
                ) : (
                  <p className="text-sm text-muted bg-surface/30 p-4 rounded-xl border border-subtle min-h-[120px]">
                    {project.notes || 'No instructions added yet.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Content Section */}
        <div className="detail-section pt-8 border-t border-subtle mb-12">
          <div className="section-header flex-between mb-4">
            <h2 className="heading-md flex items-center gap-2"><Play size={20} /> Related Content</h2>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => {
                const title = prompt('Masukkan ide konten baru untuk proyek ini:');
                if (title) createContent({ title, projectId: project.id, status: 'idea' });
              }}
            >
              <Plus size={14} /> Add Content Idea
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedContent.length === 0 ? (
              <div className="glass-card p-8 text-center text-dim col-span-full border-dashed">
                <p>Belum ada ide konten yang terhubung dengan proyek ini.</p>
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
                  <div key={content.id} className="glass-card p-4 relative overflow-hidden">
                    {/* Priority strip */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-0.5" 
                      style={{ 
                        background: content.priority === 'high' ? 'var(--accent-error)' : 
                                    content.priority === 'low' ? 'var(--accent-emerald)' : 'var(--accent-amber)'
                      }} 
                    />
                    <div className="flex-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm truncate">{content.title}</h4>
                          <span className="text-xxs shrink-0">{priorityDot}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-dim mt-2">
                          {content.platform && (
                            <span className="badge badge-ghost text-xxs">{content.platform}</span>
                          )}
                          {content.scheduledAt && (
                            <span className={`text-xxs ${isOverdue ? 'text-error font-bold' : 'text-dim'}`}>
                              {isOverdue ? '⚠️ Overdue: ' : 'Due: '}{new Date(content.scheduledAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${statusBadge} shrink-0 ml-2`}>
                        {content.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
