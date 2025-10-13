import { ipcMain, shell } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Map of IDE identifiers to their command-line executables
 */
const IDE_COMMANDS: Record<string, string> = {
  idea: 'idea',
  pycharm: 'pycharm',
  webstorm: 'webstorm',
  code: 'code', // VS Code
  rider: 'rider',
  clion: 'clion',
  goland: 'goland',
  'android-studio': 'studio',
  phpstorm: 'phpstorm',
  rubymine: 'rubymine',
};

/**
 * Register IDE integration IPC handlers
 */
export function registerIDEHandlers(): void {
  ipcMain.handle('ide:open', async (_event, projectPath: string, ide: string) => {
    const command = IDE_COMMANDS[ide];

    if (!command) {
      console.error('Unknown IDE:', ide);
      throw new Error(`Unknown IDE: ${ide}`);
    }

    try {
      // Try to open in the IDE
      await execAsync(`${command} "${projectPath}"`);
      console.log(`Opened ${projectPath} in ${ide}`);
      return { success: true };
    } catch (error) {
      console.warn(`Failed to open in ${ide}, falling back to system default:`, error);

      // Fallback: open in system file browser
      try {
        await shell.openPath(projectPath);
        return { success: true, usedFallback: true };
      } catch (fallbackError) {
        console.error('Failed to open path:', fallbackError);
        throw new Error(`Failed to open ${projectPath}`);
      }
    }
  });
}
