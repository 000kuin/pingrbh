/**
 * Persist latency history to localStorage so the Shield tab shows real
 * historical data on page reload instead of starting empty.
 *
 * Storage key: "pingrbh:history"
 * Format: JSON array of LatencyPoint (up to HISTORY_MAX entries, newest last)
 * TTL: entries older than 24h are discarded on load to avoid stale data
 */

import type { LatencyPoint } from "./rpc.ts";

const KEY     = "pingrbh:history";
const MAX_AGE = 24 * 60 * 60 * 1000; // 24h in ms

export function loadHistory(): LatencyPoint[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: LatencyPoint[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Discard entries older than 24h
    const cutoff = Date.now() - MAX_AGE;
    return parsed.filter(p =>
      typeof p.t === "number" &&
      typeof p.ms === "number" &&
      typeof p.block === "number" &&
      p.t > cutoff
    );
  } catch {
    return [];
  }
}

export function saveHistory(history: LatencyPoint[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(history));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}
