import React, { useMemo } from 'react';
import { Package, MoreVertical, ExternalLink, Calendar, Video, Eye, Heart, BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { PART_STATUSES } from '../../lib/constants';

function fmtCompact(n) {
  if (n == null || n === 0) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

const PLATFORM_DOT = {
  youtube_shorts: '#ff0033',
  instagram_reels: '#e4405f',
  facebook_reels: '#1877f2',
  tiktok: '#ffffff',
};

export default function ProjectCard({ project, socialPosts = [], onClick }) {
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

  const socialSummary = useMemo(() => {
    if (!socialPosts || socialPosts.length === 0) return null;
    let views = 0, likes = 0, topScore = 0, erSum = 0, erN = 0;
    const platCounts = {};
    for (const p of socialPosts) {
      views += Number(p.views) || 0;
      likes += Number(p.likes) || 0;
      const sc = Number(p.contentScore) || 0;
      if (sc > topScore) topScore = sc;
      const er = Number(p.engagementRate) || 0;
      if (Number(p.views) > 0) { erSum += er; erN++; }
      platCounts[p.platform] = (platCounts[p.platform] || 0) + 1;
    }
    const avgEr = erN > 0 ? Math.round(erSum / erN) : 0;
    return { count: socialPosts.length, views, likes, topScore, avgEr, platCounts };
  }, [socialPosts]);

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

      {socialSummary && (
        <div
          className="project-card-social"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            flexWrap: 'wrap',
            padding: '0.55rem 0.85rem',
            margin: '0.6rem 0.85rem 0',
            borderRadius: '10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.7rem',
            lineHeight: 1,
          }}
        >
          <span className="flex items-center gap-1 font-semibold" style={{ color: 'var(--text)' }}>
            <Video size={11} className="opacity-80" /> {socialSummary.count} post{socialSummary.count > 1 ? 's' : ''}
          </span>
          <span style={{ opacity: 0.25 }}>·</span>
          <span className="flex items-center gap-1 text-dim">
            <Eye size={11} /> {fmtCompact(socialSummary.views)}
          </span>
          <span className="flex items-center gap-1 text-dim">
            <Heart size={11} /> {fmtCompact(socialSummary.likes)}
          </span>
          <span className="flex items-center gap-1" style={{ color: socialSummary.avgEr >= 700 ? 'var(--success, #22c55e)' : 'var(--text-dim)' }}>
            <TrendingUp size={11} /> {(socialSummary.avgEr / 100).toFixed(1)}% ER
          </span>
          <span className="flex items-center gap-1" style={{ color: socialSummary.topScore >= 10000 ? 'var(--success, #22c55e)' : 'var(--text-dim)' }}>
            <BarChart3 size={11} /> {fmtCompact(socialSummary.topScore)}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            {Object.entries(socialSummary.platCounts).map(([plat, n]) => (
              <span
                key={plat}
                title={`${plat}: ${n} post`}
                style={{
                  width: 7, height: 7, borderRadius: 999,
                  background: PLATFORM_DOT[plat] || 'var(--text-dim)',
                  display: 'inline-block',
                  border: '1px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.25)',
                }}
              />
            ))}
          </span>
        </div>
      )}

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
