export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface RemoteConfigEntry {
  key: string;
  value: string;
}

export type AppView = "login" | "dashboard";

export interface ChainNode {
  url: string;
  name: string;
}

export interface Asset {
  assetId: number;
  symbol: string;
  precision: number;
  priceId: string;
  name: string | null;
  type: string | null;
  typeExtras: Record<string, unknown> | null;
  icon?: string;
  buyProviders?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Explorer {
  name: string;
  extrinsic: string | null;
  account: string | null;
  event: string | null;
}

export interface Chain {
  chainId: string;
  genesisHash?: string;
  parentId?: string | null;
  name: string;
  addressPrefix: number;
  nodeSelectionStrategy: string | null;
  nodes: ChainNode[];
  additional: Record<string, unknown> | null;
  assets: Asset[];
  explorers: Explorer[];
  options: string[] | null;
  types: unknown;
  [key: string]: unknown;
}
