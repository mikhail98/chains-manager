import { useState, type FormEvent } from "react";
import { saveSession, saveFirebaseConfig } from "./auth";
import { initFirebase } from "./firebase";
import type { FirebaseConfig } from "./types";

interface Props {
  onSuccess: () => void;
}

function parseConfig(raw: string): FirebaseConfig {
  // eslint-disable-next-line no-new-func
  const obj = new Function(`return (${raw.trim()})`)() as Record<string, string>;
  return {
    apiKey: obj.apiKey ?? "",
    authDomain: obj.authDomain ?? "",
    projectId: obj.projectId ?? "",
    storageBucket: obj.storageBucket ?? "",
    messagingSenderId: obj.messagingSenderId ?? "",
    appId: obj.appId ?? "",
    measurementId: obj.measurementId || undefined,
  };
}

export default function LoginPage({ onSuccess }: Props) {
  const [configStr, setConfigStr] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    let config: FirebaseConfig;
    try {
      config = parseConfig(configStr);
    } catch {
      setError("Invalid config — check the format");
      return;
    }

    if (!config.apiKey || !config.projectId) {
      setError("apiKey and projectId are required");
      return;
    }

    setLoading(true);
    try {
      await initFirebase(config);
      saveFirebaseConfig(config);
      saveSession();
      onSuccess();
    } catch {
      setError("Failed to connect to Firebase");
      setLoading(false);
    }
  }

  return (
    <div style={s.root}>
      <form onSubmit={handleSubmit} style={s.card}>
        <h1 style={s.title}>chains_redactor</h1>
        <textarea
          value={configStr}
          onChange={(e) => { setConfigStr(e.target.value); setError(""); }}
          style={s.textarea}
          placeholder={"paste Firebase config here\n{ apiKey: \"...\", projectId: \"...\", ... }"}
          spellCheck={false}
          autoComplete="off"
          autoFocus
        />
        <button type="submit" disabled={loading} style={s.button}>
          {loading ? "Connecting…" : "Connect"}
        </button>
        {error && <p style={s.error}>{error}</p>}
      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f0f0f",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "32px 36px",
    width: 460,
  },
  title: {
    margin: "0 0 4px",
    fontSize: 18,
    fontWeight: 600,
    color: "#f0f0f0",
    letterSpacing: "-0.3px",
  },
  textarea: {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    color: "#d4d4d4",
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 1.6,
    padding: "12px 14px",
    resize: "none",
    outline: "none",
    height: 178,
  },
  button: {
    padding: "9px 24px",
    borderRadius: 8,
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
  },
  error: { margin: 0, fontSize: 13, color: "#f87171" },
};
