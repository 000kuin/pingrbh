import React from "react";
import type { BlockInfo } from "../hooks/usePing.ts";

interface Props {
  blocks: BlockInfo[];
  color: string;
}

export function BlockStream({ blocks, color }: Props) {
  const recent = blocks.slice(0, 20);

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
        Block Feed
      </div>
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 20 }}>
        Live block production · Robinhood Chain
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {recent.length === 0 && (
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>Loading blocks…</div>
        )}
        {recent.map((b, i) => {
          const fillPct = b.gasLimit > 0 ? Math.round((b.gasUsed / b.gasLimit) * 100) : 0;
          const isLatest = i === 0;
          return (
            <div key={b.number} style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr 60px 60px",
              alignItems: "center",
              gap: 16,
              padding: "10px 14px",
              background: isLatest ? "rgba(244,129,32,0.06)" : "var(--surface)",
              border: `1px solid ${isLatest ? "rgba(244,129,32,0.2)" : "var(--border)"}`,
              borderRadius: "var(--r)",
              animation: isLatest ? "fade-up 0.3s ease" : undefined,
            }}>
              <div style={{
                fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700,
                color: isLatest ? "var(--orange)" : "var(--text-2)",
              }}>
                #{b.number.toLocaleString()}
              </div>
              {/* Fill bar */}
              <div style={{ position: "relative", height: 2, background: "var(--surface-2)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${fillPct}%`,
                  background: fillPct > 80 ? "var(--slow)" : fillPct > 50 ? "var(--normal)" : color,
                  borderRadius: 99,
                }} />
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)", textAlign: "right" }}>
                {fillPct}%
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)", textAlign: "right" }}>
                {b.txCount} tx
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
