import React, { useState } from 'react';
import { Plus, Search, Tag, Trash2, Edit3, Lightbulb, PlaySquare, Video, Calendar, Link, Filter, Instagram, MessageCircle, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '../hooks/useContent';
import { useProjects } from '../hooks/useProjects';

const PLATFORMS = ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Threads'];
const IDEA_STATUSES = ['idea', 'research', 'ready'];
const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'badge-error', dot: '🔴' },
  medium: { label: 'Medium', color: 'badge-warning', dot: '🟡' },
  low: { label: 'Low', color: 'badge-success', dot: '🟢' },
};

const PLATFORM_STYLE = {
  YouTube: { badge: 'badge-error', icon: Video, short: 'YT' },
  TikTok: { badge: 'badge-primary', icon: PlaySquare, short: 'TT' },
  Instagram: { badge: 'badge-warning', icon: Instagram, short: 'IG' },
  Facebook: { badge: 'badge-info', icon: Facebook, short: 'FB' },
  Threads: { badge: 'badge-ghost', icon: MessageCircle, short: 'TH' },
};

export default function ContentIdeas() {
  const { contents, createContent, updateContent, deleteContent, isLoading } = useContent();
  const { projects } = useProjects();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const defaultForm = {
    title: '',
    description: '',
    tags: '',
    platform: 'YouTube',
    priority: 'medium',
    status: 'idea',
    projectId: '',
    scheduledAt: ''
  };
  const [form, setForm] = useState(defaultForm);

  const ideas = contents.filter(c => IDEA_STATUSES.includes(c.status));

  const filteredIdeas = ideas.filter(idea => {
    const matchSearch = idea.title.toLowerCase().includes(search.toLowerCase()) || 
      (idea.tags && idea.tags.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'all' || idea.status === filterStatus;
    const matchPlatform = filterPlatform === 'all' || idea.platform === filterPlatform;
    return matchSearch && matchStatus && matchPlatform;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      projectId: form.projectId || null,
      scheduledAt: form.scheduledAt || null
    };
    
    if (editingId) {
      await updateContent(editingId, payload);
    } else {
      await createContent(payload);
    }
    closeModal();
  };

  const openEdit = (idea) => {
    let dateStr = '';
    if (idea.scheduledAt) {
      dateStr = new Date(idea.scheduledAt).toISOString().slice(0, 16);
    }
    setForm({
      title: idea.title,
      description: idea.description || '',
      tags: idea.tags || '',
      platform: idea.platform || 'YouTube',
      priority: idea.priority || 'medium',
      status: idea.status || 'idea',
      projectId: idea.projectId || '',
      scheduledAt: dateStr
    });
    setEditingId(idea.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setForm(defaultForm);
    setEditingId(null);
    setShowModal(false);
  };

  // Stats
  const statusCounts = {
    all: ideas.length,
    idea: ideas.filter(i => i.status === 'idea').length,
    research: ideas.filter(i => i.status === 'research').length,
    ready: ideas.filter(i => i.status === 'ready').length,
  };

  if (isLoading) return <div className="p-8 text-center text-dim">Loading ideas...</div>;

  return (
    <div className="animate-in pb-20">
      <div className="page-header flex-between">
        <div>
          <h1 className="heading-xl gradient-text flex items-center gap-2"><Lightbulb size={28} /> Content Ideas</h1>
          <p className="page-subtitle">Brainstorm and manage your content concepts</p>
        </div>
        <button className="btn btn-primary shadow-glow" onClick={() => setShowModal(true)}>
          <Plus size={18} /> New Idea
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { value: 'all', label: 'All' },
          { value: 'idea', label: '💡 Idea' },
          { value: 'research', label: '🔍 Research' },
          { value: 'ready', label: '✅ Ready' },
        ].map(tab => (
          <button 
            key={tab.value}
            className={`btn btn-sm ${filterStatus === tab.value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterStatus(tab.value)}
          >
            {tab.label}
            <span className="ml-1 text-xxs opacity-70">({statusCounts[tab.value]})</span>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="search-bar flex-1 min-w-[200px]">
          <Search size={16} className="text-dim" />
          <input 
            type="text" 
            placeholder="Search ideas or tags..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="form-input py-2 px-3 text-sm bg-surface/50 border-subtle w-auto"
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
        >
          <option value="all">All Platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredIdeas.length === 0 ? (
            <div className="col-span-full glass-card p-16 text-center text-dim border-dashed border-2 border-subtle">
              <Lightbulb size={48} className="mx-auto mb-4 opacity-20" />
              <p>No content ideas found. Start brainstorming your next hit!</p>
            </div>
          ) : (
            filteredIdeas.map((idea, idx) => {
              const linkedProject = projects.find(p => p.id === idea.projectId);
              const isDueSoon = idea.scheduledAt && (new Date(idea.scheduledAt).getTime() - Date.now()) < 86400000 * 2;
              const isOverdue = idea.scheduledAt && new Date(idea.scheduledAt).getTime() < Date.now();
              const priorityCfg = PRIORITY_CONFIG[idea.priority] || PRIORITY_CONFIG.medium;
              const platStyle = PLATFORM_STYLE[idea.platform];
              const PlatIcon = platStyle?.icon;

              return (
                <motion.div 
                  key={idea.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card p-5 interactive relative overflow-hidden"
                >
                  {/* Priority indicator strip */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1" 
                    style={{ 
                      background: idea.priority === 'high' ? 'var(--accent-error)' : 
                                  idea.priority === 'medium' ? 'var(--accent-amber)' : 'var(--accent-emerald)'
                    }} 
                  />

                  <div className="flex-between items-start mb-2 mt-1">
                    <h3 className="font-bold text-lg leading-tight pr-4">{idea.title}</h3>
                    <div className="flex gap-1 shrink-0">
                      <button className="btn-icon xs text-primary hover:bg-primary/20" onClick={() => openEdit(idea)}><Edit3 size={14} /></button>
                      <button className="btn-icon xs text-error hover:bg-error/20" onClick={() => { if(confirm('Hapus ide ini?')) deleteContent(idea.id) }}><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {/* Priority & Project Link badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span className={`badge ${priorityCfg.color} text-xxs`}>
                      {priorityCfg.dot} {priorityCfg.label}
                    </span>
                    {linkedProject && (
                      <span className="badge badge-primary text-xxs flex items-center gap-1">
                        <Link size={8} /> {linkedProject.name}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-dim line-clamp-2 mb-4 h-10">{idea.description || 'No description provided.'}</p>
                  
                  <div className="flex-between items-end mt-auto pt-3 border-t border-subtle">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-1">
                        {platStyle && (
                          <span className={`badge ${platStyle.badge} text-xxs`}>
                            {PlatIcon && <PlatIcon size={10} />} {platStyle.short}
                          </span>
                        )}
                        {idea.tags && idea.tags.split(',').slice(0, 3).map(tag => (
                          <span key={tag} className="badge badge-ghost text-xxs"><Tag size={8} /> {tag.trim()}</span>
                        ))}
                      </div>
                      {idea.scheduledAt && (
                        <div className={`flex items-center gap-1 text-xxs ${isOverdue ? 'text-error font-bold' : isDueSoon ? 'text-warning' : 'text-dim'}`}>
                          <Calendar size={10} />
                          {isOverdue ? 'Overdue: ' : ''}{new Date(idea.scheduledAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <select 
                      className="form-input py-1 px-2 text-xs bg-surface/50 border-subtle w-auto cursor-pointer"
                      value={idea.status}
                      onChange={(e) => updateContent(idea.id, { status: e.target.value })}
                    >
                      <option value="idea">Idea</option>
                      <option value="research">Research</option>
                      <option value="ready">Ready</option>
                      <option disabled>──────────</option>
                      <option value="script">Move to Pipeline ➔</option>
                    </select>
                  </div>
                </motion.div>
              );
            })
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
              className="modal-content glass-card max-w-lg w-full p-6"
            >
              <h2 className="heading-md mb-4">{editingId ? 'Edit Idea' : 'New Content Idea'}</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
                
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Link to Project</label>
                    <select className="form-input" value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})}>
                      <option value="">-- No Linked Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scheduled / Due Date</label>
                    <input 
                      type="datetime-local" 
                      className="form-input" 
                      value={form.scheduledAt} 
                      onChange={e => setForm({...form, scheduledAt: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
                </div>
                
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Platform</label>
                    <select className="form-input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                      <option value="high">🔴 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="idea">Idea</option>
                      <option value="research">Research</option>
                      <option value="ready">Ready</option>
                      <option value="script">Scripting (Pipeline)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags (comma separated)</label>
                    <input type="text" className="form-input" placeholder="3dprinting, tutorial, review" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
                  </div>
                </div>
                
                <div className="flex-end gap-2 mt-4 pt-4 border-t border-subtle">
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Idea'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
