import { useState, useEffect, useRef, useCallback } from "react";
import {
  pingRpc,
  fetchRecentBlocks,
  avgBlockTime,
  classifyLatency,
  type PingResult,
  type BlockInfo,
  type LatencyPoint,
  type PingLevel,
} from "../lib/rpc.ts";
import { loadHistory, saveHistory } from "../lib/history.ts";

const POLL_MS = 3000;
const HISTORY_MAX = 200;

export type { PingLevel, BlockInfo, LatencyPoint, PingResult };

export interface PingState {
  current:    PingResult | null;
  level:      PingLevel;
  blocksOk:   boolean;
  latencyMs: number;
  avg5m: number;         // average over last ~100 pings (5 min at 3s interval)
  min5m: number;
  max5m: number;
  history: LatencyPoint[];
  blocks: BlockInfo[];
  blockTime: number;     // avg block time in seconds
  uptime: number;        // % of last 100 pings that succeeded
  totalPings: number;
  successPings: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Load once at module init so useState and useRef share the same array
// (avoids two separate localStorage reads and two JSON.parse calls on mount)
function initHistory() {
  return loadHistory();
}

export function usePing(): PingState {
  // historyRef is the mutable working copy — initialised from localStorage once
  const historyRef   = useRef<LatencyPoint[]>(initHistory());
  const pingCountRef = useRef({ total: 0, success: 0 });

  const [state, setState] = useState<PingState>(() => {
    // Seed initial state from the SAME persisted history array
    const saved = historyRef.current;
    const recent = saved.slice(-100);
    const recentMs = recent.map(p => p.ms);
    const avg5m = recentMs.length > 0 ? Math.round(recentMs.reduce((a, b) => a + b, 0) / recentMs.length) : 0;
    const min5m = recentMs.length > 0 ? Math.min(...recentMs) : 0;
    const max5m = recentMs.length > 0 ? Math.max(...recentMs) : 0;
    const successCount = recent.filter(p => p.ms < 1500).length;
    const uptime = recent.length > 0 ? Math.round((successCount / recent.length) * 100) : 100;
    return {
      current:  null,
      level:    "down",  // conservative until first live ping confirms status
      blocksOk: false,
      latencyMs: avg5m,
      avg5m,
      min5m,
      max5m,
      history: saved,
      blocks: [],
      blockTime: 0.1,
      uptime,
      totalPings: 0,
      successPings: 0,
      loading: true,
      error: null,
      lastUpdated: null,
    };
  });

  const poll = useCallback(async () => {
    const result = await pingRpc();
    const now = Date.now();

    // Update history — store success flag per point for accurate uptime
    const point: LatencyPoint = { t: now, ms: result.latencyMs, block: result.blockNumber };
    historyRef.current.push(point);
    if (historyRef.current.length > HISTORY_MAX) {
      historyRef.current.shift();
    }

    // Update ping counts
    pingCountRef.current.total++;
    if (result.success) pingCountRef.current.success++;

    // Compute stats from history window
    // Use classifyLatency thresholds for success: anything not "down" is a success
    const recent = historyRef.current.slice(-100);
    const recentMs = recent.map(p => p.ms);
    const avg5m = recentMs.length > 0 ? recentMs.reduce((a, b) => a + b, 0) / recentMs.length : 0;
    const min5m = recentMs.length > 0 ? Math.min(...recentMs) : 0;
    const max5m = recentMs.length > 0 ? Math.max(...recentMs) : 0;
    // A ping is "successful" if ms < 1500 (matches classifyLatency "down" threshold)
    const successCount = recent.filter(p => p.ms < 1500).length;
    const uptime = recent.length > 0 ? (successCount / recent.length) * 100 : 100;

    const level = classifyLatency(result.latencyMs, result.success);

    const newHistory = [...historyRef.current];
    // Persist to localStorage (debounced to every 5th ping to avoid excessive writes)
    if (pingCountRef.current.total % 5 === 0) {
      saveHistory(newHistory);
    }

    setState(prev => ({
      ...prev,
      current:  result,
      level,
      blocksOk: result.success && result.blockNumber > 0,
      latencyMs: result.latencyMs,
      avg5m: Math.round(avg5m),
      min5m,
      max5m,
      history: newHistory,
      uptime: Math.round(uptime),
      totalPings: pingCountRef.current.total,
      successPings: pingCountRef.current.success,
      loading: false,
      error: result.success ? null : result.error ?? "RPC unreachable",
      lastUpdated: new Date(),
    }));
  }, []);

  // Fetch blocks separately (less frequent)
  const pollBlocks = useCallback(async () => {
    const blocks = await fetchRecentBlocks(30);
    const blockTime = avgBlockTime(blocks);
    setState(prev => ({ ...prev, blocks, blockTime }));
  }, []);

  useEffect(() => {
    // First load
    poll();
    pollBlocks();

    const pingInterval = setInterval(poll, POLL_MS);
    const blockInterval = setInterval(pollBlocks, 10_000);

    // Save on page unload to capture the most recent pings
    const onUnload = () => saveHistory(historyRef.current);
    window.addEventListener("beforeunload", onUnload);

    return () => {
      clearInterval(pingInterval);
      clearInterval(blockInterval);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [poll, pollBlocks]);

  return state;
}
