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

  // ── Mobile: compact single-column hero ────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        {/* Status banner */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "7px 16px",
          background: cfg.bg,
          borderBottom: `1px solid ${cfg.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LiveDot color={cfg.color} size={5} />
            <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: "0.05em" }}>
              {cfg.verdict}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {[
              { name: "RPC",    ok: level !== "down" },
              { name: "Blocks", ok: blocksOk && !chainError },
            ].map(({ name, ok }) => (
              <span key={name} style={{ fontSize: 9, color: ok ? cfg.color : "var(--down)", fontFamily: "var(--mono)", fontWeight: 600 }}>
                {ok ? "●" : "○"} {name}
              </span>
            ))}
          </div>
        </div>

        {/* Main metric row — latency big, key stats beside */}
        <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 20 }}>
          {/* Big latency */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
              RPC Latency
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 5, paddingRight: 4 }}>
              <RollingNumber
                value={latencyMs}
                decimals={0}
                color="var(--text)"
                style={{
                  fontSize: "clamp(44px, 13vw, 64px)",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  lineHeight: 0.9,
                  fontFamily: "var(--mono)",
                }}
              />
              <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 400, color: "var(--text-3)", paddingBottom: 4 }}>ms</span>
            </div>
          </div>

          {/* Vertical divider */}
          <div style={{ width: 1, height: 52, background: "var(--border)", flexShrink: 0 }} />

          {/* Key stats */}
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
            {[
              { label: "Avg",      value: `${avg5m}ms` },
              { label: "Uptime",   value: `${uptime}%` },
              { label: "Tx/min",   value: chainLoading ? "—" : stats.txPerMin.toLocaleString() },
              { label: "Wallets",  value: chainLoading ? "—" : stats.activeWallets.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 2 }}>{label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop: full three-column hero ───────────────────────────────────────
  return (
    <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>

      {/* Status banner */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 32px",
        background: cfg.bg,
        borderBottom: `1px solid ${cfg.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LiveDot color={cfg.color} size={6} />
          <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color, letterSpacing: "0.02em" }}>
            {cfg.verdict}
          </span>
          <span style={{ fontSize: 11, color: cfg.color, opacity: 0.7 }}>—</span>
          <span style={{ fontSize: 11, color: cfg.color, opacity: 0.7 }}>{cfg.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {[
            { name: "RPC",    ok: level !== "down" },
            { name: "Blocks", ok: blocksOk && !chainError },
            { name: "Txs",    ok: level !== "down" && !chainError },
          ].map(({ name, ok }) => (
            <span key={name} style={{ fontSize: 10, color: ok ? cfg.color : "var(--down)", fontFamily: "var(--mono)", fontWeight: 600 }}>
              {ok ? "●" : "○"} {name}
            </span>
          ))}
          {lastUpdated && (
            <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Main metrics — three columns */}
      <div style={{
        padding: "28px 32px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        alignItems: "start",
        gap: "0 48px",
      }}>
        {/* Left: latency */}
        <div style={{ paddingRight: 32 }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            RPC Response Time
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16, paddingRight: 24 }}>
            <RollingNumber
              value={latencyMs}
              decimals={0}
              color="var(--text)"
              style={{
                fontSize: "clamp(56px, 7vw, 88px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 0.9,
                fontFamily: "var(--mono)",
              }}
            />
            <span style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 400, color: "var(--text-3)", paddingBottom: 6 }}>ms</span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
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

        {/* Center: chain activity */}
        <div style={{ padding: "0 32px", overflow: "visible" }}>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 8 }}>
            Chain Activity
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16, paddingLeft: 2 }}>
            <span style={{
              fontFamily: "var(--mono)", fontSize: "clamp(56px, 7vw, 88px)",
              fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 0.9,
              color: chainLoading ? "var(--text-3)" : "var(--orange)",
            }}>
              {chainLoading ? "—" : stats.txPerMin.toLocaleString()}
            </span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 400, color: "var(--text-3)", paddingBottom: 6, lineHeight: 1.3 }}>
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

        {/* Right: placeholder to maintain grid layout */}
        <div />
      </div>
    </div>
  );
}
