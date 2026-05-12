import { useState, useEffect, useRef } from "react";
import type { Chain, ChainNode, Asset, Explorer } from "./types";

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

interface Props {
  chain: Chain;
  onChange: (updated: Chain) => void;
}

type Tab = "general" | "nodes" | "assets" | "explorers" | "json";
type KVValue = string | boolean | number;
interface KVPair { key: string; value: KVValue }

/* ── KV Editor ── */

function dataToPairs(data: Record<string, unknown> | null): KVPair[] {
  return data
    ? Object.entries(data).map(([key, value]) => ({ key, value: value as KVValue }))
    : [];
}

function pairsToData(pairs: KVPair[]): Record<string, unknown> | null {
  const valid = pairs.filter((p) => p.key.trim());
  if (!valid.length) return null;
  return Object.fromEntries(valid.map(({ key, value }) => [key.trim(), value]));
}

function KVEditor({
  data,
  onChange,
}: {
  data: Record<string, unknown> | null;
  onChange: (v: Record<string, unknown> | null) => void;
}) {
  const [pairs, setPairs] = useState<KVPair[]>(() => dataToPairs(data));

  function commit(next: KVPair[]) {
    setPairs(next);
    onChange(pairsToData(next));
  }

  function changeType(idx: number, newType: string) {
    const p = pairs[idx];
    let next: KVValue;
    if (newType === "bool") next = false;
    else if (newType === "num") next = 0;
    else next = String(p.value);
    commit(pairs.map((pair, i) => (i === idx ? { ...pair, value: next } : pair)));
  }

  const typeOf = (v: KVValue) =>
    typeof v === "boolean" ? "bool" : typeof v === "number" ? "num" : "str";

  return (
    <div style={kv.root}>
      {pairs.map((pair, idx) => (
        <div key={idx} style={kv.row}>
          <input
            value={pair.key}
            onChange={(e) =>
              commit(pairs.map((p, i) => (i === idx ? { ...p, key: e.target.value } : p)))
            }
            placeholder="key"
            style={{ ...s.input, width: 150 }}
          />
          {typeof pair.value === "boolean" ? (
            <label style={kv.boolLabel}>
              <input
                type="checkbox"
                checked={pair.value}
                onChange={(e) =>
                  commit(pairs.map((p, i) => (i === idx ? { ...p, value: e.target.checked } : p)))
                }
              />
              {pair.value ? "true" : "false"}
            </label>
          ) : (
            <input
              type={typeof pair.value === "number" ? "number" : "text"}
              value={String(pair.value)}
              onChange={(e) =>
                commit(
                  pairs.map((p, i) =>
                    i === idx
                      ? { ...p, value: typeof p.value === "number" ? Number(e.target.value) : e.target.value }
                      : p
                  )
                )
              }
              style={{ ...s.input, flex: 1 }}
            />
          )}
          <select
            value={typeOf(pair.value)}
            onChange={(e) => changeType(idx, e.target.value)}
            style={kv.typeSelect}
          >
            <option value="str">str</option>
            <option value="bool">bool</option>
            <option value="num">num</option>
          </select>
          <button
            onClick={() => commit(pairs.filter((_, i) => i !== idx))}
            style={s.trashBtn}
          >
            <TrashIcon />
          </button>
        </div>
      ))}
      <button
        onClick={() => commit([...pairs, { key: "", value: "" }])}
        style={{ ...s.addBtn, marginTop: 2, fontSize: 12 }}
      >
        + Add field
      </button>
    </div>
  );
}

const kv: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: 6 },
  row: { display: "flex", gap: 8, alignItems: "center" },
  boolLabel: { display: "flex", alignItems: "center", gap: 6, color: "#ccc", fontSize: 15, flex: 1 },
  typeSelect: {
    padding: "5px 6px",
    background: "#1a1a2e",
    color: "#a78bfa",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    flexShrink: 0,
    outline: "none",
  },
};

/* ── Chain Editor ── */

export default function ChainEditor({ chain, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("general");
  const [jsonStr, setJsonStr] = useState(() => JSON.stringify(chain, null, 2));
  const [jsonError, setJsonError] = useState("");
  const isJsonTab = useRef(false);

  useEffect(() => { isJsonTab.current = tab === "json"; }, [tab]);

  useEffect(() => {
    if (!isJsonTab.current) {
      setJsonStr(JSON.stringify(chain, null, 2));
      setJsonError("");
    }
  }, [chain]);

  function update(partial: Partial<Chain>) {
    onChange({ ...chain, ...partial });
  }

  function handleTabSwitch(next: Tab) {
    if (tab === "json") {
      try {
        onChange(JSON.parse(jsonStr) as Chain);
        setJsonError("");
      } catch {
        setJsonError("Fix JSON errors before switching tabs");
        return;
      }
    }
    setTab(next);
  }

  const nodes = chain.nodes ?? [];
  const assets = chain.assets ?? [];
  const explorers = chain.explorers ?? [];

  return (
    <div style={s.root}>
      <div style={s.chainHeader}>
        <div>
          <div style={s.chainName}>{chain.name}</div>
          <div style={s.chainId}>{chain.chainId}</div>
        </div>
      </div>

      <div style={s.tabs}>
        {(["general", "nodes", "assets", "explorers", "json"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabSwitch(t)}
            style={{ ...s.tab, ...(tab === t ? s.activeTab : {}) }}
          >
            {t === "nodes" ? `Nodes (${nodes.length})`
              : t === "assets" ? `Assets (${assets.length})`
              : t === "explorers" ? `Explorers (${explorers.length})`
              : t === "general" ? "General" : "JSON"}
          </button>
        ))}
      </div>

      <div style={s.tabBody}>
        {tab === "general" && <GeneralEditor chain={chain} onChange={onChange} />}
        {tab === "nodes" && <NodesEditor nodes={nodes} onChange={(n) => update({ nodes: n })} />}
        {tab === "assets" && <AssetsEditor assets={assets} onChange={(a) => update({ assets: a })} />}
        {tab === "explorers" && <ExplorersEditor explorers={explorers} onChange={(e) => update({ explorers: e })} />}
        {tab === "json" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
            <textarea
              value={jsonStr}
              onChange={(e) => setJsonStr(e.target.value)}
              onBlur={() => {
                try { onChange(JSON.parse(jsonStr) as Chain); setJsonError(""); }
                catch { setJsonError("Invalid JSON — changes not applied"); }
              }}
              style={s.jsonArea}
              spellCheck={false}
            />
            {jsonError && <p style={s.errorMsg}>{jsonError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── General ── */

function GeneralEditor({ chain, onChange }: { chain: Chain; onChange: (c: Chain) => void }) {
  const [typesStr, setTypesStr] = useState(
    chain.types ? JSON.stringify(chain.types, null, 2) : "null"
  );
  const [typesErr, setTypesErr] = useState("");
  const [editingChainId, setEditingChainId] = useState(false);
  const [chainIdDraft, setChainIdDraft] = useState(chain.chainId);

  function upd(partial: Partial<Chain>) { onChange({ ...chain, ...partial }); }

  function saveChainId() {
    upd({ chainId: chainIdDraft });
    setEditingChainId(false);
  }

  return (
    <div style={s.section}>
      <div style={s.grid2}>
        <Field label="Name">
          <input value={chain.name} onChange={(e) => upd({ name: e.target.value })} style={s.input} />
        </Field>
        <Field label="Address Prefix">
          <input
            type="number"
            value={chain.addressPrefix}
            onChange={(e) => upd({ addressPrefix: Number(e.target.value) })}
            style={{ ...s.input, width: 100 }}
          />
        </Field>
      </div>

      <div style={s.grid2}>
        <Field label="Chain ID">
          {editingChainId ? (
            <div style={{ display: "flex", gap: 6 }}>
              <input
                value={chainIdDraft}
                onChange={(e) => setChainIdDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveChainId(); if (e.key === "Escape") setEditingChainId(false); }}
                style={{ ...s.input, fontFamily: "monospace", flex: 1 }}
                autoFocus
              />
              <Btn onClick={saveChainId}>Save</Btn>
              <Btn onClick={() => setEditingChainId(false)} muted>Cancel</Btn>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...s.input, fontFamily: "monospace", flex: 1, color: "#aaa", userSelect: "all" as const }}>
                {chain.chainId}
              </span>
              <button onClick={() => { setChainIdDraft(chain.chainId); setEditingChainId(true); }} style={s.editBtn}>
                <EditIcon />
              </button>
            </div>
          )}
        </Field>
        <Field label="Genesis Hash">
          <input
            value={chain.genesisHash ?? ""}
            onChange={(e) => upd({ genesisHash: e.target.value || undefined })}
            style={{ ...s.input, fontFamily: "monospace" }}
            placeholder="0x..."
          />
        </Field>
      </div>

      <div style={s.grid2}>
        <Field label="Parent ID">
          <input
            value={chain.parentId ?? ""}
            onChange={(e) => upd({ parentId: e.target.value || null })}
            placeholder="null"
            style={{ ...s.input, fontFamily: "monospace", fontSize: 12 }}
          />
        </Field>
        <Field label="Node Selection Strategy">
          <input
            value={chain.nodeSelectionStrategy ?? ""}
            onChange={(e) => upd({ nodeSelectionStrategy: e.target.value || null })}
            placeholder="null"
            style={s.input}
          />
        </Field>
      </div>

      <Field label="Options (comma-separated)">
        <input
          value={(chain.options ?? []).join(", ")}
          onChange={(e) =>
            upd({
              options: e.target.value
                ? e.target.value.split(",").map((o) => o.trim()).filter(Boolean)
                : [],
            })
          }
          placeholder="fullSyncByDefault, ..."
          style={s.input}
        />
      </Field>

      <Field label="additional">
        <KVEditor
          data={chain.additional}
          onChange={(v) => upd({ additional: v })}
        />
      </Field>

      <Field label="types (JSON)" error={typesErr}>
        <textarea
          value={typesStr}
          onChange={(e) => { setTypesStr(e.target.value); setTypesErr(""); }}
          onBlur={(e) => {
            try { upd({ types: JSON.parse(e.target.value) }); setTypesErr(""); }
            catch { setTypesErr("Invalid JSON"); }
          }}
          style={{ ...s.jsonArea, height: 90 }}
          spellCheck={false}
        />
      </Field>
    </div>
  );
}

/* ── Nodes ── */

function NodesEditor({ nodes, onChange }: { nodes: ChainNode[]; onChange: (n: ChainNode[]) => void }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<ChainNode>({ url: "", name: "" });

  function commit() {
    if (editing === "new") onChange([...nodes, draft]);
    else if (editing !== null) onChange(nodes.map((n, i) => (i === editing ? draft : n)));
    setEditing(null);
  }

  return (
    <div style={s.section}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Name</th>
            <th style={s.th}>URL</th>
            <th style={{ ...s.th, width: 90 }} />
          </tr>
        </thead>
        <tbody>
          {nodes.map((node, idx) =>
            editing === idx ? (
              <tr key={idx}>
                <td style={s.td} colSpan={3}>
                  <div style={s.inlineForm}>
                    <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" style={s.input} />
                    <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="wss://..." style={{ ...s.input, flex: 1 }} />
                    <Btn onClick={commit}>Save</Btn>
                    <Btn onClick={() => setEditing(null)} muted>Cancel</Btn>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={idx}>
                <td style={s.td}>{node.name}</td>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: 12, color: "#888" }}>{node.url}</td>
                <td style={s.td}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <a
                      href={`https://polkadot.js.org/apps/?rpc=${encodeURIComponent(node.url)}#/settings`}
                      target="_blank"
                      rel="noreferrer"
                      style={s.rowBtnLink}
                    >
                      PJS&nbsp;↗
                    </a>
                    <RowActions onEdit={() => { setEditing(idx); setDraft({ ...node }); }} onDelete={() => onChange(nodes.filter((_, i) => i !== idx))} />
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      {editing === "new" ? (
        <div style={{ ...s.inlineForm, marginTop: 8 }}>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Name" style={s.input} />
          <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="wss://..." style={{ ...s.input, flex: 1 }} />
          <Btn onClick={commit}>Add</Btn>
          <Btn onClick={() => setEditing(null)} muted>Cancel</Btn>
        </div>
      ) : (
        <AddBtn onClick={() => { setEditing("new"); setDraft({ url: "", name: "" }); }}>+ Add Node</AddBtn>
      )}
    </div>
  );
}

/* ── Assets ── */

const emptyAsset: Asset = { assetId: 0, symbol: "", precision: 10, priceId: "", name: null, type: null, typeExtras: null };

function AssetsEditor({ assets, onChange }: { assets: Asset[]; onChange: (a: Asset[]) => void }) {
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Asset>(emptyAsset);

  function openEdit(idx: number | "new") {
    setDraft(idx === "new" ? { ...emptyAsset } : { ...assets[idx as number] });
    setEditing(idx);
  }

  function commit() {
    if (editing === "new") onChange([...assets, draft]);
    else if (editing !== null) onChange(assets.map((a, i) => (i === editing ? draft : a)));
    setEditing(null);
  }

  return (
    <div style={s.section}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>ID</th>
            <th style={s.th}>Symbol</th>
            <th style={s.th}>Precision</th>
            <th style={s.th}>Type</th>
            <th style={s.th}>typeExtras</th>
            <th style={s.th}>Price ID</th>
            <th style={{ ...s.th, width: 90 }} />
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, idx) =>
            editing === idx ? (
              <tr key={idx}>
                <td colSpan={7} style={s.td}>
                  <AssetForm draft={draft} onChange={setDraft} onSave={commit} onCancel={() => setEditing(null)} />
                </td>
              </tr>
            ) : (
              <tr key={idx}>
                <td style={{ ...s.td, fontFamily: "monospace", color: "#888" }}>{asset.assetId}</td>
                <td style={{ ...s.td, fontWeight: 600, color: "#a78bfa" }}>{asset.symbol}</td>
                <td style={s.td}>{asset.precision}</td>
                <td style={{ ...s.td, color: "#888" }}>{asset.type ?? "—"}</td>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#666" }}>
                  {asset.typeExtras
                    ? Object.entries(asset.typeExtras).map(([k, v]) => `${k}=${String(v)}`).join(", ")
                    : "—"}
                </td>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: 12, color: "#666" }}>{asset.priceId}</td>
                <td style={s.td}>
                  <RowActions onEdit={() => openEdit(idx)} onDelete={() => onChange(assets.filter((_, i) => i !== idx))} />
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      {editing === "new" ? (
        <div style={{ marginTop: 8 }}>
          <AssetForm draft={draft} onChange={setDraft} onSave={commit} onCancel={() => setEditing(null)} />
        </div>
      ) : (
        <AddBtn onClick={() => openEdit("new")}>+ Add Asset</AddBtn>
      )}
    </div>
  );
}

function AssetForm({
  draft, onChange, onSave, onCancel,
}: {
  draft: Asset;
  onChange: (d: Asset) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={s.assetForm}>
      <div style={s.formRow}>
        <label style={s.label}>Asset ID</label>
        <input type="number" value={draft.assetId} onChange={(e) => onChange({ ...draft, assetId: Number(e.target.value) })} style={{ ...s.input, width: 80 }} />
        <label style={s.label}>Symbol</label>
        <input value={draft.symbol} onChange={(e) => onChange({ ...draft, symbol: e.target.value })} style={s.input} />
        <label style={s.label}>Precision</label>
        <input type="number" value={draft.precision} onChange={(e) => onChange({ ...draft, precision: Number(e.target.value) })} style={{ ...s.input, width: 70 }} />
      </div>
      <div style={s.formRow}>
        <label style={s.label}>Name</label>
        <input value={draft.name ?? ""} onChange={(e) => onChange({ ...draft, name: e.target.value || null })} placeholder="null" style={s.input} />
        <label style={s.label}>Price ID</label>
        <input value={draft.priceId} onChange={(e) => onChange({ ...draft, priceId: e.target.value })} style={s.input} />
        <label style={s.label}>Type</label>
        <input value={draft.type ?? ""} onChange={(e) => onChange({ ...draft, type: e.target.value || null })} placeholder="native / statemine" style={s.input} />
      </div>
      <div style={s.formRow}>
        <label style={s.label}>Icon URL</label>
        <input
          value={typeof draft.icon === "string" ? draft.icon : ""}
          onChange={(e) => onChange({ ...draft, icon: e.target.value || undefined })}
          style={{ ...s.input, flex: 1 }}
          placeholder="https://..."
        />
      </div>
      <Field label="typeExtras">
        <KVEditor
          data={draft.typeExtras}
          onChange={(v) => onChange({ ...draft, typeExtras: v })}
        />
      </Field>
      <div style={s.formActions}>
        <Btn onClick={onSave}>Save</Btn>
        <Btn onClick={onCancel} muted>Cancel</Btn>
      </div>
    </div>
  );
}

/* ── Explorers ── */

function ExplorersEditor({ explorers, onChange }: { explorers: Explorer[]; onChange: (e: Explorer[]) => void }) {
  const emptyExp: Explorer = { name: "", extrinsic: null, account: null, event: null };
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Explorer>(emptyExp);

  function commit() {
    if (editing === "new") onChange([...explorers, draft]);
    else if (editing !== null) onChange(explorers.map((e, i) => (i === editing ? draft : e)));
    setEditing(null);
  }

  function expField(label: string, key: keyof Explorer) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ ...s.label, width: 72 }}>{label}</label>
        <input
          value={(draft[key] as string) ?? ""}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value || null })}
          style={{ ...s.input, flex: 1 }}
          placeholder="null"
        />
      </div>
    );
  }

  const form = (
    <div style={{ ...s.assetForm, gap: 8 }}>
      {expField("Name", "name")}
      {expField("Extrinsic", "extrinsic")}
      {expField("Account", "account")}
      {expField("Event", "event")}
      <div style={s.formActions}>
        <Btn onClick={commit}>{editing === "new" ? "Add" : "Save"}</Btn>
        <Btn onClick={() => setEditing(null)} muted>Cancel</Btn>
      </div>
    </div>
  );

  return (
    <div style={s.section}>
      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Name</th>
            <th style={s.th}>Extrinsic</th>
            <th style={s.th}>Account</th>
            <th style={{ ...s.th, width: 90 }} />
          </tr>
        </thead>
        <tbody>
          {explorers.map((exp, idx) =>
            editing === idx ? (
              <tr key={idx}><td colSpan={4} style={s.td}>{form}</td></tr>
            ) : (
              <tr key={idx}>
                <td style={s.td}>{exp.name}</td>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: 12, color: "#555" }}>{exp.extrinsic ?? "—"}</td>
                <td style={{ ...s.td, fontFamily: "monospace", fontSize: 12, color: "#555" }}>{exp.account ?? "—"}</td>
                <td style={s.td}>
                  <RowActions onEdit={() => { setEditing(idx); setDraft({ ...exp }); }} onDelete={() => onChange(explorers.filter((_, i) => i !== idx))} />
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      {editing === "new" ? (
        <div style={{ marginTop: 8 }}>{form}</div>
      ) : (
        <AddBtn onClick={() => { setEditing("new"); setDraft({ ...emptyExp }); }}>+ Add Explorer</AddBtn>
      )}
    </div>
  );
}

/* ── Shared primitives ── */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={s.label}>{label}</label>
      {children}
      {error && <p style={s.errorMsg}>{error}</p>}
    </div>
  );
}

function Btn({ children, onClick, muted }: { children: React.ReactNode; onClick: () => void; muted?: boolean }) {
  return <button onClick={onClick} style={muted ? s.btnMuted : s.btnPrimary}>{children}</button>;
}

function AddBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} style={s.addBtn}>{children}</button>;
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <button onClick={onEdit} style={s.editBtn}><EditIcon /></button>
      <button onClick={onDelete} style={s.trashBtn}><TrashIcon /></button>
    </div>
  );
}

/* ── Styles ── */

const s: Record<string, React.CSSProperties> = {
  root: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 },
  chainHeader: {
    padding: "14px 24px",
    borderBottom: "1px solid #1e1e1e",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  chainName: { fontSize: 21, fontWeight: 600, color: "#f0f0f0", marginBottom: 4 },
  chainId: { fontSize: 13, fontFamily: "monospace", color: "#444", wordBreak: "break-all" },
  tabs: { display: "flex", borderBottom: "1px solid #1e1e1e", padding: "0 16px" },
  tab: { padding: "10px 18px", background: "none", border: "none", color: "#666", fontSize: 15, cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: -1 },
  activeTab: { color: "#f0f0f0", borderBottomColor: "#4f46e5" },
  tabBody: { flex: 1, overflow: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 18 },
  section: { display: "flex", flexDirection: "column", gap: 18 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 15 },
  th: { textAlign: "left", padding: "9px 12px", color: "#555", fontWeight: 500, borderBottom: "1px solid #1e1e1e", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" },
  td: { padding: "11px 12px", borderBottom: "1px solid #161616", color: "#ccc" },
  inlineForm: { display: "flex", gap: 8, alignItems: "center", padding: "6px 0" },
  assetForm: { display: "flex", flexDirection: "column", gap: 12, padding: "12px 0" },
  formRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  formActions: { display: "flex", gap: 8 },
  label: { fontSize: 14, color: "#666", flexShrink: 0 },
  input: { padding: "8px 12px", background: "#111", border: "1px solid #2a2a2a", borderRadius: 6, color: "#f0f0f0", fontSize: 15, outline: "none", minWidth: 0 },
  btnPrimary: { padding: "7px 18px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, cursor: "pointer", fontWeight: 500 },
  btnMuted: { padding: "7px 18px", background: "transparent", color: "#888", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 15, cursor: "pointer" },
  addBtn: { marginTop: 4, padding: "7px 16px", background: "transparent", color: "#4f46e5", border: "1px dashed #2a2a4a", borderRadius: 6, fontSize: 15, cursor: "pointer", alignSelf: "flex-start" },
  rowBtn: { padding: "4px 12px", background: "transparent", color: "#888", border: "1px solid #2a2a2a", borderRadius: 4, fontSize: 13, cursor: "pointer" },
  rowBtnLink: { padding: "4px 12px", background: "transparent", color: "#a78bfa", border: "1px solid #2a2a4a", borderRadius: 4, fontSize: 13, cursor: "pointer", textDecoration: "none", whiteSpace: "nowrap" },
  rowBtnDanger: { padding: "4px 12px", background: "transparent", color: "#f87171", border: "1px solid #3a1a1a", borderRadius: 4, fontSize: 13, cursor: "pointer" },
  trashBtn: { background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center", borderRadius: 4 },
  editBtn: { background: "none", border: "none", color: "#555", cursor: "pointer", padding: "2px 4px", display: "flex", alignItems: "center", borderRadius: 4 },
  jsonArea: { flex: 1, minHeight: 80, background: "#111", border: "1px solid #222", borderRadius: 8, color: "#d4d4d4", fontFamily: "monospace", fontSize: 15, padding: 14, resize: "vertical", outline: "none", lineHeight: 1.6, width: "100%", boxSizing: "border-box" },
  errorMsg: { margin: 0, fontSize: 13, color: "#f87171" },
};
