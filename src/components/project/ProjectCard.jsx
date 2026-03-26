import React from 'react';
import { Package, MoreVertical, ExternalLink, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { PART_STATUSES } from '../../lib/constants';

export default function ProjectCard({ project, onClick }) {
  const totalParts = project.parts?.length || 0;
  const totalUnits = project.parts?.reduce((sum, p) => sum + (parseInt(p.quantity) || 1), 0) || 0;
  const doneParts = project.parts?.filter(p => p.status === PART_STATUSES.DONE).length || 0;
  const progress = totalParts > 0 ? Math.round((doneParts / totalParts) * 100) : 0;
  
  // Get unique colors/materials in project
  const materials = [...new Set(project.parts?.map(p => p.material))].filter(Boolean);
  const colors = [...new Set(project.parts?.map(p => p.color))].filter(Boolean);

  const dateStr = project.createdAt ? new Date(project.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
  }) : 'No date';

  return (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      className="glass-card project-card" 
      onClick={() => onClick(project)}
    >
      <div className="project-card-image-wrapper">
        {project.image ? (
          <img 
            src={typeof project.image === 'string' ? project.image : (project.image instanceof File ? URL.createObjectURL(project.image) : '')} 
            className="project-card-image" 
            alt={project.name} 
          />
        ) : (
          <div className="project-card-image-placeholder">
            <Package size={40} className="opacity-20" />
          </div>
        )}
        <div className="project-card-badge status">
          {project.status.toUpperCase()}
        </div>
      </div>

      <div className="project-card-header">
        <div className="flex-col">
          <h3 className="project-card-title">{project.name}</h3>
          <div className="project-card-stat" style={{ marginTop: '0.25rem' }}>
            <Calendar size={12} />
            <span style={{ fontSize: '0.7rem' }}>Created {dateStr}</span>
          </div>
        </div>
      </div>

      <div className="project-card-summary">
        {project.notes && (
          <p className="text-dim mb-3" style={{ fontSize: '0.8rem', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {project.notes}
          </p>
        )}
        
        <div className="project-card-stat">
          <Package size={14} />
          <span>{doneParts} / {totalParts} parts ({totalUnits} units)</span>
        </div>
        
        <div className="project-card-tags">
          {materials.map(m => (
            <span key={m} className="tag-outline">{m}</span>
          ))}
          {materials.length === 0 && <span className="text-muted italic" style={{ fontSize: '0.7rem' }}>No parts added</span>}
        </div>
      </div>

      <div className="project-progress-container">
        <div className="project-progress-label">
          <span>Completion Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-bar">
          <motion.div 
            className="progress-bar-fill" 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ 
              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))'
            }} 
          />
        </div>
      </div>

      <div className="project-card-footer">
        <div className="project-colors">
          {colors.map((c, i) => (
            <div 
              key={i} 
              className="color-dot-small" 
              title={c}
              style={{ background: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.3)' }}
            />
          ))}
          {colors.length === 0 && <span className="text-muted" style={{ fontSize: '0.7rem' }}>-</span>}
        </div>
        <button className="btn-text" onClick={(e) => { e.stopPropagation(); onClick(project); }}>
          View Detail <ExternalLink size={14} />
        </button>
      </div>
    </motion.div>
  );
}
