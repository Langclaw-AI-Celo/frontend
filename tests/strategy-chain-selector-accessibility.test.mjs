import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const strategyPagePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "strategy",
  "page.tsx",
);

test("Strategy Lab names its standalone chain selector", () => {
  const source = readFileSync(strategyPagePath, "utf8");

  assert.match(
    source,
    /<SelectTrigger\s+aria-label="Strategy chain"/,
    "Expected the Strategy Lab chain selector to expose an accessible name.",
  );
});
