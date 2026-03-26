import React, { useState, useMemo } from 'react';
import { 
  FolderSearch, 
  Plus, 
  Folder, 
  File, 
  ChevronRight, 
  ChevronDown,
  HardDrive,
  Trash2,
  AlertCircle,
  Search,
  Box,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FolderNode = ({ node, depth, onImport, isExpanded, expandedStates, onToggle }) => {
  const hasSubfolders = node.children && node.children.length > 0;
  const hasFiles = node.parts && node.parts.length > 0;
  
  return (
    <div className="folder-tree-node" style={{ marginLeft: depth > 0 ? '16px' : '0' }}>
      <div className={`folder-row ${hasFiles ? 'has-files' : ''} ${depth === 0 ? 'root-node' : ''}`}>
        <div className="folder-row-main" onClick={() => (hasSubfolders || hasFiles) && onToggle(node.path)}>
          <div className="folder-expander">
            {(hasSubfolders || hasFiles) ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : <div className="w-4" />}
          </div>
          <Folder 
            size={18} 
            className={hasFiles ? 'text-primary' : 'text-dim'} 
            fill={hasFiles ? 'currentColor' : 'none'} 
            fillOpacity={0.1} 
          />
          <span className="folder-name">{node.name}</span>
          {hasFiles && <span className="parts-count-badge">{node.parts.length}</span>}
        </div>
        
        {hasFiles && (
          <button 
            className="btn btn-primary btn-xxs shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onImport(node);
            }}
          >
            <Plus size={12} /> Import Project
          </button>
        )}
      </div>
      
      <AnimatePresence>
        {isExpanded && (hasSubfolders || hasFiles) && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="folder-children"
          >
            {/* Subfolders */}
            {node.children.map(child => (
              <FolderNode 
                key={child.path} 
                node={child} 
                depth={depth + 1} 
                onImport={onImport}
                isExpanded={expandedStates[child.path]}
                expandedStates={expandedStates}
                onToggle={onToggle}
              />
            ))}

            {/* Files (Parts) */}
            {node.parts.map((part, idx) => (
              <div key={`${node.path}-${idx}`} className="file-row">
                <File size={14} className="text-dim/50" />
                <span className="file-name">{part.name}</span>
                <span className="file-type-badge">{part.type}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FileManager({ fileManager, onImportProject }) {
  const { 
    scannedProjects, // [rootNode]
    isScanning, 
    selectDirectory, 
    clearHistory, 
    rootName 
  } = fileManager;
  
  const [expanded, setExpanded] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleFolder = (path) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const calculateTotalParts = (node) => {
    if (!node) return 0;
    let count = node.parts?.length || 0;
    if (node.children) {
      count += node.children.reduce((acc, child) => acc + calculateTotalParts(child), 0);
    }
    return count;
  };

  const totalParts = useMemo(() => {
    return scannedProjects.length > 0 ? calculateTotalParts(scannedProjects[0]) : 0;
  }, [scannedProjects]);

  return (
    <div className="animate-in max-w-4xl mx-auto">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="heading-xl gradient-text">📁 File Manager</h1>
          <p className="page-subtitle">Pindai & kelola library file 3D Anda dalam hirarki folder (Depth: 6)</p>
        </div>
        <div className="flex gap-2">
          {scannedProjects.length > 0 && (
            <button className="btn btn-ghost" onClick={clearHistory}>
              <Trash2 size={18} /> Reset
            </button>
          )}
          <button className="btn btn-primary" onClick={selectDirectory} disabled={isScanning}>
            <FolderSearch size={18} /> {isScanning ? 'Scanning...' : 'Select Folder'}
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="glass-card p-4 mb-6 flex items-center justify-between border-accent-primary/20">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${rootName !== 'Belum Terhubung' ? 'bg-success/10 text-success' : 'bg-surface text-dim'}`}>
            <HardDrive size={20} />
          </div>
          <div>
            <div className="text-xs text-dim uppercase tracking-wider font-bold">Local Directory</div>
            <div className="text-sm font-semibold">{rootName}</div>
          </div>
        </div>
        <div className="flex gap-8">
          <div className="text-right">
            <div className="text-xxs text-dim uppercase">Parts Found</div>
            <div className="text-lg font-bold text-primary">{totalParts}</div>
          </div>
        </div>
      </div>

      {scannedProjects.length === 0 ? (
        <div className="glass-card p-20 text-center bg-transparent border-dashed">
          <div className="mb-6 opacity-20">
            <FolderSearch size={80} className="mx-auto" />
          </div>
          <h2 className="heading-md mb-2">Library Belum Terhubung</h2>
          <p className="text-dim max-w-sm mx-auto mb-8">
            Hubungkan folder utama tempat Anda menyimpan file .stl atau .3mf untuk navigasi yang lebih mudah.
          </p>
          <button className="btn btn-primary btn-lg mx-auto" onClick={selectDirectory}>
            <FolderSearch size={22} /> Pilih Folder Library
          </button>
        </div>
      ) : (
        <div className="glass-card p-6 min-h-[400px]">
          <div className="search-bar mb-6">
            <Search size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Filter folder name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="folder-tree-container">
            {scannedProjects.map(root => (
              <FolderNode 
                key={root.path} 
                node={root} 
                depth={0} 
                onImport={onImportProject}
                isExpanded={expanded[root.path]}
                expandedStates={expanded}
                onToggle={toggleFolder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Simplified Help */}
      <div className="mt-8 p-4 glass-card border-none bg-white/5">
        <div className="flex gap-3 items-center">
          <AlertCircle className="text-primary/50" size={18} />
          <p className="text-xs text-dim">
            Klik folder untuk menelusuri subfolder. Gunakan tombol <strong>Import Project</strong> pada folder yang berisi file untuk membawanya ke daftar proyek aktif.
          </p>
        </div>
      </div>
    </div>
  );
}
