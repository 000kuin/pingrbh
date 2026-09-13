import React, { useMemo } from "react";
import type { BlockFull } from "../lib/chain.ts";

interface Props {
  blocks: BlockFull[];
}

// Hours 0–23 UTC labels
const HOUR_LABELS = ["12a","1a","2a","3a","4a","5a","6a","7a","8a","9a","10a","11a",
                     "12p","1p","2p","3p","4p","5p","6p","7p","8p","9p","10p","11p"];

const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function NetworkTab({ blocks }: Props) {
  const { hourBuckets, dayBuckets, peakHour, quietHour, totalSeen } = useMemo(() => {
    // Bucket txCount by UTC hour and by day of week
    // All data comes from on-chain block timestamps — authoritative
    const hourBuckets  = new Array(24).fill(0) as number[];
    const hourCounts   = new Array(24).fill(0) as number[];  // how many blocks in each hour
    const dayBuckets   = new Array(7).fill(0)  as number[];

    for (const b of blocks) {
      if (!b.timestamp) continue;
      const d    = new Date(b.timestamp * 1000);
      const hour = d.getUTCHours();
      const day  = d.getUTCDay();
      hourBuckets[hour] += b.txCount;
      hourCounts[hour]++;
      dayBuckets[day]  += b.txCount;
    }

    // Avg txCount per hour (so a single block at 3am doesn't look high)
    const hourAvg = hourBuckets.map((total, i) =>
      hourCounts[i]! > 0 ? Math.round(total / hourCounts[i]!) : 0
    );

    const maxHour   = Math.max(...hourAvg, 1);
    const peakHour  = hourAvg.indexOf(Math.max(...hourAvg));
    const quietHour = hourAvg.reduce((minIdx, v, i, arr) =>
      v < arr[minIdx]! ? i : minIdx, 0);

    const maxDay = Math.max(...dayBuckets, 1);

    return {
      hourBuckets: hourAvg,
      dayBuckets,
      peakHour,
      quietHour,
      totalSeen: blocks.length,
      maxHour,
      maxDay,
    };
  }, [blocks]);

  const maxHourVal = Math.max(...hourBuckets, 1);
  const maxDayVal  = Math.max(...dayBuckets, 1);

  const currentHour = new Date().getUTCHours();
  const currentDay  = new Date().getUTCDay();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Summary stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 1, background: "var(--border)",
        border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        {[
          { label: "Peak hour (UTC)",  value: totalSeen > 0 ? `${HOUR_LABELS[peakHour]}`  : "—", sub: "most active" },
          { label: "Quiet hour (UTC)", value: totalSeen > 0 ? `${HOUR_LABELS[quietHour]}` : "—", sub: "least active" },
          { label: "Blocks sampled",   value: totalSeen.toString(),                                sub: "current window" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ padding: "18px 22px", background: "var(--surface)" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 800, color: "var(--orange)", letterSpacing: "-0.04em", marginBottom: 2 }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)" }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Hourly heatmap */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "20px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>Hourly activity</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            Average transactions per block by UTC hour · derived from on-chain block timestamps
          </div>
        </div>

        {/* Bar chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, marginBottom: 8 }}>
          {hourBuckets.map((val, hour) => {
            const pct     = val / maxHourVal;
            const height  = Math.max(3, Math.round(pct * 80));
            const isCurrent = hour === currentHour;
            const isPeak    = hour === peakHour;
            const color = isPeak    ? "var(--orange)"
                        : isCurrent ? "var(--fast)"
                        : val === 0 ? "var(--surface-2)"
                        : `rgba(244,129,32,${0.2 + pct * 0.6})`;
            return (
              <div
                key={hour}
                title={`${HOUR_LABELS[hour]} UTC · avg ${val} tx/block${isCurrent ? " · now" : ""}${isPeak ? " · peak" : ""}`}
                style={{
                  flex: 1, height, background: color,
                  borderRadius: "2px 2px 0 0",
                  cursor: "default",
                  position: "relative",
                  border: isCurrent ? "1px solid var(--fast)" : "none",
                }}
              />
            );
          })}
        </div>

        {/* Hour labels — every 3 hours */}
        <div style={{ display: "flex", marginBottom: 12 }}>
          {HOUR_LABELS.map((label, i) => (
            <div key={i} style={{
              flex: 1,
              fontSize: 8, color: i === currentHour ? "var(--fast)" : "var(--text-3)",
              fontFamily: "var(--mono)", textAlign: "center",
              opacity: i % 3 === 0 ? 1 : 0,
              fontWeight: i === currentHour ? 700 : 400,
            }}>
              {i % 3 === 0 ? label : ""}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: "var(--orange)", borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>Peak hour</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: "var(--fast)", borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>Current hour</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: "rgba(244,129,32,0.35)", borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>Active</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, background: "var(--surface-2)", borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>No data yet</span>
          </div>
        </div>
      </div>

      {/* Day of week */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "20px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>Day of week activity</div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            Total transactions by UTC day · from current block window
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 60 }}>
          {dayBuckets.map((val, day) => {
            const pct       = val / maxDayVal;
            const height    = Math.max(3, Math.round(pct * 60));
            const isCurrent = day === currentDay;
            const color     = isCurrent ? "var(--orange)"
                            : val === 0  ? "var(--surface-2)"
                            : `rgba(244,129,32,${0.25 + pct * 0.6})`;
            return (
              <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  title={`${DAY_LABELS[day]} · ${val.toLocaleString()} total txs`}
                  style={{ width: "100%", height, background: color, borderRadius: "2px 2px 0 0", cursor: "default" }}
                />
                <span style={{
                  fontSize: 10, fontWeight: isCurrent ? 700 : 400,
                  color: isCurrent ? "var(--orange)" : "var(--text-3)",
                  fontFamily: "var(--mono)",
                }}>
                  {DAY_LABELS[day]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-2)" }}>Data note — </strong>
        Activity patterns are derived from the current 60-block window in memory (~6 seconds of chain data).
        The hourly chart shows average transactions per block for each UTC hour observed.
        Accuracy improves as the session accumulates more blocks across different hours.
        All timestamps are from on-chain block headers — no client-side estimation.
      </div>
    </div>
  );
}
