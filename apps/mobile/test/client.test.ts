import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ApiClient,
  ApiError,
  normalizeBase,
  readRefreshCookie,
  type Credentials,
  type Vault,
} from "../src/services/client-core";
const base = "https://api.example.test/api/v1";
const token = (n: number) => String(n).repeat(64);
function vault(initial: Credentials | null = null) {
  let value = initial;
  return {
    read: async () => value,
    write: async (v: Credentials) => {
      value = v;
    },
    clear: async () => {
      value = null;
    },
  } satisfies Vault;
}
function response(data: unknown, status = 200, refresh?: string) {
  return new Response(JSON.stringify(data), {
    status,
    headers: refresh
      ? {
          "Set-Cookie": `ff_refresh=${refresh}; HttpOnly; SameSite=Strict; Path=/api/v1/auth`,
        }
      : {},
  });
}
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
test("API configuration rejects credentials and insecure release transport", () => {
  assert.equal(
    normalizeBase("http://localhost:4016/", true),
    "http://localhost:4016/api/v1",
  );
  assert.equal(normalizeBase(base, false), base);
  assert.throws(() => normalizeBase("http://example.test", false));
  assert.throws(() =>
    normalizeBase("https://user:password@example.test", true),
  );
  assert.throws(() => normalizeBase(undefined, true));
});
test("captures refresh only from Set-Cookie, including combined cookie headers", () => {
  assert.equal(
    readRefreshCookie(
      new Headers({
        "set-cookie": `other=x, ff_refresh=${token(1)}; HttpOnly`,
      }),
    ),
    token(1),
  );
  assert.throws(() => readRefreshCookie(new Headers()));
});
test("access is attached to requests; refresh is isolated to auth endpoints and securely rotated", async () => {
  const store = vault();
  const calls: { url: string; headers: Headers }[] = [];
  const transport: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), headers: new Headers(init?.headers) });
    assert.equal(init?.credentials, "omit");
    assert.equal(init?.redirect, "error");
    if (String(url).endsWith("/auth/login"))
      return response(
        { accessToken: "old", user: { id: "user" } },
        201,
        token(1),
      );
    if (String(url).endsWith("/auth/refresh"))
      return response({ accessToken: "new" }, 201, token(2));
    if (String(url).endsWith("/auth/logout"))
      return response({ success: true });
    return response({ ok: true });
  };
  const client = new ApiClient(base, store, transport);
  await client.authenticate("login", {
    email: "test@example.test",
    password: "NeverStored123",
  });
  await client.request("/accounts");
  await client.refresh();
  assert.equal((await store.read())?.refreshToken, token(2));
  assert.equal(
    JSON.stringify(await store.read()).includes("NeverStored"),
    false,
  );
  await client.logout();
  assert.equal(await store.read(), null);
  assert.equal(calls[1].headers.get("authorization"), "Bearer old");
  assert.equal(calls[1].headers.get("cookie"), null);
  assert.equal(calls[2].headers.get("cookie"), "ff_refresh=" + token(1));
  assert.equal(calls[2].headers.get("authorization"), null);
  assert.equal(calls[3].headers.get("cookie"), "ff_refresh=" + token(2));
});
test("concurrent expired requests share renewal, including delayed old-token responses", async () => {
  let renewals = 0;
  const late = deferred<Response>();
  const refreshed = deferred<void>();
  const store = vault();
  const transport: typeof fetch = async (url, init) => {
    if (String(url).endsWith("/auth/login"))
      return response({ accessToken: "old", user: {} }, 201, token(1));
    if (String(url).endsWith("/auth/refresh")) {
      renewals++;
      return response({ accessToken: "new" }, 201, token(2));
    }
    if (new Headers(init?.headers).get("authorization") === "Bearer old") {
      if (String(url).endsWith("/late")) return late.promise;
      return response({ message: "Expired" }, 401);
    }
    refreshed.resolve();
    return response({ ok: true });
  };
  const client = new ApiClient(base, store, transport);
  await client.authenticate("login", {});
  const slow = client.request("/late");
  const fast = Promise.all([client.request("/one"), client.request("/two")]);
  await refreshed.promise;
  late.resolve(response({ message: "Expired" }, 401));
  await Promise.all([slow, fast]);
  assert.equal(renewals, 1);
});
test("duplicate startup restores consume one refresh token", async () => {
  let renewals = 0;
  const store = vault({
    accessToken: "old",
    refreshToken: token(1),
    origin: base,
  });
  const client = new ApiClient(base, store, async (url) => {
    if (String(url).endsWith("/auth/refresh")) {
      renewals++;
      return response({ accessToken: "new" }, 201, token(2));
    }
    return response({ id: "user" });
  });
  const users = await Promise.all([client.restore(), client.restore()]);
  assert.equal(renewals, 1);
  assert.equal(users[0]?.id, "user");
});
test("invalid refresh clears session, transient connection failure preserves credentials", async () => {
  for (const status of [401, 503]) {
    const initial = {
      accessToken: "old",
      refreshToken: token(1),
      origin: base,
    };
    const store = vault(initial);
    const client = new ApiClient(base, store, async () =>
      response({ message: "Failure" }, status),
    );
    if (status === 401) {
      assert.equal(await client.restore(), null);
      assert.equal(await store.read(), null);
    } else {
      await assert.rejects(() => client.restore(), ApiError);
      assert.deepEqual(await store.read(), initial);
    }
  }
});
test("logout waits for token rotation and cannot resurrect a closed session", async () => {
  const gate = deferred<Response>();
  const started = deferred<void>();
  const store = vault();
  let logoutCookie = "";
  const client = new ApiClient(base, store, async (url, init) => {
    if (String(url).endsWith("/auth/login"))
      return response({ accessToken: "old", user: {} }, 201, token(1));
    if (String(url).endsWith("/auth/refresh")) {
      started.resolve();
      return gate.promise;
    }
    logoutCookie = new Headers(init?.headers).get("cookie") || "";
    return response({ success: true });
  });
  await client.authenticate("login", {});
  const refresh = client.refresh();
  await started.promise;
  const logout = client.logout();
  gate.resolve(response({ accessToken: "new" }, 201, token(2)));
  await Promise.all([refresh, logout]);
  assert.equal(logoutCookie, "ff_refresh=" + token(2));
  assert.equal(await store.read(), null);
  await assert.rejects(() => client.request("/accounts"));
});
test("changing API never forwards credentials from another origin", async () => {
  const store = vault({
    accessToken: "old",
    refreshToken: token(1),
    origin: "https://other.test/api/v1",
  });
  const client = new ApiClient(base, store, async () => {
    throw new Error("Must not be called");
  });
  assert.equal(await client.restore(), null);
  assert.equal(await store.read(), null);
});
