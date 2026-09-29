import React from 'react';
import {
  Folder, Zap, ChevronRight, CheckCircle, List, Sparkles,
  Activity, Package
} from 'lucide-react';
import { formatWeight, formatRelativeDate } from '../lib/utils';

export default function Dashboard({ spoolStats, projectStats, activity, onNavigate }) {

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">Selamat Datang, James</h1>
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
            <Folder size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{projectStats.activeProjects}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>

        <div className="glass-card stat-card" onClick={() => onNavigate('batching')}>
          <div className="stat-icon" style={{ background: 'var(--accent-cyan-soft)', color: 'var(--accent-cyan)' }}>
            <Zap size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{projectStats.activeBatches}</div>
            <div className="stat-label">Print Batches</div>
          </div>
        </div>

        <div className="glass-card stat-card" onClick={() => onNavigate('settings')}>
          <div className="stat-icon" style={{ background: 'var(--accent-amber-soft)', color: 'var(--accent-amber)' }}>
            <Package size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{spoolStats.totalSpools}</div>
            <div className="stat-label">Total Spools</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon" style={{
            background: projectStats.completionRate > 0 ? 'var(--accent-emerald-soft)' : 'var(--bg-elevated)',
            color: projectStats.completionRate > 0 ? 'var(--accent-emerald)' : 'var(--text-dim)'
          }}>
            <CheckCircle size={22} />
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
              <Folder size={16} /> Project Progress
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
              <Sparkles size={16} /> Smart Batching
            </div>
            <div className="glass-card p-4">
              <p className="text-sm text-dim mb-4">
                {projectStats.pendingWeight > 0
                  ? <>Ada <strong>{projectStats.pendingWeight}g</strong> material yang perlu di-batch untuk dicetak.</>
                  : 'Belum ada material yang perlu di-batch saat ini.'}
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
              <Activity size={16} /> Recent Activity
            </div>
            <div className="glass-card p-4">
              <div className="activity-list">
                {activity.slice(0, 5).map(item => (
                  <div key={item.id} className="activity-item py-2">
                    <div className="flex flex-col gap-0.5">
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
              <Package size={16} /> Filament Inventory
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