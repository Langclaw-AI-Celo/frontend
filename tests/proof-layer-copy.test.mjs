import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const squigglyHomePath = path.join(frontendRoot, "components", "SquigglyHome.tsx");

test("home proof layer shows both the latest ERC-8004 and self-linked decision examples", () => {
  const source = readFileSync(squigglyHomePath, "utf8");

  assert.match(
    source,
    /label:\s*"ERC-8004 decision 38"[\s\S]*signal:\s*"campaign-backend-proof"/,
    "Expected the public proof layer to surface the latest ERC-8004 decision example."
  );
  assert.match(
    source,
    /label:\s*"Self-linked decision 1"[\s\S]*signal:\s*"smart-money"/,
    "Expected the public proof layer to keep the latest self-linked decision example."
  );
});
