const { ipcMain, app } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

/**
 * Get the data directory path based on environment
 * Development: ~/personal-lesson-agent-data/
 * Production: userData/learning-data/
 */
function getDataDirectory(): string {
  if (process.env.NODE_ENV === 'development') {
    return path.join(os.homedir(), 'personal-lesson-agent-data');
  }
  return path.join(app.getPath('userData'), 'learning-data');
}

/**
 * Ensure the data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  const dataDir = getDataDirectory();
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    console.log('Created data directory:', dataDir);
  }
}

/**
 * Register all file system IPC handlers
 */
function registerFileSystemHandlers(): void {
  // Ensure data directory exists on startup
  ensureDataDirectory().catch(console.error);

  // Get data path
  ipcMain.handle('app:getDataPath', () => {
    return getDataDirectory();
  });

  // Read file
  ipcMain.handle('fs:readFile', async (_event: any, filePath: string) => {
    try {
      const fullPath = path.join(getDataDirectory(), filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      return content;
    } catch (error) {
      console.error('Error reading file:', filePath, error);
      throw error;
    }
  });

  // Write file
  ipcMain.handle('fs:writeFile', async (_event: any, filePath: string, content: string) => {
    try {
      const fullPath = path.join(getDataDirectory(), filePath);
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
      console.log('File written:', filePath);
    } catch (error) {
      console.error('Error writing file:', filePath, error);
      throw error;
    }
  });

  // Create directory
  ipcMain.handle('fs:createDirectory', async (_event: any, dirPath: string) => {
    try {
      const fullPath = path.join(getDataDirectory(), dirPath);
      await fs.mkdir(fullPath, { recursive: true });
      console.log('Directory created:', dirPath);
    } catch (error) {
      console.error('Error creating directory:', dirPath, error);
      throw error;
    }
  });

  // List directory
  ipcMain.handle('fs:listDirectory', async (_event: any, dirPath: string) => {
    try {
      const fullPath = path.join(getDataDirectory(), dirPath);
      const entries = await fs.readdir(fullPath, { withFileTypes: true });
      return entries.map((e: any) => ({
        name: e.name,
        isDirectory: e.isDirectory(),
      }));
    } catch (error) {
      console.error('Error listing directory:', dirPath, error);
      throw error;
    }
  });

  // Check if file/directory exists
  ipcMain.handle('fs:exists', async (_event: any, filePath: string) => {
    try {
      const fullPath = path.join(getDataDirectory(), filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  });
}

module.exports = { registerFileSystemHandlers };

export {};
