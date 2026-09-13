/**
 * useFailover — eagerly tests all RPC endpoints and promotes the fastest one.
 *
 * Mounted in App.tsx so failover runs immediately when the monitor page loads,
 * regardless of whether the user ever opens the DNS tab.
 *
 * Lightweight: only uses eth_blockNumber (same as useBlockNumber), runs every 30s.
 * Does NOT expose endpoint state — that's the DNS tab's job.
 */
import { useEffect } from "react";
import { RPC_ENDPOINTS, testRpc, classifyRpcLatency } from "../lib/rpcs.ts";
import { setActiveRpc } from "../lib/activeRpc.ts";

const POLL_MS = 30_000; // less frequent than DNS tab (15s) to avoid double-hammering

async function findBestEndpoint(): Promise<void> {
  const results = await Promise.all(
    RPC_ENDPOINTS.filter(ep => !ep.requiresKey).map(async ep => {
      const r = await testRpc(ep.url);
      return {
        url: ep.url,
        latencyMs: r.success ? r.latencyMs : null,
        status: r.success ? classifyRpcLatency(r.latencyMs) : "down" as const,
      };
    })
  );

  // Pick fastest online, then fastest slow, ignoring down
  const best = results
    .filter(r => r.status !== "down" && r.latencyMs !== null)
    .sort((a, b) => (a.latencyMs ?? 9999) - (b.latencyMs ?? 9999))[0];

  if (best) setActiveRpc(best.url);
}

export function useFailover(): void {
  useEffect(() => {
    findBestEndpoint();
    const interval = setInterval(findBestEndpoint, POLL_MS);
    return () => clearInterval(interval);
  }, []);
}
