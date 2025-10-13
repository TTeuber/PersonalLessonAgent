import type { DirectoryEntry } from '../../types/global';

/**
 * FileSystemService provides a clean interface for file operations
 * using Electron IPC under the hood
 */
export class FileSystemService {
  /**
   * Read a file's contents
   * @param path - Relative path from data directory
   */
  async readFile(path: string): Promise<string> {
    return window.electron.readFile(path);
  }

  /**
   * Write content to a file
   * @param path - Relative path from data directory
   * @param content - Content to write
   */
  async writeFile(path: string, content: string): Promise<void> {
    return window.electron.writeFile(path, content);
  }

  /**
   * Read and parse a JSON file
   * @param path - Relative path from data directory
   */
  async readJSON<T>(path: string): Promise<T> {
    const content = await this.readFile(path);
    return JSON.parse(content);
  }

  /**
   * Write an object as JSON to a file
   * @param path - Relative path from data directory
   * @param data - Object to serialize and write
   */
  async writeJSON(path: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    return this.writeFile(path, content);
  }

  /**
   * Create a directory
   * @param path - Relative path from data directory
   */
  async createDirectory(path: string): Promise<void> {
    return window.electron.createDirectory(path);
  }

  /**
   * List entries in a directory
   * @param path - Relative path from data directory
   */
  async listDirectory(path: string): Promise<DirectoryEntry[]> {
    return window.electron.listDirectory(path);
  }

  /**
   * Check if a file or directory exists
   * @param path - Relative path from data directory
   */
  async exists(path: string): Promise<boolean> {
    return window.electron.exists(path);
  }

  /**
   * Get the absolute path to the data directory
   */
  async getDataPath(): Promise<string> {
    return window.electron.getDataPath();
  }

  /**
   * Open a project in the user's preferred IDE
   * @param projectPath - Absolute path to project directory
   * @param ide - IDE identifier (e.g., 'webstorm', 'code')
   */
  async openInIDE(projectPath: string, ide: string): Promise<{ success: boolean; usedFallback?: boolean }> {
    return window.electron.openInIDE(projectPath, ide);
  }
}

// Export a singleton instance
export const fileSystemService = new FileSystemService();
