import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { errorMessage } from "@/lib/errors";

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/**
 * Loads data for a screen and reloads it every time the screen gains focus,
 * so lists are fresh after coming back from a form.
 */
export function useApi<T>(load: () => Promise<T>) {
  const [state, setState] = useState<ApiState<T>>({ data: null, error: null, loading: true });
  const loader = useRef(load);
  useEffect(() => {
    loader.current = load;
  });

  const reload = useCallback(async () => {
    try {
      const data = await loader.current();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((current) => ({ ...current, error: errorMessage(error), loading: false }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { ...state, reload };
}
