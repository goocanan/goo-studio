import React from 'react';
import { LayoutDashboard, Folder, Zap, ChevronRight, CheckCircle, List, Lightbulb, CalendarClock, Send, Video, PlaySquare } from 'lucide-react';
import { formatWeight, formatRelativeDate } from '../lib/utils';
import { useContent } from '../hooks/useContent';

export default function Dashboard({ spoolStats, projectStats, activity, onNavigate }) {
  const { contents } = useContent();

  // Content stats
  const contentIdeas = contents.filter(c => ['idea', 'research', 'ready'].includes(c.status)).length;
  const scheduledPosts = contents.filter(c => c.status === 'scheduled').length;
  const publishedPosts = contents.filter(c => c.status === 'published').length;
  const inPipeline = contents.filter(c => ['script', 'recording', 'editing', 'review'].includes(c.status)).length;

  // Recent content (last 5 updated)
  const recentContent = [...contents]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 4);

  const getStatusColor = (status) => {
    const colors = {
      idea: 'badge-ghost', research: 'badge-ghost', ready: 'badge-ghost',
      script: 'badge-primary', recording: 'badge-primary', editing: 'badge-primary',
      review: 'badge-warning', scheduled: 'badge-info', published: 'badge-success'
    };
    return colors[status] || 'badge-ghost';
  };

  const getPlatformIcon = (platform) => {
    if (platform === 'YouTube') return <Video size={10} />;
    if (platform === 'TikTok') return <PlaySquare size={10} />;
    return null;
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">Selamat Datang, James 👋</h1>
          <p className="page-subtitle">
            {projectStats.activeBatches > 0 
              ? `Ada ${projectStats.activeBatches} batch yang sedang aktif` 
              : 'Semua proyek berjalan lancar'}
          </p>
        </div>
      </div>

      {/* Production Stats */}
      <div className="grid-stats mb-8">
        <div className="glass-card stat-card" onClick={() => onNavigate('projects')}>
          <div className="stat-icon" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
            <Folder />
          </div>
          <div className="stat-info">
            <div className="stat-value">{projectStats.activeProjects}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>

        <div className="glass-card stat-card" onClick={() => onNavigate('batching')}>
          <div className="stat-icon" style={{ background: 'var(--accent-cyan-soft)', color: 'var(--accent-cyan)' }}>
            <Zap />
          </div>
          <div className="stat-info">
            <div className="stat-value">{projectStats.activeBatches}</div>
            <div className="stat-label">Print Batches</div>
          </div>
        </div>

        <div className="glass-card stat-card" onClick={() => onNavigate('settings')}>
          <div className="stat-icon" style={{ background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}>
            <List />
          </div>
          <div className="stat-info">
            <div className="stat-value">{spoolStats.totalSpools}</div>
            <div className="stat-label">Total Spools</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)' }}>
            <CheckCircle />
          </div>
          <div className="stat-info">
            <div className="stat-value">{projectStats.completionRate}%</div>
            <div className="stat-label">Completion</div>
          </div>
        </div>
      </div>

      {/* Content Overview Stats */}
      <section className="section mb-8">
        <div className="section-header">
          <span>🎬</span> Content Overview
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 interactive" onClick={() => onNavigate('content-ideas')}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}>
                <Lightbulb size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold">{contentIdeas}</div>
                <div className="text-xxs text-dim uppercase tracking-wider">Ideas</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 interactive" onClick={() => onNavigate('content-pipeline')}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)' }}>
                <Zap size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold">{inPipeline}</div>
                <div className="text-xxs text-dim uppercase tracking-wider">In Pipeline</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 interactive" onClick={() => onNavigate('content-pipeline')}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-cyan-soft)', color: 'var(--accent-cyan)' }}>
                <CalendarClock size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold">{scheduledPosts}</div>
                <div className="text-xxs text-dim uppercase tracking-wider">Scheduled</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 interactive" onClick={() => onNavigate('content-pipeline')}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-emerald-soft)', color: 'var(--accent-emerald)' }}>
                <Send size={20} />
              </div>
              <div>
                <div className="text-2xl font-bold">{publishedPosts}</div>
                <div className="text-xxs text-dim uppercase tracking-wider">Published</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="layout-split">
        <div className="layout-main">
          <section className="section mb-6">
            <div className="section-header">
              <span>📁</span> Project Progress
            </div>
            <div className="glass-card p-4">
              <div className="project-progress-list">
                <div className="flex-between mb-1">
                  <span className="text-sm font-semibold">Total Completion</span>
                  <span className="text-sm text-dim">{projectStats.doneParts}/{projectStats.totalParts} parts</span>
                </div>
                <div className="progress-bar mb-4" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${projectStats.completionRate}%`, background: 'var(--accent-primary)' }} 
                  />
                </div>
                <button className="btn btn-text btn-sm" onClick={() => onNavigate('projects')}>
                  Lihat semua proyek <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <span>⚡</span> Smart Batching
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-dim mb-4">
                Ada <strong>{projectStats.pendingWeight}g</strong> material yang perlu di-batch untuk dicetak.
              </p>
              <button className="btn btn-secondary btn-full btn-sm" onClick={() => onNavigate('batching')}>
                Optimize Print Queue <ChevronRight size={14} />
              </button>
            </div>
          </section>
        </div>

        <div className="layout-sidebar">
          {/* Recent Content */}
          <section className="section mb-6">
            <div className="section-header">
              <span>🎬</span> Recent Content
            </div>
            <div className="glass-card p-4">
              {recentContent.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-dim text-sm italic mb-3">Belum ada konten.</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('content-ideas')}>
                    <Lightbulb size={14} /> Mulai Buat Ide
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentContent.map(item => (
                    <div key={item.id} className="flex-between items-start py-2 border-b border-subtle last:border-0">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {item.platform && (
                            <span className="text-xxs text-dim flex items-center gap-1">
                              {getPlatformIcon(item.platform)} {item.platform}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${getStatusColor(item.status)} text-xxs shrink-0 ml-2`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                  <button className="btn btn-text btn-sm mt-1" onClick={() => onNavigate('content-pipeline')}>
                    Lihat Pipeline <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="section mb-6">
            <div className="section-header">
              <span>📋</span> Recent Activity
            </div>
            <div className="glass-card p-4">
              <div className="activity-list">
                {activity.slice(0, 5).map(item => (
                  <div key={item.id} className="activity-item py-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-dim">{formatRelativeDate(item.timestamp)}</span>
                      <span className="text-sm">{item.message}</span>
                    </div>
                  </div>
                ))}
                {activity.length === 0 && <p className="text-dim text-sm italic">Belum ada aktivitas.</p>}
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <span>🧶</span> Filament Inventory
            </div>
            <div className="glass-card p-4">
              <div className="stat-row flex-between mb-2">
                <span className="text-sm">Total Stok</span>
                <span className="text-sm font-bold">{formatWeight(spoolStats.totalWeight)}</span>
              </div>
              <button className="btn btn-secondary btn-full btn-sm" onClick={() => onNavigate('settings')}>
                Manage Inventory <ChevronRight size={14} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
