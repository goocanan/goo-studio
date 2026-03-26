import React from 'react';
import { LayoutDashboard, FolderKanban, Zap, Cylinder, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'batching', label: 'Batch', icon: Zap },
  { id: 'filament', label: 'Filament', icon: Cylinder },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-items">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`bottom-nav-btn ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
