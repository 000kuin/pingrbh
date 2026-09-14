import React, { useState, lazy, Suspense } from "react";
import { usePing } from "./hooks/usePing.ts";
import { useChain } from "./hooks/useChain.ts";
import { useIsMobile } from "./hooks/useIsMobile.ts";
import { useFailover } from "./hooks/useFailover.ts";
import { HeroPing } from "./components/HeroPing.tsx";
import { LiveDot } from "./components/Icons.tsx";

// Lazy-load every tab so recharts (390 KB gzip) only downloads when first viewed
const RadarTab     = lazy(() => import("./components/RadarTab.tsx").then(m => ({ default: m.RadarTab })));
const FirewallTab  = lazy(() => import("./components/FirewallTab.tsx").then(m => ({ default: m.FirewallTab })));
const EdgeTab      = lazy(() => import("./components/EdgeTab.tsx").then(m => ({ default: m.EdgeTab })));
const ShieldTab    = lazy(() => import("./components/ShieldTab.tsx").then(m => ({ default: m.ShieldTab })));
const DnsTab       = lazy(() => import("./components/DnsTab.tsx").then(m => ({ default: m.DnsTab })));
const WorkersTab   = lazy(() => import("./components/WorkersTab.tsx").then(m => ({ default: m.WorkersTab })));
const NetworkTab   = lazy(() => import("./components/NetworkTab.tsx").then(m => ({ default: m.NetworkTab })));
const AnalyticsTab = lazy(() => import("./components/AnalyticsTab.tsx").then(m => ({ default: m.AnalyticsTab })));
const LogsTab      = lazy(() => import("./components/LogsTab.tsx").then(m => ({ default: m.LogsTab })));

const LEVEL_COLOR: Record<string, string> = {
  fast:   "var(--fast)",
  normal: "var(--normal)",
  slow:   "var(--slow)",
  down:   "var(--down)",
};

type Tab = "radar" | "firewall" | "edge" | "dns" | "workers" | "network" | "analytics" | "logs" | "shield";

const TABS: { id: Tab; label: string; sub: string; short: string }[] = [
  { id: "radar",     label: "Radar",     sub: "Traffic",  short: "Radar"    },
  { id: "firewall",  label: "Firewall",  sub: "Threats",  short: "Firewall" },
  { id: "edge",      label: "Edge",      sub: "Deploys",  short: "Edge"     },
  { id: "workers",   label: "Workers",   sub: "Calls",    short: "Workers"  },
  { id: "analytics", label: "Analytics", sub: "Value",    short: "Analytics"},
  { id: "logs",      label: "Logs",      sub: "Stream",   short: "Logs"     },
  { id: "network",   label: "Network",   sub: "Map",      short: "Network"  },
  { id: "dns",       label: "DNS",       sub: "RPC",      short: "DNS"      },
  { id: "shield",    label: "Shield",    sub: "Uptime",   short: "Shield"   },
];

function TabFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10, color: "var(--text-3)", fontFamily: "var(--mono)", fontSize: 11 }}>
      <LiveDot color="var(--orange)" size={7} />
      Loading…
    </div>
  );
}

export function App() {
  const ping     = usePing();
  const chain    = useChain();
  const isMobile = useIsMobile();
  useFailover(); // eagerly tests endpoints and promotes fastest — no DNS tab needed
  const color    = LEVEL_COLOR[ping.level] ?? "var(--fast)";
  const [tab, setTab] = useState<Tab>("radar");

  return (
    <div style={{ minHeight: "calc(100vh - var(--nav-h) - 2px)", background: "var(--bg)" }}>

      {/* Loading */}
      {ping.loading && !ping.current && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 14 }}>
          <LiveDot color="var(--orange)" size={10} />
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em" }}>
            pinging robinhood chain…
          </div>
        </div>
      )}

      {ping.current && (
        <>
          {/* Hero */}
          <HeroPing
            latencyMs={ping.latencyMs}
            level={ping.level}
            avg5m={ping.avg5m}
            uptime={ping.uptime}
            blockNumber={ping.current.blockNumber}
            baseFeeGwei={ping.blocks[0]?.baseFeeGwei ?? 0}
            lastUpdated={ping.lastUpdated}
            stats={chain.stats}
            blocksOk={ping.blocksOk}
            chainError={chain.error}
            chainLoading={chain.loading}
            isMobile={isMobile}
          />

          {/* Body: sidebar + content */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "var(--sidebar-w) 1fr",
            minHeight: isMobile ? "auto" : "calc(100vh - var(--nav-h) - 2px - 200px)",
            paddingBottom: isMobile ? 72 : 0,
          }}>

            {/* Sidebar — desktop sticky rail; mobile: hidden (tab bar below) */}
            {!isMobile && (
              <aside style={{
                borderRight: "1px solid var(--border)",
                padding: "24px 0",
                background: "var(--bg-2)",
                position: "sticky",
                top: "calc(var(--nav-h) + 2px)",
                height: "calc(100vh - var(--nav-h) - 2px)",
                overflowY: "auto",
              }}>
                <div style={{ padding: "0 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)" }}>
                    Modules
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 10px" }}>
                  {TABS.map(({ id, label, sub }) => {
                    const active = tab === id;
                    return (
                      <button
                        key={id}
                        onClick={() => setTab(id)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "9px 12px",
                          background: active ? "var(--surface)" : "transparent",
                          border: "none",
                          borderLeft: `2px solid ${active ? "var(--orange)" : "transparent"}`,
                          borderRadius: "0 var(--r-sm) var(--r-sm) 0",
                          color: active ? "var(--text)" : "var(--text-3)",
                          fontSize: 12, fontWeight: active ? 600 : 400,
                          cursor: "pointer", textAlign: "left",
                          transition: "all 0.1s",
                          width: "100%",
                        }}
                        onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-2)"; (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)"; } }}
                        onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; } }}
                      >
                        <span>{label}</span>
                        <span style={{ fontSize: 9, color: active ? "var(--text-3)" : "var(--text-4)", fontWeight: 400 }}>{sub}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sidebar footer — chain info */}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "14px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
                  {[
                    { k: "Chain", v: "Robinhood" },
                    { k: "ID",    v: "4663" },
                    { k: "Stack", v: "Arb Orbit" },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{k}</span>
                      <span style={{ fontSize: 9, fontFamily: "var(--mono)", color: "var(--text-3)", fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </aside>
            )}

            {/* Main content */}
            <main style={{ padding: isMobile ? "16px 14px 16px" : "24px 28px 64px", minWidth: 0 }}>

              {/* Chain error */}
              {chain.error && (["radar","firewall","edge","workers","analytics","logs","network"] as Tab[]).includes(tab) && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--down-dim)", border: "1px solid var(--down-border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--down)", fontFamily: "var(--mono)" }}>
                  Chain data unavailable — {chain.error}. Retrying…
                </div>
              )}

              <Suspense fallback={<TabFallback />}>
                {tab === "radar"     && <RadarTab traffic={chain.traffic} stats={chain.stats} blocks={chain.blocks} isMobile={isMobile} />}
                {tab === "firewall"  && <FirewallTab suspicious={chain.suspicious} totalWallets={chain.stats.activeWallets} isMobile={isMobile} />}
                {tab === "edge"      && <EdgeTab deploys={chain.deploys} lastBlock={chain.lastBlock} />}
                {tab === "workers"   && <WorkersTab blocks={chain.blocks} color={color} isMobile={isMobile} />}
                {tab === "analytics" && <AnalyticsTab blocks={chain.blocks} isMobile={isMobile} />}
                {tab === "logs"      && <LogsTab blocks={chain.blocks} />}
                {tab === "network"   && <NetworkTab blocks={chain.blocks} />}
                {tab === "dns"       && <DnsTab isMobile={isMobile} />}
                {tab === "shield"    && (
                  <ShieldTab
                    level={ping.level}
                    latencyMs={ping.latencyMs}
                    avg5m={ping.avg5m}
                    uptime={ping.uptime}
                    totalPings={ping.totalPings}
                    history={ping.history}
                    blocks={ping.blocks}
                    color={color}
                    isMobile={isMobile}
                  />
                )}
              </Suspense>

              {/* Footer */}
              <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                  pingrbh · {ping.lastUpdated ? `updated ${ping.lastUpdated.toLocaleTimeString()}` : ""}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                  not affiliated with Robinhood Markets, Inc. or Cloudflare, Inc.
                </span>
              </div>
            </main>
          </div>

          {/* Mobile bottom tab bar — horizontally scrollable */}
          {isMobile && (
            <nav style={{
              position: "fixed",
              bottom: 0, left: 0, right: 0,
              height: 52,
              background: "var(--bg-2)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              zIndex: 200,
              overflowX: "auto",
              overflowY: "hidden",
              WebkitOverflowScrolling: "touch" as any,
              scrollbarWidth: "none" as any,
            }}>
              {TABS.map(({ id, short }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    style={{
                      flexShrink: 0,
                      minWidth: 72,
                      height: 52,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "transparent",
                      border: "none",
                      borderTop: `2px solid ${active ? "var(--orange)" : "transparent"}`,
                      borderBottom: "none",
                      color: active ? "var(--orange)" : "var(--text-3)",
                      fontSize: 10,
                      fontWeight: active ? 700 : 400,
                      cursor: "pointer",
                      padding: "0 12px",
                      letterSpacing: "0.04em",
                      transition: "color 0.1s, border-color 0.1s",
                      textTransform: "uppercase",
                      fontFamily: "var(--sans)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {short}
                  </button>
                );
              })}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
