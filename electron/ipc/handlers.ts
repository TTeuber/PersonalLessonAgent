const { registerFileSystemHandlers } = require('./fileSystem');
const { registerIDEHandlers } = require('./ideIntegration');

/**
 * Register all IPC handlers
 * Call this from the main process when the app is ready
 */
function registerAllHandlers(): void {
  console.log('Registering IPC handlers...');
  registerFileSystemHandlers();
  registerIDEHandlers();
  console.log('IPC handlers registered successfully');
}

module.exports = { registerAllHandlers };

export {};
