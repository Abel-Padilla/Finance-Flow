"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
export function useData<T = any>(path: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    try {
      setError("");
      const result = await api(path);
      if (current === generation.current) setData(result);
    } catch (e) {
      if (current === generation.current) setError((e as Error).message);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    setLoading(true);
    void reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
  return { data, error, loading, reload };
}
