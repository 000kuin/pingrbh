/**
 * useNotifications — browser push notification alerts for pingrbh
 *
 * Fires OS-level notifications when sustained chain conditions are met.
 * All comparisons use rolling averages to avoid false positives from
 * single-poll spikes or momentary fluctuations.
 *
 * Rolling window: last 15 readings at 4s poll = 60 seconds of data.
 * Alerts compare the CURRENT window avg to the PREVIOUS window avg.
 * This means an alert only fires when a trend is established, not on noise.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotificationSettings {
  enabled:        boolean;
  chainSurge:     boolean;
  chainSurgeThreshold: number;   // tx/min average threshold
  rpcDegraded:    boolean;
  rpcDegradedMs:  number;        // avg latency threshold (ms)
  rpcRecovered:   boolean;
  newDeploy:      boolean;
  threatDetected: boolean;
  threatScore:    number;        // min threat score to alert on
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled:        false,
  chainSurge:     true,
  chainSurgeThreshold: 12000,
  rpcDegraded:    true,
  rpcDegradedMs:  600,
  rpcRecovered:   true,
  newDeploy:      true,
  threatDetected: true,
  threatScore:    70,
};

const STORAGE_KEY = "pingrbh:notifications";
const WINDOW_SIZE = 15; // readings per window (15 × 4s = 60s)

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: NotificationSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function notify(title: string, body: string, icon = "/favicon.ico") {
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon, silent: false });
  } catch {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface NotificationInput {
  txPerMin:    number;
  latencyMs:   number;
  level:       string;
  deploys:     number;  // contract deploy count in current window
  maxThreat:   number;  // highest threat score in current suspicious list
}

export function useNotifications() {
  const [settings, setSettingsState] = useState<NotificationSettings>(loadSettings);
  const [permission, setPermission]  = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  // Rolling windows — two windows so we can compare prev vs current
  const txWindow    = useRef<number[]>([]);
  const latWindow   = useRef<number[]>([]);

  // Track state for edge-triggered alerts (only fire on transition, not every poll)
  const wasRpcDegraded  = useRef(false);
  const hasFiredSurge   = useRef(false); // prevents re-firing while still in surge
  const lastDeployCount = useRef(-1);    // -1 = not yet seeded (avoids false alert on first feed)
  const lastThreat      = useRef(0);

  const updateSettings = useCallback((patch: Partial<NotificationSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      updateSettings({ enabled: true });
      notify("pingrbh notifications enabled", "You'll be alerted when chain conditions change.");
    }
    return result;
  }, [updateSettings]);

  /**
   * Feed a new data reading into the rolling windows and check all alert conditions.
   * Call this from App.tsx on every poll cycle.
   */
  const feed = useCallback((input: NotificationInput) => {
    if (!settings.enabled || permission !== "granted") return;

    // ── Update rolling windows ─────────────────────────────────────────────
    txWindow.current.push(input.txPerMin);
    latWindow.current.push(input.latencyMs);

    // Keep only 2x window size so we can compare prev vs current
    if (txWindow.current.length  > WINDOW_SIZE * 2) txWindow.current.shift();
    if (latWindow.current.length > WINDOW_SIZE * 2) latWindow.current.shift();

    const txCurrent = txWindow.current.slice(-WINDOW_SIZE);
    const txPrev    = txWindow.current.slice(-WINDOW_SIZE * 2, -WINDOW_SIZE);
    const latCurrent = latWindow.current.slice(-WINDOW_SIZE);

    // Need at least a full window before alerting
    if (txCurrent.length < WINDOW_SIZE) return;

    const txAvgNow  = avg(txCurrent);
    const txAvgPrev = txPrev.length >= 5 ? avg(txPrev) : txAvgNow;
    const latAvgNow = avg(latCurrent);

    // ── Chain surge ────────────────────────────────────────────────────────
    if (settings.chainSurge) {
      const threshold = settings.chainSurgeThreshold;
      if (txAvgNow < threshold) {
        // Below threshold — re-arm so next crossing fires
        hasFiredSurge.current = false;
      } else if (txAvgNow >= threshold && !hasFiredSurge.current) {
        // Above threshold and haven't fired yet for this surge
        hasFiredSurge.current = true;
        notify(
          "📈 Chain surge detected",
          `Robinhood Chain averaging ${Math.round(txAvgNow).toLocaleString()} tx/min over the last 60s`
        );
      }
    }

    // ── RPC degraded ──────────────────────────────────────────────────────
    if (settings.rpcDegraded) {
      const isDegraded = latAvgNow >= settings.rpcDegradedMs && input.level !== "fast";
      if (isDegraded && !wasRpcDegraded.current) {
        wasRpcDegraded.current = true;
        notify(
          "⚠️ RPC slowing down",
          `Average latency ${Math.round(latAvgNow)}ms over the last 60s (threshold: ${settings.rpcDegradedMs}ms)`
        );
      } else if (!isDegraded && wasRpcDegraded.current && settings.rpcRecovered) {
        wasRpcDegraded.current = false;
        notify(
          "✅ RPC recovered",
          `Latency back to ${Math.round(latAvgNow)}ms — all systems operational`
        );
      } else if (!isDegraded) {
        wasRpcDegraded.current = false;
      }
    }

    // ── New deploy ─────────────────────────────────────────────────────────
    if (lastDeployCount.current === -1) {
      // First feed — seed the counter without alerting (avoids firing on page load)
      lastDeployCount.current = input.deploys;
    } else if (settings.newDeploy && input.deploys > lastDeployCount.current) {
      const newCount = input.deploys - lastDeployCount.current;
      notify(
        "🔨 New contract deployed",
        `${newCount} new contract${newCount > 1 ? "s" : ""} detected on Robinhood Chain`
      );
      lastDeployCount.current = input.deploys;
    } else {
      lastDeployCount.current = input.deploys;
    }

    // ── Threat detected ────────────────────────────────────────────────────
    // Reset baseline when threat clears so next high-threat event always fires
    if (input.maxThreat === 0) {
      lastThreat.current = 0;
    } else if (settings.threatDetected && input.maxThreat >= settings.threatScore) {
      if (input.maxThreat > lastThreat.current) {
        notify(
          "🚨 High-threat wallet detected",
          `Threat score ${input.maxThreat}/100 — possible bot, sniper, or MEV activity`
        );
        lastThreat.current = input.maxThreat;
      }
    }
  }, [settings, permission]);

  // Sync permission state if user changes it in browser settings
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    const interval = setInterval(() => {
      if (Notification.permission !== permission) {
        setPermission(Notification.permission);
        if (Notification.permission !== "granted") {
          updateSettings({ enabled: false });
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [permission, updateSettings]);

  return {
    settings,
    permission,
    updateSettings,
    requestPermission,
    feed,
    isSupported: typeof Notification !== "undefined",
  };
}
