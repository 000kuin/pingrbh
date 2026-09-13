import React from "react";
import type { LatencyPoint } from "../hooks/usePing.ts";

interface Props {
  history: LatencyPoint[];
  color: string;
}

export function UptimeBar({ history, color }: Props) {
  const recent = history.slice(-60);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Ping History</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}>
          {recent.length} pings · 3s
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 36 }}>
        {recent.length === 0 && Array.from({ length: 60 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, background: "var(--surface-2)", borderRadius: 2 }} />
        ))}
        {recent.map((p, i) => {
        // Match classifyLatency thresholds exactly
        const barColor = p.ms >= 1500 ? "var(--down)"
                       : p.ms >= 500  ? "var(--slow)"
                       : p.ms >= 150  ? "var(--normal)"
                       : "var(--fast)";
          const heightPct = Math.min(p.ms / 400, 1);
          const barHeight = Math.max(3, Math.round(heightPct * 36));
          return (
            <div
              key={i}
              title={`${p.ms}ms · ${new Date(p.t).toLocaleTimeString()}`}
              style={{
                flex: 1, height: barHeight,
                background: barColor,
                borderRadius: 1,
                opacity: 0.5 + (i / recent.length) * 0.5,
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--mono)", fontSize: 9, color: "var(--text-3)" }}>
        <span>{recent.length === 0 ? "—" : (() => { const s = recent.length * 3; return s >= 60 ? `${Math.floor(s / 60)}m ago` : `${s}s ago`; })()}</span>
        <span>now</span>
      </div>
    </div>
  );
}
