'use client';

/**
 * useAuditState — loads the current AuditState from IndexedDB/localStorage/sessionStorage.
 * Provides a stable loading + error pattern for results and compare pages.
 */

import { useState, useEffect } from 'react';
import { AuditState } from '@/types';
import { getAuditStateAsync, getSessionAuditState, getAuditStateByRunId } from '@/services/storage';

interface UseAuditStateResult {
  state: AuditState | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAuditState(runId?: string | null): UseAuditStateResult {
  const [state, setState] = useState<AuditState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. If runId is provided, try to load that specific run first
        if (runId) {
          const specificRun = await getAuditStateByRunId(runId);
          if (specificRun && !cancelled) {
            setState(specificRun);
            setIsLoading(false);
            return;
          }
        }

        // 2. Try sessionStorage (freshest — set right after audit completes)
        const session = getSessionAuditState();
        if (session && session.run && !cancelled) {
          // If we reached here with a runId, it means the specific run wasn't found.
          // We only use session data if the run IDs match or if no runId was requested.
          if (!runId || session.run.runId === runId) {
            setState(session);
            setIsLoading(false);
            return;
          }
        }

        // 3. Try IndexedDB / localStorage (persisted across navigations)
        // Retry up to 3 times with a short delay — guards against a brief race where
        // the progress page's IndexedDB write hasn't fully committed yet.
        let stored = await getAuditStateAsync();
        if (!stored && runId) {
          for (let attempt = 0; attempt < 3 && !cancelled; attempt++) {
            await new Promise<void>(resolve => setTimeout(resolve, 600));
            stored = await getAuditStateByRunId(runId);
            if (stored) break;
          }
        }
        if (!cancelled) {
          if (stored && stored.run) {
            if (!runId || stored.run.runId === runId) {
              setState(stored);
            } else {
              setState(null);
            }
          } else {
            setState(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load audit data');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [reloadCount, runId]);

  const reload = () => setReloadCount(c => c + 1);

  return { state, isLoading, error, reload };
}
