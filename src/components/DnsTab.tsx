import React, { useState } from "react";
import { useRpcs } from "../hooks/useRpcs.ts";
import { IconCheck, IconCopy, IconExternalLink } from "./Icons.tsx";
import { LiveDot } from "./Icons.tsx";

const STATUS_COLOR = {
  online:   "var(--fast)",
  slow:     "var(--normal)",
  down:     "var(--down)",
  untested: "var(--text-3)",
};

const STATUS_LABEL = {
  online:   "Online",
  slow:     "Slow",
  down:     "Down",
  untested: "Testing…",
};

function CopyButton({ text, label = "Copy URL" }: { text: string; label?: string }) {
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
        transition: "all 0.15s", flexShrink: 0, whiteSpace: "nowrap",
      }}
    >
      {copied ? <IconCheck size={10} color="var(--fast)" /> : <IconCopy size={10} color="currentColor" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

export function DnsTab({ isMobile }: { isMobile?: boolean }) {
  const { endpoints, activeUrl, refresh } = useRpcs();
  const fastest = endpoints.find(e => e.status === "online");
  const activeEndpoint = endpoints.find(e => e.url === activeUrl);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Summary */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(3, 1fr)",
        gap: 1, background: "var(--border)",
        border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        {[
          { label: "Endpoints tested", value: endpoints.filter(e => e.status !== "untested").length.toString(), accent: false },
          { label: "Online",           value: endpoints.filter(e => e.status === "online").length.toString(), accent: true },
          { label: "Fastest",          value: fastest?.latencyMs != null ? `${fastest.latencyMs}ms` : "—", accent: !!fastest },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ padding: "18px 22px", background: "var(--surface)" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 800, color: accent ? "var(--orange)" : "var(--text)", letterSpacing: "-0.04em" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Active RPC callout — shows which endpoint is currently routing all data */}
      {fastest && (
        <div style={{
          padding: "16px 20px",
          background: "var(--fast-dim)",
          border: "1px solid var(--fast-border)",
          borderRadius: "var(--r)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LiveDot color="var(--fast)" size={7} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
                Active RPC — {activeEndpoint?.latencyMs ?? fastest.latencyMs}ms
                {activeEndpoint && activeEndpoint.url !== fastest.url && (
                  <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 400, marginLeft: 8 }}>
                    (failover active)
                  </span>
                )}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>{activeUrl}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <CopyButton text={activeUrl} label="Copy URL" />
          </div>
        </div>
      )}

      {/* RPC table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>RPC Router</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
              All known Robinhood Chain endpoints · tested every 15s · sorted by latency
            </div>
          </div>
          <button
            onClick={refresh}
            style={{
              padding: "6px 12px", fontSize: 11, fontWeight: 600,
              color: "var(--orange)", background: "var(--orange-dim)",
              border: "1px solid var(--orange-border)", borderRadius: "var(--r-sm)",
              cursor: "pointer", transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.8"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
          >
            Retest
          </button>
        </div>

        {/* Header */}
        <div style={{
          display: "grid", gridTemplateColumns: "32px 180px 1fr 90px 100px 120px 100px",
          padding: "8px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)",
        }}>
          {["status", "Name", "URL", "Provider", "Latency", "Block", "actions"].map(h => (
            <div key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)" }}>{h === "status" || h === "actions" ? "" : h}</div>
          ))}
        </div>

        {endpoints.map((ep, i) => {
          const color = STATUS_COLOR[ep.status];
          const isActive = ep.url === activeUrl;
          return (
            <div
              key={ep.url}
              style={{
                display: "grid", gridTemplateColumns: "32px 180px 1fr 90px 100px 120px 100px",
                padding: "12px 20px",
                borderBottom: i < endpoints.length - 1 ? "1px solid var(--border)" : "none",
                alignItems: "center",
                background: isActive ? "rgba(244,129,32,0.04)" : "transparent",
                borderLeft: isActive ? "2px solid var(--orange)" : "2px solid transparent",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = isActive ? "rgba(244,129,32,0.08)" : "var(--bg-2)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = isActive ? "rgba(244,129,32,0.04)" : "transparent"}
            >
              {/* Status dot */}
              <div>
                {ep.status === "untested"
                  ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--text-3)", display: "inline-block", animation: "blink 1.5s infinite" }} />
                  : <LiveDot color={color} size={7} />
                }
              </div>

              {/* Name + status badge */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{ep.name}</span>
                  {isActive && (
                    <span style={{
                      fontSize: 8, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                      color: "var(--orange)", background: "var(--orange-dim)",
                      border: "1px solid var(--orange-border)", borderRadius: "var(--r-sm)", padding: "1px 5px",
                    }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
                  color, background: `${color}15`, border: `1px solid ${color}30`,
                  borderRadius: "var(--r-sm)", padding: "1px 6px",
                }}>
                  {STATUS_LABEL[ep.status]}
                </span>
              </div>

              {/* URL */}
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ep.url}
              </div>

              {/* Provider */}
              <div style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>{ep.provider}</div>

              {/* Latency */}
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800, color: ep.latencyMs !== null ? color : "var(--text-3)" }}>
                {ep.latencyMs !== null ? `${ep.latencyMs} ms` : ep.status === "down" ? "timeout" : "—"}
              </div>

              {/* Block */}
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>
                {ep.blockNumber !== null ? `#${ep.blockNumber.toLocaleString()}` : "—"}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6 }}>
                <CopyButton text={ep.url} label="Copy" />
                {ep.requiresKey && (
                  <span style={{ fontSize: 9, color: "var(--text-3)", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "3px 6px", whiteSpace: "nowrap" }}>
                    needs key
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MetaMask setup guide */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Add Robinhood Chain to your wallet</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>MetaMask · Rabby · any EVM wallet</div>
        </div>
        <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {[
            { label: "Network Name", value: "Robinhood Chain" },
            { label: "Chain ID",     value: "4663" },
            { label: "Currency",     value: "ETH" },
            { label: "RPC URL",      value: fastest?.url ?? "https://rpc.mainnet.chain.robinhood.com" },
            { label: "Explorer",     value: "robinhoodchain.blockscout.com" },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>{value}</span>
                <CopyButton text={value} label="" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-2)" }}>How this works — </strong>
        Each endpoint is tested with a live eth_blockNumber call timed from your browser. Latency reflects
        your network distance to each node. Use the fastest endpoint for lowest slippage and fastest tx confirmation.
        Public RPCs are rate-limited — for production use, get a dedicated key from Alchemy or QuickNode.
      </div>
    </div>
  );
}
