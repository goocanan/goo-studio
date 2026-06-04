import React from 'react';
import { LayoutDashboard, FolderKanban, Zap, Settings, FolderSearch, LogOut, Lightbulb, KanbanSquare } from 'lucide-react';
import { signOut } from '../../lib/auth-client';

const PRODUCTION_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'batching', label: 'Batching', icon: Zap },
  { id: 'files', label: 'Files', icon: FolderSearch },
];

const CONTENT_NAV = [
  { id: 'content-ideas', label: 'Ideas', icon: Lightbulb },
  { id: 'content-pipeline', label: 'Pipeline', icon: KanbanSquare },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar flex flex-col h-full">
      <div className="sidebar-logo" onClick={() => onNavigate('dashboard')} style={{ cursor: 'pointer' }}>
        <img src="/logo.png" alt="GOO-Studio Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '10px' }} />
        <span className="sidebar-logo-text">GOO-Studio</span>
      </div>

      <nav className="sidebar-nav flex-1 overflow-y-auto">
        <div className="sidebar-section-title px-4 text-xs font-bold text-dim uppercase tracking-wider mb-2 mt-4">Production</div>
        {PRODUCTION_NAV.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="sidebar-section-title px-4 text-xs font-bold text-dim uppercase tracking-wider mb-2 mt-6">Content</div>
        {CONTENT_NAV.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}

        <div className="sidebar-section-title px-4 text-xs font-bold text-dim uppercase tracking-wider mb-2 mt-6">System</div>
        <button
          className={`sidebar-link ${activePage === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <Settings />
          <span>Settings</span>
        </button>
      </nav>

      <div className="px-4 mb-4">
        <button 
          className="sidebar-link w-full text-error hover:bg-error/10" 
          onClick={async () => {
            await signOut();
            window.location.reload();
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <div className="sidebar-version">GOO-Studio v1.1</div>
    </aside>
  );
}
