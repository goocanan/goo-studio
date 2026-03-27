import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Package, Info, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MATERIALS } from '../lib/constants';
import { optimizeImage } from '../lib/utils';

export default function AddProject({ onAdd, onBack, initialData }) {
  const [name, setName] = useState(initialData?.name || '');
  const [image, setImage] = useState(initialData?.thumbnail || null);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('medium');
  const [parts, setParts] = useState(initialData?.parts?.map(p => ({
    id: Math.random(),
    name: p.name,
    path: p.path, // Preserve local path for 3D viewer
    material: MATERIALS[0],
    color: '',
    weight: 50,
    quantity: 1
  })) || []);

  const handleAddPart = () => {
    setParts([...parts, {
      id: Date.now(),
      name: '',
      material: MATERIALS[0],
      color: '',
      weight: 50,
      quantity: 1
    }]);
  };

  const handleRemovePart = (id) => {
    setParts(parts.filter(p => p.id !== id));
  };

  const handlePartChange = (id, field, value) => {
    let finalValue = value;
    if (field === 'weight') finalValue = parseFloat(value) || 0;
    if (field === 'quantity') finalValue = parseInt(value) || 0;
    setParts(parts.map(p => p.id === id ? { ...p, [field]: finalValue } : p));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For now, store the file object. In a real app, you'd upload it or store a blob.
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalImage = image;
    
    // If image is a File or an unoptimized base64 string, compress it
    if (image instanceof File || (typeof image === 'string' && image.length > 200000)) {
      try {
        finalImage = await optimizeImage(image);
      } catch (error) {
        console.error('Failed to optimize image in AddProject:', error);
      }
    }

    onAdd({
      name,
      image: finalImage,
      notes,
      priority,
      status: parts.length > 0 ? 'ready' : 'idea',
      parts: parts.map(({ id, ...rest }) => rest)
    });
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
      </div>

      <form onSubmit={handleSubmit}>
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
                    <button type="button" className="image-remove-btn" onClick={() => setImage(null)}>×</button>
                  </div>
                ) : (
                  <label className="image-upload-placeholder">
                    <Plus size={24} />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </label>
                )}
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
                      <span className="text-xs text-muted font-bold uppercase tracking-wider">Part #{index + 1}</span>
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
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="text-xs text-dim">Material</label>
                        <select 
                          className="form-input"
                          value={part.material}
                          onChange={(e) => handlePartChange(part.id, 'material', e.target.value)}
                        >
                          {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="text-xs text-dim">Color</label>
                        <input 
                          className="form-input" 
                          placeholder="Color"
                          value={part.color}
                          onChange={(e) => handlePartChange(part.id, 'color', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-grid-2 mt-3">
                      <div className="form-group">
                        <label className="text-xs text-dim">Weight (g)</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={part.weight}
                          onChange={(e) => handlePartChange(part.id, 'weight', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="text-xs text-dim">Quantity</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={part.quantity}
                          onChange={(e) => handlePartChange(part.id, 'quantity', e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex-end gap-3 mt-4">
          <button type="button" className="btn btn-ghost" onClick={onBack}>Cancel</button>
          <button type="submit" className="btn btn-primary lg">
            <Zap size={18} /> Launch Project
          </button>
        </div>
      </form>
    </div>
  );
}
