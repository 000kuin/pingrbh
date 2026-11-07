import assert from "node:assert/strict";
import { after, test } from "node:test";
import { testRpc } from "./rpcs.ts";

const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

async function response(payload, status = 200) {
  globalThis.fetch = async () => new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
  return testRpc("https://rpc.invalid");
}

test("reports a valid block height, including genesis", async () => {
  for (const [quantity, expected] of [["0x1237", 4663], ["0x0", 0]]) {
    const result = await response({ jsonrpc: "2.0", id: 1, result: quantity });
    assert.equal(result.success, true);
    assert.equal(result.blockNumber, expected);
  }
});

test("rejects HTTP failure even when its body contains a block height", async () => {
  const result = await response({ jsonrpc: "2.0", id: 1, result: "0x1237" }, 429);
  assert.equal(result.success, false);
  assert.equal(result.error, "HTTP 429");
});

for (const [label, payload] of [
  ["missing result", {}],
  ["null result", { result: null }],
  ["numeric result", { result: 16 }],
  ["non-hex result", { result: "not-a-block" }],
  ["partial hex result", { result: "0x1237garbage" }],
  ["unsafe block integer", { result: "0x20000000000001" }],
]) {
  test(`rejects ${label}`, async () => {
    const result = await response({ jsonrpc: "2.0", id: 1, ...payload });
    assert.equal(result.success, false);
    assert.equal(result.blockNumber, 0);
    assert.ok(result.error);
  });
}

test("preserves the provider JSON-RPC error", async () => {
  const result = await response({
    jsonrpc: "2.0", id: 1,
    error: { code: -32005, message: "rate limit exceeded" },
  });
  assert.equal(result.success, false);
  assert.equal(result.error, "rate limit exceeded");
});

test("reports a transport failure", async () => {
  globalThis.fetch = async () => { throw new Error("connection closed"); };
  const result = await testRpc("https://rpc.invalid");
  assert.equal(result.success, false);
  assert.equal(result.error, "connection closed");
});
