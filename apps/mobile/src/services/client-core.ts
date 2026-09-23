import type { User } from "../types/api";
export interface Credentials {
  accessToken: string;
  refreshToken: string;
  origin: string;
}
export interface Vault {
  read(): Promise<Credentials | null>;
  write(value: Credentials): Promise<void>;
  clear(): Promise<void>;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export function normalizeBase(value: string | undefined, development: boolean) {
  if (!value)
    throw new ApiError(
      "Configura EXPO_PUBLIC_API_URL para conectar con tu API.",
    );
  const u = new URL(value);
  if (
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !["http:", "https:"].includes(u.protocol)
  )
    throw new ApiError("La dirección de la API no es válida.");
  if (!development && u.protocol !== "https:")
    throw new ApiError("La aplicación de producción requiere una API HTTPS.");
  return (
    u
      .toString()
      .replace(/\/$/, "")
      .replace(/\/api\/v1$/, "") + "/api/v1"
  );
}
export function readRefreshCookie(headers: Headers) {
  const values =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie") || ""];
  for (const line of values) {
    const match = line.match(/(?:^|,\s*)ff_refresh=([^;,\s]+)/);
    if (match && /^[A-Za-z0-9_-]{32,128}$/.test(match[1])) return match[1];
  }
  throw new ApiError(
    "La API no entregó la cookie de sesión. Comprueba que el proxy conserva Set-Cookie.",
  );
}
export class ApiClient {
  private credentials: Credentials | null = null;
  private refreshFlight: Promise<void> | null = null;
  private closing = false;
  private restoreFlight: Promise<User | null> | null = null;
  onExpired: () => void = () => {};
  constructor(
    public readonly base: string,
    private vault: Vault,
    private transport: typeof fetch,
  ) {}
  private async raw<T>(
    path: string,
    method = "GET",
    body?: unknown,
    access?: string,
    refresh?: string,
  ): Promise<{ data: T; headers: Headers }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await this.transport(this.base + path, {
        method,
        redirect: "error",
        credentials: "omit",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(access ? { Authorization: "Bearer " + access } : {}),
          ...(refresh ? { Cookie: "ff_refresh=" + refresh } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      let data: unknown;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new ApiError(
          "La API devolvió una respuesta no válida.",
          response.status,
        );
      }
      if (!response.ok) {
        const error = data as { message?: unknown } | null;
        throw new ApiError(
          typeof error?.message === "string"
            ? error.message
            : "No se pudo completar la operación.",
          response.status,
        );
      }
      return { data: data as T, headers: response.headers };
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(
        "No se pudo conectar. Revisa tu conexión y vuelve a intentar.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }
  private async persist(data: { accessToken: string }, headers: Headers) {
    if (typeof data.accessToken !== "string" || !data.accessToken)
      throw new ApiError("La API no entregó un token de acceso válido.");
    const next = {
      accessToken: data.accessToken,
      refreshToken: readRefreshCookie(headers),
      origin: this.base,
    };
    await this.vault.write(next);
    this.credentials = next;
  }
  async authenticate(kind: "login" | "register", body: unknown) {
    if (this.closing)
      throw new ApiError("Espera a que termine el cierre de sesión.");
    const r = await this.raw<{ accessToken: string; user: User }>(
      "/auth/" + kind,
      "POST",
      body,
    );
    await this.persist(r.data, r.headers);
    return r.data.user;
  }
  restore(): Promise<User | null> {
    if (!this.restoreFlight)
      this.restoreFlight = this.restoreSession().finally(() => {
        this.restoreFlight = null;
      });
    return this.restoreFlight;
  }
  private async restoreSession() {
    this.credentials = await this.vault.read();
    if (!this.credentials) return null;
    if (this.credentials.origin !== this.base) {
      await this.clear();
      return null;
    }
    try {
      await this.refresh();
      return await this.request<User>("/auth/me");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  }
  async refresh() {
    if (this.refreshFlight) return this.refreshFlight;
    if (!this.credentials)
      throw new ApiError("Inicia sesión para continuar.", 401);
    this.refreshFlight = (async () => {
      try {
        const r = await this.raw<{ accessToken: string }>(
          "/auth/refresh",
          "POST",
          undefined,
          undefined,
          this.credentials!.refreshToken,
        );
        await this.persist(r.data, r.headers);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          await this.clear();
          this.onExpired();
        }
        throw e;
      }
    })().finally(() => {
      this.refreshFlight = null;
    });
    return this.refreshFlight;
  }
  async request<T>(
    path: string,
    method = "GET",
    body?: unknown,
    retry = true,
  ): Promise<T> {
    if (this.closing) throw new ApiError("La sesión se está cerrando.", 401);
    if (!this.credentials)
      throw new ApiError("Inicia sesión para continuar.", 401);
    const accessUsed = this.credentials.accessToken;
    try {
      return (await this.raw<T>(path, method, body, accessUsed)).data;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && retry) {
        if (this.closing)
          throw new ApiError("La sesión se está cerrando.", 401);
        if (this.credentials?.accessToken === accessUsed) await this.refresh();
        return this.request<T>(path, method, body, false);
      }
      if (e instanceof ApiError && e.status === 401) {
        await this.clear();
        this.onExpired();
      }
      throw e;
    }
  }
  async clear() {
    this.credentials = null;
    await this.vault.clear();
  }
  async logout() {
    this.closing = true;
    try {
      if (this.refreshFlight) await this.refreshFlight.catch(() => {});
      const refresh = this.credentials?.refreshToken;
      await this.clear();
      if (refresh)
        await this.raw("/auth/logout", "POST", undefined, undefined, refresh);
    } finally {
      this.closing = false;
      this.onExpired();
    }
  }
}
