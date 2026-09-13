import React, { useState, useEffect, useCallback } from "react";
import { IconCopy, IconCheck, IconActivity } from "../components/Icons.tsx";
import { LiveDot } from "../components/Icons.tsx";
import { getRpcUrl } from "../lib/activeRpc.ts";

// ── Live data fetcher ────────────────────────────────────────────────────────
async function fetchLiveData(): Promise<object> {
  const rpcUrl = getRpcUrl();

  async function rpc(method: string, params: unknown[] = []) {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(6000),
    });
    const j = await res.json() as { result: string };
    return j.result;
  }

  const hex = (v: string) => parseInt(v, 16);

  const t0 = performance.now();
  const blockHex = await rpc("eth_blockNumber") as string;
  const latencyMs = Math.round(performance.now() - t0);
  const blockNumber = hex(blockHex);
  const level = latencyMs < 150 ? "fast" : latencyMs < 500 ? "normal" : latencyMs < 1500 ? "slow" : "down";

  // fetch last 20 blocks for stats
  const raw = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      rpc("eth_getBlockByNumber", [`0x${(blockNumber - i).toString(16)}`, true])
    )
  ) as unknown as Array<Record<string, unknown>>;

  const blocks = raw.filter(Boolean);
  const wallets = new Set<string>();
  let totalTx = 0, deploys = 0;

  for (const b of blocks) {
    const txs = b.transactions as Array<Record<string, string>>;
    if (!Array.isArray(txs)) continue;
    totalTx += txs.length;
    for (const tx of txs) {
      if (tx.from) wallets.add(tx.from.toLowerCase());
      if (tx.to == null || tx.to === "") deploys++;
    }
  }

  const timestamps = blocks.map(b => hex(b.timestamp as string)).sort((a, b) => b - a);
  const spanSec = timestamps.length > 1 ? timestamps[0]! - timestamps[timestamps.length - 1]! : 0;
  const effectiveSpan = spanSec >= 5 ? spanSec : blocks.length * 0.1;
  const txPerMin = effectiveSpan > 0 ? Math.round((totalTx / effectiveSpan) * 60) : 0;

  const blockTimeSamples: number[] = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    const tDiff = hex(blocks[i]!.timestamp as string) - hex(blocks[i + 1]!.timestamp as string);
    const nDiff = hex(blocks[i]!.number as string) - hex(blocks[i + 1]!.number as string);
    if (tDiff > 0 && nDiff > 0) blockTimeSamples.push(tDiff / nDiff);
  }
  const avgBlockTimeSec = blockTimeSamples.length > 0
    ? Math.round((blockTimeSamples.reduce((a, b) => a + b, 0) / blockTimeSamples.length) * 1000) / 1000
    : 0.1;

  // base fee from latest block
  const latestBlock = blocks[0] as Record<string, string> | undefined;
  const baseFeeGwei = latestBlock?.baseFeePerGas
    ? Math.round(hex(latestBlock.baseFeePerGas) / 1e9 * 10000) / 10000
    : 0;

  return {
    rpc: {
      latencyMs,
      blockNumber,
      level,
      endpoint: rpcUrl,
    },
    chain: {
      id: 4663,
      name: "Robinhood Chain",
      stack: "Arbitrum Orbit",
    },
    stats: {
      txPerMin,
      activeWallets: wallets.size,
      contractDeploys: deploys,
      avgTxPerBlock: blocks.length > 0 ? Math.round(totalTx / blocks.length) : 0,
      avgBlockTimeSec,
      baseFeeGwei,
      windowBlocks: blocks.length,
    },
    timestamp: new Date().toISOString(),
  };
}

// ── Code snippets ────────────────────────────────────────────────────────────
const RPC_ENDPOINT = "https://rpc.mainnet.chain.robinhood.com";
const DATA_URL     = "https://pingrbh.com/data.json";

const SNIPPETS = {
  fetch: `// Snapshot (updated every 5 min) — instant, no computation needed
const res  = await fetch("${DATA_URL}");
const data = await res.json();
console.log(data.rpc.latencyMs, data.stats.txPerMin);

// Or call the RPC directly for real-time data
const t0 = performance.now();
const rpc = await fetch("${RPC_ENDPOINT}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ jsonrpc:"2.0", id:1, method:"eth_blockNumber", params:[] }),
});
const latencyMs = Math.round(performance.now() - t0);
const blockNumber = parseInt((await rpc.json()).result, 16);
console.log({ latencyMs, blockNumber });`,

  viem: `import { createPublicClient, http } from "viem";

const client = createPublicClient({
  chain: {
    id: 4663,
    name: "Robinhood Chain",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["${RPC_ENDPOINT}"] } },
  },
  transport: http("${RPC_ENDPOINT}"),
});

const blockNumber = await client.getBlockNumber();
const gasPrice    = await client.getGasPrice();
console.log({ blockNumber, gasPrice });`,

  curl: `# Snapshot — updated every 5 min, returns JSON directly
curl https://pingrbh.com/data.json

# Real-time block number via RPC
curl -s -X POST ${RPC_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}' | jq .

# Latest block with transactions
curl -s -X POST ${RPC_ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_getBlockByNumber","params":["latest",false]}' | jq .`,
};

type Snippet = keyof typeof SNIPPETS;

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 10px",
        background: "transparent",
        border: `1px solid ${copied ? "var(--fast-border)" : "var(--border-2)"}`,
        borderRadius: "var(--r-sm)",
        color: copied ? "var(--fast)" : "var(--text-3)",
        fontSize: 10, fontFamily: "var(--mono)", cursor: "pointer",
        transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
      }}
    >
      {copied ? <IconCheck size={10} color="var(--fast)" /> : <IconCopy size={10} color="currentColor" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

export function ApiPage() {
  const [data, setData]       = useState<object | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [snippet, setSnippet] = useState<Snippet>("fetch");
  const [tick, setTick]       = useState(0); // countdown

  const load = useCallback(async () => {
    try {
      const d = await fetchLiveData();
      setData(d);
      setError(null);
      setTick(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // countdown + auto-refresh every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => {
        if (t <= 1) { load(); return 5; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [load]);

  const jsonStr = data ? JSON.stringify(data, null, 2) : "";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 28px 80px" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--orange)" }}>
            API
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
            color: "var(--fast)", background: "var(--fast-dim)",
            border: "1px solid var(--fast-border)", borderRadius: "var(--r-sm)", padding: "2px 8px",
          }}>
            FREE
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text)", marginBottom: 8 }}>
          pingrbh API
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
          The Robinhood Chain RPC is public — no API key, no rate limit. Call it directly from your app.
          The live preview below shows the same data pingrbh uses, fetched fresh from the chain.
        </p>
      </div>

      {/* Snapshot endpoint */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 8,
      }}>
        <div style={{
          padding: "12px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>
              SNAPSHOT · updated every 5 min
            </span>
          </div>
          <CopyButton text="https://pingrbh.com/data.json" label="Copy URL" />
        </div>
        <div style={{ padding: "14px 20px" }}>
          <code style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text)" }}>
            <span style={{ color: "var(--text-3)" }}>GET </span>
            <span style={{ color: "var(--orange)" }}>https://pingrbh.com/data.json</span>
          </code>
        </div>
      </div>

      {/* RPC endpoint */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 16,
      }}>
        <div style={{
          padding: "12px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>
              REAL-TIME RPC
            </span>
          </div>
          <CopyButton text="https://rpc.mainnet.chain.robinhood.com" label="Copy URL" />
        </div>
        <div style={{ padding: "14px 20px" }}>
          <code style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text)" }}>
            <span style={{ color: "var(--text-3)" }}>POST </span>
            <span style={{ color: "var(--orange)" }}>https://rpc.mainnet.chain.robinhood.com</span>
          </code>
        </div>
      </div>

      {/* Code snippets */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 16,
      }}>
        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {(Object.keys(SNIPPETS) as Snippet[]).map(k => (
            <button
              key={k}
              onClick={() => setSnippet(k)}
              style={{
                padding: "10px 20px",
                background: "transparent", border: "none",
                borderBottom: `2px solid ${snippet === k ? "var(--orange)" : "transparent"}`,
                color: snippet === k ? "var(--text)" : "var(--text-3)",
                fontFamily: "var(--mono)", fontSize: 12, fontWeight: snippet === k ? 700 : 400,
                cursor: "pointer", transition: "all 0.1s",
              }}
            >
              {k}
            </button>
          ))}
        </div>
        {/* Code */}
        <div style={{ position: "relative", padding: "20px" }}>
          <pre style={{
            fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-2)",
            lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all",
          }}>
            {SNIPPETS[snippet]}
          </pre>
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <CopyButton text={SNIPPETS[snippet]} />
          </div>
        </div>
      </div>

      {/* Live response */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        <div style={{
          padding: "12px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LiveDot color="var(--orange)" size={6} />
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>
              Live response preview · updates every 5s
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-4)" }}>
              (next in {tick}s)
            </span>
          </div>
          <CopyButton text={jsonStr} label="Copy JSON" />
        </div>

        <div style={{ padding: "20px", minHeight: 200 }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 11 }}>
              <LiveDot color="var(--orange)" size={6} />
              Fetching live data…
            </div>
          )}
          {error && (
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--down)" }}>
              Error: {error}
            </div>
          )}
          {jsonStr && (
            <pre style={{
              fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-2)",
              lineHeight: 1.8, margin: 0, whiteSpace: "pre-wrap",
            }}>
              {jsonStr.split("\n").map((line, i) => {
                // Minimal syntax highlighting
                const isKey   = /^\s+"[^"]+":/.test(line);
                const isStr   = /:\s+"/.test(line);
                const isNum   = /:\s+[\d.]+[,]?$/.test(line);
                const color   = isStr ? "var(--fast)" : isNum ? "var(--orange)" : "var(--text-2)";
                return (
                  <span key={i} style={{ color: isKey ? "var(--text-3)" : color }}>
                    {line}{"\n"}
                  </span>
                );
              })}
            </pre>
          )}
        </div>
      </div>

      {/* Field docs */}
      <div style={{ marginTop: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Response fields</div>
        </div>
        <div style={{ padding: "8px 0" }}>
          {[
            { field: "rpc.latencyMs",         desc: "Round-trip time for eth_blockNumber from the requester's browser, in milliseconds" },
            { field: "rpc.blockNumber",        desc: "Current block number on Robinhood Chain" },
            { field: "rpc.level",              desc: "fast (<150ms) · normal (150–499ms) · slow (500–1499ms) · down (≥1500ms)" },
            { field: "rpc.endpoint",           desc: "The RPC URL currently being used (auto-selected as the fastest available)" },
            { field: "stats.txPerMin",         desc: "Transactions per minute derived from the last 20 blocks" },
            { field: "stats.activeWallets",    desc: "Unique from-addresses in the current block window" },
            { field: "stats.contractDeploys",  desc: "Number of CREATE transactions (to = null) in the window" },
            { field: "stats.avgTxPerBlock",    desc: "Average transaction count per block" },
            { field: "stats.avgBlockTimeSec",  desc: "Measured average block time in seconds (typically ~0.1s)" },
            { field: "stats.baseFeeGwei",      desc: "Base fee of the latest block in gwei" },
          ].map(({ field, desc }) => (
            <div key={field} style={{
              display: "grid", gridTemplateColumns: "220px 1fr",
              padding: "10px 20px", borderBottom: "1px solid var(--border)",
              alignItems: "start", gap: 16,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)"}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              <code style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--orange)" }}>
                {field}
              </code>
              <span style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-2)" }}>How it works — </strong>
        The Robinhood Chain RPC at <code style={{ fontFamily: "var(--mono)", fontSize: 10 }}>rpc.mainnet.chain.robinhood.com</code> is public and open.
        All data on this page is fetched directly from the chain — no server, no cache, no intermediary.
        The latency reading reflects your network distance to the RPC node. CORS is open — call it from any frontend, no proxy needed.
      </div>
    </div>
  );
}
