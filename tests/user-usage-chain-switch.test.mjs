import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const usageBarPath = path.join(
  testDir,
  "..",
  "components",
  "user-usage-bar.tsx",
);

test("usage header resolves the selected product chain before switching", () => {
  const source = readFileSync(usageBarPath, "utf8");

  assert.match(
    source,
    /const nextChain = resolveProductChain\(value\);\s+const nextChainId = nextChain\.id;/,
    "Expected the chain selector to preserve a supported Mantle selection.",
  );
  assert.doesNotMatch(
    source,
    /function parseProductChainId\(/,
    "Expected the selector to avoid a fallback parser that maps Mantle to Celo.",
  );
});
