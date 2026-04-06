import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle, Clock, Play, Save, Package, Scale, Settings, MoreVertical, Edit3, Box, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROJECT_STATUSES, PART_STATUSES, MATERIALS } from '../lib/constants';
import { formatWeight, optimizeImage } from '../lib/utils';
import ThreeDViewer from '../components/ui/ThreeDViewer';
import ModelPreview from '../components/ui/ModelPreview';
import { useSpools } from '../hooks/useSpools';

export default function ProjectDetail({ 
  project, onUpdate, onDelete, onAddPart, onUpdatePart, onDeletePart, onBack, getFileData 
}) {
  const { spools } = useSpools();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...project });
  const [showPartModal, setShowPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [partPreviews, setPartPreviews] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  // Pre-load previews for parts that have a path
  useEffect(() => {
    if (!getFileData) return;
    
    project.parts.forEach(async (part) => {
      if (part.path && !partPreviews[part.id]) {
        try {
          const file = await getFileData(part.path);
          if (file) {
            const url = URL.createObjectURL(file);
            setPartPreviews(prev => ({ ...prev, [part.id]: url }));
          }
        } catch (e) {
          console.warn('Failed to load preview for', part.name, e);
        }
      }
    });

    return () => {
      // Cleanup URLs
      Object.values(partPreviews).forEach(p => { if (p) URL.revokeObjectURL(p); });
    };
  }, [project.parts, getFileData]);

  // Calculate project stats
  const stats = useMemo(() => {
    const totalParts = project.parts?.length || 0;
    const totalUnits = project.parts?.reduce((sum, p) => sum + (parseInt(p.quantity) || 1), 0) || 0;
    const doneParts = project.parts?.filter(p => p.status === PART_STATUSES.DONE).length || 0;
    const totalWeight = project.parts?.reduce((sum, p) => {
      const w = parseFloat(p.weight) || 0;
      const q = parseInt(p.quantity) || 1;
      return sum + (w * q);
    }, 0) || 0;
    const progress = totalParts > 0 ? Math.round((doneParts / totalParts) * 100) : 0;
    return { totalParts, totalUnits, doneParts, totalWeight, progress };
  }, [project.parts]);

  const handleSaveProject = () => {
    onUpdate(project.id, editForm);
    setIsEditing(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Optimize image before sending to DB (max 1200px, 0.8 quality)
      const optimizedBase64 = await optimizeImage(file);
      onUpdate(project.id, { image: optimizedBase64 });
      setEditForm(prev => ({ ...prev, image: optimizedBase64 }));
    } catch (error) {
      console.error('Image optimization failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddPartSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Find selected spool for material/color
    const spoolId = formData.get('spoolId');
    const spool = spools.find(s => s.id === spoolId);

    const partData = {
      name: formData.get('name'),
      material: spool ? spool.material : 'PLA',
      color: spool ? spool.colorName : '',
      weight: 0,
      quantity: parseInt(formData.get('quantity')) || 1,
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
    <div className="animate-in">
      {/* 3D Viewer Modal */}
      {viewerUrl && (
        <ThreeDViewer 
          url={viewerUrl} 
          onClose={() => {
            URL.revokeObjectURL(viewerUrl);
            setViewerUrl(null);
          }} 
        />
      )}
      {/* Navigation Header */}
      <div className="page-header mb-2">
        <div className="page-header-left">
          <button className="btn-text" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Projects
          </button>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
              <Edit3 size={14} /> Edit Project
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleSaveProject}>
              <Save size={14} /> Save Changes
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
      <div className="project-hero aesthetic-hero">
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
                     <Clock size={10} /> Created on {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <div className="flex-col align-end">
                <div className="text-xxs text-dim uppercase mb-1 font-bold">Project Status</div>
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

            <div className="project-hero-stats">
              <div className="hero-stat-item">
                <span className="hero-stat-label">Components</span>
                <span className="hero-stat-value">{stats.doneParts}/{stats.totalParts} <span className="text-xs text-dim">({stats.totalUnits}u)</span></span>
              </div>
              <div className="hero-stat-item">
                <span className="hero-stat-label">Progress</span>
                <span className="hero-stat-value">{stats.progress}%</span>
              </div>
            </div>

            <div className="mt-6">
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

      {/* Components Section */}
      <div className="detail-section mb-12">
        <div className="section-header flex-between mb-4">
          <h2 className="heading-md flex items-center gap-2"><Package size={20} /> Project Components</h2>
          <button className="btn btn-primary btn-sm" onClick={openAddPartModal}>
            <Plus size={14} /> Add Part
          </button>
        </div>
        
        <div className="parts-grid">
          <AnimatePresence>
            {project.parts.length === 0 ? (
              <div className="glass-card p-12 text-center w-full col-span-full">
                <div className="mb-4 opacity-50"><Package size={48} className="mx-auto" /></div>
                <h3 className="heading-sm text-dim">No components yet</h3>
                <p className="text-muted text-xs mb-4">Add your first printable file to start tracking progress.</p>
                <button className="btn btn-secondary btn-sm" onClick={openAddPartModal}>
                  <Plus size={14} /> Add First Component
                </button>
              </div>
            ) : (
              project.parts.map((part, index) => (
                <motion.div 
                  key={part.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="part-card premium-part-card"
                >
                  <div className="part-card-visual">
                    {partPreviews[part.id] ? (
                      <ModelPreview url={partPreviews[part.id]} />
                    ) : (
                      <div className="part-card-visual-placeholder">
                        <Box size={32} className="opacity-20" />
                        <span className="text-xxs opacity-30 mt-2">No 3D Preview</span>
                      </div>
                    )}
                    <button 
                      className="part-card-expand-btn"
                      onClick={() => {
                        if (partPreviews[part.id]) {
                          setViewerUrl(partPreviews[part.id]);
                        } else {
                          alert('Hubungkan kembali library di File Manager untuk melihat file 3D ini.');
                        }
                      }}
                      title="Expand 3D Viewer"
                    >
                      <Zap size={14} />
                    </button>
                  </div>

                  <div className="part-card-body p-4">
                    <div className="part-card-header mb-2">
                      <h4 className="part-card-name truncate">{part.name}</h4>
                      <div className="flex gap-1">
                        <button className="btn-icon xs hover:text-primary" onClick={() => openEditPartModal(part)}>
                          <Edit3 size={12} />
                        </button>
                        <button className="btn-icon xs hover:text-error" onClick={() => onDeletePart(project.id, part.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="part-card-meta mb-3">
                      <span className="tag-glass text-xxs px-2">{part.material}</span>
                      <span className="tag-glass text-xxs px-2">{part.color || 'Default'}</span>
                    </div>

                    <div className="flex-between items-center text-xs text-dim">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1"><Package size={10} /> Qty: {part.quantity || 1}</span>
                      </div>
                      <button 
                         className={`badge clickable ${part.status === PART_STATUSES.DONE ? 'badge-success' : 'badge-primary'}`}
                         onClick={() => onUpdatePart(project.id, part.id, { 
                           status: part.status === PART_STATUSES.DONE ? PART_STATUSES.PENDING : PART_STATUSES.DONE 
                         })}
                      >
                        {part.status?.toUpperCase()}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
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

      {/* Add/Edit Part Modal */}
      {showPartModal && (
        <div className="modal-overlay" onClick={() => setShowPartModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPart ? 'Edit Component' : 'Add Component'}</h2>
              <button className="btn-icon" onClick={() => setShowPartModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddPartSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Component Name</label>
                <input name="name" type="text" required placeholder="e.g. Panel R" className="form-input" defaultValue={editingPart?.name || ''} />
              </div>
              
              <div className="form-group">
                <label className="form-label">Filament (Inventory)</label>
                <select 
                  name="spoolId" 
                  className="form-input" 
                  required
                  defaultValue={spools.find(s => s.material === editingPart?.material && s.colorName === editingPart?.color)?.id || ''}
                >
                  <option value="">-- Pilih Filament --</option>
                  {spools.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.brand} {s.material} - {s.colorName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input name="quantity" type="number" required defaultValue={editingPart?.quantity || 1} className="form-input" />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowPartModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingPart ? 'Save Changes' : 'Add Component'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
