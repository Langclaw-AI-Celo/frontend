import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { keccak256 } from "viem";

import { createDepositClaim } from "../lib/deposit-claim.ts";
import { verifyUsageDeposit } from "../lib/langclaw-api/usage.ts";

test("deposit claims keep the preimage private from the public reference", () => {
  const bytes = Uint8Array.from({ length: 32 }, (_, index) => index);
  const claim = createDepositClaim(bytes);

  assert.notEqual(claim.reference, claim.claimSecret);
  assert.equal(claim.reference, keccak256(claim.claimSecret));
});

test("deposit claims use secure random bytes when none are supplied", () => {
  const first = createDepositClaim();
  const second = createDepositClaim();

  assert.match(first.claimSecret, /^0x[0-9a-f]{64}$/);
  assert.equal(first.reference, keccak256(first.claimSecret));
  assert.notEqual(first.claimSecret, second.claimSecret);
});

test("deposit claims reject byte arrays with the wrong length", () => {
  for (const length of [0, 31, 33]) {
    assert.throws(
      () => createDepositClaim(new Uint8Array(length)),
      /exactly 32 random bytes/,
    );
  }
});

test("deposit verification serializes the private claim for the backend", async (t) => {
  const originalFetch = globalThis.fetch;
  const wallet = "0x2222222222222222222222222222222222222222";
  const txHash = `0x${"1".repeat(64)}`;
  const claim = createDepositClaim(
    Uint8Array.from({ length: 32 }, (_, index) => index + 1),
  );
  let requestBody;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (_url, init) => {
    requestBody = JSON.parse(String(init?.body));
    return Response.json({
      amount0G: "1",
      amountNeuron: "1000000",
      balanceAfter: "1000000",
      balanceBefore: "0",
      configured: true,
      credited: true,
      txHash,
      wallet,
    });
  };

  await verifyUsageDeposit({
    claimSecret: claim.claimSecret,
    reference: claim.reference,
    txHash,
    wallet: { address: wallet },
  });

  assert.equal(requestBody.claimSecret, claim.claimSecret);
  assert.equal(requestBody.reference, claim.reference);
});

test("Credits keeps the private claim off-chain and out of insecure randomness", () => {
  const page = readFileSync(
    new URL("../app/(user)/usage/page.tsx", import.meta.url),
    "utf8",
  );
  const claimModule = readFileSync(
    new URL("../lib/deposit-claim.ts", import.meta.url),
    "utf8",
  );

  assert.match(page, /args: \[depositReference as `0x\$\{string\}`/);
  assert.doesNotMatch(page, /args: \[depositClaimSecret/);
  assert.match(page, /claimSecret:\s*options\.claimSecret/);
  assert.match(page, /setClaimSecret\(depositClaimSecret\)/);
  assert.doesNotMatch(claimModule, /Math\.random/);
});
