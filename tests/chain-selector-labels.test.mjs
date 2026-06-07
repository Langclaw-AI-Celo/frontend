import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const chainsPath = path.join(frontendRoot, "lib/chains.ts");
const strategyPagePath = path.join(frontendRoot, "app/(user)/strategy/page.tsx");
const proofsPagePath = path.join(frontendRoot, "app/(user)/proofs/page.tsx");

test("strategy and proof selectors use the chain native gas symbol", () => {
  const chainsSource = readFileSync(chainsPath, "utf8");
  const strategySource = readFileSync(strategyPagePath, "utf8");
  const proofsSource = readFileSync(proofsPagePath, "utf8");

  assert.match(
    chainsSource,
    /nativeCurrency:\s*{[\s\S]*symbol:\s*"CELO"/,
    "Expected the Celo chain config to expose CELO as the native gas symbol.",
  );
  assert.match(
    strategySource,
    /chain\.nativeCurrency\.symbol/,
    "Expected the Strategy Lab chain selector to read the native gas symbol.",
  );
  assert.doesNotMatch(
    strategySource,
    /chain\.name} \/ {chain\.nativeSymbol/,
    "Expected the Strategy Lab selector to stop using the billing-style chain label.",
  );
  assert.match(
    proofsSource,
    /chain\.nativeCurrency\.symbol/,
    "Expected the Proof Center chain selector to read the native gas symbol.",
  );
  assert.doesNotMatch(
    proofsSource,
    /chain\.name} \/ {chain\.nativeSymbol/,
    "Expected the Proof Center selector to stop using the billing-style chain label.",
  );
});
