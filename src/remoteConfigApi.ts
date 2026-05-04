import { getGoogleAccessToken } from "./googleAuth";

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID as string;
const RC_URL = `https://firebaseremoteconfig.googleapis.com/v1/projects/${PROJECT_ID}/remoteConfig`;

export interface AdminConfig {
  parameters: Record<
    string,
    { defaultValue?: { value: string }; description?: string }
  >;
  conditions: unknown[];
  version?: unknown;
}

export async function fetchAdminConfig(): Promise<{
  config: AdminConfig;
  etag: string;
}> {
  const token = await getGoogleAccessToken();
  const res = await fetch(RC_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Admin fetch failed: ${res.status}`);
  const etag = res.headers.get("etag") ?? "*";
  return { config: (await res.json()) as AdminConfig, etag };
}

export async function saveAdminConfig(
  config: AdminConfig,
  etag: string
): Promise<void> {
  const token = await getGoogleAccessToken();
  const res = await fetch(RC_URL, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "If-Match": etag,
    },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`Save failed: ${res.status} ${await res.text()}`);
}
