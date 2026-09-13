import React from "react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import type { TrafficPoint, ChainStats } from "../hooks/useChain.ts";
import type { BlockFull } from "../lib/chain.ts";

interface Props {
  traffic: TrafficPoint[];
  stats: ChainStats;
  blocks: BlockFull[];
  isMobile?: boolean;
}

export function RadarTab({ traffic, stats, blocks, isMobile }: Props) {
  // x-axis: show block number — more meaningful than timestamps on a 100ms chain
  const fmtBlock = (n: number) => `#${n.toLocaleString()}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Stat strip */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 1, background: "var(--border)",
        border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        {[
          { label: "Tx / min",         value: stats.txPerMin > 0 ? stats.txPerMin.toLocaleString() : "—", accent: true },
          { label: "Active wallets",   value: stats.activeWallets.toLocaleString() },
          { label: "Contract deploys", value: stats.contractDeploys.toString() },
          { label: "Avg tx / block",   value: stats.avgTxPerBlock > 0 ? stats.avgTxPerBlock.toString() : "—" },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ padding: "18px 22px", background: "var(--surface)" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 800, color: accent ? "var(--orange)" : "var(--text)", letterSpacing: "-0.04em" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Data note */}
      {stats.txPerMin === 0 && (
        <div style={{ padding: "10px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)" }}>
          Building traffic data from block window… tx/min available once enough block history is loaded.
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <Card title="Transactions per block" sub={`Last ${traffic.length} blocks · live`}>
          {traffic.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={traffic} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--orange)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="blockNumber"
                  tickFormatter={fmtBlock}
                  tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-3)" }}
                  tickLine={false} axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: 6, fontFamily: "var(--mono)", fontSize: 11 }}
                  labelFormatter={fmtBlock}
                  formatter={(v: number) => [v, "Txs"]}
                />
                <Area type="monotone" dataKey="txCount" stroke="var(--orange)" strokeWidth={1.5} fill="url(#txGrad)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </Card>

        <Card title="Unique wallets per block" sub="Distinct from addresses">
          {traffic.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={traffic} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="blockNumber"
                  tickFormatter={fmtBlock}
                  tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-3)" }}
                  tickLine={false} axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontFamily: "var(--mono)", fontSize: 9, fill: "var(--text-3)" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border-2)", borderRadius: 6, fontFamily: "var(--mono)", fontSize: 11 }}
                  labelFormatter={fmtBlock}
                  formatter={(v: number) => [v, "Wallets"]}
                />
                <Bar dataKey="uniqueWallets" fill="var(--orange)" opacity={0.65} radius={[2, 2, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </Card>
      </div>

      {/* Block tx heatmap — gas fill is meaningless on Arb Orbit (gasLimit = 2^50) */}
      <Card title="Transactions per block (heatmap)" sub={`${blocks.length} blocks · bar height = tx count`}>
        {blocks.length > 0 ? (
          <>
            {(() => {
              const maxTx = Math.max(...blocks.map(b => b.txCount), 1);
              return (
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 52, flexWrap: "wrap" }}>
                  {blocks.slice().reverse().map((b) => {
                    const pct = b.txCount / maxTx;
                    const barColor = pct > 0.66 ? "var(--slow)" : pct > 0.33 ? "var(--normal)" : "var(--fast)";
                    return (
                      <div
                        key={b.number}
                        title={`Block #${b.number.toLocaleString()} · ${b.txCount} tx`}
                        style={{
                          width: 12,
                          height: Math.max(3, Math.round(pct * 52)),
                          background: barColor,
                          borderRadius: 2,
                          opacity: 0.8,
                          cursor: "default",
                        }}
                      />
                    );
                  })}
                </div>
              );
            })()}
            <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
              {[{ c: "var(--fast)", l: "Low volume" }, { c: "var(--normal)", l: "Medium" }, { c: "var(--slow)", l: "High volume" }].map(({ c, l }) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: c, display: "inline-block" }} />
                  <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)" }}>{l}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyChart />
        )}
      </Card>

      {/* Data source */}
      <div style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-2)" }}>Data source — </strong>
        All metrics derived from eth_getBlockByNumber (full tx bodies) against the public Robinhood Chain RPC.
        Tx/min computed from actual on-chain block timestamps across the {60}-block window.
        Active wallets = unique from-addresses in window. No estimated or cached data.
      </div>
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "20px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)", fontSize: 11, fontFamily: "var(--mono)" }}>
      Loading block data…
    </div>
  );
}
