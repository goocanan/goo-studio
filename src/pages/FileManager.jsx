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
  Layers,
  Calculator,
  RefreshCw,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeSTLFile } from '../lib/stl';
import { MATERIALS } from '../lib/constants';
import { DEFAULT_PRICING } from '../lib/pricing';

// Recursively gather every printable file beneath a folder: its own files plus
// everything inside its subfolders (e.g. "Project Name / STL / part.stl").
const collectSubtreeParts = (node) => {
  const parts = [];
  if (node.parts && node.parts.length) parts.push(...node.parts);
  if (node.children) {
    for (const child of node.children) parts.push(...collectSubtreeParts(child));
  }
  return parts;
};

// A folder that holds printable files directly — the "file folder" (e.g. "STL").
const isFileFolder = (node) => !!(node.parts && node.parts.length > 0);

// A "project name" folder is the folder directly above a file folder: one of its
// subfolders contains printable files (e.g. "Benchy" -> "STL" -> benchy.stl).
const isProjectFolder = (node) =>
  !!(node.children && node.children.some(isFileFolder));

// True when a deeper project folder exists, so an outer folder never steals the button
// from the projects nested inside it.
const hasProjectFolderBelow = (node) =>
  !!(node.children && node.children.some(child => isProjectFolder(child) || hasProjectFolderBelow(child)));

// Only .stl files can be priced (the calculator parses STL geometry). Filter the
// subtree down to those so we know whether the price button is worth showing.
const isStlPart = (part) => /\.stl$/i.test(part?.name || '');
const collectStlParts = (node) => collectSubtreeParts(node).filter(isStlPart);

// First image found in the folder or any of its subfolders, used as the project thumbnail.
const collectThumbnail = (node) => {
  if (node.thumbnail) return node.thumbnail;
  if (node.children) {
    for (const child of node.children) {
      const found = collectThumbnail(child);
      if (found) return found;
    }
  }
  return null;
};

const FolderNode = ({ node, depth, onImport, onCalculate, busyPath, isExpanded, expandedStates, onToggle }) => {
  const hasSubfolders = node.children && node.children.length > 0;
  const hasFiles = node.parts && node.parts.length > 0;

  // The Import button belongs to the *project name* folder — the one sitting directly
  // above the folder that holds the files (e.g. "Benchy / STL / benchy.stl"). It shows
  // when one of this folder's subfolders contains printable files. A category/type
  // folder higher up (whose subfolders are project folders, not file folders) is never
  // treated as a project, and neither is the file folder itself.
  const canImport = isProjectFolder(node) && !hasProjectFolderBelow(node);

  // A project folder imports its whole subtree (its own files plus every subfolder's).
  const importParts = collectSubtreeParts(node);
  const importThumbnail = collectThumbnail(node);
  const stlParts = collectStlParts(node);
  const canCalculate = canImport && stlParts.length > 0;
  const isCalculating = busyPath === node.path;

  return (
    <div className="folder-tree-node" style={{ marginLeft: depth > 0 ? '16px' : '0' }}>
      <div className={`folder-row ${canImport ? 'has-files' : ''} ${depth === 0 ? 'root-node' : ''}`}>
        <div className="folder-row-main" onClick={() => (hasSubfolders || hasFiles) && onToggle(node.path)}>
          <div className="folder-expander">
            {(hasSubfolders || hasFiles) ? (
              isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            ) : <div className="w-4" />}
          </div>
          <Folder 
            size={18} 
            className={canImport ? 'text-primary' : 'text-dim'} 
            fill={canImport ? 'currentColor' : 'none'} 
            fillOpacity={0.1} 
          />
          <span className="folder-name">{node.name}</span>
          {canImport && <span className="parts-count-badge">{importParts.length}</span>}
        </div>
        
        <div className="folder-row-actions">
          {canCalculate && (
            <button
              className="btn btn-secondary btn-xxs shadow-sm"
              title={`Hitung harga jual dari ${stlParts.length} file STL di folder ini (tanpa perlu upload ulang)`}
              disabled={!!busyPath}
              onClick={(e) => {
                e.stopPropagation();
                onCalculate(node);
              }}
            >
              {isCalculating ? <RefreshCw size={12} className="spin" /> : <Calculator size={12} />}
              {isCalculating ? 'Menghitung...' : 'Hitung Harga'}
            </button>
          )}
          {canImport && (
            <button
              className="btn btn-primary btn-xxs shadow-sm"
              title="Import folder project ini (termasuk file di dalam subfolder)"
              onClick={(e) => {
                e.stopPropagation();
                onImport({ ...node, parts: importParts, thumbnail: importThumbnail });
              }}
            >
              <Plus size={12} /> Import Project
            </button>
          )}
        </div>
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
                onCalculate={onCalculate}
                busyPath={busyPath}
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

export default function FileManager({ fileManager, onImportProject, onCalculateProject }) {
  const { 
    scannedProjects, // [rootNode]
    isScanning, 
    selectDirectory, 
    clearHistory, 
    rootName 
  } = fileManager;
  
  const [expanded, setExpanded] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [busyPath, setBusyPath] = useState(null);
  const [notice, setNotice] = useState(null); // { type, message }

  const toggleFolder = (path) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Read every STL in the chosen project folder straight from the local disk
  // (via the stored file handles), analyse the geometry, and hand the parsed
  // items to the pricing calculator — no re-upload needed.
  const handleCalculate = async (node) => {
    const stls = collectStlParts(node);
    if (stls.length === 0) return;

    setBusyPath(node.path);
    setNotice(null);

    const { getFileData } = fileManager;
    const parsed = [];
    let unreadable = 0;
    let noHandle = 0;

    for (const part of stls) {
      try {
        const file = await getFileData(part.path);
        if (!file) {
          noHandle += 1;
          continue;
        }
        const geo = await analyzeSTLFile(file);
        parsed.push({
          id: `stl-fm-${Date.now()}-${parsed.length}`,
          name: part.name,
          size: file.size,
          quantity: 1,
          material: MATERIALS[0],
          printHours: DEFAULT_PRICING.printHours,
          ...geo,
          error: null,
        });
      } catch {
        unreadable += 1;
      }
    }

    setBusyPath(null);

    if (parsed.length === 0) {
      setNotice({
        type: 'err',
        message:
          noHandle > 0
            ? 'Akses file hilang setelah halaman dimuat ulang. Klik "Select Folder" lalu pilih folder library-nya sekali lagi.'
            : 'File STL di folder ini tidak bisa dibaca (format tidak dikenal atau file rusak).',
      });
      return;
    }

    const detail =
      unreadable > 0
        ? `${parsed.length} file STL dikirim ke kalkulator (${unreadable} file gagal dibaca).`
        : `${parsed.length} file STL dari "${node.name}" dikirim ke kalkulator harga jual.`;
    setNotice({ type: unreadable > 0 ? 'warn' : 'ok', message: detail });
    onCalculateProject?.(parsed, node.name, unreadable);
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

      {notice && (
        <div className={`file-notice ${notice.type}`}>
          {notice.type === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notice.message}</span>
          <button className="btn-icon" onClick={() => setNotice(null)} title="Tutup">
            <X size={14} />
          </button>
        </div>
      )}

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
                onCalculate={handleCalculate}
                busyPath={busyPath}
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
            Klik folder untuk menelusuri subfolder. Tombol <strong>Import Project</strong> muncul di folder <strong>nama project</strong> — folder yang berisi subfolder file (mis. <em>Project / STL / part.stl</em>) — dan akan mengimpor seluruh file di dalam subfolder tersebut. Tombol tidak muncul di folder jenis/kategori di atasnya maupun di folder file itu sendiri. Tombol <strong>Hitung Harga</strong> (di sebelahnya) membaca semua file <strong>.stl</strong> di folder itu dan langsung mengirimnya ke <em>Kalkulator Harga Jual</em> — tanpa perlu upload ulang.
          </p>
        </div>
      </div>
    </div>
  );
}
