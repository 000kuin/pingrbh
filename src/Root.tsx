import React, { lazy, Suspense } from "react";
import { Route, Switch, useLocation, Link } from "wouter";
import { App } from "./App.tsx";
import { IconExternalLink } from "./components/Icons.tsx";
import { useBlockNumber } from "./hooks/useBlockNumber.ts";

const TokenPage = lazy(() => import("./pages/TokenPage.tsx").then(m => ({ default: m.TokenPage })));
const DocsPage  = lazy(() => import("./pages/DocsPage.tsx").then(m => ({ default: m.DocsPage })));
const ApiPage   = lazy(() => import("./pages/ApiPage.tsx").then(m => ({ default: m.ApiPage })));

function NavLink({ href, children, style, onMouseEnter, onMouseLeave }: {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
}) {
  return (
    <Link
      href={href}
      style={{ textDecoration: "none", ...style }}
      onMouseEnter={onMouseEnter as any}
      onMouseLeave={onMouseLeave as any}
    >
      {children}
    </Link>
  );
}

export function Root() {
  const [location]  = useLocation();
  const blockNumber = useBlockNumber();

  return (
    <>
      {/* Orange accent line at very top */}
      <div style={{ height: 2, background: "var(--orange)", width: "100%" }} />

      <nav style={{
        height: "var(--nav-h)",
        padding: "0 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-2)",
        position: "sticky", top: 2, zIndex: 200,
      }}>
        {/* Left: logo */}
        <NavLink href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Grid-style logomark — more industrial than diamond */}
          <div style={{
            width: 22, height: 22,
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2,
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                background: i === 3 ? "var(--orange)" : "var(--surface-2)",
                border: `1px solid ${i === 3 ? "var(--orange)" : "var(--border-2)"}`,
                borderRadius: 1,
              }} />
            ))}
          </div>
          <span style={{
            fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em",
            color: "var(--text)", fontFamily: "var(--sans)",
          }}>
            ping<span style={{ color: "var(--orange)" }}>rbh</span>
          </span>
        </NavLink>

        {/* Center: nav links */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {[
            { href: "/",      label: "Monitor" },
            { href: "/api",   label: "API"     },
            { href: "/docs",  label: "Docs"    },
            { href: "/token", label: "$PING"   },
          ].map(({ href, label }) => {
            const active = location === href;
            return (
              <NavLink
                key={href}
                href={href}
                style={{
                  display: "inline-block",
                  padding: "5px 12px",
                  fontSize: 12, fontWeight: active ? 600 : 400,
                  color: active ? "var(--text)" : "var(--text-3)",
                  background: active ? "var(--surface)" : "transparent",
                  borderRadius: "var(--r-sm)",
                  border: `1px solid ${active ? "var(--border-2)" : "transparent"}`,
                  transition: "all 0.12s",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "var(--text-3)"; }}
              >
                {label}
              </NavLink>
            );
          })}
        </div>

        {/* Right: live block counter + explorer (hidden on mobile) */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {blockNumber !== null && (
            <div className="nav-explorer" style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)",
              letterSpacing: "0.01em",
            }}>
              <span style={{ position: "relative", display: "inline-flex", width: 6, height: 6, flexShrink: 0 }}>
                <span style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "var(--fast)",
                  animation: "pulse-ring 2s ease-out infinite",
                  opacity: 0.5,
                }} />
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--fast)" }} />
              </span>
              <span style={{ fontWeight: 600, color: "var(--text-2)" }}>
                #{blockNumber.toLocaleString()}
              </span>
            </div>
          )}
          <a
            href="https://robinhoodchain.blockscout.com"
            target="_blank" rel="noopener noreferrer"
            className="nav-explorer"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 11, color: "var(--text-3)",
              fontFamily: "var(--mono)", letterSpacing: "0.02em",
              transition: "color 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-2)"}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = "var(--text-3)"}
          >
            Explorer <IconExternalLink size={10} color="currentColor" />
          </a>
        </div>
      </nav>

      <Suspense fallback={null}>
        <Switch>
          <Route path="/"      component={App} />
          <Route path="/api"   component={ApiPage} />
          <Route path="/docs"  component={DocsPage} />
          <Route path="/token" component={TokenPage} />
        </Switch>
      </Suspense>
    </>
  );
}
