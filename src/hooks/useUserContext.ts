import { useState, useEffect, useCallback, useMemo } from 'react';
import { ContextManager } from '../services/storage/ContextManager';
import { fileSystemService } from '../services/storage/FileSystemService';
import type { UserContext } from '../types/context';

/**
 * Hook to load and manage user context
 */
export function useUserContext() {
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const contextManager = useMemo(() => new ContextManager(fileSystemService), []);

  const loadUserContext = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const context = await contextManager.loadUserContext();
      setUserContext(context);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load user context'));
    } finally {
      setLoading(false);
    }
  }, [contextManager]);

  useEffect(() => {
    loadUserContext();
  }, [loadUserContext]);

  const saveUserContext = async (context: UserContext) => {
    try {
      setError(null);
      await contextManager.saveUserContext(context);
      setUserContext(context);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save user context'));
      throw err;
    }
  };

  return {
    userContext,
    loading,
    error,
    saveUserContext,
    reloadUserContext: loadUserContext,
  };
}
