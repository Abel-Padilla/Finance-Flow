"use client";
import { useEffect, useState } from "react";
const key = "nexum.dashboard.hide-amounts";
export function useAmountVisibility() {
  const [hidden, setHidden] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(key) === "true");
    } catch {
      setHidden(true);
    }
  }, []);
  const toggle = () => {
    const next = !(hidden ?? true);
    setHidden(next);
    try {
      localStorage.setItem(key, String(next));
    } catch {
      /* Still works for this visit if storage is unavailable. */
    }
  };
  return { hidden: hidden ?? true, ready: hidden !== null, toggle };
}
