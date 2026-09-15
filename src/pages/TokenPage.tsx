import React, { useState } from "react";
import {
  IconZap, IconGlobe, IconServer, IconShield,
  IconExternalLink, IconCopy, IconCheck, IconWifi, IconArrowRight,
} from "../components/Icons.tsx";

const PONS_URL  = "https://www.ponsfamily.com/launchpad";
const PING_CA: string | null = "0xce48e0cace55fe2229e6607d685fdf33b89cbb9b";
const NET_COLOR = "#60a5fa";

export function TokenPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── Hero ── */}
      <section style={{
        borderBottom: "1px solid var(--border)",
        padding: "80px 40px 72px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          {/* Eyebrow */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--orange-dim)",
            border: "1px solid var(--orange-border)",
            borderRadius: "var(--r-sm)",
            padding: "5px 12px",
            marginBottom: 32,
            fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
            color: "var(--orange)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--orange)", display: "inline-block" }} />
            Launching on Pons · Robinhood Chain
          </div>

          {/* Headline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 64, alignItems: "start" }}>
            <div>
              <h1 style={{
                fontSize: "clamp(48px, 8vw, 88px)",
                fontWeight: 900, lineHeight: 0.95,
                letterSpacing: "-0.05em",
                color: "var(--text)",
                marginBottom: 24,
              }}>
                $PING
              </h1>
              <p style={{
                fontSize: 18, fontWeight: 400,
                color: "var(--text-2)", lineHeight: 1.6,
                maxWidth: 500, marginBottom: 40,
              }}>
                Cloudflare Radar for Robinhood Chain. Live RPC latency,
                threat intelligence, contract deploys, and chain traffic — all in one place.
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <a
                  href={PONS_URL}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "12px 24px",
                    background: "var(--orange)",
                    color: "#fff", fontWeight: 700, fontSize: 14,
                    borderRadius: "var(--r)",
                    transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}
                >
                  Buy on Pons <IconArrowRight size={14} color="#fff" />
                </a>
                <a href="/" style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "12px 20px",
                  background: "transparent", color: "var(--text-2)",
                  fontWeight: 500, fontSize: 13,
                  border: "1px solid var(--border-2)",
                  borderRadius: "var(--r)",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-3)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-2)"}
                >
                  View monitor
                </a>
              </div>
            </div>

            {/* Pair card */}
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-xl)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 12 }}>
                  Trading pair
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 900, color: "var(--orange)", letterSpacing: "-0.04em" }}>$PING</span>
                  <span style={{ color: "var(--text-3)", fontSize: 18, fontWeight: 300 }}>/</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 28, fontWeight: 900, color: NET_COLOR, letterSpacing: "-0.04em" }}>NET</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>Pons · Robinhood Chain</div>
              </div>

              {/* Thesis */}
              <div style={{ padding: "20px 24px" }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 10 }}>
                  The thesis
                </div>
        <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--text-2)" }}>
                $PING is Cloudflare Radar for Robinhood Chain — and{" "}
                <span style={{ color: NET_COLOR, fontWeight: 600 }}>NET is to the internet</span>
                {" "}what $PING is to the chain. Infrastructure pays infrastructure.
              </p>
              </div>

              {/* CA */}
              <div style={{ padding: "14px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 4 }}>
                  Contract
                </div>
                {PING_CA ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <a
                      href={`https://robinhoodchain.blockscout.com/token/${PING_CA}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--orange)", display: "flex", alignItems: "center", gap: 5 }}
                    >
                      {PING_CA.slice(0, 12)}…{PING_CA.slice(-8)}
                      <IconExternalLink size={10} color="var(--orange)" />
                    </a>
                    <CopyButton />
                  </div>
                ) : (
                  <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)" }}>
                    Announced at launch
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why it exists ── */}
      <section style={{ padding: "72px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 16 }}>
          Why it exists
        </div>
        <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: 16, color: "var(--text)" }}>
          Cloudflare Radar.<br />
          But for Robinhood Chain.
        </h2>
        <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 560, lineHeight: 1.7, marginBottom: 56 }}>
          Cloudflare Radar gives you real-time intelligence on the internet. pingrbh.com does the same
          for Robinhood Chain — live traffic, threat detection, contract deploys, and RPC health.
          The infrastructure monitoring tool for Robinhood Chain, paired with NET.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          {[
            {
              Icon: IconGlobe,
              title: "Radar",
              body: "Live tx/min, active wallets, block utilization, and chain traffic charts. The pulse of Robinhood Chain in real time.",
            },
            {
              Icon: IconShield,
              title: "Firewall",
              body: "Suspicious wallet detection, bot pattern flagging, sniper identification. Know who's on chain and what they're doing.",
            },
            {
              Icon: IconServer,
              title: "Edge",
              body: "Every new contract deployed on Robinhood Chain, live. Spot token launches the second bytecode hits the chain.",
            },
            {
              Icon: IconWifi,
              title: "Shield",
              body: "RPC latency monitor, uptime tracking, node health. The original pingrbh feature — now one tab of a bigger tool.",
            },
            {
              Icon: IconZap,
              title: "NET pair",
              body: "$PING trades against NET — the Cloudflare stock token on Robinhood Chain. Infrastructure monitors infrastructure.",
            },
            {
              Icon: IconShield,
              title: "Fair launch",
              body: "No presale. No VC allocation. Launched on Pons with a bonding curve. Everyone gets the same entry.",
            },
          ].map(({ Icon, title, body }, i) => (
            <div key={title} style={{
              padding: "28px 24px",
              background: "var(--surface)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "var(--r-sm)",
                background: "var(--orange-dim)", border: "1px solid var(--orange-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 16,
              }}>
                <Icon size={15} color="var(--orange)" />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "var(--text)", letterSpacing: "-0.02em" }}>{title}</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.65 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ height: 1, background: "var(--border)" }} />

      {/* ── Compare ── */}
      <section style={{ padding: "72px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 16 }}>
          The pair
        </div>
        <h2 style={{ fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 48, color: "var(--text)" }}>
          $PING / NET on Pons
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 48px 1fr", gap: 0, alignItems: "start" }}>
          <CompareCard
            ticker="$PING"
            name="On-chain heartbeat · pingrbh.com"
            color="var(--orange)"
            facts={[
              { k: "What it tracks",  v: "RPC latency & uptime for Robinhood Chain" },
              { k: "Utility",         v: "pingrbh.com — live latency, uptime, block feed" },
              { k: "Chain",           v: "Robinhood Chain (ID 4663)" },
              { k: "Trading hours",   v: "24/7 — chain never stops" },
              { k: "Launch",          v: "Fair launch on Pons" },
              { k: "Pair",            v: "$PING / NET on Pons" },
            ]}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 22, fontWeight: 300, color: "var(--text-3)" }}>/</span>
          </div>
          <CompareCard
            ticker="NET"
            name="Cloudflare · Internet infrastructure"
            color={NET_COLOR}
            facts={[
              { k: "What it tracks",  v: "Cloudflare's business — 20% of the internet" },
              { k: "Utility",         v: "DDoS protection, CDN, DNS for the global web" },
              { k: "Chain",           v: "Robinhood Chain (ID 4663)" },
              { k: "Trading hours",   v: "24/7 on-chain (market hours on NYSE)" },
              { k: "Origin",          v: "Robinhood stock token" },
              { k: "Connection",      v: "Paired with $PING on Pons" },
            ]}
          />
        </div>
      </section>

      <div style={{ height: 1, background: "var(--border)" }} />

      {/* ── Tokenomics ── */}
      <section style={{ padding: "72px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 16 }}>
          Tokenomics
        </div>
        <h2 style={{ fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 8, color: "var(--text)" }}>
          Simple. Fair. On-chain.
        </h2>
        <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 40, lineHeight: 1.6 }}>
          No presale. No team allocation. No vesting cliffs.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden", marginBottom: 16 }}>
          {[
            { label: "Ticker",  value: "$PING" },
            { label: "Chain",   value: "Robinhood Chain" },
            { label: "Launch",  value: "Pons fair launch" },
            { label: "Pair",    value: "$PING / NET" },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: "20px 24px", background: "var(--surface)" }}>
              <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 18, fontWeight: 800, color: "var(--text)" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Contract row */}
        <div style={{
          padding: "16px 20px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          marginBottom: 16,
        }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
              Contract · Robinhood Chain
            </div>
            {PING_CA ? (
              <a
                href={`https://robinhoodchain.blockscout.com/token/${PING_CA}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 600, color: "var(--orange)", display: "flex", alignItems: "center", gap: 6 }}
              >
                {PING_CA}
                <IconExternalLink size={12} color="var(--orange)" />
              </a>
            ) : (
              <div style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--text-3)" }}>
                Announced at launch
              </div>
            )}
          </div>
          {PING_CA && <CopyButton />}
        </div>

        {/* Fair launch box */}
        <div style={{
          padding: "20px 24px",
          background: "var(--orange-dim)",
          border: "1px solid var(--orange-border)",
          borderRadius: "var(--r)",
        }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--orange)", marginBottom: 6 }}>Fair launch guarantee</div>
          <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
            $PING launches on Pons with a bonding curve. No tokens are pre-minted to founders, VCs, or insiders.
            The first buyer and the hundredth buyer use the same transparent curve. The only edge is being early.
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: "var(--border)" }} />

      {/* ── How it works ── */}
      <section style={{ padding: "72px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 16 }}>
          How it works
        </div>
        <h2 style={{ fontSize: "clamp(24px,3.5vw,40px)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 48, color: "var(--text)" }}>
          How $PING works.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, background: "var(--border)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          {[
            { n: "01", title: "Buy $PING",   body: "Fair launch on Pons. Bonding curve. No presale, no insiders.", accent: "var(--orange)" },
            { n: "02", title: "Trade",        body: "$PING / NET on Pons — the on-chain pair for Robinhood Chain infrastructure.", accent: NET_COLOR },
            { n: "03", title: "Monitor",      body: "pingrbh.com gives $PING holders real-time visibility into the chain they're invested in.", accent: "var(--orange)" },
          ].map(({ n, title, body, accent }) => (
            <div key={n} style={{ padding: "32px 28px", background: "var(--surface)" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", marginBottom: 16, letterSpacing: "0.06em" }}>{n}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: accent, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</div>
              <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65 }}>{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA footer ── */}
      <section style={{ padding: "72px 40px 88px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 20 }}>
            Ready?
          </div>
          <h2 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, marginBottom: 16, color: "var(--text)" }}>
            Buy $PING on Pons.
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 36 }}>
            Trade $PING/NET on Pons — the launchpad on Robinhood Chain.
            Infrastructure and infrastructure. The pair that monitors itself.
          </p>
          <a
            href={PONS_URL}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 32px",
              background: "var(--orange)", color: "#fff",
              fontWeight: 700, fontSize: 15,
              borderRadius: "var(--r)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}
          >
            Open Pons <IconExternalLink size={14} color="#fff" />
          </a>
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ── */

function CopyButton() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    if (!PING_CA) return;
    navigator.clipboard.writeText(PING_CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "6px 12px",
        background: "transparent",
        border: `1px solid ${copied ? "var(--orange-border)" : "var(--border-2)"}`,
        borderRadius: "var(--r-sm)",
        color: copied ? "var(--orange)" : "var(--text-3)",
        fontSize: 11, fontFamily: "var(--mono)", cursor: "pointer",
        transition: "all 0.15s", flexShrink: 0,
      }}
    >
      {copied ? <IconCheck size={11} color="var(--orange)" /> : <IconCopy size={11} color="currentColor" />}
      {copied ? "Copied" : "Copy CA"}
    </button>
  );
}

function CompareCard({ ticker, name, color, facts }: { ticker: string; name: string; color: string; facts: { k: string; v: string }[] }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid var(--border)`,
      borderRadius: "var(--r-lg)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--mono)", fontSize: 26, fontWeight: 900, color, letterSpacing: "-0.04em", marginBottom: 4 }}>{ticker}</div>
        <div style={{ fontSize: 11, color: "var(--text-3)" }}>{name}</div>
      </div>
      {facts.map(({ k, v }) => (
        <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 24px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>{k}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-2)", textAlign: "right", maxWidth: "55%" }}>{v}</span>
        </div>
      ))}
    </div>
  );
}
