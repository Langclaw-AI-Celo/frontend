import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.join(
  testDir,
  "..",
  "components",
  "ai-elements",
  "code-block.tsx",
);

test("code block copy control announces action and completion", () => {
  const source = readFileSync(componentPath, "utf8");

  assert.ok(source.includes('aria-label={isCopied ? "Code copied" : "Copy code"}'));
});
