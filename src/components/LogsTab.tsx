import React, { useMemo, useState, useEffect } from "react";
import type { BlockFull } from "../lib/chain.ts";
import { IconExternalLink } from "./Icons.tsx";

interface Props {
  blocks: BlockFull[];
}

type TxType = "all" | "transfer" | "contract" | "deploy";

interface LogEntry {
  hash:        string;
  from:        string;
  to:          string | null;
  valueEth:    number;
  blockNumber: number;
  timestamp:   number;
  type:        "transfer" | "contract" | "deploy";
  selector:    string;
  gasPrice:    number;  // gwei
}

// Minimal selector lookup for log display
const SEL: Record<string, string> = {
  "0xa9059cbb": "transfer()",
  "0x23b872dd": "transferFrom()",
  "0x095ea7b3": "approve()",
  "0x128acb08": "swap()",
  "0x04e45aaf": "exactInputSingle()",
  "0x5ae401dc": "multicall()",
  "0xf85f8e41": "launchAndBuy()",
  "0xf35abbcf": "launchToken()",
  "0xd0e30db0": "deposit()",
  "0x2e1a7d4d": "withdraw()",
  "0x4e71d92d": "claim()",
  "0xa694fc3a": "stake()",
  "0xe8e33700": "addLiquidity()",
  "0x7ff36ab5": "swapExactETHForTokens()",
  "0x791ac947": "swapExactTokensForETH()",
  "0x38ed1739": "swapExactTokensForTokens()",
};

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}
function shortHash(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}
function liveAge(ts: number, nowSec: number): string {
  const d = Math.max(0, nowSec - ts);
  if (d < 60)   return `${d}s`;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  return `${Math.floor(d / 3600)}h`;
}
function fmtEth(eth: number): string {
  if (eth === 0) return "—";
  if (eth < 0.0001) return "<0.0001";
  return eth.toFixed(4);
}

export function LogsTab({ blocks }: Props) {
  const [filter, setFilter] = useState<TxType>("all");
  const [minEth, setMinEth]  = useState("");
  const [nowSec, setNowSec]  = useState(() => Math.floor(Date.now() / 1000));

  // Tick every second so ages update live (same pattern as EdgeTab)
  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const allEntries = useMemo((): LogEntry[] => {
    const entries: LogEntry[] = [];
    for (const b of blocks) {
      for (const tx of b.transactions) {
        const rawVal = tx.value ?? "0x0";
        const valueEth = Number(BigInt(rawVal.length > 2 ? rawVal : "0x0")) / 1e18;
        const type: LogEntry["type"] = tx.to === null ? "deploy"
                                     : tx.input && tx.input.length > 2 ? "contract"
                                     : "transfer";
        const selector = tx.input?.slice(0, 10) ?? "0x";
        const gasPriceGwei = parseInt(tx.gasPrice ?? "0x0", 16) / 1e9;
        entries.push({
          hash:        tx.hash,
          from:        tx.from,
          to:          tx.to,
          valueEth,
          blockNumber: b.number,
          timestamp:   b.timestamp,
          type,
          selector,
          gasPrice:    gasPriceGwei,
        });
      }
    }
    return entries.sort((a, b) => b.blockNumber - a.blockNumber);
  }, [blocks]);

  const filtered = useMemo(() => {
    const minEthVal = parseFloat(minEth) || 0;
    return allEntries.filter(e => {
      if (filter !== "all" && e.type !== filter) return false;
      if (minEthVal > 0 && e.valueEth < minEthVal) return false;
      return true;
    });
  }, [allEntries, filter, minEth]);

  const TYPE_COLOR: Record<string, string> = {
    transfer: "var(--fast)",
    contract: "var(--normal)",
    deploy:   "var(--orange)",
  };

  const counts = {
    all:      allEntries.length,
    transfer: allEntries.filter(e => e.type === "transfer").length,
    contract: allEntries.filter(e => e.type === "contract").length,
    deploy:   allEntries.filter(e => e.type === "deploy").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {(["all","transfer","contract","deploy"] as TxType[]).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 600,
              color: filter === t ? (t === "all" ? "var(--text)" : TYPE_COLOR[t] ?? "var(--text)") : "var(--text-3)",
              background: filter === t ? "var(--surface)" : "transparent",
              border: `1px solid ${filter === t ? "var(--border-2)" : "transparent"}`,
              borderRadius: "var(--r-sm)", cursor: "pointer", transition: "all 0.1s",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.6 }}>{counts[t]}</span>
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>Min ETH:</span>
          <input
            value={minEth}
            onChange={e => setMinEth(e.target.value)}
            placeholder="0"
            style={{
              width: 72, padding: "5px 10px",
              background: "var(--surface)", border: "1px solid var(--border-2)",
              borderRadius: "var(--r-sm)", color: "var(--text)",
              fontFamily: "var(--mono)", fontSize: 11, outline: "none",
            }}
            onFocus={e => (e.currentTarget as HTMLInputElement).style.borderColor = "var(--orange)"}
            onBlur={e => (e.currentTarget as HTMLInputElement).style.borderColor = "var(--border-2)"}
          />
        </div>
      </div>

      {/* Log table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Transaction log</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
              {filtered.length.toLocaleString()} entries · all from on-chain block data
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
            color: "var(--orange)", background: "var(--orange-dim)",
            border: "1px solid var(--orange-border)", borderRadius: "var(--r-sm)", padding: "3px 8px",
          }}>Live</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 11, fontFamily: "var(--mono)" }}>
            No transactions match current filters
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "90px 100px 100px 100px 70px 60px 24px",
              padding: "8px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)",
            }}>
              {["Hash", "From", "To", "Method", "Value", "Age", ""].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)" }}>{h}</div>
              ))}
            </div>

            <div style={{ maxHeight: 520, overflowY: "auto" }}>
              {filtered.slice(0, 200).map((e, i) => {
                const methodName = e.type === "deploy" ? "deploy"
                                 : SEL[e.selector] ?? e.selector;
                const typeColor = TYPE_COLOR[e.type] ?? "var(--text-3)";
                return (
                  <div
                    key={e.hash}
                    style={{
                      display: "grid", gridTemplateColumns: "90px 100px 100px 100px 70px 60px 24px",
                      padding: "8px 20px",
                      borderBottom: i < Math.min(filtered.length, 200) - 1 ? "1px solid var(--border)" : "none",
                      alignItems: "center",
                    }}
                    onMouseEnter={el => (el.currentTarget as HTMLDivElement).style.background = "var(--bg-2)"}
                    onMouseLeave={el => (el.currentTarget as HTMLDivElement).style.background = "transparent"}
                  >
                    <a href={`https://robinhoodchain.blockscout.com/tx/${e.hash}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>
                      {shortHash(e.hash)}
                    </a>
                    <a href={`https://robinhoodchain.blockscout.com/address/${e.from}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--orange)" }}>
                      {shortAddr(e.from)}
                    </a>
                    {e.to ? (
                      <a href={`https://robinhoodchain.blockscout.com/address/${e.to}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>
                        {shortAddr(e.to)}
                      </a>
                    ) : (
                      <span style={{ fontSize: 10, color: "var(--text-3)" }}>—</span>
                    )}
                    <span style={{
                      fontSize: 9, fontWeight: 600,
                      color: typeColor,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      fontFamily: "var(--mono)",
                    }} title={methodName}>
                      {methodName}
                    </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: e.valueEth > 0 ? "var(--text-2)" : "var(--text-3)", fontWeight: e.valueEth > 0 ? 600 : 400 }}>
                      {fmtEth(e.valueEth)}
                    </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>
                      {e.timestamp > 0 ? liveAge(e.timestamp, nowSec) : `#${e.blockNumber}`}
                    </span>
                    <a href={`https://robinhoodchain.blockscout.com/tx/${e.hash}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: "var(--text-3)", display: "flex", alignItems: "center" }}>
                      <IconExternalLink size={10} color="currentColor" />
                    </a>
                  </div>
                );
              })}
            </div>

            {filtered.length > 200 && (
              <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                Showing 200 of {filtered.length.toLocaleString()} entries — use filters to narrow
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note */}
      <div style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-2)" }}>Data source — </strong>
        Every transaction shown is from eth_getBlockByNumber (full tx bodies) across the current 60-block window.
        Method names decoded from 4-byte selectors — unrecognized selectors show raw hex.
        Values are exact wei conversions, no estimation. Links open in Blockscout.
      </div>
    </div>
  );
}
