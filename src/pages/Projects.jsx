import React, { useState, useMemo } from 'react';
import { Plus, Search, Grid, List, Layout, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ProjectCard from '../components/project/ProjectCard';

export default function Projects({ 
  projects, onAddProject, onViewDetail 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  // Statistics
  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter(p => p.status === 'printing' || p.status === 'ready').length,
    done: projects.filter(p => p.status === 'done').length,
    idea: projects.filter(p => p.status === 'idea').length,
  }), [projects]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text-hero">📁 Project Center</h1>
          <p className="page-subtitle">Kelola komponen cetak dan progress proyek</p>
        </div>
        <button className="btn btn-primary" onClick={onAddProject}>
          <Plus size={18} /> Add Project
        </button>
      </div>

      {/* Projects Summary Section */}
      <div className="projects-summary">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
            <Layout size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Projects</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-cyan-soft)', color: 'var(--accent-cyan)' }}>
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.active}</span>
            <span className="stat-label">Active / Ready</span>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)' }}>
            <CheckCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.done}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="glass-card stat-card" style={{ opacity: 0.7 }}>
          <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>
            <Clock size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.idea}</span>
            <span className="stat-label">Draft / Ideas</span>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-row">
          <div className="search-bar">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search by name or notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={18} />
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3 className="heading-md mb-2">Belum ada proyek</h3>
          <p className="mb-4">Mulai dengan membuat proyek baru dan tambahkan komponen cetak.</p>
          <button className="btn btn-secondary" onClick={() => setShowAddModal(true)}>
            Create First Project
          </button>
        </div>
      ) : (
        <motion.div 
          layout
          className={`projects-${viewMode}`}
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              layout
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProjectCard 
                project={project} 
                onClick={() => onViewDetail(project.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
