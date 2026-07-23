import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const memoryTablePath = path.join(
  testDir,
  "..",
  "app",
  "(user)",
  "memory",
  "data-table.tsx",
);

test("Memory names its filter and pagination selectors", () => {
  const source = readFileSync(memoryTablePath, "utf8");
  const selectNames = [...source.matchAll(/<SelectTrigger\b([^>]*)>/g)]
    .map(([, attributes]) =>
      attributes.match(/\baria-label="([^"]+)"/)?.[1],
    )
    .filter(Boolean);

  for (const expectedName of [
    "Filter memory status",
    "Filter memory category",
    "Rows per page",
  ]) {
    assert.ok(
      selectNames.includes(expectedName),
      `Expected a Memory selector named "${expectedName}".`,
    );
  }
});
