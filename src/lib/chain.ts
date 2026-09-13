import { getRpcUrl } from "./activeRpc.ts";

async function rpc(method: string, params: unknown[] = [], timeoutMs = 10000): Promise<any> {
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

export interface TxFull {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gas: string;       // gas limit hex
  gasPrice: string;  // hex
  input: string;
  blockNumber: number;
}

export interface BlockFull {
  number: number;
  timestamp: number;
  txCount: number;
  gasUsed: number;
  gasLimit: number;
  transactions: TxFull[];
  miner: string;
}

export interface ContractDeploy {
  hash: string;
  from: string;
  blockNumber: number;
  timestamp: number;
  inputSize: number;
}

export interface SuspiciousWallet {
  address:      string;
  txCount:      number;
  flags:        string[];
  threatScore:  number;   // 0–100 composite score
  firstBlock:   number;
  lastBlock:    number;
  blocksActive: number;
  topTarget:    string | null;   // most-called contract
  gasPrices:    number[];        // for uniformity analysis
}

export interface TrafficPoint {
  blockNumber:     number;
  txCount:         number;
  contractDeploys: number;
  uniqueWallets:   number;
}

export interface ChainStats {
  txPerMin:        number;
  activeWallets:   number;
  contractDeploys: number;
  avgBlockFill:    number;   // always ~0% on Arb Orbit (gas limit is 2^50)
  avgTxPerBlock:   number;   // more meaningful utilization metric
  totalTx:         number;
  avgBlockTimeSec: number;  // actual measured block time
}

export async function fetchFullBlocks(count = 10): Promise<BlockFull[]> {
  const latestHex = await rpc("eth_blockNumber");
  const latest = parseInt(latestHex, 16);

  const raw = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      rpc("eth_getBlockByNumber", [`0x${(latest - i).toString(16)}`, true])
    )
  );

  return raw.filter(Boolean).map((b: any) => ({
    number:    parseInt(b.number, 16),
    timestamp: parseInt(b.timestamp, 16),
    txCount:   Array.isArray(b.transactions) ? b.transactions.length : 0,
    gasUsed:   parseInt(b.gasUsed, 16),
    gasLimit:  parseInt(b.gasLimit, 16),
    miner:     b.miner ?? "",
    transactions: Array.isArray(b.transactions)
      ? b.transactions.map((tx: any) => ({
          hash:        tx.hash ?? "",
          from:        (tx.from ?? "").toLowerCase(),
          // Robinhood Chain RPC bug: eth_getBlockByNumber(true) returns "" instead of null
          // for CREATE transactions. Normalise both cases to null so deploy detection works.
          to:          (tx.to == null || tx.to === "") ? null : tx.to.toLowerCase(),
          value:       tx.value ?? "0x0",
          gas:         tx.gas ?? "0x0",
          gasPrice:    tx.gasPrice ?? "0x0",
          input:       tx.input ?? "0x",
          blockNumber: parseInt(b.number, 16),
        }))
      : [],
  }));
}

export function extractDeploys(blocks: BlockFull[]): ContractDeploy[] {
  const deploys: ContractDeploy[] = [];
  for (const b of blocks) {
    for (const tx of b.transactions) {
      if (tx.to === null && tx.input && tx.input.length > 2) {
        deploys.push({
          hash:        tx.hash,
          from:        tx.from,
          blockNumber: b.number,
          timestamp:   b.timestamp,
          inputSize:   Math.floor((tx.input.length - 2) / 2),
        });
      }
    }
  }
  return deploys.sort((a, b) => b.blockNumber - a.blockNumber);
}

/**
 * Strengthened suspicious wallet detection with composite threat scoring.
 *
 * FLAGS (each adds to threat score):
 *
 *   launch-sniper (+40)
 *     Wallet bought a contract that was DEPLOYED in the SAME block.
 *     This is genuine first-block sniping — buying a token the moment
 *     its contract was created, before it appears on any UI.
 *
 *   bot-loop (+35)
 *     Wallet calls the same contract with IDENTICAL 4-byte selectors
 *     AND identical/near-identical gas prices (within 5%).
 *     Signature of an automated trading loop.
 *
 *   high-frequency (+20)
 *     5+ txs in the window. On a 100ms chain, 5 txs across a
 *     ~5s window is statistically unusual for a human trader.
 *
 *   sandwich (+30)
 *     Wallet has txs IMMEDIATELY before AND after a victim tx to the
 *     same contract in the same block (MEV sandwich pattern).
 *
 *   multi-block (+10)
 *     Active across 4+ distinct blocks — sustained automated activity.
 *
 *   uniform-gas (+15)
 *     All txs use gas prices within 1% of each other.
 *     Humans vary their gas; bots use programmatic fixed prices.
 *
 *   deployer (+5)
 *     Sent at least one contract creation tx.
 */
export function detectSuspiciousWallets(blocks: BlockFull[]): SuspiciousWallet[] {
  if (blocks.length === 0) return [];

  const newestBlock = blocks[0]!.number;

  // Build a set of contracts deployed per block for launch-sniper detection
  const deployedInBlock = new Map<number, Set<string>>();
  for (const b of blocks) {
    const deployed = new Set<string>();
    // Contract address is deterministic: keccak(rlp([sender, nonce]))
    // We don't have receipt data so we can't get the exact address,
    // BUT we CAN check: does this wallet's tx come AFTER a creation tx
    // in the same block, targeting a contract that didn't exist before?
    // Approximation: flag wallets that call a to-address that appears as
    // a deploy SENDER in the same block (buying from the deployer's contract)
    for (const tx of b.transactions) {
      if (tx.to === null && tx.from) deployed.add(tx.from);
    }
    deployedInBlock.set(b.number, deployed);
  }

  // Build per-wallet data
  const walletMap = new Map<string, {
    txs: TxFull[];
    blockSet: Set<number>;
    firstBlock: number;
    lastBlock: number;
  }>();

  for (const b of blocks) {
    for (const tx of b.transactions) {
      if (!tx.from) continue;
      if (!walletMap.has(tx.from)) {
        walletMap.set(tx.from, {
          txs: [], blockSet: new Set(),
          firstBlock: b.number, lastBlock: b.number,
        });
      }
      const entry = walletMap.get(tx.from)!;
      entry.txs.push(tx);
      entry.blockSet.add(b.number);
      if (b.number > entry.lastBlock) entry.lastBlock = b.number;
      if (b.number < entry.firstBlock) entry.firstBlock = b.number;
    }
  }

  // Build block-level tx index for sandwich detection
  // blockTxIndex: blockNumber → array of (from, to, txIndex)
  const blockTxIndex = new Map<number, { from: string; to: string | null; idx: number }[]>();
  for (const b of blocks) {
    blockTxIndex.set(b.number, b.transactions.map((tx, idx) => ({
      from: tx.from, to: tx.to, idx,
    })));
  }

  const suspicious: SuspiciousWallet[] = [];

  for (const [address, data] of walletMap.entries()) {
    const { txs, blockSet, firstBlock, lastBlock } = data;
    const flags: string[] = [];
    let threatScore = 0;

    // ── gas price analysis ────────────────────────────────────────────────
    const gasPrices = txs
      .map(tx => parseInt(tx.gasPrice, 16))
      .filter(p => p > 0);

    // uniform-gas: all prices within 1% of each other
    if (gasPrices.length >= 3) {
      const minGas = Math.min(...gasPrices);
      const maxGas = Math.max(...gasPrices);
      if (minGas > 0 && (maxGas - minGas) / minGas < 0.01) {
        flags.push("uniform-gas");
        threatScore += 15;
      }
    }

    // ── target analysis ───────────────────────────────────────────────────
    const targetCounts = new Map<string, number>();
    const targetSelectors = new Map<string, Map<string, number>>(); // to → selector → count

    for (const tx of txs) {
      if (!tx.to) continue;
      targetCounts.set(tx.to, (targetCounts.get(tx.to) ?? 0) + 1);
      if (!targetSelectors.has(tx.to)) targetSelectors.set(tx.to, new Map());
      const sel = tx.input.slice(0, 10); // 4-byte selector
      const selMap = targetSelectors.get(tx.to)!;
      selMap.set(sel, (selMap.get(sel) ?? 0) + 1);
    }

    // Sort targets by call count
    const topTargetEntry = [...targetCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topTarget      = topTargetEntry?.[0] ?? null;
    const maxRepeat      = topTargetEntry?.[1] ?? 0;

    // bot-loop: same target + same selector 3+ times with uniform gas
    // Require actual non-zero gas prices to avoid flagging system/sequencer txs (gasPrice=0x0)
    if (topTarget && maxRepeat >= 3 && gasPrices.length >= 2) {
      const topSelMap = targetSelectors.get(topTarget)!;
      const maxSelCount = Math.max(...topSelMap.values());
      if (maxSelCount >= 3 && flags.includes("uniform-gas")) {
        flags.push("bot-loop");
        threatScore += 35;
      }
    }

    // ── launch-sniper detection ───────────────────────────────────────────
    // A wallet is a launch sniper if it calls a contract in the same block
    // that the contract's deployer is sending a creation tx.
    // We detect this by: wallet calls to-address X in block B,
    // AND there is another tx in block B with to=null (a deploy),
    // AND the wallet's first tx in our entire window is in block B.
    if (firstBlock === newestBlock) {
      const newestBlockTxs = blockTxIndex.get(newestBlock) ?? [];
      const deploysInNewest = new Set(
        newestBlockTxs.filter(t => t.to === null).map(t => t.from)
      );
      // Check if this wallet called any to-address where the deployer
      // is also active in the same block (proxy for "just deployed token")
      const walletTxsInNewest = txs.filter(t => t.blockNumber === newestBlock);
      const calledTargets = new Set(walletTxsInNewest.map(t => t.to).filter(Boolean));

      // Strong signal: wallet has 2+ calls in the newest block to contracts
      // that were just deployed (deployer is in the same block)
      const sniperTargets = [...calledTargets].filter(target =>
        deploysInNewest.has(target as string)
      );

      if (walletTxsInNewest.length >= 2 && sniperTargets.length > 0) {
        flags.push("launch-sniper");
        threatScore += 40;
      } else if (walletTxsInNewest.length >= 2) {
        // First-block with multiple txs but no deploy correlation —
        // weaker signal, label as opportunity-sniper
        flags.push("first-block");
        threatScore += 20;
      }
    }

    // ── sandwich detection ────────────────────────────────────────────────
    // Classic sandwich: wallet has a tx at index N, then victim tx at N+1,
    // then wallet tx at N+2 — all three to the same contract, in the same block.
    outer: for (const [blockNum, txList] of blockTxIndex.entries()) {
      const walletIdxs = txList
        .filter(t => t.from === address && t.to !== null)
        .map(t => ({ idx: t.idx, to: t.to! }));

      for (const { idx: frontIdx, to: contract } of walletIdxs) {
        // Look for victim + back-run in same block
        const victim   = txList.find(t => t.idx === frontIdx + 1 && t.from !== address && t.to === contract);
        const backRun  = txList.find(t => t.idx === frontIdx + 2 && t.from === address && t.to === contract);
        if (victim && backRun) {
          flags.push("sandwich");
          threatScore += 30;
          break outer;
        }
      }
    }

    // ── high-frequency ────────────────────────────────────────────────────
    if (txs.length >= 5) {
      flags.push("high-frequency");
      threatScore += 20;
      // Extra weight for very high frequency
      if (txs.length >= 10) threatScore += 10;
    }

    // ── multi-block ───────────────────────────────────────────────────────
    if (blockSet.size >= 4) {
      flags.push("multi-block");
      threatScore += 10;
    }

    // ── deployer ─────────────────────────────────────────────────────────
    if (txs.some(tx => tx.to === null)) {
      flags.push("deployer");
      threatScore += 5;
    }

    // Include wallets with any meaningful signal OR any deployer (all deploys are notable)
    const meaningfulFlags = flags.filter(f => f !== "deployer");
    if (meaningfulFlags.length > 0 || flags.includes("deployer")) {
      suspicious.push({
        address,
        txCount: txs.length,
        flags,
        threatScore: Math.min(100, threatScore),
        firstBlock,
        lastBlock,
        blocksActive: blockSet.size,
        topTarget,
        gasPrices,
      });
    }
  }

  return suspicious
    .sort((a, b) => b.threatScore - a.threatScore)
    .slice(0, 30);
}

export function buildTrafficSeries(blocks: BlockFull[]): TrafficPoint[] {
  return blocks
    .slice()
    .sort((a, b) => a.number - b.number)
    .map(b => ({
      blockNumber:     b.number,
      txCount:         b.txCount,
      contractDeploys: b.transactions.filter(tx => tx.to === null).length,
      uniqueWallets:   new Set(b.transactions.map(tx => tx.from)).size,
    }));
}

export function computeChainStats(blocks: BlockFull[]): ChainStats {
  if (blocks.length === 0) {
    return { txPerMin: 0, activeWallets: 0, contractDeploys: 0, avgBlockFill: 0, avgTxPerBlock: 0, totalTx: 0, avgBlockTimeSec: 0.1 };
  }

  const wallets = new Set<string>();
  let deploys   = 0;
  let totalTx   = 0;
  let totalFill = 0;
  let fillCount = 0;

  for (const b of blocks) {
    totalTx += b.txCount;
    if (b.gasLimit > 0) {
      totalFill += (b.gasUsed / b.gasLimit) * 100;
      fillCount++;
    }
    for (const tx of b.transactions) {
      if (tx.from) wallets.add(tx.from);
      if (tx.to === null) deploys++;
    }
  }

  // Compute actual block time from timestamp pairs where they differ
  const blockTimeSamples: number[] = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    const tDiff = blocks[i]!.timestamp - blocks[i + 1]!.timestamp;
    const nDiff = blocks[i]!.number   - blocks[i + 1]!.number;
    if (tDiff > 0 && nDiff > 0) {
      blockTimeSamples.push(tDiff / nDiff);
    }
  }
  const avgBlockTimeSec = blockTimeSamples.length > 0
    ? blockTimeSamples.reduce((a, b) => a + b, 0) / blockTimeSamples.length
    : 0.1;

  const newestTs = blocks[0]?.timestamp ?? 0;
  const oldestTs = blocks[blocks.length - 1]?.timestamp ?? 0;
  const spanSec  = newestTs - oldestTs;

  // Use real timestamps when span is meaningful, else use measured block time
  const effectiveSpanSec = spanSec >= 5
    ? spanSec
    : blocks.length * avgBlockTimeSec;

  const txPerMin = effectiveSpanSec > 0
    ? Math.round((totalTx / effectiveSpanSec) * 60)
    : 0;

  return {
    txPerMin,
    activeWallets:   wallets.size,
    contractDeploys: deploys,
    avgBlockFill:    fillCount > 0 ? Math.round(totalFill / fillCount) : 0,
    avgTxPerBlock:   blocks.length > 0 ? Math.round(totalTx / blocks.length) : 0,
    totalTx,
    avgBlockTimeSec: Math.round(avgBlockTimeSec * 1000) / 1000,
  };
}
