import { useCallback, useEffect, useRef, useState } from "react";

interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
}

/**
 * Run an async function on mount (and whenever `deps` change) with managed
 * loading / error / data state. Designed to wrap the service layer so the UI
 * behaves identically once a real API is connected.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: React.DependencyList = [],
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    loading: true,
    error: undefined,
  });
  const mounted = useRef(true);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    mounted.current = true;
    setState((s) => ({ ...s, loading: true, error: undefined }));
    fn()
      .then((data) => {
        if (mounted.current) setState({ data, loading: false, error: undefined });
      })
      .catch((error: Error) => {
        if (mounted.current) setState({ data: undefined, loading: false, error });
      });
    return () => {
      mounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { ...state, refetch };
}
