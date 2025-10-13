/**
 * Global type definitions for Electron IPC bridge
 */

export interface DirectoryEntry {
  name: string;
  isDirectory: boolean;
}

export interface ElectronAPI {
  // File system operations
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  listDirectory: (path: string) => Promise<DirectoryEntry[]>;
  exists: (path: string) => Promise<boolean>;

  // IDE integration
  openInIDE: (projectPath: string, ide: string) => Promise<{ success: boolean; usedFallback?: boolean }>;

  // Get data directory path
  getDataPath: () => Promise<string>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

export {};
