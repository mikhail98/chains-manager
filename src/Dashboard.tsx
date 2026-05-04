import { useEffect, useState } from "react";
import { fetchAndActivate, getAll } from "firebase/remote-config";
import { getRC } from "./firebase";
import { clearSession } from "./auth";
import ChainsList from "./ChainsList";
import ChainEditor from "./ChainEditor";
import type { Chain } from "./types";

interface Props {
  onLogout: () => void;
}

type FetchStatus = "loading" | "ready" | "error";

function emptyChain(): Chain {
  return {
    chainId: `new-chain-${Date.now()}`,
    name: "New Chain",
    addressPrefix: 0,
    nodeSelectionStrategy: null,
    nodes: [],
    additional: null,
    assets: [],
    explorers: [],
    options: [],
    types: null,
    parentId: null,
  };
}

export default function Dashboard({ onLogout }: Props) {
  const [chains, setChains] = useState<Chain[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("loading");
  const [copied, setCopied] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  useEffect(() => {
    const rc = getRC();
    fetchAndActivate(rc)
      .then(() => {
        const all = getAll(rc);
        const raw = all["chains_v2"]?.asString() ?? "[]";
        const parsed = JSON.parse(raw) as Chain[];
        setChains(parsed);
        setSelectedId(parsed[0]?.chainId ?? null);
        setFetchStatus("ready");
      })
      .catch(() => setFetchStatus("error"));
  }, []);

  const selected = chains.find((c) => c.chainId === selectedId) ?? null;

  function handleChainUpdate(updated: Chain) {
    setChains((prev) =>
      prev.map((c) => (c.chainId === updated.chainId ? updated : c))
    );
  }

  function handleAddChain() {
    const chain = emptyChain();
    setChains((prev) => [...prev, chain]);
    setSelectedId(chain.chainId);
  }

  function handleDeleteChain(chainId: string) {
    setChains((prev) => {
      const next = prev.filter((c) => c.chainId !== chainId);
      setSelectedId(next[0]?.chainId ?? null);
      return next;
    });
  }

  function handleImportApply() {
    try {
      const parsed = JSON.parse(importText) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array");
      setChains(parsed as Chain[]);
      setSelectedId((parsed as Chain[])[0]?.chainId ?? null);
      setImportError("");
      setImportOpen(false);
      setImportText("");
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  function handleDownload() {
    const blob = new Blob([JSON.stringify(chains, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chains_v2.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(chains, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <span style={s.title}>chains_v2 editor</span>
        <div style={s.headerActions}>
          <button onClick={() => { setImportError(""); setImportText(""); setImportOpen(true); }} style={s.btn}>
            Import JSON
          </button>
          <button onClick={handleCopy} style={s.btn}>
            {copied ? "Copied ✓" : "Copy JSON"}
          </button>
          <button onClick={handleDownload} style={s.btn}>
            Download JSON
          </button>
          <button onClick={() => { clearSession(); onLogout(); }} style={s.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      <div style={s.body}>
        {fetchStatus === "loading" && (
          <div style={s.centered}>Loading chains_v2…</div>
        )}
        {fetchStatus === "error" && (
          <div style={{ ...s.centered, color: "#f87171" }}>
            Failed to load Remote Config.
          </div>
        )}
        {fetchStatus === "ready" && (
          <>
            <ChainsList
              chains={chains}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={handleAddChain}
            />
            <div style={s.editorWrap}>
              {selected ? (
                <ChainEditor
                  key={selected.chainId}
                  chain={selected}
                  onChange={handleChainUpdate}
                  onDelete={() => handleDeleteChain(selected.chainId)}
                />
              ) : (
                <div style={s.centered}>Select a chain</div>
              )}
            </div>
          </>
        )}
      </div>

      {importOpen && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>Import JSON</span>
              <button onClick={() => setImportOpen(false)} style={s.closeBtn}>✕</button>
            </div>
            <textarea
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportError(""); }}
              style={s.modalTextarea}
              placeholder="Paste chains_v2 JSON array here…"
              spellCheck={false}
              autoFocus
            />
            {importError && <p style={s.importErr}>{importError}</p>}
            <div style={s.modalActions}>
              <button onClick={() => setImportOpen(false)} style={s.logoutBtn}>Cancel</button>
              <button onClick={handleImportApply} style={s.btn}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#0f0f0f",
    color: "#f0f0f0",
    fontFamily: "system-ui, sans-serif",
    overflow: "hidden",
  },
  header: {
    height: 48,
    borderBottom: "1px solid #1e1e1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    flexShrink: 0,
  },
  title: { fontSize: 14, fontWeight: 600, color: "#888", letterSpacing: "-0.2px" },
  headerActions: { display: "flex", alignItems: "center", gap: 8 },
  btn: {
    padding: "6px 16px",
    background: "#1d1d2e",
    color: "#a78bfa",
    border: "1px solid #2a2a4a",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  logoutBtn: {
    padding: "6px 14px",
    background: "transparent",
    color: "#555",
    border: "1px solid #222",
    borderRadius: 7,
    fontSize: 13,
    cursor: "pointer",
  },
  body: { flex: 1, display: "flex", overflow: "hidden" },
  editorWrap: { flex: 1, display: "flex", overflow: "hidden", minWidth: 0 },
  centered: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555",
    fontSize: 14,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 12,
    padding: "24px 28px",
    width: 600,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: 14, fontWeight: 600, color: "#f0f0f0" },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#555",
    fontSize: 16,
    cursor: "pointer",
    padding: "0 4px",
  },
  modalTextarea: {
    background: "#111",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    color: "#d4d4d4",
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 1.6,
    padding: "12px 14px",
    resize: "vertical",
    outline: "none",
    height: 320,
    width: "100%",
    boxSizing: "border-box",
  },
  importErr: { margin: 0, fontSize: 12, color: "#f87171" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 8 },
};
