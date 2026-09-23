import { fetch as expoFetch } from "expo/fetch";
import { ApiClient, normalizeBase } from "./client-core";
import { vault } from "./vault";
// Public configuration only. Expose setup failures through the startup error screen.
let base = "";
let setupError: Error | null = null;
try {
  base = normalizeBase(process.env.EXPO_PUBLIC_API_URL, __DEV__);
} catch (error) {
  setupError =
    error instanceof Error
      ? error
      : new Error("Configura la dirección de la API.");
}
export const configurationError = setupError;
export const api = new ApiClient(base, vault, expoFetch as typeof fetch);
