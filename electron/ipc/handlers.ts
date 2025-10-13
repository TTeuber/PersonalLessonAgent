import { registerFileSystemHandlers } from './fileSystem.js';
import { registerIDEHandlers } from './ideIntegration.js';

/**
 * Register all IPC handlers
 * Call this from the main process when the app is ready
 */
export function registerAllHandlers(): void {
  console.log('Registering IPC handlers...');
  registerFileSystemHandlers();
  registerIDEHandlers();
  console.log('IPC handlers registered successfully');
}
