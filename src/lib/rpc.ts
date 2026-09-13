import { getRpcUrl } from "./activeRpc.ts";

export interface PingResult {
  latencyMs: number;
  blockNumber: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface BlockInfo {
  number: number;
  timestamp: number;
  txCount: number;
  gasUsed: number;
  gasLimit: number;
  baseFeeGwei: number;
}

export interface LatencyPoint {
  t: number;    // unix ms (client time of ping)
  ms: number;   // round-trip latency in ms
  block: number;
}

async function rpc(method: string, params: unknown[] = [], timeoutMs = 8000): Promise<any> {
  const res = await fetch(getRpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (text.startsWith("<")) throw new Error("RPC rate limited");
  const json = JSON.parse(text);
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

/**
 * Ping: only times eth_blockNumber — that's the actual RPC round-trip.
 * Then fetches block in a separate call (not counted in latency).
 */
export async function pingRpc(): Promise<PingResult> {
  try {
    // ── timed region: only eth_blockNumber ──
    const t0 = performance.now();
    const blockHex = await rpc("eth_blockNumber");
    const latencyMs = Math.round(performance.now() - t0);
    // ────────────────────────────────────────

    const blockNumber = parseInt(blockHex, 16);

    // Fetch block header for timestamp — NOT counted in latency
    let timestamp = 0;
    try {
      const block = await rpc("eth_getBlockByNumber", [`0x${blockNumber.toString(16)}`, false]);
      timestamp = parseInt(block.timestamp, 16);
    } catch {
      // non-fatal — timestamp is cosmetic
    }

    return { latencyMs, blockNumber, timestamp, success: true };
  } catch (e) {
    return {
      latencyMs: 9999,
      blockNumber: 0,
      timestamp: 0,
      success: false,
      error: e instanceof Error ? e.message : "RPC error",
    };
  }
}

/**
 * Fetch recent block headers (no tx bodies — fast).
 * txCount comes from b.transactions array of hashes (length is accurate).
 */
export async function fetchRecentBlocks(count = 20): Promise<BlockInfo[]> {
  try {
    const latestHex = await rpc("eth_blockNumber");
    const latest = parseInt(latestHex, 16);

    // false = lightweight block (tx hashes only, not full tx objects)
    const blocks = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        rpc("eth_getBlockByNumber", [`0x${(latest - i).toString(16)}`, false])
      )
    );

    return blocks.filter(Boolean).map((b: any) => ({
      number:      parseInt(b.number, 16),
      timestamp:   parseInt(b.timestamp, 16),
      // transactions is array of tx hashes when false — length = actual count
      txCount:     Array.isArray(b.transactions) ? b.transactions.length : 0,
      gasUsed:     parseInt(b.gasUsed, 16),
      gasLimit:    parseInt(b.gasLimit, 16),
      baseFeeGwei: b.baseFeePerGas ? parseInt(b.baseFeePerGas, 16) / 1e9 : 0,
    }));
  } catch {
    return [];
  }
}

/**
 * Compute average block time (seconds) from sorted block headers.
 * RH Chain blocks are ~100ms so timestamps (in seconds) may repeat.
 * We use block numbers to compute rate instead of relying on timestamp diffs.
 */
export function avgBlockTime(blocks: BlockInfo[]): number {
  if (blocks.length < 2) return 0.1;

  // Find pairs where timestamp actually differs
  const diffs: number[] = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    const tDiff = blocks[i]!.timestamp - blocks[i + 1]!.timestamp;
    const nDiff = blocks[i]!.number   - blocks[i + 1]!.number;
    if (tDiff > 0 && nDiff > 0) {
      diffs.push(tDiff / nDiff); // seconds per block
    }
  }

  if (diffs.length === 0) {
    // All blocks in the same second — estimate from total span
    const newestTs = blocks[0]!.timestamp;
    const oldestTs = blocks[blocks.length - 1]!.timestamp;
    const blockSpan = blocks[0]!.number - blocks[blocks.length - 1]!.number;
    if (blockSpan > 0 && newestTs > oldestTs) {
      return (newestTs - oldestTs) / blockSpan;
    }
    return 0.1; // genuine 100ms blocks
  }

  return diffs.reduce((a, b) => a + b, 0) / diffs.length;
}

export type PingLevel = "fast" | "normal" | "slow" | "down";

export function classifyLatency(ms: number, success: boolean): PingLevel {
  if (!success || ms >= 9999) return "down";
  if (ms < 150)  return "fast";
  if (ms < 500)  return "normal";
  if (ms < 1500) return "slow";
  return "down";
}
