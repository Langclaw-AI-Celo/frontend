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
  "conversation.tsx",
);

test("conversation icon controls describe scrolling and downloads", () => {
  const source = readFileSync(componentPath, "utf8");

  assert.ok(source.includes('aria-label="Scroll to latest message"'));
  assert.ok(source.includes('aria-label={`Download conversation as ${filename}`}'));
});
