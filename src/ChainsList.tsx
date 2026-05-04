import type { Chain } from "./types";

interface Props {
  chains: Chain[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

function buildHierarchy(chains: Chain[]): Array<{ chain: Chain; depth: number }> {
  const key = (c: Chain) => c.genesisHash ?? c.chainId;
  const byKey = new Map(chains.map((c) => [key(c), c]));
  const result: Array<{ chain: Chain; depth: number }> = [];
  const placed = new Set<string>();

  function addChain(chain: Chain, depth: number) {
    if (placed.has(chain.chainId)) return;
    placed.add(chain.chainId);
    result.push({ chain, depth });
    chains
      .filter((c) => c.parentId && c.parentId === key(chain) && !placed.has(c.chainId))
      .forEach((child) => addChain(child, depth + 1));
  }

  chains
    .filter((c) => !c.parentId || !byKey.has(c.parentId))
    .forEach((root) => addChain(root, 0));

  chains
    .filter((c) => !placed.has(c.chainId))
    .forEach((c) => result.push({ chain: c, depth: 1 }));

  return result;
}

export default function ChainsList({ chains, selectedId, onSelect, onAdd }: Props) {
  const items = buildHierarchy(chains);

  return (
    <div style={s.sidebar}>
      <div style={s.header}>
        <span>
          chains_v2 <span style={s.count}>{chains.length}</span>
        </span>
        <button onClick={onAdd} style={s.addBtn} title="Add chain">
          +
        </button>
      </div>
      <div style={s.list}>
        {items.map(({ chain, depth }) => {
          const isSelected = chain.chainId === selectedId;
          return (
            <button
              key={chain.chainId}
              onClick={() => onSelect(chain.chainId)}
              style={{
                ...s.item,
                paddingLeft: 12 + depth * 16,
                ...(isSelected ? s.selected : {}),
              }}
            >
              {depth > 0 && <span style={s.indent}>╰</span>}
              <span style={s.name}>{chain.name}</span>
              {chain.assets.length > 0 && (
                <span style={s.badge}>{chain.assets.length}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 260,
    minWidth: 260,
    borderRight: "1px solid #1e1e1e",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "0 8px 0 16px",
    height: 40,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#555",
    borderBottom: "1px solid #1e1e1e",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: {
    background: "#222",
    color: "#888",
    borderRadius: 10,
    padding: "0 6px",
    fontSize: 10,
    fontWeight: 500,
  },
  addBtn: {
    width: 26,
    height: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1d1d2e",
    color: "#a78bfa",
    border: "1px solid #2a2a4a",
    borderRadius: 6,
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
    flexShrink: 0,
  },
  list: { flex: 1, overflowY: "auto", padding: "6px 0" },
  item: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 6,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    background: "none",
    border: "none",
    color: "#aaa",
    fontSize: 14,
    cursor: "pointer",
    textAlign: "left",
  },
  selected: { background: "#1d1d2e", color: "#f0f0f0" },
  indent: { color: "#333", fontSize: 12, flexShrink: 0 },
  name: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  badge: {
    background: "#252535",
    color: "#a78bfa",
    fontSize: 10,
    fontWeight: 600,
    padding: "1px 6px",
    borderRadius: 8,
    flexShrink: 0,
  },
};
