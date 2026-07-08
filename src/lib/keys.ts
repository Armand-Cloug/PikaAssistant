// Accès aux clés API stockées dans le trousseau OS (commandes Rust → keyring).
import { invoke } from "@tauri-apps/api/core";
import type { Provider } from "../types";

export function getApiKey(provider: Provider): Promise<string | null> {
  return invoke<string | null>("get_api_key", { provider });
}

export function setApiKey(provider: Provider, key: string): Promise<void> {
  return invoke("set_api_key", { provider, key });
}

export function deleteApiKey(provider: Provider): Promise<void> {
  return invoke("delete_api_key", { provider });
}
