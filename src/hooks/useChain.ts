import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchFullBlocks,
  extractDeploys,
  detectSuspiciousWallets,
  buildTrafficSeries,
  computeChainStats,
  type BlockFull,
  type ContractDeploy,
  type SuspiciousWallet,
  type TrafficPoint,
  type ChainStats,
} from "../lib/chain.ts";

// Poll every 4s
const POLL_MS      = 4000;
// Keep 60 blocks in memory — ~6s of chain history at 100ms/block
const BLOCK_WINDOW = 60;
// Robinhood Chain produces ~100ms blocks → ~40 blocks per 4s poll interval.
// Fetching 50 per poll ensures we never miss blocks between polls and keep
// the window fully saturated with fresh data.
const FETCH_COUNT  = 50;
// Initial load: same size as regular poll (window is pre-filled immediately)
const INITIAL_FETCH = 60;

export type { BlockFull, ContractDeploy, SuspiciousWallet, TrafficPoint, ChainStats };

export interface ChainState {
  blocks:    BlockFull[];
  deploys:   ContractDeploy[];
  suspicious: SuspiciousWallet[];
  traffic:   TrafficPoint[];
  stats:     ChainStats;
  loading:   boolean;
  error:     string | null;
  lastBlock: number;
}

const EMPTY_STATS: ChainStats = { txPerMin: 0, activeWallets: 0, contractDeploys: 0, avgBlockFill: 0, avgTxPerBlock: 0, totalTx: 0, avgBlockTimeSec: 0.1 };

export function useChain(): ChainState {
  const [state, setState] = useState<ChainState>({
    blocks: [], deploys: [], suspicious: [], traffic: [],
    stats: EMPTY_STATS, loading: true, error: null, lastBlock: 0,
  });

  const blocksRef    = useRef<BlockFull[]>([]);
  const lastBlockRef = useRef(0);
  const seenHashes   = useRef(new Set<number>()); // track block numbers we have

  const processBlocks = useCallback((fresh: BlockFull[]) => {
    // Merge new blocks into rolling window, dedup by block number
    for (const b of fresh) {
      if (!seenHashes.current.has(b.number)) {
        seenHashes.current.add(b.number);
        blocksRef.current.unshift(b); // newest first
      }
    }

    // Sort newest first, cap window
    blocksRef.current.sort((a, b) => b.number - a.number);
    if (blocksRef.current.length > BLOCK_WINDOW) {
      // Remove old blocks from seenHashes to avoid unbounded growth
      const removed = blocksRef.current.splice(BLOCK_WINDOW);
      for (const b of removed) seenHashes.current.delete(b.number);
    }

    const blocks    = [...blocksRef.current];
    const newLatest = blocks[0]?.number ?? 0;

    // If no new blocks but we have data, still recompute + flush so UI isn't frozen
    const hasNewBlocks = newLatest > lastBlockRef.current || lastBlockRef.current === 0;
    if (hasNewBlocks) lastBlockRef.current = newLatest;

    const deploys    = extractDeploys(blocks);
    const suspicious = detectSuspiciousWallets(blocks);
    const traffic    = buildTrafficSeries(blocks);
    const stats      = computeChainStats(blocks);

    return { blocks, deploys, suspicious, traffic, stats, lastBlock: newLatest };
  }, []);

  const poll = useCallback(async () => {
    try {
      const fresh = await fetchFullBlocks(FETCH_COUNT);
      if (fresh.length === 0) return;

      const result = processBlocks(fresh);
      if (!result) return;

      setState(prev => ({
        ...prev,
        ...result,
        loading: false,
        error: null,
      }));
    } catch (e) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : "Failed to fetch chain data",
      }));
    }
  }, [processBlocks]);

  // Initial load: warm up with more blocks
  useEffect(() => {
    (async () => {
      try {
        const fresh = await fetchFullBlocks(INITIAL_FETCH);
        const result = processBlocks(fresh);
        if (result) {
          setState(prev => ({ ...prev, ...result, loading: false, error: null }));
        }
      } catch (e) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: e instanceof Error ? e.message : "Initial fetch failed",
        }));
      }
    })();
  }, [processBlocks]);

  // Regular polling
  useEffect(() => {
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  return state;
}
