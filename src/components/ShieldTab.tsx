import React from "react";
import type { PingLevel, LatencyPoint } from "../hooks/usePing.ts";
import { LatencyChart } from "./LatencyChart.tsx";
import { UptimeBar } from "./UptimeBar.tsx";
import { NodeHealth } from "./NodeHealth.tsx";
import { BlockStream } from "./BlockStream.tsx";
import type { BlockInfo } from "../hooks/usePing.ts";

interface Props {
  level: PingLevel;
  latencyMs: number;
  avg5m: number;
  uptime: number;
  totalPings: number;
  history: LatencyPoint[];
  blocks: BlockInfo[];
  color: string;
  isMobile?: boolean;
}

export function ShieldTab({ level, latencyMs, avg5m, uptime, totalPings, history, blocks, color, isMobile }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: 16 }}>
        <Card>
          <LatencyChart history={history} avg5m={avg5m} level={level} color={color} />
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card><UptimeBar history={history} color={color} /></Card>
          <Card>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 14 }}>Session</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Total pings",   value: totalPings.toLocaleString() },
                { label: "Interval",      value: "3 seconds" },
                { label: "Protocol",      value: "JSON-RPC 2.0" },
                { label: "Method",        value: "eth_blockNumber" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--text-2)" }}>{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <Card>
          <NodeHealth level={level} latencyMs={latencyMs} uptime={uptime} totalPings={totalPings} color={color} />
        </Card>
        <Card>
          <BlockStream blocks={blocks} color={color} />
        </Card>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "20px" }}>
      {children}
    </div>
  );
}
