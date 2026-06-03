import React, { useState } from 'react';
import { Plus, Search, Tag, Trash2, Edit3, Lightbulb, PlaySquare, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '../hooks/useContent';

export default function ContentIdeas() {
  const { contents, createContent, updateContent, deleteContent, isLoading } = useContent();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    platform: 'YouTube',
    priority: 'medium',
    status: 'idea'
  });

  const ideas = contents.filter(c => ['idea', 'research', 'ready'].includes(c.status));

  const filteredIdeas = ideas.filter(idea => 
    idea.title.toLowerCase().includes(search.toLowerCase()) || 
    (idea.tags && idea.tags.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateContent(editingId, form);
    } else {
      await createContent(form);
    }
    closeModal();
  };

  const openEdit = (idea) => {
    setForm({
      title: idea.title,
      description: idea.description || '',
      tags: idea.tags || '',
      platform: idea.platform || 'YouTube',
      priority: idea.priority || 'medium',
      status: idea.status || 'idea'
    });
    setEditingId(idea.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setForm({ title: '', description: '', tags: '', platform: 'YouTube', priority: 'medium', status: 'idea' });
    setEditingId(null);
    setShowModal(false);
  };

  if (isLoading) return <div className="p-8 text-center text-dim">Loading ideas...</div>;

  return (
    <div className="animate-in pb-20">
      <div className="page-header flex-between">
        <div>
          <h1 className="heading-xl gradient-text flex items-center gap-2"><Lightbulb size={28} /> Content Ideas</h1>
          <p className="page-subtitle">Brainstorm and manage your content concepts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Idea
        </button>
      </div>

      <div className="search-bar mb-6 max-w-md">
        <Search size={16} className="text-dim" />
        <input 
          type="text" 
          placeholder="Search ideas or tags..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredIdeas.length === 0 ? (
            <div className="col-span-full glass-card p-12 text-center text-dim">
              <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
              <p>No content ideas found. Start brainstorming!</p>
            </div>
          ) : (
            filteredIdeas.map((idea, idx) => (
              <motion.div 
                key={idea.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="glass-card p-5 interactive"
              >
                <div className="flex-between items-start mb-3">
                  <h3 className="font-bold text-lg leading-tight pr-4">{idea.title}</h3>
                  <div className="flex gap-1">
                    <button className="btn-icon xs text-primary" onClick={() => openEdit(idea)}><Edit3 size={14} /></button>
                    <button className="btn-icon xs text-error" onClick={() => { if(confirm('Hapus ide ini?')) deleteContent(idea.id) }}><Trash2 size={14} /></button>
                  </div>
                </div>
                
                <p className="text-sm text-dim line-clamp-2 mb-4 h-10">{idea.description || 'No description provided.'}</p>
                
                <div className="flex-between items-end mt-auto">
                  <div className="flex flex-wrap gap-1">
                    {idea.platform === 'YouTube' && <span className="badge badge-error"><Video size={10} /> YT</span>}
                    {idea.platform === 'TikTok' && <span className="badge badge-primary"><PlaySquare size={10} /> TT</span>}
                    {idea.tags && idea.tags.split(',').map(tag => (
                      <span key={tag} className="badge badge-ghost text-xxs"><Tag size={8} /> {tag.trim()}</span>
                    ))}
                  </div>
                  <select 
                    className="form-input py-1 px-2 text-xs bg-surface/50 border-none w-auto"
                    value={idea.status}
                    onChange={(e) => updateContent(idea.id, { status: e.target.value })}
                  >
                    <option value="idea">Idea</option>
                    <option value="research">Research</option>
                    <option value="ready">Ready</option>
                    <option value="script">Move to Pipeline ➔</option>
                  </select>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="modal-content glass-card max-w-md w-full p-6"
            >
              <h2 className="heading-md mb-4">{editingId ? 'Edit Idea' : 'New Content Idea'}</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Platform</label>
                    <select className="form-input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                      <option value="YouTube">YouTube</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Blog">Blog</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="idea">Idea</option>
                      <option value="research">Research</option>
                      <option value="ready">Ready</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input type="text" className="form-input" placeholder="3dprinting, tutorial, review" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
                </div>
                <div className="flex-end gap-2 mt-4">
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Save' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
