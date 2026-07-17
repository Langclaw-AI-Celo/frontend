import assert from "node:assert/strict";
import test from "node:test";

import { buildAlphaWatchlistItem } from "../lib/alpha-watchlist.ts";

function makePayload(overrides = {}) {
  return {
    answer: "Wallet activity increased.",
    bullets: [],
    caveat: "Confirm liquidity before trading.",
    generatedAt: "2026-07-17T10:00:00.000Z",
    plan: {
      chain: "celo",
      commands: [{ domain: "smart_money" }],
      intent: "track accumulation",
      query: "CELO smart money",
      tokenAddress: "0x1111111111111111111111111111111111111111",
    },
    recommendation: "Monitor the next proof run.",
    title: "CELO accumulation signal",
    tools: [
      { status: "success" },
      { status: "success" },
      { status: "failed" },
    ],
    ...overrides,
  };
}

test("watchlist identities prefer the strongest on-chain proof anchor", () => {
  const item = buildAlphaWatchlistItem(
    makePayload({
      proof: {
        chain: {
          agentId: "42",
          decisionHash: "0xdecision",
          decisionId: "7",
          signalType: "accumulation",
          txHash: "0xtx",
        },
        storage: { evidenceUri: "ipfs://evidence" },
      },
    }),
  );

  assert.equal(item.id, "proof:0xtx");
  assert.equal(item.proofTx, "0xtx");
  assert.equal(item.decisionId, "7");
  assert.equal(item.evidenceUri, "ipfs://evidence");
  assert.equal(item.sourceCount, 2);
  assert.equal(item.gapCount, 1);
  assert.equal(item.signalType, "accumulation");
});

test("unanchored watchlist identities remain deterministic", () => {
  const payload = makePayload();
  const first = buildAlphaWatchlistItem(payload);
  const second = buildAlphaWatchlistItem(payload);

  assert.match(first.id, /^signal:[0-9a-f]+$/);
  assert.equal(first.id, second.id);
  assert.equal(first.subject, payload.plan.tokenAddress);
  assert.equal(first.signalType, "smart-money");
});
