import React from "react";
import type { PingLevel } from "../hooks/usePing.ts";
import type { ChainStats } from "../hooks/useChain.ts";
import { RollingNumber } from "./RollingNumber.tsx";
import { LiveDot } from "./Icons.tsx";

const LEVEL = {
  fast:   { color: "var(--fast)",   bg: "var(--fast-dim)",   border: "var(--fast-border)",   verdict: "ONLINE",   label: "All systems operational" },
  normal: { color: "var(--normal)", bg: "var(--normal-dim)", border: "var(--normal-border)", verdict: "NOMINAL",  label: "Minor latency detected"  },
  slow:   { color: "var(--slow)",   bg: "var(--slow-dim)",   border: "var(--slow-border)",   verdict: "DEGRADED", label: "Elevated response times"  },
  down:   { color: "var(--down)",   bg: "var(--down-dim)",   border: "var(--down-border)",   verdict: "OUTAGE",   label: "RPC not responding"       },
};

interface Props {
  latencyMs:    number;
  level:        PingLevel;
  avg5m:        number;
  uptime:       number;
  blockNumber:  number;
  baseFeeGwei:  number;
  lastUpdated:  Date | null;
  blocksOk:     boolean;
  chainError:   string | null;
  chainLoading: boolean;
  stats:        ChainStats;
  isMobile?:    boolean;
}

export function HeroPing({
  latencyMs, level, avg5m, uptime, blockNumber, baseFeeGwei,
  lastUpdated, stats, blocksOk, chainError, chainLoading, isMobile,
}: Props) {
  const cfg = LEVEL[level];

  return (
    <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>

      {/* Status banner */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "8px 16px" : "8px 32px",
        background: cfg.bg,
        borderBottom: `1px solid ${cfg.border}`,
        flexWrap: "wrap", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LiveDot color={cfg.color} size={6} />
          <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, letterSpacing: "0.02em" }}>
            {cfg.verdict}
          </span>
          {!isMobile && (
            <>
              <span style={{ fontSize: 11, color: cfg.color, opacity: 0.7 }}>—</span>
              <span style={{ fontSize: 11, color: cfg.color, opacity: 0.7 }}>{cfg.label}</span>
            </>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 24 }}>
          {[
            { name: "RPC",    ok: level !== "down" },
            { name: "Blocks", ok: blocksOk && !chainError },
            { name: "Txs",    ok: level !== "down" && !chainError },
          ].map(({ name, ok }) => (
            <span key={name} style={{ fontSize: 10, color: ok ? cfg.color : "var(--down)", fontFamily: "var(--mono)", fontWeight: 600 }}>
              {ok ? "●" : "○"} {name}
            </span>
          ))}
          {lastUpdated && !isMobile && (
            <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Main metrics */}
      <div style={{
        padding: isMobile ? "20px 16px" : "28px 32px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1px 1fr 1px 1fr",
        alignItems: "start",
        gap: isMobile ? "20px 16px" : 0,
      }}>

        {/* Latency — always shown, full-width on mobile */}
        <div style={{ paddingRight: isMobile ? 0 : 32, gridColumn: isMobile ? "1 / -1" : undefined }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            RPC Response Time
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16 }}>
            <RollingNumber
              value={latencyMs}
              decimals={0}
              color="var(--text)"
              style={{
                fontSize: isMobile ? "clamp(48px, 16vw, 72px)" : "clamp(56px, 7vw, 88px)",
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 0.9,
                fontFamily: "var(--mono)",
              }}
            />
            <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 400, color: "var(--text-3)", paddingBottom: 6 }}>ms</span>
          </div>
          <div style={{ display: "flex", gap: isMobile ? 16 : 20, flexWrap: "wrap" }}>
            {[
              { label: "avg",      value: `${avg5m}ms` },
              { label: "uptime",   value: `${uptime}%` },
              { label: "block",    value: blockNumber > 0 ? `#${blockNumber.toLocaleString()}` : "—" },
              { label: "base fee", value: baseFeeGwei > 0 ? `${baseFeeGwei < 1 ? baseFeeGwei.toFixed(4) : baseFeeGwei.toFixed(2)} gwei` : "—" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 3 }}>{label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider — desktop only */}
        {!isMobile && <div style={{ width: 1, height: 80, background: "var(--border)", margin: "0 32px" }} />}

        {/* Chain Activity */}
        <div style={{ padding: isMobile ? 0 : "0 32px" }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            Chain Activity
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16 }}>
            <span style={{
              fontFamily: "var(--mono)",
              fontSize: isMobile ? "clamp(36px, 10vw, 52px)" : "clamp(56px, 7vw, 88px)",
              fontWeight: 700, letterSpacing: "-0.05em", lineHeight: 0.9,
              color: chainLoading ? "var(--text-3)" : "var(--orange)",
            }}>
              {chainLoading ? "—" : stats.txPerMin.toLocaleString()}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 400, color: "var(--text-3)", paddingBottom: 4, lineHeight: 1.3 }}>
              tx<br/>/ min
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: "wallets",      value: chainLoading ? "—" : stats.activeWallets.toLocaleString() },
              { label: "deploys",      value: chainLoading ? "—" : stats.contractDeploys.toString() },
              { label: "avg tx/block", value: chainLoading ? "—" : stats.avgTxPerBlock.toString() },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)" }}>{label}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider — desktop only */}
        {!isMobile && <div style={{ width: 1, height: 80, background: "var(--border)", margin: "0 32px" }} />}

        {/* Infrastructure — desktop only */}
        {!isMobile && (
          <div style={{ paddingLeft: 32 }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
              Infrastructure
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "rpc.mainnet.chain.robinhood.com", status: level !== "down" ? "operational" : "down", latency: latencyMs },
                { name: "Block production",                status: blocksOk ? "operational" : "unknown",     latency: null },
                { name: "Chain ID 4663 · Arb Orbit",      status: "operational",                             latency: null },
              ].map(({ name, status, latency }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: status === "operational" ? "var(--fast)" : status === "down" ? "var(--down)" : "var(--text-3)", flexShrink: 0 }}>
                    {latency !== null ? `${latency}ms` : status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile: block info column */}
        {isMobile && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
              Network
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Chain", value: "Robinhood" },
                { label: "ID",    value: "4663" },
                { label: "Stack", value: "Arb Orbit" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
