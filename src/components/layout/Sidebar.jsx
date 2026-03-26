import React from 'react';
import { LayoutDashboard, FolderKanban, Zap, Cylinder, Settings, FolderSearch, LogOut } from 'lucide-react';
import { signOut } from '../../lib/auth-client';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'batching', label: 'Batching', icon: Zap },
  { id: 'files', label: 'Files', icon: FolderSearch },
  { id: 'filament', label: 'Filament', icon: Cylinder },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar flex flex-col h-full">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">G</div>
        <span className="sidebar-logo-text">GOO-Studio</span>
      </div>

      <nav className="sidebar-nav flex-1">
        {NAV_ITEMS.map(item => {
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
