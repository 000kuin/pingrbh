import React from "react";
import type { SuspiciousWallet } from "../hooks/useChain.ts";

interface Props {
  suspicious:   SuspiciousWallet[];
  totalWallets: number;
  isMobile?: boolean;
}

// Updated flags matching strengthened detection in chain.ts
const FLAG_META: Record<string, { label: string; color: string; desc: string }> = {
  "launch-sniper":  { label: "Launch Sniper",  color: "var(--down)",   desc: "Bought a token in the same block it was deployed — first-block snipe confirmed" },
  "sandwich":       { label: "Sandwich",        color: "var(--down)",   desc: "Front-run + back-run pattern detected around a victim tx in the same block (MEV)" },
  "bot-loop":       { label: "Bot Loop",        color: "var(--slow)",   desc: "Repeating same contract + same function selector with uniform gas prices — automated loop" },
  "first-block":    { label: "First Block",     color: "var(--slow)",   desc: "2+ txs in the newest block on wallet's first appearance — possible opportunity sniper" },
  "uniform-gas":    { label: "Uniform Gas",     color: "var(--normal)", desc: "All txs use gas prices within 1% of each other — programmatic gas setting, not human" },
  "high-frequency": { label: "High Freq",       color: "var(--normal)", desc: "5+ txs in the current window — statistically unusual for a human trader" },
  "multi-block":    { label: "Multi-block",     color: "var(--text-3)", desc: "Active across 4+ distinct blocks — sustained automated activity" },
  "deployer":       { label: "Deployer",        color: "var(--orange)", desc: "Sent a contract creation tx in this window" },
};

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function ThreatBar({ score }: { score: number }) {
  const color = score >= 70 ? "var(--down)" : score >= 40 ? "var(--slow)" : "var(--normal)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 48, height: 3, background: "var(--bg-3)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: 99 }} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color, minWidth: 24 }}>{score}</span>
    </div>
  );
}

export function FirewallTab({ suspicious, totalWallets, isMobile }: Props) {
  const launchSnipers = suspicious.filter(w => w.flags.includes("launch-sniper")).length;
  const sandwiches    = suspicious.filter(w => w.flags.includes("sandwich")).length;
  const botLoops      = suspicious.filter(w => w.flags.includes("bot-loop")).length;
  // deployers = wallets with deployer flag (includes clean deployers with 3+ txs AND suspicious deployers)
  // Note: clean single-deploy wallets require other flags to surface — this counts those that did
  const deployers     = suspicious.filter(w => w.flags.includes("deployer")).length;
  const threatPct     = totalWallets > 0 ? Math.round((suspicious.length / totalWallets) * 100) : 0;

  // Overall threat level based on highest threat-score wallet
  const maxScore    = suspicious[0]?.threatScore ?? 0;
  const threatLevel = maxScore >= 70 ? "high" : maxScore >= 40 ? "moderate" : suspicious.length > 0 ? "low" : "none";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 1, background: "var(--border)",
        border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        {[
          { label: "Launch snipers",  value: launchSnipers.toString(), accent: launchSnipers > 0 },
          { label: "Sandwiches",      value: sandwiches.toString(),    accent: sandwiches > 0 },
          { label: "Bot loops",       value: botLoops.toString(),      accent: botLoops > 0 },
          { label: "New deployers",   value: deployers.toString(),     accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ padding: "18px 22px", background: "var(--surface)" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 800, color: accent ? "var(--down)" : "var(--text)", letterSpacing: "-0.04em" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Threat banner */}
      <div style={{
        padding: "14px 20px",
        background: threatLevel === "none" ? "var(--fast-dim)"
                  : threatLevel === "high" ? "var(--down-dim)"
                  : threatLevel === "moderate" ? "var(--slow-dim)"
                  : "var(--normal-dim)",
        border: `1px solid ${
          threatLevel === "none"     ? "var(--fast-border)"
          : threatLevel === "high"   ? "var(--down-border)"
          : threatLevel === "moderate" ? "var(--slow-border)"
          : "var(--normal-border)"}`,
        borderRadius: "var(--r)",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: threatLevel === "none" ? "var(--fast)"
                    : threatLevel === "high" ? "var(--down)"
                    : threatLevel === "moderate" ? "var(--slow)"
                    : "var(--normal)",
        }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>
            {threatLevel === "none"     && "No flagged wallets in current window"}
            {threatLevel === "low"      && "Low — minor bot activity detected"}
            {threatLevel === "moderate" && "Moderate — bot loops or first-block activity detected"}
            {threatLevel === "high"     && "Elevated — launch snipers or MEV sandwiches active"}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            {totalWallets > 0
              ? `${suspicious.length} of ${totalWallets} active wallets flagged (${threatPct}%) · highest threat score: ${maxScore}/100`
              : "Building wallet map from block data…"}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Flagged wallets</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
              Sorted by threat score · all patterns derived from live on-chain tx data only
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
            color: "var(--orange)", background: "var(--orange-dim)",
            border: "1px solid var(--orange-border)",
            borderRadius: "var(--r-sm)", padding: "3px 8px",
          }}>
            Live
          </span>
        </div>

        {suspicious.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
            No flagged wallets in current window
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "140px 60px 1fr 50px 60px",
              padding: "8px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)",
            }}>
              {["Address", "Score", "Flags", "Txs", "Blocks"].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)" }}>{h}</div>
              ))}
            </div>

            {suspicious.map((w, i) => (
              <div
                key={w.address}
                style={{
                  display: "grid", gridTemplateColumns: "140px 60px 1fr 50px 60px",
                  padding: "11px 20px",
                  borderBottom: i < suspicious.length - 1 ? "1px solid var(--border)" : "none",
                  alignItems: "center",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
              >
                <a
                  href={`https://robinhoodchain.blockscout.com/address/${w.address}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--orange)" }}
                >
                  {shortAddr(w.address)}
                </a>

                <ThreatBar score={w.threatScore} />

                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {w.flags.map(f => {
                    const meta = FLAG_META[f] ?? { label: f, color: "var(--text-3)", desc: f };
                    return (
                      <span key={f} title={meta.desc} style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                        color: meta.color, background: `${meta.color}18`,
                        border: `1px solid ${meta.color}30`,
                        borderRadius: "var(--r-sm)", padding: "2px 7px", cursor: "default",
                      }}>
                        {meta.label}
                      </span>
                    );
                  })}
                </div>

                <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>
                  {w.txCount}
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>
                  {w.blocksActive}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flag legend */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 8 }}>
        {Object.entries(FLAG_META).map(([flagKey, { label, color, desc }]) => (
          <div key={flagKey} style={{
            padding: "12px 14px",
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Accuracy note */}
      <div style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-2)" }}>Detection methodology — </strong>
        All flags derived from live eth_getBlockByNumber data (full tx bodies). Launch snipers confirmed by
        cross-referencing deployers and buyers within the same block. Sandwich patterns verified by checking
        tx ordering within blocks. Bot loops detected via selector + gas price uniformity analysis.
        Threat scores are composite (0–100): launch-sniper +40, sandwich +30, bot-loop +35, first-block +20,
        uniform-gas +15, high-frequency +20, multi-block +10, deployer +5.
      </div>
    </div>
  );
}
