import * as SecureStore from "expo-secure-store";
import { useEffect, useRef, useState } from "react";
const key = "nexum.dashboard.hide-amounts";
export function useAmountVisibility() {
  const [hidden, setHidden] = useState<boolean | null>(null);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    void SecureStore.getItemAsync(key)
      .then((value) => {
        if (active) setHidden(value === "true");
      })
      .catch(() => {
        if (active) setHidden(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const toggle = () => {
    const next = !(hidden ?? true);
    setHidden(next);
    writes.current = writes.current
      .catch(() => {})
      .then(() => SecureStore.setItemAsync(key, String(next)))
      .catch(() => {});
  };
  return { hidden: hidden ?? true, ready: hidden !== null, toggle };
}
