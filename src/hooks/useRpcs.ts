import { useState, useEffect, useCallback } from "react";
import { RPC_ENDPOINTS, testRpc, classifyRpcLatency, type RpcEndpoint } from "../lib/rpcs.ts";
import { setActiveRpc, onActiveRpcChange, getRpcUrl } from "../lib/activeRpc.ts";

const POLL_MS = 15_000; // test every 15s — don't hammer endpoints

export function useRpcs() {
  const [endpoints, setEndpoints] = useState<RpcEndpoint[]>(
    RPC_ENDPOINTS.map(e => ({ ...e, latencyMs: null, blockNumber: null, status: "untested" as const }))
  );
  const [loading, setLoading]         = useState(true);
  const [activeUrl, setActiveUrl]     = useState(getRpcUrl);

  // Track active URL changes from other parts of the app
  useEffect(() => {
    return onActiveRpcChange(setActiveUrl);
  }, []);

  const testAll = useCallback(async () => {
    const results = await Promise.all(
      RPC_ENDPOINTS.map(async (ep) => {
        const result = await testRpc(ep.url);
        const status = result.success
          ? classifyRpcLatency(result.latencyMs)
          : "down";
        return {
          ...ep,
          latencyMs:   result.success ? result.latencyMs : null,
          blockNumber: result.success ? result.blockNumber : null,
          status,
          error: result.error,
        } as RpcEndpoint;
      })
    );

    // Sort: online first, then by latency ascending
    results.sort((a, b) => {
      if (a.status === "down" && b.status !== "down") return 1;
      if (b.status === "down" && a.status !== "down") return -1;
      if (a.latencyMs === null) return 1;
      if (b.latencyMs === null) return -1;
      return a.latencyMs - b.latencyMs;
    });

    // Auto-failover: promote the fastest online endpoint that doesn't need a key
    const best = results.find(e => e.status === "online" && !e.requiresKey)
               ?? results.find(e => e.status !== "down" && !e.requiresKey);
    if (best) setActiveRpc(best.url);

    setEndpoints(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    testAll();
    const interval = setInterval(testAll, POLL_MS);
    return () => clearInterval(interval);
  }, [testAll]);

  return { endpoints, loading, activeUrl, refresh: testAll };
}
