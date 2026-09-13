import React from "react";
import type { PingLevel } from "../hooks/usePing.ts";
import { LiveDot } from "./Icons.tsx";

interface Props {
  level: PingLevel;
  latencyMs: number;
  uptime: number;
  totalPings: number;
  color: string;
}

export function NodeHealth({ level, latencyMs, uptime, totalPings, color }: Props) {
  const isUp = level !== "down";

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
        Infrastructure
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 24 }}>
        RPC node health · Robinhood Chain
      </div>

      {/* Node status */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          background: "var(--surface)",
          border: `1px solid ${isUp ? "var(--border)" : "var(--down-border)"}`,
          borderRadius: "var(--r)",
          marginBottom: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LiveDot color={isUp ? color : "var(--down)"} size={7} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 1 }}>
                rpc.mainnet.chain.robinhood.com
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                Primary RPC · Robinhood Chain
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 14, fontWeight: 700, color, marginBottom: 1 }}>
              {isUp ? `${latencyMs} ms` : "timeout"}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              color: isUp ? color : "var(--down)",
            }}>
              {isUp ? "operational" : "down"}
            </div>
          </div>
        </div>
      </div>

      {/* Latency scale */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
          Latency thresholds
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {[
            { range: "< 150ms",     label: "Fast",    col: "var(--fast)",   active: level === "fast" },
            { range: "150–499ms",  label: "Normal",  col: "var(--normal)", active: level === "normal" },
            { range: "500–1499ms", label: "Slow",    col: "var(--slow)",   active: level === "slow" },
            { range: "≥ 1500ms",   label: "Down",    col: "var(--down)",   active: level === "down" },
          ].map(({ range, label, col, active }) => (
            <div key={label} style={{
              padding: "10px 12px",
              background: active ? `${col}10` : "var(--surface)",
              border: `1px solid ${active ? `${col}30` : "var(--border)"}`,
              borderRadius: "var(--r)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 5, marginBottom: 4,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: col, display: "inline-block" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? col : "var(--text-2)" }}>{label}</span>
              </div>
              <div style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{range}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Session stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "Pings this session", value: totalPings.toLocaleString() },
          { label: "Session uptime",     value: `${uptime}%` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            padding: "14px 16px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r)",
          }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
