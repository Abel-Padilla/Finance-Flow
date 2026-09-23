import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
export function useResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const n = ++generation.current;
    setRefreshing(true);
    setError("");
    try {
      const value = await loader();
      if (n === generation.current) setData(value);
    } catch (e) {
      if (n === generation.current) setError((e as Error).message);
    } finally {
      if (n === generation.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [loader]);
  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        generation.current++;
      };
    }, [reload]),
  );
  return { data, loading, refreshing, error, reload };
}
