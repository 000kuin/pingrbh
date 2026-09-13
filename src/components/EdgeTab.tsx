import React, { useState, useEffect } from "react";
import type { ContractDeploy } from "../hooks/useChain.ts";

interface Props {
  deploys: ContractDeploy[];
  lastBlock: number;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

/** Compute live age from on-chain timestamp (seconds) */
function liveAge(timestamp: number, nowSec: number): string {
  const diff = Math.max(0, nowSec - timestamp);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function sizeLabel(bytes: number): { label: string; color: string } {
  if (bytes > 20000) return { label: "Large",    color: "var(--slow)"   };
  if (bytes > 3000)  return { label: "Contract", color: "var(--orange)" };
  if (bytes > 100)   return { label: "Small",    color: "var(--normal)" };
  return                    { label: "Minimal",  color: "var(--fast)"   };
}

export function EdgeTab({ deploys, lastBlock }: Props) {
  // Live clock ticking every second so ages update
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const largestDeploy = deploys.length > 0 ? Math.max(...deploys.map(d => d.inputSize)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 1, background: "var(--border)",
        border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        {[
          { label: "New contracts",   value: deploys.length.toString(),         accent: deploys.length > 0 },
          { label: "Latest block",    value: lastBlock > 0 ? `#${lastBlock.toLocaleString()}` : "—", accent: false },
          { label: "Largest deploy",  value: largestDeploy > 0 ? formatBytes(largestDeploy) : "—",   accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ padding: "18px 22px", background: "var(--surface)" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 800, color: accent ? "var(--orange)" : "var(--text)", letterSpacing: "-0.04em" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Deploy feed */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Contract deployments</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
              New bytecode hitting Robinhood Chain · potential token launches
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
            color: "var(--orange)", background: "var(--orange-dim)",
            border: "1px solid var(--orange-border)",
            borderRadius: "var(--r-sm)", padding: "3px 8px",
          }}>
            Live
          </span>
        </div>

        {deploys.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
            No contract deployments in current block window — monitoring for new activity
          </div>
        ) : (
          <div>
            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "32px 140px 140px 90px 70px 80px",
              padding: "8px 20px",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-2)",
            }}>
              {["", "Deployer", "Tx hash", "Type", "Size", "Age"].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)" }}>{h}</div>
              ))}
            </div>

            {deploys.map((d, i) => {
              const sz = sizeLabel(d.inputSize);
              return (
                <div
                  key={d.hash}
                  style={{
                    display: "grid", gridTemplateColumns: "32px 140px 140px 90px 70px 80px",
                    padding: "11px 20px",
                    borderBottom: i < deploys.length - 1 ? "1px solid var(--border)" : "none",
                    alignItems: "center",
                    animation: i === 0 ? "fade-up 0.3s ease" : undefined,
                    cursor: "default",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                >
                  {/* New indicator */}
                  <div>
                    {nowSec - d.timestamp < 10 && (
                      <span style={{
                        display: "inline-block", width: 6, height: 6,
                        borderRadius: "50%", background: "var(--orange)",
                        animation: "pulse-ring 1.5s ease-out infinite",
                      }} />
                    )}
                  </div>

                  <a
                    href={`https://robinhoodchain.blockscout.com/address/${d.from}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--orange)" }}
                  >
                    {shortAddr(d.from)}
                  </a>
                  <a
                    href={`https://robinhoodchain.blockscout.com/tx/${d.hash}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}
                  >
                    {shortAddr(d.hash)}
                  </a>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                    color: sz.color, background: `${sz.color}15`,
                    border: `1px solid ${sz.color}30`,
                    borderRadius: "var(--r-sm)", padding: "2px 8px",
                    display: "inline-block", width: "fit-content",
                  }}>
                    {sz.label}
                  </span>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-2)" }}>
                    {formatBytes(d.inputSize)}
                  </div>
                  {/* Age computed live from on-chain timestamp */}
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>
                    {d.timestamp > 0 ? liveAge(d.timestamp, nowSec) : `#${d.blockNumber}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{
        padding: "14px 20px",
        background: "var(--orange-dim)", border: "1px solid var(--orange-border)", borderRadius: "var(--r)",
        fontSize: 12, color: "var(--text-2)", lineHeight: 1.65,
      }}>
        <span style={{ fontWeight: 700, color: "var(--orange)" }}>Edge note — </span>
        Bytecode size is computed directly from the transaction input field (accurate to the byte).
        Ages are derived from the on-chain block timestamp. Large deploys ({">"}3KB) typically indicate
        full ERC-20 tokens. Verify all addresses on Blockscout before trading.
      </div>
    </div>
  );
}
