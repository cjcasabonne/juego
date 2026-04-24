import { useState, useCallback } from 'react';
import { parseSupabaseError } from '../utils/errors';

interface AsyncState {
  loading: boolean;
  error: string | null;
}

export function useAsyncAction<T extends unknown[]>(
  action: (...args: T) => Promise<void>,
): [AsyncState, (...args: T) => Promise<void>] {
  const [state, setState] = useState<AsyncState>({ loading: false, error: null });

  const run = useCallback(
    async (...args: T) => {
      setState({ loading: true, error: null });
      try {
        await action(...args);
        setState({ loading: false, error: null });
      } catch (err) {
        setState({ loading: false, error: parseSupabaseError(err) });
      }
    },
    [action],
  );

  return [state, run];
}
