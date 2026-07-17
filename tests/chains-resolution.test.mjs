import assert from "node:assert/strict";
import test from "node:test";

import {
  defaultProductChain,
  productChains,
  resolveProductChain,
} from "../lib/chains.ts";

test("chain resolution defaults to the Celo product configuration", () => {
  assert.equal(defaultProductChain, "celo");
  assert.equal(resolveProductChain(), productChains.celo);
  assert.equal(resolveProductChain(null), productChains.celo);
  assert.equal(resolveProductChain("unknown"), productChains.celo);
});

test("chain resolution selects Mantle only for its supported identifier", () => {
  assert.equal(resolveProductChain("mantle"), productChains.mantle);
  assert.equal(resolveProductChain("celo"), productChains.celo);
});
