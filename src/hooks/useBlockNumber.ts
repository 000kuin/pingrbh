import { useState, useEffect } from "react";
import { getRpcUrl } from "../lib/activeRpc.ts";

const POLL_MS = 2000; // faster than usePing so nav updates feel snappy

async function fetchBlockNumber(): Promise<number | null> {
  try {
    const res = await fetch(getRpcUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.startsWith("<")) return null;
    const json = JSON.parse(text);
    if (json.error) return null;
    return parseInt(json.result, 16);
  } catch {
    return null;
  }
}

export function useBlockNumber(): number | null {
  const [blockNumber, setBlockNumber] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      const n = await fetchBlockNumber();
      if (mounted && n !== null) setBlockNumber(n);
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return blockNumber;
}
