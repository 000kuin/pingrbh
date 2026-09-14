import React from "react";
import type { NotificationSettings } from "../hooks/useNotifications.ts";
import { LiveDot } from "./Icons.tsx";

interface Props {
  settings:          NotificationSettings;
  permission:        NotificationPermission;
  isSupported:       boolean;
  onUpdate:          (patch: Partial<NotificationSettings>) => void;
  onRequestPermission: () => Promise<NotificationPermission>;
}

function Toggle({ on, onChange, label, sub }: {
  on: boolean; onChange: (v: boolean) => void;
  label: string; sub?: string;
}) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
      }}
      onClick={() => onChange(!on)}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{sub}</div>}
      </div>
      {/* Toggle pill */}
      <div style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: on ? "var(--orange)" : "var(--surface-2)",
        border: `1px solid ${on ? "var(--orange)" : "var(--border-2)"}`,
        position: "relative", transition: "background 0.2s, border-color 0.2s",
        cursor: "pointer",
      }}>
        <div style={{
          position: "absolute",
          top: 2, left: on ? 18 : 2,
          width: 14, height: 14,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
    </div>
  );
}

function ThresholdInput({ label, value, unit, onChange, min, max, step = 1 }: {
  label: string; value: number; unit: string;
  onChange: (v: number) => void;
  min: number; max: number; step?: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="number"
          value={value}
          min={min} max={max} step={step}
          onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
          style={{
            width: 72, padding: "4px 8px",
            background: "var(--surface)", border: "1px solid var(--border-2)",
            borderRadius: "var(--r-sm)", color: "var(--text)",
            fontFamily: "var(--mono)", fontSize: 11, outline: "none",
            textAlign: "right",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "var(--orange)")}
          onBlur={e => (e.currentTarget.style.borderColor = "var(--border-2)")}
        />
        <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "var(--mono)", minWidth: 28 }}>{unit}</span>
      </div>
    </div>
  );
}

export function NotificationsPanel({ settings, permission, isSupported, onUpdate, onRequestPermission }: Props) {

  if (!isSupported) {
    return (
      <div style={{ padding: "20px 0" }}>
        <div style={{ padding: "14px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 12, color: "var(--text-3)" }}>
          Browser notifications are not supported in this browser.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Permission / master toggle */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Push Notifications</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              {permission === "granted"
                ? "Browser permission granted"
                : permission === "denied"
                ? "Permission denied — enable in browser settings"
                : "Click to enable browser notifications"}
            </div>
          </div>
          {permission === "granted" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LiveDot color={settings.enabled ? "var(--fast)" : "var(--text-3)"} size={6} />
              <span style={{ fontSize: 10, fontFamily: "var(--mono)", color: settings.enabled ? "var(--fast)" : "var(--text-3)", fontWeight: 600 }}>
                {settings.enabled ? "ACTIVE" : "PAUSED"}
              </span>
              {/* Master toggle */}
              <div
                onClick={() => onUpdate({ enabled: !settings.enabled })}
                style={{
                  marginLeft: 8,
                  width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                  background: settings.enabled ? "var(--fast)" : "var(--surface-2)",
                  border: `1px solid ${settings.enabled ? "var(--fast-border)" : "var(--border-2)"}`,
                  position: "relative", transition: "background 0.2s",
                  cursor: "pointer",
                }}
              >
                <div style={{
                  position: "absolute", top: 2, left: settings.enabled ? 18 : 2,
                  width: 14, height: 14, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }} />
              </div>
            </div>
          ) : permission === "denied" ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--down)", fontFamily: "var(--mono)" }}>BLOCKED</span>
          ) : (
            <button
              onClick={onRequestPermission}
              style={{
                padding: "7px 14px", fontSize: 11, fontWeight: 700,
                color: "#fff", background: "var(--orange)",
                border: "none", borderRadius: "var(--r-sm)",
                cursor: "pointer", transition: "opacity 0.15s",
                fontFamily: "var(--sans)",
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Enable
            </button>
          )}
        </div>

        {/* Alert toggles — only shown when enabled */}
        {permission === "granted" && settings.enabled && (
          <div style={{ padding: "0 20px" }}>
            <Toggle
              on={settings.chainSurge}
              onChange={v => onUpdate({ chainSurge: v })}
              label="Chain surge"
              sub="Notify when sustained tx/min crosses threshold"
            />
            <Toggle
              on={settings.rpcDegraded}
              onChange={v => onUpdate({ rpcDegraded: v })}
              label="RPC degraded"
              sub="Notify when avg latency stays high for 60s"
            />
            <Toggle
              on={settings.rpcRecovered}
              onChange={v => onUpdate({ rpcRecovered: v })}
              label="RPC recovered"
              sub="Notify when latency returns to normal after degradation"
            />
            <Toggle
              on={settings.newDeploy}
              onChange={v => onUpdate({ newDeploy: v })}
              label="New contract deployed"
              sub="Notify when new bytecode hits the chain"
            />
            <div style={{ borderBottom: "none" }}>
              <Toggle
                on={settings.threatDetected}
                onChange={v => onUpdate({ threatDetected: v })}
                label="High-threat wallet detected"
                sub="Notify when Firewall flags a wallet above threat threshold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Thresholds — only shown when enabled */}
      {permission === "granted" && settings.enabled && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Alert thresholds</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>
              Based on 60-second rolling averages — single spikes are ignored
            </div>
          </div>
          <div style={{ padding: "0 20px" }}>
            {settings.chainSurge && (
              <ThresholdInput
                label="Chain surge threshold"
                value={settings.chainSurgeThreshold}
                unit="tx/min"
                min={1000} max={100000} step={1000}
                onChange={v => onUpdate({ chainSurgeThreshold: v })}
              />
            )}
            {settings.rpcDegraded && (
              <ThresholdInput
                label="RPC degraded threshold"
                value={settings.rpcDegradedMs}
                unit="ms"
                min={150} max={2000} step={50}
                onChange={v => onUpdate({ rpcDegradedMs: v })}
              />
            )}
            {settings.threatDetected && (
              <ThresholdInput
                label="Min threat score"
                value={settings.threatScore}
                unit="/100"
                min={10} max={100} step={5}
                onChange={v => onUpdate({ threatScore: v })}
              />
            )}
          </div>
        </div>
      )}

      {/* How it works note */}
      <div style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-2)" }}>How it works — </strong>
        All alerts use 60-second rolling averages to filter out noise. A single high block or slow ping won't trigger a notification — only sustained trends will. Notifications fire as native OS alerts even when this tab is in the background.
      </div>
    </div>
  );
}
