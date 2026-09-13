/**
 * activeRpc — shared mutable singleton for the current best RPC URL.
 *
 * Both rpc.ts and chain.ts import getRpcUrl() instead of hardcoding a URL.
 * useRpcs calls setActiveRpc() whenever it finds a faster / more reliable endpoint.
 *
 * Listeners (React hooks) can subscribe to URL changes so the UI can reflect
 * which endpoint is currently in use.
 */

const PRIMARY = "https://rpc.mainnet.chain.robinhood.com";

let activeUrl = PRIMARY;
const listeners = new Set<(url: string) => void>();

export function getRpcUrl(): string {
  return activeUrl;
}

export function setActiveRpc(url: string): void {
  if (url === activeUrl) return;
  activeUrl = url;
  for (const fn of listeners) fn(url);
}

export function onActiveRpcChange(fn: (url: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export { PRIMARY as PRIMARY_RPC };
