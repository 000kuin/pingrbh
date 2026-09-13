export interface RpcEndpoint {
  name: string;
  url: string;
  provider: string;
  requiresKey: boolean;
  latencyMs: number | null;
  blockNumber: number | null;
  status: "online" | "slow" | "down" | "untested";
  error?: string;
}

// All known public Robinhood Chain RPC endpoints
export const RPC_ENDPOINTS: Omit<RpcEndpoint, "latencyMs" | "blockNumber" | "status" | "error">[] = [
  {
    name: "Robinhood Official",
    url: "https://rpc.mainnet.chain.robinhood.com",
    provider: "Robinhood",
    requiresKey: false,
  },
  {
    name: "Robinhood Sequencer",
    url: "https://sequencer.mainnet.chain.robinhood.com",
    provider: "Robinhood",
    requiresKey: false,
  },
  {
    name: "Alchemy",
    url: "https://robinhood-mainnet.g.alchemy.com/v2/demo",
    provider: "Alchemy",
    requiresKey: true,
  },
];

/** Ping a single RPC endpoint and return latency + block number */
export async function testRpc(url: string): Promise<{ latencyMs: number; blockNumber: number; success: boolean; error?: string }> {
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    const latencyMs = Math.round(performance.now() - t0);
    const json = await res.json();
    if (json.error) return { latencyMs, blockNumber: 0, success: false, error: json.error.message };
    const blockNumber = parseInt(json.result, 16);
    return { latencyMs, blockNumber, success: true };
  } catch (e) {
    return {
      latencyMs: Math.round(performance.now() - t0),
      blockNumber: 0,
      success: false,
      error: e instanceof Error ? e.message : "Timeout or network error",
    };
  }
}

export function classifyRpcLatency(ms: number): "online" | "slow" | "down" {
  if (ms < 300)  return "online";
  if (ms < 1000) return "slow";
  return "down";
}
