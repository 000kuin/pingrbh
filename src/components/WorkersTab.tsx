import React, { useMemo } from "react";
import type { BlockFull } from "../lib/chain.ts";
import { IconExternalLink } from "./Icons.tsx";

interface Props {
  blocks: BlockFull[];
  color: string;
  isMobile?: boolean;
}

interface ContractStat {
  address:    string;
  calls:      number;
  callers:    number;
  methods:    Map<string, number>;  // selector → count
  lastBlock:  number;
}

interface LiveCall {
  hash:      string;
  from:      string;
  to:        string;
  selector:  string;       // 4-byte method selector
  blockNumber: number;
  gasLimit:  number;
}

// Known 4-byte selectors — comprehensive EVM lookup table
const KNOWN_SELECTORS: Record<string, string> = {
  // ERC-20
  "0xa9059cbb": "transfer()",
  "0x23b872dd": "transferFrom()",
  "0x095ea7b3": "approve()",
  "0x70a08231": "balanceOf()",
  "0x18160ddd": "totalSupply()",
  "0x06fdde03": "name()",
  "0x95d89b41": "symbol()",
  "0x313ce567": "decimals()",
  "0xdd62ed3e": "allowance()",
  // ERC-721
  "0x42842e0e": "safeTransferFrom()",
  "0xb88d4fde": "safeTransferFrom(data)",
  "0x6352211e": "ownerOf()",
  "0x081812fc": "getApproved()",
  "0xa22cb465": "setApprovalForAll()",
  "0xe985e9c5": "isApprovedForAll()",
  "0x6a627842": "mint(address)",
  "0x1249c58b": "mint()",
  "0x40c10f19": "mint(address,uint256)",
  "0x42966c68": "burn(uint256)",
  // ETH / WETH
  "0xd0e30db0": "deposit()",
  "0x2e1a7d4d": "withdraw()",
  // Uniswap V2
  "0x38ed1739": "swapExactTokensForTokens()",
  "0x7ff36ab5": "swapExactETHForTokens()",
  "0x791ac947": "swapExactTokensForETH()",
  "0xfb3bdb41": "swapETHForExactTokens()",
  "0x5c11d795": "swapExactTokensForTokensSupportingFeeOnTransferTokens()",
  "0xb6f9de95": "swapExactETHForTokensSupportingFeeOnTransferTokens()",
  "0xe8e33700": "addLiquidity()",
  "0xf305d719": "addLiquidityETH()",
  "0xbaa2abde": "removeLiquidity()",
  "0x02751cec": "removeLiquidityETH()",
  "0x0902f1ac": "getReserves()",
  "0x89afcb44": "burn(address)",
  "0x6d9a640a": "skim(address)",
  // Uniswap V3
  "0x128acb08": "swap()",
  "0x5ae401dc": "multicall()",
  "0x04e45aaf": "exactInputSingle()",
  "0xb858183f": "exactInput()",
  "0xdb3e2198": "exactOutputSingle()",
  "0x09b81346": "exactOutput()",
  "0x414bf389": "exactInputSingle(V2)",
  "0xc04b8d59": "exactInput(V2)",
  "0x2f80bb1d": "exactOutputSingle(V2)",
  "0xf28c0498": "exactOutput(V2)",
  "0x88316456": "mint(V3)",
  "0x49404b7c": "burn(V3)",
  "0xfc6f7865": "collect()",
  "0x13ead562": "createAndInitializePoolIfNecessary()",
  "0x1a686502": "slot0()",
  // Uniswap V4
  "0xf3a901f0": "swap(PoolKey,SwapParams,bytes)",
  "0x3593564c": "execute()",
  // Common DeFi
  "0x4e71d92d": "claim()",
  "0x379607f5": "claim(uint256)",
  "0xe9fad8ee": "exit()",
  "0xa694fc3a": "stake(uint256)",
  "0x2e17de78": "unstake(uint256)",
  "0x853828b6": "withdrawAll()",
  "0x51cff8d9": "withdraw(address)",
  "0x3ccfd60b": "withdraw()",
  "0xb6b55f25": "deposit(uint256)",
  "0x6e553f65": "deposit(uint256,address)",
  "0x9e5d4c49": "depositFor(address,uint256)",
  "0x2d2da806": "depositFor(address)",
  // OpenZeppelin / admin
  "0x8da5cb5b": "owner()",
  "0x715018a6": "renounceOwnership()",
  "0xf2fde38b": "transferOwnership(address)",
  "0x5c975abb": "paused()",
  "0x8456cb59": "pause()",
  "0x3f4ba83a": "unpause()",
  "0x8f4ffcb1": "receiveApproval()",
  // Pons-specific
  "0xf35abbcf": "launchToken()",
  "0xf85f8e41": "launchAndBuy()",
  "0xa72101af": "launchToken(params,id,pair,exemptions)",
  "0xd6a0eef5": "launchTokenFor()",
  "0x3cf28b5a": "getLaunchedToken()",
  "0x6c47e7a2": "graduationStatus()",
  // Multicall
  "0xac9650d8": "multicall(bytes[])",
  "0x1f0464d1": "multicall(uint256,bytes[])",
  // Proxy patterns
  "0x3659cfe6": "upgradeTo(address)",
  "0x4f1ef286": "upgradeToAndCall(address,bytes)",
  "0x8f283970": "changeAdmin(address)",
  "0xf851a440": "admin()",
  "0x5c60da1b": "implementation()",
};

function shortSelector(input: string): string {
  if (!input || input.length < 10) return "0x";
  return input.slice(0, 10);
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 8)}…${addr.slice(-4)}`;
}

function labelSelector(sel: string): string {
  return KNOWN_SELECTORS[sel] ?? sel;
}

export function WorkersTab({ blocks, color, isMobile }: Props) {
  // Compute contract stats from block data
  const { contractStats, liveCalls, totalCallsAll } = useMemo(() => {
    const statsMap = new Map<string, ContractStat>();
    const calls: LiveCall[] = [];

    for (const b of blocks) {
      for (const tx of b.transactions) {
        // Only contract calls (to !== null, has input beyond 0x)
        if (!tx.to || !tx.input || tx.input.length <= 2) continue;
        const sel = shortSelector(tx.input);
        const to = tx.to.toLowerCase();
        const from = tx.from?.toLowerCase() ?? "";

        if (!statsMap.has(to)) {
          statsMap.set(to, {
            address:   to,
            calls:     0,
            callers:   0,
            methods:   new Map(),
            lastBlock: b.number,
          });
        }

        const stat = statsMap.get(to)!;
        stat.calls++;
        stat.methods.set(sel, (stat.methods.get(sel) ?? 0) + 1);
        if (b.number > stat.lastBlock) stat.lastBlock = b.number;

        calls.push({
          hash:        tx.hash,
          from,
          to,
          selector:    sel,
          blockNumber: b.number,
          gasLimit:    parseInt(tx.gas, 16),
        });
      }
    }

    // Compute unique callers per contract
    for (const [addr, stat] of statsMap) {
      const callerSet = new Set(
        calls.filter(c => c.to === addr).map(c => c.from)
      );
      stat.callers = callerSet.size;
    }

    // Compute totalCalls from ALL contracts BEFORE slicing to top 20
    const allStats = Array.from(statsMap.values());
    const allCallsTotal = allStats.reduce((s, c) => s + c.calls, 0);
    const sortedStats = allStats.sort((a, b) => b.calls - a.calls).slice(0, 20);

    const recentCalls = calls
      .sort((a, b) => b.blockNumber - a.blockNumber)
      .slice(0, 40);

    return { contractStats: sortedStats, liveCalls: recentCalls, totalCallsAll: allCallsTotal };
  }, [blocks]);

  const totalCalls      = totalCallsAll;
  const uniqueContracts = contractStats.length;
  const topContract  = contractStats[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 1, background: "var(--border)",
        border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden",
      }}>
        {[
          { label: "Contract calls",     value: totalCalls.toLocaleString(),       accent: true },
          { label: "Active contracts",   value: uniqueContracts.toString(),         accent: false },
          { label: "Hottest contract",   value: topContract ? `${topContract.calls} calls` : "—", accent: false },
          { label: "Block window",       value: `${blocks.length} blocks`,          accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ padding: "18px 22px", background: "var(--surface)" }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 800, color: accent ? "var(--orange)" : "var(--text)", letterSpacing: "-0.04em" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

        {/* Hot contracts */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Hot Contracts</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
              Most-invoked contracts in current block window
            </div>
          </div>

          {contractStats.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 11, fontFamily: "var(--mono)" }}>
              Loading contract activity…
            </div>
          ) : (
            <div>
              {contractStats.slice(0, 10).map((c, i) => {
                const pct = topContract ? (c.calls / topContract.calls) * 100 : 0;
                const topMethod = Array.from(c.methods.entries()).sort((a, b) => b[1] - a[1])[0];
                return (
                  <div
                    key={c.address}
                    style={{
                      padding: "11px 20px",
                      borderBottom: i < 9 ? "1px solid var(--border)" : "none",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700,
                          color: i === 0 ? "var(--orange)" : "var(--text-3)",
                          minWidth: 16,
                        }}>
                          #{i + 1}
                        </span>
                        <a
                          href={`https://robinhoodchain.blockscout.com/address/${c.address}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--orange)" }}
                        >
                          {shortAddr(c.address)}
                        </a>
                        {topMethod && (
                          <span style={{
                            fontSize: 9, fontWeight: 600, color: "var(--text-3)",
                            background: "var(--bg-3)", border: "1px solid var(--border)",
                            borderRadius: "var(--r-sm)", padding: "1px 6px",
                            fontFamily: "var(--mono)",
                          }}>
                            {labelSelector(topMethod[0])}
                          </span>
                        )}
                      </div>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 800, color: i === 0 ? "var(--orange)" : "var(--text-2)" }}>
                        {c.calls}
                      </span>
                    </div>
                    {/* Call volume bar */}
                    <div style={{ height: 2, background: "var(--bg-3)", borderRadius: 99 }}>
                      <div style={{
                        height: "100%", width: `${pct}%`,
                        background: i === 0 ? "var(--orange)" : color,
                        borderRadius: 99, opacity: i === 0 ? 1 : 0.5,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <span style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                        {c.callers} caller{c.callers !== 1 ? "s" : ""}
                      </span>
                      <span style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "var(--mono)" }}>
                        {c.methods.size} method{c.methods.size !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live call feed */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Live Invocations</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                Contract calls executing on chain right now
              </div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase",
              color: "var(--orange)", background: "var(--orange-dim)",
              border: "1px solid var(--orange-border)",
              borderRadius: "var(--r-sm)", padding: "3px 8px",
            }}>
              Live
            </span>
          </div>

          {liveCalls.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 11, fontFamily: "var(--mono)" }}>
              Loading invocations…
            </div>
          ) : (
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {liveCalls.map((call, i) => {
                const isKnown = !!KNOWN_SELECTORS[call.selector];
                return (
                  <div
                    key={call.hash}
                    style={{
                      display: "grid", gridTemplateColumns: "90px 90px 1fr 60px",
                      padding: "8px 20px",
                      borderBottom: i < liveCalls.length - 1 ? "1px solid var(--border)" : "none",
                      alignItems: "center", gap: 10,
                      animation: i === 0 ? "fade-up 0.25s ease" : undefined,
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--bg-2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                  >
                    <a
                      href={`https://robinhoodchain.blockscout.com/address/${call.from}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--text-3)" }}
                    >
                      {shortAddr(call.from)}
                    </a>
                    <a
                      href={`https://robinhoodchain.blockscout.com/address/${call.to}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, color: "var(--orange)" }}
                    >
                      {shortAddr(call.to)}
                    </a>
                    <span style={{
                      fontSize: 9, fontWeight: isKnown ? 700 : 400,
                      color: isKnown ? "var(--text-2)" : "var(--text-3)",
                      fontFamily: "var(--mono)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {labelSelector(call.selector)}
                    </span>
                    <a
                      href={`https://robinhoodchain.blockscout.com/tx/${call.hash}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 9, color: "var(--text-3)", fontFamily: "var(--mono)", textAlign: "right", display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}
                    >
                      #{call.blockNumber.toLocaleString()}
                      <IconExternalLink size={9} color="currentColor" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--text-2)" }}>Cloudflare Workers parallel — </strong>
        Cloudflare Workers execute serverless functions at the network edge. On Robinhood Chain, every contract
        call is code executing at the edge of the chain. This tab shows which contracts are running right now,
        how often, and what functions are being invoked. Method names decoded from known 4-byte selectors.
        All data from eth_getBlockByNumber with full transaction bodies.
      </div>
    </div>
  );
}
