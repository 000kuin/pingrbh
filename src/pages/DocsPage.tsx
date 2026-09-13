import React, { useState } from "react";
import {
  IconActivity, IconShield, IconServer, IconGlobe,
  IconLayers, IconBarChart, IconZap, IconWifi, IconSearch,
} from "../components/Icons.tsx";

const sections = [
  {
    id: "overview",
    label: "Overview",
    Icon: IconActivity,
    title: "What is pingrbh?",
    subtitle: "Cloudflare Radar for Robinhood Chain",
    body: `pingrbh is a real-time network intelligence dashboard for Robinhood Chain — the same idea as Cloudflare Radar, but built for on-chain activity. Every tab maps to a real Cloudflare product: Radar tracks traffic, Firewall flags threats, Edge monitors new deployments, DNS routes you to the fastest node, Workers shows live contract execution, and Shield watches RPC uptime. All data is pulled directly from the public Robinhood Chain RPC — no off-chain indexers, no cached data, no guesses.`,
    features: [
      {
        name: "How data is fetched",
        Icon: IconServer,
        desc: "Everything reads from the public Robinhood Chain JSON-RPC endpoint. Two methods are used: eth_blockNumber (latency ping, fires every 3 seconds) and eth_getBlockByNumber with full transaction bodies (fetches 50 blocks every 4 seconds for chain analytics). No API key required. All calls happen from your browser directly to the RPC — no server, no proxy, no intermediary.",
      },
      {
        name: "Update frequency",
        Icon: IconActivity,
        desc: "The latency ping fires every 3 seconds. Full block data (used by Radar, Firewall, Edge, Workers) refreshes every 4 seconds with a 50-block fetch, accumulating up to 60 blocks in memory. At ~100ms blocks, this covers roughly 6 seconds of full transaction history. RPC endpoint health tests (DNS tab) run every 15 seconds.",
      },
      {
        name: "About Robinhood Chain",
        Icon: IconGlobe,
        desc: "Robinhood Chain is an Arbitrum Orbit Layer 2 (Chain ID 4663) that hosts tokenized stocks, ETFs, crypto, and other assets. It runs at approximately 100ms block times — far faster than mainnet Ethereum. This means chain data updates in near real time, but also means timestamps across consecutive blocks often share the same Unix second.",
      },
    ],
  },
  {
    id: "radar",
    label: "Radar",
    Icon: IconBarChart,
    title: "Radar — Chain traffic",
    subtitle: "Live transaction volume, active wallets, and block utilization",
    body: `Cloudflare Radar shows internet traffic trends in real time. pingrbh Radar does the same for Robinhood Chain — how many transactions per minute, how many unique wallets are active, how full blocks are getting, and how contract deployment activity compares to normal.`,
    features: [
      {
        name: "Tx / min",
        Icon: IconZap,
        desc: "Transactions per minute derived from the last 60 blocks in memory (~6s of chain history). Because Robinhood Chain blocks arrive at ~100ms each, Unix timestamps often repeat across multiple blocks. When the timestamp span is under 5 seconds, tx/min is estimated from block count × 0.1s per block. When real timestamp data is available (span ≥ 5s), the actual on-chain timestamps are used.",
      },
      {
        name: "Active wallets",
        Icon: IconActivity,
        desc: "Unique from-addresses across all transactions in the current block window. This is a lower bound — it only counts wallets that sent transactions, not those that received them. Resets each time the block window rolls forward.",
      },
      {
        name: "Transaction volume chart",
        Icon: IconBarChart,
        desc: "Area chart showing transactions per block over the block window. X-axis is block number (not time) — on a 100ms chain this is more accurate than time buckets, which would collapse many blocks into the same second. Hover any bar to see the exact count.",
      },
      {
        name: "Unique wallets per block",
        Icon: IconBarChart,
        desc: "Bar chart showing how many distinct from-addresses appeared in each block. A spike here usually means a coordinated event — a popular mint, a token launch, or a bot swarm hitting the chain simultaneously.",
      },
      {
        name: "Transaction heatmap",
        Icon: IconLayers,
        desc: "Each bar represents one block in the window. Bar height is proportional to that block's transaction count relative to the busiest block seen. Green = low volume, yellow = medium, red = high. Robinhood Chain (Arb Orbit) uses an enormous gas limit (2^50) that makes gas% meaningless — tx count is the real utilization signal.",
      },
    ],
  },
  {
    id: "firewall",
    label: "Firewall",
    Icon: IconShield,
    title: "Firewall — Threat intelligence",
    subtitle: "Flagged wallets, bot patterns, and sniper detection",
    body: `Cloudflare Firewall identifies and blocks malicious traffic before it reaches your server. pingrbh Firewall scans transaction patterns in the current block window and flags wallets exhibiting suspicious behavior — high frequency trading, bot patterns, first-block snipers, and contract deployers. This is purely on-chain signal — no off-chain databases, no blacklists, no ML models.`,
    features: [
      {
        name: "Launch Sniper (+40 threat)",
        Icon: IconZap,
        desc: "Confirmed first-block snipe: a wallet calls a contract in the exact same block where another wallet deployed that contract. This is the real definition of sniping — buying a token the moment its bytecode hits the chain, before it appears on any UI. Cross-referenced by matching deployer addresses and buyer targets within each block.",
      },
      {
        name: "Sandwich (+30 threat)",
        Icon: IconShield,
        desc: "MEV sandwich pattern: wallet has a transaction at index N, a victim transaction from a different wallet at N+1 targeting the same contract, and the wallet again at N+2. All three in the same block. This is on-chain front-running — the bot profits by bracketing the victim's trade.",
      },
      {
        name: "Bot Loop (+35 threat)",
        Icon: IconServer,
        desc: "Wallet calls the same contract with identical 4-byte function selectors AND all its gas prices are within 1% of each other. This combination — repeated exact function calls at programmatic gas prices — is the signature of an automated trading loop. Human traders vary their gas; bots use fixed prices from code.",
      },
      {
        name: "First Block (+20 threat)",
        Icon: IconZap,
        desc: "Wallet's first appearance in the window is the newest block, with 2+ transactions. Weaker than Launch Sniper (no deploy correlation confirmed), but consistent with opportunity sniping — a bot watching for events and firing immediately.",
      },
      {
        name: "Uniform Gas (+15 threat)",
        Icon: IconShield,
        desc: "All of the wallet's transactions use gas prices within 1% of each other. Humans set gas based on urgency — bots use hardcoded values from their config. When combined with other signals this is strong evidence of automation.",
      },
      {
        name: "High Frequency (+20 threat)",
        Icon: IconLayers,
        desc: "5 or more transactions in the current window (~5 seconds on RH Chain). Statistically unusual for a human trader. Very high frequency (10+) adds an additional 10 points to the threat score.",
      },
      {
        name: "Composite threat score",
        Icon: IconShield,
        desc: "Each wallet gets a 0–100 composite threat score from all its flags. Scores are additive — a wallet with launch-sniper (40) + bot-loop (35) + uniform-gas (15) scores 90/100. Wallets are sorted by threat score so the most dangerous appear first.",
      },
    ],
  },
  {
    id: "edge",
    label: "Edge",
    Icon: IconLayers,
    title: "Edge — Contract deployments",
    subtitle: "New bytecode hitting the chain in real time",
    body: `Cloudflare Edge runs serverless code at the network edge globally. On Robinhood Chain, the equivalent event is a contract deployment — new code being permanently written to the chain. The Edge tab shows every contract that was deployed in the current block window, with bytecode size, deployer address, and live age.`,
    features: [
      {
        name: "What counts as a deployment",
        Icon: IconLayers,
        desc: "Any transaction with to = null and non-empty input data is a contract creation. The input field contains the init bytecode that the EVM executes to produce the deployed contract. Minimal init code (2 bytes or less) is excluded.",
      },
      {
        name: "Bytecode size classification",
        Icon: IconServer,
        desc: "Size is computed from the transaction input field: (input.length - 2) / 2 bytes (subtracting the 0x prefix). Minimal = under 100 bytes (likely a proxy or stub). Small = 100 bytes – 3KB. Contract = 3–20KB (a typical ERC-20 or similar). Large = over 20KB (complex contract, DEX router, etc.).",
      },
      {
        name: "Live age",
        Icon: IconActivity,
        desc: "Age is derived from the on-chain block timestamp and updates every second in your browser. Because Robinhood Chain uses whole-second Unix timestamps, a block with timestamp T will show the same age for all ~10 blocks produced in that second.",
      },
      {
        name: "New indicator",
        Icon: IconZap,
        desc: "Contracts deployed within the last 10 seconds show an orange pulsing dot. This lets you spot brand-new deployments at a glance without reading the age column.",
      },
    ],
  },
  {
    id: "dns",
    label: "DNS",
    Icon: IconGlobe,
    title: "DNS — RPC Router",
    subtitle: "Find the fastest Robinhood Chain endpoint for your location",
    body: `Cloudflare DNS routes your traffic to the fastest available server. pingrbh DNS does the same for Robinhood Chain RPC endpoints — it tests every known public node from your browser and tells you which one responds fastest right now. Use this to configure your wallet with the lowest-latency endpoint.`,
    features: [
      {
        name: "How latency is measured",
        Icon: IconZap,
        desc: "Each endpoint is tested with an eth_blockNumber JSON-RPC call. The timer starts before the fetch and stops the moment the response body is parsed. This measures full round-trip time from your browser to the node. Tests run in parallel every 15 seconds.",
      },
      {
        name: "Status classification",
        Icon: IconShield,
        desc: "Online = responds in under 300ms. Slow = 300ms–1000ms. Down = no response, HTTP error, or over 1000ms. The active endpoint (currently routing all app data) is highlighted with an orange ACTIVE badge. If it degrades, the app automatically promotes the next fastest online endpoint.",
      },
      {
        name: "Block height verification",
        Icon: IconLayers,
        desc: "Each test also reads the current block number from that endpoint. If a node is returning a significantly lower block number than others, it may be behind (not fully synced). Compare block numbers across endpoints to verify you're connecting to a healthy, up-to-date node.",
      },
      {
        name: "Auto-failover",
        Icon: IconServer,
        desc: "pingrbh automatically routes all data fetches through the fastest available endpoint. Every 30 seconds, it tests all known public RPCs and promotes the lowest-latency one. If your current endpoint degrades or goes down, the next ping will silently use a faster node. The DNS tab shows which endpoint is ACTIVE and provides a copy button to use the same one in your wallet.",
      },
      {
        name: "Why this matters",
        Icon: IconGlobe,
        desc: "At 100ms block times, a 200ms RPC latency means your read of the current state is already 2 blocks behind. For time-sensitive operations like buying a new token launch, the difference between a 80ms endpoint and a 400ms endpoint can mean the difference between a successful snipe and a failed transaction.",
      },
    ],
  },
  {
    id: "workers",
    label: "Workers",
    Icon: IconZap,
    title: "Workers — Live invocations",
    subtitle: "See which contracts are executing right now",
    body: `Cloudflare Workers run serverless functions at the edge of the network — you can see exactly which functions are being invoked and how often. pingrbh Workers shows the same thing for Robinhood Chain: which smart contracts are being called right now, what functions are being executed, and who is calling them.`,
    features: [
      {
        name: "Hot contracts",
        Icon: IconZap,
        desc: "The left panel ranks contracts by call volume in the current block window. The number next to each address is the total transaction count. Below it: unique callers (distinct from-addresses) and distinct methods (4-byte function selectors). The bar shows relative volume compared to the top contract.",
      },
      {
        name: "Method decoding",
        Icon: IconSearch,
        desc: "Function names are decoded from the first 4 bytes of the transaction input (the function selector). Common selectors are matched against a built-in lookup table covering ERC-20 functions (transfer, approve), Uniswap swaps, liquidity operations, and Pons launch functions. Unknown selectors show the raw hex.",
      },
      {
        name: "Live invocations feed",
        Icon: IconActivity,
        desc: "The right panel is a scrollable real-time feed of every contract call in the block window. Each row shows the caller address (links to Blockscout), the contract being called (links to Blockscout), the decoded function name, and the block number. Click any link to investigate on the explorer.",
      },
      {
        name: "What counts as a contract call",
        Icon: IconServer,
        desc: "A transaction is classified as a contract call if it has a non-null to address AND non-empty input data (longer than 2 characters, i.e. more than just '0x'). Pure ETH transfers (to != null, input = '0x') are excluded. Contract creation transactions (to = null) are also excluded — those appear in the Edge tab instead.",
      },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    Icon: IconBarChart,
    title: "Analytics — Value flows",
    subtitle: "ETH movements and top senders in the current block window",
    body: `Cloudflare Analytics surfaces the most important traffic patterns — where requests are coming from, which ones carry the most weight. pingrbh Analytics does the same for Robinhood Chain: which wallets are moving the most ETH, what the largest individual transfers are, and where value is flowing right now.`,
    features: [
      {
        name: "What counts as a value transfer",
        Icon: IconZap,
        desc: "Only transactions with a non-zero tx.value field are shown. This includes ETH transfers, ETH-denominated contract calls (e.g. buying on a bonding curve), and contract deployments with ETH attached. Zero-value calls (most ERC-20 transfers, approvals, swaps) are excluded — those show in the Logs tab instead.",
      },
      {
        name: "Value feed",
        Icon: IconActivity,
        desc: "The main table shows all ETH-value transactions in the current 60-block window, sorted by value descending. Each row shows the sender, recipient, ETH amount, block number, and transaction type (transfer, contract call, or deploy). The largest move is highlighted in orange.",
      },
      {
        name: "Top senders",
        Icon: IconBarChart,
        desc: "The right panel ranks wallets by total ETH sent in the current window. Bar width reflects share of total volume. A wallet dominating this list is either a large trader, a protocol routing significant value, or a bot executing high-value transactions rapidly.",
      },
      {
        name: "ETH precision",
        Icon: IconServer,
        desc: "All values are converted from raw wei (tx.value hex field) with no rounding at the source. Display precision varies by magnitude: values ≥ 1 ETH show 4 decimal places, values ≥ 0.001 ETH show 6 decimal places, smaller values use scientific notation.",
      },
    ],
  },
  {
    id: "logs",
    label: "Logs",
    Icon: IconActivity,
    title: "Logs — Transaction stream",
    subtitle: "Every transaction in the current block window, filterable in real time",
    body: `Cloudflare Log Explorer shows every HTTP request hitting your infrastructure. pingrbh Logs is the same thing for Robinhood Chain — a live stream of every transaction: transfers, contract calls, and contract deployments. Filter by type or minimum ETH value to focus on what matters.`,
    features: [
      {
        name: "Transaction types",
        Icon: IconLayers,
        desc: "Every transaction is classified into one of three types. Transfer = non-null to address with empty input (pure ETH send). Contract = non-null to address with non-empty input (a function call). Deploy = null to address (a new contract being created). The type filter buttons at the top let you show only one type at a time.",
      },
      {
        name: "Min ETH filter",
        Icon: IconZap,
        desc: "The min ETH input filters to only transactions above a threshold. Useful for cutting through low-value noise and focusing on meaningful movements. Enter 0.1 to see only transactions moving ≥ 0.1 ETH. The filter applies on top of the type filter — both are active simultaneously.",
      },
      {
        name: "Method decoding",
        Icon: IconSearch,
        desc: "For contract calls, the Method column shows the decoded function name if the 4-byte selector is known (transfer, swap, deposit, etc.) or the raw hex selector if not. Deploys always show 'deploy'. Pure transfers show nothing in Method.",
      },
      {
        name: "Live age",
        Icon: IconActivity,
        desc: "The Age column updates every second. Because Robinhood Chain uses whole-second Unix timestamps, multiple blocks in the same second will show the same age. This is correct — the chain produces ~10 blocks per timestamp second.",
      },
      {
        name: "Volume cap",
        Icon: IconServer,
        desc: "The table shows up to 200 entries at a time. If filters produce more than 200 results, a note at the bottom indicates the total. Use the type or min ETH filters to narrow the view.",
      },
    ],
  },
  {
    id: "network",
    label: "Network",
    Icon: IconGlobe,
    title: "Network — Activity map",
    subtitle: "When is Robinhood Chain most active?",
    body: `Cloudflare Network Analytics shows traffic patterns over time — peak hours, quiet periods, geographic distribution. pingrbh Network shows the equivalent for Robinhood Chain: which UTC hours and days of the week see the most transaction activity, derived from actual on-chain block timestamps.`,
    features: [
      {
        name: "Hourly activity chart",
        Icon: IconBarChart,
        desc: "24 bars, one per UTC hour. Bar height shows the average transactions per block during that hour, computed from blocks seen in the current session. The orange bar is the peak hour. The green bar is the current UTC hour. Grey bars have no data yet for that hour in this session.",
      },
      {
        name: "Day of week chart",
        Icon: IconBarChart,
        desc: "7 bars showing total transaction volume by UTC day of week. The current day is highlighted in orange. Because the block window is only ~6 seconds of chain data, most bars will only represent one or two days until the session has been running long enough to observe multiple days.",
      },
      {
        name: "Data accumulates over your session",
        Icon: IconActivity,
        desc: "The Network tab is not useful immediately after page load — it only shows data for the UTC hours and days that have appeared in blocks while the tab has been open. The longer the session runs, the more complete the picture. Peak and quiet hours show '—' until enough data is available.",
      },
      {
        name: "All timestamps are on-chain",
        Icon: IconServer,
        desc: "Every data point comes from the timestamp field of real block headers — not client-side estimation. Robinhood Chain block timestamps are Unix seconds set by the sequencer. Multiple consecutive blocks often share the same timestamp second, which is why the chart shows averages per block rather than totals.",
      },
    ],
  },
  {
    id: "shield",
    label: "Shield",
    Icon: IconShield,
    title: "Shield — RPC uptime",
    subtitle: "Live latency monitoring and node health for Robinhood Chain",
    body: `Cloudflare Shield protects services from downtime. pingrbh Shield monitors the Robinhood Chain RPC endpoint in real time — measuring response latency, tracking uptime over your session, and surfacing block production health. It answers the most important question before any transaction: is the chain responding right now?`,
    features: [
      {
        name: "Latency measurement",
        Icon: IconZap,
        desc: "The latency counter shows the round-trip time for a single eth_blockNumber call to the public Robinhood Chain RPC. Only this one call is timed — a separate block fetch (not counted) retrieves the block number and timestamp. This gives the cleanest possible measure of raw RPC responsiveness.",
      },
      {
        name: "Status levels",
        Icon: IconShield,
        desc: "Fast = under 150ms. Normal = 150–499ms. Slow = 500–1499ms. Down = 1500ms or no response. These thresholds are used consistently across all pingrbh UI: the hero verdict, the uptime bar history colors, the Shield tab threshold display, and the DNS tab status badges all use the same boundaries.",
      },
      {
        name: "Uptime %",
        Icon: IconActivity,
        desc: "Uptime is calculated as the percentage of the last 100 pings where the RPC responded in under 1500ms. A ping returning any response under that threshold counts as a success — including slow responses. Only genuine failures (timeout, HTTP error, or rate-limit response) count against uptime. Because history persists in localStorage, this reflects your real uptime experience over the last 24 hours — not just since you opened the tab.",
      },
      {
        name: "Latency history chart",
        Icon: IconBarChart,
        desc: "The chart shows up to 200 ping readings (rolling). The dashed reference line is the 5-minute average. Each point is one eth_blockNumber round-trip. Spikes usually correspond to brief RPC congestion or network jitter — not chain issues. History persists across page reloads (stored in localStorage for up to 24 hours) so the chart is meaningful from the first second of every visit.",
      },
      {
        name: "Ping history bar",
        Icon: IconActivity,
        desc: "The 60-bar strip in the top-right shows the most recent 60 pings as height bars. Bar height is proportional to latency (capped at 400ms for display). Green = fast, yellow = slow, red = down threshold. The label below shows the real elapsed time of the window — '45s ago' early in your session, '3 min ago' once 60 pings have accumulated.",
      },
      {
        name: "Block stream",
        Icon: IconLayers,
        desc: "The block feed in the bottom-right shows the last 20 blocks as they arrive. Each row shows the block number (links to Blockscout), a gas utilization bar, and transaction count. A new block arriving confirms the chain is producing blocks — if the stream stalls, the chain may be halted even if the RPC responds to eth_blockNumber calls.",
      },
    ],
  },
  {
    id: "ping-token",
    label: "$PING token",
    Icon: IconZap,
    title: "$PING — The on-chain heartbeat token",
    subtitle: "Infrastructure token for Robinhood Chain, paired against NET",
    body: `$PING is the token behind pingrbh. It trades against NET (the Cloudflare stock token on Robinhood Chain) on Pons — the pair that makes itself. Cloudflare keeps the internet alive. $PING tells you if the chain is. Holders earn NET payouts. Fair launch on Pons, no presale, no insiders.`,
    features: [
      {
        name: "The thesis",
        Icon: IconZap,
        desc: "$PING is to Robinhood Chain what NET is to the internet. Both are infrastructure plays. Cloudflare routes 20% of the internet — NET tracks that. pingrbh monitors Robinhood Chain — $PING tracks that. The pair is not random: the company that keeps the internet up pays the token that monitors the chain.",
      },
      {
        name: "NET payouts",
        Icon: IconActivity,
        desc: "Holders of $PING receive NET (Cloudflare stock token) as a payout. This creates a direct link between the narrative and the token mechanics — infrastructure pays infrastructure.",
      },
      {
        name: "Fair launch on Pons",
        Icon: IconShield,
        desc: "$PING launches on Pons — the token launchpad on Robinhood Chain. No presale, no VC allocation, no team tokens. Launched with a bonding curve that every buyer enters at the same terms. The only edge is being early.",
      },
      {
        name: "Pons launchpad",
        Icon: IconServer,
        desc: "Pons is a non-custodial token launch and trading platform on Robinhood Chain (Chain ID 4663). Every token trades against WETH in a Uniswap V3 pool from the moment it launches. Liquidity is locked permanently in the Pons locker contract. Your wallet submits every transaction directly — Pons never holds your funds.",
      },
    ],
  },
];

export function DocsPage() {
  const [active, setActive] = useState("overview");
  const current = sections.find(s => s.id === active) ?? sections[0]!;

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "220px 1fr" }}>

      {/* Sidebar */}
      <aside style={{
        borderRight: "1px solid var(--border)",
        padding: "40px 0",
        position: "sticky", top: 56, height: "calc(100vh - 56px)",
        overflowY: "auto",
        background: "var(--bg)",
      }}>
        <div style={{ padding: "0 20px", marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            pingrbh
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>
            Documentation
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1, padding: "0 10px" }}>
          {sections.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "9px 12px", borderRadius: "var(--r-sm)",
                background: active === id ? "var(--orange-dim)" : "transparent",
                border: `1px solid ${active === id ? "var(--orange-border)" : "transparent"}`,
                color: active === id ? "var(--orange)" : "var(--text-3)",
                fontSize: 12, fontWeight: active === id ? 600 : 400,
                cursor: "pointer", textAlign: "left",
                transition: "all 0.12s",
                width: "100%",
              }}
              onMouseEnter={e => { if (active !== id) e.currentTarget.style.color = "var(--text-2)"; }}
              onMouseLeave={e => { if (active !== id) e.currentTarget.style.color = "var(--text-3)"; }}
            >
              <Icon size={12} color="currentColor" />
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* Content */}
      <main style={{ padding: "48px 64px 80px", maxWidth: 780 }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 16 }}>
          {current.label}
        </div>

        <h1 style={{
          fontSize: "clamp(24px, 3.5vw, 38px)",
          fontWeight: 800, letterSpacing: "-0.04em",
          marginBottom: 8, lineHeight: 1.1, color: "var(--text)",
        }}>
          {current.title}
        </h1>
        <div style={{ fontSize: 15, color: "var(--text-2)", marginBottom: 32, lineHeight: 1.5 }}>
          {current.subtitle}
        </div>

        {/* Body */}
        <div style={{
          padding: "16px 20px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r)",
          fontSize: 14, color: "var(--text-2)", lineHeight: 1.75,
          marginBottom: 40,
        }}>
          {current.body}
        </div>

        {/* Feature cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {current.features.map(({ name, Icon, desc }) => (
            <div
              key={name}
              style={{
                padding: "20px 24px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-lg)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "var(--r-sm)",
                  background: "var(--orange-dim)", border: "1px solid var(--orange-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon size={13} color="var(--orange)" />
                </div>
                <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em", color: "var(--text)" }}>
                  {name}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{
          marginTop: 48,
          display: "flex", justifyContent: "space-between",
          borderTop: "1px solid var(--border)", paddingTop: 24,
        }}>
          {(() => {
            const idx = sections.findIndex(s => s.id === active);
            const prev = sections[idx - 1];
            const next = sections[idx + 1];
            return (
              <>
                {prev ? (
                  <button
                    onClick={() => setActive(prev.id)}
                    style={{
                      fontSize: 12, fontWeight: 600, color: "var(--text-3)",
                      background: "transparent", border: "none", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"}
                  >
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>← Previous</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{prev.label}</span>
                  </button>
                ) : <span />}
                {next ? (
                  <button
                    onClick={() => setActive(next.id)}
                    style={{
                      fontSize: 12, fontWeight: 600, color: "var(--text-3)",
                      background: "transparent", border: "none", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "var(--text-3)"}
                  >
                    <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Next →</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{next.label}</span>
                  </button>
                ) : <span />}
              </>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
