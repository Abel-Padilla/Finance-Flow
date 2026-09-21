let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
export function setToken(token: string | null) {
  accessToken = token;
}
async function refresh() {
  if (!refreshing)
    refreshing = fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) {
          accessToken = null;
          return false;
        }
        accessToken = (await r.json()).accessToken;
        return true;
      })
      .finally(() => {
        refreshing = null;
      });
  return refreshing;
}
export async function api(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<any> {
  const r = await fetch("/api/v1" + path, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  if (
    r.status === 401 &&
    retry &&
    !path.startsWith("/auth/") &&
    (await refresh())
  )
    return api(path, options, false);
  const body = await r.json();
  if (!r.ok) {
    if (r.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(body.message || "No se pudo completar la operación.");
  }
  return body;
}
export const send = (path: string, body: any, method = "POST") =>
  api(path, { method, body: JSON.stringify(body) });
export async function restoreSession() {
  if (!(await refresh())) return null;
  return api("/auth/me");
}
