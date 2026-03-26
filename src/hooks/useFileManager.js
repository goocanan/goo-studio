import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'goo-studio-files';

export function useFileManager() {
  const [scannedProjects, setScannedProjects] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isScanning, setIsScanning] = useState(false);
  const [rootHandle, setRootHandle] = useState(null);

  // Note: FileSystemHandles cannot be serialized to LocalStorage easily.
  // We store the results (names/paths) and re-link handles upon re-selection.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scannedProjects));
  }, [scannedProjects]);

  const [fileHandles, setFileHandles] = useState({}); // path -> handle map

  const selectDirectory = async () => {
    if (!window.showDirectoryPicker) {
      alert('Browser Anda tidak mendukung File System Access API. Gunakan Chrome atau Edge.');
      return;
    }

    try {
      const handle = await window.showDirectoryPicker();
      setRootHandle(handle);
      await scanDirectory(handle);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Directory selection failed:', err);
      }
    }
  };

  const scanDirectory = async (handle) => {
    setIsScanning(true);
    const newHandles = {};
    const extensions = ['.stl', '.3mf', '.step', '.obj', '.gcode', '.3d'];
    const imgExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const MAX_DEPTH = 6;

    const walk = async (currentHandle, depth, currentPath) => {
      if (depth > MAX_DEPTH) return null;

      const node = {
        name: currentHandle.name,
        path: currentPath || currentHandle.name,
        kind: 'directory',
        parts: [],
        children: [],
        thumbnail: null
      };

      try {
        const entries = [];
        for await (const entry of currentHandle.values()) {
          entries.push(entry);
        }

        // Process files and collect subdirectories
        for (const entry of entries) {
          if (entry.kind === 'file') {
            const fileName = entry.name.toLowerCase();
            if (extensions.some(ext => fileName.endsWith(ext))) {
              const partPath = `${node.path}/${entry.name}`;
              node.parts.push({ 
                name: entry.name, 
                size: 'Local',
                type: entry.name.split('.').pop().toUpperCase(),
                path: partPath
              });
              newHandles[partPath] = entry;
            } else if (imgExtensions.some(ext => fileName.endsWith(ext))) {
              // Set as thumbnail if not already set or if it's named 'thumbnail'
              if (!node.thumbnail || fileName.includes('thumb')) {
                const imgPath = `${node.path}/${entry.name}`;
                node.thumbnail = imgPath;
                newHandles[imgPath] = entry;
              }
            }
          } else if (entry.kind === 'directory') {
            const childNode = await walk(entry, depth + 1, currentPath ? `${currentPath}/${entry.name}` : entry.name);
            if (childNode) {
              node.children.push(childNode);
            }
          }
        }

        node.children.sort((a, b) => a.name.localeCompare(b.name));
        return node;
      } catch (e) {
        console.warn(`Could not scan folder: ${currentHandle.name}`, e);
        return node;
      }
    };

    try {
      const tree = await walk(handle, 0, '');
      setFileHandles(newHandles);
      setScannedProjects(tree ? [tree] : []);
    } catch (err) {
      console.error('Scanning error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const getFileData = async (path) => {
    const handle = fileHandles[path];
    if (!handle) return null;
    return await handle.getFile();
  };

  const clearHistory = () => {
    setScannedProjects([]);
    setRootHandle(null);
    setFileHandles({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    scannedProjects,
    isScanning,
    selectDirectory,
    clearHistory,
    getFileData,
    rootName: rootHandle?.name || 'Belum Terhubung'
  };
}
