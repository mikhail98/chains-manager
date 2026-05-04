import type { FirebaseConfig } from "./types";

const SESSION_KEY = "chains_authed";
const FB_CONFIG_KEY = "chains_fb_config";

export const checkPassword = (input: string): boolean =>
  input === import.meta.env.VITE_PASSWORD;

export const saveSession = (): void =>
  localStorage.setItem(SESSION_KEY, "1");

export const clearSession = (): void =>
  localStorage.removeItem(SESSION_KEY);

export const isSessionActive = (): boolean =>
  localStorage.getItem(SESSION_KEY) === "1";

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(FB_CONFIG_KEY, JSON.stringify(config));
}

export function getFirebaseConfig(): FirebaseConfig | null {
  const raw = localStorage.getItem(FB_CONFIG_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as FirebaseConfig; }
  catch { return null; }
}
