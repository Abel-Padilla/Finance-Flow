import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { User } from "../types/api";
import { api, configurationError } from "../services/api";
interface Session {
  user: User | null;
  loading: boolean;
  error: string;
  setUser: (u: User | null) => void;
  restore: () => Promise<void>;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<Session | null>(null);
export const useSession = () => {
  const s = useContext(Context);
  if (!s) throw new Error("SessionProvider missing");
  return s;
};
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const restore = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (configurationError) throw configurationError;
      setUser(await api.restore());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    api.onExpired = () => setUser(null);
    void restore();
    return () => {
      api.onExpired = () => {};
    };
  }, [restore]);
  const reload = async () => setUser(await api.request<User>("/auth/me"));
  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };
  return (
    <Context.Provider
      value={{ user, loading, error, setUser, restore, reload, logout }}
    >
      {children}
    </Context.Provider>
  );
}
