import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getRemoteConfig, type RemoteConfig } from "firebase/remote-config";
import type { FirebaseConfig } from "./types";

let _rc: RemoteConfig | null = null;

export async function initFirebase(config: FirebaseConfig): Promise<void> {
  for (const app of getApps()) await deleteApp(app);
  const app = initializeApp(config);
  _rc = getRemoteConfig(app);
  if (import.meta.env.DEV) _rc.settings.minimumFetchIntervalMillis = 0;
}

export function getRC(): RemoteConfig {
  if (!_rc) throw new Error("Firebase not initialized");
  return _rc;
}
