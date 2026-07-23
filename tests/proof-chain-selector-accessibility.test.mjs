import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const proofsPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "proofs",
  "page.tsx",
);

test("Proof Center names its standalone chain selector", () => {
  const source = readFileSync(proofsPagePath, "utf8");

  assert.match(
    source,
    /<SelectTrigger\s+aria-label="Proof chain"/,
    "Expected the Proof Center chain selector to expose an accessible name.",
  );
});
