import React from 'react';
import { LayoutDashboard, Folder, Zap, ChevronRight, CheckCircle, List } from 'lucide-react';
import { formatWeight, formatRelativeDate } from '../lib/utils';

export default function Dashboard({ spoolStats, projectStats, activity, onNavigate }) {
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
