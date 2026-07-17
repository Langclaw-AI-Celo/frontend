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
  "terminal.tsx",
);

test("terminal icon controls have explicit accessible labels", () => {
  const source = readFileSync(componentPath, "utf8");

  assert.ok(source.includes('isCopied ? "Terminal output copied" : "Copy terminal output"'));
  assert.ok(source.includes('aria-label="Clear terminal output"'));
});
