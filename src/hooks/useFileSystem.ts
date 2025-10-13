import { useMemo } from 'react';
import { FileSystemService, fileSystemService } from '../services/storage/FileSystemService';

/**
 * Hook to access the FileSystemService
 * Returns a singleton instance for consistent usage
 */
export function useFileSystem(): FileSystemService {
  return useMemo(() => fileSystemService, []);
}
