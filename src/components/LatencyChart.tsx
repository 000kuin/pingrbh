import React from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import type { LatencyPoint } from "../hooks/usePing.ts";

interface Props {
  history: LatencyPoint[];
  avg5m: number;
  level: string;
  color: string;
}

function formatTime(t: number) {
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function LatencyChart({ history, avg5m, color }: Props) {
  const data = history.map(p => ({ t: p.t, ms: p.ms, label: formatTime(p.t) }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
            Response Time
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            Last {history.length} pings · 3s interval
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.04em" }}>
            {avg5m}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-3)", marginLeft: 4 }}>ms avg</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-3)" }}
            tickLine={false} axisLine={false}
            interval={Math.max(1, Math.floor(history.length / 4))}
          />
          <YAxis
            tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-3)" }}
            tickLine={false} axisLine={false}
            tickFormatter={v => `${v}`}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border-2)",
              borderRadius: 6,
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--text)",
            }}
            formatter={(v: number) => [`${v} ms`, "Latency"]}
            labelStyle={{ color: "var(--text-3)", marginBottom: 4 }}
          />
          {avg5m > 0 && (
            <ReferenceLine
              y={avg5m}
              stroke={color}
              strokeOpacity={0.25}
              strokeDasharray="3 3"
            />
          )}
          <Area
            type="monotone"
            dataKey="ms"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#latGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
