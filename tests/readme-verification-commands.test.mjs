import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(testDir, "..");
const readmePath = path.join(frontendRoot, "README.md");

test("frontend README keeps the proof verification commands documented", () => {
  const source = readFileSync(readmePath, "utf8");

  for (const command of [
    "node --test tests/proof-layer-copy.test.mjs tests/home-launchpad-proof-copy.test.mjs",
    "node --test tests/proof-layer-links.test.mjs tests/readme-proof-notes.test.mjs",
    "node --test tests/readme-proof-state.test.mjs",
  ]) {
    assert.ok(
      source.includes(command),
      `Expected README.md to document verification command: ${command}`
    );
  }
});
