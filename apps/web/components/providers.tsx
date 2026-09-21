"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Toaster, sileo } from "sileo";
import { api, restoreSession, setToken } from "../lib/api";
type User = {
  id: string;
  name: string;
  email: string;
  currency: string;
  onboarded: boolean;
  monthlyIncome: string;
};
const Context = createContext<{
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  reload: () => Promise<void>;
  dark: boolean;
  toggle: () => void;
}>({
  user: null,
  loading: true,
  setUser: () => {},
  reload: async () => {},
  dark: false,
  toggle: () => {},
});
export const useSession = () => useContext(Context);
export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [dark, setDark] = useState(false);
  useEffect(() => {
    restoreSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    setDark(localStorage.getItem("theme") === "dark");
    const expire = () => {
      setToken(null);
      setUser(null);
      sileo.error({
        title: "Tu sesión expiró",
        description: "Inicia sesión nuevamente.",
      });
    };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  const reload = useCallback(async () => {
    setUser(await api("/auth/me"));
  }, []);
  return (
    <Context.Provider
      value={{
        user,
        loading,
        setUser,
        reload,
        dark,
        toggle: () =>
          setDark((v) => {
            localStorage.setItem("theme", v ? "light" : "dark");
            return !v;
          }),
      }}
    >
      {children}
      <Toaster position="top-right" theme={dark ? "dark" : "light"} />
    </Context.Provider>
  );
}
