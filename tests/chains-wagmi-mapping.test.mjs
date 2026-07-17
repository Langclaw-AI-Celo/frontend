import assert from "node:assert/strict";
import test from "node:test";

import { productChains, toWagmiChain } from "../lib/chains.ts";

test("Celo Wagmi mapping preserves the configured RPC and explorer", () => {
  const mapped = toWagmiChain(productChains.celo);

  assert.equal(mapped.id, 42220);
  assert.deepEqual(mapped.rpcUrls.default.http, ["https://forno.celo.org"]);
  assert.equal(mapped.blockExplorers.default.url, "https://celoscan.io");
  assert.equal(mapped.nativeCurrency.symbol, "CELO");
});

test("custom Wagmi mapping exposes complete Mantle mainnet metadata", () => {
  const mapped = toWagmiChain(productChains.mantle);

  assert.equal(mapped.id, 5000);
  assert.equal(mapped.name, "Mantle Mainnet");
  assert.deepEqual(mapped.rpcUrls.default.http, ["https://rpc.mantle.xyz"]);
  assert.equal(mapped.blockExplorers.default.url, "https://explorer.mantle.xyz");
  assert.deepEqual(mapped.nativeCurrency, {
    decimals: 18,
    name: "Mantle",
    symbol: "MNT",
  });
});
