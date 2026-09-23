import * as SecureStore from "expo-secure-store";
import type { Vault, Credentials } from "./client-core";
const key = "nexum.session.v1";
export const vault: Vault = {
  async read() {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    try {
      const value = JSON.parse(raw) as Credentials;
      if (
        typeof value.accessToken === "string" &&
        typeof value.refreshToken === "string" &&
        typeof value.origin === "string"
      )
        return value;
    } catch {}
    await SecureStore.deleteItemAsync(key);
    return null;
  },
  async write(value) {
    await SecureStore.setItemAsync(key, JSON.stringify(value), {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async clear() {
    await SecureStore.deleteItemAsync(key);
  },
};
