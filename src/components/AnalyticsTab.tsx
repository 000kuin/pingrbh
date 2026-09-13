import React, { useMemo } from "react";
import type { BlockFull } from "../lib/chain.ts";
import { IconExternalLink } from "./Icons.tsx";

interface Props {
  blocks: BlockFull[];
  isMobile?: boolean;
}

interface WhaleTx {
  hash:        string;
  from:        string;
  to:          string | null;
  valueEth:    number;
  blockNumber: number;
  type:        "transfer" | "contract" | "deploy";
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function formatEth(eth: number): string {
  if (eth >= 1000) return `${(eth / 1000).toFixed(2)}K ETH`;
  if (eth >= 1)    return `${eth.toFixed(4)} ETH`;
  if (eth >= 0.001) return `${eth.toFixed(6)} ETH`;
  return `${eth.toExponential(2)} ETH`;
}

export function AnalyticsTab({ blocks, isMobile }: Props) {
  const { whaleTxs, topSenders, totalValueEth, transferCount } = useMemo(() => {
    const all: WhaleTx[] = [];

    for (const b of blocks) {
      for (const tx of b.transactions) {
        // Guard against bare "0x" (no digits) which BigInt cannot parse
        const rawVal = tx.value ?? "0x0";
        const valueWei = BigInt(rawVal.length > 2 ? rawVal : "0x0");
        if (valueWei === 0n) continue;  // only txs moving ETH

        const valueEth = Number(valueWei) / 1e18;
        const type: WhaleTx["type"] = tx.to === null ? "deploy"
                                    : tx.input && tx.input.length > 2 ? "contract"
                                    : "transfer";
        all.push({
          hash:        tx.hash,
          from:        tx.from,
          to:          tx.to,
          valueEth,
          blockNumber: b.number,
          type,
        });
      }
    }

    // Sort by value descending — largest moves first
    all.sort((a, b) => b.valueEth - a.valueEth);

    // Top senders by total ETH sent
    const senderMap = new Map<string, number>();
    let totalValueEth = 0;
    let transferCount = 0;
    for (const tx of all) {
      totalValueEth += tx.valueEth;
      transferCount++;
      senderMap.set(tx.from, (senderMap.get(tx.from) ?? 0) + tx.valueEth);
    }

    const topSenders = [...senderMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([addr, eth]) => ({ addr, eth }));

    return {
      whaleTxs:     all.slice(0, 30),
      topSenders,
      totalValueEth,
      transferCount,
    };
  }, [blocks]);

  const maxSenderEth = topSenders[0]?.eth ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(3, 1fr)",
        gap: 1, background: "var(--border)",
        border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        {[
          { label: "Total ETH moved",     value: formatEth(totalValueEth), accent: true },
          { label: "Value txs in window", value: transferCount.toLocaleString(), accent: false },
          { label: "Largest single move", value: whaleTxs[0] ? formatEth(whaleTxs[0].valueEth) : "—", accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ padding: "18px 22px", background: "var(--surface)" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 800, color: accent ? "var(--orange)" : "var(--text)", letterSpacing: "-0.04em" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 280px", gap: 16 }}>

        {/* Whale tx feed */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Value transfers</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                Transactions moving ETH · sorted by value · current block window
              </div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
              color: "var(--orange)", background: "var(--orange-dim)",
              border: "1px solid var(--orange-border)", borderRadius: "var(--r-sm)", padding: "3px 8px",
            }}>Live</span>
          </div>

          {whaleTxs.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 11, fontFamily: "var(--mono)" }}>
              No ETH-value transactions in current window
            </div>
          ) : (
            <div>
              {/* Header */}
              <div style={{
                display: "grid", gridTemplateColumns: "110px 110px 80px 80px 60px 24px",
                padding: "8px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)",
              }}>
                {["From", "To", "Value", "Block", "Type", ""].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)" }}>{h}</div>
                ))}
              </div>

              {whaleTxs.map((tx, i) => {
                const typeColor = tx.type === "deploy"   ? "var(--orange)"
                                : tx.type === "contract" ? "var(--normal)"
                                : "var(--fast)";
                // Highlight very large moves
                const isWhale = i === 0 && tx.valueEth > 1;
                return (
                  <div
                    key={tx.hash}
                    style={{
                      display: "grid", gridTemplateColumns: "110px 110px 80px 80px 60px 24px",
                      padding: "9px 20px",
                      borderBottom: i < whaleTxs.length - 1 ? "1px solid var(--border)" : "none",
                      alignItems: "center",
                      background: isWhale ? "var(--orange-dim)" : "transparent",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = isWhale ? "var(--orange-dim)" : "var(--bg-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = isWhale ? "var(--orange-dim)" : "transparent"}
                  >
                    <a href={`https://robinhoodchain.blockscout.com/address/${tx.from}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--orange)" }}>
                      {shortAddr(tx.from)}
                    </a>
                    {tx.to ? (
                      <a href={`https://robinhoodchain.blockscout.com/address/${tx.to}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>
                        {shortAddr(tx.to)}
                      </a>
                    ) : (
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>— (deploy)</span>
                    )}
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: isWhale ? "var(--orange)" : "var(--text-2)" }}>
                      {formatEth(tx.valueEth)}
                    </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>
                      #{tx.blockNumber.toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                      color: typeColor, background: `${typeColor}15`,
                      border: `1px solid ${typeColor}30`,
                      borderRadius: "var(--r-sm)", padding: "2px 6px",
                    }}>
                      {tx.type}
                    </span>
                    <a href={`https://robinhoodchain.blockscout.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: "var(--text-3)", display: "flex", alignItems: "center" }}>
                      <IconExternalLink size={10} color="currentColor" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top senders */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Top senders</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>By total ETH sent this window</div>
          </div>

          {topSenders.length === 0 ? (
            <div style={{ padding: "24px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 11 }}>No data</div>
          ) : (
            <div style={{ padding: "8px 0" }}>
              {topSenders.map(({ addr, eth }, i) => {
                const pct = (eth / maxSenderEth) * 100;
                return (
                  <div key={addr} style={{ padding: "8px 16px" }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <a href={`https://robinhoodchain.blockscout.com/address/${addr}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontFamily: "var(--mono)", fontSize: 10, color: i === 0 ? "var(--orange)" : "var(--text-3)", fontWeight: i === 0 ? 700 : 400 }}>
                        {shortAddr(addr)}
                      </a>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: i === 0 ? "var(--orange)" : "var(--text-2)" }}>
                        {formatEth(eth)}
                      </span>
                    </div>
                    <div style={{ height: 2, background: "var(--bg-3)", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: i === 0 ? "var(--orange)" : "var(--border-2)", borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      <div style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-2)" }}>Data note — </strong>
        Values computed directly from tx.value (hex wei) in eth_getBlockByNumber responses.
        Only transactions with non-zero ETH value are shown. ETH amounts are exact —
        no conversion rates, no estimates. The largest transaction in the window is highlighted in orange.
      </div>
    </div>
  );
}
