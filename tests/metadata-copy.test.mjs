import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const layoutPath = path.join(frontendRoot, "app", "layout.tsx");

test("root metadata stays Celo-first", () => {
  const source = readFileSync(layoutPath, "utf8");

  assert.match(
    source,
    /Celo-first Alpha Sentinel for on-chain intelligence, smart-money monitoring, and verifiable agent decisions\./,
    "Expected the root metadata description to match the public Celo-first positioning.",
  );
  assert.ok(
    !source.includes("Multi-chain Alpha Sentinel"),
    "Expected the root metadata description to avoid stale multi-chain positioning.",
  );
});
