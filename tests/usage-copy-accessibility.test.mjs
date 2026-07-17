import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const usagePagePath = path.join(testDir, "..", "app", "(user)", "usage", "page.tsx");

test("usage copy controls expose their target and completion state", () => {
  const source = readFileSync(usagePagePath, "utf8");

  assert.match(
    source,
    /aria-label=\{copied === label \? `\$\{label\} copied` : `Copy \$\{label\}`\}/,
  );
});
