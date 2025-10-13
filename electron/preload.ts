const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script that exposes safe IPC methods to the renderer process
 * This creates a secure bridge between the renderer and main process
 */

interface DirectoryEntry {
  name: string;
  isDirectory: boolean;
}

interface ElectronAPI {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  listDirectory: (path: string) => Promise<DirectoryEntry[]>;
  exists: (path: string) => Promise<boolean>;
  openInIDE: (projectPath: string, ide: string) => Promise<{ success: boolean; usedFallback?: boolean }>;
  getDataPath: () => Promise<string>;
}

const electronAPI: ElectronAPI = {
  // File system operations
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
  createDirectory: (path: string) => ipcRenderer.invoke('fs:createDirectory', path),
  listDirectory: (path: string) => ipcRenderer.invoke('fs:listDirectory', path),
  exists: (path: string) => ipcRenderer.invoke('fs:exists', path),

  // IDE integration
  openInIDE: (projectPath: string, ide: string) => ipcRenderer.invoke('ide:open', projectPath, ide),

  // Get data directory path
  getDataPath: () => ipcRenderer.invoke('app:getDataPath'),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

export {};
