import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const readmePath = path.join(frontendRoot, "README.md");

test("frontend README distinguishes ERC-8004 and Self-linked proof notes", () => {
  const source = readFileSync(readmePath, "utf8");

  assert.ok(
    source.includes("Latest ERC-8004 Celo decision proof:"),
    "Expected the README to label the latest public decision example as the ERC-8004 proof."
  );
  assert.ok(
    source.includes("Latest Self-linked Celo decision proof:"),
    "Expected the README to keep the separate Self-linked proof example."
  );
  assert.ok(
    source.includes("proof-readiness check now returns `ready`"),
    "Expected the README to call out the current ready state from the backend proof-readiness check."
  );
  assert.ok(
    source.includes("agent `9109`"),
    "Expected the README to name the latest ERC-8004 proof agent explicitly."
  );
  assert.ok(
    source.includes("Self Agent ID") && source.includes("`133`"),
    "Expected the README to name the preferred local Self agent explicitly."
  );
});
